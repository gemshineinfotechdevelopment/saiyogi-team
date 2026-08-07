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
  siteAddress?: string;
  sitePhone?: string;
  siteEmail?: string;
  siteWebsite?: string;
}

export function generateOrderReceiptPDF(orderData: OrderData) {
  const html = generateReceiptHTML(orderData);

  // Create a temporary element
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

  // Use html2canvas if available, otherwise use a fallback approach
  try {
    // Try to import html2canvas dynamically
    import("html2canvas").then((html2canvas) => {
      html2canvas
        .default(tempDiv, {
          allowTaint: true,
          useCORS: true,
          scale: 1.5, // Reduced scale for smaller file size
          backgroundColor: "#ffffff",
        })
        .then((canvas) => {
          // Try to use jsPDF if available
          import("jspdf").then((jsPDF) => {
            const pdf = new jsPDF.jsPDF({
              orientation: "portrait",
              unit: "mm",
              format: "a4",
              compress: true, // Enable jsPDF compression
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

            // Add the first page
            pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight, undefined, 'MEDIUM');
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
              position = margin - (imgHeight - heightLeft);
              pdf.addPage();
              pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight, undefined, 'MEDIUM');
              heightLeft -= pageHeight;
            }

            const currentYear = new Date().getFullYear();
            pdf.save(`order${currentYear}.pdf`);
            cleanup();
          }).catch(() => {
            // Fallback: print the page
            fallbackPrint(orderData);
            cleanup();
          });
        }).catch(() => {
          fallbackPrint(orderData);
          cleanup();
        });
    }).catch(() => {
      // Fallback: print the page
      fallbackPrint(orderData);
      cleanup();
    });
  } catch {
    // Fallback: print the page
    fallbackPrint(orderData);
    cleanup();
  }
}

