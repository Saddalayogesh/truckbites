import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/Toast';
import { showConfirm } from '../utils/confirm';

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

export default function Cart() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { items, itemsByTruck, removeItem, updateQuantity, clearCart, total, itemCount, truckIds } = useCart();

  const handleClearCart = async () => {
    const confirmed = await showConfirm({
      title: 'Clear your cart?',
      text: 'All items in your cart will be removed.',
      confirmText: 'Yes, Clear Cart',
      danger: true,
    });
    if (!confirmed) return;
    clearCart();
    addToast('Cart cleared', 'info');
  };

  const handleRemoveItem = (cartItemId, name) => {
    removeItem(cartItemId);
    addToast(`${name} removed from cart`, 'info');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <span className="w-20 h-20 rounded-full bg-sage/20 text-primary flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="h-9 w-9" strokeWidth={1.6} />
          </span>
          <h1 className="text-3xl font-heading font-bold text-ink mb-3">Your Cart is Empty</h1>
          <p className="text-body mb-8 text-lg">Add some delicious food truck items to get started!</p>
          <Link
            to="/discover"
            className="btn btn-primary"
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
        <div>
          <span className="section-eyebrow">Almost there</span>
          <h1 className="text-3xl font-heading font-bold text-ink mt-1">Your Cart</h1>
        </div>
        <button
          onClick={handleClearCart}
          className="text-sm text-error hover:text-error/80 font-medium transition-colors px-4 py-2 rounded-full hover:bg-error/10"
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
            <div key={truckId} className="card p-0 overflow-hidden">
              <div className="bg-primary px-6 py-4 flex items-center gap-3">
                <span className="h-9 w-9 rounded-full bg-white/15 text-white flex items-center justify-center">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 16V9a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7" />
                    <path d="M14 12h4l2 3v1a1 1 0 0 1-1 1h-1" />
                    <circle cx="7.5" cy="16.5" r="1.8" />
                    <circle cx="17.5" cy="16.5" r="1.8" />
                  </svg>
                </span>
                <h2 className="text-white font-heading font-semibold text-lg">Truck #{truckId}</h2>
              </div>
              <div className="divide-y divide-line">
                {truckItems.map((cartItem) => (
                  <div
                    key={cartItem.cartItemId}
                    className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 sm:p-5 hover:bg-cream transition-colors"
                  >
                    {/* Item info */}
                    <div className="flex-1 min-w-[150px]">
                      <p className="font-medium text-ink truncate">{cartItem.name}</p>
                      <p className="text-sm text-body/80 mt-0.5">{formatPrice(cartItem.price)} each</p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(cartItem.cartItemId, cartItem.quantity - 1)}
                        className="w-9 h-9 rounded-full border border-line flex items-center justify-center text-body hover:bg-primary hover:text-white hover:border-primary active:scale-[1.03] transition-all text-lg font-medium"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-10 text-center font-heading font-semibold text-ink">
                        {cartItem.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(cartItem.cartItemId, cartItem.quantity + 1)}
                        className="w-9 h-9 rounded-full border border-line flex items-center justify-center text-body hover:bg-primary hover:text-white hover:border-primary active:scale-[1.03] transition-all text-lg font-medium"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    {/* Line total */}
                    <div className="text-right w-24 ml-auto sm:ml-0">
                      <p className="font-heading font-semibold text-ink">
                        {formatPrice(cartItem.price * cartItem.quantity)}
                      </p>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => handleRemoveItem(cartItem.cartItemId, cartItem.name)}
                      className="text-body/50 hover:text-error transition-colors p-1.5 rounded-full hover:bg-error/10"
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
      <div className="card p-6 lg:p-8 sticky bottom-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-body">Items ({itemCount})</span>
          <span className="text-ink font-medium">{formatPrice(total)}</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-body">Delivery Fee</span>
          <span className="text-success font-medium">Free</span>
        </div>
        <div className="flex items-center justify-between mb-6">
          <span className="text-body">Tax</span>
          <span className="text-success font-medium">Included</span>
        </div>
        <div className="border-t border-line pt-4 flex items-center justify-between mb-6">
          <span className="text-xl font-heading font-bold text-ink">Total</span>
          <span className="text-xl font-heading font-bold text-primary">{formatPrice(total)}</span>
        </div>
        <button
          onClick={() => navigate('/checkout')}
          className="btn btn-primary btn-block"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
