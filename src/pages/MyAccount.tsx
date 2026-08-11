import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { useAuth } from "@/context/AuthContext";
import { getChitSubscriptions, getChitSchemes, ChitSubscriptionItem, ChitSchemeItem } from "@/lib/api";
import { getCookie } from "@/lib/cookieUtils";
import { Calendar, Clock, CheckCircle2, Gift } from "lucide-react";

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
  const { userPhone, userName, isUserLoggedIn } = useAuth();
  const [subscriptions, setSubscriptions] = useState<ChitSubscriptionItem[]>([]);
  const [schemes, setSchemes] = useState<ChitSchemeItem[]>([]);
  const [loading, setLoading] = useState(false);

  const displayName = userName || getCookie("saiyogi_user_name") || localStorage.getItem("user_name") || "Customer";
  const displayPhone = userPhone || getCookie("saiyogi_user_phone") || localStorage.getItem("user_phone") || "-";

  useEffect(() => {
    getChitSchemes()
      .then(res => setSchemes(res || []))
      .catch(err => console.warn("Failed to fetch schemes:", err));

    const cleanPhone = String(displayPhone).replace(/\D/g, "").slice(-10);
    if (cleanPhone && cleanPhone.length === 10) {
      setLoading(true);
      getChitSubscriptions()
        .then(allSubs => {
          const mySubs = (allSubs || []).filter(s => {
            const p = String(s.phone || "").replace(/\D/g, "").slice(-10);
            return p === cleanPhone;
          });
          setSubscriptions(mySubs);
        })
        .catch(err => console.warn("Failed to fetch user subscriptions:", err))
        .finally(() => setLoading(false));
    }
  }, [displayPhone, isUserLoggedIn]);

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
          <span className="text-[#4C1D95] font-bold">My Account</span>
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
          <div className="grid grid-cols-12 items-center py-1 border-b border-gray-100/80 pb-2">
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

          {loading ? (
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
                  s => s.title === sub.schemeName || (s._id || s.id) === sub.schemeId
                );
                const totalMonths = matchedScheme?.totalMonths || 9;
                const startDateStr = matchedScheme?.startDate;
                const dueDateDay = matchedScheme?.dueDateDay || 10;
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
                          <span>Subscriber: <strong className="text-gray-900">{sub.name}</strong></span>
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
          )}
        </div>
      </main>

      {/* Footer */}
      <UserFooter />
    </div>
  );
};

export default MyAccount;
