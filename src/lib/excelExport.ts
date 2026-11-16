import * as XLSX from 'xlsx';
import { ChitSubscriptionItem } from './api';

export interface ExcelExportOptions {
  dateSortOrder?: 'desc' | 'asc'; // 'desc' = Newest First, 'asc' = Oldest First
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  filenamePrefix?: string;
}

export const formatExcelDate = (dateVal?: string | Date | number): string => {
  if (!dateVal) return 'N/A';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Export Chit Scheme Applications to Excel (.xlsx)
 * Supports date sorting (newest first / oldest first) and optional date range filter.
 */
export const exportChitSubscriptionsToExcel = (
  subscriptions: ChitSubscriptionItem[],
  schemes: Array<{ id?: string; _id?: string; title?: string; schemeName?: string; monthlyAmount?: number; totalMonths?: number; numberOfMonths?: number }>,
  options: ExcelExportOptions = {}
): number => {
  const { dateSortOrder = 'desc', startDate, endDate, filenamePrefix = 'SaiYogi_Chit_Applications' } = options;

  // Filter by date range if provided
  const filtered = [...subscriptions].filter(sub => {
    if (!startDate && !endDate) return true;
    const subDate = new Date(sub.createdAt || sub.date || sub.updatedAt || 0);
    if (isNaN(subDate.getTime())) return true;
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (subDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (subDate > end) return false;
    }
    return true;
  });

  // Sort by date according to dateSortOrder
  filtered.sort((a, b) => {
    const timeA = new Date(a.createdAt || a.date || a.updatedAt || 0).getTime();
    const timeB = new Date(b.createdAt || b.date || b.updatedAt || 0).getTime();
    return dateSortOrder === 'asc' ? timeA - timeB : timeB - timeA;
  });

  // Map to clean structured columns (1 row per scheme for multi-scheme applications)
  const rows: any[] = [];
  let serialNumber = 1;

  filtered.forEach((sub) => {
    const appNumber = sub.applicationNumber || `APP-${String(sub._id || sub.id || '').slice(-6)}`;
    const appDate = formatExcelDate(sub.createdAt || sub.date || sub.updatedAt);
    const appStatus = sub.approvalStatus || (sub.status === 'Paid' || sub.status === 'Approved' ? 'Approved' : (sub.status === 'Rejected' ? 'Rejected' : 'Pending'));

    // Check if multi-scheme array exists
    const enrolledSchemes = Array.isArray(sub.schemes) && sub.schemes.length > 0 ? sub.schemes : null;

    if (enrolledSchemes) {
      enrolledSchemes.forEach((sch) => {
        const persons = sch.personCount || 1;
        const monthlyPerPerson = sch.monthlyAmountPerPerson || sch.monthlyAmount || 0;
        const monthlyTotal = sch.totalMonthlyAmount || (monthlyPerPerson * persons);
        const duration = sch.durationMonths || sch.totalMonths || 10;
        const totalScheme = sch.totalSchemeAmount || (monthlyTotal * duration);
        const paidMonths = sch.monthsPaid || 0;
        const pendingMonths = Math.max(0, duration - paidMonths);
        const totalPaid = sch.paidAmount || (monthlyTotal * paidMonths);
        const remaining = Math.max(0, totalScheme - totalPaid);
        const schemeStatus = sch.approvalStatus || sch.status || appStatus;

        rows.push({
          'S.No': serialNumber++,
          'Application ID': appNumber,
          'Application Date': appDate,
          'Customer Name': sub.name || sub.customerName || 'Customer',
          'Mobile Number': sub.phone || sub.mobileNumber || '',
          'Email ID': sub.email || 'N/A',
          'Location': sub.location || '',
          'Scheme Name': sch.schemeName || 'Chit Scheme',
          'Monthly Amount Per Person (₹)': monthlyPerPerson,
          'Person Count': persons,
          'Monthly Installment Total (₹)': monthlyTotal,
          'Total Duration (Months)': duration,
          'Total Scheme Amount (₹)': totalScheme,
          'Paid Months': paidMonths,
          'Pending Months': pendingMonths,
          'Total Paid Amount (₹)': totalPaid,
          'Remaining Amount (₹)': remaining,
          'Application Status': appStatus,
          'Scheme Status': schemeStatus,
          'Progress Stage': sch.stage || sub.stage || 'In Progress'
        });
      });
    } else {
      // Legacy single scheme fallback
      const matchedScheme = schemes.find(
        s => (s.title || s.schemeName) === sub.schemeName || (s.id || s._id) === sub.schemeId
      );
      const monthlyAmount = matchedScheme?.monthlyAmount || sub.monthlyAmount || 0;
      const persons = sub.personCount || 1;
      const totalMonths = matchedScheme?.totalMonths || matchedScheme?.numberOfMonths || 10;
      const monthlyTotal = monthlyAmount * persons;
      const totalSchemeAmount = monthlyTotal * totalMonths;
      const monthsPaid = sub.monthsPaid || 0;
      const pendingMonths = Math.max(0, totalMonths - monthsPaid);
      const totalPaidAmount = monthlyTotal * monthsPaid;
      const balanceDue = Math.max(0, totalSchemeAmount - totalPaidAmount);

      rows.push({
        'S.No': serialNumber++,
        'Application ID': appNumber,
        'Application Date': appDate,
        'Customer Name': sub.name || sub.customerName || 'Customer',
        'Mobile Number': sub.phone || sub.mobileNumber || '',
        'Email ID': sub.email || 'N/A',
        'Location': sub.location || '',
        'Scheme Name': sub.schemeName || 'N/A',
        'Monthly Amount Per Person (₹)': monthlyAmount,
        'Person Count': persons,
        'Monthly Installment Total (₹)': monthlyTotal,
        'Total Duration (Months)': totalMonths,
        'Total Scheme Amount (₹)': totalSchemeAmount,
        'Paid Months': monthsPaid,
        'Pending Months': pendingMonths,
        'Total Paid Amount (₹)': totalPaidAmount,
        'Remaining Amount (₹)': balanceDue,
        'Application Status': appStatus,
        'Scheme Status': appStatus,
        'Progress Stage': sub.stage || (appStatus === 'Approved' ? 'Approved' : 'Pending Approval')
      });
    }
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Column widths
  worksheet['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 18 }, // Application ID
    { wch: 22 }, // Application Date
    { wch: 25 }, // Customer Name
    { wch: 15 }, // Mobile Number
    { wch: 25 }, // Email ID
    { wch: 22 }, // Location
    { wch: 28 }, // Scheme Name
    { wch: 26 }, // Monthly Amount Per Person (₹)
    { wch: 14 }, // Person Count
    { wch: 26 }, // Monthly Installment Total (₹)
    { wch: 22 }, // Total Duration (Months)
    { wch: 24 }, // Total Scheme Amount (₹)
    { wch: 14 }, // Paid Months
    { wch: 16 }, // Pending Months
    { wch: 22 }, // Total Paid Amount (₹)
    { wch: 22 }, // Remaining Amount (₹)
    { wch: 18 }, // Application Status
    { wch: 18 }, // Scheme Status
    { wch: 20 }  // Progress Stage
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Chit Applications');

  const now = new Date();
  const dateStamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const sortLabel = dateSortOrder === 'asc' ? 'OldestFirst' : 'NewestFirst';
  const filename = `${filenamePrefix}_${dateStamp}_${sortLabel}.xlsx`;

  XLSX.writeFile(workbook, filename);
  return filtered.length;
};

/**
 * Export Orders to Excel (.xlsx)
 * Supports date sorting (newest first / oldest first) and optional date range filter.
 */
export const exportOrdersToExcel = (
  orders: any[],
  options: ExcelExportOptions = {}
): number => {
  const { dateSortOrder = 'desc', startDate, endDate, filenamePrefix = 'SaiYogi_Orders' } = options;

  // Filter by date range if provided
  const filtered = [...orders].filter(order => {
    if (!startDate && !endDate) return true;
    const orderDate = new Date(order.createdAt || order.date || 0);
    if (isNaN(orderDate.getTime())) return true;
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (orderDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (orderDate > end) return false;
    }
    return true;
  });

  // Sort by date according to dateSortOrder
  filtered.sort((a, b) => {
    const timeA = new Date(a.createdAt || a.date || 0).getTime();
    const timeB = new Date(b.createdAt || b.date || 0).getTime();
    return dateSortOrder === 'asc' ? timeA - timeB : timeB - timeA;
  });

  // Map to clean structured columns
  const rows = filtered.map((order, index) => {
    const subtotal = Number(order.subtotal) || 0;
    const packingCharge = Number(order.packingCharge) || (subtotal <= 3999 ? 120 : Math.round(subtotal * 0.03));
    const total = Number(order.total) || Math.round(subtotal + packingCharge);
    
    // Summary of items
    const itemsSummary = Array.isArray(order.items)
      ? order.items.map((i: any) => {
          const name = i.product?.name || i.productName || 'Product';
          const qty = i.quantity || 1;
          return `${name} (x${qty})`;
        }).join('; ')
      : 'N/A';

    const totalQty = Array.isArray(order.items)
      ? order.items.reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0)
      : (order.items?.length || 0);

    const address = order.deliveryAddress?.fullAddress || order.shippingAddress?.fullAddress || (typeof order.deliveryAddress === 'string' ? order.deliveryAddress : '');
    const district = order.deliveryAddress?.district || order.district || '';
    const state = order.deliveryAddress?.state || order.state || '';

    return {
      'S.No': index + 1,
      'Order Date': formatExcelDate(order.createdAt || order.date),
      'Order ID': String(order.orderNumber || order._id || '').slice(-10).toUpperCase(),
      'Customer Name': order.customerName || order.name || 'Customer',
      'Mobile Number': order.customerPhone || order.phone || '',
      'Email ID': order.customerEmail || order.email || 'N/A',
      'Delivery Address': address,
      'District': district,
      'State': state,
      'Total Items Count': totalQty,
      'Items Detail': itemsSummary,
      'Subtotal (₹)': Math.round(subtotal),
      'Packing / Delivery (₹)': Math.round(packingCharge),
      'Grand Total (₹)': Math.round(total),
      'Approval Status': order.approved ? 'Approved' : 'Pending',
      'Shipping Status': order.packingStatus === 'packed' ? 'Shipped' : 'Unshipped',
      'Payment Method': order.paymentMethod || 'Cash On Delivery'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Column widths
  worksheet['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 22 }, // Order Date
    { wch: 16 }, // Order ID
    { wch: 24 }, // Customer Name
    { wch: 15 }, // Mobile Number
    { wch: 28 }, // Email ID
    { wch: 35 }, // Delivery Address
    { wch: 18 }, // District
    { wch: 18 }, // State
    { wch: 16 }, // Total Items Count
    { wch: 50 }, // Items Detail
    { wch: 15 }, // Subtotal
    { wch: 20 }, // Packing Charge
    { wch: 18 }, // Grand Total
    { wch: 16 }, // Approval Status
    { wch: 16 }, // Shipping Status
    { wch: 20 }, // Payment Method
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');

  const now = new Date();
  const dateStamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const sortLabel = dateSortOrder === 'asc' ? 'OldestFirst' : 'NewestFirst';
  const filename = `${filenamePrefix}_${dateStamp}_${sortLabel}.xlsx`;

  XLSX.writeFile(workbook, filename);
  return filtered.length;
};

