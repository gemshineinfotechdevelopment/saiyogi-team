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

export function downloadOrderReceiptPDF(orderData: OrderData, copies: number = 1) {
  const html = generateReceiptHTML(orderData, copies);

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  tempDiv.style.position = "absolute";
  tempDiv.style.left = "-9999px";
  tempDiv.style.width = "210mm";
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
            
            // The HTML already has 10mm padding in .page, so no extra jsPDF margin needed.
            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            const pageHeight = pdfHeight;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, 'MEDIUM');
            heightLeft -= pageHeight;

            while (heightLeft > 0.5) { // 0.5 buffer to prevent tiny floating pixel page
              position -= pageHeight;
              pdf.addPage();
              pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, 'MEDIUM');
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

export function printOrderReceipt(orderData: OrderData, copies: number = 1) {
  const html = generateReceiptHTML(orderData, copies);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();
    
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 800);
  }
}

export function promptAndPrintOrderReceipt(orderData: OrderData) {
  const copiesStr = window.prompt("How many copies would you like to print? (e.g., 2 for Original & Duplicate)", "1");
  if (copiesStr === null) return;
  const copies = parseInt(copiesStr, 10);
  if (isNaN(copies) || copies < 1) return;
  printOrderReceipt(orderData, copies);
}

export function promptAndDownloadOrderReceiptPDF(orderData: OrderData) {
  const copiesStr = window.prompt("How many copies would you like to include in the PDF? (e.g., 2 for Original & Duplicate)", "1");
  if (copiesStr === null) return;
  const copies = parseInt(copiesStr, 10);
  if (isNaN(copies) || copies < 1) return;
  downloadOrderReceiptPDF(orderData, copies);
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

function generateReceiptHTML(order: OrderData, copies: number = 1): string {
  const allItems = order.items;
  const discountPct = order.discountPercent || 0;

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

  const allRows: { type: 'header' | 'item', content: string }[] = [];
  let sNo = 1;

  if (discountItems.length > 0) {
    if (netRateItems.length > 0) {
      allRows.push({
        type: 'header',
        content: `
        <tr style="background:#f9f9f9;">
          <td colspan="8" style="padding:4px; border-left:1px solid #000; border-right:1px solid #000; text-align:center; font-weight:bold; background:#fef2f2; color:#900000;">Retail Products</td>
        </tr>
        `
      });
    }

    discountItems.forEach(item => {
      let originalPrice = item.originalPrice !== undefined ? item.originalPrice : (item.price || 0);
      let discountedPrice = item.price || 0;

      if (originalPrice === discountedPrice && discountPct > 0 && item.hasDiscount !== false) {
        discountedPrice = Math.round(originalPrice * (1 - discountPct / 100));
      }

      const qty = item.quantity;
      const mrpTotal = originalPrice * qty;
      
      const lineTotal = discountedPrice * qty;
      const lessAmt = mrpTotal - lineTotal;
      
      // Calculate effective discount percentage to show
      let effectiveDiscPct = '0';
      if (mrpTotal > 0 && lessAmt > 0) {
          effectiveDiscPct = String(Math.round((lessAmt / mrpTotal) * 100));
      } else if (discountPct > 0 && item.hasDiscount !== false) {
          effectiveDiscPct = String(discountPct);
      }

      allRows.push({
        type: 'item',
        content: `
        <tr style="background:transparent;">
          <td style="padding:7px 4px; border-left:1px solid #000; border-right:1px solid #000; border-bottom:1px solid #e2e8f0; text-align:center;">${sNo++}</td>
          <td style="padding:7px 4px; border-left:1px solid #000; border-right:1px solid #000; border-bottom:1px solid #e2e8f0; text-align:center; font-weight: 500;">${item.productName.toUpperCase()}</td>
          <td style="padding:7px 4px; border-left:1px solid #000; border-right:1px solid #000; border-bottom:1px solid #e2e8f0; text-align:center; font-weight:bold;">${qty} Box</td>
          <td style="padding:7px 4px; border-left:1px solid #000; border-right:1px solid #000; border-bottom:1px solid #e2e8f0; text-align:center;">${formatAmt(originalPrice)}</td>
          <td style="padding:7px 4px; border-left:1px solid #000; border-right:1px solid #000; border-bottom:1px solid #e2e8f0; text-align:center;">${formatAmt(mrpTotal)}</td>
          <td style="padding:7px 4px; border-left:1px solid #000; border-right:1px solid #000; border-bottom:1px solid #e2e8f0; text-align:center;">${effectiveDiscPct}%</td>
          <td style="padding:7px 4px; border-left:1px solid #000; border-right:1px solid #000; border-bottom:1px solid #e2e8f0; text-align:center;">${formatAmt(lessAmt)}</td>
          <td style="padding:7px 4px; border-left:1px solid #000; border-right:1px solid #000; border-bottom:1px solid #e2e8f0; text-align:center; font-weight:bold;">${formatAmt(lineTotal)}</td>
        </tr>
        `
      });
    });
  }

  if (netRateItems.length > 0) {
    allRows.push({
      type: 'header',
      content: `
      <tr style="background:#f9f9f9;">
        <td colspan="8" style="padding:4px 4px; border-left:1px solid #000; border-right:1px solid #000; text-align:center; font-weight:bold; background:#fef2f2; color:#900000;">Net-Rate Products</td>
      </tr>
      `
    });
    netRateItems.forEach(item => {
      const qty = item.quantity;
      const netPrice = item.netRate || item.price;
      const mrpTotal = netPrice * qty;
      const lineTotal = netPrice * qty;

      allRows.push({
        type: 'item',
        content: `
        <tr style="background:transparent;">
          <td style="padding:7px 4px; border-left:1px solid #000; border-right:1px solid #000; border-bottom:1px solid #e2e8f0; text-align:center;">${sNo++}</td>
          <td style="padding:7px 4px; border-left:1px solid #000; border-right:1px solid #000; border-bottom:1px solid #e2e8f0; text-align:center; font-weight: 500;">${item.productName.toUpperCase()}</td>
          <td style="padding:7px 4px; border-left:1px solid #000; border-right:1px solid #000; border-bottom:1px solid #e2e8f0; text-align:center; font-weight:bold;">${qty} Box</td>
          <td style="padding:7px 4px; border-left:1px solid #000; border-right:1px solid #000; border-bottom:1px solid #e2e8f0; text-align:center;">${formatAmt(netPrice)}</td>
          <td style="padding:7px 4px; border-left:1px solid #000; border-right:1px solid #000; border-bottom:1px solid #e2e8f0; text-align:center;">${formatAmt(mrpTotal)}</td>
          <td style="padding:7px 4px; border-left:1px solid #000; border-right:1px solid #000; border-bottom:1px solid #e2e8f0; text-align:center; color:#94a3b8;">-</td>
          <td style="padding:7px 4px; border-left:1px solid #000; border-right:1px solid #000; border-bottom:1px solid #e2e8f0; text-align:center; color:#94a3b8;">-</td>
          <td style="padding:7px 4px; border-left:1px solid #000; border-right:1px solid #000; border-bottom:1px solid #e2e8f0; text-align:center; font-weight:bold;">${formatAmt(lineTotal)}</td>
        </tr>
        `
      });
    });
  }

  const MAX_ROWS_FIRST_AND_LAST = 14;  // Page 1 AND Last Page (Must be small to fit both header and footer)
  const MAX_ROWS_FIRST_PAGE = 22;     // Page 1, NOT Last Page
  const MAX_ROWS_OTHER_PAGE = 22;     // Middle pages (no header, no footer)
  const MAX_ROWS_LAST_PAGE = 22;      // Last Page, NOT Page 1 (no header, yes footer)

  const pages: { rows: any[], isLastPage: boolean, isFirstPage: boolean }[] = [];
  let currentRowIndex = 0;
  let isFirstPage = true;

  while (currentRowIndex < allRows.length) {
    const rowsRemaining = allRows.length - currentRowIndex;
    
    if (isFirstPage) {
      if (rowsRemaining <= MAX_ROWS_FIRST_AND_LAST) {
        pages.push({
          rows: allRows.slice(currentRowIndex),
          isLastPage: true,
          isFirstPage: true
        });
        break;
      } else {
        const rowsForThisPage = Math.min(rowsRemaining, MAX_ROWS_FIRST_PAGE);
        pages.push({
          rows: allRows.slice(currentRowIndex, currentRowIndex + rowsForThisPage),
          isLastPage: false,
          isFirstPage: true
        });
        currentRowIndex += rowsForThisPage;
      }
    } else {
      if (rowsRemaining <= MAX_ROWS_LAST_PAGE) {
        pages.push({
          rows: allRows.slice(currentRowIndex),
          isLastPage: true,
          isFirstPage: false
        });
        break;
      } else {
        const rowsForThisPage = Math.min(rowsRemaining, MAX_ROWS_OTHER_PAGE);
        pages.push({
          rows: allRows.slice(currentRowIndex, currentRowIndex + rowsForThisPage),
          isLastPage: false,
          isFirstPage: false
        });
        currentRowIndex += rowsForThisPage;
      }
    }
    isFirstPage = false;
  }
  
  if (pages.length === 0) {
    pages.push({ rows: [], isLastPage: true, isFirstPage: true });
  } else if (!pages[pages.length - 1].isLastPage) {
    pages.push({ rows: [], isLastPage: true, isFirstPage: false });
  }

  let grossRetailValue = 0;
  let totalDiscountAmount = 0;
  let totalNetRateAmount = 0;

  allItems.forEach(item => {
    const isNetRate = (item.displayNetRate === true || String(item.displayNetRate) === 'true') && item.netRate !== undefined && item.netRate > 0;
    const qty = item.quantity;
    
    if (!isNetRate) {
      let origPrice = item.originalPrice !== undefined ? item.originalPrice : (item.price || 0);
      let discountedPrice = item.price || 0;

      if (origPrice === discountedPrice && discountPct > 0 && item.hasDiscount !== false) {
        discountedPrice = Math.round(origPrice * (1 - discountPct / 100));
      }

      const itemMrpTotal = origPrice * qty;
      const lineTotal = discountedPrice * qty;
      
      grossRetailValue += itemMrpTotal;
      totalDiscountAmount += (itemMrpTotal - lineTotal);
    } else {
      totalNetRateAmount += (item.netRate! * qty);
    }
  });

  const netAmount1 = grossRetailValue - totalDiscountAmount;
  const netAmount2 = netAmount1 + totalNetRateAmount;
  const packingCharge = order.packingCharge ?? (netAmount2 <= 3999 ? 120 : Math.round(netAmount2 * 0.03));
  const packingPct = netAmount2 > 0 ? (netAmount2 <= 3999 ? "Flat" : Math.round((packingCharge / netAmount2) * 100).toString()) : "3";
  const exactTotal = netAmount2 + packingCharge;
  const grandTotal = Math.round(exactTotal);
  const roundOffAmount = grandTotal - exactTotal;
  const inWords = numberToWords(grandTotal);
  
  if (pages.length === 0) {
    pages.push({ rows: [], isLastPage: true, isFirstPage: true });
  }

  const shopName = (order.companyName?.trim() || order.siteName?.trim()) ? (order.companyName || order.siteName) : 'NARENDIRAA ENTERPRISES';
  const shopPhone = (order.sitePhone && order.sitePhone.trim()) ? order.sitePhone : '+91 95859 75756';
  const shopAddress = (order.siteAddress && order.siteAddress.trim()) ? order.siteAddress : 'Sattur, Virudhunagar District, Tamil Nadu';
  const shopEmail = (order.siteEmail && order.siteEmail.trim()) ? order.siteEmail : 'contact@narendiraa-enterprises.com';
  const shopWebsite = (order.siteWebsite && order.siteWebsite.trim()) ? order.siteWebsite : 'www.narendiraa-enterprises.com';
  const shopGst = order.gstNumber || '';

  const finalHTML = pages.map((page, index) => {
      const pageNum = index + 1;
      const totalPages = pages.length;

      const footerHTML = page.isLastPage ? `
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
          
          <div style="width: 320px; display: flex; flex-direction: column; background: #ffffff;">
            <div class="totals-row" style="padding-top: 10px;">
              <span style="width: 50%; color:#475569;">Retail Amount</span>
              <span style="width: 5%; text-align: center;">:</span>
              <span style="width: 45%; text-align: right; font-weight:500;">${formatAmt(grossRetailValue)}</span>
            </div>
            <div class="totals-row">
              <span style="width: 50%; color:#475569;">Discount <span style="display:inline-block; float:right; background:#f1f5f9; padding:0 4px; border-radius:3px;">${discountPct || (grossRetailValue > 0 && totalDiscountAmount > 0 ? Math.round((totalDiscountAmount / grossRetailValue) * 100) : 0)}%</span></span>
              <span style="width: 5%; text-align: center;">:</span>
              <span style="width: 45%; text-align: right; font-weight:500;">${formatAmt(totalDiscountAmount)}</span>
            </div>
            <div class="totals-row" style="font-weight: bold; background:#f8fafc; padding:6px 15px; margin-top:4px;">
              <span style="width: 50%; color:#0f172a;">Net Retail Amount</span>
              <span style="width: 5%; text-align: center;">:</span>
              <span style="width: 45%; text-align: right; color:#900000;">${formatAmt(netAmount1)}</span>
            </div>
            ${totalNetRateAmount > 0 ? `
            <div class="totals-row" style="margin-top:4px;">
              <span style="width: 50%; color:#475569;">Net-Rate Total</span>
              <span style="width: 5%; text-align: center;">:</span>
              <span style="width: 45%; text-align: right; font-weight:500;">${formatAmt(totalNetRateAmount)}</span>
            </div>
            ` : ''}
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
            ${roundOffAmount !== 0 ? `
            <div class="totals-row">
              <span style="width: 50%; color:#475569;">Round Off</span>
              <span style="width: 5%; text-align: center;">:</span>
              <span style="width: 45%; text-align: right; font-weight:500;">${roundOffAmount > 0 ? '+' : ''}${formatAmt(roundOffAmount)}</span>
            </div>` : ''}
            
            <div class="totals-row" style="font-weight: 900; font-size: 16px; background: transparent; color: #000000; padding: 10px 15px; margin-top: auto; border-top: 1px solid #000000;">
              <span style="width: 50%; text-transform: uppercase; letter-spacing: 0.5px;">GRAND TOTAL</span>
              <span style="width: 5%; text-align: center;">:</span>
              <span style="width: 45%; text-align: right; font-size: 18px;">₹ ${formatAmt(grandTotal)}</span>
            </div>
          </div>
        </div>
      ` : '';

      const headerHTML = page.isFirstPage ? `
            <div class="header">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="bottom" align="left">
                    <div style="font-size: 38px; font-weight: 900; color: #900000; letter-spacing: 2px; text-transform: uppercase; line-height: 1;">ESTIMATE</div>
                    <div style="font-size: 11px; font-weight: bold; color: #64748b; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Proforma Estimate</div>
                  </td>
                  <td valign="top" align="right">
                    <img src="${saiyogiLogo}" style="height: 160px; width: auto; max-width: 350px; object-fit: contain;" />
                  </td>
                </tr>
              </table>
            </div>

            <div class="info-section">
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
      ` : ``;

      return `
        <div class="page" style="position: relative;">
          <div class="watermark">
            <img src="${saiyogiLogo}" />
          </div>
          <div class="page-content">
            ${headerHTML}

            <div style="position: relative;">
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
                  ${page.rows.map(r => r.content).join('')}
                </tbody>
              </table>
            </div>
            
            ${footerHTML}
          </div>
        </div>
      `;
    }).join('');

  let finalMultiCopyHTML = '';
  
  for(let c=0; c<copies; c++) {
    finalMultiCopyHTML += finalHTML;
  }

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
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.page {
  position: relative;
  width: 210mm;
  height: 297mm;
  max-height: 297mm;
  padding: 10mm;
  margin: 0 auto;
  background: white;
  box-sizing: border-box;
  overflow: hidden;
  page-break-after: always;
  display: flex;
  flex-direction: column;
  position: relative;
}
.page-content {
  border: 1px solid #000000;
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
  overflow: hidden;
}
.watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, calc(-50% + 60px));
  opacity: 0.15;
  z-index: 0;
  pointer-events: none;
}
.watermark img {
  width: 450px;
  height: auto;
  object-fit: contain;
}
.header {
  padding: 15px 15px 5px 15px;
}
.info-section {
  display: flex;
  gap: 20px;
  padding: 0 15px;
  margin-bottom: 5px;
}
table.main-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.main-table th {
  border-bottom: 1px solid #000000;
  border-top: 1px solid #000000;
  padding: 8px 6px;
  font-weight: bold;
  background-color: #f1f5f9;
  color: #000000;
  text-transform: uppercase;
  text-align: center;
}
.main-table td {
  padding: 6px 6px;
  color: #000000;
  text-align: center;
}
.footer-section {
  margin-top: auto;
  display: flex;
  border-top: 1px solid #000000;
  background: #ffffff;
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
  ${finalMultiCopyHTML}
</body>
</html>
`;
}
