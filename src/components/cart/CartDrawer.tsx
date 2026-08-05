import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/context/CartContext";
import { useSiteSettings, getDiscountPrice } from "@/context/SiteSettingsContext";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

const CartDrawer = () => {
  const { items, updateQuantity, removeFromCart, clearCart, totalItems, totalPrice, isCartOpen, setIsCartOpen } = useCart();
  const { settings } = useSiteSettings();
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phoneNumber: "",
    state: "",
    district: "",
    deliveryAddress: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    if (name === "phoneNumber") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.email.trim()) { toast.error("Email is required"); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { toast.error("Please enter a valid email address"); return false; }
    if (!formData.name.trim()) { toast.error("Name is required"); return false; }
    if (!formData.phoneNumber.trim()) { toast.error("Phone number is required"); return false; }
    if (!/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ""))) { toast.error("Phone number must be 10 digits"); return false; }
    if (!formData.state) { toast.error("State is required"); return false; }
    if (!formData.district) { toast.error("District is required"); return false; }
    if (!formData.deliveryAddress.trim()) { toast.error("Delivery address is required"); return false; }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    try {
      setIsPlacingOrder(true);
      const orderItems = items.map((item) => {
        const discountedPrice = getDiscountPrice(item.product.price, item.product.hasDiscount, settings.discountPercent, item.product.netRate, item.product.displayNetRate);
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
        deliveryAddress: fullDeliveryAddress,
        state: formData.state,
        district: formData.district,
        items: orderItems,
        paymentMethod: "cod",
        shippingAddress: { fullAddress: fullDeliveryAddress },
      });

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
      setIsCartOpen(false);
      setFormData({ email: "", name: "", phoneNumber: "", state: "", district: "", deliveryAddress: "" });
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to place order");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const packingCharge = settings.enablePackingCharge !== false ? Math.round(totalPrice * 0.03) : 0;
  const estimatedTotal = totalPrice + packingCharge;
  const dialogMinPurchase = formData.state === "Tamil Nadu" ? settings.minimumPurchaseAmount : settings.minPurchaseOutsideTN;
  const canPlaceOrder = !formData.state || totalPrice >= dialogMinPurchase;

  return (
    <>
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0 bg-white border-l-0 sm:border-l flex flex-col font-sans">
          
          {/* Drawer Header */}
          <SheetHeader className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10 flex flex-row items-center justify-between shadow-sm">
            <SheetTitle className="text-[#a41a1c] font-black uppercase tracking-wider text-base m-0">
              MY ESTIMATE ({totalItems})
            </SheetTitle>
          </SheetHeader>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
            {items.length === 0 ? (
              <div className="text-center py-10 text-gray-500 font-semibold text-sm">
                Your cart is empty.
              </div>
            ) : (
              items.map(({ product, quantity }) => {
                const dp = getDiscountPrice(product.price, product.hasDiscount, settings.discountPercent, product.netRate, product.displayNetRate);
                return (
                  <div key={product._id || product.id} className="flex gap-4 p-3 bg-white border border-gray-200 rounded-lg shadow-sm items-start relative">
                    <img src={(product.storeStockPieces || 0) <= 0 ? '/1.png' : product.image} alt={product.name} className="w-16 h-16 rounded-md object-contain shrink-0 border border-gray-100 p-1" />
                    <div className="flex-1">
                      <h4 className="font-extrabold text-sm text-gray-900 pr-6 truncate">{product.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{product.quantity || "1 Box"}</p>
                      
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-black text-[#a41a1c] text-sm">₹{dp}</span>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-gray-200 rounded">
                          <button onClick={() => updateQuantity(product._id || product.id, quantity - 1)} className="px-2 py-1 hover:bg-gray-50 disabled:opacity-50" disabled={quantity <= 1}>
                            <Minus className="h-3 w-3 text-gray-600" />
                          </button>
                          <span className="px-2 text-xs font-semibold text-gray-900 text-center w-6">{quantity}</span>
                          <button onClick={() => updateQuantity(product._id || product.id, Math.min(product.storeStockPieces || 0, quantity + 1))} className="px-2 py-1 hover:bg-gray-50 disabled:opacity-50" disabled={quantity >= (product.storeStockPieces || 0)}>
                            <Plus className="h-3 w-3 text-gray-600" />
                          </button>
                        </div>
                        
                        <span className="font-black text-gray-900 text-sm">₹{dp * quantity}</span>
                      </div>
                    </div>
                    
                    {/* Delete Icon */}
                    <button 
                      onClick={() => removeFromCart(product._id || product.id)} 
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Footer */}
          {items.length > 0 && (
            <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] space-y-3">
              <div className="flex justify-between text-xs text-gray-600 font-semibold">
                <span>Items Total ({totalItems} Items)</span>
                <span className="text-gray-900">₹{totalPrice}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 font-semibold">
                <span>Packing Charge</span>
                <span className="text-gray-900">₹{packingCharge}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 font-semibold">
                <span>Transport Charge</span>
                <span className="text-gray-900">As Applicable</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-t border-gray-100">
                <span className="font-bold text-[#a41a1c] text-sm tracking-wide">ESTIMATED TOTAL</span>
                <span className="font-black text-[#a41a1c] text-xl">₹{estimatedTotal}</span>
              </div>

              <Button 
                onClick={() => setShowCheckoutDialog(true)}
                className="w-full bg-[#a41a1c] hover:bg-red-800 text-white font-bold tracking-wider py-6 rounded-md shadow-md uppercase"
              >
                Request Estimate
              </Button>
              
              <div className="flex gap-2 pt-1">
                <a href={`https://wa.me/${(settings.contact?.phone || "+919488073004").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi, I'd like to order crackers worth ₹${estimatedTotal}.`)}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button className="w-full bg-[#25D366] hover:bg-green-600 text-white font-bold py-5 rounded-md shadow-sm border-none flex items-center justify-center gap-1 uppercase text-xs">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" /></svg>
                    WhatsApp
                  </Button>
                </a>
                <a href={`tel:${(settings.contact?.phone || "+919488073004").replace(/[^0-9+]/g, "")}`} className="flex-1">
                  <Button variant="outline" className="w-full text-[#a41a1c] border-gray-300 font-bold py-5 rounded-md shadow-sm uppercase text-xs hover:bg-red-50">
                    Call Now
                  </Button>
                </a>
              </div>

              <p className="text-center text-[10px] text-gray-500 mt-2 font-medium">
                * This is only an estimate. Final price may vary.
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>

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
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="your@email.com" className="border-red-300" />
            </div>
            <div>
              <Label htmlFor="name" className="text-red-900">Full Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Your Name" className="border-red-300" />
            </div>
            <div>
              <Label htmlFor="phoneNumber" className="text-red-900">Phone Number *</Label>
              <Input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder="10-digit phone number" className="border-red-300" maxLength={10} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="state" className="text-red-900">State *</Label>
                <Select value={formData.state} onValueChange={(value) => setFormData(prev => ({ ...prev, state: value, district: "" }))}>
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
                <Select value={formData.district} onValueChange={(value) => setFormData(prev => ({ ...prev, district: value }))} disabled={!formData.state}>
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
              <Textarea id="deliveryAddress" name="deliveryAddress" value={formData.deliveryAddress} onChange={handleInputChange} placeholder="Street, Area, Pincode" className="border-red-300" rows={2} />
            </div>
            {!canPlaceOrder && formData.state && (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-3 text-xs sm:text-sm text-orange-900 animate-pulse mt-2">
                <p className="font-bold">⚠️ Minimum purchase required for {formData.state}</p>
                <p className="mt-1">Minimum: <strong>₹{dialogMinPurchase}</strong>. Please add ₹{dialogMinPurchase - totalPrice} more to your cart.</p>
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCheckoutDialog(false)} className="flex-1">Cancel</Button>
              <Button onClick={handlePlaceOrder} disabled={isPlacingOrder || !canPlaceOrder} className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed">
                {isPlacingOrder ? "Placing Order..." : "Place Order"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CartDrawer;
