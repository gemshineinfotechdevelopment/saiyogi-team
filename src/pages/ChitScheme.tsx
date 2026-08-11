import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { useAuth } from "@/context/AuthContext";
import { Lock, LogIn, Gift, Send, CheckCircle2, MapPin, User, Mail, Phone, ChevronDown, Sparkles, Calendar, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getChitSchemes, ChitSchemeItem, submitChitSubscription, trackCustomerAction, getChitSubscriptions, ChitSubscriptionItem } from "@/lib/api";

interface ChitSchemeImage {
  id: string;
  url?: string;
  title?: string;
  description?: string;
  startDate?: string;
  totalMonths?: number;
  dueDateDay?: number;
  monthlyAmount?: number;
}

const DEFAULT_IMAGES: ChitSchemeImage[] = [
  {
    id: "1",
    title: "Diwali Special Savings Scheme 2026",
    description: "Pay monthly advance & get 50% extra bonus fireworks free on Diwali!"
  },
  {
    id: "2",
    title: "Monthly Firecracker Advance Booking Perks",
    description: "Guaranteed locked prices and zero festival price hikes."
  }
];

const getMonthNameForIndex = (monthIndex: number, startDateStr?: string): { monthName: string; dueDateStr: string } => {
  if (startDateStr && startDateStr.trim()) {
    const cleanStr = startDateStr.trim();
    const parts = cleanStr.split('-');
    if (parts.length >= 2) {
      const startYear = parseInt(parts[0], 10);
      const startMonth = parseInt(parts[1], 10) - 1;
      if (!isNaN(startYear) && !isNaN(startMonth)) {
        const targetDate = new Date(startYear, startMonth + (monthIndex - 1), 1);
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
  const [images, setImages] = useState<ChitSchemeImage[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<ChitSubscriptionItem[]>([]);

  // Form states
  const [selectedScheme, setSelectedScheme] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    location: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPurchasedModal, setShowPurchasedModal] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  const formRef = useRef<HTMLDivElement>(null);

  // Pre-fill form from logged in user profile
  useEffect(() => {
    if (isUserLoggedIn) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || userName || "",
        phone: prev.phone || userPhone || ""
      }));
    }
  }, [isUserLoggedIn, userPhone, userName]);

  // Fetch logged in user subscriptions to display passbook
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

  useEffect(() => {
    const loadChit = () => {
      getChitSchemes()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const mapped = data.map((item: ChitSchemeItem) => ({
              id: item._id || item.id || '',
              url: item.url,
              title: item.title || item.schemeName || '',
              description: item.description || '',
              startDate: item.startDate || '',
              totalMonths: item.totalMonths || item.numberOfMonths || 9,
              dueDateDay: item.dueDateDay || item.paymentDueDay || 10,
              monthlyAmount: item.monthlyAmount || 0
            }));
            setImages(mapped);
            if (mapped.length > 0 && mapped[0].title && !selectedScheme) {
              setSelectedScheme(mapped[0].title);
            }
          } else {
            setImages(DEFAULT_IMAGES);
            if (!selectedScheme) {
              setSelectedScheme(DEFAULT_IMAGES[0].title || "Diwali Special Savings Scheme 2026");
            }
          }
        })
        .catch((err) => {
          console.error("Failed to fetch chit schemes from API:", err);
          setImages(DEFAULT_IMAGES);
          if (!selectedScheme) {
            setSelectedScheme(DEFAULT_IMAGES[0].title || "Diwali Special Savings Scheme 2026");
          }
        });
    };

    loadChit();

    const interval = setInterval(loadChit, 10000);
    const onFocus = () => loadChit();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const handleSelectSchemeToApply = (schemeTitle: string) => {
    setSelectedScheme(schemeTitle);
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value } = e.target;
    if (name === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedScheme) {
      toast.error("Please select a scheme from the dropdown");
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
      toast.error("Please enter your location (City/State/District)");
      return;
    }

    setIsSubmitting(true);
    try {
      const activeSchemeObj = images.find(img => img.title === selectedScheme);
      const payload = {
        schemeId: activeSchemeObj?.id,
        schemeName: selectedScheme,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        location: formData.location.trim()
      };

      const result = await submitChitSubscription(payload);
      
      // Auto login user if not logged in
      if (!isUserLoggedIn) {
        loginWithPhone(formData.phone.trim(), formData.name.trim());
      }

      setSubmittedData(result);
      setShowSuccessModal(true);
      toast.success("Chit scheme application submitted successfully! 🎉");

      // Reset form location
      setFormData(prev => ({
        ...prev,
        location: ""
      }));
    } catch (err: any) {
      toast.error(err.message || "Failed to submit chit scheme application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9FC]">
      {/* Header */}
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

      {/* Main Content */}
      <main className="flex-1 py-10 px-4 sm:px-12 max-w-6xl mx-auto w-full">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center border border-amber-200 shadow-2xs shrink-0">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#2A1B54]">
                Sai Yogi Chit Scheme
              </h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Join our monthly savings scheme & unlock exclusive Diwali bonus perks!
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {userSubscriptions.length > 0 && (
              <button
                onClick={() => setShowPurchasedModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>View Purchased Schemes ({userSubscriptions.length})</span>
              </button>
            )}
            {!isUserLoggedIn && (
              <button
                onClick={openLoginModal}
                className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2 self-start sm:self-auto cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-amber-700" />
                <span>Login / Register</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Layout: Form First (5 cols), Scheme Cards Second (7 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (FIRST): Chit Scheme Registration Form (5 Cols) */}
          <div ref={formRef} className="lg:col-span-5 bg-white border border-gray-200 rounded-3xl p-6 sm:p-7 shadow-md space-y-5 sticky top-6">
            <div className="border-b border-gray-100 pb-4">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 px-3 py-1 rounded-full inline-block mb-2">
                Easy Registration
              </span>
              <h2 className="text-xl font-bold text-gray-900">
                Join Chit Scheme
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Fill details below to subscribe. Admin will update your payment status.
              </p>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* 1. Scheme (Dropdown) */}
              <div className="space-y-1.5">
                <label htmlFor="scheme" className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                  1. Select Scheme *
                </label>
                <div className="relative">
                  <select
                    id="scheme"
                    name="scheme"
                    value={selectedScheme}
                    onChange={(e) => setSelectedScheme(e.target.value)}
                    className="w-full text-xs font-semibold p-3 pr-8 bg-gray-50 border border-gray-300 rounded-2xl appearance-none focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none transition-all"
                    required
                  >
                    {images.map((img) => (
                      <option key={img.id} value={img.title || "Standard Scheme"}>
                        {img.title || "Diwali Savings Scheme"}
                      </option>
                    ))}
                    {images.length === 0 && (
                      <option value="Diwali Special Savings Scheme 2026">
                        Diwali Special Savings Scheme 2026
                      </option>
                    )}
                  </select>
                </div>
              </div>

              {/* 2. Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                  2. Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full text-xs font-semibold p-3 pl-10 bg-gray-50 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* 3. Mobile Number */}
              <div className="space-y-1.5">
                <label htmlFor="phone" className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                  3. Mobile Number *
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 font-bold text-xs text-gray-500">
                    +91
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    maxLength={10}
                    className="w-full text-xs font-bold p-3 pl-12 bg-gray-50 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* 4. Email ID */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                  4. Email ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="yourname@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full text-xs font-medium p-3 pl-10 bg-gray-50 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none transition-all"
                  />
                </div>
              </div>

              {/* 5. Location */}
              <div className="space-y-1.5">
                <label htmlFor="location" className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                  5. Location *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="location"
                    type="text"
                    name="location"
                    placeholder="City, District, or State"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full text-xs font-medium p-3 pl-10 bg-gray-50 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#7A1416] hover:bg-[#900000] text-white font-bold text-xs py-3.5 px-6 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50 mt-2"
              >
                {isSubmitting ? (
                  <span>Submitting Application...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Scheme Application</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Promotional Banner Images */}
          <div className="lg:col-span-7 space-y-5">
            {images.filter(img => img.url).length === 0 ? (
              <div className="py-16 text-center text-gray-400 font-medium text-sm border-2 border-dashed border-gray-200 rounded-3xl bg-white p-6">
                <Gift className="w-10 h-10 mx-auto mb-2 opacity-40 text-amber-700" />
                No promotional images uploaded yet.
              </div>
            ) : (
              <div className="space-y-6">
                {images
                  .filter((img) => Boolean(img.url))
                  .map((img, idx) => (
                    <div
                      key={img.id || idx}
                      className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-all"
                    >
                      <img
                        src={img.url}
                        alt="Chit Scheme Banner"
                        className="w-full h-auto max-h-[500px] object-cover rounded-3xl"
                      />
                    </div>
                  ))}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Purchased Schemes & Passbook Details Modal */}
      {showPurchasedModal && (
        <Dialog open={showPurchasedModal} onOpenChange={setShowPurchasedModal}>
          <DialogContent className="max-w-4xl p-6 sm:p-8 bg-white rounded-3xl max-h-[90vh] overflow-y-auto space-y-6 font-sans">
            <DialogHeader className="border-b border-gray-100 pb-4">
              <DialogTitle className="text-xl font-bold text-[#2A1B54] flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                My Purchased Schemes & Monthwise Passbook
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-600 font-medium">
                Detailed scheme subscription information and real-time monthwise payment schedule.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-8">
              {userSubscriptions.map((sub, sIdx) => {
                const matchedScheme = images.find(
                  img => img.title === sub.schemeName || img.id === sub.schemeId
                );
                const totalMonths = matchedScheme?.totalMonths || 9;
                const startDateStr = matchedScheme?.startDate;
                const dueDateDay = matchedScheme?.dueDateDay || 10;
                const monthlyAmount = matchedScheme?.monthlyAmount || 0;

                const monthList = Array.from({ length: totalMonths }, (_, i) => i + 1);

                return (
                  <div key={sub._id || sub.id || sIdx} className="bg-gray-50/80 border border-gray-200/90 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/60 pb-3">
                      <div>
                        <h3 className="text-base font-extrabold text-[#2A1B54]">
                          {sub.schemeName}
                        </h3>
                        <div className="text-xs text-gray-600 font-medium mt-1 flex flex-wrap items-center gap-3">
                          <span>Subscriber: <strong className="text-gray-900">{sub.name}</strong></span>
                          <span>•</span>
                          <span>Mobile: <strong className="text-gray-900 font-mono">{sub.phone}</strong></span>
                          <span>•</span>
                          <span>Location: <strong className="text-gray-900">{sub.location}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full font-extrabold text-xs ${
                          sub.approvalStatus === "Approved" || sub.status === "Approved" || sub.status === "Paid"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : sub.approvalStatus === "Rejected" || sub.status === "Rejected"
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                        }`}>
                          Status: {sub.approvalStatus || sub.status}
                        </span>
                      </div>
                    </div>

                    {/* Monthwise Payment Passbook Table */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-[#7A1416]" />
                          Monthwise Payment Schedule ({totalMonths} Months)
                        </span>
                        <span className="text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg">
                          Due: {dueDateDay}th of each month
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-2xs">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-100/80 text-gray-700 text-xs uppercase font-extrabold tracking-wider border-b border-gray-200">
                              <th className="p-3.5 w-16 text-center">S.No</th>
                              <th className="p-3.5">Month</th>
                              <th className="p-3.5">Due Date & Amount</th>
                              <th className="p-3.5">Payment Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-xs">
                            {monthList.map((mNum, mIdx) => {
                              const { monthName } = getMonthNameForIndex(mNum, startDateStr);
                              const existingLog = (sub.monthlyPayments || []).find(p => p.monthNumber === mNum);
                              const currentStatus = existingLog?.status || 'Pending';

                              return (
                                <tr
                                  key={mNum}
                                  className={`hover:bg-gray-50/80 transition-colors ${
                                    currentStatus === 'Paid'
                                      ? 'bg-emerald-50/30'
                                      : currentStatus === 'Late Pay'
                                      ? 'bg-amber-50/40'
                                      : ''
                                  }`}
                                >
                                  <td className="p-3.5 font-bold text-gray-500 text-center">
                                    {mIdx + 1}
                                  </td>

                                  <td className="p-3.5 font-extrabold text-gray-900 text-sm">
                                    {monthName}
                                  </td>

                                  <td className="p-3.5 text-gray-700">
                                    <div className="font-semibold">Due: {dueDateDay}th {monthName}</div>
                                    {monthlyAmount ? (
                                      <div className="text-[11px] font-bold text-[#7A1416] mt-0.5">
                                        ₹{monthlyAmount.toLocaleString()} / month
                                      </div>
                                    ) : null}
                                  </td>

                                  <td className="p-3.5">
                                    <div className="flex flex-col gap-1 items-start">
                                      {currentStatus === 'Paid' && (
                                        <span className="bg-emerald-600 text-white font-extrabold text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                                          <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                                        </span>
                                      )}
                                      {currentStatus === 'Late Pay' && (
                                        <span className="bg-amber-600 text-white font-extrabold text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                                          <Clock className="w-3.5 h-3.5" /> Late Pay
                                        </span>
                                      )}
                                      {currentStatus === 'Pending' && (
                                        <span className="bg-gray-200 text-gray-700 font-bold text-xs px-3 py-1 rounded-full">
                                          Unpaid / Pending
                                        </span>
                                      )}

                                      {existingLog?.paidAt && currentStatus !== 'Pending' && (
                                        <span className="text-[11px] text-gray-500 font-medium">
                                          Paid on: {new Date(existingLog.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Submission Success Dialog */}
      {showSuccessModal && (
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="max-w-md p-6 bg-white rounded-3xl text-center space-y-4 font-sans">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center border-4 border-emerald-50">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <DialogHeader className="space-y-1 text-center">
              <DialogTitle className="text-xl font-bold text-gray-900">
                Application Submitted!
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-600 font-medium">
                Thank you <strong className="text-gray-900">{submittedData?.name}</strong>. Your subscription request for <strong className="text-amber-900">{submittedData?.schemeName}</strong> has been registered.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Mobile:</span>
                <span className="font-mono font-bold text-gray-900">{submittedData?.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Location:</span>
                <span className="font-semibold text-gray-900">{submittedData?.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Status:</span>
                <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                  Pending Admin Approval
                </span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              Our admin team will review your application and update your scheme payment status to <strong className="text-emerald-700">Paid</strong> upon confirmation.
            </p>

            <button
              onClick={() => {
                setShowSuccessModal(false);
                setShowPurchasedModal(true);
              }}
              className="w-full bg-[#7A1416] hover:bg-[#900000] text-white font-bold py-3 rounded-2xl text-xs transition-all shadow-md cursor-pointer"
            >
              View My Purchased Scheme Details
            </button>
          </DialogContent>
        </Dialog>
      )}

      {/* Footer */}
      <UserFooter />
    </div>
  );
};

export default ChitScheme;
