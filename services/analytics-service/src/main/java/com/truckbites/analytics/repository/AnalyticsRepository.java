package com.truckbites.analytics.repository;

import com.truckbites.analytics.dto.DailySalesResponse;
import com.truckbites.analytics.dto.OrderStatusSummaryResponse;
import com.truckbites.analytics.dto.TopSellingItemResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository executing read-only native SQL aggregation queries against order_db.
 *
 * CRITICAL: This service NEVER writes to the database. All queries are read-only
 * aggregation queries using JDBC directly (not JPA entity management) to make
 * the read-only intent explicit and prevent accidental writes.
 */
@Repository
public class AnalyticsRepository {

    private final JdbcTemplate jdbcTemplate;

    public AnalyticsRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Returns daily total sales for a specific truck, excluding CANCELLED orders.
     */
    public List<DailySalesResponse> findDailySales(Long truckId) {
        String sql = """
                SELECT DATE(o.created_at) AS date, SUM(o.total_amount) AS total_sales
                FROM order_db.orders o
                WHERE o.truck_id = ? AND o.status != 'CANCELLED'
                GROUP BY DATE(o.created_at)
                ORDER BY date DESC
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                DailySalesResponse.builder()
                        .date(rs.getDate("date").toLocalDate())
                        .totalSales(rs.getBigDecimal("total_sales"))
                        .build(),
                truckId);
    }

    /**
     * Returns top-selling menu items for a specific truck by quantity sold,
     * excluding CANCELLED orders. Limited to top 10 items.
     */
    public List<TopSellingItemResponse> findTopSellingItems(Long truckId) {
        String sql = """
                SELECT oi.item_name, SUM(oi.quantity) AS total_quantity,
                       SUM(oi.price * oi.quantity) AS total_revenue
                FROM order_db.order_items oi
                JOIN order_db.orders o ON o.id = oi.order_id
                WHERE o.truck_id = ? AND o.status != 'CANCELLED'
                GROUP BY oi.item_name
                ORDER BY total_quantity DESC
                LIMIT 10
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                TopSellingItemResponse.builder()
                        .itemName(rs.getString("item_name"))
                        .totalQuantity(rs.getLong("total_quantity"))
                        .totalRevenue(rs.getBigDecimal("total_revenue"))
                        .build(),
                truckId);
    }

    /**
     * Returns order counts grouped by status for a specific truck.
     */
    public List<OrderStatusSummaryResponse> findOrderCountByStatus(Long truckId) {
        String sql = """
                SELECT o.status, COUNT(*) AS count
                FROM order_db.orders o
                WHERE o.truck_id = ?
                GROUP BY o.status
                ORDER BY o.status
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                OrderStatusSummaryResponse.builder()
                        .status(rs.getString("status"))
                        .count(rs.getLong("count"))
                        .build(),
                truckId);
    }
}
