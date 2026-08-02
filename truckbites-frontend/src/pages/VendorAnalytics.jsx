import { useState, useEffect } from 'react';
import { getMyTrucks } from '../api/truckApi';
import { getDailySales, getTopSellingItems, getOrderSummary } from '../api/analyticsApi';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

function formatDate(dateStr) {
  var date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function downloadCSV(filename, headers, rows) {
  var csvContent = headers.join(',') + '\n';
  rows.forEach(function(row) {
    csvContent += row.join(',') + '\n';
  });
  var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function VendorAnalytics() {
  var _a = useToast(), addToast = _a.addToast;
  var _b = useState([]), trucks = _b[0], setTrucks = _b[1];
  var _c = useState(null), selectedTruckId = _c[0], setSelectedTruckId = _c[1];
  var _d = useState(true), loading = _d[0], setLoading = _d[1];
  var _e = useState([]), dailySales = _e[0], setDailySales = _e[1];
  var _f = useState([]), topItems = _f[0], setTopItems = _f[1];
  var _g = useState([]), orderSummary = _g[0], setOrderSummary = _g[1];
  var _h = useState(false), salesLoading = _h[0], setSalesLoading = _h[1];
  var _i = useState(false), itemsLoading = _i[0], setItemsLoading = _i[1];

  useEffect(function() {
    var cancelled = false;
    getMyTrucks()
      .then(function(res) {
        if (!cancelled) {
          setTrucks(res.data || []);
          if (res.data && res.data.length > 0) setSelectedTruckId(res.data[0].id);
        }
      })
      .catch(function() { addToast('Failed to load trucks', 'error'); })
      .finally(function() { if (!cancelled) setLoading(false); });
    return function() { cancelled = true; };
  }, []);

  useEffect(function() {
    if (!selectedTruckId) return;
    setSalesLoading(true);
    setItemsLoading(true);

    getDailySales(selectedTruckId)
      .then(function(res) {
        var data = (res.data || []).slice(0, 7).reverse();
        setDailySales(data);
      })
      .catch(function() { addToast('Failed to load sales data', 'error'); })
      .finally(function() { setSalesLoading(false); });

    getTopSellingItems(selectedTruckId)
      .then(function(res) { setTopItems(res.data || []); })
      .catch(function() { addToast('Failed to load top items', 'error'); })
      .finally(function() { setItemsLoading(false); });

    getOrderSummary(selectedTruckId)
      .then(function(res) { setOrderSummary(res.data || []); })
      .catch(function() {});
  }, [selectedTruckId]);

  var selectedTruck = trucks.find(function(t) { return t.id === selectedTruckId; });

  var chartData = dailySales.map(function(d) {
    return {
      date: formatDate(d.date),
      sales: parseFloat(d.totalSales) || 0,
    };
  });

  var barData = topItems.map(function(item) {
    return {
      name: item.itemName && item.itemName.length > 15 ? item.itemName.substring(0, 15) + '...' : item.itemName,
      quantity: item.totalQuantity || 0,
      revenue: parseFloat(item.totalRevenue) || 0,
    };
  });

  var totalRevenue = dailySales.reduce(function(sum, d) { return sum + (parseFloat(d.totalSales) || 0); }, 0);
  var totalOrders = orderSummary.reduce(function(sum, s) { return sum + (s.count || 0); }, 0);
  var completedOrders = orderSummary.filter(function(s) { return s.status === 'COMPLETED'; }).reduce(function(sum, s) { return sum + (s.count || 0); }, 0);

  function handleDownloadCSV() {
    var salesRows = dailySales.map(function(d) {
      return [
        formatDate(d.date),
        parseFloat(d.totalSales || 0).toFixed(2),
        d.orderCount || 0,
        d.itemCount || 0,
      ];
    });

    var itemRows = topItems.map(function(item) {
      return [
        item.itemName || 'Unknown',
        item.totalQuantity || 0,
        parseFloat(item.totalRevenue || 0).toFixed(2),
      ];
    });

    var summaryRows = orderSummary.map(function(s) {
      return [s.status, s.count || 0];
    });

    // Combine into one report
    var allRows = [];
    allRows.push(['=== Daily Sales Report ===']);
    allRows.push(['Date', 'Revenue', 'Orders', 'Items Sold']);
    salesRows.forEach(function(r) { allRows.push(r); });
    allRows.push([]);
    allRows.push(['=== Top Selling Items ===']);
    allRows.push(['Item', 'Qty Sold', 'Revenue']);
    itemRows.forEach(function(r) { allRows.push(r); });
    allRows.push([]);
    allRows.push(['=== Order Summary ===']);
    allRows.push(['Status', 'Count']);
    summaryRows.forEach(function(r) { allRows.push(r); });
    allRows.push([]);
    allRows.push(['Total Revenue', totalRevenue.toFixed(2)]);
    allRows.push(['Total Orders', totalOrders]);
    allRows.push(['Completed Orders', completedOrders]);

    var csvContent = allRows.map(function(row) {
      return row.map(function(cell) {
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
          return '"' + cell.replace(/"/g, '""') + '"';
        }
        return cell;
      }).join(',');
    }).join('\n');

    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    var truckName = (selectedTruck ? selectedTruck.name : 'truck').replace(/\s+/g, '_');
    link.href = URL.createObjectURL(blob);
    link.download = 'TruckBites_Report_' + truckName + '_' + new Date().toISOString().slice(0, 10) + '.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    addToast('Report downloaded!', 'success');
  }

  return (
    <div className="min-h-[80vh]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Vendor Analytics</h1>
        <div className="flex items-center gap-3">
          {selectedTruck && (
            <>
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download CSV
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print / PDF
              </button>
            </>
          )}
          {trucks.length > 1 && (
            <select
              value={selectedTruckId || ''}
              onChange={function(e) { setSelectedTruckId(parseInt(e.target.value)); }}
              className="w-full sm:w-56 py-2.5 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none"
            >
              {trucks.map(function(t) { return <option key={t.id} value={t.id}>{t.name}</option>; })}
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-20" text="Loading analytics..." />
      ) : !selectedTruck ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <span className="text-5xl">{'🚚'}</span>
          <p className="text-gray-500 mt-4">You don't have any food trucks yet.</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Total Revenue</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Total Orders</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">{totalOrders}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Completed</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">{completedOrders}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Daily Sales (Last 7 Days)</h2>
              {salesLoading ? (
                <LoadingSpinner size="md" className="py-12" />
              ) : chartData.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No sales data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" tickFormatter={(v) => '$' + v} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                      formatter={(value) => ['$' + Number(value).toFixed(2), 'Sales']}
                    />
                    <Line type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#f97316' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Top Selling Items</h2>
              {itemsLoading ? (
                <LoadingSpinner size="md" className="py-12" />
              ) : barData.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No items sold yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#9CA3AF" width={120} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                      formatter={(value, name) => [value, name === 'quantity' ? 'Qty Sold' : 'Revenue']}
                    />
                    <Bar dataKey="quantity" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {orderSummary.length > 0 && (
            <div className="mt-6 bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Order Status Summary</h2>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                {orderSummary.map(function(s) {
                  return (
                    <div key={s.status} className="flex items-center gap-2 sm:gap-3 bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 rounded-lg">
                      <span className={'px-2 py-0.5 rounded-full text-xs font-medium ' + (
                        s.status === 'PLACED' ? 'bg-blue-100 text-blue-700' :
                        s.status === 'PREPARING' ? 'bg-yellow-100 text-yellow-700' :
                        s.status === 'READY' ? 'bg-green-100 text-green-700' :
                        s.status === 'COMPLETED' ? 'bg-gray-100 text-gray-600' :
                        'bg-red-100 text-red-700'
                      )}>
                        {s.status}
                      </span>
                      <span className="font-semibold text-gray-800">{s.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
