import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSiteSettings, getDiscountPrice } from "@/context/SiteSettingsContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOrder } from "@/lib/api";
import { generateOrderReceiptPDF } from "@/lib/pdf-generator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import indiaStatesData from "@/lib/indiaStates.json";

const getAllStates = () => Object.keys(indiaStatesData);
const getDistrictsByState = (state: string) => (indiaStatesData as Record<string, string[]>)[state] || [];

const Cart = () => {
  const { items, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart();
  const { settings } = useSiteSettings();
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  // Location is determined by the selected state dynamically in the checkout form
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phoneNumber: "",
    alternatePhoneNumber: "",
    state: "",
    district: "",
    deliveryAddress: "",
  });

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
        <UserHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <ShoppingBag className="h-16 w-16 mx-auto text-red-700" />
            <h1 className="font-display text-2xl font-bold text-red-900">Your Cart is Empty</h1>
            <p className="text-red-800">Add some crackers to get the party started!</p>
            <Button asChild className="bg-red-600 hover:bg-red-700 text-white"><Link to="/catalog">Start Shopping</Link></Button>
          </div>
        </div>
        <UserFooter />
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    
    // For phone numbers, only allow digits and limit to 10
    if (name === "phoneNumber" || name === "alternatePhoneNumber") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      toast.error("Phone number is required");
      return false;
    }
    if (!/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ""))) {
      toast.error("Phone number must be 10 digits");
      return false;
    }
    // if (formData.alternatePhoneNumber && !/^\d{10}$/.test(formData.alternatePhoneNumber.replace(/\D/g, ""))) {
    //   toast.error("Alternate phone number must be 10 digits");
    //   return false;
    // }
    if (!formData.state) {
      toast.error("State is required");
      return false;
    }
    if (!formData.district) {
      toast.error("District is required");
      return false;
    }
    if (!formData.deliveryAddress.trim()) {
      toast.error("Delivery address is required");
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    try {
      setIsPlacingOrder(true);
      const orderItems = items.map((item) => {
        const discountedPrice = getDiscountPrice(
          item.product.price,
          item.product.hasDiscount,
          settings.discountPercent,
          item.product.netRate,
          item.product.displayNetRate
        );
        return {
          product: item.product._id || item.product.id,
          quantity: item.quantity,
          price: discountedPrice,
          originalPrice: item.product.price,
          hasDiscount: item.product.hasDiscount,
          productName: item.product.name,
          netRate: item.product.netRate,
          displayNetRate: item.product.displayNetRate
        };
      });

      const fullDeliveryAddress = `${formData.deliveryAddress}, ${formData.district}, ${formData.state}`;
      const response = await createOrder({
        customerEmail: formData.email,
        customerName: formData.name,
        customerPhone: formData.phoneNumber,
        alternatePhoneNumber: formData.alternatePhoneNumber,
        deliveryAddress: fullDeliveryAddress,
        state: formData.state,
        district: formData.district,
        items: orderItems,
        paymentMethod: "cod",
        shippingAddress: {
          fullAddress: fullDeliveryAddress,
        },
      });

      // Generate and download PDF receipt
      if (response?.order) {
        const orderData = {
          orderNumber: response.order.orderNumber || response.order._id,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phoneNumber,
          deliveryAddress: fullDeliveryAddress,
          state: formData.state,
          district: formData.district,
          items: orderItems,
          subtotal: response.order.subtotal,
          discountPercent: settings.discountPercent,
          packingCharge: response.order.packingCharge,
          total: response.order.total,
          date: new Date().toLocaleDateString('en-IN'),
          siteName: settings.siteName,
          siteAddress: settings.contact?.address || '',
          sitePhone: settings.contact?.phone || '',
          siteEmail: settings.contact?.email || '',
        };
        generateOrderReceiptPDF(orderData);
      }

      toast.success("Order placed successfully! 🎆");
      clearCart();
      setShowCheckoutDialog(false);
      setFormData({
        email: "",
        name: "",
        phoneNumber: "",
        alternatePhoneNumber: "",
        state: "",
        district: "",
        deliveryAddress: "",
      });
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to place order");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const dialogMinPurchase = formData.state === "Tamil Nadu" ? settings.minimumPurchaseAmount : settings.minPurchaseOutsideTN;
  const canPlaceOrder = !formData.state || totalPrice >= dialogMinPurchase;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
      <UserHeader />
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        <Link to="/catalog" className="inline-flex items-center gap-1 text-sm text-red-700 hover:text-red-900 mb-4 sm:mb-6 font-semibold">
          <ArrowLeft className="h-4 w-4" /> Continue Shopping
        </Link>
        <h1 className="font-display text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-red-900">Shopping Cart ({items.length} items)</h1>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {items.filter(i => !(i.product.netRate && i.product.netRate > 0 && i.product.displayNetRate)).length > 0 && (
              <div className="space-y-3 sm:space-y-4">
                <h3 className="font-bold text-lg text-red-900 border-b-2 border-red-200 pb-2">Retail Products</h3>
                {items.filter(i => !(i.product.netRate && i.product.netRate > 0 && i.product.displayNetRate)).map(({ product, quantity }) => {
                  const dp = getDiscountPrice(product.price, product.hasDiscount, settings.discountPercent, product.netRate, product.displayNetRate);
                  const isNetRate = !!product.netRate && product.netRate > 0 && !!product.displayNetRate;
                  return (
                    <div key={product._id || product.id} className="flex gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg bg-white border-2 border-red-300 hover:border-red-600 transition-all w-full items-center sm:items-start">
                      <img src={(product.storeStockPieces || 0) <= 0 ? '/1.png' : product.image} alt={product.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-md object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-red-900 truncate block text-sm sm:text-base">{product.name}</span>
                        <p className="text-xs sm:text-sm text-red-700 truncate">{product.brand} · {product.quantity}</p>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                          <span className="font-bold text-red-700 text-sm sm:text-base">₹{dp}</span>
                          {product.hasDiscount && !isNetRate && <span className="text-[10px] sm:text-xs text-red-600 line-through">₹{product.price}</span>}
                          {isNetRate && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded font-black uppercase">Net Rate</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 sm:gap-2 shrink-0">
                        <button onClick={() => { removeFromCart(product._id || product.id); toast.info("Item removed"); }} className="text-red-600 hover:text-red-900 transition-colors p-1 -m-1">
                          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <div className="flex items-center border-2 border-red-300 rounded">
                          <button onClick={() => updateQuantity(product._id || product.id, quantity - 1)} className="p-1 sm:p-1.5 hover:bg-red-100 disabled:opacity-50" disabled={quantity <= 1}><Minus className="h-3 w-3 sm:h-4 sm:w-4 text-red-700" /></button>
                          <span className="px-1.5 sm:px-3 text-xs sm:text-sm font-semibold text-red-900 min-w-[1.5rem] text-center">{quantity}</span>
                          <button onClick={() => updateQuantity(product._id || product.id, Math.min(product.storeStockPieces || 0, quantity + 1))} className="p-1 sm:p-1.5 hover:bg-red-100 disabled:opacity-50" disabled={quantity >= (product.storeStockPieces || 0)}><Plus className="h-3 w-3 sm:h-4 sm:w-4 text-red-700" /></button>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-red-900">₹{dp * quantity}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {items.filter(i => i.product.netRate && i.product.netRate > 0 && i.product.displayNetRate).length > 0 && (
              <div className="space-y-3 sm:space-y-4">
                <h3 className="font-bold text-lg text-red-900 border-b-2 border-red-200 pb-2">Net Rate Products</h3>
                {items.filter(i => i.product.netRate && i.product.netRate > 0 && i.product.displayNetRate).map(({ product, quantity }) => {
                  const dp = getDiscountPrice(product.price, product.hasDiscount, settings.discountPercent, product.netRate, product.displayNetRate);
                  const isNetRate = !!product.netRate && product.netRate > 0 && !!product.displayNetRate;
                  return (
                    <div key={product._id || product.id} className="flex gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg bg-white border-2 border-red-300 hover:border-red-600 transition-all w-full items-center sm:items-start">
                      <img src={(product.storeStockPieces || 0) <= 0 ? '/1.png' : product.image} alt={product.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-md object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-red-900 truncate block text-sm sm:text-base">{product.name}</span>
                        <p className="text-xs sm:text-sm text-red-700 truncate">{product.brand} · {product.quantity}</p>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                          <span className="font-bold text-red-700 text-sm sm:text-base">₹{dp}</span>
                          {product.hasDiscount && !isNetRate && <span className="text-[10px] sm:text-xs text-red-600 line-through">₹{product.price}</span>}
                          {isNetRate && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded font-black uppercase">Net Rate</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 sm:gap-2 shrink-0">
                        <button onClick={() => { removeFromCart(product._id || product.id); toast.info("Item removed"); }} className="text-red-600 hover:text-red-900 transition-colors p-1 -m-1">
                          <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <div className="flex items-center border-2 border-red-300 rounded">
                          <button onClick={() => updateQuantity(product._id || product.id, quantity - 1)} className="p-1 sm:p-1.5 hover:bg-red-100 disabled:opacity-50" disabled={quantity <= 1}><Minus className="h-3 w-3 sm:h-4 sm:w-4 text-red-700" /></button>
                          <span className="px-1.5 sm:px-3 text-xs sm:text-sm font-semibold text-red-900 min-w-[1.5rem] text-center">{quantity}</span>
                          <button onClick={() => updateQuantity(product._id || product.id, Math.min(product.storeStockPieces || 0, quantity + 1))} className="p-1 sm:p-1.5 hover:bg-red-100 disabled:opacity-50" disabled={quantity >= (product.storeStockPieces || 0)}><Plus className="h-3 w-3 sm:h-4 sm:w-4 text-red-700" /></button>
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-red-900">₹{dp * quantity}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* End of lists */}

          <div className="bg-white border-2 border-red-300 rounded-lg p-4 sm:p-6 h-fit space-y-4 lg:sticky lg:top-20 w-full shrink-0">
            <h2 className="font-display text-lg sm:text-xl font-bold text-red-900">Order Summary</h2>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-red-900"><span className="text-red-700">Retail Amount</span><span className="font-semibold">₹{items.filter(i => !(i.product.netRate && i.product.netRate > 0 && i.product.displayNetRate)).reduce((acc, item) => acc + (getDiscountPrice(item.product.price, item.product.hasDiscount, settings.discountPercent, item.product.netRate, item.product.displayNetRate) * item.quantity), 0)}</span></div>
              <div className="flex justify-between text-red-900"><span className="text-red-700">Net Rate Amount</span><span className="font-semibold">₹{items.filter(i => i.product.netRate && i.product.netRate > 0 && i.product.displayNetRate).reduce((acc, item) => acc + (getDiscountPrice(item.product.price, item.product.hasDiscount, settings.discountPercent, item.product.netRate, item.product.displayNetRate) * item.quantity), 0)}</span></div>
              <div className="flex justify-between text-red-900"><span className="text-red-700">Subtotal</span><span className="font-semibold">₹{totalPrice}</span></div>
              {settings.enablePackingCharge !== false && (
                <div className="flex justify-between text-red-900"><span className="text-red-700">Packing Charges (3%)</span><span className="font-semibold">₹{Math.round(totalPrice * 0.03)}</span></div>
              )}
              <div className="flex justify-between text-red-900 text-[10px] sm:text-xs italic"><span className="text-red-600">Delivery Charges</span><span className="text-green-600 font-semibold">Excluded</span></div>
            </div>
            <div className="border-t-2 border-red-300 pt-3 sm:pt-4 flex justify-between font-bold text-base sm:text-lg text-red-900">
              <span>Total</span>
              <span className="text-red-700">₹{totalPrice + (settings.enablePackingCharge !== false ? Math.round(totalPrice * 0.03) : 0)}</span>
            </div>
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-orange-900">
              <p className="flex items-center gap-1.5 sm:gap-2 font-bold mb-1">
                ℹ️ Minimum Order Requirements
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1 opacity-90">
                <li>Tamil Nadu: <strong>₹{settings.minimumPurchaseAmount}</strong></li>
                <li>Other States: <strong>₹{settings.minPurchaseOutsideTN}</strong></li>
              </ul>
            </div>

            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed h-12 sm:h-14 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl shadow-red-200 text-sm sm:text-lg font-bold transition-all hover:scale-[1.02] active:scale-95"
              size="lg"
              onClick={() => setShowCheckoutDialog(true)}
            >
              Proceed to Checkout
            </Button>
            <Button className="w-full border-2 border-red-300 text-black-700 hover:bg-red-50 text-sm sm:text-base h-10 sm:h-12" onClick={() => { clearCart(); toast.info("Cart cleared"); }}>
              Clear Cart
            </Button>
          </div>
        </div>
      </main>
      <UserFooter />

      {/* Checkout Dialog */}
      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-900">Checkout</DialogTitle>
            <DialogDescription>Enter your details to place the order</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-red-900">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your@email.com"
                className="border-red-300"
              />
            </div>
            <div>
              <Label htmlFor="name" className="text-red-900">Full Name *</Label>
              <Input
                id="name"
                name="name"

                
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your Name"
                className="border-red-300"
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber" className="text-red-900">Phone Number *</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="10-digit phone number"
                className="border-red-300"
                maxLength={10}
              />
            </div>
            {/* <div>
              <Label htmlFor="alternatePhoneNumber" className="text-red-900">Alternate Phone Number (Optional)</Label>
              <Input
                id="alternatePhoneNumber"
                name="alternatePhoneNumber"
                value={formData.alternatePhoneNumber}
                onChange={handleInputChange}
                placeholder="10-digit phone number"
                className="border-red-300"
              />
            </div> */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="state" className="text-red-900">State *</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, state: value, district: "" }))}
                >
                  <SelectTrigger className="border-red-300 bg-white">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllStates().map((state: string) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="district" className="text-red-900">District *</Label>
                <Select
                  value={formData.district}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, district: value }))}
                  disabled={!formData.state}
                >
                  <SelectTrigger className="border-red-300 bg-white">
                    <SelectValue placeholder="Select District" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.state && getDistrictsByState(formData.state).map((district: string) => (
                      <SelectItem key={district} value={district}>{district}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="deliveryAddress" className="text-red-900">Address line *</Label>
              <Textarea
                id="deliveryAddress"
                name="deliveryAddress"
                value={formData.deliveryAddress}
                onChange={handleInputChange}
                placeholder="Street, Area, Pincode"
                className="border-red-300"
                rows={2}
              />
            </div>
            {!canPlaceOrder && formData.state && (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-3 text-xs sm:text-sm text-orange-900 animate-pulse mt-2">
                <p className="font-bold">⚠️ Minimum purchase required for {formData.state}</p>
                <p className="mt-1">Minimum: <strong>₹{dialogMinPurchase}</strong>. Please add ₹{dialogMinPurchase - totalPrice} more to your cart.</p>
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCheckoutDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || !canPlaceOrder}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlacingOrder ? "Placing Order..." : "Place Order"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cart;
