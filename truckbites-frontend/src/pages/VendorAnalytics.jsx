import { useState, useEffect } from 'react';
import { getMyTrucks } from '../api/truckApi';
import { getDailySales, getTopSellingItems, getOrderSummary } from '../api/analyticsApi';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function VendorAnalytics() {
  const { addToast } = useToast();
  const [trucks, setTrucks] = useState([]);
  const [selectedTruckId, setSelectedTruckId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dailySales, setDailySales] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [orderSummary, setOrderSummary] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMyTrucks()
      .then((res) => {
        if (!cancelled) {
          setTrucks(res.data || []);
          if (res.data?.length > 0) setSelectedTruckId(res.data[0].id);
        }
      })
      .catch(() => addToast('Failed to load trucks', 'error'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedTruckId) return;
    setSalesLoading(true);
    setItemsLoading(true);

    getDailySales(selectedTruckId)
      .then((res) => {
        var data = (res.data || []).slice(0, 7).reverse();
        setDailySales(data);
      })
      .catch(() => addToast('Failed to load sales data', 'error'))
      .finally(() => setSalesLoading(false));

    getTopSellingItems(selectedTruckId)
      .then((res) => setTopItems(res.data || []))
      .catch(() => addToast('Failed to load top items', 'error'))
      .finally(() => setItemsLoading(false));

    getOrderSummary(selectedTruckId)
      .then((res) => setOrderSummary(res.data || []))
      .catch(() => {});
  }, [selectedTruckId]);

  var selectedTruck = trucks.find(function(t) { return t.id === selectedTruckId; });

  var chartData = dailySales.map(function(d) {
    var date = new Date(d.date);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sales: parseFloat(d.totalSales) || 0,
    };
  });

  var barData = topItems.map(function(item, idx) {
    return {
      name: item.itemName && item.itemName.length > 15 ? item.itemName.substring(0, 15) + '...' : item.itemName,
      quantity: item.totalQuantity || 0,
      revenue: parseFloat(item.totalRevenue) || 0,
    };
  });

  var totalRevenue = dailySales.reduce(function(sum, d) { return sum + (parseFloat(d.totalSales) || 0); }, 0);
  var totalOrders = orderSummary.reduce(function(sum, s) { return sum + (s.count || 0); }, 0);
  var completedOrders = orderSummary.filter(function(s) { return s.status === 'COMPLETED'; }).reduce(function(sum, s) { return sum + (s.count || 0); }, 0);

  return (
    <div className="min-h-[80vh]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Vendor Analytics</h1>
        {trucks.length > 1 && (
          <select
            value={selectedTruckId || ''}
            onChange={(e) => setSelectedTruckId(parseInt(e.target.value))}
            className="w-64 py-2.5 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none"
          >
            {trucks.map(function(t) { return <option key={t.id} value={t.id}>{t.name}</option>; })}
          </select>
        )}
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-20" text="Loading analytics..." />
      ) : !selectedTruck ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <span className="text-5xl">&#x1F69A;</span>
          <p className="text-gray-500 mt-4">You don't have any food trucks yet.</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <p className="text-sm text-gray-500 font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{totalOrders}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <p className="text-sm text-gray-500 font-medium">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{completedOrders}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales line chart */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Sales (Last 7 Days)</h2>
              {salesLoading ? (
                <LoadingSpinner size="md" className="py-12" />
              ) : chartData.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No sales data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" tickFormatter={(v) => '$' + v} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
                      formatter={(value) => ['$' + Number(value).toFixed(2), 'Sales']}
                    />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#f97316' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top items bar chart */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Selling Items</h2>
              {itemsLoading ? (
                <LoadingSpinner size="md" className="py-12" />
              ) : barData.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No items sold yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
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

          {/* Order summary */}
          {orderSummary.length > 0 && (
            <div className="mt-6 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Status Summary</h2>
              <div className="flex flex-wrap gap-4">
                {orderSummary.map(function(s) {
                  return (
                    <div key={s.status} className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-lg">
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
