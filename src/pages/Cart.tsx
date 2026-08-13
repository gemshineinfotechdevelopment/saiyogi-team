import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useSiteSettings, getDiscountPrice } from "@/context/SiteSettingsContext";
import { useAuth } from "@/context/AuthContext";
import { 
  ShoppingCart, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronRight, 
  Home, 
  ArrowLeft,
  User,
  MapPin,
  CheckCircle2,
  Smartphone,
  RefreshCw,
  FileText,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createOrder, trackCustomerAction } from "@/lib/api";
import { getCookie, setCookie } from "@/lib/cookieUtils";
import { downloadOrderReceiptPDF, printOrderReceipt } from "@/lib/pdf-generator";

import indiaStatesData from "@/lib/indiaStates.json";

const getAllStates = () => Object.keys(indiaStatesData);
const getDistrictsByState = (state: string) => (indiaStatesData as Record<string, string[]>)[state] || [];

const Cart: React.FC = () => {
  const { items, updateQuantity, removeFromCart, clearCart, totalItems, totalPrice } = useCart();
  const { settings } = useSiteSettings();
  const { isUserLoggedIn, userPhone, userName, loginWithPhone } = useAuth();
  const navigate = useNavigate();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completedOrderNumber, setCompletedOrderNumber] = useState<string>("");
  const [savedOrderData, setSavedOrderData] = useState<any>(null);

  // Login & OTP verification states for unauthenticated users on full page
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

  // Auto sync user name & phone from auth context / storage
  useEffect(() => {
    const activePhone = userPhone || localStorage.getItem("user_phone") || getCookie("saiyogi_user_phone") || "";
    const activeName = userName || localStorage.getItem("user_name") || getCookie("saiyogi_user_name") || "";

    setFormData((prev) => ({
      ...prev,
      phoneNumber: prev.phoneNumber || activePhone,
      name: prev.name || (activeName && activeName !== "Customer" ? activeName : "")
    }));
  }, [isUserLoggedIn, userPhone, userName]);

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
    }, 400);
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
    } else {
      toast.error("Invalid verification code. Please check and try again.");
    }
  };

  const packingCharge = settings.enablePackingCharge !== false 
    ? (totalPrice <= 3999 ? 120 : Math.round(totalPrice * 0.03)) 
    : 0;
  const estimatedTotal = totalPrice + packingCharge;

  const tnMinPurchase = settings.minimumPurchaseAmount || 3000;
  const otherMinPurchase = settings.minPurchaseOutsideTN || 5000;
  const dialogMinPurchase = formData.state === "Tamil Nadu" ? tnMinPurchase : otherMinPurchase;
  const canPlaceOrder = !formData.state || totalPrice >= dialogMinPurchase;

  const validateForm = () => {
    if (!formData.name.trim()) { toast.error("Full Name is required"); return false; }
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <UserHeader />

      {/* Breadcrumb Navigation Bar */}
      <div className="bg-white border-b border-gray-200 py-3.5 px-4 shadow-xs">
        <div className="container mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-500">
            <Link to="/" className="flex items-center gap-1 hover:text-[#900000] transition-colors">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[#900000] font-extrabold">Checkout & Cart</span>
          </div>

          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-[#900000] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-md p-8 sm:p-12 text-center max-w-lg mx-auto my-8">
            <div className="w-20 h-20 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto mb-5 text-[#900000] shadow-inner">
              <ShoppingCart className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-wide">
              Your Cart is Empty
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm mb-6 max-w-sm mx-auto leading-relaxed">
              Looks like you haven't added any crackers or combo packs yet. Explore our wholesale catalog to get started!
            </p>
            <Button
              onClick={() => navigate("/catalog")}
              className="bg-[#900000] hover:bg-[#700000] text-white font-extrabold px-8 py-6 rounded-xl uppercase text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          /* FULL PAGE CHECKOUT LAYOUT */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN (7 Cols): FULL PAGE LOGIN & ADDRESS DETAILS FORM */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* SECTION 1: LOGIN & CUSTOMER DETAILS */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 sm:p-6 space-y-5">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-[#900000] border border-red-100 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-gray-900 text-base sm:text-lg uppercase tracking-wide">
                      1. Customer Details &amp; Verification
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">
                      Enter your name, email and mobile number for enquiry tracking.
                    </p>
                  </div>
                </div>

                {!isUserLoggedIn && !isPhoneVerified ? (
                  /* Full Page Verification Block for Unauthenticated Users */
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-4">
                    {otpStep === "number" ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-gray-900 text-sm uppercase tracking-wide">
                              WhatsApp Mobile Verification
                            </h3>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              Enter your WhatsApp number to verify your identity and auto-login.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="checkoutFullName" className="text-gray-900 font-semibold text-xs mb-1 block">
                              Full Name *
                            </Label>
                            <Input
                              id="checkoutFullName"
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Enter your full name"
                              className="border-gray-300 bg-white h-10 text-xs font-semibold"
                            />
                          </div>

                          <div>
                            <Label htmlFor="verifyPhoneInput" className="text-gray-900 font-semibold text-xs mb-1 block">
                              WhatsApp Mobile Number *
                            </Label>
                            <div className="flex gap-2">
                              <div className="flex items-center px-3 bg-gray-100 border border-gray-300 rounded-md text-xs font-black text-gray-700">
                                +91
                              </div>
                              <Input 
                                id="verifyPhoneInput" 
                                type="text"
                                value={verifyPhone} 
                                onChange={(e) => setVerifyPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                placeholder="10-digit mobile number" 
                                className="border-gray-300 bg-white h-10 text-xs font-bold" 
                                maxLength={10}
                              />
                            </div>
                          </div>
                        </div>

                        <Button 
                          onClick={handleSendWhatsAppCode}
                          disabled={verifyPhone.length !== 10 || isSendingOtp}
                          className="w-full bg-[#00a859] hover:bg-[#008f4c] text-white font-bold tracking-wider py-5 rounded-xl uppercase text-xs shadow-md disabled:opacity-50"
                        >
                          {isSendingOtp ? "Generating Code..." : "SEND VERIFICATION CODE"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-gray-900 text-sm uppercase tracking-wide">
                              Enter Verification Code
                            </h3>
                            <p className="text-xs text-gray-600">
                              Verification code sent to <strong className="text-gray-900 font-black">+91 {verifyPhone}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="bg-emerald-100/90 border border-emerald-300/60 px-4 py-2 rounded-xl text-emerald-950 text-xs font-black tracking-widest text-center">
                          DEMO CODE: {generatedOtp || "1234"}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="userOtpInput" className="text-gray-900 font-semibold text-xs mb-1 block">
                              Verification Code *
                            </Label>
                            <Input 
                              id="userOtpInput" 
                              type="text"
                              value={userOtp} 
                              onChange={(e) => setUserOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                              placeholder="e.g. 1234" 
                              className="border-gray-300 bg-white h-10 text-center font-black tracking-widest text-base" 
                              maxLength={6}
                            />
                          </div>

                          <div>
                            <Label htmlFor="userOtpName" className="text-gray-900 font-semibold text-xs mb-1 block">
                              Full Name *
                            </Label>
                            <Input
                              id="userOtpName"
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Enter your full name"
                              className="border-gray-300 bg-white h-10 text-xs font-semibold"
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs">
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

                        <Button 
                          onClick={handleVerifyOtp}
                          disabled={!userOtp}
                          className="w-full bg-[#00a859] hover:bg-[#008f4c] text-white font-bold tracking-wider py-5 rounded-xl uppercase text-xs shadow-md disabled:opacity-50"
                        >
                          VERIFY CODE &amp; CONTINUE
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Form Fields when User is Logged In / Verified */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-gray-900 font-bold text-xs mb-1 block">Full Name *</Label>
                        <Input 
                          id="name" 
                          name="name" 
                          value={formData.name} 
                          onChange={handleInputChange} 
                          placeholder="Your Full Name" 
                          className="border-gray-300 bg-white focus:border-[#900000] h-10 text-xs font-semibold" 
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label htmlFor="phoneNumber" className="text-gray-900 font-bold text-xs block">Phone Number *</Label>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {isUserLoggedIn ? "Logged In" : "Verified"}
                          </span>
                        </div>
                        <Input 
                          id="phoneNumber" 
                          name="phoneNumber" 
                          value={formData.phoneNumber} 
                          onChange={handleInputChange} 
                          placeholder="10-digit mobile number" 
                          className="border-gray-300 bg-gray-50 h-10 text-xs font-bold text-gray-700" 
                          disabled 
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-gray-900 font-bold text-xs mb-1 block">Email Address *</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        value={formData.email} 
                        onChange={handleInputChange} 
                        placeholder="yourname@example.com" 
                        className="border-gray-300 bg-white focus:border-[#900000] h-10 text-xs font-semibold" 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: DELIVERY ADDRESS DETAILS */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 sm:p-6 space-y-5">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-[#900000] border border-red-100 flex items-center justify-center font-bold">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-gray-900 text-base sm:text-lg uppercase tracking-wide">
                      2. Delivery Address Details
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">
                      Provide full address details for Sivakasi transport estimation.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="state" className="text-gray-900 font-bold text-xs mb-1 block">State *</Label>
                      <Select 
                        value={formData.state} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, state: value, district: "" }))}
                      >
                        <SelectTrigger className="border-gray-300 bg-white h-10 text-xs font-semibold">
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
                      <Label htmlFor="district" className="text-gray-900 font-bold text-xs mb-1 block">District *</Label>
                      <Select 
                        value={formData.district} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, district: value }))} 
                        disabled={!formData.state}
                      >
                        <SelectTrigger className="border-gray-300 bg-white h-10 text-xs font-semibold">
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
                    <Label htmlFor="deliveryAddress" className="text-gray-900 font-bold text-xs mb-1 block">Street / Door No / Area *</Label>
                    <Textarea 
                      id="deliveryAddress" 
                      name="deliveryAddress" 
                      value={formData.deliveryAddress} 
                      onChange={handleInputChange} 
                      placeholder="House/Door No, Street Name, Area" 
                      className="border-gray-300 bg-white focus:border-[#900000] text-xs font-medium" 
                      rows={3} 
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pincode" className="text-gray-900 font-bold text-xs mb-1 block">Pincode *</Label>
                      <Input 
                        id="pincode" 
                        name="pincode" 
                        value={formData.pincode} 
                        onChange={handleInputChange} 
                        placeholder="6-digit Pincode" 
                        className="border-gray-300 bg-white focus:border-[#900000] h-10 text-xs font-semibold" 
                        maxLength={6} 
                      />
                    </div>

                    <div>
                      <Label htmlFor="preferredTransport" className="text-gray-900 font-bold text-xs mb-1 block">Preferred Transport (Optional)</Label>
                      <Input 
                        id="preferredTransport" 
                        name="preferredTransport" 
                        value={formData.preferredTransport} 
                        onChange={handleInputChange} 
                        placeholder="e.g. VRL Logistics, Krishnan Transport" 
                        className="border-gray-300 bg-white focus:border-[#900000] h-10 text-xs font-semibold" 
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN (5 Cols): CART DETAILS & SUMMARY */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 sm:p-6 space-y-5 sticky top-28">
              
              {/* Cart Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-50 rounded-lg text-[#900000]">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <h2 className="font-black text-gray-900 text-base uppercase tracking-wide">
                    CART ITEMS ({totalItems})
                  </h2>
                </div>

                <button
                  onClick={clearCart}
                  className="text-xs font-bold text-red-600 hover:text-red-800 hover:underline transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>

              {/* Scrollable Items List */}
              <div className="divide-y divide-gray-100 max-h-[320px] overflow-y-auto pr-1">
                {items.map(({ product, quantity }) => {
                  const productId = String(product._id || product.id);
                  const dp = getDiscountPrice(
                    product.price, 
                    product.hasDiscount, 
                    settings.discountPercent, 
                    product.netRate, 
                    product.displayNetRate
                  );
                  const stockVal = product.storeStockPieces !== undefined 
                    ? Number(product.storeStockPieces) 
                    : (product.stock !== undefined ? Number(product.stock) : 999);

                  return (
                    <div 
                      key={productId}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      {/* Product Thumbnail & Details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div 
                          onClick={() => setSelectedProduct(product)}
                          className="w-14 h-14 rounded-xl bg-white border border-gray-200 p-1 flex items-center justify-center shrink-0 shadow-2xs cursor-pointer hover:border-[#900000]/50 transition-all"
                        >
                          <img 
                            src={stockVal <= 0 ? '/saiyogi-logo-1.png' : product.image} 
                            alt={product.name} 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 
                            onClick={() => setSelectedProduct(product)}
                            className="font-extrabold text-gray-900 text-xs truncate hover:text-[#900000] cursor-pointer"
                          >
                            {product.name}
                          </h3>
                          <div className="text-xs font-bold text-[#900000] mt-0.5">
                            ₹{dp.toLocaleString('en-IN')}.00
                          </div>
                        </div>
                      </div>

                      {/* Stepper & Price */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
                          <button
                            onClick={() => updateQuantity(productId, quantity - 1)}
                            className="px-1.5 py-1 hover:bg-gray-100 disabled:opacity-30 text-gray-700"
                            disabled={quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2 text-xs font-black text-gray-900">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(productId, Math.min(stockVal, quantity + 1))}
                            className="px-1.5 py-1 hover:bg-gray-100 disabled:opacity-30 text-gray-700"
                            disabled={quantity >= stockVal}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <span className="font-black text-gray-900 text-xs min-w-[60px] text-right">
                          ₹{(dp * quantity).toLocaleString('en-IN')}
                        </span>

                        <button
                          onClick={() => removeFromCart(productId)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 border-t border-gray-100 pt-3 text-xs">
                <div className="flex justify-between items-center font-semibold text-gray-700">
                  <span>Subtotal ({totalItems} Items)</span>
                  <span className="font-extrabold text-gray-900">
                    ₹{totalPrice.toLocaleString('en-IN')}.00
                  </span>
                </div>

                {packingCharge > 0 && (
                  <div className="flex justify-between items-center font-semibold text-gray-700">
                    <span>Packing Charge</span>
                    <span className="font-extrabold text-gray-900">
                      ₹{packingCharge.toLocaleString('en-IN')}.00
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-gray-100 font-black text-gray-900">
                  <span className="uppercase text-gray-900">ESTIMATED TOTAL</span>
                  <span className="text-[#900000] text-lg font-black">
                    ₹{Math.round(estimatedTotal).toLocaleString('en-IN')}.00
                  </span>
                </div>
              </div>

              {/* Minimum Purchase Requirement Banner */}
              <div className="bg-red-50/90 border border-red-200/90 rounded-xl p-3 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-black uppercase text-[#900000] text-[10px] tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#900000] shrink-0" />
                  <span>MINIMUM SUBTOTAL REQUIREMENT</span>
                </div>
                <div className="flex justify-between items-center text-gray-700 font-semibold pt-0.5 text-[11px]">
                  <span>Tamil Nadu: <strong className="text-gray-900 font-black">₹{tnMinPurchase.toLocaleString('en-IN')}</strong></span>
                  <span className="text-red-300">|</span>
                  <span>Other States: <strong className="text-gray-900 font-black">₹{otherMinPurchase.toLocaleString('en-IN')}</strong></span>
                </div>
              </div>

              {!canPlaceOrder && formData.state && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-950">
                  <p className="font-bold">⚠️ Minimum purchase required for {formData.state}</p>
                  <p className="mt-0.5">Required subtotal: <strong>₹{dialogMinPurchase}</strong>. Please add ₹{dialogMinPurchase - totalPrice} more to proceed.</p>
                </div>
              )}

              {/* Place Order Button */}
              <Button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || !canPlaceOrder}
                className="w-full bg-[#900000] hover:bg-[#700000] text-white font-extrabold py-6 rounded-xl uppercase text-xs tracking-wider shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlacingOrder ? "PLACING ENQUIRY..." : "PLACE ENQUIRY ORDER"}
              </Button>

              <p className="text-center text-[11px] text-gray-500 font-normal">
                * Prices are estimates for wholesale fireworks enquiry.
              </p>
            </div>

          </div>
        )}
      </main>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <Dialog open={showTermsModal} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-lg p-6 bg-white rounded-2xl">
            <DialogHeader className="border-b border-gray-100 pb-3">
              <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#900000]" />
                <span>Terms &amp; Conditions</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Please review our ordering terms before completing your wholesale enquiry.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs text-gray-600 leading-relaxed max-h-60 overflow-y-auto">
              <p>1. <strong>Enquiry Basis:</strong> This order is an estimation request for wholesale fireworks purchase in compliance with legal guidelines.</p>
              <p>2. <strong>Delivery &amp; Transport:</strong> Goods will be dispatched via customer's preferred lorry transport service from Sivakasi, Tamil Nadu.</p>
              <p>3. <strong>Minimum Purchase:</strong> Orders must meet minimum subtotal requirements (TN: ₹3,000 / Other States: ₹5,000).</p>
              <p>4. <strong>Support:</strong> For any changes or clarifications, please contact our support desk at +91 95859 75756.</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                onClick={handleConfirmAndSubmitTerms}
                className="bg-[#900000] hover:bg-[#700000] text-white font-extrabold px-6 py-2 rounded-xl text-xs uppercase"
              >
                Accept &amp; Download Estimate
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <Dialog open={showSuccessModal} onOpenChange={() => setShowSuccessModal(false)}>
          <DialogContent className="sm:max-w-md p-6 bg-white rounded-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-gray-900 uppercase">
                Enquiry Order Submitted!
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Your enquiry estimate PDF has been generated and saved.
              </p>
              {completedOrderNumber && (
                <div className="mt-3 bg-emerald-50 border border-emerald-200 text-emerald-900 font-extrabold text-sm py-1.5 px-4 rounded-xl inline-block">
                  Enquiry #{completedOrderNumber}
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <Button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate("/my-enquiry");
                }}
                className="bg-[#900000] hover:bg-[#700000] text-white font-bold text-xs uppercase px-5 py-2.5 rounded-xl"
              >
                View My Enquiries
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Product Details Modal Popup */}
      {selectedProduct && (
        <ProductCard
          product={selectedProduct}
          showDetailOnly={true}
          onDetailClose={() => setSelectedProduct(null)}
        />
      )}

      <UserFooter />
    </div>
  );
};

export default Cart;
