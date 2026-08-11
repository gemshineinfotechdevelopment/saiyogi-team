import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import {
  Truck,
  ShieldCheck,
  FileText,
  AlertCircle,
  Package,
  CreditCard,
  Scale,
  CheckCircle2,
  Info,
  HelpCircle,
  Building2,
  Lock
} from "lucide-react";

interface TermsProps {
  defaultTab?: "transport" | "general" | "privacy";
}

const Terms: React.FC<TermsProps> = ({ defaultTab = "transport" }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"transport" | "general" | "privacy">(defaultTab);

  useEffect(() => {
    if (location.pathname.includes("privacy")) {
      setActiveTab("privacy");
    } else if (location.hash === "#transport" || defaultTab === "transport") {
      setActiveTab("transport");
    }
  }, [location, defaultTab]);

  const transportTerms = [
    {
      title: "Transport Charges",
      desc: "Transport charges are payable entirely by the customer and are not included in the product/order amount."
    },
    {
      title: "Independent Transport Service",
      desc: "The parcel will be handed over to the transport service selected/used by the shop. The transport service operates independently from the shop."
    },
    {
      title: "Charges Determined by Transport",
      desc: "The transport office will determine the applicable transportation charges based on the parcel, destination, weight, or other factors."
    },
    {
      title: "No Connection with Shop",
      desc: "The shop has no control or responsibility over the transport charges collected by the transport service."
    },
    {
      title: "Payment at Transport Office",
      desc: "The customer must pay the applicable transport charges directly to the transport office at the time of parcel collection."
    },
    {
      title: "Parcel Collection",
      desc: "The customer is responsible for collecting the parcel from the designated transport office after paying the applicable transport charges."
    },
    {
      title: "Additional Transport Charges",
      desc: "Any additional charges imposed by the transport service, including handling or other applicable fees, must also be borne by the customer."
    },
    {
      title: "Transport Delays/Damages",
      desc: "Any delay, loss, damage, or issue occurring after the parcel is handed over to the transport service should be addressed directly with the respective transport service."
    },
    {
      title: "Shop Responsibility",
      desc: "The shop's responsibility is limited to properly packing and handing over the customer's parcel to the transport service."
    },
    {
      title: "Acceptance of Terms",
      desc: "By placing the order, the customer acknowledges and agrees to these transport-related terms and conditions."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-gray-800">
      <UserHeader />

      {/* Breadcrumb Header Bar */}
      <div className="bg-[#F8F7FA] border-b border-gray-200/80 py-3.5 px-4 sm:px-12">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-xs text-gray-600 font-medium">
          <Link to="/" className="hover:text-[#A80000] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#A80000] font-bold">
            {activeTab === "privacy" ? "Privacy Policy" : "Terms & Conditions"}
          </span>
        </div>
      </div>

      <main className="container mx-auto px-4 py-10 max-w-6xl flex-1">

        {/* Banner */}
        <div className="bg-gradient-to-br from-[#A80000] via-[#7A1416] to-[#2A1B54] text-center py-12 px-6 rounded-3xl mb-10 relative overflow-hidden border border-[#F4C542]/20 shadow-xl text-white">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#F4C542]/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>

          <span className="bg-[#F4C542]/20 border border-[#F4C542]/40 text-[#F4C542] text-[11px] font-black tracking-widest uppercase px-3 py-1 rounded-full mb-3 inline-block">
            ✨ Customer Transparency & Policy Guidelines ✨
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-wider mb-3 font-display">
            {activeTab === "privacy" ? "Privacy Policy" : "Terms & Conditions"}
          </h1>
          <p className="text-gray-200 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Please read these official terms, conditions, and transport policies carefully before placing your order with Sai Yogi Crackers.
          </p>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 mb-10 bg-white border border-gray-200 p-2 rounded-2xl max-w-3xl mx-auto shadow-xs">
          <button
            onClick={() => setActiveTab('transport')}
            className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${activeTab === 'transport'
                ? "bg-[#A80000] text-white shadow-md scale-[1.02]"
                : "text-gray-600 hover:text-[#A80000] hover:bg-red-50/50"
              }`}
          >
            <Truck className="h-4 w-4" /> Transport Charges
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${activeTab === 'general'
                ? "bg-[#2A1B54] text-white shadow-md scale-[1.02]"
                : "text-gray-600 hover:text-[#2A1B54] hover:bg-purple-50/50"
              }`}
          >
            <FileText className="h-4 w-4" /> General Terms
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 min-w-[160px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${activeTab === 'privacy'
                ? "bg-[#F4C542] text-gray-950 shadow-md scale-[1.02]"
                : "text-gray-600 hover:text-amber-700 hover:bg-amber-50/50"
              }`}
          >
            <Lock className="h-4 w-4" /> Privacy Policy
          </button>
        </div>

        {/* TAB 1: TRANSPORT CHARGES - TERMS & CONDITIONS */}
        {activeTab === 'transport' && (
          <div className="space-y-8 animate-fade-in">
            {/* Special Highlight Header Card */}
            <div className="bg-gradient-to-r from-amber-500/10 via-red-500/5 to-amber-500/10 border-2 border-amber-300/80 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-amber-200/80 pb-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#A80000] text-white flex items-center justify-center shadow-md shrink-0">
                    <Truck className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-wide">
                      Transport Charges – Terms & Conditions
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium mt-0.5">
                      Clear rules regarding shipment, delivery charges, transport handovers, and collection responsibilities.
                    </p>
                  </div>
                </div>
                <span className="bg-[#A80000] text-white font-extrabold text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-2xs">
                  10 Core Guidelines
                </span>
              </div>

              {/* 10 Points List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {transportTerms.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-amber-400 transition-all duration-200 flex items-start gap-4"
                  >
                    <div className="w-9 h-9 rounded-xl bg-red-50 text-[#A80000] font-black text-sm flex items-center justify-center border border-red-100 shrink-0 mt-0.5">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-sm text-gray-900 leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Supreme Court Statutory Note */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-md">
              <div className="flex items-start gap-4">
                <ShieldCheck className="h-6 w-6 text-[#F4C542] shrink-0 mt-1" />
                <div className="space-y-2 text-xs sm:text-sm">
                  <h4 className="font-extrabold text-[#F4C542] text-sm sm:text-base uppercase tracking-wider">
                    Statutory Supreme Court Order Compliance
                  </h4>
                  <p className="text-gray-300 leading-relaxed font-normal">
                    As per the Supreme Court order, online selling of firecrackers is strictly prohibited. This website serves purely as an estimation portal and catalog display for offline ordering. All goods ordered through our catalog are packed at our Sivakasi warehouse and handed over exclusively to independent, licensed offline transport services.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GENERAL TERMS */}
        {activeTab === 'general' && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8 animate-fade-in">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-wide">
                General Business Terms & Ordering Rules
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Standard guidelines for estimation, payments, product substitutions, and cancellation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-gray-700">
              <div className="bg-slate-50 border border-gray-200/80 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#A80000] text-base">
                  <CreditCard className="h-5 w-5" /> 100% Advance Payment
                </div>
                <p className="text-gray-600 leading-relaxed">
                  All orders require 100% advance payment before dispatch from our Sivakasi facility. Cash on delivery (COD) is strictly unavailable due to transport safety regulations.
                </p>
              </div>

              <div className="bg-slate-50 border border-gray-200/80 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#A80000] text-base">
                  <Package className="h-5 w-5" /> Stock & Substitutions
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Due to seasonal rush, if an enquired item is out of stock, we reserve the right to replace it with an equivalent item of equal or higher value from the same category.
                </p>
              </div>

              <div className="bg-slate-50 border border-gray-200/80 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#A80000] text-base">
                  <Scale className="h-5 w-5" /> Price Revision & GST
                </div>
                <p className="text-gray-600 leading-relaxed">
                  All prices listed on the portal are subject to seasonal manufacturer market updates. Applicable taxes or GST will be itemized in your estimate pdf bill.GST will be applicable in both inside and outside Tamilnadu
                </p>
              </div>

              <div className="bg-slate-50 border border-gray-200/80 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#A80000] text-base">
                  <AlertCircle className="h-5 w-5" /> No Return / Cancellation
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Once an order is confirmed, packed, or dispatched to the transport agency, cancellations or returns are strictly not accepted due to safety & explosive transit laws.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PRIVACY POLICY */}
        {activeTab === 'privacy' && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6 animate-fade-in text-xs sm:text-sm text-gray-700 leading-relaxed">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-wide">
                Privacy Policy
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                How we protect and use your contact information at Sai Yogi Crackers.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">1. Information Collection</h3>
              <p className="text-gray-600">
                We collect essential details such as customer name, mobile number, delivery city/address, and email address solely for preparing price estimates, processing order confirmations, and coordinating transport dispatch.
              </p>

              <h3 className="font-bold text-gray-900 text-sm sm:text-base">2. Data Security</h3>
              <p className="text-gray-600">
                Your personal details are stored securely and will never be sold, rented, or traded to third-party marketing networks. We only share necessary delivery contact information with selected transport providers for parcel collection.
              </p>

              <h3 className="font-bold text-gray-900 text-sm sm:text-base">3. Order & Inquiry Communication</h3>
              <p className="text-gray-600">
                By providing your phone number, you consent to receive order updates, status SMS, WhatsApp estimate receipts, and customer service assistance related to your purchases.
              </p>
            </div>
          </div>
        )}

        {/* Contact Support Help Banner */}
        <div className="mt-10 bg-amber-50 border border-amber-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-gray-900 text-sm sm:text-base">
                Have questions regarding transport or order terms?
              </h4>
              <p className="text-xs text-gray-600 font-medium">
                Our support team in Sivakasi is available to assist you with parcel logistics.
              </p>
            </div>
          </div>
          <Link
            to="/contact"
            className="bg-[#A80000] text-white text-xs font-extrabold uppercase px-6 py-3 rounded-xl hover:bg-red-800 transition-colors shrink-0 shadow-xs"
          >
            Contact Customer Support
          </Link>
        </div>

      </main>

      <UserFooter />
    </div>
  );
};

export default Terms;
