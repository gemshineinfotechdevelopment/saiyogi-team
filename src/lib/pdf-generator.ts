/**
 * Generate and download order receipt as PDF
 * Uses HTML canvas to create a PDF-like document
 */

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

            // Use JPEG instead of PNG and specify quality (0.75 - 0.9 is good balance)
            const imgData = canvas.toDataURL("image/jpeg", 0.8);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgWidth = pdfWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, "JPEG", 10, 10, imgWidth, imgHeight, undefined, 'MEDIUM');

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
  const packingCharge = order.packingCharge ?? Math.round(netAmount2 * 0.03);
  const packingPct = netAmount2 > 0 ? Math.round((packingCharge / netAmount2) * 100) : 3;
  const grandTotal = netAmount2 + packingCharge;
  const inWords = numberToWords(grandTotal);

  const shopName = order.siteName || 'NARENDIRAA ENTERPRISES';
  const shopPhone = order.sitePhone || '+91 95859 75756';
  const shopAddress = order.siteAddress || 'Sattur, Virudhunagar District, Tamil Nadu';
  const shopEmail = order.siteEmail || 'contact@narendiraa-enterprises.com';
  const shopWebsite = order.siteWebsite || 'www.narendiraa-enterprises.com';

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
  border: 1px solid #000;
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
}
.main-table th {
  border: 1px solid #000;
  padding: 4px;
  font-weight: bold;
  background-color: #ECA1A1;
  color: #000;
}
.main-table td {
  border-left: 1px solid #000;
  border-right: 1px solid #000;
  padding: 4px;
  color: #000;
}
.info-section {
  display: flex;
  border-top: 1px solid #000;
  border-bottom: 1px solid #000;
  margin-top: 0;
}
.footer-section {
  display: flex;
  border-top: 1px solid #000;
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
    <div class="header">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 10px;">
        <tr>
          <td width="120" valign="top">
            <img src="${window.location.origin}/1.png" style="width: 100px; height: 100px; object-fit: contain;" />
          </td>
          <td align="center" valign="top">
            <div style="font-size: 10px; margin-bottom: 4px;">ஸ்ரீ கருப்பசாமி துணை</div>
            <div style="color: #1E3A8A; font-size: 26px; font-weight: bold; margin-bottom: 2px;">${shopName.toUpperCase()}</div>
            <div style="font-size: 13px; font-style: italic; margin-bottom: 2px; font-weight: bold;">(Wholesale & Retail Shop)</div>
            <div style="font-size: 12px; margin-bottom: 2px;">${shopAddress}</div>
            <div style="font-size: 12px;">E-Mail : ${shopEmail} &nbsp;&nbsp;&nbsp; Website : ${shopWebsite}</div>
          </td>
          <td width="120" valign="top" align="right" style="font-size: 10px;">
            <div style="margin-bottom: 5px; color:#000;">Customer Copy</div>
            <div style="color: #16a34a; font-weight: bold; font-size: 12px; display: flex; align-items: center; justify-content: flex-end; gap: 4px;">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg> ${shopPhone}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <div class="info-section">
      <div style="flex: 1; padding: 5px 15px 10px 15px; display: flex; flex-direction: column; justify-content: space-between;">
        <div style="border-bottom: 1.5px dotted #000; margin-top: 10px; position: relative;">
          <span style="position: absolute; bottom: 1px; font-weight: bold; font-size: 13px; left: 10px;">${order.customerName || ''}</span>
        </div>
        <div style="border-bottom: 1.5px dotted #000; margin-top: 20px; position: relative;">
          <span style="position: absolute; bottom: 1px; font-weight: bold; font-size: 13px; left: 10px;">${order.customerPhone ? 'Phone: ' + order.customerPhone : ''}</span>
        </div>
        <div style="border-bottom: 1.5px dotted #000; margin-top: 20px; position: relative;">
          <span style="position: absolute; bottom: 1px; font-weight: bold; font-size: 13px; left: 10px;">${order.district ? 'District: ' + order.district : ''}</span>
        </div>
        <div style="border-bottom: 1.5px dotted #000; margin-top: 20px; position: relative; margin-bottom: 5px;">
          <span style="position: absolute; bottom: 1px; font-weight: bold; font-size: 13px; left: 10px;">${order.state ? 'State: ' + order.state : ''}</span>
        </div>
      </div>
      <div style="width: 220px; border-left: 1px solid #000; display: flex; flex-direction: column;">
        <div style="background-color: #F8CBAD; font-weight: bold; font-size: 13px; text-align: center; padding: 7px; border-bottom: 1px solid #000; color: #000;">
          RETAIL ESTIMATE
        </div>
        <div style="padding: 7px; font-size: 12px; border-bottom: 1px solid #000;">
          R.Est No. : ${order.orderNumber}
        </div>
        <div style="padding: 7px; font-size: 12px; flex-grow: 1;">
          Date &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${order.date}
        </div>
      </div>
    </div>

    <div style="flex-grow: 1; display: flex; flex-direction: column; position: relative; z-index: 1;">
      <!-- Watermark Background -->
      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: url('${window.location.origin}/1.png'); background-position: center; background-repeat: no-repeat; background-size: 350px; opacity: 0.1; z-index: -1; pointer-events: none;"></div>
      
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
          <span style="width: 45%;">Packing <span style="display:inline-block; width: 30px; text-align: right;">${packingPct} %</span></span>
          <span style="width: 10%; text-align: center;">:</span>
          <span style="width: 45%; text-align: right;">${formatAmt(packingCharge)}</span>
        </div>
        
        <div style="margin-top: auto; padding-top: 4px; padding-bottom: 6px;">
          <div class="totals-row" style="font-weight: bold; font-size: 13px;">
            <span style="width: 45%;">Grand Total</span>
            <span style="width: 10%; text-align: center;">:</span>
            <span style="width: 45%; text-align: right;">${formatAmt(grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</body>
</html>
`;
}

