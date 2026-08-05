import { useCallback, useEffect, useRef, useState } from 'react';
import { getAllUsersAdmin } from '../api/authApi';
import { getAllTrucksAdmin } from '../api/truckApi';
import { getAllOrdersAdmin } from '../api/orderApi';

/**
 * Loads the three admin datasets (users, trucks, orders) and keeps them
 * fresh via optional polling. All values come from real backend endpoints.
 */
export default function useAdminData(refreshMs = 60000) {
  const [users, setUsers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const inFlightRef = useRef(false);

  const load = useCallback(async (silent = false) => {
    if (inFlightRef.current) return; // skip overlapping polls
    inFlightRef.current = true;
    if (!silent) setLoading(true);
    const [u, t, o] = await Promise.allSettled([
      getAllUsersAdmin(),
      getAllTrucksAdmin(),
      getAllOrdersAdmin(),
    ]);
    if (u.status === 'fulfilled' && Array.isArray(u.value?.data)) setUsers(u.value.data);
    if (t.status === 'fulfilled' && Array.isArray(t.value?.data)) setTrucks(t.value.data);
    if (o.status === 'fulfilled' && Array.isArray(o.value?.data)) setOrders(o.value.data);
    setLastUpdated(new Date());
    setLoading(false);
    inFlightRef.current = false;
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!refreshMs) return undefined;
    const id = setInterval(() => load(true), refreshMs);
    return () => clearInterval(id);
  }, [refreshMs, load]);

  const patchUsers = useCallback((updater) => setUsers(updater), []);
  const addTruck = useCallback((truck) => setTrucks((prev) => [truck, ...prev]), []);

  return { users, trucks, orders, loading, lastUpdated, refresh: () => load(true), patchUsers, addTruck };
}
