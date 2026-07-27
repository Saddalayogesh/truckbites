import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

export default function Cart() {
  const navigate = useNavigate();
  const { items, itemsByTruck, removeItem, updateQuantity, clearCart, total, itemCount, truckIds } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <span className="text-7xl block mb-6">🛒</span>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Your Cart is Empty</h1>
          <p className="text-gray-500 mb-8 text-lg">Add some delicious food truck items to get started!</p>
          <Link
            to="/trucks"
            className="inline-block bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-all duration-200 shadow-sm"
          >
            Discover Trucks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh]">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Your Cart</h1>
        <button
          onClick={clearCart}
          className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-red-50"
        >
          Clear Cart
        </button>
      </div>

      {/* Items grouped by truck */}
      <div className="space-y-6 mb-8">
        {truckIds.map((truckId) => {
          const truckItems = itemsByTruck[truckId];
          if (!truckItems || truckItems.length === 0) return null;

          return (
            <div key={truckId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-400 to-orange-500 px-6 py-3">
                <h2 className="text-white font-semibold text-lg">Truck #{truckId}</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {truckItems.map((cartItem) => (
                  <div
                    key={cartItem.cartItemId}
                    className="flex items-center gap-4 p-4 hover:bg-orange-50/30 transition-colors"
                  >
                    {/* Item info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{cartItem.name}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{formatPrice(cartItem.price)} each</p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(cartItem.cartItemId, cartItem.quantity - 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:border-orange-400 transition-all text-lg font-medium"
                      >
                        −
                      </button>
                      <span className="w-10 text-center font-semibold text-gray-800">
                        {cartItem.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(cartItem.cartItemId, cartItem.quantity + 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:border-orange-400 transition-all text-lg font-medium"
                      >
                        +
                      </button>
                    </div>

                    {/* Line total */}
                    <div className="text-right w-24">
                      <p className="font-semibold text-gray-800">
                        {formatPrice(cartItem.price * cartItem.quantity)}
                      </p>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(cartItem.cartItemId)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Remove item"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky bottom-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-600">Items ({itemCount})</span>
          <span className="text-gray-800">{formatPrice(total)}</span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-600">Delivery Fee</span>
          <span className="text-green-600 font-medium">Free</span>
        </div>
        <div className="border-t border-gray-200 pt-4 flex items-center justify-between mb-6">
          <span className="text-xl font-bold text-gray-800">Total</span>
          <span className="text-xl font-bold text-orange-600">{formatPrice(total)}</span>
        </div>
        <button
          onClick={() => navigate('/checkout')}
          className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-semibold text-lg hover:bg-orange-700 active:scale-[0.98] transition-all duration-200 shadow-sm"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
