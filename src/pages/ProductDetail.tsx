import { useParams, Link } from "react-router-dom";
import { ShoppingCart, ArrowLeft, Minus, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getProductById, getProducts } from "@/lib/api";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useSiteSettings, getDiscountPrice } from "@/context/SiteSettingsContext";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { DiscountTag } from "@/components/ui/DiscountTag";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { toast } from "sonner";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { settings } = useSiteSettings();
  const [qty, setQty] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProductById(id)
      .then((p) => {
        setProduct(p);
        return getProducts()
          .then((all) => {
            console.log('Products for related:', all, Array.isArray(all));
            const safeAll = Array.isArray(all) ? all : [];
            setRelated(safeAll.filter((x) => {
              const xCat = typeof x.category === 'object' && x.category !== null ? ((x.category as any)._id || (x.category as any).id || x.category) : x.category;
              const pCat = typeof p.category === 'object' && p.category !== null ? ((p.category as any)._id || (p.category as any).id || p.category) : p.category;
              return xCat === pCat && x.id !== p.id;
            }).slice(0, 4));
          });
      })
      .catch((err) => {
        console.error('Failed to load product details:', err);
        setProduct(null);
        setRelated([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FFE4E6 50%, #FEF3C7 100%)' }}>
        <UserHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
        <UserFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FFE4E6 50%, #FEF3C7 100%)' }}>
        <UserHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold mb-4 text-red-900">Product Not Found</h1>
            <Button asChild className="bg-red-600 hover:bg-red-700 text-white"><Link to="/catalog">Back to Shop</Link></Button>
          </div>
        </div>
        <UserFooter />
      </div>
    );
  }

  const discountPrice = getDiscountPrice(product.price, product.hasDiscount, settings.discountPercent, product.netRate, product.displayNetRate);
  const discount = product.hasDiscount ? settings.discountPercent : 0;

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
    toast.success(`${qty}x ${product.name} added to cart!`);
  };

  const handleImageClick = () => {
    setShowImageModal(true);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FFE4E6 50%, #FEF3C7 100%)' }}>
      <UserHeader />
      <main className="container py-8 flex-1">
        <Link to="/catalog" className="inline-flex items-center gap-1 text-sm text-red-700 hover:text-red-900 transition-colors mb-6 font-semibold">
          <ArrowLeft className="h-4 w-4" /> Back to Shop
        </Link>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="rounded-lg overflow-hidden bg-white border-2 border-red-300 aspect-square cursor-pointer" onClick={handleImageClick}>
            <img src={(product.storeStockPieces || 0) <= 0 ? '/saiyogi-logo-1.png' : product.image} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
          </div>

          <div className="space-y-4">
            <p className="text-sm text-red-700 font-semibold uppercase">{product.brand}</p>
            <h1 className="product-title-font text-3xl font-black text-red-900">{product.name}</h1>



            <div className="flex flex-col md:flex-row md:items-center gap-3 pt-2">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-red-700">₹{discountPrice}</span>
                {discount > 0 && (
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl text-red-600 line-through font-semibold">₹{product.price}</span>
                    <DiscountTag discount={discount} className="w-14 sm:w-16 h-auto" />
                  </div>
                )}
              </div>
            </div>

            <p className="text-red-800">{product.description}</p>

            <div className="space-y-2 text-sm text-red-800">
              <p><span className="font-semibold">Availability:</span> {(product.storeStockPieces || 0) > 0 ? <span className="text-green-600 font-bold">In Stock ({(product.storeStockPieces || 0)} left)</span> : <span className="text-red-600 font-bold">Out of Stock</span>}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
              <div className="flex items-center border-2 border-red-300 rounded-lg">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 hover:bg-red-100 transition-colors text-red-700" disabled={(product.storeStockPieces || 0) <= 0}><Minus className="h-4 w-4" /></button>
                <span className="px-4 font-semibold text-red-900">{qty}</span>
                <button onClick={() => setQty(Math.min((product.storeStockPieces || 0), qty + 1))} className="p-2 hover:bg-red-100 transition-colors text-red-700" disabled={(product.storeStockPieces || 0) <= 0}><Plus className="h-4 w-4" /></button>
              </div>
              <Button
                onClick={handleAdd}
                className={`flex-1 ${(product.storeStockPieces || 0) <= 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} text-white`}
                disabled={(product.storeStockPieces || 0) <= 0}
              >
                <ShoppingCart className="h-4 w-4 mr-2" /> {(product.storeStockPieces || 0) <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-bold mb-6 text-red-900">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </main>

      {/* Image Lightbox Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full">
            <img
              src={(product.storeStockPieces || 0) <= 0 ? '/saiyogi-logo-1.png' : product.image}
              alt={product.name}
              className="w-full h-auto rounded-lg"
            />
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-2 right-2 md:top-4 md:right-4 bg-white rounded-full p-2 hover:bg-gray-200 transition-colors shadow-lg"
              aria-label="Close"
            >
              <X className="h-6 w-6 text-black" />
            </button>
            <p className="text-white text-center mt-4 text-sm md:text-base">{product.name}</p>
          </div>
        </div>
      )}
      <UserFooter />
    </div>
  );
};

export default ProductDetail;
