import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import {
  Gift, Users, ArrowRight, ShieldCheck, CheckCircle2, Clock,
  AlertCircle, ChevronRight, Phone, Mail, MapPin, User, LogIn, Lock,
  Plus, Minus, Trash2, Calendar, DollarSign, FileText, ArrowLeft,
  Sparkles, Check, X, Printer, Download, Receipt
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import {
  getChitSchemes,
  submitChitSubscription,
  getChitSubscriptions,
  ChitSchemeItem,
  ChitSubscriptionItem,
  ChitSubscribedSchemeItem,
  trackCustomerAction
} from "@/lib/api";
import { toast } from "sonner";
import { calculatePaymentTimingStatus, downloadChitReceiptPDF } from "@/lib/chitUtils";
import { ChitReceiptModal, ChitReceiptData } from "@/components/admin/ChitReceiptModal";

interface SchemeOption {
  id: string;
  title: string;
  description: string;
  startDate: string;
  totalMonths: number;
  dueDateDay: number;
  monthlyAmount: number;
}

interface BannerImage {
  id: string;
  url: string;
  title: string;
  monthlyAmount?: number;
}

interface SelectedSchemeEnrollment {
  schemeId: string;
  schemeName: string;
  monthlyAmount: number;
  totalMonths: number;
  dueDateDay: number;
  personCount: number;
}

const DEFAULT_SCHEMES: SchemeOption[] = [
  {
    id: "default-1",
    title: "Diwali Special Savings Scheme 2026",
    description: "Save monthly and receive crackers bonus packages with bumper gifts!",
    startDate: "2026-01-01",
    totalMonths: 10,
    dueDateDay: 10,
    monthlyAmount: 3000
  },
  {
    id: "default-2",
    title: "Diwali Family Savings Scheme",
    description: "Affordable monthly plan for family celebrations.",
    startDate: "2026-01-01",
    totalMonths: 10,
    dueDateDay: 10,
    monthlyAmount: 2000
  },
  {
    id: "default-3",
    title: "Diwali Economy Savings Scheme",
    description: "Budget-friendly installment plan for everyone.",
    startDate: "2026-01-01",
    totalMonths: 10,
    dueDateDay: 10,
    monthlyAmount: 1000
  }
];

export const getMonthNameForIndex = (
  monthIndex: number,
  startDateStr?: string
): { monthName: string; dueDateStr: string } => {
  if (startDateStr && startDateStr.trim()) {
    const parts = startDateStr.trim().split('-');
    if (parts.length >= 2) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y) && !isNaN(m)) {
        const targetDate = new Date(y, m + (monthIndex - 1), 1);
        const monthName = targetDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        return { monthName, dueDateStr: monthName };
      }
    }

    const start = new Date(startDateStr);
    if (!isNaN(start.getTime())) {
      const targetDate = new Date(start.getFullYear(), start.getMonth() + (monthIndex - 1), 1);
      const monthName = targetDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      return { monthName, dueDateStr: monthName };
    }
  }
  return { monthName: `Month ${monthIndex}`, dueDateStr: `Month ${monthIndex}` };
};

