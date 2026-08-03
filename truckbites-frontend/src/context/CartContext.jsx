import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import logger from '../utils/logger';

const COMPONENT = 'CartContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem('cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  /** Add an item or increment quantity if already in cart (by menuItemId + truckId) */
  const addItem = useCallback(
    (menuItem, truckId, quantity = 1, truckName) => {
      setItems((prev) => {
        const existingIndex = prev.findIndex(
          (i) => i.menuItemId === menuItem.id && i.truckId === truckId
        );

        let newItems;
        if (existingIndex >= 0) {
          newItems = [...prev];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + quantity,
            // Backfill the truck name on legacy cart entries that lack it
            ...(truckName && !newItems[existingIndex].truckName ? { truckName } : {}),
          };
        } else {
          newItems = [
            ...prev,
            {
              cartItemId: `${truckId}-${menuItem.id}-${Date.now()}`,
              menuItemId: menuItem.id,
              truckId,
              truckName,
              name: menuItem.name,
              price: menuItem.price,
              quantity,
            },
          ];
        }

        localStorage.setItem('cart', JSON.stringify(newItems));
        logger.info(COMPONENT, 'Item added to cart', {
          name: menuItem.name,
          quantity,
          cartSize: newItems.length,
        });
        return newItems;
      });
    },
    []
  );

  /** Remove a specific item by its cartItemId */
  const removeItem = useCallback(
    (cartItemId) => {
      setItems((prev) => {
        const newItems = prev.filter((i) => i.cartItemId !== cartItemId);
        localStorage.setItem('cart', JSON.stringify(newItems));
        logger.info(COMPONENT, 'Item removed from cart', { cartItemId });
        return newItems;
      });
    },
    []
  );

  /** Update the quantity of a specific item */
  const updateQuantity = useCallback(
    (cartItemId, quantity) => {
      if (quantity <= 0) {
        removeItem(cartItemId);
        return;
      }
      setItems((prev) => {
        const newItems = prev.map((i) =>
          i.cartItemId === cartItemId ? { ...i, quantity } : i
        );
        localStorage.setItem('cart', JSON.stringify(newItems));
        return newItems;
      });
    },
    [removeItem]
  );

  /** Clear all cart items */
  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem('cart');
    logger.info(COMPONENT, 'Cart cleared');
  }, []);

  /** Group items by truck for checkout */
  const itemsByTruck = useMemo(() => {
    const grouped = {};
    items.forEach((item) => {
      if (!grouped[item.truckId]) {
        grouped[item.truckId] = [];
      }
      grouped[item.truckId].push(item);
    });
    return grouped;
  }, [items]);

  /** Compute subtotal */
  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  /** Total number of items (sum of quantities) */
  const itemCount = useMemo(() => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

  /** Get all unique truck IDs in the cart */
  const truckIds = useMemo(() => {
    return [...new Set(items.map((i) => i.truckId))];
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      itemsByTruck,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      total,
      itemCount,
      truckIds,
    }),
    [items, itemsByTruck, addItem, removeItem, updateQuantity, clearCart, total, itemCount, truckIds]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
