import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Download, Printer, CheckCircle2, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export interface ChitReceiptSchemeItem {
  schemeName: string;
  monthlyAmountPerPerson?: number;
  rate?: number;
  personCount?: number;
  count?: number;
  totalMonthlyAmount?: number;
  subTotal?: number;
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

  const rawCompanyName = settings?.billing?.companyName || settings?.siteName || "SAI YOGI CRACKERS";
  const isAvinaash = /avinaash|bala/i.test(rawCompanyName);
  const companyName = isAvinaash ? "SAI YOGI CRACKERS" : (rawCompanyName || "SAI YOGI CRACKERS");
  const companyPhone = settings?.contact?.phone || "+91 95859 75756";
  const companyAddress = settings?.contact?.address || "Sattur, Virudhunagar District, Tamil Nadu - 626203";
  const logoUrl = settings?.logo || "/saiyogi-logo-1.png";

  const formattedReceiptNo = (receipt.receiptNumber || "").replace(/^AB-CHIT-/i, "SY-CHIT-");
  const formattedAppNo = (receipt.applicationNumber || "").replace(/^AB-APP-/i, "SY-APP-");

  const formattedDate = receipt.paymentDate
    ? new Date(receipt.paymentDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
    : new Date().toLocaleDateString("en-IN");

  const rawBreakdown = (receipt.schemesBreakdown && receipt.schemesBreakdown.length > 0)
    ? receipt.schemesBreakdown
    : [{
        schemeName: receipt.schemeName,
        monthlyAmountPerPerson: receipt.monthlyAmountPerPerson,
        rate: receipt.monthlyAmountPerPerson,
        personCount: receipt.personCount || 1,
        count: receipt.personCount || 1,
        totalMonthlyAmount: receipt.expectedMonthlyAmount || ((receipt.monthlyAmountPerPerson || 0) * (receipt.personCount || 1)),
        subTotal: receipt.expectedMonthlyAmount || ((receipt.monthlyAmountPerPerson || 0) * (receipt.personCount || 1))
      }];

  const breakdownItems = rawBreakdown.map(item => {
    const rate = Number(item.monthlyAmountPerPerson ?? item.rate ?? 0);
    const count = Math.max(1, Number(item.personCount ?? item.count ?? 1));
    const subTotal = Number(item.totalMonthlyAmount ?? item.subTotal ?? (rate * count));
    return {
      schemeName: item.schemeName || "Chit Scheme",
      monthlyAmountPerPerson: rate,
      rate,
      personCount: count,
      count,
      totalMonthlyAmount: subTotal,
      subTotal
    };
  });

  const totalPersonsCount = Number(receipt.totalPersons ?? breakdownItems.reduce((sum, item) => sum + item.count, 0));
  const totalMonthlyPayable = Number(receipt.combinedMonthlyPayable ?? breakdownItems.reduce((sum, item) => sum + item.subTotal, 0));

  const handlePrint = () => {
    if (!receiptRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blocked! Please allow popups to print receipt.");
      return;
    }

    // Collect all stylesheets from main document for full Tailwind & component fidelity in print
    const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map((el) => el.outerHTML)
      .join("\n");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Chit Receipt - ${formattedReceiptNo}</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              box-sizing: border-box !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #1e293b !important;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            }
            .print-receipt-container {
              width: 100% !important;
              max-width: 720px !important;
              margin: 0 auto !important;
              background: #ffffff !important;
              padding: 2px !important;
            }
            /* Clean Multi-Page Flow: Never cut cards or table rows in half */
            .print-avoid-break,
            .subscriber-grid,
            .breakdown-table,
            .payment-card,
            .summary-card,
            .footer-section,
            tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            thead {
              display: table-header-group !important;
            }
            tfoot {
              display: table-footer-group !important;
            }
            @media print {
              body {
                padding: 0 !important;
              }
              .no-print {
                display: none !important;
              }
              .print-grid-2 {
                display: grid !important;
                grid-template-columns: 1fr 1fr !important;
                gap: 12px !important;
              }
              .print-grid-4 {
                display: grid !important;
                grid-template-columns: repeat(4, 1fr) !important;
                gap: 10px !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-receipt-container">
            ${receiptRef.current.outerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }, 300);
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
        useCORS: true,
        logging: false
      });

      const pdf = new jsPDFModule.jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const maxPageContentHeight = pageHeight - margin * 2;
      const totalImgHeight = (canvas.height * imgWidth) / canvas.width;

      if (totalImgHeight <= maxPageContentHeight) {
        // Fits comfortably on 1 page
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        pdf.addImage(imgData, "JPEG", margin, margin, imgWidth, totalImgHeight);
      } else {
        // Multi-page slicing: Slice canvas cleanly by page height so no content is cut off
        const pageCanvasHeight = (canvas.width * maxPageContentHeight) / imgWidth;
        let renderedHeight = 0;
        let pageIndex = 0;

        while (renderedHeight < canvas.height) {
          if (pageIndex > 0) {
            pdf.addPage();
          }

          const sliceHeight = Math.min(pageCanvasHeight, canvas.height - renderedHeight);
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = canvas.width;
          pageCanvas.height = sliceHeight;

          const pageCtx = pageCanvas.getContext("2d");
          if (pageCtx) {
            pageCtx.fillStyle = "#ffffff";
            pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            pageCtx.drawImage(
              canvas,
              0,
              renderedHeight,
              canvas.width,
              sliceHeight,
              0,
              0,
              pageCanvas.width,
              sliceHeight
            );

            const sliceImgData = pageCanvas.toDataURL("image/jpeg", 0.95);
            const sliceImgHeight = (sliceHeight * imgWidth) / canvas.width;
            pdf.addImage(sliceImgData, "JPEG", margin, margin, imgWidth, sliceImgHeight);
          }

          renderedHeight += sliceHeight;
          pageIndex++;
        }
      }

      pdf.save(`Receipt_${formattedReceiptNo}_${(receipt.customerName || "Customer").replace(/\s+/g, "_")}.pdf`);
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
              Receipt No: <span className="font-mono font-bold text-gray-800">{formattedReceiptNo}</span>
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
                SAI YOGI CRACKERS
              </h1>
            </div>
            <p className="text-xs font-bold text-gray-700 tracking-wider">
              MONTHLY CHIT SCHEME PAYMENT RECEIPT
            </p>
            <p className="text-[11px] text-gray-500 font-medium">
              {companyAddress} • Mobile: {companyPhone}
            </p>
          </div>

          {/* Top Bar: Receipt Number & Date */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs">
            <div>
              <span className="text-gray-500 block text-[11px]">Receipt Number:</span>
              <strong className="text-[#7A1416] font-mono text-sm font-extrabold">{formattedReceiptNo}</strong>
            </div>
            {formattedAppNo && (
              <div>
                <span className="text-gray-500 block text-[11px]">Application No:</span>
                <strong className="text-gray-800 font-mono font-bold">{formattedAppNo}</strong>
              </div>
            )}
            <div className="text-right">
              <span className="text-gray-500 block text-[11px]">Payment Date:</span>
              <strong className="text-gray-800 font-bold">{formattedDate}</strong>
            </div>
          </div>

          {/* Subscriber & Scheme Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs print-grid-2 print-avoid-break subscriber-grid">
            {/* Subscriber Info */}
            <div className="bg-gray-50/80 border border-gray-200/80 rounded-xl p-3 space-y-1.5">
              <div className="font-extrabold text-[#7A1416] text-[11px] uppercase tracking-wider border-b border-gray-200 pb-1">
                Subscriber Details
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-gray-500 font-medium shrink-0">Customer Name:</span>
                  <strong className="text-gray-900 font-bold text-right leading-normal">{receipt.customerName}</strong>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-gray-500 font-medium shrink-0">Mobile Number:</span>
                  <strong className="text-gray-900 font-mono font-bold text-right leading-normal">{receipt.phone}</strong>
                </div>
                {receipt.email && (
                  <div className="flex justify-between items-start gap-2 pt-0.5">
                    <span className="text-gray-500 font-medium shrink-0">Email:</span>
                    <strong className="text-gray-800 font-semibold break-all text-right text-[11px] leading-relaxed">
                      {receipt.email}
                    </strong>
                  </div>
                )}
                <div className="flex justify-between items-start gap-2">
                  <span className="text-gray-500 font-medium shrink-0">Location:</span>
                  <strong className="text-gray-800 font-semibold text-right leading-normal">{receipt.location || "N/A"}</strong>
                </div>
              </div>
            </div>

            {/* Scheme & Person Details */}
            <div className="bg-gray-50/80 border border-gray-200/80 rounded-xl p-3 space-y-1.5">
              <div className="font-extrabold text-[#7A1416] text-[11px] uppercase tracking-wider border-b border-gray-200 pb-1">
                Scheme Enrollment Details
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-gray-500 font-medium shrink-0">Scheme Name:</span>
                  <strong className="text-[#2A1B54] font-extrabold text-right break-words leading-tight">{receipt.schemeName}</strong>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-gray-500 font-medium shrink-0">Total Persons Enrolled:</span>
                  <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-extrabold text-[11px]">
                    {receipt.personCount} Person(s)
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-gray-500 font-medium shrink-0">Monthly / Person:</span>
                  <strong className="text-gray-900 font-semibold">₹{(receipt.monthlyAmountPerPerson || 0).toLocaleString()}</strong>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-gray-500 font-medium shrink-0">Expected Installment:</span>
                  <strong className="text-emerald-700 font-extrabold">₹{(receipt.expectedMonthlyAmount || 0).toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* CHIT SCHEMES & PERSONS BREAKDOWN TABLE (e.g. 300 x 5 = 1500, 500 x 3 = 1500, 700 x 1 = 700) */}
          <div className="border-2 border-[#7A1416]/40 rounded-xl overflow-hidden text-xs bg-white breakdown-table print-avoid-break">
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
                {breakdownItems.map((item, idx) => {
                  const rate = item.rate || item.monthlyAmountPerPerson || 0;
                  const count = item.count || item.personCount || 1;
                  const subTotal = item.subTotal || item.totalMonthlyAmount || (rate * count);
                  return (
                    <tr key={idx} className="hover:bg-gray-50/60">
                      <td className="p-2 border border-gray-200 font-bold text-gray-900">
                        {item.schemeName}
                      </td>
                      <td className="p-2 border border-gray-200 text-center font-mono font-bold text-[#7A1416]">
                        {rate} × {count} = ₹{(subTotal || 0).toLocaleString()}
                      </td>
                      <td className="p-2 border border-gray-200 text-center font-bold text-gray-800">
                        {count}
                      </td>
                      <td className="p-2 border border-gray-200 text-right font-black text-emerald-700">
                        ₹{(subTotal || 0).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-amber-100/70 font-black border-t-2 border-[#7A1416] text-xs">
                  <td className="p-2 border border-gray-200 text-gray-900 uppercase">
                    Total Summary
                  </td>
                  <td className="p-2 border border-gray-200 text-center font-mono font-black text-[#7A1416]">
                    {breakdownItems.map(item => `${item.rate || item.monthlyAmountPerPerson || 0} × ${item.count || item.personCount || 1} = ${item.subTotal || item.totalMonthlyAmount || 0}`).join(" + ")}
                  </td>
                  <td className="p-2 border border-gray-200 text-center font-black text-gray-900">
                    Total Persons = {totalPersonsCount}
                  </td>
                  <td className="p-2 border border-gray-200 text-right text-emerald-800 text-sm font-black">
                    ₹{(totalMonthlyPayable || 0).toLocaleString()} / mo
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="bg-amber-50/90 px-3 py-1.5 border-t border-amber-200 flex flex-wrap justify-between items-center text-[11px] font-bold text-gray-800 breakdown-summary">
              <span className="font-mono text-[#7A1416]">
                Summary: {breakdownItems.map(item => `${item.rate || item.monthlyAmountPerPerson || 0} × ${item.count || item.personCount || 1} = ${item.subTotal || item.totalMonthlyAmount || 0}`).join(", ")}
              </span>
              <span>
                Total Persons: <strong className="text-amber-950 font-black">{totalPersonsCount}</strong>
                <span className="mx-2 text-gray-400">•</span>
                Monthly Payable Amount: <strong className="text-emerald-700 font-black">₹{(totalMonthlyPayable || 0).toLocaleString()}</strong>
              </span>
            </div>
          </div>

          {/* Payment Received Highlight Card */}
          <div className="bg-emerald-50/90 border-2 border-emerald-300 rounded-xl p-3.5 space-y-2 text-xs payment-card print-avoid-break">
            <div className="flex items-center justify-between">
              <span className="text-emerald-900 font-black text-xs uppercase tracking-wide">
                Amount Received &amp; Installment Details
              </span>
              <span className="bg-emerald-600 text-white font-black px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                {receipt.paymentStatus || "PAID"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 print-grid-4">
              <div>
                <span className="text-gray-500 text-[11px] block">Installment</span>
                <strong className="text-gray-900 text-xs font-extrabold">
                  {receipt.installmentMonth || `Month ${receipt.monthNumber || 1}`}
                </strong>
              </div>
              <div>
                <span className="text-gray-500 text-[11px] block">Amount Received</span>
                <strong className="text-emerald-700 text-base font-black">
                  ₹{(receipt.amountReceived || 0).toLocaleString()}
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
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs flex flex-wrap justify-between items-center gap-2 summary-card print-avoid-break">
              {receipt.paidMonths !== undefined && receipt.totalMonths !== undefined && (
                <div>
                  <span className="text-gray-500 text-[11px]">Installment Progress: </span>
                  <strong className="text-gray-800 font-bold">{receipt.paidMonths} / {receipt.totalMonths} Months</strong>
                </div>
              )}
              {receipt.totalPaidTillDate !== undefined && (
                <div>
                  <span className="text-gray-500 text-[11px]">Total Paid Till Date: </span>
                  <strong className="text-emerald-700 font-extrabold">₹{(receipt.totalPaidTillDate || 0).toLocaleString()}</strong>
                </div>
              )}
              {receipt.remainingSchemeBalance !== undefined && (
                <div>
                  <span className="text-gray-500 text-[11px]">Balance Remaining: </span>
                  <strong className="text-rose-700 font-extrabold">₹{(receipt.remainingSchemeBalance || 0).toLocaleString()}</strong>
                </div>
              )}
            </div>
          )}

          {/* Footer & Authorized Signatory */}
          <div className="flex items-end justify-between pt-3 border-t border-gray-200 text-[11px] text-gray-500 footer-section print-avoid-break">
            <div>
              <p className="font-semibold text-gray-700 m-0">Thank you for saving with Sai Yogi Crackers!</p>
              <p className="text-[10px] text-gray-400 m-0">This is an authentic computer generated chit payment receipt.</p>
            </div>
            <div className="text-center border-t border-dashed border-gray-400 pt-1 w-44">
              <strong className="text-[#7A1416] text-xs block">SAI YOGI CRACKERS</strong>
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
