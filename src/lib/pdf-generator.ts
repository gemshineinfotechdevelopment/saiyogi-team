/**
 * Generate and download order receipt as PDF
 * Uses HTML canvas to create a PDF-like document
 */

import saiyogiLogo from "@/assets/saiyogi-logo-1.png";

export interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
  originalPrice?: number;
  hasDiscount?: boolean;
  netRate?: number;
  displayNetRate?: boolean;
}

export interface OrderData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  state?: string;
  district?: string;
  items: OrderItem[];
  subtotal: number;
  discountPercent?: number;
  total: number;
  packingCharge?: number;
  date: string;
  siteName?: string;
  companyName?: string;
  siteAddress?: string;
  sitePhone?: string;
  siteEmail?: string;
  siteWebsite?: string;
  gstNumber?: string;
}

export function downloadOrderReceiptPDF(orderData: OrderData) {
  const html = generateReceiptHTML(orderData);

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  tempDiv.style.position = "absolute";
  tempDiv.style.left = "-9999px";
  tempDiv.style.width = "800px";
  document.body.appendChild(tempDiv);

  const cleanup = () => {
    if (document.body.contains(tempDiv)) {
      document.body.removeChild(tempDiv);
    }
  };

  try {
    import("html2canvas").then((html2canvas) => {
      html2canvas
        .default(tempDiv, {
          allowTaint: true,
          useCORS: true,
          scale: 1.5,
          backgroundColor: "#ffffff",
        })
        .then((canvas) => {
          import("jspdf").then((jsPDF) => {
            const pdf = new jsPDF.jsPDF({
              orientation: "portrait",
              unit: "mm",
              format: "a4",
              compress: true,
            });

            const imgData = canvas.toDataURL("image/jpeg", 0.8);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 10;
            const imgWidth = pdfWidth - (margin * 2);
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            const pageHeight = pdfHeight - (margin * 2);

            let heightLeft = imgHeight;
            let position = margin;

            pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight, undefined, 'MEDIUM');
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
              position = margin - (imgHeight - heightLeft);
              pdf.addPage();
              pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight, undefined, 'MEDIUM');
              heightLeft -= pageHeight;
            }

            const currentYear = new Date().getFullYear();
            pdf.save(`Estimate_${orderData.orderNumber || currentYear}.pdf`);
            cleanup();
          }).catch(() => {
            printOrderReceipt(orderData);
            cleanup();
          });
        }).catch(() => {
          printOrderReceipt(orderData);
          cleanup();
        });
    }).catch(() => {
      printOrderReceipt(orderData);
      cleanup();
    });
  } catch {
    printOrderReceipt(orderData);
    cleanup();
  }
}

export function printOrderReceipt(orderData: OrderData) {
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(generateReceiptHTML(orderData));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 800);
  }
}

function numberToWords(n: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (n === 0) return 'Zero';
  const convert = (num: number): string => {
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + convert(num % 100) : '');
    if (num < 100000) return convert(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + convert(num % 1000) : '');
    if (num < 10000000) return convert(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + convert(num % 100000) : '');
    return convert(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + convert(num % 10000000) : '');
  };
  const rupees = Math.floor(n);
  const paise = Math.round((n - rupees) * 100);
  let result = convert(rupees) + ' Rupees';
  if (paise > 0) result += ' and ' + convert(paise) + ' Paise';
  return result + ' Only';
}

