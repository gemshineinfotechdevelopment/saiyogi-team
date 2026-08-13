import { toast } from "sonner";
import { ChitSubscriptionItem, MonthlyPaymentLog } from "./api";

/**
 * Get target year, month (1-indexed), monthName and due date description for monthNumber of a chit scheme.
 */
export const getMonthTargetDate = (
  monthNumber: number,
  startDateStr?: string
): { year: number; month: number; monthName: string } => {
  let baseDate = new Date();
  if (startDateStr && startDateStr.trim()) {
    const parts = startDateStr.trim().split('-');
    if (parts.length >= 2) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y) && !isNaN(m)) {
        baseDate = new Date(y, m, 1);
      }
    } else {
      const parsed = new Date(startDateStr);
      if (!isNaN(parsed.getTime())) baseDate = parsed;
    }
  }

  const targetDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + (monthNumber - 1), 1);
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1; // 1 to 12
  const monthName = targetDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  return { year, month, monthName };
};

/**
 * Calculates payment timing status based on system date / payment date vs target due month and due day.
 * 
 * Rules:
 * 1. If paid in a month/year BEFORE the installment's target due month/year => "Advanced Payment"
 * 2. If paid in the SAME month/year as target due month:
 *    - if paid date day <= dueDateDay => "On-time Payment"
 *    - if paid date day > dueDateDay => "Delay Payment"
 * 3. If paid in a month/year AFTER the target due month/year => "Delay Payment"
 */
export const calculatePaymentTimingStatus = (
  paidDateInput: string | Date | undefined,
  monthNumber: number,
  dueDateDay: number = 10,
  startDateStr?: string
): "Advanced Payment" | "On-time Payment" | "Delay Payment" => {
  if (!paidDateInput) return "On-time Payment";

  const payDate = new Date(paidDateInput);
  if (isNaN(payDate.getTime())) return "On-time Payment";

  const { year: dueYear, month: dueMonth } = getMonthTargetDate(monthNumber, startDateStr);

  const payYear = payDate.getFullYear();
  const payMonth = payDate.getMonth() + 1;
  const payDay = payDate.getDate();

  // If paid in a prior year, or same year but prior month -> Advanced Payment
  if (payYear < dueYear || (payYear === dueYear && payMonth < dueMonth)) {
    return "Advanced Payment";
  }

  // If paid in the target due month
  if (payYear === dueYear && payMonth === dueMonth) {
    if (payDay <= dueDateDay) {
      return "On-time Payment";
    } else {
      return "Delay Payment";
    }
  }

  // Paid in a future year or future month -> Delay Payment
  return "Delay Payment";
};

export interface HistoryPaidItem {
  monthNumber: number;
  monthName: string;
  paidAt?: string | Date;
  dueDateDay: number;
  amount: number;
  status: "Advanced Payment" | "On-time Payment" | "Delay Payment" | "Pending";
  paymentMethod: string;
  transactionNumber: string;
  isPaid: boolean;
}

/**
 * Gets all history items for a subscription from Month 1 up to maxMonthNumber.
 */
export const getPaidHistoryList = (
  sub: ChitSubscriptionItem,
  maxMonthNumber: number,
  monthlyAmount: number = 0,
  dueDateDay: number = 10,
  startDateStr?: string
): HistoryPaidItem[] => {
  const historyList: HistoryPaidItem[] = [];
  const logs = sub.monthlyPayments || [];

  for (let m = 1; m <= maxMonthNumber; m++) {
    const log = logs.find(p => p.monthNumber === m);
    const isLogPaid = !!(log && (log.status === 'Paid' || log.status === 'Late Pay' || log.status === 'Advanced Payment' || log.status === 'Advance Payment' || log.status === 'On-time Payment' || log.status === 'Delay Payment'));
    
    const { monthName } = getMonthTargetDate(m, startDateStr);
    let timingStatus: "Advanced Payment" | "On-time Payment" | "Delay Payment" | "Pending" = "Pending";
    let paidDate: string | Date | undefined = undefined;

    if (isLogPaid) {
      paidDate = log?.paidAt || new Date().toISOString();
      const rawStatus = log?.status;
      if (rawStatus === 'Advanced Payment' || rawStatus === 'Advance Payment') {
        timingStatus = 'Advanced Payment';
      } else if (rawStatus === 'On-time Payment') {
        timingStatus = 'On-time Payment';
      } else if (rawStatus === 'Delay Payment') {
        timingStatus = 'Delay Payment';
      } else {
        timingStatus = calculatePaymentTimingStatus(paidDate, m, dueDateDay, startDateStr);
      }
    }

    historyList.push({
      monthNumber: m,
      monthName: log?.monthName || monthName,
      paidAt: paidDate,
      dueDateDay,
      amount: isLogPaid ? (log?.amount || monthlyAmount) : monthlyAmount,
      status: timingStatus,
      paymentMethod: isLogPaid ? (log?.paymentMethod || 'Cash') : '-',
      transactionNumber: log?.transactionNumber || '',
      isPaid: isLogPaid
    });
  }

  return historyList;
};

