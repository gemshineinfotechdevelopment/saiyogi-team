import React, { useState } from "react";
import { Link } from "react-router-dom";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { useAuth } from "@/context/AuthContext";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

const MyAccount: React.FC = () => {
  const { userPhone, isUserLoggedIn } = useAuth();
  const [copied, setCopied] = useState(false);

  const referralCode = "NQYJELK758";
  const displayName = "Kumar";
  const displayPhone = userPhone || "9092548347";

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

        {/* User Account Details Table */}
        <div className="space-y-4 text-xs sm:text-sm text-gray-900 font-medium max-w-2xl">
          <div className="grid grid-cols-12 items-center py-1">
            <span className="col-span-4 font-bold text-gray-900">Name</span>
            <span className="col-span-1 text-center font-bold">:</span>
            <span className="col-span-7 text-gray-800">{displayName}</span>
          </div>

          <div className="grid grid-cols-12 items-center py-1">
            <span className="col-span-4 font-bold text-gray-900">Mobile Number</span>
            <span className="col-span-1 text-center font-bold">:</span>
            <span className="col-span-7 text-gray-800">{displayPhone}</span>
          </div>

          <div className="grid grid-cols-12 items-center py-1">
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
        <div className="my-8 bg-[#F0F6FE] border-l-4 border-[#3B82F6] p-4.5 rounded-r-lg text-xs sm:text-sm text-gray-800 space-y-1 max-w-2xl">
          <p>Share your referral code with your friends and earn a bonus.</p>
          <p>
            When your friend{" "}
            <strong className="font-bold text-gray-900">
              signs up using your referral code
            </strong>{" "}
            and places an order, you will receive the bonus.
          </p>
        </div>

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
