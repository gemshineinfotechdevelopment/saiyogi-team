import React from 'react';
import { formatDate } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";

interface ReportPrintTemplateProps {
  title: string;
  fromDate: string;
  toDate: string;
  data: any[];
  viewMode: 'register' | 'summary' | 'stock';
  totals?: any;
  productSummary?: any[];
}

export const ReportPrintTemplate: React.FC<ReportPrintTemplateProps> = ({ 
  title, fromDate, toDate, data, viewMode, totals, productSummary 
}) => {
  const { settings } = useSettings();

  return (
    <div className="bg-white p-[15mm] font-sans text-slate-900 w-[210mm] min-h-[297mm] box-border">
      {/* Header */}
      <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-2xl font-black uppercase">{settings?.shopName || "AVINASH BALA CRACKERS SHOP"}</h1>
        <p className="text-xs font-bold uppercase">{settings?.address}</p>
        <p className="text-xs font-bold">GST: {settings?.gstin}</p>
        <div className="mt-4 bg-slate-900 text-white py-1 px-4 inline-block font-bold rounded uppercase tracking-widest">
          {title}
        </div>
        <p className="text-xs font-bold mt-2 italic text-slate-600">
           Period: {fromDate} To {toDate}
        </p>
      </div>

      {viewMode === 'register' && (
        <table className="w-full text-[10px] border-collapse border border-slate-900">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-900 px-2 py-1.5 text-left">S.No</th>
              <th className="border border-slate-900 px-2 py-1.5 text-left">Bill No</th>
              <th className="border border-slate-900 px-2 py-1.5 text-left">Date</th>
              <th className="border border-slate-900 px-2 py-1.5 text-left">Customer Name</th>
              <th className="border border-slate-900 px-2 py-1.5 text-right">Bill Amt</th>
              <th className="border border-slate-900 px-2 py-1.5 text-right">Disc</th>
              <th className="border border-slate-900 px-2 py-1.5 text-right">Net Amt</th>
              <th className="border border-slate-900 px-2 py-1.5 text-right">Recd</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => {
              const net = item.totalAmount || 0;
              const disc = item.discountAmt || (net * ((item.discountPct || 0) / 100));
              const bill = net + disc;
              return (
                <tr key={idx} className="h-6">
                  <td className="border border-slate-900 px-2 text-center">{idx + 1}</td>
                  <td className="border border-slate-900 px-2 font-bold">{item.billNo}</td>
                  <td className="border border-slate-900 px-2">{formatDate(item.date)}</td>
                  <td className="border border-slate-900 px-2 truncate max-w-[150px]">{item.customerName}</td>
                  <td className="border border-slate-900 px-2 text-right">{bill.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  <td className="border border-slate-900 px-2 text-right">{disc.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  <td className="border border-slate-900 px-2 text-right font-bold">{net.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  <td className="border border-slate-900 px-2 text-right">{ (item.rcvdAmount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2}) }</td>
                </tr>
              )
            })}
          </tbody>
          {totals && (
            <tfoot>
              <tr className="bg-slate-100 font-bold">
                <td colSpan={4} className="border border-slate-900 px-2 py-2 text-right uppercase tracking-wider">Grand Total</td>
                <td className="border border-slate-900 px-2 text-right">{totals.billAmt.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                <td className="border border-slate-900 px-2 text-right">{totals.discAmt.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                <td className="border border-slate-900 px-2 text-right text-primary">{totals.netAmt.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                <td className="border border-slate-900 px-2 text-right">{totals.recdAmt.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
              </tr>
            </tfoot>
          )}
        </table>
      )}

      {viewMode === 'summary' && productSummary && (
        <table className="w-full text-[10px] border-collapse border border-slate-900">
            <thead>
                <tr className="bg-slate-100 uppercase">
                    <th className="border border-slate-900 px-2 py-1.5 text-left">S.No</th>
                    <th className="border border-slate-900 px-2 py-1.5 text-left">Product Name</th>
                    <th className="border border-slate-900 px-2 py-1.5 text-center">Qty</th>
                    <th className="border border-slate-900 px-2 py-1.5 text-right">Total Amount</th>
                </tr>
            </thead>
            <tbody>
                {productSummary.map(([name, stats], idx) => (
                    <tr key={name} className="h-6">
                        <td className="border border-slate-900 px-2 text-center">{idx+1}</td>
                        <td className="border border-slate-900 px-2 font-bold">{name}</td>
                        <td className="border border-slate-900 px-2 text-center">{stats.qty}</td>
                        <td className="border border-slate-900 px-2 text-right font-black">{stats.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      )}

      <div className="mt-8 flex justify-between text-[10px] font-bold">
        <div>Date: {new Date().toLocaleDateString()}</div>
        <div className="border-t border-slate-400 pt-1 w-32 text-center uppercase tracking-widest">Authorized Signatory</div>
      </div>
    </div>
  );
};