function fallbackPrint(orderData: OrderData) {
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(generateReceiptHTML(orderData));
    printWindow.document.close();
    printWindow.focus();
    // Wait a bit longer to ensure the logo image has loaded before printing
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
        <td colspan="8" style="padding:4px; border-bottom:1px solid #000; text-align:center; font-weight:bold; background:#ffca3a;">Retail Products</td>
      </tr>
    `;
    itemsHTML += discountItems.map((item, idx) => {
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
        <td style="padding:4px; border-bottom:1px solid #000; text-align:center;">${sNo++}</td>
        <td style="padding:4px; border-bottom:1px solid #000; text-align:left;">${item.productName.toUpperCase()}</td>
        <td style="padding:4px; border-bottom:1px solid #000; text-align:center; font-weight:bold;">${qty} Box</td>
        <td style="padding:4px; border-bottom:1px solid #000; text-align:right;">${formatAmt(originalPrice)}</td>
        <td style="padding:4px; border-bottom:1px solid #000; text-align:right;">${formatAmt(mrpTotal)}</td>
        <td style="padding:4px; border-bottom:1px solid #000; text-align:center;">${discPct}</td>
        <td style="padding:4px; border-bottom:1px solid #000; text-align:right;">${formatAmt(lessAmt)}</td>
        <td style="padding:4px; border-bottom:1px solid #000; text-align:right;">${formatAmt(lineTotal)}</td>
      </tr>
    `;
    }).join('');
  }

  if (netRateItems.length > 0) {
    itemsHTML += `
      <tr style="background:#f9f9f9;">
        <td colspan="8" style="padding:4px 4px; border-bottom:1px solid #000; text-align:center; font-weight:bold; background:#ffca3a;">Net-Rate Products</td>
      </tr>
    `;
    itemsHTML += netRateItems.map((item, idx) => {
      const qty = item.quantity;
      const netPrice = item.netRate || item.price;
      const originalPrice = netPrice;
      const mrpTotal = netPrice * qty;
      const lineTotal = netPrice * qty;

      totalNetRateAmount += lineTotal;
      totalValue += lineTotal;
      return `
      <tr style="background:#ffffff;">
        <td style="padding:4px; border-bottom:1px solid #000; text-align:center;">${sNo++}</td>
        <td style="padding:4px; border-bottom:1px solid #000; text-align:left;">${item.productName.toUpperCase()}</td>
        <td style="padding:4px; border-bottom:1px solid #000; text-align:center; font-weight:bold;">${qty} Box</td>
        <td style="padding:4px; border-bottom:1px solid #000; text-align:right;">${formatAmt(originalPrice)}</td>
        <td style="padding:4px; border-bottom:1px solid #000; text-align:right;">${formatAmt(mrpTotal)}</td>
        <td style="padding:4px; border-bottom:1px solid #000; text-align:center;">0</td>
        <td style="padding:4px; border-bottom:1px solid #000; text-align:right;">${formatAmt(0)}</td>
        <td style="padding:4px; border-bottom:1px solid #000; text-align:right;">${formatAmt(lineTotal)}</td>
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

  const shopName = (order.siteName && order.siteName.trim()) ? order.siteName : 'SAI YOGI CRACKERS';
  const shopPhone = (order.sitePhone && order.sitePhone.trim()) ? order.sitePhone : '+91 95859 75756';
  const shopAddress = (order.siteAddress && order.siteAddress.trim()) ? order.siteAddress : 'Sattur, Virudhunagar District, Tamil Nadu';
  const shopEmail = (order.siteEmail && order.siteEmail.trim()) ? order.siteEmail : 'contact@saiyogicrackers.com';
  const shopWebsite = (order.siteWebsite && order.siteWebsite.trim()) ? order.siteWebsite : 'www.saiyogicrackers.com';

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
  font-family: Arial, sans-serif;
  background: #fff;
  color: #000;
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
  border: 1px solid #cbd5e1;
  width: 100%;
  height: 100%;
  min-height: 277mm;
  display: flex;
  flex-direction: column;
}
.header {
  padding: 10px 10px 0 10px;
}
table.main-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  border-top: 1px solid #cbd5e1;
  border-bottom: 1px solid #cbd5e1;
}
.main-table th {
  border: 1px solid #cbd5e1;
  padding: 6px 4px;
  font-weight: bold;
  background-color: #f1f5f9;
  color: #0f172a;
}
.main-table td {
  border: 1px solid #cbd5e1;
  padding: 5px 4px;
  color: #0f172a;
}
.info-section {
  display: flex;
  margin-top: 0;
}
.footer-section {
  display: flex;
  border-top: 1px solid #cbd5e1;
  margin-top: auto;
}
.totals-row {
  display: flex;
  justify-content: space-between;
  padding: 3px 15px;
  font-size: 11px;
}
</style>
</head>
<body>
<div class="page">
  <div class="content-wrapper">
    <div class="header" style="margin-bottom: 20px;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td valign="bottom" align="left">
            <div style="font-size: 32px; font-weight: 900; color: #0f172a; letter-spacing: 3px; text-transform: uppercase; font-family: sans-serif; line-height: 1;">ESTIMATE</div>
            <div style="font-size: 11px; font-weight: bold; color: #64748b; margin-top: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Retail Estimate Invoice</div>
          </td>
          <td valign="top" align="right">
            <img src="${saiyogiLogo}" style="width: 140px; height: auto; max-height: 75px; object-fit: contain;" />
          </td>
        </tr>
      </table>
    </div>

    <div class="info-section" style="border: none; margin-bottom: 20px; display: flex; gap: 20px; padding: 0 10px;">
      <div style="flex: 1.2; text-align: left;">
        <div style="border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px; background-color: #f8fafc; font-size: 11px; line-height: 1.6; box-shadow: 0 2px 8px rgba(0,0,0,0.01);">
          <div style="font-weight: 900; border-bottom: 2px solid #64748b; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; color: #1e293b; letter-spacing: 0.5px; font-size: 12px;">Customer Details</div>
          <table width="100%" cellpadding="2" cellspacing="0" style="font-size: 11px; color: #334155;">
            <tr><td width="115"><strong>Enquiry Number</strong></td><td><strong>:</strong> ${order.orderNumber}</td></tr>
            <tr><td><strong>Date</strong></td><td><strong>:</strong> ${order.date}</td></tr>
            <tr><td><strong>Customer</strong></td><td><strong>:</strong> ${order.customerName}</td></tr>
            <tr><td><strong>Mobile Number</strong></td><td><strong>:</strong> ${order.customerPhone}</td></tr>
            <tr><td><strong>Email</strong></td><td><strong>:</strong> ${order.customerEmail}</td></tr>
            <tr><td valign="top"><strong>Address</strong></td><td><strong>:</strong> ${order.deliveryAddress}</td></tr>
            <tr><td><strong>Pickup Location</strong></td><td><strong>:</strong> ${order.district ? order.district + ', ' : ''}${order.state || ''}</td></tr>
          </table>
        </div>
      </div>
      <div style="flex: 1; display: flex; justify-content: flex-end; align-items: flex-start;">
        <div style="text-align: left; font-size: 11px; line-height: 1.6; color: #334155; padding-left: 20px;">
          <div style="font-size: 18px; font-weight: 900; color: #0f172a; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px;">${shopName}</div>
          <div style="font-size: 10px; font-weight: bold; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Wholesale & Retail Firecrackers</div>
          <div style="font-weight: 500;">${shopAddress}</div>
          <div style="margin-top: 6px;"><strong>Phone:</strong> ${shopPhone}</div>
          <div><strong>Email:</strong> ${shopEmail}</div>
          <div><strong>Website:</strong> ${shopWebsite}</div>
        </div>
      </div>
    </div>

    <div style="flex-grow: 1; display: flex; flex-direction: column; position: relative; z-index: 1;">
      <!-- Watermark Background -->
      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: url('${saiyogiLogo}'); background-position: center; background-repeat: no-repeat; background-size: 320px; opacity: 0.06; z-index: -1; pointer-events: none;"></div>
      
      <table class="main-table">
        <thead>
          <tr>
            <th style="width: 4%;">S No.</th>
            <th style="text-align: left;">Product Name</th>
            <th style="width: 7%;">Qty</th>
            <th style="width: 10%;">Price</th>
            <th style="width: 12%;">Total</th>
            <th style="width: 6%;">Disc%</th>
            <th style="width: 12%;">Less</th>
            <th style="width: 12%;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
    </div>

    <div class="footer-section">
      <div style="flex: 1; border-right: 1px solid #000; display: flex; flex-direction: column;">
        <div style="padding: 5px; border-bottom: 1px solid #000; min-height: 50px;">
          <span style="font-size: 11px;">Delivery Address :</span>
          <div style="font-size: 11px; margin-top: 5px; padding-left: 10px;">${order.deliveryAddress}</div>
        </div>
        <div style="padding: 5px; border-bottom: 1px solid #000; font-size: 11px;">
          In Words : ${inWords}
        </div>
        <div style="padding: 5px; display: flex; justify-content: space-between; font-size: 11px; align-items: flex-end; padding-bottom: 5px; flex-grow: 1;">
          <div style="margin-left: 5px; padding-bottom: 15px;">Entered by</div>
          <div style="text-align: center; margin-right: 40px;">
            <div style="font-weight: bold; font-style: italic;">For ${shopName.toUpperCase()}</div>
            <div style="font-size: 9px; margin-top: 25px;">Authorized Signatory</div>
          </div>
        </div>
      </div>
      
      <div style="width: 290px; display: flex; flex-direction: column; padding-top: 2px;">
        <div class="totals-row">
          <span style="width: 45%;">Retail Amount</span>
          <span style="width: 10%; text-align: center;">:</span>
          <span style="width: 45%; text-align: right;">${formatAmt(totalValue - totalNetRateAmount)}</span>
        </div>
        <div class="totals-row">
          <span style="width: 45%;">Discount <span style="display:inline-block; width: 30px; text-align: right;">${discountPct} %</span></span>
          <span style="width: 10%; text-align: center;">:</span>
          <span style="width: 45%; text-align: right;">${formatAmt(totalDiscountAmount)}</span>
        </div>
        <div class="totals-row" style="font-weight: bold;">
          <span style="width: 45%;">Net Retail Amount</span>
          <span style="width: 10%; text-align: center;">:</span>
          <span style="width: 45%; text-align: right;">${formatAmt(netAmount1)}</span>
        </div>
        <div class="totals-row" style="font-weight: bold;">
          <span style="width: 45%;">Net-Rate Total</span>
          <span style="width: 10%; text-align: center;">:</span>
          <span style="width: 45%; text-align: right;">${formatAmt(totalNetRateAmount)}</span>
        </div>
        <div class="totals-row" style="font-weight: bold;">
          <span style="width: 45%;">Net Amount 2</span>
          <span style="width: 10%; text-align: center;">:</span>
          <span style="width: 45%; text-align: right;">${formatAmt(netAmount2)}</span>
        </div>
        <div class="totals-row">
          <span style="width: 45%;">Packing <span style="display:inline-block; width: 40px; text-align: right;">${packingPct === "Flat" ? "" : packingPct + " %"}</span></span>
          <span style="width: 10%; text-align: center;">:</span>
          <span style="width: 45%; text-align: right;">${formatAmt(packingCharge)}</span>
        </div>
        
        <div class="totals-row" style="font-weight: bold; font-size: 13px; border-top: 1px solid #cbd5e1; border-bottom: 3px double #000000; padding: 6px 15px; margin-top: 8px; margin-bottom: 4px;">
          <span style="width: 45%; text-transform: uppercase; letter-spacing: 0.5px;">Grand Total</span>
          <span style="width: 10%; text-align: center;">:</span>
          <span style="width: 45%; text-align: right; font-size: 15px; color: #0f172a;">₹ ${formatAmt(grandTotal)}</span>
        </div>
      </div>
    </div>
  </div>
</div>
</body>
</html>
`;
}