/**
 * Downloads Chit Scheme Monthly Payment Receipt & Passbook Statement as PDF
 */
export const downloadChitReceiptPDF = async (
  sub: ChitSubscriptionItem,
  monthNumber: number,
  monthlyAmount: number = 0,
  dueDateDay: number = 10,
  startDateStr?: string,
  totalMonths: number = 9
) => {
  const customerName = sub.name || sub.customerName || 'Customer';
  const schemeName = sub.schemeName || 'Chit Scheme';
  const existingLog = (sub.monthlyPayments || []).find(p => p.monthNumber === monthNumber);
  const paidAt = existingLog?.paidAt || new Date().toISOString();
  const paymentMethod = existingLog?.paymentMethod || 'Cash / UPI';
  const transactionNumber = existingLog?.transactionNumber || '';
  const amount = existingLog?.amount || monthlyAmount;
  const formattedDate = new Date(paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const totalSchemeAmount = monthlyAmount * totalMonths;

  let timingStatus: "Advanced Payment" | "On-time Payment" | "Delay Payment" = "On-time Payment";
  const rawStatus = existingLog?.status;
  if (rawStatus === 'Advanced Payment' || rawStatus === 'Advance Payment') {
    timingStatus = 'Advanced Payment';
  } else if (rawStatus === 'On-time Payment') {
    timingStatus = 'On-time Payment';
  } else if (rawStatus === 'Delay Payment') {
    timingStatus = 'Delay Payment';
  } else {
    timingStatus = calculatePaymentTimingStatus(paidAt, monthNumber, dueDateDay, startDateStr);
  }

  const receiptNo = `REC-M${monthNumber}-${Date.now().toString().slice(-6)}`;
  const historyList = getPaidHistoryList(sub, monthNumber, monthlyAmount, dueDateDay, startDateStr);
  const paidItems = historyList.filter(item => item.isPaid);
  const totalPaidTillNow = paidItems.reduce((sum, item) => sum + item.amount, 0);
  const remainingBalance = Math.max(0, totalSchemeAmount - totalPaidTillNow);

  const paidHistoryRowsHTML = historyList.map(item => {
    const itemDate = item.paidAt ? new Date(item.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
    let statusColor = '#64748b';
    let statusBg = '#f1f5f9';

    if (item.status === 'Advanced Payment') {
      statusColor = '#1d4ed8';
      statusBg = '#dbeafe';
    } else if (item.status === 'On-time Payment') {
      statusColor = '#047857';
      statusBg = '#d1fae5';
    } else if (item.status === 'Delay Payment') {
      statusColor = '#b45309';
      statusBg = '#fef3c7';
    }

    return `
      <tr style="border-bottom: 1px solid #e2e8f0; background: ${item.isPaid ? '#ffffff' : '#fafafa'};">
        <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">#${item.monthNumber}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">${item.monthName}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">${itemDate}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">
          <span style="background: ${statusBg}; color: ${statusColor}; font-weight: bold; font-size: 10px; padding: 2px 6px; border-radius: 4px; display: inline-block;">
            ${item.status}
          </span>
        </td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; color: #475569;">${item.paymentMethod || '-'} ${item.transactionNumber ? `(#${item.transactionNumber})` : ''}</td>
        <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: ${item.isPaid ? '#047857' : '#94a3b8'};">
          ${item.isPaid ? `₹${item.amount.toLocaleString()}` : `₹${item.amount.toLocaleString()} (Pending)`}
        </td>
      </tr>
    `;
  }).join('');

  const statusBadgeColor = timingStatus === 'Advanced Payment' ? '#1d4ed8' : timingStatus === 'On-time Payment' ? '#047857' : '#b45309';

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 680px; background: #ffffff; color: #1e293b; border: 2px solid #7A1416; border-radius: 16px;">
      <div style="text-align: center; border-bottom: 2px solid #7A1416; padding-bottom: 12px; margin-bottom: 16px;">
        <h1 style="color: #7A1416; margin: 0; font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">SAI YOGI CRACKERS</h1>
        <p style="margin: 3px 0 0 0; font-size: 13px; font-weight: bold; color: #334155;">MONTHLY CHIT SCHEME PAYMENT RECEIPT & PASSBOOK STATEMENT</p>
        <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Sattur, Virudhunagar District, Tamil Nadu • Mobile: +91 95859 75756</p>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 12px; background: #f8fafc; padding: 10px 14px; border-radius: 10px; border: 1px solid #cbd5e1;">
        <div>
          <strong>Receipt No:</strong> ${receiptNo}<br/>
          <strong>Receipt Date:</strong> ${formattedDate}
        </div>
        <div style="text-align: right;">
          <strong>Scheme:</strong> ${schemeName}<br/>
          <strong>Monthly Due Date:</strong> Before ${dueDateDay}th of month
        </div>
      </div>

      <div style="margin-bottom: 16px; font-size: 12px;">
        <div style="font-weight: bold; color: #7A1416; font-size: 13px; margin-bottom: 6px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Subscriber Details</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <tr>
            <td style="padding: 3px 0; color: #64748b; width: 130px;">Customer Name:</td>
            <td style="padding: 3px 0; font-weight: bold; color: #0f172a;">${customerName}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; color: #64748b;">Mobile Number:</td>
            <td style="padding: 3px 0; font-weight: bold; color: #0f172a;">${sub.phone || sub.mobileNumber}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; color: #64748b;">Location:</td>
            <td style="padding: 3px 0; font-weight: bold; color: #0f172a;">${sub.location || 'N/A'}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 16px; background: #fef2f2; border: 1px solid #fca5a5; padding: 10px 14px; border-radius: 10px; font-size: 12px;">
        <div style="font-weight: bold; color: #7A1416; font-size: 13px; margin-bottom: 4px; text-transform: uppercase;">CURRENT PAYMENT RECEIVED</div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span><strong>Month:</strong> Month ${monthNumber} (${existingLog?.monthName || `Month ${monthNumber}`})</span>
          <span><strong>Status:</strong> <strong style="color: ${statusBadgeColor};">${timingStatus}</strong></span>
          <span><strong>Amount Paid:</strong> <strong style="color: #047857; font-size: 15px;">₹${amount.toLocaleString()}</strong></span>
        </div>
        <div style="font-size: 11px; color: #475569; margin-top: 4px;">
          Payment Method: ${paymentMethod}${transactionNumber ? ` (Ref #${transactionNumber})` : ''} • Date: ${formattedDate}
        </div>
      </div>

      <!-- PREVIOUS PAYMENT HISTORY TABLE -->
      <div style="margin-bottom: 16px;">
        <div style="font-weight: bold; color: #7A1416; font-size: 13px; margin-bottom: 6px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
          <span>PAID HISTORY STATEMENT (Months 1 to ${monthNumber})</span>
          <span style="font-size: 11px; color: #047857; font-weight: bold;">Total Paid: ₹${totalPaidTillNow.toLocaleString()}</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
          <thead>
            <tr style="background: #f1f5f9; color: #334155; font-size: 10px; text-transform: uppercase;">
              <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">Month #</th>
              <th style="padding: 6px; border: 1px solid #cbd5e1;">Month Name</th>
              <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">Paid Date</th>
              <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">Status</th>
              <th style="padding: 6px; border: 1px solid #cbd5e1;">Method / Ref</th>
              <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${paidHistoryRowsHTML}
          </tbody>
          <tfoot>
            <tr style="background: #f8fafc; font-weight: bold;">
              <td colspan="5" style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">Cumulative Total Amount Paid Till Date:</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right; color: #047857; font-size: 12px;">₹${totalPaidTillNow.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px 14px; border-radius: 10px; font-size: 11px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span>Total Scheme: ₹${totalSchemeAmount.toLocaleString()} (${totalMonths} Months)</span>
          <span>Progress: <span style="color: #047857;">₹${totalPaidTillNow.toLocaleString()} (${paidItems.length}/${totalMonths} Paid)</span></span>
          <span>Balance Remaining: <span style="color: #b91c1c;">₹${remainingBalance.toLocaleString()}</span></span>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; font-size: 11px; color: #64748b;">
        <div>
          <p style="margin: 0;">Thank you for your payment!</p>
          <p style="margin: 2px 0 0 0;">This is an official computer generated receipt & passbook statement.</p>
        </div>
        <div style="text-align: center; border-top: 1px dashed #94a3b8; padding-top: 4px; width: 160px;">
          <strong style="color: #7A1416;">Sai Yogi Crackers</strong><br/>
          Authorized Signatory
        </div>
      </div>
    </div>
  `;

  const tempDiv = document.createElement('div');
  tempDiv.id = 'chit-receipt-pdf-container';
  tempDiv.innerHTML = html;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '0';
  tempDiv.style.width = '680px';
  tempDiv.style.backgroundColor = '#ffffff';
  document.body.appendChild(tempDiv);

  toast.loading("Generating & Downloading PDF Receipt...", { id: "pdf-toast" });

  try {
    const html2canvasModule = await import("html2canvas");
    const jsPDFModule = await import("jspdf");
    const canvas = await html2canvasModule.default(tempDiv, {
      scale: 2,
      backgroundColor: "#ffffff",
      allowTaint: true,
      useCORS: true,
      onclone: (clonedDoc) => {
        const clonedTarget = clonedDoc.getElementById('chit-receipt-pdf-container');
        if (clonedTarget) {
          clonedTarget.style.position = 'static';
          clonedTarget.style.left = '0';
          clonedTarget.style.top = '0';
          clonedTarget.style.opacity = '1';
        }
      }
    });
    const pdf = new jsPDFModule.jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const margin = 10;
    const imgWidth = pdfWidth - (margin * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "JPEG", margin, margin, imgWidth, imgHeight);
    pdf.save(`Receipt_Month${monthNumber}_${customerName.replace(/\s+/g, '_')}.pdf`);
    toast.success("PDF Receipt Downloaded!", { id: "pdf-toast" });
  } catch (err) {
    console.error(err);
    toast.error("Failed to generate PDF receipt", { id: "pdf-toast" });
  } finally {
    if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
  }
};
