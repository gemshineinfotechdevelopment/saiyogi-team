import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetDescription } from "@/components/ui/sheet";
import { useCart } from "@/context/CartContext";
import { useSiteSettings, getDiscountPrice } from "@/context/SiteSettingsContext";
import { Minus, Plus, Trash2, X, User, MapPin, ArrowLeft, CheckCircle2, Check, MessageSquare, Smartphone, ShieldCheck, ArrowRight, RefreshCw } from "lucide-react";
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
import { createOrder, trackCustomerAction } from "@/lib/api";
import { getCookie, setCookie } from "@/lib/cookieUtils";
import { promptAndDownloadOrderReceiptPDF, promptAndPrintOrderReceipt, downloadOrderReceiptPDF, printOrderReceipt } from "@/lib/pdf-generator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/data/products";

import indiaStatesData from "@/lib/indiaStates.json";

const getAllStates = () => Object.keys(indiaStatesData);
const getDistrictsByState = (state: string) => (indiaStatesData as Record<string, string[]>)[state] || [];

const CartDrawer = () => {
  const { items, updateQuantity, removeFromCart, clearCart, totalItems, totalPrice, isCartOpen, setIsCartOpen, cartViewMode, setCartViewMode } = useCart();
  const { settings } = useSiteSettings();
  const { isUserLoggedIn, userPhone, userName, loginWithPhone, openLoginModal } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewModeState] = useState<"cart" | "whatsapp-verify" | "checkout">("cart");

  const setViewMode = (mode: "cart" | "whatsapp-verify" | "checkout") => {
    setViewModeState(mode);
    setCartViewMode(mode);
  };

  useEffect(() => {
    if (isCartOpen) {
      setViewModeState(cartViewMode || "cart");
    }
  }, [isCartOpen, cartViewMode]);

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completedOrderNumber, setCompletedOrderNumber] = useState<string>("");
  const [selectedCartProduct, setSelectedCartProduct] = useState<Product | null>(null);
  
  // WhatsApp OTP Verification states
  const [otpStep, setOtpStep] = useState<"number" | "otp">("number");
  const [verifyPhone, setVerifyPhone] = useState<string>("");
  const [generatedOtp, setGeneratedOtp] = useState<string>("");
  const [userOtp, setUserOtp] = useState<string>("");
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(false);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phoneNumber: "",
    state: "",
    district: "",
    pincode: "",
    deliveryAddress: "",
    preferredTransport: "",
  });

  // Auto sync user name & phone from auth context / storage into cart checkout form
  React.useEffect(() => {
    const activePhone = userPhone || localStorage.getItem("user_phone") || getCookie("saiyogi_user_phone") || "";
    const activeName = userName || localStorage.getItem("user_name") || getCookie("saiyogi_user_name") || "";

    setFormData((prev) => ({
      ...prev,
      phoneNumber: prev.phoneNumber || activePhone,
      name: prev.name || (activeName && activeName !== "Customer" ? activeName : "")
    }));
  }, [isUserLoggedIn, userPhone, userName, isCartOpen, viewMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    if (name === "phoneNumber") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    if (name === "pincode") {
      value = value.replace(/\D/g, "").slice(0, 6);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStartEnquiry = () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // If already logged in, no need to ask for mobile number verification
    if (isUserLoggedIn || isPhoneVerified) {
      const activePhone = userPhone || formData.phoneNumber || localStorage.getItem("user_phone") || getCookie("saiyogi_user_phone") || "";
      const activeName = userName || formData.name || localStorage.getItem("user_name") || getCookie("saiyogi_user_name") || "";
      setFormData((prev) => ({
        ...prev,
        phoneNumber: activePhone || prev.phoneNumber,
        name: (activeName && activeName !== "Customer") ? activeName : prev.name
      }));
      setIsPhoneVerified(true);
      setViewMode("checkout");
    } else {
      toast.info("Please log in with your mobile number to proceed to checkout.");
      openLoginModal();
    }
  };

  const handleSendWhatsAppCode = () => {
    if (!/^\d{10}$/.test(verifyPhone.trim())) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    setIsSendingOtp(true);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);

    setTimeout(() => {
      setIsSendingOtp(false);
      setOtpStep("otp");
      toast.success(`WhatsApp verification code: ${code}`, {
        description: `Sent to +91 ${verifyPhone}. Enter code below to verify.`,
        duration: 15000,
      });
    }, 500);
  };

  const handleVerifyOtp = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (userOtp.trim() === generatedOtp || userOtp.trim() === "123456" || userOtp.trim() === "1234") {
      setIsPhoneVerified(true);
      setFormData((prev) => ({ ...prev, phoneNumber: verifyPhone }));
      loginWithPhone(verifyPhone, formData.name.trim());
      toast.success("WhatsApp number verified successfully! 🎉");
      setViewMode("checkout");
    } else {
      toast.error("Invalid verification code. Please check and try again.");
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) { toast.error("Name is required"); return false; }
    if (!formData.email.trim()) { toast.error("Email is required"); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { toast.error("Please enter a valid email address"); return false; }
    if (!formData.phoneNumber.trim()) { toast.error("Phone number is required"); return false; }
    if (!/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ""))) { toast.error("Phone number must be 10 digits"); return false; }
    if (!formData.state) { toast.error("State is required"); return false; }
    if (!formData.district) { toast.error("District is required"); return false; }
    if (!formData.deliveryAddress.trim()) { toast.error("Delivery address line is required"); return false; }
    if (!formData.pincode.trim()) { toast.error("Pincode is required"); return false; }
    if (!/^\d{6}$/.test(formData.pincode.trim())) { toast.error("Pincode must be 6 digits"); return false; }
    return true;
  };

  const [savedOrderData, setSavedOrderData] = useState<any>(null);

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    try {
      setIsPlacingOrder(true);
      const orderItems = items.map((item) => {
        const discountedPrice = getDiscountPrice(item.product.price, item.product.hasDiscount, settings.discountPercent, item.product.netRate, item.product.displayNetRate);
        return {
          product: String(item.product._id || item.product.id || ''),
          quantity: item.quantity,
          price: discountedPrice,
          originalPrice: item.product.price,
          hasDiscount: item.product.hasDiscount,
          productName: item.product.name,
          netRate: item.product.netRate,
          displayNetRate: item.product.displayNetRate
        };
      });

      const fullDeliveryAddress = `${formData.deliveryAddress}, ${formData.district}, ${formData.state} - ${formData.pincode}`;
      const response = await createOrder({
        customerEmail: formData.email,
        customerName: formData.name,
        customerPhone: formData.phoneNumber,
        preferredTransport: formData.preferredTransport,
        deliveryAddress: fullDeliveryAddress,
        state: formData.state,
        district: formData.district,
        items: orderItems,
        paymentMethod: "cod",
        shippingAddress: { fullAddress: fullDeliveryAddress },
      });

      if (response?.order) {
        trackCustomerAction({
          phone: formData.phoneNumber,
          name: formData.name,
          source: "product_enquiry",
          enquiry: {
            productName: items.map(i => i.product.name).join(", ") || "Enquiry Items",
            amount: response.order.total || estimatedTotal,
            status: "New"
          },
          deliveryAddress: fullDeliveryAddress
        }).catch(err => console.warn("Failed to track customer enquiry:", err));

        const orderData = {
          orderNumber: response.order.orderNumber || response.order._id,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phoneNumber,
          preferredTransport: formData.preferredTransport,
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
          companyName: settings.billing?.companyName || settings.siteName,
          siteAddress: settings.contact?.address || '',
          sitePhone: settings.contact?.phone || '',
          siteEmail: settings.contact?.email || '',
          gstNumber: settings.billing?.gstNumber || '',
        };
        setSavedOrderData(orderData);

        // Save enquiry to user's phone-specific key in localStorage and cookie for MyEnquiry page
        try {
          const cleanPhone = formData.phoneNumber.replace(/\D/g, "").slice(-10);
          const userPhoneKey = `user_saved_enquiries_${cleanPhone}`;
          const cookieKey = `saiyogi_enquiries_${cleanPhone}`;

          let existing: any[] = [];
          const cookieVal = getCookie(cookieKey);
          if (cookieVal) {
            try {
              const parsedCookie = JSON.parse(cookieVal);
              if (Array.isArray(parsedCookie)) existing = parsedCookie;
            } catch (_) {}
          }
          if (existing.length === 0) {
            try {
              const parsedLocal = JSON.parse(localStorage.getItem(userPhoneKey) || "[]");
              if (Array.isArray(parsedLocal)) existing = parsedLocal;
            } catch (_) {}
          }

          const newEnquiry = {
            id: String(Date.now()),
            enquiryNumber: String(response.order.orderNumber || Math.floor(100000 + Math.random() * 900000)),
            date: `${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
            subtotal: response.order.subtotal,
            discountPercent: settings.discountPercent,
            packingCharge: response.order.packingCharge,
            total: response.order.total || response.order.subtotal || 0,
            status: "Pending",
            customerName: formData.name,
            customerPhone: formData.phoneNumber,
            customerEmail: formData.email,
            deliveryAddress: fullDeliveryAddress,
            state: formData.state,
            district: formData.district,
            items: orderItems.map(i => ({
              productName: i.productName,
              quantity: i.quantity,
              price: i.price,
              originalPrice: i.originalPrice,
              hasDiscount: i.hasDiscount,
              netRate: i.netRate,
              displayNetRate: i.displayNetRate
            }))
          };
          const updatedEnquiries = [newEnquiry, ...existing];
          localStorage.setItem(userPhoneKey, JSON.stringify(updatedEnquiries));
          localStorage.setItem("saiyogi_all_enquiries", JSON.stringify(updatedEnquiries));
          setCookie(cookieKey, JSON.stringify(updatedEnquiries), 365);
          setCookie("saiyogi_all_enquiries", JSON.stringify(updatedEnquiries), 365);
          setCookie("saiyogi_last_phone", cleanPhone, 365);
        } catch (_) {}
      }

      clearCart();
      setViewMode("cart");
      setIsCartOpen(false);
      setFormData({ email: "", name: "", phoneNumber: "", state: "", district: "", pincode: "", deliveryAddress: "", preferredTransport: "" });
      setIsPhoneVerified(false);
      
      // Open Terms & Conditions modal right after placing order
      setShowTermsModal(true);
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to place order");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleConfirmAndSubmitTerms = () => {
    if (savedOrderData) {
      try {
        downloadOrderReceiptPDF(savedOrderData);
      } catch (pdfErr) {
        console.error("PDF download failed:", pdfErr);
      }
      setCompletedOrderNumber(savedOrderData.orderNumber || "");
    }
    setShowTermsModal(false);
    setShowSuccessModal(true);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setSavedOrderData(null);
    setCompletedOrderNumber("");
  };

  const packingCharge = settings.enablePackingCharge !== false ? (totalPrice <= 3999 ? 120 : Math.round(totalPrice * 0.03)) : 0;
  const estimatedTotal = totalPrice + packingCharge;
  const dialogMinPurchase = formData.state === "Tamil Nadu" ? settings.minimumPurchaseAmount : settings.minPurchaseOutsideTN;
  const canPlaceOrder = !formData.state || totalPrice >= dialogMinPurchase;

  return (
    <Sheet open={isCartOpen} onOpenChange={(open) => {
      setIsCartOpen(open);
      if (!open) setViewMode("cart");
    }}>
      <SheetContent className="w-[70vw] sm:w-full sm:max-w-md overflow-y-auto p-0 bg-white border-l-0 sm:border-l flex flex-col font-sans">
        
        {/* Drawer Header */}
        <SheetHeader className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10 flex flex-row items-center justify-between shadow-sm">
          {viewMode === "checkout" ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setViewMode("cart")} 
                className="p-1 text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                title="Back to Cart"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <SheetTitle className="text-[#a41a1c] font-black uppercase tracking-wider text-base m-0">
                CHECKOUT
              </SheetTitle>
              <SheetDescription className="sr-only">Shopping cart items and checkout drawer</SheetDescription>
            </div>
          ) : viewMode === "whatsapp-verify" ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setViewMode("cart")} 
                className="p-1 text-gray-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                title="Back to Cart"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <SheetTitle className="text-[#00a859] font-black uppercase tracking-wider text-base m-0 flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5" /> VERIFY WHATSAPP
              </SheetTitle>
            </div>
          ) : (
            <div>
              <SheetTitle className="text-[#a41a1c] font-black uppercase tracking-wider text-base m-0">
                MY CART ({totalItems})
              </SheetTitle>
              <SheetDescription className="sr-only">
                Review and modify your cart items before checkout.
              </SheetDescription>
            </div>
          )}
          <SheetClose className="rounded-full p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 transition-colors focus:outline-none">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </SheetHeader>

        {/* View Mode: CART */}
        {viewMode === "cart" && (
          <div className="flex-1 flex flex-col justify-between overflow-y-auto">
            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto px-4 py-2 bg-white divide-y divide-gray-100">
              {items.length === 0 ? (
                <div className="text-center py-12 text-gray-400 font-medium text-sm">
                  Your cart is empty.
                </div>
              ) : (
                items.map(({ product, quantity }) => {
                  const productId = String(product._id || product.id);
                  const dp = getDiscountPrice(product.price, product.hasDiscount, settings.discountPercent, product.netRate, product.displayNetRate);
                  const stockVal = product.storeStockPieces !== undefined ? Number(product.storeStockPieces) : (product.stock !== undefined ? Number(product.stock) : 999);
                  return (
                    <div key={productId} className="py-3.5 flex gap-3 items-start">
                      <img
                        src={stockVal <= 0 ? '/saiyogi-logo-1.png' : product.image}
                        alt={product.name}
                        className="w-14 h-14 rounded-md object-contain shrink-0 border border-gray-100 p-0.5 cursor-pointer hover:border-[#A80000]/40 transition-colors"
                        onClick={() => setSelectedCartProduct(product)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4
                            className="product-title-font font-extrabold sm:font-bold text-base sm:text-sm text-gray-900 truncate cursor-pointer hover:text-[#A80000] transition-colors"
                            onClick={() => setSelectedCartProduct(product)}
                          >{product.name}</h4>
                          <button 
                            onClick={() => removeFromCart(productId)} 
                            className="text-gray-400 hover:text-red-500 transition-colors p-0.5 shrink-0"
                            title="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-[#a41a1c] text-sm shrink-0">₹{dp.toLocaleString('en-IN')}</span>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center border border-gray-300 rounded divide-x divide-gray-300 bg-white">
                            <button onClick={() => updateQuantity(productId, quantity - 1)} className="px-2 py-0.5 hover:bg-gray-100 disabled:opacity-30 text-gray-700 transition-colors" disabled={quantity <= 1}>
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-2 py-0.5 text-xs font-semibold text-gray-800 text-center min-w-[22px]">{quantity}</span>
                            <button onClick={() => updateQuantity(productId, Math.min(stockVal, quantity + 1))} className="px-2 py-0.5 hover:bg-gray-100 disabled:opacity-30 text-gray-700 transition-colors" disabled={quantity >= stockVal}>
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          
                          <span className="font-bold text-gray-900 text-sm shrink-0">₹{(dp * quantity).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Product Detail Modal */}
            {selectedCartProduct && (
              <ProductCard
                product={selectedCartProduct}
                showDetailOnly
                onDetailClose={() => setSelectedCartProduct(null)}
              />
            )}

            {/* Cart Footer */}
            {items.length > 0 && (
              <div className="p-4 bg-white border-t border-gray-100 space-y-3">
                <div className="flex justify-between text-xs text-gray-600 font-medium">
                  <span>Items Total ({totalItems} Items)</span>
                  <span className="text-gray-900 font-bold">₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600 font-medium">
                  <span>Packing Charge</span>
                  <span className="text-gray-900 font-bold">₹{packingCharge.toLocaleString('en-IN')}</span>
                </div>
                {Math.round(estimatedTotal) - estimatedTotal !== 0 && (
                  <div className="flex justify-between text-xs text-gray-600 font-medium">
                    <span>Round Off</span>
                    <span className="text-gray-900 font-bold">{(Math.round(estimatedTotal) - estimatedTotal) > 0 ? '+' : ''}₹{(Math.round(estimatedTotal) - estimatedTotal).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 pt-3 border-t border-gray-100">
                  <span className="font-bold text-[#a41a1c] text-sm tracking-wide">ESTIMATED TOTAL</span>
                  <span className="font-black text-[#a41a1c] text-xl">₹{Math.round(estimatedTotal).toLocaleString('en-IN')}</span>
                </div>

                {/* Minimum Subtotal Limit Warning Card (Compact) */}
                <div className="glamics-cart-warning-card my-1.5 py-2 px-3">
                  <div className="glamics-cart-glow" />
                  <span className="glamics-cart-warning-title text-[10px]">
                    <ShieldCheck className="w-3.5 h-3.5" /> Minimum Subtotal Limit
                  </span>
                  <div className="glamics-cart-warning-text text-[11px] flex justify-between items-center mt-1">
                    <span>TN: <b className="text-gray-900 font-bold">₹3,000</b></span>
                    <span className="text-[#f43f5e]/40">|</span>
                    <span>Other States: <b className="text-gray-900 font-bold">₹5,000</b></span>
                  </div>
                </div>

                {/* Action Buttons: VIEW CART & PROCEED TO CHECKOUT */}
                <div className="space-y-2.5 pt-1">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsCartOpen(false);
                      navigate("/cart");
                    }}
                    className="w-full border-2 border-[#900000] text-[#900000] hover:bg-[#900000] hover:text-white font-extrabold tracking-wider py-5 rounded-md uppercase text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
                  >
                    VIEW CART
                  </Button>

                  <Button 
                    onClick={handleStartEnquiry}
                    className="w-full bg-[#900000] hover:bg-[#700000] text-white font-extrabold tracking-wider py-5 rounded-md uppercase text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                  >
                    PROCEED TO CHECKOUT
                  </Button>
                </div>
                
                <p className="text-center text-[11px] text-gray-500 mt-2 font-normal">
                  * This is just an enquiry only.
                </p>
              </div>
            )}
          </div>
        )}

        {/* View Mode: WHATSAPP VERIFICATION */}
        {viewMode === "whatsapp-verify" && (
          <div className="flex-1 flex flex-col justify-between overflow-y-auto">
            {otpStep === "number" ? (
              <div className="p-4 space-y-5 flex-1 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col items-center text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <h3 className="font-extrabold text-gray-900 text-sm uppercase tracking-wide">
                      WhatsApp Mobile Verification
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Please enter your WhatsApp mobile number. A verification code will be sent to verify your inquiry.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="verifyPhone" className="text-red-900 font-semibold text-xs mb-1 block">
                      WhatsApp Mobile Number *
                    </Label>
                    <div className="flex gap-2">
                      <div className="flex items-center px-3 bg-gray-100 border border-gray-300 rounded-md text-xs font-black text-gray-700">
                        +91
                      </div>
                      <Input 
                        id="verifyPhone" 
                        type="text"
                        value={verifyPhone} 
                        onChange={(e) => setVerifyPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="10-digit mobile number" 
                        className="border-red-200 bg-white focus:border-red-500 h-10 text-xs font-bold" 
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <Button 
                    onClick={handleSendWhatsAppCode}
                    disabled={verifyPhone.length !== 10 || isSendingOtp}
                    className="w-full bg-[#00a859] hover:bg-[#008f4c] text-white font-bold tracking-wider py-5 rounded-md uppercase text-xs shadow-md disabled:opacity-50"
                  >
                    {isSendingOtp ? "Generating Code..." : "SEND VERIFICATION CODE"}
                  </Button>
                  <p className="text-center text-[11px] text-gray-500 font-normal">
                    * This is just an enquiry only.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-5 flex-1 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col items-center text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="font-extrabold text-gray-900 text-sm uppercase tracking-wide">
                      Enter Verification Code
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      We sent a verification code to <strong className="text-gray-900 font-black">+91 {verifyPhone}</strong>.
                    </p>
                    <div className="bg-emerald-100/90 border border-emerald-300/60 px-3.5 py-1.5 rounded-lg text-emerald-950 text-xs font-black tracking-widest mt-1 shadow-xs">
                      DEMO CODE: {generatedOtp || "1234"}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="userOtp" className="text-red-900 font-semibold text-xs mb-1 block">
                      Verification Code *
                    </Label>
                    <Input 
                      id="userOtp" 
                      type="text"
                      value={userOtp} 
                      onChange={(e) => setUserOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Enter verification code (e.g. 1234)" 
                      className="border-red-200 bg-white focus:border-red-500 h-11 text-center font-black tracking-widest text-lg" 
                      maxLength={6}
                    />
                  </div>

                  {/* Name Field below OTP */}
                  <div className="space-y-1.5">
                    <Label htmlFor="checkoutName" className="text-red-900 font-semibold text-xs mb-1 block">
                      Your Full Name *
                    </Label>
                    <Input
                      id="checkoutName"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                      className="border-red-200 bg-white focus:border-red-500 h-10 text-xs font-semibold"
                      required
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <button 
                      type="button" 
                      onClick={() => setOtpStep("number")} 
                      className="text-red-700 font-bold hover:underline"
                    >
                      ← Change Phone Number
                    </button>
                    <button 
                      type="button" 
                      onClick={handleSendWhatsAppCode} 
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      Resend Code
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <Button 
                    onClick={handleVerifyOtp}
                    disabled={!userOtp}
                    className="w-full bg-[#00a859] hover:bg-[#008f4c] text-white font-bold tracking-wider py-5 rounded-md uppercase text-xs shadow-md disabled:opacity-50"
                  >
                    VERIFY CODE & CONTINUE
                  </Button>
                  <p className="text-center text-[11px] text-gray-500 font-normal">
                    * This is just an enquiry only.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* View Mode: CHECKOUT */}
        {viewMode === "checkout" && (
          <div className="flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Section 1: Customer Details */}
              <div className="border border-red-200/80 bg-red-50/30 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center gap-2 text-[#a41a1c] font-bold text-xs uppercase tracking-wide border-b border-red-200/60 pb-2">
                  <User className="h-4 w-4" />
                  <span>1. Customer Details</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name" className="text-red-900 font-semibold text-xs mb-1 block">Full Name *</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Your Full Name" className="border-red-200 bg-white focus:border-red-500 h-9 text-xs" />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-red-900 font-semibold text-xs mb-1 block">Email Address *</Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="your@email.com" className="border-red-200 bg-white focus:border-red-500 h-9 text-xs" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label htmlFor="phoneNumber" className="text-red-900 font-semibold text-xs block">Phone Number *</Label>
                      {(isPhoneVerified || isUserLoggedIn) && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {isUserLoggedIn ? "Logged In" : "Verified"}
                        </span>
                      )}
                    </div>
                    <Input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber || (isUserLoggedIn ? userPhone : "")} onChange={handleInputChange} placeholder="10-digit mobile number" className="border-red-200 bg-white focus:border-red-500 h-9 text-xs font-bold" maxLength={10} disabled={isPhoneVerified || isUserLoggedIn} />
                  </div>
                </div>
              </div>

              {/* Section 2: Delivery & Shipping Address */}
              <div className="border border-red-200/80 bg-red-50/30 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center gap-2 text-[#a41a1c] font-bold text-xs uppercase tracking-wide border-b border-red-200/60 pb-2">
                  <MapPin className="h-4 w-4" />
                  <span>2. Delivery Address</span>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="state" className="text-red-900 font-semibold text-xs mb-1 block">State *</Label>
                      <Select value={formData.state} onValueChange={(value) => setFormData(prev => ({ ...prev, state: value, district: "" }))}>
                        <SelectTrigger className="border-red-200 bg-white h-9 text-xs">
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
                      <Label htmlFor="district" className="text-red-900 font-semibold text-xs mb-1 block">District *</Label>
                      <Select value={formData.district} onValueChange={(value) => setFormData(prev => ({ ...prev, district: value }))} disabled={!formData.state}>
                        <SelectTrigger className="border-red-200 bg-white h-9 text-xs">
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
                    <Label htmlFor="deliveryAddress" className="text-red-900 font-semibold text-xs mb-1 block">Street / Door No / Area *</Label>
                    <Textarea id="deliveryAddress" name="deliveryAddress" value={formData.deliveryAddress} onChange={handleInputChange} placeholder="House/Door No, Street Name, Area" className="border-red-200 bg-white focus:border-red-500 text-xs" rows={2} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="pincode" className="text-red-900 font-semibold text-xs mb-1 block">Pincode *</Label>
                      <Input id="pincode" name="pincode" value={formData.pincode} onChange={handleInputChange} placeholder="6-digit Pincode" className="border-red-200 bg-white focus:border-red-500 h-9 text-xs" maxLength={6} />
                    </div>
                    <div>
                      <Label htmlFor="preferredTransport" className="text-red-900 font-semibold text-xs mb-1 block">Preferred Transport</Label>
                      <Input id="preferredTransport" name="preferredTransport" value={formData.preferredTransport} onChange={handleInputChange} placeholder="e.g. VRL Logistics, etc." className="border-red-200 bg-white focus:border-red-500 h-9 text-xs" />
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-center text-[11px] text-gray-500 mt-2 font-normal">
                * This is just an enquiry only.
              </p>
            </div>
            
            {/* Checkout Footer Actions */}
            <div className="p-4 bg-white border-t border-gray-100 space-y-3 sticky bottom-0 z-10 shadow-md">
              <div className="flex justify-between text-xs text-gray-600 font-medium">
                <span>Items Total ({totalItems} Items)</span>
                <span className="text-gray-900 font-bold">₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 font-medium">
                <span>Packing Charge</span>
                <span className="text-gray-900 font-bold">₹{packingCharge.toLocaleString('en-IN')}</span>
              </div>
              {Math.round(estimatedTotal) - estimatedTotal !== 0 && (
                <div className="flex justify-between text-xs text-gray-600 font-medium">
                  <span>Round Off</span>
                  <span className="text-gray-900 font-bold">{(Math.round(estimatedTotal) - estimatedTotal) > 0 ? '+' : ''}₹{(Math.round(estimatedTotal) - estimatedTotal).toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 pt-3 border-t border-gray-100 font-bold text-[#a41a1c] text-sm">
                <span>ESTIMATED TOTAL ({totalItems} Items)</span>
                <span className="text-lg font-black">₹{Math.round(estimatedTotal).toLocaleString('en-IN')}</span>
              </div>

              {!canPlaceOrder && formData.state && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5 text-xs text-orange-900 animate-pulse">
                  <p className="font-bold">⚠️ Minimum purchase required for {formData.state}</p>
                  <p className="mt-0.5">Minimum: <strong>₹{dialogMinPurchase}</strong>. Please add ₹{dialogMinPurchase - totalPrice} more.</p>
                </div>
              )}

              <div className="flex gap-2.5 pt-1">
                <Button 
                  variant="outline" 
                  onClick={() => setViewMode("cart")} 
                  className="flex-1 border-gray-300 text-gray-700 font-bold py-5 text-xs uppercase"
                >
                  Back to Cart
                </Button>
                <Button 
                  onClick={handlePlaceOrder} 
                  disabled={isPlacingOrder || !canPlaceOrder} 
                  className="flex-1 bg-[#900000] hover:bg-[#700000] text-white font-bold tracking-wider py-5 rounded-md uppercase text-xs shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlacingOrder ? "Placing Order..." : "Place Order"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>

      {/* Terms & Conditions Popup Modal */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="max-w-lg w-[92vw] sm:w-full rounded-2xl p-0 overflow-hidden border border-gray-200 shadow-2xl bg-white font-sans">
          <DialogHeader className="p-4 sm:p-5 border-b border-gray-200 flex flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900">
              Confirmation
            </DialogTitle>
            <DialogDescription className="sr-only">Terms and conditions details for order confirmation</DialogDescription>
          </DialogHeader>

          <div className="p-5 sm:p-6 max-h-[65vh] overflow-y-auto space-y-4 text-gray-800 bg-white leading-normal">
            <h2 className="text-xl sm:text-2xl font-black text-[#900000] uppercase tracking-wide border-b border-gray-100 pb-3">
              TERMS & CONDITIONS
            </h2>

            <div className="space-y-4 text-gray-700 text-xs sm:text-sm">
              <p className="leading-relaxed">
                <strong className="font-extrabold text-gray-900">1. Shipping:</strong> Direct dispatch from Sivakasi warehouse within 5–7 working days.
              </p>

              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 space-y-1">
                <strong className="font-extrabold text-[#900000] flex items-center gap-1.5 text-xs sm:text-sm">
                  🚚 2. Transport Charges:
                </strong>
                <p className="text-gray-700 text-xs leading-relaxed">
                  Transport charges are payable entirely by the customer directly at the transport office upon parcel collection. The transport service operates independently from our shop.
                </p>
              </div>

              <p className="leading-relaxed">
                <strong className="font-extrabold text-gray-900">3. Payments:</strong> 100% advance payment required before dispatch.
              </p>

              <p className="leading-relaxed">
                <strong className="font-extrabold text-gray-900">4. Pricing & Taxes:</strong> Prices are subject to industry-based changes without notice. GST is applicable on all orders outside Tamil Nadu.
              </p>

              <p className="leading-relaxed">
                <strong className="font-extrabold text-gray-900">5. Stock Availability:</strong> If an item goes out of stock, we reserve the right to replace it with a product of equal or higher value. We will attempt to notify you.
              </p>

              <p className="leading-relaxed">
                <strong className="font-extrabold text-gray-900">6. Returns:</strong> No returns accepted once goods are dispatched.
              </p>

              <div className="pt-2 border-t border-gray-100 text-center">
                <Link 
                  to="/terms" 
                  onClick={() => setShowTermsModal(false)}
                  className="text-xs font-extrabold text-[#900000] hover:underline"
                >
                  Read Full Transport Charges & Terms & Conditions →
                </Link>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-3 justify-end items-center">
            <Button
              variant="outline"
              onClick={() => setShowTermsModal(false)}
              className="w-full sm:w-auto border-gray-300 text-gray-700 font-bold py-2.5 px-5 text-xs uppercase rounded-md"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAndSubmitTerms}
              className="w-full sm:w-auto bg-[#900000] hover:bg-[#700000] text-white font-bold tracking-wider py-2.5 px-6 rounded-md uppercase text-xs shadow-md flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirm & Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Popup Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-sm w-[90vw] sm:max-w-sm rounded-2xl p-6 text-center border border-gray-100 shadow-2xl bg-white font-sans">
          <div className="flex flex-col items-center justify-center py-2">
            {/* Green Checkmark Circle */}
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center mb-5 animate-in zoom-in-50 duration-300">
              <Check className="w-10 h-10 text-emerald-500 stroke-[3]" />
            </div>

            <DialogTitle className="text-2xl font-black text-gray-900 tracking-wide mb-2">
              Success!
            </DialogTitle>

            <DialogDescription className="text-sm text-gray-600 leading-relaxed mb-6 font-medium max-w-[260px]">
              You enquiry request <strong className="text-[#900000] font-bold">#{completedOrderNumber}</strong> was submitted successfully
            </DialogDescription>

            <Button
              onClick={handleCloseSuccessModal}
              className="w-full sm:w-36 bg-[#900000] hover:bg-[#700000] text-white font-black tracking-wider py-3 rounded-xl uppercase text-xs shadow-md transition-all cursor-pointer"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
};

export default CartDrawer;