function generateReceiptHTML(order: OrderData): string {
  const allItems = order.items;
  const discountPct = order.discountPercent || 0;

  let totalValue = 0;
  let totalDiscountAmount = 0;
  let totalNetRateAmount = 0;

  const formatAmt = (num: number) => Number(num).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const discountItems = allItems.filter(item => {
    const isNetRate = (item.displayNetRate === true || String(item.displayNetRate) === 'true') &&
      item.netRate !== undefined &&
      item.netRate > 0;
    return !isNetRate;
  });

  const netRateItems = allItems.filter(item => {
    const isNetRate = (item.displayNetRate === true || String(item.displayNetRate) === 'true') &&
      item.netRate !== undefined &&
      item.netRate > 0;
    return isNetRate;
  });

  let itemsHTML = '';
  let sNo = 1;

  if (discountItems.length > 0) {
    itemsHTML += `
      <tr style="background:#f9f9f9;">
        <td colspan="8" style="padding:4px; border:1px solid #000; text-align:center; font-weight:bold; background:#fef2f2; color:#900000;">Retail Products</td>
      </tr>
    `;
    itemsHTML += discountItems.map((item) => {
      const originalPrice = item.originalPrice || item.price;
      const qty = item.quantity;
      const mrpTotal = originalPrice * qty;
      const lessAmt = mrpTotal - (item.price * qty);
      const lineTotal = item.price * qty;

      totalValue += mrpTotal;
      totalDiscountAmount += lessAmt;
      const discPct = (item.hasDiscount && discountPct > 0) ? String(discountPct) : '0';
      return `
      <tr style="background:#ffffff;">
        <td style="padding:4px; border:1px solid #000; text-align:center;">${sNo++}</td>
        <td style="padding:4px; border:1px solid #000; text-align:center; font-weight: 500;">${item.productName.toUpperCase()}</td>
        <td style="padding:4px; border:1px solid #000; text-align:center; font-weight:bold;">${qty} Box</td>
        <td style="padding:4px; border:1px solid #000; text-align:center;">${formatAmt(originalPrice)}</td>
        <td style="padding:4px; border:1px solid #000; text-align:center;">${formatAmt(mrpTotal)}</td>
        <td style="padding:4px; border:1px solid #000; text-align:center;">${discPct}%</td>
        <td style="padding:4px; border:1px solid #000; text-align:center;">${formatAmt(lessAmt)}</td>
        <td style="padding:4px; border:1px solid #000; text-align:center; font-weight:bold;">${formatAmt(lineTotal)}</td>
      </tr>
    `;
    }).join('');
  }

  if (netRateItems.length > 0) {
    itemsHTML += `
      <tr style="background:#f9f9f9;">
        <td colspan="8" style="padding:4px 4px; border:1px solid #000; text-align:center; font-weight:bold; background:#fef2f2; color:#900000;">Net-Rate Products</td>
      </tr>
    `;
    itemsHTML += netRateItems.map((item) => {
      const qty = item.quantity;
      const netPrice = item.netRate || item.price;
      const originalPrice = netPrice;
      const mrpTotal = netPrice * qty;
      const lineTotal = netPrice * qty;

      totalNetRateAmount += lineTotal;
      totalValue += lineTotal;
      return `
      <tr style="background:#ffffff;">
        <td style="padding:4px; border:1px solid #000; text-align:center;">${sNo++}</td>
        <td style="padding:4px; border:1px solid #000; text-align:center; font-weight: 500;">${item.productName.toUpperCase()}</td>
        <td style="padding:4px; border:1px solid #000; text-align:center; font-weight:bold;">${qty} Box</td>
        <td style="padding:4px; border:1px solid #000; text-align:center;">${formatAmt(originalPrice)}</td>
        <td style="padding:4px; border:1px solid #000; text-align:center;">${formatAmt(mrpTotal)}</td>
        <td style="padding:4px; border:1px solid #000; text-align:center;">-</td>
        <td style="padding:4px; border:1px solid #000; text-align:center;">-</td>
        <td style="padding:4px; border:1px solid #000; text-align:center; font-weight:bold;">${formatAmt(lineTotal)}</td>
      </tr>
    `;
    }).join('');
  }

  const netAmount1 = totalValue - totalDiscountAmount - totalNetRateAmount;
  const netAmount2 = netAmount1 + totalNetRateAmount;
  const packingCharge = order.packingCharge ?? (netAmount2 <= 3999 ? 120 : Math.round(netAmount2 * 0.03));
  const packingPct = netAmount2 > 0 ? (netAmount2 <= 3999 ? "Flat" : Math.round((packingCharge / netAmount2) * 100).toString()) : "3";
  const grandTotal = netAmount2 + packingCharge;
  const inWords = numberToWords(grandTotal);

  const shopName = (order.companyName?.trim() || order.siteName?.trim()) ? (order.companyName || order.siteName) : 'NARENDIRAA ENTERPRISES';
  const shopPhone = (order.sitePhone && order.sitePhone.trim()) ? order.sitePhone : '+91 95859 75756';
  const shopAddress = (order.siteAddress && order.siteAddress.trim()) ? order.siteAddress : 'Sattur, Virudhunagar District, Tamil Nadu';
  const shopEmail = (order.siteEmail && order.siteEmail.trim()) ? order.siteEmail : 'contact@narendiraa-enterprises.com';
  const shopWebsite = (order.siteWebsite && order.siteWebsite.trim()) ? order.siteWebsite : 'www.narendiraa-enterprises.com';
  const shopGst = order.gstNumber || '';

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
@page {
  size: A4;
  margin: 0;
}
body {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background: #fff;
  color: #1e293b;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.page {
  width: 210mm;
  min-height: 297mm;
  padding: 10px;
  box-sizing: border-box;
  margin: 0 auto;
  position: relative;
}
.content-wrapper {
  border: 1px solid #000000;
  width: 100%;
  height: 100%;
  min-height: 277mm;
  display: flex;
  flex-direction: column;
}
.header {
  padding: 15px 15px 5px 15px;
}
table.main-table {
  width: calc(100% - 30px);
  margin: 0 auto;
  border-collapse: collapse;
  font-size: 11px;
  border: 1px solid #000000;
}
.main-table th {
  border: 1px solid #000000;
  padding: 8px 6px;
  font-weight: bold;
  background-color: #f1f5f9;
  color: #000000;
  text-transform: uppercase;
  text-align: center;
}
.main-table td {
  border: 1px solid #000000;
  padding: 6px 6px;
  color: #000000;
  text-align: center;
}
.info-section {
  display: flex;
  margin-top: 0;
}
.footer-section {
  display: flex;
  border-top: 1px solid #000000;
  margin-top: auto;
}
.totals-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 15px;
  font-size: 11px;
}
.brand-title {
  font-size: 22px;
  font-weight: 900;
  color: #900000;
  margin-bottom: 2px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
</head>
<body>
<div class="page">
  <div class="content-wrapper">
    <div class="header" style="margin-bottom: 15px;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td valign="bottom" align="left">
            <div style="font-size: 38px; font-weight: 900; color: #900000; letter-spacing: 2px; text-transform: uppercase; line-height: 1;">ESTIMATE</div>
            <div style="font-size: 11px; font-weight: bold; color: #64748b; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Proforma Estimate</div>
          </td>
          <td valign="top" align="right">
            <img src="${saiyogiLogo}" style="width: 160px; height: auto; max-height: 80px; object-fit: contain;" />
          </td>
        </tr>
      </table>
    </div>

    <div class="info-section" style="border: none; margin-bottom: 15px; display: flex; gap: 20px; padding: 0 15px;">
      <div style="flex: 1.2; text-align: left;">
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background-color: #f8fafc; font-size: 11px; line-height: 1.6;">
          <div style="font-weight: 900; border-bottom: 2px solid #900000; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; color: #900000; letter-spacing: 0.5px; font-size: 12px;">Billed To</div>
          <table width="100%" cellpadding="2" cellspacing="0" style="font-size: 11px; color: #334155;">
            <tr><td width="100"><strong>Customer Name</strong></td><td><strong>:</strong> <span style="font-size:12px;font-weight:bold;color:#0f172a;">${order.customerName}</span></td></tr>
            <tr><td><strong>Estimate No.</strong></td><td><strong>:</strong> ${order.orderNumber}</td></tr>
            <tr><td><strong>Date</strong></td><td><strong>:</strong> ${order.date}</td></tr>
            <tr><td><strong>Phone</strong></td><td><strong>:</strong> ${order.customerPhone}</td></tr>
            <tr><td><strong>Email</strong></td><td><strong>:</strong> ${order.customerEmail}</td></tr>
            <tr><td valign="top"><strong>Address</strong></td><td><strong>:</strong> ${order.deliveryAddress}</td></tr>
            <tr><td><strong>Location</strong></td><td><strong>:</strong> ${order.district ? order.district + ', ' : ''}${order.state || ''}</td></tr>
          </table>
        </div>
      </div>
      <div style="flex: 1; display: flex; justify-content: flex-end; align-items: flex-start;">
        <div style="text-align: left; font-size: 11px; line-height: 1.6; color: #334155; padding-left: 20px; border-left: 1px solid #e2e8f0;">
          <div class="brand-title">${shopName}</div>
          <div style="font-size: 10px; font-weight: bold; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Wholesale & Retail Firecrackers</div>
          <div style="font-weight: 500;">${shopAddress}</div>
          <div style="margin-top: 6px;"><strong>Phone:</strong> ${shopPhone}</div>
          <div><strong>Email:</strong> ${shopEmail}</div>
          <div><strong>Website:</strong> ${shopWebsite}</div>
          ${shopGst ? `<div style="margin-top: 4px; padding: 3px 6px; background: #fef2f2; border: 1px solid #fca5a5; display: inline-block; color: #900000; font-weight: bold; border-radius: 4px;">GSTIN: ${shopGst}</div>` : ''}
        </div>
      </div>
    </div>

    <div style="flex-grow: 1; display: flex; flex-direction: column; position: relative; z-index: 1;">
      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: url('${saiyogiLogo}'); background-position: center; background-repeat: no-repeat; background-size: 320px; opacity: 0.04; z-index: -1; pointer-events: none;"></div>
      
      <table class="main-table">
        <thead>
          <tr>
            <th style="width: 4%;">S No.</th>
            <th style="width: 38%;">Product Name</th>
            <th style="width: 8%;">Qty</th>
            <th style="width: 10%;">Price</th>
            <th style="width: 10%;">Total</th>
            <th style="width: 8%;">Disc%</th>
            <th style="width: 10%;">Less</th>
            <th style="width: 12%;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
    </div>

    <div class="footer-section">
      <div style="flex: 1; border-right: 1px solid #000; display: flex; flex-direction: column; background: #ffffff;">
        <div style="padding: 10px; border-bottom: 1px solid #e2e8f0; min-height: 50px;">
          <span style="font-size: 11px; font-weight:bold; color:#900000; text-transform:uppercase;">Delivery Address:</span>
          <div style="font-size: 11px; margin-top: 5px; padding-left: 10px; color: #334155;">${order.deliveryAddress}</div>
        </div>
        <div style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-style: italic; color:#475569;">
          <strong>Amount in Words:</strong> ${inWords}
        </div>
        <div style="padding: 15px 10px 5px 10px; display: flex; justify-content: space-between; font-size: 11px; align-items: flex-end; flex-grow: 1;">
          <div style="padding-bottom: 15px; color:#64748b;">Terms & Conditions apply.</div>
          <div style="text-align: center; margin-right: 20px;">
            <div style="font-weight: bold; font-size: 12px; color: #900000;">For ${shopName.toUpperCase()}</div>
            <div style="font-size: 10px; margin-top: 40px; color:#334155; border-top: 1px dashed #94a3b8; padding-top: 4px;">Authorized Signatory</div>
          </div>
        </div>
      </div>
      
      <div style="width: 320px; display: flex; flex-direction: column; padding-top: 10px; background: #ffffff;">
        <div class="totals-row">
          <span style="width: 50%; color:#475569;">Retail Amount</span>
          <span style="width: 5%; text-align: center;">:</span>
          <span style="width: 45%; text-align: right; font-weight:500;">${formatAmt(totalValue - totalNetRateAmount)}</span>
        </div>
        <div class="totals-row">
          <span style="width: 50%; color:#475569;">Discount <span style="display:inline-block; float:right; background:#f1f5f9; padding:0 4px; border-radius:3px;">${discountPct}%</span></span>
          <span style="width: 5%; text-align: center;">:</span>
          <span style="width: 45%; text-align: right; font-weight:500;">${formatAmt(totalDiscountAmount)}</span>
        </div>
        <div class="totals-row" style="font-weight: bold; background:#f8fafc; padding:6px 15px; margin-top:4px;">
          <span style="width: 50%; color:#0f172a;">Net Retail Amount</span>
          <span style="width: 5%; text-align: center;">:</span>
          <span style="width: 45%; text-align: right; color:#900000;">${formatAmt(netAmount1)}</span>
        </div>
        <div class="totals-row" style="margin-top:4px;">
          <span style="width: 50%; color:#475569;">Net-Rate Total</span>
          <span style="width: 5%; text-align: center;">:</span>
          <span style="width: 45%; text-align: right; font-weight:500;">${formatAmt(totalNetRateAmount)}</span>
        </div>
        <div class="totals-row" style="font-weight: bold;">
          <span style="width: 50%;">Subtotal</span>
          <span style="width: 5%; text-align: center;">:</span>
          <span style="width: 45%; text-align: right;">${formatAmt(netAmount2)}</span>
        </div>
        <div class="totals-row">
          <span style="width: 50%; color:#475569;">Packing <span style="display:inline-block; float:right; background:#f1f5f9; padding:0 4px; border-radius:3px;">${packingPct === "Flat" ? "Flat" : packingPct + "%"}</span></span>
          <span style="width: 5%; text-align: center;">:</span>
          <span style="width: 45%; text-align: right; font-weight:500;">${formatAmt(packingCharge)}</span>
        </div>
        
        <div class="totals-row" style="font-weight: 900; font-size: 16px; background: transparent; color: #000000; padding: 10px 15px; margin-top: auto; border-top: 1px solid #000000;">
          <span style="width: 50%; text-transform: uppercase; letter-spacing: 0.5px;">GRAND TOTAL</span>
          <span style="width: 5%; text-align: center;">:</span>
          <span style="width: 45%; text-align: right; font-size: 18px;">₹ ${formatAmt(grandTotal)}</span>
        </div>
      </div>
    </div>
  </div>
</div>
</body>
</html>
`;
}
