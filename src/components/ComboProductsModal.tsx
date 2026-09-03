import React, { useState, useMemo } from 'react';
import { X, Search, PackageCheck, ShoppingCart, Sparkles, CheckCircle2, ListOrdered, Copy, Check } from 'lucide-react';
import { Product } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { useSiteSettings, getDiscountPrice } from '@/context/SiteSettingsContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ComboProductsModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export const ComboProductsModal: React.FC<ComboProductsModalProps> = ({
  product,
  isOpen,
  onClose
}) => {
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const { addToCart, items, updateQuantity } = useCart();
  const { settings } = useSiteSettings();

  const comboItems = product?.comboProducts || [];
  const productId = String(product?._id || product?.id || '');
  const cartItem = items.find(i => i && i.product && String(i.product._id || i.product.id || '') === productId);
  const quantityInCart = cartItem?.quantity || 0;

  const discountPrice = product ? getDiscountPrice(
    product.price,
    product.hasDiscount,
    settings.discountPercent,
    product.netRate,
    product.displayNetRate
  ) : 0;

  const stockVal = product?.storeStockPieces !== undefined
    ? Number(product.storeStockPieces)
    : (product?.stock !== undefined ? Number(product.stock) : 999);
  const isOutOfStock = stockVal <= 0;

  const filteredItems = useMemo(() => {
    if (!search.trim()) return comboItems;
    const q = search.toLowerCase();
    return comboItems.filter(item =>
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.quantity && item.quantity.toLowerCase().includes(q))
    );
  }, [comboItems, search]);

  if (!isOpen || !product) return null;

  const handleCopyList = () => {
    if (comboItems.length === 0) return;
    const text = [
      `🎁 ${product.name} - Included Items List (${comboItems.length} Products):`,
      ...comboItems.map((item, idx) => `${idx + 1}. ${item.name} ${item.quantity ? `(${item.quantity})` : ''}`)
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Combo items list copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    if (quantityInCart === 0) {
      addToCart(product, 1);
      toast.success(`${product.name} added to cart!`);
    } else {
      updateQuantity(productId, quantityInCart + 1);
      toast.success(`Updated ${product.name} quantity in cart!`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-amber-200/80 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#7A0000] via-[#A80000] to-[#600000] text-white p-4 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/15 hover:bg-white/30 text-white rounded-full p-2 transition-colors cursor-pointer border border-white/20"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-950 text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
              <Sparkles className="w-3 h-3 fill-amber-950" />
              Combo Pack Special
            </span>
            <span className="inline-flex items-center gap-1 bg-white/20 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-white/20">
              <PackageCheck className="w-3.5 h-3.5 text-amber-300" />
              {comboItems.length} Products Included
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight pr-8">
            {product.name}
          </h2>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-amber-300">₹{discountPrice.toLocaleString('en-IN')}</span>
            {product.hasDiscount && product.price > discountPrice && (
              <span className="text-sm text-red-200 line-through font-medium">₹{product.price.toLocaleString('en-IN')}</span>
            )}
            {product.quantity && (
              <span className="text-xs bg-black/30 text-amber-200 px-2 py-0.5 rounded-md font-bold ml-1">
                {product.quantity}
              </span>
            )}
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-3 sm:p-4 bg-amber-50/60 border-b border-amber-100 flex flex-col sm:flex-row gap-2 items-center justify-between">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items in this combo pack..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {comboItems.length > 0 && (
            <button
              onClick={handleCopyList}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-red-700 bg-white border border-gray-300 hover:border-red-300 px-3 py-2 rounded-xl transition-colors shadow-2xs whitespace-nowrap cursor-pointer shrink-0 self-end sm:self-auto"
              title="Copy list of items to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
              <span>{copied ? 'Copied!' : 'Copy List'}</span>
            </button>
          )}
        </div>

        {/* Product Items List Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 divide-y divide-gray-100">
          {comboItems.length === 0 ? (
            <div className="text-center py-12 px-4">
              <ListOrdered className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-bold text-base">No items list added yet for this combo pack.</p>
              <p className="text-gray-400 text-xs mt-1">Detailed list of products will be updated soon by Sai Yogi.</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-10 px-4">
              <Search className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600 font-bold text-sm">No items matching "{search}"</p>
              <button
                onClick={() => setSearch('')}
                className="text-xs text-red-600 hover:underline font-bold mt-2 cursor-pointer"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-gray-50/70 hover:bg-amber-50/50 border border-gray-100 hover:border-amber-200 transition-colors"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 pr-2">
                    <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-100/80 text-[#A80000] font-black text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-gray-900 text-xs sm:text-sm block truncate" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                  </div>

                  {item.quantity ? (
                    <span className="inline-flex items-center gap-1 bg-white text-[#A80000] border border-red-200 font-black text-[11px] sm:text-xs px-2.5 py-1 rounded-lg shrink-0 shadow-2xs">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      {item.quantity}
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-400 font-medium">1 Pkt</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-500 font-medium text-center sm:text-left">
            Showing <strong className="text-gray-800">{filteredItems.length}</strong> of <strong className="text-gray-800">{comboItems.length}</strong> items in this pack
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 sm:flex-none border-gray-300 text-gray-700 text-xs font-bold rounded-xl"
            >
              Close
            </Button>
            <Button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-1 sm:flex-none bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black text-xs sm:text-sm px-5 py-2 rounded-xl shadow-md gap-1.5"
            >
              <ShoppingCart className="w-4 h-4" />
              {isOutOfStock ? 'Out of Stock' : (quantityInCart > 0 ? `In Cart (${quantityInCart}) + Add More` : 'Add Pack to Cart')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComboProductsModal;
