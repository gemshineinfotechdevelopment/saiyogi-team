import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Download, Printer, CheckCircle2, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export interface ChitReceiptSchemeItem {
  schemeName: string;
  monthlyAmountPerPerson: number;
  personCount: number;
  totalMonthlyAmount: number;
}

export interface ChitReceiptData {
  receiptNumber: string;
  applicationNumber?: string;
  customerName: string;
  phone: string;
  email?: string;
  location?: string;
  schemeName: string;
  personCount: number;
  monthlyAmountPerPerson: number;
  expectedMonthlyAmount: number;
  amountReceived: number;
  paymentMethod: string;
  transactionId?: string;
  paymentDate: string | Date;
  paymentStatus?: string;
  installmentMonth?: string;
  monthNumber?: number;
  totalPaidTillDate?: number;
  remainingSchemeBalance?: number;
  totalMonths?: number;
  paidMonths?: number;
  notes?: string;
  schemesBreakdown?: ChitReceiptSchemeItem[];
  totalPersons?: number;
  combinedMonthlyPayable?: number;
}

interface ChitReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ChitReceiptData | null;
}

export const ChitReceiptModal: React.FC<ChitReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt
}) => {
  const { settings } = useSiteSettings();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!receipt) return null;

  const companyName = settings?.billing?.companyName || "AVINAASH BALA CRACKERS SHOP";
  const subCompanyName = settings?.siteName || "SAI YOGI CRACKERS";
  const companyPhone = settings?.contact?.phone || "+91 95859 75756";
  const companyAddress = settings?.contact?.address || "Sattur, Virudhunagar District, Tamil Nadu - 626203";
  const logoUrl = settings?.logo || "/saiyogi-logo-1.png";

  const formattedDate = receipt.paymentDate
    ? new Date(receipt.paymentDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
    : new Date().toLocaleDateString("en-IN");

  const breakdownItems = (receipt.schemesBreakdown && receipt.schemesBreakdown.length > 0)
    ? receipt.schemesBreakdown
    : [{
        schemeName: receipt.schemeName,
        monthlyAmountPerPerson: receipt.monthlyAmountPerPerson,
        personCount: receipt.personCount || 1,
        totalMonthlyAmount: receipt.expectedMonthlyAmount || ((receipt.monthlyAmountPerPerson || 0) * (receipt.personCount || 1))
      }];

  const totalPersonsCount = receipt.totalPersons || breakdownItems.reduce((sum, item) => sum + (item.personCount || 1), 0);
  const totalMonthlyPayable = receipt.combinedMonthlyPayable || breakdownItems.reduce((sum, item) => sum + (item.totalMonthlyAmount || 0), 0);

  const handlePrint = () => {
    if (!receiptRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blocked! Please allow popups to print receipt.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Chit Receipt - ${receipt.receiptNumber}</title>
          <style>
            @page { size: A4; margin: 12mm; }
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; margin: 0; padding: 10px; }
            * { box-sizing: border-box; }
            .receipt-box { max-width: 680px; margin: 0 auto; border: 2px solid #7A1416; border-radius: 12px; padding: 24px; }
            .header { text-align: center; border-bottom: 2px solid #7A1416; padding-bottom: 12px; margin-bottom: 14px; }
            .title { color: #7A1416; font-size: 20px; font-weight: 900; text-transform: uppercase; margin: 0; }
            .subtitle { font-size: 13px; font-weight: bold; color: #334155; margin: 3px 0 0 0; }
            .contact { font-size: 11px; color: #64748b; margin: 3px 0 0 0; }
            .top-bar { display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 12px; font-size: 12px; margin-bottom: 14px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin: 6px 0; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .section-title { font-weight: bold; color: #7A1416; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px; }
            .breakdown-table { border: 2px solid #7A1416 !important; margin: 10px 0; }
            .breakdown-summary { background: #fef3c7; border: 1px solid #fde68a; padding: 6px 10px; font-weight: bold; font-size: 11px; margin-top: 4px; }
            .payment-card { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 10px 14px; font-size: 12px; margin: 14px 0; }
            .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 24px; font-size: 11px; color: #64748b; }
            .badge-paid { background: #d1fae5; color: #065f46; font-weight: bold; padding: 3px 8px; border-radius: 6px; font-size: 11px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            ${receiptRef.current.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    setIsDownloading(true);
    toast.loading("Generating PDF Receipt...", { id: "pdf-chit-receipt" });

    try {
      const html2canvasModule = await import("html2canvas");
      const jsPDFModule = await import("jspdf");

      const canvas = await html2canvasModule.default(receiptRef.current, {
        scale: 2.5,
        backgroundColor: "#ffffff",
        allowTaint: true,
        useCORS: true
      });

      const pdf = new jsPDFModule.jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 12;
      const imgWidth = pdfWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", margin, margin, imgWidth, imgHeight);
      pdf.save(`Receipt_${receipt.receiptNumber}_${receipt.customerName.replace(/\s+/g, "_")}.pdf`);

      toast.success("Receipt PDF Downloaded!", { id: "pdf-chit-receipt" });
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF. You can use the Print option.", { id: "pdf-chit-receipt" });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-6 sm:p-7 bg-white rounded-3xl font-sans max-h-[95vh] overflow-y-auto space-y-4">
        <DialogHeader className="border-b border-gray-100 pb-3 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-lg font-extrabold text-[#2A1B54] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Chit Scheme Official Payment Receipt</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 font-medium">
              Receipt No: <span className="font-mono font-bold text-gray-800">{receipt.receiptNumber}</span>
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5 text-gray-700" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? "Generating..." : "Download PDF"}</span>
            </button>
          </div>
        </DialogHeader>

        {/* RECEIPT PAPER CONTAINER (Target for PDF & Print) */}
        <div
          ref={receiptRef}
          className="bg-white border-2 border-[#7A1416] rounded-2xl p-6 text-gray-800 space-y-4 shadow-sm"
        >
          {/* Header with Logo & Shop Info */}
          <div className="text-center border-b-2 border-[#7A1416] pb-3 space-y-1">
            <div className="flex items-center justify-center gap-3">
              <img
                src={logoUrl}
                alt="Logo"
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <h1 className="text-xl sm:text-2xl font-black text-[#7A1416] uppercase tracking-wide">
                {companyName}
              </h1>
            </div>
            <p className="text-xs font-bold text-gray-700 tracking-wider">
              {subCompanyName} • CHIT SCHEME PAYMENT RECEIPT
            </p>
            <p className="text-[11px] text-gray-500 font-medium">
              {companyAddress} • Mobile: {companyPhone}
            </p>
          </div>

          {/* Top Bar: Receipt Number & Date */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs">
            <div>
              <span className="text-gray-500 block text-[11px]">Receipt Number:</span>
              <strong className="text-[#7A1416] font-mono text-sm font-extrabold">{receipt.receiptNumber}</strong>
            </div>
            {receipt.applicationNumber && (
              <div>
                <span className="text-gray-500 block text-[11px]">Application No:</span>
                <strong className="text-gray-800 font-mono font-bold">{receipt.applicationNumber}</strong>
              </div>
            )}
            <div className="text-right">
              <span className="text-gray-500 block text-[11px]">Payment Date:</span>
              <strong className="text-gray-800 font-bold">{formattedDate}</strong>
            </div>
          </div>

          {/* Subscriber & Scheme Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Subscriber Info */}
            <div className="bg-gray-50/80 border border-gray-200/80 rounded-xl p-3.5 space-y-2">
              <div className="font-extrabold text-[#7A1416] text-[11px] uppercase tracking-wider border-b border-gray-200 pb-1">
                Subscriber Details
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Customer Name:</span>
                  <strong className="text-gray-900 font-bold">{receipt.customerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Mobile Number:</span>
                  <strong className="text-gray-900 font-mono font-bold">{receipt.phone}</strong>
                </div>
                {receipt.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Email:</span>
                    <strong className="text-gray-700 truncate max-w-[150px]">{receipt.email}</strong>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Location:</span>
                  <strong className="text-gray-800 font-semibold">{receipt.location || "N/A"}</strong>
                </div>
              </div>
            </div>

            {/* Scheme & Person Details */}
            <div className="bg-gray-50/80 border border-gray-200/80 rounded-xl p-3.5 space-y-2">
              <div className="font-extrabold text-[#7A1416] text-[11px] uppercase tracking-wider border-b border-gray-200 pb-1">
                Scheme Enrollment Details
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Scheme Name:</span>
                  <strong className="text-[#2A1B54] font-extrabold">{receipt.schemeName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Total Persons Enrolled:</span>
                  <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-extrabold text-[11px]">
                    {receipt.personCount} Person(s)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Monthly / Person:</span>
                  <strong className="text-gray-900 font-semibold">₹{receipt.monthlyAmountPerPerson?.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Expected Installment:</span>
                  <strong className="text-emerald-700 font-extrabold">₹{receipt.expectedMonthlyAmount?.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* CHIT SCHEMES & PERSONS BREAKDOWN TABLE (e.g. 300 x 5 = 1500, 500 x 3 = 1500, 700 x 1 = 700) */}
          <div className="border-2 border-[#7A1416]/40 rounded-xl overflow-hidden text-xs bg-white breakdown-table">
            <div className="bg-amber-50 px-3.5 py-2 border-b border-[#7A1416]/30 flex flex-wrap justify-between items-center gap-1">
              <strong className="text-[#7A1416] text-[11px] uppercase tracking-wider">
                Chit Schemes &amp; Persons Breakdown
              </strong>
              <span className="text-[11px] font-mono font-bold text-gray-600">
                Rate × Persons = Monthly Amount
              </span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-700 font-extrabold text-[11px] border-b border-gray-300">
                  <th className="p-2 border border-gray-200">Scheme Name</th>
                  <th className="p-2 border border-gray-200 text-center font-mono">Chit Calculation</th>
                  <th className="p-2 border border-gray-200 text-center">Persons</th>
                  <th className="p-2 border border-gray-200 text-right">Monthly Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {breakdownItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/60">
                    <td className="p-2 border border-gray-200 font-bold text-gray-900">
                      {item.schemeName}
                    </td>
                    <td className="p-2 border border-gray-200 text-center font-mono font-bold text-[#7A1416]">
                      {item.monthlyAmountPerPerson} × {item.personCount} = ₹{item.totalMonthlyAmount.toLocaleString()}
                    </td>
                    <td className="p-2 border border-gray-200 text-center font-bold text-gray-800">
                      {item.personCount}
                    </td>
                    <td className="p-2 border border-gray-200 text-right font-black text-emerald-700">
                      ₹{item.totalMonthlyAmount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-amber-100/70 font-black border-t-2 border-[#7A1416] text-xs">
                  <td className="p-2 border border-gray-200 text-gray-900 uppercase">
                    Total Summary
                  </td>
                  <td className="p-2 border border-gray-200 text-center font-mono font-black text-[#7A1416]">
                    {breakdownItems.map(item => `${item.monthlyAmountPerPerson} × ${item.personCount} = ${item.totalMonthlyAmount}`).join(" + ")}
                  </td>
                  <td className="p-2 border border-gray-200 text-center font-black text-gray-900">
                    Total Persons = {totalPersonsCount}
                  </td>
                  <td className="p-2 border border-gray-200 text-right text-emerald-800 text-sm font-black">
                    ₹{totalMonthlyPayable.toLocaleString()} / mo
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="bg-amber-50/90 px-3 py-1.5 border-t border-amber-200 flex flex-wrap justify-between items-center text-[11px] font-bold text-gray-800 breakdown-summary">
              <span className="font-mono text-[#7A1416]">
                Summary: {breakdownItems.map(item => `${item.monthlyAmountPerPerson} × ${item.personCount} = ${item.totalMonthlyAmount}`).join(", ")}
              </span>
              <span>
                Total Persons: <strong className="text-amber-950 font-black">{totalPersonsCount}</strong>
                <span className="mx-2 text-gray-400">•</span>
                Monthly Payable Amount: <strong className="text-emerald-700 font-black">₹{totalMonthlyPayable.toLocaleString()}</strong>
              </span>
            </div>
          </div>

          {/* Payment Received Highlight Card */}
          <div className="bg-emerald-50/90 border-2 border-emerald-300 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-emerald-900 font-black text-xs uppercase tracking-wide">
                Amount Received &amp; Installment Details
              </span>
              <span className="bg-emerald-600 text-white font-black px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                {receipt.paymentStatus || "PAID"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <span className="text-gray-500 text-[11px] block">Installment</span>
                <strong className="text-gray-900 text-xs font-extrabold">
                  {receipt.installmentMonth || `Month ${receipt.monthNumber || 1}`}
                </strong>
              </div>
              <div>
                <span className="text-gray-500 text-[11px] block">Amount Received</span>
                <strong className="text-emerald-700 text-base font-black">
                  ₹{receipt.amountReceived?.toLocaleString()}
                </strong>
              </div>
              <div>
                <span className="text-gray-500 text-[11px] block">Payment Method</span>
                <strong className="text-gray-900 text-xs font-extrabold">
                  {receipt.paymentMethod || "Cash"}
                </strong>
              </div>
              <div>
                <span className="text-gray-500 text-[11px] block">Transaction ID / Ref</span>
                <strong className="text-gray-800 font-mono text-xs font-semibold">
                  {receipt.transactionId || "N/A"}
                </strong>
              </div>
            </div>

            {receipt.notes && (
              <div className="text-[11px] text-gray-600 pt-1 border-t border-emerald-200">
                <span className="font-semibold text-gray-700">Notes:</span> {receipt.notes}
              </div>
            )}
          </div>

          {/* Cumulative Scheme Summary */}
          {(receipt.totalPaidTillDate !== undefined || receipt.remainingSchemeBalance !== undefined) && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs flex flex-wrap justify-between items-center gap-2">
              {receipt.paidMonths !== undefined && receipt.totalMonths !== undefined && (
                <div>
                  <span className="text-gray-500 text-[11px]">Installment Progress: </span>
                  <strong className="text-gray-800 font-bold">{receipt.paidMonths} / {receipt.totalMonths} Months</strong>
                </div>
              )}
              {receipt.totalPaidTillDate !== undefined && (
                <div>
                  <span className="text-gray-500 text-[11px]">Total Paid Till Date: </span>
                  <strong className="text-emerald-700 font-extrabold">₹{receipt.totalPaidTillDate?.toLocaleString()}</strong>
                </div>
              )}
              {receipt.remainingSchemeBalance !== undefined && (
                <div>
                  <span className="text-gray-500 text-[11px]">Balance Remaining: </span>
                  <strong className="text-rose-700 font-extrabold">₹{receipt.remainingSchemeBalance?.toLocaleString()}</strong>
                </div>
              )}
            </div>
          )}

          {/* Footer & Authorized Signatory */}
          <div className="flex items-end justify-between pt-4 border-t border-gray-200 text-[11px] text-gray-500">
            <div>
              <p className="font-semibold text-gray-700 m-0">Thank you for saving with Sai Yogi Crackers!</p>
              <p className="text-[10px] text-gray-400 m-0">This is an authentic computer generated chit payment receipt.</p>
            </div>
            <div className="text-center border-t border-dashed border-gray-400 pt-1 w-44">
              <strong className="text-[#7A1416] text-xs block">{companyName}</strong>
              <span className="text-[10px] text-gray-500">Authorized Signatory</span>
            </div>
          </div>
        </div>

        {/* Modal Close Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer transition-all"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
