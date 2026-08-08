import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { useAuth } from "@/context/AuthContext";
import { downloadOrderReceiptPDF, OrderData } from "@/lib/pdf-generator";
import { FileText, Eye, X, CheckCircle, Package, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface EnquiryItem {
  id: string;
  enquiryNumber: string;
  date: string;
  total: number;
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
}

const MyEnquiry: React.FC = () => {
  const { userPhone, isUserLoggedIn, openLoginModal } = useAuth();
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryItem | null>(null);

  useEffect(() => {
    if (userPhone) {
      const cleanPhone = userPhone.replace(/\D/g, "");
      const savedKey = `user_saved_enquiries_${cleanPhone}`;
      const saved = localStorage.getItem(savedKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setEnquiries(parsed);
            return;
          }
        } catch (_) {}
      }
    }
    setEnquiries([]);
  }, [userPhone]);

  const handleDownloadEstimate = (enquiry: EnquiryItem) => {
    const pdfData: OrderData = {
      orderNumber: enquiry.enquiryNumber,
      customerName: enquiry.customerName || "Customer",
      customerPhone: enquiry.customerPhone || userPhone || "",
      customerEmail: enquiry.customerEmail || "customer@example.com",
      deliveryAddress: enquiry.deliveryAddress || "Sivakasi, Tamil Nadu",
      date: enquiry.date,
      subtotal: enquiry.total,
      total: enquiry.total,
      items: enquiry.items.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        originalPrice: item.price,
      })),
      siteName: "Sai Yogi Crackers",
      siteAddress: "Sivakasi, Virudhunagar District, Tamil Nadu",
      sitePhone: "+91 98765 43210",
      siteEmail: "contact@saiyogicrackers.com"
    };

    toast.info("Generating estimate PDF...");
    downloadOrderReceiptPDF(pdfData);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <UserHeader />

      {/* Breadcrumb Header Bar */}
      <div className="bg-[#F8F7FA] border-b border-gray-200/80 py-3.5 px-4 sm:px-12">
        <div className="max-w-5xl mx-auto flex items-center gap-2 text-xs text-gray-600 font-medium">
          <Link to="/" className="hover:text-[#4C1D95] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#4C1D95] font-bold">My Enquiry</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 py-8 px-4 sm:px-12 max-w-5xl mx-auto w-full">
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
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
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
                <div><strong className="text-gray-900">Name:</strong> {selectedEnquiry.customerName}</div>
                <div><strong className="text-gray-900">Phone:</strong> {selectedEnquiry.customerPhone}</div>
                <div><strong className="text-gray-900">Delivery Address:</strong> {selectedEnquiry.deliveryAddress}</div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-2 uppercase text-[11px] tracking-wider">Enquired Products</h4>
                <div className="space-y-2 border border-gray-100 rounded-xl p-3 max-h-48 overflow-y-auto">
                  {selectedEnquiry.items.map((prod, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs pb-1.5 border-b border-gray-50 last:border-0 last:pb-0">
                      <div>
                        <span className="font-semibold text-gray-800">{prod.productName}</span>
                        <span className="text-gray-400 ml-2">x {prod.quantity}</span>
                      </div>
                      <span className="font-bold text-gray-900">₹ {(prod.price * prod.quantity).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
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

export default MyEnquiry;
