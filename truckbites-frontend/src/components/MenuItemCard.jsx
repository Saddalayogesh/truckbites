const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

export default function MenuItemCard({ item }) {
  const outOfStock = !item.isAvailable || (item.quantityAvailable != null && item.quantityAvailable <= 0);

  const handleAddToCart = () => {};

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-orange-200 overflow-hidden group">
      <div className="p-5">
        {/* Header row: name + price */}
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-lg font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
            {item.name}
          </h3>
          <span className="text-lg font-bold text-orange-600 whitespace-nowrap">
            {formatPrice(item.price)}
          </span>
        </div>

        {/* Category badge */}
        {item.category && (
          <span className="inline-block mt-2 text-xs font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
            {item.category}
          </span>
        )}

        {/* Description */}
        {item.description && (
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Quantity info */}
        {item.quantityAvailable != null && (
          <p className="text-xs text-gray-400 mt-2">
            {item.quantityAvailable > 0
              ? `${item.quantityAvailable} available`
              : 'Out of stock'}
          </p>
        )}
      </div>

      {/* Add to Cart button */}
      <div className="px-5 pb-5">
        {outOfStock ? (
          <span className="block w-full text-center py-2.5 rounded-lg text-sm font-semibold bg-gray-100 text-gray-400 cursor-not-allowed">
            {item.isAvailable === false ? 'Unavailable' : 'Out of Stock'}
          </span>
        ) : (
          <button
            onClick={handleAddToCart}
            className="w-full py-2.5 rounded-lg text-sm font-semibold bg-orange-600 text-white hover:bg-orange-700 active:scale-[0.98] transition-all duration-200 shadow-sm"
          >
            Add to Cart +
          </button>
        )}
      </div>
    </div>
  );
}
