import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/pricing';
import { useToast } from './Toast';

export default function MenuItemCard({ item, truckId, truck }) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { items, addItem, updateQuantity } = useCart();
  const { addToast } = useToast();
  const outOfStock = !item.isAvailable || (item.quantityAvailable != null && item.quantityAvailable <= 0);
  const prepMins = item.prepTimeMinutes ?? truck?.estimatedPrepTimeMinutes;

  // Existing cart line for this item (menuItemId + truckId)
  const cartItem = items.find(
    (i) => i.menuItemId === item.id && i.truckId === truckId
  );
  const maxQty = item.quantityAvailable != null ? item.quantityAvailable : Number.MAX_SAFE_INTEGER;
  const isAtMax = cartItem ? cartItem.quantity >= maxQty : false;

  const handleAddToCart = () => {
    // Guests must sign in before adding items to the cart
    if (!token) {
      addToast('Sign in to add items to your cart', 'warning');
      navigate('/login', { state: { from: 'cart' } });
      return;
    }
    addItem(item, truckId, 1, truck?.name);
    addToast(`${item.name} added to cart`, 'success');
  };

  const handleDecrease = () => {
    updateQuantity(cartItem.cartItemId, cartItem.quantity - 1);
  };

  const handleIncrease = () => {
    if (isAtMax) return;
    updateQuantity(cartItem.cartItemId, cartItem.quantity + 1);
  };

  return (
    <div className="card card-hover p-0 flex flex-col overflow-hidden group">
      {/* Optional food image */}
      {item.imageUrl && (
        <div className="relative h-36 overflow-hidden">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover rounded-image group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col">
        {/* Header row: name + price */}
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-lg font-heading font-semibold text-ink group-hover:text-primary transition-colors">
            {item.name}
          </h3>
          <span className="text-lg font-heading font-bold text-primary whitespace-nowrap">
            {formatINR(item.price)}
          </span>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap items-center gap-2 mt-2.5">
          {item.category && (
            <span className="badge badge-sage">
              {item.category}
            </span>
          )}
          {prepMins != null && (
            <span className="badge bg-cream text-body/80">
              <Clock className="h-3 w-3" strokeWidth={2.2} />
              ~{prepMins} min
            </span>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-body mt-2.5 line-clamp-2 flex-1">
            {item.description}
          </p>
        )}

        {/* Quantity info */}
        {item.quantityAvailable != null && (
          <p className={`text-xs mt-2 ${item.quantityAvailable > 0 ? 'text-body/70' : 'text-error font-medium'}`}>
            {item.quantityAvailable > 0
              ? `${item.quantityAvailable} available`
              : 'Out of stock'}
          </p>
        )}

        {/* Add to Cart / quantity stepper */}
        <div className="mt-4 pt-4 border-t border-line">
          {outOfStock ? (
            <span className="block w-full text-center h-[46px] leading-[46px] rounded-full text-sm font-heading font-semibold bg-line/60 text-body/70 cursor-not-allowed">
              {item.isAvailable === false ? 'Unavailable' : 'Out of Stock'}
            </span>
          ) : cartItem ? (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleDecrease}
                aria-label={`Decrease quantity of ${item.name}`}
                title="Decrease quantity"
                className="w-11 h-11 rounded-full border border-line flex items-center justify-center text-body hover:bg-primary hover:text-white hover:border-primary active:scale-[1.03] transition-all text-xl font-medium"
              >
                −
              </button>
              <div className="text-center min-w-[44px]">
                <span className="block font-heading font-bold text-ink text-lg leading-none">
                  {cartItem.quantity}
                </span>
                <span className="block text-[10px] uppercase tracking-wider text-body/60 mt-1">
                  in cart
                </span>
              </div>
              <button
                onClick={handleIncrease}
                disabled={isAtMax}
                aria-label={`Increase quantity of ${item.name}`}
                title={isAtMax ? 'No more in stock' : 'Increase quantity'}
                className="w-11 h-11 rounded-full border border-line flex items-center justify-center text-body hover:bg-primary hover:text-white hover:border-primary active:scale-[1.03] transition-all text-xl font-medium disabled:opacity-40 disabled:pointer-events-none"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              className="btn btn-primary btn-sm btn-block"
            >
              Add to Cart +
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