const ChitScheme: React.FC = () => {
  const { isUserLoggedIn, userPhone, userName, loginWithPhone, openLoginModal } = useAuth();
  const [schemes, setSchemes] = useState<SchemeOption[]>([]);
  const [bannerImages, setBannerImages] = useState<BannerImage[]>([]);
  const [activeZoomImage, setActiveZoomImage] = useState<BannerImage | null>(null);
  const [userSubscriptions, setUserSubscriptions] = useState<ChitSubscriptionItem[]>([]);

  // Multi-Scheme Enrollment State
  const [selectedSchemes, setSelectedSchemes] = useState<SelectedSchemeEnrollment[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    location: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPurchasedModal, setShowPurchasedModal] = useState(false);
  const [selectedPassbookSub, setSelectedPassbookSub] = useState<ChitSubscriptionItem | null>(null);
  const [selectedPassbookScheme, setSelectedPassbookScheme] = useState<ChitSubscribedSchemeItem | null>(null);
  const [submittedData, setSubmittedData] = useState<any>(null);

  // Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState<ChitReceiptData | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  // Auto-fill customer form from login or local storage
  useEffect(() => {
    if (isUserLoggedIn) {
      setFormData(prev => ({
        name: prev.name || userName || "",
        phone: prev.phone || userPhone || "",
        email: prev.email || localStorage.getItem("user_email") || "",
        location: prev.location || localStorage.getItem("user_location") || ""
      }));
    }
  }, [isUserLoggedIn, userPhone, userName]);

  // Fetch logged in user subscriptions
  const loadUserSubscriptions = () => {
    const cleanPhone = (userPhone || formData.phone || localStorage.getItem("user_phone") || "").replace(/\D/g, "").slice(-10);
    if (cleanPhone && cleanPhone.length === 10) {
      getChitSubscriptions()
        .then(allSubs => {
          const mySubs = allSubs.filter(s => {
            const p = String(s.phone || "").replace(/\D/g, "").slice(-10);
            return p === cleanPhone;
          });
          setUserSubscriptions(mySubs);
        })
        .catch(err => console.warn("Failed to fetch user subscriptions:", err));
    } else {
      setUserSubscriptions([]);
    }
  };

  useEffect(() => {
    loadUserSubscriptions();
  }, [isUserLoggedIn, userPhone, formData.phone]);

  useEffect(() => {
    if (isUserLoggedIn && userPhone) {
      trackCustomerAction({
        phone: userPhone,
        name: userName || undefined,
        source: "chit_scheme"
      }).catch(err => console.warn("Failed to track chit scheme action:", err));
    }
  }, [isUserLoggedIn, userPhone, userName]);

  // Load Active Schemes from Backend
  useEffect(() => {
    const loadChit = () => {
      getChitSchemes()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const schemeList = data
              .filter((item: ChitSchemeItem) => item.title || item.schemeName)
              .map((item: ChitSchemeItem) => ({
                id: item._id || item.id || '',
                title: item.title || item.schemeName || '',
                description: item.description || '',
                startDate: item.startDate || '',
                totalMonths: item.totalMonths || item.numberOfMonths || 10,
                dueDateDay: item.dueDateDay || item.paymentDueDay || 10,
                monthlyAmount: item.monthlyAmount || 0
              }));

            const imageList = data
              .filter((item: ChitSchemeItem) => item.url && item.url.trim().length > 0)
              .map((item: ChitSchemeItem) => ({
                id: item._id || item.id || '',
                url: item.url || '',
                title: item.title || item.schemeName || '',
                monthlyAmount: item.monthlyAmount || 0
              }));

            const finalSchemes = schemeList.length > 0 ? schemeList : DEFAULT_SCHEMES;
            setSchemes(finalSchemes);
            setBannerImages(imageList);
          } else {
            setSchemes(DEFAULT_SCHEMES);
            setBannerImages([]);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch chit schemes from API:", err);
          setSchemes(DEFAULT_SCHEMES);
        });
    };

    loadChit();
    const interval = setInterval(loadChit, 15000);
    return () => clearInterval(interval);
  }, []);

  // Multi-Scheme Management Helpers
  const handleAddScheme = (schemeTitle: string) => {
    const matched = schemes.find(s => s.title === schemeTitle);
    if (!matched) return;

    setSelectedSchemes(prev => {
      const existingIdx = prev.findIndex(s => s.schemeName === matched.title);
      if (existingIdx > -1) {
        // Increment person count if already present
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          personCount: updated[existingIdx].personCount + 1
        };
        toast.info(`Increased person count for ${matched.title} to ${updated[existingIdx].personCount}`);
        return updated;
      } else {
        toast.success(`Added ${matched.title} to your enrollment`);
        return [
          ...prev,
          {
            schemeId: matched.id,
            schemeName: matched.title,
            monthlyAmount: matched.monthlyAmount,
            totalMonths: matched.totalMonths || 10,
            dueDateDay: matched.dueDateDay || 10,
            personCount: 1
          }
        ];
      }
    });

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleRemoveScheme = (index: number) => {
    setSelectedSchemes(prev => prev.filter((_, i) => i !== index));
    toast.info("Scheme removed from your selection.");
  };

  const handlePersonCountChange = (index: number, newCount: number) => {
    const count = Math.max(1, parseInt(String(newCount), 10) || 1);
    setSelectedSchemes(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], personCount: count };
      }
      return updated;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Aggregated Calculations
  const totalPersons = selectedSchemes.reduce((sum, s) => sum + (s.personCount || 1), 0);
  const combinedMonthlyAmount = selectedSchemes.reduce((sum, s) => sum + (s.monthlyAmount * (s.personCount || 1)), 0);
  const combinedGrandTotal = selectedSchemes.reduce(
    (sum, s) => sum + (s.monthlyAmount * (s.personCount || 1) * (s.totalMonths || 10)),
    0
  );

  // Validate and open confirmation dialog
  const handleInitiateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isUserLoggedIn) {
      toast.error("Please log in with your mobile number to enroll in chit schemes.");
      openLoginModal();
      return;
    }

    if (selectedSchemes.length === 0) {
      toast.error("Please select at least one chit scheme");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!formData.phone.trim() || formData.phone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!formData.location.trim()) {
      toast.error("Please enter your location (City/District)");
      return;
    }

    setShowConfirmModal(true);
  };

  // Submit Application
  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        location: formData.location.trim(),
        schemes: selectedSchemes.map(s => ({
          schemeId: s.schemeId,
          schemeName: s.schemeName,
          monthlyAmountPerPerson: s.monthlyAmount,
          monthlyAmount: s.monthlyAmount,
          personCount: s.personCount,
          totalMonths: s.totalMonths,
          durationMonths: s.totalMonths,
          dueDateDay: s.dueDateDay
        })),
        totalPersons,
        combinedMonthlyAmount,
        combinedGrandTotal
      };

      const result = await submitChitSubscription(payload);

      // Auto login user with credentials if not logged in
      if (!isUserLoggedIn) {
        loginWithPhone(formData.phone.trim(), formData.name.trim());
      }

      if (formData.email) localStorage.setItem("user_email", formData.email.trim());
      if (formData.location) localStorage.setItem("user_location", formData.location.trim());

      setSubmittedData(result);
      setShowSuccessModal(true);
      toast.success("Chit scheme application submitted successfully! 🎉");

      // Refresh subscriptions list
      loadUserSubscriptions();
      setSelectedSchemes([]);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit chit scheme application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9FC]">
      <UserHeader />

      {/* Breadcrumb Header Bar */}
      <div className="bg-[#F8F7FA] border-b border-gray-200/80 py-3.5 px-4 sm:px-12">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-xs text-gray-600 font-medium">
          <Link to="/" className="hover:text-[#4C1D95] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#4C1D95] font-bold">Chit Scheme</span>
        </div>
      </div>

      <main className="flex-1 py-10 px-4 sm:px-12 max-w-6xl mx-auto w-full">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-[#7A1416] flex items-center justify-center border border-amber-200 shadow-2xs shrink-0">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1B54]">
                Sai Yogi Chit Scheme
              </h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Multiple Persons &amp; Bulk Enrollment Available • Join our monthly savings scheme &amp; unlock bonus fireworks gifts!
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isUserLoggedIn && (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 text-emerald-950 px-3.5 py-2 rounded-2xl text-xs font-bold shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Logged in as: <strong className="text-emerald-900">{userName || 'Customer'}</strong> ({userPhone})</span>
              </div>
            )}
            {userSubscriptions.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPurchasedModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>View Purchased Schemes ({userSubscriptions.length})</span>
              </button>
            )}
            {!isUserLoggedIn && (
              <button
                type="button"
                onClick={openLoginModal}
                className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-amber-700" />
                <span>Login / Register</span>
              </button>
            )}
          </div>
        </div>

        {!isUserLoggedIn ? (
          <div className="bg-white border border-gray-200/90 rounded-3xl p-8 sm:p-12 shadow-sm text-center max-w-2xl mx-auto my-8 space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-[#7A1416] flex items-center justify-center mx-auto border border-amber-200 shadow-2xs">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-[#2A1B54]">
                Customer Login Required
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed max-w-lg mx-auto font-medium">
                Please log in with your WhatsApp mobile number to view our chit schemes, verify your identity, and submit your chit enrollment request. Only authenticated customers can submit applications and track their monthly passbook.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={openLoginModal}
                className="w-full sm:w-auto bg-[#7A1416] hover:bg-[#900000] text-white text-xs font-extrabold px-8 py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider active:scale-95"
              >
                <LogIn className="w-4 h-4 text-amber-300" />
                <span>Login with Mobile Number</span>
              </button>
            </div>
            <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/60 space-y-1">
                <span className="text-xs font-extrabold text-amber-950 block">🔒 Verified Account</span>
                <span className="text-[11px] text-gray-500 font-medium">Applications are safely linked to your verified phone number.</span>
              </div>
              <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/60 space-y-1">
                <span className="text-xs font-extrabold text-amber-950 block">📱 Digital Passbook</span>
                <span className="text-[11px] text-gray-500 font-medium">Track approved schemes and monthly installment due dates.</span>
              </div>
              <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/60 space-y-1">
                <span className="text-xs font-extrabold text-amber-950 block">📄 Official Receipts</span>
                <span className="text-[11px] text-gray-500 font-medium">View and download authorized payment receipts instantly.</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* If user has purchased/pending schemes: show quick passbook banner */}
            {userSubscriptions.length > 0 && (
              <div className="mb-8 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/70 border border-emerald-300 rounded-3xl p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-emerald-950">
                      You Have {userSubscriptions.length} Enrolled Chit Application{userSubscriptions.length > 1 ? "s" : ""}
                    </h3>
                    <p className="text-xs text-emerald-700 font-medium mt-0.5">
                      View your digital passbook, payment schedule, installment progress, and download official receipts.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPurchasedModal(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-2xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
                >
                  <span>Open Digital Passbook</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Main Content Layout: Multi-Scheme Registration Form (5 Cols) + Scheme Cards (7 Cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Enhanced Multi-Scheme Enrollment Form (5 Cols) */}
              <div ref={formRef} className="lg:col-span-5 bg-white border border-gray-200 rounded-3xl p-6 sm:p-7 shadow-md space-y-6 lg:sticky lg:top-6">
                <div className="border-b border-gray-100 pb-4">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 px-3 py-1 rounded-full inline-block mb-2">
                    Multiple Persons / Bulk Enrollment
                  </span>
                  <h2 className="text-xl font-extrabold text-gray-900">
                    Enroll in Chit Scheme
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Select one or multiple schemes with custom person counts in a single application!
                  </p>
                </div>

                <form onSubmit={handleInitiateSubmit} className="space-y-5">
                  {/* STEP 1: CUSTOMER INFORMATION */}
                  <div className="space-y-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-200/80">
                    <div className="font-extrabold text-[#7A1416] text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>Step 1: Customer Information</span>
                    </div>

                    {/* Full Name */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-gray-700 uppercase">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          name="name"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full text-xs font-semibold p-2.5 pl-8 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none"
                          required
                        />
                      </div>
                    </div>

                    {/* Mobile Number */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="block text-[11px] font-bold text-gray-700 uppercase">
                          Mobile Number *
                        </label>
                        {userPhone && (
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ✓ Verified Account Phone
                          </span>
                        )}
                      </div>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 font-bold text-xs text-gray-500">
                          +91
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          placeholder="10-digit mobile"
                          value={formData.phone}
                          onChange={handleInputChange}
                          maxLength={10}
                          readOnly={Boolean(userPhone)}
                          className={`w-full text-xs font-bold p-2.5 pl-11 rounded-xl outline-none border ${
                            userPhone
                              ? "bg-gray-100 text-gray-700 border-gray-300 cursor-not-allowed select-none"
                              : "bg-white border-gray-300"
                          }`}
                          required
                        />
                      </div>
                    </div>

                {/* Email & Location Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">
                      Email ID
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Email (optional)"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">
                      Location *
                    </label>
                    <input
                      type="text"
                      name="location"
                      placeholder="City/District"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full text-xs font-medium p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* STEP 2: SELECT SCHEMES & PERSON COUNTS (MULTI-SCHEME SELECTOR) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-[#7A1416] text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5" />
                    <span>Step 2: Choose Schemes & Persons ({selectedSchemes.length} Selected)</span>
                  </div>
                  {selectedSchemes.length > 0 && (
                    <span className="text-[11px] text-gray-500 font-bold">
                      Total Persons: <strong className="text-amber-900 font-extrabold">{totalPersons}</strong>
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-gray-500 font-medium">
                  Select 1 or more schemes below. You can enroll multiple persons under each scheme:
                </p>

                {/* List all available schemes with individual select/person count controls */}
                <div className="space-y-3">
                  {schemes.map((sch) => {
                    const selectedIndex = selectedSchemes.findIndex(s => s.schemeName === sch.title);
                    const isSelected = selectedIndex > -1;
                    const selectedItem = isSelected ? selectedSchemes[selectedIndex] : null;
                    const count = selectedItem ? selectedItem.personCount : 1;
                    const monthlySubtotal = sch.monthlyAmount * count;
                    const grandSubtotal = monthlySubtotal * (sch.totalMonths || 10);

                    return (
                      <div
                        key={sch.id}
                        className={`rounded-2xl p-3.5 border-2 transition-all space-y-2.5 ${
                          isSelected
                            ? "bg-amber-50/50 border-[#7A1416] shadow-sm ring-1 ring-[#7A1416]/20"
                            : "bg-white border-gray-200 hover:border-amber-300"
                        }`}
                      >
                        {/* Header Row: Title & Toggle Button */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                isSelected ? "bg-[#7A1416] text-white" : "border-2 border-gray-300 text-transparent"
                              }`}>
                                ✓
                              </span>
                              <h4 className="text-xs font-black text-[#2A1B54]">
                                {sch.title}
                              </h4>
                            </div>
                            <div className="text-[11px] text-gray-500 font-medium pl-5 mt-0.5">
                              ₹{sch.monthlyAmount.toLocaleString()} / person / mo • {sch.totalMonths || 10} Months
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                handleRemoveScheme(selectedIndex);
                              } else {
                                handleAddScheme(sch.title);
                              }
                            }}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-rose-100 hover:bg-rose-200 text-rose-700"
                                : "bg-[#7A1416] hover:bg-[#900000] text-white shadow-2xs"
                            }`}
                          >
                            {isSelected ? "Remove ✕" : "+ Select"}
                          </button>
                        </div>

                        {/* If Selected: Person Count Stepper & Calculation */}
                        {isSelected && (
                          <div className="bg-white border border-amber-200 rounded-xl p-2.5 space-y-2 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-[#7A1416]" />
                                <span>Person Count:</span>
                              </span>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handlePersonCountChange(selectedIndex, count - 1)}
                                  disabled={count <= 1}
                                  className="w-7 h-7 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 border border-gray-300 rounded-lg flex items-center justify-center font-bold text-gray-700 cursor-pointer shadow-2xs"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  value={count}
                                  onChange={(e) => handlePersonCountChange(selectedIndex, parseInt(e.target.value, 10) || 1)}
                                  className="w-14 text-center font-black text-xs p-1 bg-white border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-[#7A1416]"
                                />
                                <button
                                  type="button"
                                  onClick={() => handlePersonCountChange(selectedIndex, count + 1)}
                                  className="w-7 h-7 bg-[#7A1416] hover:bg-[#900000] text-white rounded-lg flex items-center justify-center font-bold cursor-pointer shadow-2xs"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-gray-100">
                              <span className="text-gray-500 font-medium">
                                Monthly: <strong className="text-emerald-700 font-extrabold">₹{monthlySubtotal.toLocaleString()}</strong> ({count}p × ₹{sch.monthlyAmount.toLocaleString()})
                              </span>
                              <span className="text-gray-500 font-medium">
                                Total: <strong className="text-[#2A1B54] font-extrabold">₹{grandSubtotal.toLocaleString()}</strong>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STEP 3: APPLICATION SUMMARY */}
              {selectedSchemes.length > 0 ? (
                <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-4 space-y-2.5 text-xs">
                  <div className="font-extrabold text-amber-950 uppercase tracking-wider text-[11px] border-b border-amber-200 pb-1 flex justify-between items-center">
                    <span>Application Summary</span>
                    <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-black text-[10px]">
                      {totalPersons} Total Person(s)
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px]">
                    {selectedSchemes.map((s, idx) => (
                      <div key={idx} className="flex justify-between text-gray-700">
                        <span>{s.schemeName} ({s.personCount}p × ₹{s.monthlyAmount.toLocaleString()}):</span>
                        <strong className="text-gray-900 font-mono">₹{(s.monthlyAmount * s.personCount).toLocaleString()}/mo</strong>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-amber-300/80 flex items-center justify-between">
                    <span className="font-extrabold text-gray-800 text-xs">Combined Monthly Payment:</span>
                    <strong className="text-emerald-700 text-base font-black">
                      ₹{combinedMonthlyAmount.toLocaleString()} / month
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-600">
                    <span>Combined Scheme Total:</span>
                    <strong className="text-[#2A1B54] font-black">₹{combinedGrandTotal.toLocaleString()}</strong>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 text-center text-gray-500 text-xs font-medium">
                  Select 1 or more schemes above to calculate monthly installment.
                </div>
              )}

              {/* STEP 4: SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isSubmitting || selectedSchemes.length === 0}
                className="w-full bg-[#7A1416] hover:bg-[#900000] text-white font-extrabold text-xs py-3.5 px-6 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>
                  {isSubmitting
                    ? "Submitting Application..."
                    : selectedSchemes.length === 0
                    ? "Please Select at Least 1 Scheme"
                    : `Submit Application (₹${combinedMonthlyAmount.toLocaleString()} / mo for ${totalPersons} person${totalPersons > 1 ? "s" : ""})`}
                </span>
              </button>
            </form>
          </div>

          {/* Right Column: Promotional Banners & Dynamic Scheme Cards (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
              {/* Promotional Offer Banner Images */}
              {bannerImages.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-[#2A1B54] uppercase tracking-wide flex items-center gap-2">
                      <Gift className="w-4 h-4 text-[#7A1416]" />
                      <span>Promotional Chit Offers &amp; Gift Schemes</span>
                    </h3>
                    <span className="text-[11px] text-gray-400 font-medium">Click banner to zoom</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {bannerImages.map((banner) => (
                      <div
                        key={banner.id}
                        onClick={() => setActiveZoomImage(banner)}
                        className="group relative overflow-hidden rounded-2xl border-2 border-amber-200/90 bg-white shadow-2xs hover:shadow-lg transition-all duration-300 cursor-pointer"
                      >
                        <div className="aspect-[4/3] w-full overflow-hidden bg-gray-50 flex items-center justify-center">
                          <img
                            src={banner.url}
                            alt={banner.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-3 bg-white border-t border-gray-100 flex items-center justify-between">
                          <span className="font-extrabold text-[#2A1B54] text-xs truncate max-w-[200px]">
                            {banner.title}
                          </span>
                          <span className="text-[10px] font-bold text-[#7A1416] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Zoom 🔍
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Active Schemes Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-[#2A1B54] uppercase tracking-wide flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Available Chit Schemes ({schemes.length})</span>
                  </h3>
                  <span className="text-[11px] text-gray-500 font-medium">Click a scheme card to add or enroll</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {schemes.map((sch) => {
                    const isSelected = selectedSchemes.some(s => s.schemeName === sch.title);
                    const selectedItem = selectedSchemes.find(s => s.schemeName === sch.title);

                    return (
                      <div
                        key={sch.id}
                        onClick={() => handleAddScheme(sch.title)}
                        className={`bg-white rounded-3xl p-5 border-2 transition-all shadow-2xs cursor-pointer flex flex-col justify-between space-y-4 group ${
                          isSelected
                            ? "border-[#7A1416] bg-amber-50/20 shadow-md ring-2 ring-[#7A1416]/10"
                            : "border-gray-200 hover:border-[#7A1416] hover:shadow-md"
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <span className="bg-amber-100 text-amber-900 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                              {sch.totalMonths || 10} Months Plan
                            </span>
                            {isSelected && (
                              <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                                <Check className="w-3 h-3 stroke-[3]" /> Added ({selectedItem?.personCount}p)
                              </span>
                            )}
                          </div>

                          <div>
                            <h4 className="text-base font-extrabold text-[#2A1B54] group-hover:text-[#7A1416] transition-colors">
                              {sch.title}
                            </h4>
                            <p className="text-xs text-gray-500 font-medium mt-1 line-clamp-2">
                              {sch.description || "Join our monthly savings scheme & unlock exclusive Diwali bonus perks!"}
                            </p>
                          </div>

                          <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 text-xs space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-gray-500 font-medium">Monthly Installment:</span>
                              <strong className="text-emerald-700 font-extrabold">₹{sch.monthlyAmount.toLocaleString()} / person</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500 font-medium">Total Duration:</span>
                              <strong className="text-gray-900 font-semibold">{sch.totalMonths || 10} Months</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500 font-medium">Due Day:</span>
                              <strong className="text-gray-900 font-semibold">Before {sch.dueDateDay || 10}th of month</strong>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-gray-200">
                              <span className="text-gray-500 font-medium">Total Scheme Value:</span>
                              <strong className="text-[#2A1B54] font-black">₹{(sch.monthlyAmount * (sch.totalMonths || 10)).toLocaleString()}</strong>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
                            isSelected
                              ? "bg-[#7A1416] text-white"
                              : "bg-gray-100 hover:bg-[#7A1416] hover:text-white text-gray-800"
                          }`}
                        >
                          <span>{isSelected ? "+ Increase Persons" : "Select & Enroll"}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </main>

      {/* CONFIRMATION DIALOG BEFORE SUBMISSION */}
      {showConfirmModal && (
        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent className="max-w-md p-6 bg-white rounded-3xl space-y-4 font-sans">
            <DialogHeader className="space-y-1 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-[#7A1416] mx-auto flex items-center justify-center border-4 border-amber-50">
                <Gift className="w-7 h-7 stroke-[2.5]" />
              </div>
              <DialogTitle className="text-xl font-extrabold text-gray-900">
                Confirm Chit Scheme Application
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-600 font-medium">
                Please review your selected schemes and total persons before confirming.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Customer:</span>
                <strong className="text-gray-900 font-bold">{formData.name} ({formData.phone})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Location:</span>
                <span className="text-gray-800 font-semibold">{formData.location}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 space-y-1">
                <span className="text-[11px] font-extrabold text-[#7A1416] uppercase block">
                  Enrolled Schemes ({selectedSchemes.length}):
                </span>
                {selectedSchemes.map((s, idx) => (
                  <div key={idx} className="flex justify-between text-gray-700">
                    <span>• {s.schemeName} ({s.personCount} Person{s.personCount > 1 ? "s" : ""}):</span>
                    <strong className="text-gray-900">₹{(s.monthlyAmount * s.personCount).toLocaleString()}/mo</strong>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                <span className="font-extrabold text-gray-800">Total Monthly Payment:</span>
                <strong className="text-emerald-700 text-sm font-black">₹{combinedMonthlyAmount.toLocaleString()} / mo</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Back / Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="py-2.5 bg-[#7A1416] hover:bg-[#900000] text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Confirm & Submit"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* SUBMISSION SUCCESS DIALOG */}
      {showSuccessModal && (
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="max-w-md p-6 bg-white rounded-3xl text-center space-y-4 font-sans">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center border-4 border-emerald-50">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <DialogHeader className="space-y-1 text-center">
              <DialogTitle className="text-xl font-bold text-gray-900">
                Application Submitted! 🎉
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-600 font-medium">
                Thank you <strong className="text-gray-900">{submittedData?.name}</strong>. Your application has been registered successfully!
              </DialogDescription>
            </DialogHeader>

            <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Application No:</span>
                <span className="font-mono font-bold text-[#7A1416]">{submittedData?.applicationNumber || "Registered"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Total Persons:</span>
                <span className="font-bold text-gray-900">{submittedData?.totalPersons || totalPersons} Person(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Combined Monthly:</span>
                <span className="font-extrabold text-emerald-700">₹{(submittedData?.combinedMonthlyAmount || combinedMonthlyAmount).toLocaleString()} / month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Status:</span>
                <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                  Pending Admin Approval
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                setShowPurchasedModal(true);
              }}
              className="w-full bg-[#7A1416] hover:bg-[#900000] text-white font-bold py-3 rounded-2xl text-xs transition-all shadow-md cursor-pointer"
            >
              View My Digital Passbook
            </button>
          </DialogContent>
        </Dialog>
      )}

      {/* CUSTOMER DIGITAL PASSBOOK & PURCHASED SCHEMES MODAL */}
      {showPurchasedModal && (
        <Dialog open={showPurchasedModal} onOpenChange={(open) => {
          setShowPurchasedModal(open);
          if (!open) {
            setSelectedPassbookSub(null);
            setSelectedPassbookScheme(null);
          }
        }}>
          <DialogContent className="max-w-4xl p-6 sm:p-8 bg-white rounded-3xl max-h-[90vh] overflow-y-auto space-y-6 font-sans">
            {!selectedPassbookScheme ? (
              /* VIEW 1: LIST OF ENROLLED SCHEMES */
              <div className="space-y-5">
                <DialogHeader className="border-b border-gray-100 pb-4">
                  <DialogTitle className="text-xl font-extrabold text-[#2A1B54] flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    My Digital Chit Passbook ({userSubscriptions.length} Applications)
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-600 font-medium">
                    View all your enrolled schemes, person counts, installment progress, and official payment receipts.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {userSubscriptions.map((sub, sIdx) => {
                    const currentApproval = sub.approvalStatus || (sub.status === 'Paid' || sub.status === 'Approved' ? 'Approved' : (sub.status === 'Rejected' ? 'Rejected' : 'Pending'));
                    const enrolledSchemes: ChitSubscribedSchemeItem[] = (sub.schemes && sub.schemes.length > 0)
                      ? sub.schemes.map(sch => {
                          const persons = Math.max(1, sch.personCount || 1);
                          let monthly = sch.monthlyAmountPerPerson || sch.monthlyAmount || 0;
                          if (monthly === 0 && sch.schemeName) {
                            const match = sch.schemeName.match(/\d+/);
                            if (match) monthly = parseInt(match[0], 10);
                          }
                          const duration = sch.durationMonths || sch.totalMonths || 10;
                          const totalMonthly = sch.totalMonthlyAmount || (monthly * persons);
                          const totalScheme = sch.totalSchemeAmount || (totalMonthly * duration);
                          const validPaidStatuses = ['Paid', 'Late Pay', 'Advanced Payment', 'Advance Payment', 'On-time Payment', 'Delay Payment'];
                          const paidLogs = (sch.monthlyPayments || []).filter(p => validPaidStatuses.includes(p.status));
                          const paidAmount = sch.paidAmount !== undefined ? sch.paidAmount : paidLogs.reduce((sum, p) => sum + (p.amount || p.paidAmount || totalMonthly), 0);
                          return {
                            ...sch,
                            personCount: persons,
                            monthlyAmountPerPerson: monthly,
                            totalMonthlyAmount: totalMonthly,
                            durationMonths: duration,
                            totalMonths: duration,
                            totalSchemeAmount: totalScheme,
                            paidAmount: paidAmount,
                            remainingAmount: Math.max(0, totalScheme - paidAmount),
                            monthsPaid: sch.monthsPaid || paidLogs.length,
                            paidInstallments: sch.monthsPaid || paidLogs.length
                          };
                        })
                      : [{
                          _id: sub._id,
                          schemeId: sub.schemeId,
                          schemeName: sub.schemeName || "Chit Scheme",
                          personCount: Math.max(1, sub.personCount || 1),
                          monthlyAmountPerPerson: (() => {
                            let m = sub.monthlyAmount || 0;
                            if (m === 0 && sub.schemeName) {
                              const match = sub.schemeName.match(/\d+/);
                              if (match) m = parseInt(match[0], 10);
                            }
                            return m;
                          })(),
                          monthlyAmount: sub.monthlyAmount || 0,
                          totalMonthlyAmount: sub.combinedMonthlyAmount || sub.monthlyAmount || 0,
                          durationMonths: 10,
                          totalMonths: 10,
                          dueDateDay: 10,
                          totalSchemeAmount: sub.combinedGrandTotal || ((sub.monthlyAmount || 0) * 10),
                          paidAmount: (sub.monthlyPayments || []).filter(p => ['Paid', 'Late Pay', 'Advanced Payment', 'Advance Payment', 'On-time Payment', 'Delay Payment'].includes(p.status)).reduce((s, p) => s + (p.amount || 0), 0),
                          remainingAmount: Math.max(0, (sub.combinedGrandTotal || ((sub.monthlyAmount || 0) * 10)) - (sub.monthlyPayments || []).filter(p => ['Paid', 'Late Pay', 'Advanced Payment', 'Advance Payment', 'On-time Payment', 'Delay Payment'].includes(p.status)).reduce((s, p) => s + (p.amount || 0), 0)),
                          monthsPaid: sub.monthsPaid || 0,
                          approvalStatus: currentApproval as any,
                          status: sub.status || 'Pending',
                          stage: sub.stage || 'Pending Approval',
                          monthlyPayments: sub.monthlyPayments || []
                        }];

                    const appTotalPersons = enrolledSchemes.reduce((sum, s) => sum + (s.personCount || 1), 0);
                    const appCombinedMonthly = enrolledSchemes.reduce((sum, s) => sum + (s.totalMonthlyAmount || ((s.monthlyAmountPerPerson || 0) * (s.personCount || 1))), 0);
                    const appCombinedGrand = enrolledSchemes.reduce((sum, s) => sum + (s.totalSchemeAmount || ((s.totalMonthlyAmount || 0) * (s.durationMonths || 10))), 0);
                    const appTotalPaid = enrolledSchemes.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
                    const appRemainingBalance = Math.max(0, appCombinedGrand - appTotalPaid);

                    return (
                      <div key={sub._id || sub.id || sIdx} className="border-2 border-gray-200/90 rounded-3xl p-5 bg-white space-y-4 shadow-2xs">
                        {/* Application Header Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                          <div>
                            <span className="font-mono text-xs font-extrabold text-[#7A1416]">
                              {sub.applicationNumber || `Application #${String(sub._id || sub.id).slice(-6)}`}
                            </span>
                            <span className="text-[11px] text-gray-500 ml-2">
                              Applied: {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}
                            </span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[11px] ${
                            currentApproval === "Approved"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : currentApproval === "Rejected"
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : "bg-amber-100 text-amber-800 border border-amber-300"
                          }`}>
                            {currentApproval === "Approved" ? "Approved" : currentApproval === "Rejected" ? "Rejected" : "Pending Approval"}
                          </span>
                        </div>

                        {/* Combined Application Financial Summary Banner */}
                        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs font-black text-amber-950 uppercase tracking-wide">
                              <Sparkles className="w-3.5 h-3.5 text-[#7A1416]" />
                              <span>Combined Financial Summary</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="bg-amber-200 text-amber-900 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full">
                                {enrolledSchemes.length} Scheme{enrolledSchemes.length > 1 ? 's' : ''} Selected
                              </span>
                              <span className="bg-[#7A1416] text-white font-black text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>{appTotalPersons} Total Person(s)</span>
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-white p-3 rounded-xl border border-amber-200/60 shadow-2xs">
                            <div>
                              <span className="text-gray-500 text-[10px] block font-medium">Combined Monthly</span>
                              <strong className="text-emerald-700 text-xs sm:text-sm font-black">₹{appCombinedMonthly.toLocaleString()} / mo</strong>
                            </div>
                            <div>
                              <span className="text-gray-500 text-[10px] block font-medium">Grand Scheme Total</span>
                              <strong className="text-[#2A1B54] text-xs sm:text-sm font-black">₹{appCombinedGrand.toLocaleString()}</strong>
                            </div>
                            <div>
                              <span className="text-gray-500 text-[10px] block font-medium">Total Paid Till Date</span>
                              <strong className="text-emerald-700 text-xs sm:text-sm font-black">₹{appTotalPaid.toLocaleString()}</strong>
                            </div>
                            <div>
                              <span className="text-gray-500 text-[10px] block font-medium">Remaining Balance</span>
                              <strong className="text-rose-700 text-xs sm:text-sm font-black">₹{appRemainingBalance.toLocaleString()}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Item-wise Chit Calculation Formula Banner (User Request: 300 x 5 = 1500, 500 x 3 = 1500, etc.) */}
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="bg-[#7A1416] text-white p-1 rounded-md">
                                <Receipt className="w-3.5 h-3.5" />
                              </span>
                              <span className="text-xs font-black uppercase text-[#7A1416] tracking-wide">
                                Chits Calculation Formula Breakdown
                              </span>
                            </div>
                            <span className="text-[11px] font-bold text-gray-600">
                              Formula: Rate × Persons = Monthly Amount
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {enrolledSchemes.map((schItem, idx) => {
                              const rate = schItem.monthlyAmountPerPerson || schItem.monthlyAmount || 0;
                              const count = schItem.personCount || 1;
                              const subTot = schItem.totalMonthlyAmount || (rate * count);
                              return (
                                <div key={idx} className="bg-white border border-amber-200 rounded-xl p-2.5 flex items-center justify-between shadow-2xs">
                                  <div>
                                    <div className="text-xs font-black text-[#2A1B54] truncate max-w-[120px]">{schItem.schemeName}</div>
                                    <div className="text-[10px] text-gray-500 font-medium">₹{rate} / person</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-mono text-xs font-black text-[#7A1416] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                      {rate} × {count} = ₹{subTot.toLocaleString()}
                                    </div>
                                    <div className="text-[10px] text-gray-500 mt-0.5">{count} Person{count > 1 ? 's' : ''}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="bg-white/90 border border-amber-300 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="font-mono font-bold text-gray-800 text-[11px]">
                              <span className="text-gray-500 font-sans">Summary Calculation: </span>
                              <span className="text-[#7A1416] font-black">
                                {enrolledSchemes.map(s => {
                                  const rate = s.monthlyAmountPerPerson || s.monthlyAmount || 0;
                                  const count = s.personCount || 1;
                                  return `${rate} × ${count} = ${rate * count}`;
                                }).join(" + ")}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="font-bold text-gray-700">
                                Total Persons: <span className="font-black text-[#7A1416] text-sm">{appTotalPersons}</span>
                              </div>
                              <div className="font-bold text-gray-700">
                                Monthly Payable: <span className="font-black text-emerald-700 text-sm">₹{appCombinedMonthly.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Enrolled Schemes under this Application */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-black text-[#2A1B54] uppercase tracking-wide flex items-center gap-1.5">
                            <Gift className="w-3.5 h-3.5 text-[#7A1416]" />
                            <span>Enrolled Scheme Details ({enrolledSchemes.length})</span>
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {enrolledSchemes.map((schItem, schIdx) => {
                              const isApproved = schItem.approvalStatus === "Approved" || schItem.status === "Approved" || schItem.status === "Paid" || currentApproval === "Approved";
                              const duration = schItem.durationMonths || schItem.totalMonths || 10;
                              const paidCount = schItem.monthsPaid || 0;
                              const progressPercent = Math.min(100, Math.round((paidCount / duration) * 100));

                              return (
                                <div
                                  key={schItem._id || schIdx}
                                  className="bg-gray-50/90 border border-gray-200/90 rounded-2xl p-4 flex flex-col justify-between space-y-3"
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <h4 className="font-extrabold text-[#2A1B54] text-sm">
                                        {schItem.schemeName}
                                      </h4>
                                      <span className="bg-amber-100 text-amber-900 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full border border-amber-200">
                                        {schItem.personCount} Person(s)
                                      </span>
                                    </div>

                                    <div className="text-xs space-y-1.5 bg-white p-3 rounded-xl border border-gray-200">
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 font-medium">Monthly / Person:</span>
                                        <strong className="text-gray-800 font-bold">₹{schItem.monthlyAmountPerPerson?.toLocaleString()}</strong>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 font-medium">Scheme Monthly Total:</span>
                                        <strong className="text-emerald-700 font-extrabold">₹{schItem.totalMonthlyAmount?.toLocaleString()}</strong>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 font-medium">Duration:</span>
                                        <span className="text-gray-800 font-semibold">{duration} Months</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 font-medium">Scheme Grand Total:</span>
                                        <strong className="text-[#2A1B54] font-extrabold">₹{schItem.totalSchemeAmount?.toLocaleString()}</strong>
                                      </div>
                                      <div className="flex justify-between border-t border-gray-100 pt-1">
                                        <span className="text-gray-500 font-medium">Installment Progress:</span>
                                        <strong className="text-gray-900 font-bold">{paidCount} / {duration} Months</strong>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 font-medium">Paid / Remaining:</span>
                                        <span className="text-xs font-bold">
                                          <span className="text-emerald-700">₹{schItem.paidAmount?.toLocaleString()}</span>
                                          <span className="text-gray-400 mx-1">/</span>
                                          <span className="text-rose-700">₹{schItem.remainingAmount?.toLocaleString()}</span>
                                        </span>
                                      </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-[11px] font-bold text-gray-600">
                                        <span>Progress</span>
                                        <span>{progressPercent}%</span>
                                      </div>
                                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                        <div
                                          className="bg-[#7A1416] h-2 rounded-full transition-all duration-500"
                                          style={{ width: `${progressPercent}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedPassbookSub(sub);
                                      setSelectedPassbookScheme(schItem);
                                    }}
                                    className="w-full py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs bg-[#7A1416] hover:bg-[#900000] text-white"
                                  >
                                    <span>{isApproved ? "View Scheme Passbook & Receipts" : "View Scheme Schedule Preview"}</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* VIEW 2: DETAILED MONTHWISE PASSBOOK & RECEIPTS FOR A SCHEME */
              <div className="space-y-6">
                {(() => {
                  const sub = selectedPassbookSub ? (userSubscriptions.find(s => (s._id || s.id) === (selectedPassbookSub._id || selectedPassbookSub.id)) || selectedPassbookSub) : userSubscriptions[0];
                  const sch = (sub?.schemes && selectedPassbookScheme ? sub.schemes.find(s => String(s._id || s.schemeId) === String(selectedPassbookScheme._id || selectedPassbookScheme.schemeId)) : null) || selectedPassbookScheme;
                  const subApproval = sub?.approvalStatus || (sub?.status === 'Paid' || sub?.status === 'Approved' ? 'Approved' : 'Pending');
                  const isApproved = sch.approvalStatus === "Approved" || sch.status === "Approved" || sch.status === "Paid" || subApproval === "Approved";
                  const totalMonths = sch.durationMonths || sch.totalMonths || 10;
                  const dueDateDay = sch.dueDateDay || 10;
                  const monthlyPerPerson = sch.monthlyAmountPerPerson || sch.monthlyAmount || 0;
                  const personCount = Math.max(1, sch.personCount || 1);
                  const monthlyTotal = sch.totalMonthlyAmount || (monthlyPerPerson * personCount);
                  const grandTotal = sch.totalSchemeAmount || (monthlyTotal * totalMonths);
                  const monthList = Array.from({ length: totalMonths }, (_, i) => i + 1);
                  const allSiblingSchemes: ChitSubscribedSchemeItem[] = (sub?.schemes && sub.schemes.length > 0) ? sub.schemes : [sch];

                  return (
                    <>
                      <DialogHeader className="border-b border-gray-100 pb-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedPassbookScheme(null)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back to Enrolled Schemes</span>
                          </button>
                          <span className={`px-3 py-1 rounded-full font-extrabold text-xs border ${
                            isApproved ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-amber-100 text-amber-800 border-amber-300"
                          }`}>
                            {isApproved ? "Active Scheme" : "Pending Verification"}
                          </span>
                        </div>
                        <DialogTitle className="text-xl font-extrabold text-[#2A1B54] mt-2">
                          {sch.schemeName} — Passbook Schedule
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-600 font-medium">
                          Enrolled for <strong className="text-amber-900">{personCount} Person(s)</strong> • Amount / Person: <strong className="text-gray-900">₹{monthlyPerPerson.toLocaleString()}</strong> • Expected Monthly: <strong className="text-emerald-700">₹{monthlyTotal.toLocaleString()}</strong> • Scheme Total: <strong className="text-[#2A1B54]">₹{grandTotal.toLocaleString()}</strong> • Due: Before {dueDateDay}th
                        </DialogDescription>

                        {/* Scheme Switcher Tabs when multiple schemes are present */}
                        {allSiblingSchemes.length > 1 && (
                          <div className="flex flex-wrap gap-2 items-center pt-2.5 border-t border-gray-100 mt-2">
                            <span className="text-xs font-bold text-gray-500">Switch Scheme:</span>
                            {allSiblingSchemes.map((sTab, tIdx) => {
                              const isTabActive = String(sTab._id || sTab.schemeId) === String(sch._id || sch.schemeId);
                              return (
                                <button
                                  key={tIdx}
                                  type="button"
                                  onClick={() => setSelectedPassbookScheme(sTab)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    isTabActive
                                      ? "bg-[#7A1416] text-white shadow-2xs"
                                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                                  }`}
                                >
                                  <span>{sTab.schemeName}</span>
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                                    isTabActive ? "bg-white/20 text-white" : "bg-amber-100 text-amber-900"
                                  }`}>
                                    {sTab.personCount || 1}p
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </DialogHeader>

                      {/* Chit Scheme Rate & Calculation Box for this Scheme */}
                      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#7A1416] bg-white px-2 py-1 rounded border border-amber-200">
                            {monthlyPerPerson} × {personCount} = ₹{monthlyTotal.toLocaleString()}
                          </span>
                          <span className="text-gray-600 font-medium">({personCount} Person{personCount > 1 ? 's' : ''} enrolled)</span>
                        </div>
                        <div className="text-gray-700 font-semibold">
                          Monthly Installment: <strong className="text-emerald-700">₹{monthlyTotal.toLocaleString()}</strong>
                        </div>
                      </div>

                      {!isApproved && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block font-bold">Application Pending Admin Approval</strong>
                            <span>Your chit scheme application is currently being verified by the store admin. Monthly payment tracking and official receipts will be activated upon approval. Below is your 10-month installment plan preview.</span>
                          </div>
                        </div>
                      )}

                      {/* Month-Wise Payment Tracking Table */}
                      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-2xs">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-gray-100 text-gray-700 uppercase font-extrabold tracking-wider border-b border-gray-200">
                              <th className="p-3.5 text-center w-16">Month</th>
                              <th className="p-3.5">Schedule</th>
                              <th className="p-3.5">Expected</th>
                              <th className="p-3.5">Paid</th>
                              <th className="p-3.5">Status</th>
                              <th className="p-3.5 text-right">Receipt</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {monthList.map((mNum) => {
                              const existingLog = (sch.monthlyPayments || []).find(p => p.monthNumber === mNum);
                              const isPaid = existingLog && ['Paid', 'Late Pay', 'Advanced Payment', 'Advance Payment', 'On-time Payment', 'Delay Payment'].includes(existingLog.status);
                              const paidDateStr = existingLog?.paidAt ? new Date(existingLog.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

                              return (
                                <tr key={mNum} className={`hover:bg-gray-50/80 ${isPaid ? 'bg-emerald-50/20' : ''}`}>
                                  <td className="p-3.5 font-bold text-gray-500 text-center">
                                    #{mNum}
                                  </td>
                                  <td className="p-3.5 font-extrabold text-gray-900">
                                    Month {mNum}
                                  </td>
                                  <td className="p-3.5 font-semibold text-gray-700">
                                    ₹{monthlyTotal.toLocaleString()}
                                  </td>
                                  <td className="p-3.5 font-extrabold text-emerald-700">
                                    {isPaid ? `₹${(existingLog?.amount || monthlyTotal).toLocaleString()}` : "₹0"}
                                  </td>
                                  <td className="p-3.5">
                                    {isPaid ? (
                                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        Paid ({paidDateStr})
                                      </span>
                                    ) : (
                                      <span className="bg-gray-100 text-gray-600 font-bold text-[10px] px-2 py-0.5 rounded-full">
                                        Pending
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3.5 text-right">
                                    {isPaid ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveReceipt({
                                            receiptNumber: (existingLog?.receiptNumber ? existingLog.receiptNumber.replace(/^AB-CHIT-/i, "SY-CHIT-") : `SY-CHIT-000${mNum}`),
                                            applicationNumber: (sub?.applicationNumber ? sub.applicationNumber.replace(/^AB-APP-/i, "SY-APP-") : `SY-APP-${String(sub?._id).slice(-6)}`),
                                            customerName: sub?.name || "Customer",
                                            phone: sub?.phone || "",
                                            email: sub?.email,
                                            location: sub?.location,
                                            schemeName: sch.schemeName,
                                            personCount,
                                            monthlyAmountPerPerson: monthlyPerPerson,
                                            expectedMonthlyAmount: monthlyTotal,
                                            amountReceived: existingLog?.amount || monthlyTotal,
                                            paymentMethod: existingLog?.paymentMethod || "Cash",
                                            transactionId: existingLog?.transactionNumber || existingLog?.transactionId || "",
                                            paymentDate: existingLog?.paidAt || new Date(),
                                            paymentStatus: "PAID",
                                            installmentMonth: `Month ${mNum} / ${totalMonths}`,
                                            monthNumber: mNum,
                                            totalPaidTillDate: sch.paidAmount,
                                            remainingSchemeBalance: sch.remainingAmount,
                                            totalMonths,
                                            paidMonths: sch.monthsPaid,
                                            notes: existingLog?.notes,
                                            schemesBreakdown: allSiblingSchemes.map(s => {
                                              const rate = s.monthlyAmountPerPerson || s.monthlyAmount || 0;
                                              const count = s.personCount || 1;
                                              const subTotal = s.totalMonthlyAmount || (rate * count);
                                              return {
                                                schemeName: s.schemeName,
                                                rate,
                                                count,
                                                subTotal,
                                                monthlyAmountPerPerson: rate,
                                                personCount: count,
                                                totalMonthlyAmount: subTotal
                                              };
                                            }),
                                            totalPersons: allSiblingSchemes.reduce((sum, s) => sum + (s.personCount || 1), 0),
                                            combinedMonthlyPayable: allSiblingSchemes.reduce((sum, s) => sum + (s.totalMonthlyAmount || ((s.monthlyAmountPerPerson || 0) * (s.personCount || 1))), 0)
                                          });
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                                        title="View Official Payment Receipt"
                                      >
                                        <FileText className="w-3 h-3" />
                                        <span>View Receipt</span>
                                      </button>
                                    ) : (
                                      <span className="text-gray-400 text-xs italic">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* ZOOM IMAGE BANNER MODAL */}
      {activeZoomImage && (
        <Dialog open={!!activeZoomImage} onOpenChange={(open) => !open && setActiveZoomImage(null)}>
          <DialogContent className="max-w-4xl p-4 bg-white rounded-3xl overflow-hidden font-sans border-0 shadow-2xl">
            <div className="relative w-full overflow-hidden rounded-2xl bg-gray-900 flex items-center justify-center max-h-[85vh]">
              <img
                src={activeZoomImage.url}
                alt="Banner Large View"
                className="w-full h-auto max-h-[85vh] object-contain rounded-2xl"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* OFFICIAL PAYMENT RECEIPT MODAL (VIEW / DOWNLOAD PDF / PRINT) */}
      <ChitReceiptModal
        isOpen={!!activeReceipt}
        onClose={() => setActiveReceipt(null)}
        receipt={activeReceipt}
      />

      <UserFooter />
    </div>
  );
};

export default ChitScheme;
