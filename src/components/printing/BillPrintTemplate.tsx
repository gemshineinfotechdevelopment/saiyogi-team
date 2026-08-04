import React, { useEffect } from "react";
import companyLogo from "@/assets/1.png";
import { Settings } from "@/context/SettingsContext";

interface BillItem {
    name: string;
    qty: number;
    uom?: string;
    price: number;
    discountValue?: number;
    hasDiscount?: boolean;
    amount: number;
}

interface BillData {
    billNo: string;
    date: string;
    customerName: string;
    address?: string;
    items: BillItem[];
    totalAmount: number;
    discountPct?: number;
    packingPct?: number;
    gstPct?: number;
    cgst?: number;
    sgst?: number;
    cgstPct?: number;
    sgstPct?: number;
    extraDiscountPct?: number;
    miscCharges?: number;
    miscChargeName?: string;
    billType: "estimate" | "invoice" | "transport";
    type?: string;
    mobNo?: string;
    gstNo?: string;
    aadharNo?: string;
    companyName?: string;
    ownerName?: string;
    companyGstNo?: string;
    companyAddress?: string;
    companyPhone?: string;
}

interface BillPrintTemplateProps {
    data: BillData;
    settings: Settings | null;
    copyType?: string;
}

export const BillPrintTemplate: React.FC<BillPrintTemplateProps> = ({ data, settings }) => {
    useEffect(() => {
        if (data.customerName) {
            document.title = data.customerName;
        }
        return () => {
            document.title = "Narendraa Enterprises";
        };
    }, [data.customerName]);

    const formatCurrency = (amount: number) => {
        return (amount || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const formatDate = (dateStr: string) => {
        try {
            const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
            return dateOnly.split('-').reverse().join('/');
        } catch (e) {
            return dateStr;
        }
    };

    const numberToWords = (num: number) => {
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty ', 'Thirty ', 'Forty ', 'Fifty ', 'Sixty ', 'Seventy ', 'Eighty ', 'Ninety '];

        const n = ('000000000' + Math.floor(num).toString()).slice(-9);
        const parts = [
            n.substring(0, 2),
            n.substring(2, 4),
            n.substring(4, 6),
            n.substring(6, 7),
            n.substring(7, 9)
        ];

        let str = '';
        const crore = parseInt(parts[0]);
        if (crore > 0) str += (crore < 20 ? a[crore] : b[Math.floor(crore / 10)] + a[crore % 10]) + 'Crore ';

        const lakh = parseInt(parts[1]);
        if (lakh > 0) str += (lakh < 20 ? a[lakh] : b[Math.floor(lakh / 10)] + a[lakh % 10]) + 'Lakh ';

        const thousand = parseInt(parts[2]);
        if (thousand > 0) str += (thousand < 20 ? a[thousand] : b[Math.floor(thousand / 10)] + a[thousand % 10]) + 'Thousand ';

        const hundred = parseInt(parts[3]);
        if (hundred > 0) str += a[hundred] + 'Hundred ';

        const tens = parseInt(parts[4]);
        if (tens > 0) {
            str += (tens < 20 ? a[tens] : b[Math.floor(tens / 10)] + a[tens % 10]);
        }

        return str ? str.trim() + ' Rupees Only' : 'Zero Rupees Only';
    };

    // Prepare Items Data
    type RowModel =
        | { type: 'header'; text: string }
        | { type: 'item'; item: BillItem; sNo: number; itemDiscPct: number };

    const discountItems = data.items.filter(item => item.hasDiscount !== false);
    const netRateItems = data.items.filter(item => item.hasDiscount === false);

    const allRows: RowModel[] = [];
    let globalSNo = 1;

    if (discountItems.length > 0) {
        allRows.push({ type: 'header', text: 'Discountable Products' });
        discountItems.forEach(item => {
            allRows.push({ type: 'item', item, sNo: globalSNo++, itemDiscPct: data.discountPct || 0 });
        });
    }

    if (netRateItems.length > 0) {
        allRows.push({ type: 'header', text: 'Non Discountable Products' });
        netRateItems.forEach(item => {
            allRows.push({ type: 'item', item, sNo: globalSNo++, itemDiscPct: 0 });
        });
    }

    const ITEMS_PER_PAGE = 28;
    const itemChunks: RowModel[][] = [];
    for (let i = 0; i < allRows.length; i += ITEMS_PER_PAGE) {
        itemChunks.push(allRows.slice(i, i + ITEMS_PER_PAGE));
    }

    if (itemChunks.length === 0) {
        itemChunks.push([]);
    }

    // Global Calculations
    let totalBeforeDiscount = 0;
    let discountableTotal = 0;
    let nonDiscountableTotal = 0;

    data.items.forEach(item => {
        const itemTotal = (item.qty || 0) * (item.price || 0);
        totalBeforeDiscount += itemTotal;
        if (item.hasDiscount !== false) {
            discountableTotal += itemTotal;
        } else {
            nonDiscountableTotal += itemTotal;
        }
    });

    const discountPct = data.discountPct || 0;
    const discountAmount = discountableTotal * (discountPct / 100);
    const taxableAmount = discountableTotal - discountAmount + nonDiscountableTotal;

    const packingAmt = Math.round(taxableAmount * ((data.packingPct || 0) / 100));
    const miscCharge = data.miscCharges || 0;

    const effectiveGstPct = data.gstPct || ((data.cgstPct || 0) + (data.sgstPct || 0));
    const cgstAmt = data.cgst || (taxableAmount * (effectiveGstPct / 200));
    const sgstAmt = data.sgst || (taxableAmount * (effectiveGstPct / 200));

    const grandTotal = Math.round(taxableAmount + cgstAmt + sgstAmt + packingAmt + miscCharge);

    return (
        <div id="bill-print-template" className="bg-white font-sans text-slate-900 w-[210mm] box-border mx-auto print:mx-0">
            {itemChunks.map((chunk, pageIdx) => {
                const isLastPage = pageIdx === itemChunks.length - 1;

                return (
                    <div key={pageIdx} className="h-[297mm] relative flex flex-col box-border bg-white page-break-after-always p-[8mm]">

                        {/* Outer Border Box */}
                        <div className="border-2 border-black flex flex-col flex-grow relative overflow-hidden bg-transparent">

                            {/* Watermark in background */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 overflow-hidden opacity-[0.05]">
                                <img src={settings?.logo || companyLogo} alt="Watermark Logo" className="w-[180px] h-[180px] object-contain mb-4 grayscale" />
                                <div className="font-bold text-center tracking-wider text-5xl">
                                    {settings?.shopName || "NARENDRAA ENTERPRISES"}
                                </div>
                            </div>

                            {/* Header Section */}
                            <div className="flex justify-between items-start border-b-2 border-black p-3 bg-white relative z-10">
                                {/* Left Logo */}
                                <div className="w-[120px] flex justify-center items-center">
                                    <img src={settings?.logo || companyLogo} alt="Logo" className="w-[85px] h-[85px] object-contain" />
                                </div>

                                {/* Center Text */}
                                <div className="flex-1 flex flex-col items-center justify-center text-center">
                                    <h1 className="text-[26px] font-bold tracking-tight uppercase" style={{ color: '#005b6e', fontFamily: 'Arial, sans-serif' }}>
                                        {data.billType === "transport" && data.companyName ? data.companyName : (settings?.billing?.companyName || settings?.shopName || "Crackers Shop")}
                                    </h1>
                                    <h2 className="text-gray-800 font-semibold text-sm mb-1 italic">
                                        {data.billType === "transport" && data.ownerName ? `Proprietor: ${data.ownerName}` : "(Wholesale & Retail Shop)"}
                                    </h2>
                                    <div className="text-xs text-gray-800 font-medium mb-1 flex items-center justify-center gap-2">
                                        <span>{data.billType === "transport" && data.companyAddress ? data.companyAddress : (settings?.address || "Sivakasi - 626123.")}</span>
                                        <span>|</span>
                                        <span>Ph: {data.billType === "transport" && data.companyPhone ? data.companyPhone : (settings?.billing?.phone || settings?.contact?.phone || settings?.phone || "+91 95859 75756")}</span>
                                        {data.billType !== "transport" && settings?.billing?.whatsapp && (
                                            <>
                                                <span>|</span>
                                                <span>WA: {settings.billing.whatsapp}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-gray-700 flex items-center justify-center gap-2">
                                        {data.billType === "transport" ? (
                                            data.companyGstNo && <span className="font-bold">GSTIN: {data.companyGstNo}</span>
                                        ) : (
                                            <>
                                                <span>E-Mail : {settings?.billing?.email || settings?.contact?.email || settings?.email || "demo@gmail.com"}</span>
                                                {settings?.billing?.applyGst && settings?.billing?.gstNumber && (
                                                    <>
                                                        <span>|</span>
                                                        <span className="font-bold">GSTIN: {settings.billing.gstNumber}</span>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side Info */}
                                <div className="w-[130px] flex flex-col items-end text-xs justify-start pt-2 pr-2">
                                    <div className="text-[10px] text-gray-600 mb-1">Customer Copy</div>
                                    <div className="flex items-center text-[#22c55e] font-bold">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                        {settings?.phone || "09369203693"}
                                    </div>
                                </div>
                            </div>

                            {/* Customer & Estimate Details */}
                            <div className="flex border-b-2 border-black bg-white relative z-10 min-h-[90px]">
                                {/* Customer Details (Left) */}
                                <div className="w-[65%] border-r-2 border-black p-3 flex flex-col justify-between">
                                    <div className="flex text-[13px] items-center font-bold">
                                        <span className="w-14">Name</span>
                                        <span className="mr-2">:</span>
                                        <span className="flex-1">{data.customerName || ""}</span>
                                    </div>
                                    <div className="flex text-[13px] items-center mt-1 font-bold">
                                        <span className="w-14">Phone</span>
                                        <span className="mr-2">:</span>
                                        <span className="flex-1">{data.mobNo || ""}</span>
                                    </div>
                                    {data.gstNo && (
                                        <div className="flex text-[13px] items-center mt-1 font-bold">
                                            <span className="w-14">GST No</span>
                                            <span className="mr-2">:</span>
                                            <span className="flex-1 uppercase">{data.gstNo}</span>
                                        </div>
                                    )}
                                    {data.aadharNo && (
                                        <div className="flex text-[13px] items-center mt-1 font-bold">
                                            <span className="w-14">Aadhar</span>
                                            <span className="mr-2">:</span>
                                            <span className="flex-1">{data.aadharNo}</span>
                                        </div>
                                    )}
                                    <div className="flex-1 w-full border-b border-gray-400 mt-3"></div>
                                    <div className="flex-1 w-full border-b border-gray-400 mt-4"></div>
                                    <div className="flex-1 w-full mt-4"></div>
                                </div>

                                {/* Estimate Details (Right) */}
                                <div className="w-[35%] flex flex-col">
                                    <div className="bg-[#fef2f2] border-b-2 border-black text-center font-bold py-2 text-[13px] uppercase">
                                        {data.billType === 'estimate' ? 'RETAIL ESTIMATE' : data.billType === 'transport' ? 'TRANSPORT BILL' : 'INVOICE'}
                                    </div>
                                    <div className="flex text-[12px] px-3 py-1.5 border-b border-black flex-1 items-center">
                                        <span className="w-16">{data.billType === 'transport' ? 'Bill No.' : 'R.Est No.'}</span>
                                        <span className="mr-2">:</span>
                                        <span className="font-medium">{data.billNo}</span>
                                    </div>
                                    <div className="flex text-[12px] px-3 py-1.5 flex-1 items-center">
                                        <span className="w-16">Date</span>
                                        <span className="mr-2">:</span>
                                        <span className="font-medium">{formatDate(data.date)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Product Table */}
                            <div className="flex flex-col flex-grow relative z-10 border-b-2 border-black">
                                <table className="w-full text-[11px] border-collapse h-full" style={{ tableLayout: 'fixed' }}>
                                    <thead className="bg-[#08707a] text-white">
                                        <tr>
                                            <th className="border border-black p-1.5 w-[35px] text-center font-semibold">S.No</th>
                                            <th className="border border-black p-1.5 text-left font-semibold">Product Name</th>
                                            <th className="border border-black p-1.5 w-[50px] text-center font-semibold">Qty</th>
                                            <th className="border border-black p-1.5 w-[70px] text-center font-semibold">Price</th>
                                            <th className="border border-black p-1.5 w-[75px] text-center font-semibold">Total</th>
                                            <th className="border border-black p-1.5 w-[45px] text-center font-semibold">Disc%</th>
                                            <th className="border border-black p-1.5 w-[65px] text-center font-semibold">Less</th>
                                            <th className="border border-black p-1.5 w-[85px] text-center font-semibold">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-transparent">
                                        {chunk.map((row, idx) => {
                                            if (row.type === 'header') {
                                                return (
                                                    <tr key={`header-${idx}`} className="bg-[#fcf8f8]">
                                                        <td colSpan={8} className="border border-black py-0.5 text-center font-bold text-[10px]">
                                                            {row.text}
                                                        </td>
                                                    </tr>
                                                );
                                            } else {
                                                const { item, sNo, itemDiscPct } = row;
                                                const itemTotal = (item.qty || 0) * (item.price || 0);
                                                const itemLess = itemTotal * (itemDiscPct / 100);
                                                const finalTotal = itemTotal - itemLess;

                                                return (
                                                    <tr key={`item-${idx}`} className="text-center h-[19px]">
                                                        <td className="border border-black text-gray-800">{sNo}</td>
                                                        <td className="border border-black text-left px-2 font-bold uppercase text-[11px] text-gray-900 truncate overflow-hidden whitespace-nowrap">{item.name}</td>
                                                        <td className="border border-black">
                                                            <span className="font-bold">{item.qty}</span> <span className="text-[9px] text-gray-600">{item.uom || 'Box'}</span>
                                                        </td>
                                                        <td className="border border-black text-right px-1.5">{formatCurrency(item.price)}</td>
                                                        <td className="border border-black text-right px-1.5">{formatCurrency(itemTotal)}</td>
                                                        <td className="border border-black">{itemDiscPct}</td>
                                                        <td className="border border-black text-right px-1.5">{formatCurrency(itemLess)}</td>
                                                        <td className="border border-black text-right px-1.5 font-bold">{formatCurrency(finalTotal)}</td>
                                                    </tr>
                                                );
                                            }
                                        })}

                                        {/* Pad empty rows to fill height but only show vertical lines */}
                                        {Array.from({ length: Math.max(0, ITEMS_PER_PAGE - chunk.length) }).map((_, idx) => (
                                            <tr key={'empty-' + idx} className="h-[19px]">
                                                <td className="border-x border-black"></td>
                                                <td className="border-x border-black"></td>
                                                <td className="border-x border-black"></td>
                                                <td className="border-x border-black"></td>
                                                <td className="border-x border-black"></td>
                                                <td className="border-x border-black"></td>
                                                <td className="border-x border-black"></td>
                                                <td className="border-x border-black"></td>
                                            </tr>
                                        ))}

                                        {/* Stretching row to fill any remaining vertical gap */}
                                        <tr className="h-auto">
                                            <td className="border-x border-black"></td>
                                            <td className="border-x border-black"></td>
                                            <td className="border-x border-black"></td>
                                            <td className="border-x border-black"></td>
                                            <td className="border-x border-black"></td>
                                            <td className="border-x border-black"></td>
                                            <td className="border-x border-black"></td>
                                            <td className="border-x border-black"></td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* Running Totals on Every Page */}
                                <div className="flex justify-between px-6 py-2 mt-auto border-t-2 border-black bg-[#fef2f2] text-[12px] font-bold text-gray-800">
                                    <div>Total Before Discount : ₹{formatCurrency(totalBeforeDiscount)}</div>
                                    <div>Discount : ₹{formatCurrency(discountAmount)}</div>
                                    <div>Total After Discount : ₹{formatCurrency(taxableAmount)}</div>
                                </div>
                            </div>

                            {/* Footer / Summary Box (Only on last page) */}
                            {isLastPage ? (
                                <div className="flex bg-white relative z-10 min-h-[150px]">
                                    {/* Left Side: Delivery & Signatures */}
                                    <div className="w-[55%] border-r-2 border-black flex flex-col text-[11px]">
                                        <div className="flex px-3 py-2 items-center">
                                            <span className="w-24 text-gray-800">Delivery Address</span>
                                            <span className="mx-1">:</span>
                                            <span className="flex-1 text-gray-900">{data.address || "365, Sundaram Street, Sivakasi."}</span>
                                        </div>
                                        <div className="border-t border-black"></div>
                                        <div className="flex flex-col px-3 py-2 justify-center min-h-[50px]">
                                            <span className="text-gray-800 font-bold mb-1">Grand Total In Words :</span>
                                            <span className="font-semibold text-gray-900 text-[12px]">{numberToWords(grandTotal)}</span>
                                        </div>
                                        <div className="border-t border-black"></div>

                                        {/* Signatures Area */}
                                        <div className="flex-1 flex justify-between items-end px-3 pb-3 pt-8">
                                            <div className="text-[10px] text-gray-700">Entered by</div>
                                            <div className="flex flex-col items-center pr-10">
                                                <span className="font-bold text-[11px] italic mb-6">For {data.billType === "transport" && data.companyName ? data.companyName : (settings?.shopName || "NARENDRAA ENTERPRISES")}</span>
                                                <span className="text-[9px] text-gray-500">Authorized Signatory</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side: Summary Table */}
                                    <div className="w-[45%] flex flex-col text-[10px] pt-1 pb-0 px-2 font-medium bg-white">
                                        <div className="text-center font-bold text-[12px] border-b border-black pb-1 mb-1 uppercase tracking-wider">Invoice Summary</div>

                                        <div className="grid grid-cols-[auto_auto_1fr] gap-x-2 px-2">
                                            <span className="text-gray-800">Total Before Discount</span>
                                            <span className="text-gray-400">:</span>
                                            <span className="text-right">{formatCurrency(totalBeforeDiscount)}</span>

                                            <span className="text-gray-800">Discountable Products</span>
                                            <span className="text-gray-400">:</span>
                                            <span className="text-right">{formatCurrency(discountableTotal)}</span>

                                            <span className="text-gray-800">Non Discountable Products</span>
                                            <span className="text-gray-400">:</span>
                                            <span className="text-right">{formatCurrency(nonDiscountableTotal)}</span>

                                            <span className="text-gray-800">Discount Amount ({discountPct}%)</span>
                                            <span className="text-gray-400">:</span>
                                            <span className="text-right">{formatCurrency(discountAmount)}</span>

                                            <div className="col-span-3 border-b border-gray-300 my-0.5"></div>

                                            <span className="font-bold text-[12px] text-gray-900">Taxable Amount</span>
                                            <span className="text-gray-400">:</span>
                                            <span className="text-right font-bold text-[12px]">{formatCurrency(taxableAmount)}</span>

                                            {(data.packingPct || 0) > 0 && (
                                                <>
                                                    <span className="text-gray-800">Packing {data.packingPct}%</span>
                                                    <span className="text-gray-400">:</span>
                                                    <span className="text-right">{formatCurrency(packingAmt)}</span>
                                                </>
                                            )}

                                            {(data.miscCharges || 0) > 0 && (
                                                <>
                                                    <span className="text-gray-800">{data.miscChargeName || 'Misc Charges'}</span>
                                                    <span className="text-gray-400">:</span>
                                                    <span className="text-right">{formatCurrency(miscCharge)}</span>
                                                </>
                                            )}

                                            <span className="text-gray-800">CGST ({(effectiveGstPct / 2)}%)</span>
                                            <span className="text-gray-400">:</span>
                                            <span className="text-right">{formatCurrency(cgstAmt)}</span>

                                            <span className="text-gray-800">SGST ({(effectiveGstPct / 2)}%)</span>
                                            <span className="text-gray-400">:</span>
                                            <span className="text-right">{formatCurrency(sgstAmt)}</span>
                                        </div>

                                        <div className="flex justify-between px-2 py-1 mt-1 border-t-2 border-black font-extrabold text-[14px] bg-gray-200 text-black">
                                            <span className="uppercase">Grand Total</span>
                                            <span className="text-gray-500">:</span>
                                            <span className="flex-1 text-right">₹{formatCurrency(grandTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white relative z-10 flex-1"></div>
                            )}

                        </div>
                    </div>
                );
            })}
        </div>
    );
};
