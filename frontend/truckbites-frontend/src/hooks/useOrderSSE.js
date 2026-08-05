import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for Server-Sent Events (SSE) to receive real-time order updates.
 * @param {string} endpoint - The SSE endpoint URL (e.g., /api/orders/events/vendor/123)
 * @param {object} callbacks - { onNewOrder, onOrderUpdate, onStatusChange }
 * @param {boolean} enabled - Whether to connect
 */
export default function useOrderSSE(endpoint, callbacks = {}, enabled = true) {
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (!endpoint || !enabled) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const token = localStorage.getItem('token');

    // SSE doesn't support custom headers, so append token as query param
    const url = `${baseUrl}${endpoint}?token=${encodeURIComponent(token || '')}`;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener('connected', () => {
      console.info('[SSE] Connected to', endpoint);
    });

    es.addEventListener('new_order', (event) => {
      try {
        const data = JSON.parse(event.data);
        callbacks.onNewOrder?.(data);
      } catch (e) {
        console.error('[SSE] Failed to parse new_order event', e);
      }
    });

    es.addEventListener('order_update', (event) => {
      try {
        const data = JSON.parse(event.data);
        callbacks.onOrderUpdate?.(data);
      } catch (e) {
        console.error('[SSE] Failed to parse order_update event', e);
      }
    });

    es.addEventListener('status_change', (event) => {
      try {
        const data = JSON.parse(event.data);
        callbacks.onStatusChange?.(data);
      } catch (e) {
        console.error('[SSE] Failed to parse status_change event', e);
      }
    });

    es.onerror = () => {
      console.warn('[SSE] Connection error, will reconnect in 5s');
      es.close();
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };

    return es;
  }, [endpoint, enabled, callbacks]);

  useEffect(() => {
    const es = connect();
    return () => {
      if (es) es.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);
}
