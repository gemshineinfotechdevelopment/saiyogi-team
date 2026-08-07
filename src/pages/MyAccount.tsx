import React, { useState } from "react";
import { Link } from "react-router-dom";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { useAuth } from "@/context/AuthContext";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

const MyAccount: React.FC = () => {
  const { userPhone, isUserLoggedIn, openLoginModal, logoutUser } = useAuth();
  const [copied, setCopied] = useState(false);

  const referralCode = "NQYJELK758";
  const displayPhone = userPhone || "";

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success("Referral code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <UserHeader />

      {/* Breadcrumb Header Bar */}
      <div className="bg-[#F8F7FA] border-b border-gray-200/80 py-3.5 px-4 sm:px-12">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-gray-600 font-medium">
          <Link to="/" className="hover:text-[#4C1D95] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#4C1D95] font-bold">My Account</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 py-8 px-4 sm:px-12 max-w-4xl mx-auto w-full">
        <h1 className="text-2xl sm:text-3xl font-medium text-[#2A1B54] mb-8">
          My Account
        </h1>

        {!isUserLoggedIn ? (
          <div className="bg-red-50/50 border border-red-200 rounded-3xl p-8 max-w-2xl text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-red-100 text-[#A80000] flex items-center justify-center mx-auto shadow-inner">
              <span className="text-2xl">📱</span>
            </div>
            <h2 className="text-xl font-extrabold text-gray-900">Mobile Login Required</h2>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
              Please log in with your mobile number to access your account details, referral bonuses, and order history. Your session will stay saved for 7 days.
            </p>
            <button
              onClick={openLoginModal}
              className="bg-[#A80000] hover:bg-red-800 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              Login with Mobile Number
            </button>
          </div>
        ) : (
          <>
            {/* User Account Details Table */}
            <div className="space-y-4 text-xs sm:text-sm text-gray-900 font-medium max-w-2xl bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <div className="grid grid-cols-12 items-center py-1 border-b border-gray-100 pb-3">
                <span className="col-span-4 font-bold text-gray-900">Account Status</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-7 font-bold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Active (7-Day Cookie Session)
                </span>
              </div>

              <div className="grid grid-cols-12 items-center py-1 border-b border-gray-100 pb-3">
                <span className="col-span-4 font-bold text-gray-900">Mobile Number</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-7 font-extrabold text-[#A80000] text-base">+91 {displayPhone}</span>
              </div>

              <div className="grid grid-cols-12 items-center py-1 border-b border-gray-100 pb-3">
                <span className="col-span-4 font-bold text-gray-900">Credit Value (Bonus)</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-7 text-gray-800">₹ 0.00</span>
              </div>

              <div className="grid grid-cols-12 items-center py-1">
                <span className="col-span-4 font-bold text-gray-900">Referral Code</span>
                <span className="col-span-1 text-center font-bold">:</span>
                <span className="col-span-7 text-gray-800 flex items-center gap-1.5 font-bold">
                  <span>{referralCode}</span>
                  <button
                    onClick={handleCopyReferral}
                    title="Copy Referral Code"
                    className="p-1 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </span>
              </div>
            </div>

            {/* Referral Info Callout Box */}
            <div className="my-6 bg-[#F0F6FE] border-l-4 border-[#3B82F6] p-4.5 rounded-r-2xl text-xs sm:text-sm text-gray-800 space-y-1 max-w-2xl">
              <p>Share your referral code with your friends and earn a bonus.</p>
              <p>
                When your friend{" "}
                <strong className="font-bold text-gray-900">
                  signs up using your referral code
                </strong>{" "}
                and places an order, you will receive the bonus.
              </p>
            </div>

            <div className="mt-6 max-w-2xl flex justify-end">
              <button
                onClick={logoutUser}
                className="bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-gray-300 transition-all cursor-pointer"
              >
                Log Out Mobile Session
              </button>
            </div>
          </>
        )}

        {/* Credit Statements Section */}
        {/*
        <div className="mt-10 max-w-2xl">
          <h2 className="text-base sm:text-lg font-medium text-[#2A1B54] mb-4">
            Credit Statements
          </h2>

          <div className="border-b border-gray-200 overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-300 font-bold text-gray-900 pb-2">
                  <th className="py-2.5 px-2 w-12 text-center">#</th>
                  <th className="py-2.5 px-4 text-left">Description</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-400 font-medium">
                    No more data
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        */}
      </main>

      {/* Footer */}
      <UserFooter />
    </div>
  );
};

export default MyAccount;
