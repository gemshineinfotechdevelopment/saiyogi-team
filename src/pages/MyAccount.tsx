import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { useAuth } from "@/context/AuthContext";
import { getChitSubscriptions, getChitSchemes, ChitSubscriptionItem, ChitSchemeItem, getOrders } from "@/lib/api";
import { Calendar, Clock, CheckCircle2, Gift, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getCookie, setCookie } from "@/lib/cookieUtils";
import { downloadOrderReceiptPDF, OrderData } from "@/lib/pdf-generator";
import { EnquiryItem, loadUserEnquiries, formatAddress, formatString } from "@/lib/enquiryUtils";

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

const MyAccount: React.FC = () => {
  const { userPhone, userName, isUserLoggedIn, openLoginModal } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"account" | "enquiry">("account");
  const [subscriptions, setSubscriptions] = useState<ChitSubscriptionItem[]>([]);
  const [schemes, setSchemes] = useState<ChitSchemeItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [enquiries, setEnquiries] = useState<EnquiryItem[]>([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryItem | null>(null);

  const [loadingChit, setLoadingChit] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "enquiry") {
      setActiveTab("enquiry");
    } else if (tabParam === "account") {
      setActiveTab("account");
    }
  }, [searchParams]);

  useEffect(() => {
    const effectivePhone = userPhone || getCookie("saiyogi_user_phone") || localStorage.getItem("user_phone");
    if (effectivePhone) {
      const localCookieItems = loadUserEnquiries(effectivePhone);
      setEnquiries(localCookieItems);

      const cleanPhone = effectivePhone.replace(/\D/g, "");
      getOrders()
        .then((backendOrders) => {
          if (Array.isArray(backendOrders) && backendOrders.length > 0) {
            const matching = backendOrders.filter((ord: any) => {
              const ordPhone = (ord.customerPhone || "").replace(/\D/g, "");
              return ordPhone && ordPhone === cleanPhone;
            });

            if (matching.length > 0) {
              const convertedBackend: EnquiryItem[] = matching.map((ord: any) => ({
                id: String(ord._id || ord.id || Date.now()),
                enquiryNumber: String(ord.orderNumber || ord._id),
                date: ord.createdAt
                  ? `${new Date(ord.createdAt).toLocaleDateString('en-IN')} ${new Date(ord.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                  : (ord.date || new Date().toLocaleDateString('en-IN')),
                total: ord.total || ord.subtotal || 0,
                status: (ord.status as any) || "Pending",
                customerName: formatString(ord.customerName, "Customer"),
                customerPhone: formatString(ord.customerPhone, effectivePhone),
                customerEmail: formatString(ord.customerEmail, ""),
                deliveryAddress: formatAddress(ord.deliveryAddress || ord.shippingAddress),
                items: Array.isArray(ord.items)
                  ? ord.items.map((i: any) => ({
                      productName: formatString(i.productName || i.product?.name, "Product"),
                      quantity: i.quantity || 1,
                      price: i.price || 0,
                    }))
                  : [],
              }));

              const map = new Map<string, EnquiryItem>();
              localCookieItems.forEach((item) => map.set(item.enquiryNumber, item));
              convertedBackend.forEach((item) => map.set(item.enquiryNumber, item));

              const merged = Array.from(map.values());
              setEnquiries(merged);
              localStorage.setItem(`user_saved_enquiries_${cleanPhone}`, JSON.stringify(merged));
              setCookie(`saiyogi_enquiries_${cleanPhone}`, JSON.stringify(merged), 30);
            }
          }
        })
        .catch(() => {});
    } else {
      setEnquiries([]);
    }
  }, [userPhone]);

  const displayName = userName || getCookie("saiyogi_user_name") || localStorage.getItem("user_name") || "User";
  const displayPhone = userPhone || getCookie("saiyogi_user_phone") || localStorage.getItem("user_phone") || "-";

  useEffect(() => {
    getChitSchemes()
      .then(res => setSchemes(res || []))
      .catch(err => console.warn("Failed to fetch schemes:", err));

    const cleanPhone = String(displayPhone).replace(/\D/g, "").slice(-10);
    if (cleanPhone && cleanPhone.length === 10) {
      setLoadingChit(true);
      getChitSubscriptions()
        .then(allSubs => {
          const mySubs = (allSubs || []).filter(s => {
            const p = String(s.phone || s.mobileNumber || "").replace(/\D/g, "").slice(-10);
            return p === cleanPhone;
          });
          setSubscriptions(mySubs);
        })
        .catch(err => console.warn("Failed to fetch user subscriptions:", err))
        .finally(() => setLoadingChit(false));
    }
  }, [displayPhone, isUserLoggedIn]);

  const handleTabChange = (tab: "account" | "enquiry") => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleDownloadEstimate = (enquiry: EnquiryItem) => {
    const pdfData: OrderData = {
      orderNumber: enquiry.enquiryNumber,
      customerName: formatString(enquiry.customerName, "Customer"),
      customerPhone: formatString(enquiry.customerPhone, userPhone || ""),
      customerEmail: formatString(enquiry.customerEmail, "customer@example.com"),
      deliveryAddress: formatAddress(enquiry.deliveryAddress),
      date: enquiry.date,
      subtotal: enquiry.total,
      total: enquiry.total,
      items: Array.isArray(enquiry.items) ? enquiry.items.map((item) => ({
        productName: formatString(item.productName, "Product"),
        quantity: item.quantity || 1,
        price: item.price || 0,
        originalPrice: item.price || 0,
      })) : [],
      siteName: "Sai Yogi Crackers",
      siteAddress: "Sivakasi, Virudhunagar District, Tamil Nadu",
      sitePhone: "+91 98765 43210",
      siteEmail: "contact@saiyogicrackers.com",
    };

    toast.info("Generating estimate PDF...");
    downloadOrderReceiptPDF(pdfData);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      {/* Header */}
      <UserHeader />

      {/* Breadcrumb Header Bar */}
      <div className="bg-[#F8F7FA] border-b border-gray-200/80 py-3.5 px-4 sm:px-12">
        <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs text-gray-600 font-medium">
          <Link to="/" className="hover:text-[#4C1D95] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#4C1D95] font-bold">
            {activeTab === "enquiry" ? "My Enquiry" : "My Account"}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 py-8 px-4 sm:px-12 max-w-4xl mx-auto w-full space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2A1B54]">
          My Account
        </h1>

        {/* User Account Details Card */}
        <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-6 space-y-4 max-w-2xl text-xs sm:text-sm">
          <h2 className="font-extrabold text-gray-900 text-base border-b border-gray-200 pb-2">Personal Details</h2>
          <div className="grid grid-cols-12 items-center py-1">
            <span className="col-span-4 font-bold text-gray-700">Name</span>
            <span className="col-span-1 text-center font-bold">:</span>
            <span className="col-span-7 text-gray-900 font-semibold">{displayName}</span>
          </div>
          <div className="grid grid-cols-12 items-center py-1">
            <span className="col-span-4 font-bold text-gray-700">Mobile Number</span>
            <span className="col-span-1 text-center font-bold">:</span>
            <span className="col-span-7 text-gray-900 font-mono font-bold">{displayPhone}</span>
          </div>
        </div>

        {activeTab === "account" ? (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1B54] mb-6">
                My Account
              </h1>

              {/* User Account Details Table */}
              <div className="space-y-4 text-xs sm:text-sm text-gray-900 font-medium max-w-2xl bg-white p-6 rounded-2xl border border-gray-100 shadow-2xs">
                <div className="grid grid-cols-12 items-center py-2 border-b border-gray-100 pb-3">
                  <span className="col-span-4 font-bold text-gray-900">Name</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 text-gray-800 font-semibold">{displayName}</span>
                </div>

                <div className="grid grid-cols-12 items-center py-2 border-b border-gray-100 pb-3">
                  <span className="col-span-4 font-bold text-gray-900">Mobile Number</span>
                  <span className="col-span-1 text-center font-bold">:</span>
                  <span className="col-span-7 text-gray-800 font-semibold">{displayPhone}</span>
                </div>
              </div>
            </div>

            {/* My Subscribed Chit Schemes Section */}
            <div className="space-y-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">My Subscribed Chit Schemes</h2>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      Live payment passbook & monthly status updated by admin.
                    </p>
                  </div>
                </div>
                <Link
                  to="/chit-scheme"
                  className="text-xs font-bold text-[#7A1416] hover:underline bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200"
                >
                  Browse Schemes →
                </Link>
              </div>

              {loadingChit ? (
                <div className="py-8 text-center text-gray-400 text-xs font-medium">
                  Loading your chit scheme passbook...
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center space-y-2">
                  <p className="text-xs text-gray-500 font-medium">You have not subscribed to any chit schemes yet.</p>
                  <Link
                    to="/chit-scheme"
                    className="inline-block bg-[#7A1416] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-2xs"
                  >
                    Join Chit Scheme Now
                  </Link>
                </div>
              ) : (
                <div className="space-y-8">
                  {subscriptions.map((sub, sIdx) => {
                    const matchedScheme = schemes.find(
                      s => (s.title || s.schemeName) === sub.schemeName || (s._id || s.id) === sub.schemeId
                    );
                    const totalMonths = matchedScheme?.totalMonths || matchedScheme?.numberOfMonths || 9;
                    const startDateStr = matchedScheme?.startDate;
                    const dueDateDay = matchedScheme?.dueDateDay || matchedScheme?.paymentDueDay || 10;
                    const monthlyAmount = matchedScheme?.monthlyAmount || 0;

                    const monthList = Array.from({ length: totalMonths }, (_, i) => i + 1);

                    return (
                      <div key={sub._id || sub.id || sIdx} className="bg-white border border-gray-200/90 rounded-3xl p-6 shadow-xs space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                          <div>
                            <h3 className="text-base font-extrabold text-[#2A1B54]">
                              {sub.schemeName}
                            </h3>
                            <div className="text-xs text-gray-500 font-medium mt-1 flex flex-wrap items-center gap-3">
                              <span>Subscriber: <strong className="text-gray-900">{sub.name || sub.customerName}</strong></span>
                              <span>•</span>
                              <span>Location: <strong className="text-gray-900">{sub.location}</strong></span>
                            </div>
                          </div>

                          <div>
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
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-[#7A1416]" />
                              Monthwise Payment Schedule ({totalMonths} Months)
                            </span>
                            <span className="text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg">
                              Due: {dueDateDay}th of each month
                            </span>
                          </div>

                          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-gray-100/80 text-gray-700 text-xs uppercase font-extrabold tracking-wider border-b border-gray-200">
                                  <th className="p-3.5 w-16 text-center">S.No</th>
                                  <th className="p-3.5">Month</th>
                                  <th className="p-3.5">Due Date &amp; Amount</th>
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
              )}
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl sm:text-3xl font-medium text-[#2A1B54] mb-8">
              My Enquiry
            </h1>
            {!isUserLoggedIn && (
              <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl text-xs font-semibold flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div>
                  <span>ℹ️ Log in with your mobile number to view and track your active inquiries and download PDF receipts.</span>
                </div>
                <button
                  onClick={openLoginModal}
                  className="bg-[#A80000] hover:bg-red-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shrink-0 cursor-pointer uppercase tracking-wider"
                >
                  Login with Mobile
                </button>
              </div>
            )}

            {/* Enquiry Table */}
            <div className="overflow-x-auto bg-white rounded-lg border-b border-gray-200">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-300 text-xs font-bold text-gray-900 pb-3">
                    <th className="py-3 px-2 w-12 text-center">#</th>
                    <th className="py-3 px-4">Enquiry Number</th>
                    <th className="py-3 px-6 text-left">Total</th>
                    <th className="py-3 px-6 text-left">Status</th>
                    <th className="py-3 px-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                  {enquiries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400 font-medium">
                        No enquiries found.
                      </td>
                    </tr>
                  ) : (
                    enquiries.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-4 px-2 text-center text-gray-500 font-medium">
                          {index + 1}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-gray-900">{item.enquiryNumber}</div>
                          <div className="text-[11px] text-blue-600 font-medium mt-0.5">
                            {item.date}
                          </div>
                        </td>
                        <td className="py-4 px-6 font-bold text-emerald-600">
                          ₹ {item.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-rose-600 font-medium">
                            {item.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-3 text-xs">
                            <button
                              onClick={() => setSelectedEnquiry(item)}
                              className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer flex items-center gap-1 transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDownloadEstimate(item)}
                              className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer flex items-center gap-1 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Estimate</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Enquiry Details Modal */}
      {selectedEnquiry && (
        <Dialog open={!!selectedEnquiry} onOpenChange={() => setSelectedEnquiry(null)}>
          <DialogContent className="sm:max-w-lg p-6 bg-white rounded-2xl">
            <DialogHeader className="border-b border-gray-100 pb-3">
              <DialogTitle className="text-lg font-bold text-gray-900 flex items-center justify-between">
                <span>Enquiry #{selectedEnquiry.enquiryNumber}</span>
                <span className="text-xs bg-rose-50 text-rose-600 font-bold px-2.5 py-1 rounded-full border border-rose-100">
                  {selectedEnquiry.status}
                </span>
              </DialogTitle>
              <p className="text-xs text-gray-500 mt-1">Date: {selectedEnquiry.date}</p>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="bg-gray-50 p-3.5 rounded-xl space-y-1.5 text-gray-700">
                <div><strong className="text-gray-900">Name:</strong> {formatString(selectedEnquiry.customerName, "Customer")}</div>
                <div><strong className="text-gray-900">Phone:</strong> {formatString(selectedEnquiry.customerPhone, "-")}</div>
                <div><strong className="text-gray-900">Delivery Address:</strong> {formatAddress(selectedEnquiry.deliveryAddress)}</div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-2 uppercase text-[11px] tracking-wider">Enquired Products</h4>
                <div className="space-y-2 border border-gray-100 rounded-xl p-3 max-h-48 overflow-y-auto">
                  {(Array.isArray(selectedEnquiry.items) ? selectedEnquiry.items : []).length === 0 ? (
                    <div className="text-gray-400 italic py-2 text-center">No item breakdown available</div>
                  ) : (
                    (Array.isArray(selectedEnquiry.items) ? selectedEnquiry.items : []).map((prod, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs pb-1.5 border-b border-gray-50 last:border-0 last:pb-0">
                        <div>
                          <span className="font-semibold text-gray-800">{formatString(prod.productName, "Product")}</span>
                          <span className="text-gray-400 ml-2">x {prod.quantity || 1}</span>
                        </div>
                        <span className="font-bold text-gray-900">₹ {((prod.price || 0) * (prod.quantity || 1)).toLocaleString("en-IN")}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-sm">
                <span className="font-bold text-gray-700">Grand Total:</span>
                <span className="font-black text-emerald-600 text-base">
                  ₹ {selectedEnquiry.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadEstimate(selectedEnquiry)}
                className="px-4 py-2 bg-[#A80000] hover:bg-red-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Download Estimate</span>
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Footer */}
      <UserFooter />
    </div>
  );
};

export default MyAccount;
