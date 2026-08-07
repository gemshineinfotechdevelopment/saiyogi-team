import React from "react";
import { Link } from "react-router-dom";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { useAuth } from "@/context/AuthContext";

const MyAccount: React.FC = () => {
  const { userPhone, userName, isUserLoggedIn } = useAuth();

  const displayName = userName || localStorage.getItem("user_name") || "User";
  const displayPhone = userPhone || localStorage.getItem("user_phone") || "-";

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
          <div className="grid grid-cols-12 items-center py-1 border-b border-gray-100 pb-3">
            <span className="col-span-4 font-bold text-gray-900">Name</span>
            <span className="col-span-1 text-center font-bold">:</span>
            <span className="col-span-7 text-gray-800 font-semibold">{displayName}</span>
          </div>

          <div className="grid grid-cols-12 items-center py-1 border-b border-gray-100 pb-3">
            <span className="col-span-4 font-bold text-gray-900">Mobile Number</span>
            <span className="col-span-1 text-center font-bold">:</span>
            <span className="col-span-7 text-gray-800 font-semibold">{displayPhone}</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <UserFooter />
    </div>
  );
};

export default MyAccount;
