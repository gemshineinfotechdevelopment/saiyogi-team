import { apiRequest } from "@/lib/api";
import { getLocalDate } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useSettings } from "@/context/SettingsContext";

interface ItemRow {
  id: number;
  productCode: string;
  product?: string;
  name: string;
  qty: number;
  uom: string;
  price: number;
  hasDiscount: boolean;
  amount: number;
}

interface EstimateFormProps {
  type: "Retail" | "Wholesale" | "Net-Rate";
  onBack: () => void;
  onSave: (data: any, print?: boolean) => void;
  onChange?: (data: any) => void;
  editData?: any;
}

export function EstimateForm({ type, onBack, onSave, onChange, editData }: EstimateFormProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const suggestionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    apiRequest('/products?limit=10000')
      .then(data => {
        if (Array.isArray(data)) setProducts(data);
        else if (data && Array.isArray(data.products)) setProducts(data.products);
      })
      .catch(err => {
        console.warn("Backend not reachable for products:", err);
      });
  }, []);

  const [billNo, setBillNo] = useState(editData?.billNo || "");
  const [date, setDate] = useState(editData?.date ? (editData.date.includes("T") ? editData.date.split("T")[0] : editData.date) : getLocalDate());
  const [billType, setBillType] = useState(editData?.billType || type);
  const [paymentType, setPaymentType] = useState(editData?.paymentType || "Credit");
  const [lrDate, setLrDate] = useState(editData?.lrDate ? (editData.lrDate.includes("T") ? editData.lrDate.split("T")[0] : editData.lrDate) : getLocalDate());
  const [totalParcel, setTotalParcel] = useState(editData?.totalParcel || "1");
  const [toAddress, setToAddress] = useState(editData?.toAddress || "");

  const [customerName, setCustomerName] = useState(editData?.customerName || "");
  const [mobNo, setMobNo] = useState(editData?.mobNo || "");
  const [lrNo, setLrNo] = useState(editData?.lrNo || "");
  const [gstNo, setGstNo] = useState(editData?.gstNo || "");
  const [aadharNo, setAadharNo] = useState(editData?.aadharNo || "");
  const [cashStatus, setCashStatus] = useState(editData?.cashStatus || "Paid");
  const [address, setAddress] = useState(editData?.address || "");

  const [miscCharges, setMiscCharges] = useState(editData?.miscCharges || 0);
  const [miscChargeName, setMiscChargeName] = useState(editData?.miscChargeName || "Other");
  const [miscChargePct, setMiscChargePct] = useState(editData?.miscChargePct || 0);
  
  const [discountPct, setDiscountPct] = useState(editData?.discountPct || 0);
  
  const { settings } = useSettings();
  const [cgstPct, setCgstPct] = useState(
    editData?.cgstPct !== undefined ? editData.cgstPct : 
    editData?.gstPct !== undefined ? editData.gstPct / 2 : 
    settings?.gstRate !== undefined ? settings.gstRate / 2 : 0
  );
  const [sgstPct, setSgstPct] = useState(
    editData?.sgstPct !== undefined ? editData.sgstPct : 
    editData?.gstPct !== undefined ? editData.gstPct / 2 : 
    settings?.gstRate !== undefined ? settings.gstRate / 2 : 0
  );
  const [rcvdAmount, setRcvdAmount] = useState(editData?.rcvdAmount || 0);
  const [status, setStatus] = useState(editData?.status || "active");

  const [items, setItems] = useState<ItemRow[]>(
    editData?.items && editData.items.length > 0 
      ? editData.items.map((i: any, idx: number) => ({
          ...i,
          id: i.id || i._id || Date.now() + idx,
          productCode: i.productCode || i.sku || "",
          hasDiscount: i.hasDiscount !== false,
        }))
      : []
  );

  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);

  const [currentEntry, setCurrentEntry] = useState(editData?.currentEntry || {
    productCode: "",
    productId: "",
    name: "",
    qty: 1,
    rate: 0,
    uom: "BOX",
    amount: 0,
    hasDiscount: false,
    maxAvailableQty: 0,
  });

  useEffect(() => {
    setCurrentEntry(prev => ({
      ...prev,
      amount: Number((prev.qty * prev.rate).toFixed(2))
    }));
  }, [currentEntry.qty, currentEntry.rate]);

  const handleUpdateItem = (itemId: number, field: "qty" | "price" | "uom", value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        if (field === "qty" || field === "price") {
          updatedItem.amount = Number(updatedItem.qty) * Number(updatedItem.price);
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleAddEntry = () => {
    if (!currentEntry.name) { toast.error("Please enter a product name"); return; }
    if (currentEntry.qty <= 0) { toast.error("Quantity must be greater than 0"); return; }
    if (currentEntry.qty > currentEntry.maxAvailableQty) {
      toast.error(`Insufficient stock! Only ${currentEntry.maxAvailableQty} available.`);
      return;
    }
    
    setItems([...items, {
      id: Date.now(),
      productCode: currentEntry.productCode,
      product: currentEntry.productId,
      name: currentEntry.name,
      qty: currentEntry.qty,
      uom: currentEntry.uom,
      price: currentEntry.rate,
      hasDiscount: currentEntry.hasDiscount,
      amount: currentEntry.amount
    }]);

    setCurrentEntry({
      productCode: "", productId: "", name: "", qty: 1, rate: 0, uom: "BOX", amount: 0, hasDiscount: false, maxAvailableQty: 0
    });
    setSelectedItemIds([]);
  };

  const handleRemoveSelected = () => {
    if (selectedItemIds.length === 0) { toast.error("Select items to remove"); return; }
    setItems(items.filter(i => !selectedItemIds.includes(i.id)));
    setSelectedItemIds([]);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedItemIds(items.map(i => i.id));
    else setSelectedItemIds([]);
  };

  const toggleSelect = (id: number, checked: boolean) => {
    if (checked) setSelectedItemIds([...selectedItemIds, id]);
    else setSelectedItemIds(selectedItemIds.filter(itemId => itemId !== id));
  };

  const discountableSubtotal = items.filter(i => i.hasDiscount).reduce((sum, item) => sum + item.amount, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const discountAmt = discountableSubtotal * (discountPct / 100);
  const calculatedMiscAmt = miscChargePct > 0 ? ((totalAmount - discountAmt) * (miscChargePct / 100)) : miscCharges;
  const taxableAmount = totalAmount - discountAmt;
  const isImmutable = type === "Retail" || type === "Net-Rate";
  const cgstAmt = taxableAmount * (cgstPct / 100);
  const sgstAmt = taxableAmount * (sgstPct / 100);
  const taxTotal = cgstAmt + sgstAmt;
  const grandTotal = taxableAmount + taxTotal + calculatedMiscAmt;
  const balanceAmt = grandTotal - rcvdAmount;

  useEffect(() => { if (type === "Net-Rate") setDiscountPct(0); }, [type]);

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const latestState = useRef<any>(null);
  
  const currentState = { 
    billNo, date, customerName, address, mobNo, gstNo, aadharNo, 
    billType, paymentType, cashStatus, status, lrNo, lrDate, totalParcel, 
    toAddress, miscCharges: calculatedMiscAmt, miscChargeName, miscChargePct, discountPct, 
    cgstPct, sgstPct, rcvdAmount, items, totalAmount: grandTotal, 
    type, cgst: cgstAmt, sgst: sgstAmt, gstPct: (cgstPct + sgstPct),
    packingPct: 0, extraDiscountPct: 0, currentEntry
  };

  useEffect(() => {
    latestState.current = currentState;
    if (onChangeRef.current) {
      onChangeRef.current(currentState);
    }
  }, [
    billNo, date, customerName, address, mobNo, gstNo, aadharNo, billType, paymentType,
    cashStatus, status, lrNo, lrDate, totalParcel, toAddress, miscCharges, miscChargeName,
    miscChargePct, discountPct, cgstPct, sgstPct, rcvdAmount, items, grandTotal, type, cgstAmt, sgstAmt, calculatedMiscAmt, currentEntry
  ]);

  useEffect(() => {
    return () => {
      if (onChangeRef.current && latestState.current) {
        onChangeRef.current(latestState.current);
      }
    };
  }, []);

  const handleProductSelect = (p: any) => {
    let rate = p.price;
    if (type === "Wholesale") rate = p.wholesalePrice || p.price;
    if (type === "Net-Rate") rate = p.netRate || p.netPrice || p.price;
    setCurrentEntry({
      ...currentEntry,
      productCode: p.code || p.sku || p._id?.substring(0, 4) || "",
      productId: p._id,
      name: p.name,
      rate: rate,
      uom: p.uom || "BOX",
      hasDiscount: p.hasDiscount !== false,
      amount: rate * currentEntry.qty,
      maxAvailableQty: p.storeStockPieces || 0
    });
    setShowSuggestions(false);
  };

  const handleSaveWrapper = (statusOverride?: string, print: boolean = false) => {
    if (!customerName.trim()) { toast.error("Please enter customer name"); return; }
    if (items.length === 0) { toast.error("Please add at least one item"); return; }
    onSave({ 
      billNo, date, customerName, address, mobNo, gstNo, aadharNo, 
      billType, paymentType, cashStatus, status: statusOverride || status, lrNo, lrDate, totalParcel, 
      toAddress, miscCharges: calculatedMiscAmt, miscChargeName, miscChargePct, discountPct, 
      cgstPct, sgstPct, rcvdAmount, items, totalAmount: grandTotal, 
      type, cgst: cgstAmt, sgst: sgstAmt, gstPct: (cgstPct + sgstPct),
      packingPct: 0, extraDiscountPct: 0
    }, print);
  };

  const inputClass = "border border-gray-400 h-7 text-[11px] px-1.5 focus:outline-none focus:border-blue-500 bg-white shadow-sm font-medium";
  const headerGradient = "bg-gradient-to-r from-[#61a0b5] to-[#40768b] text-white font-bold text-xs py-1.5 px-3 shadow-sm";

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50 flex justify-center p-2 md:p-4 font-sans animate-in fade-in duration-300">
      <div className="w-full max-w-5xl bg-white border border-gray-300 shadow-xl rounded-sm overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-blue-500 text-white px-4 py-2 text-lg font-bold tracking-wide shadow-md flex items-center justify-between">
          <span>BILLING SOFTWARE</span>
          <button onClick={onBack} className="text-white hover:text-blue-200 bg-blue-600 px-2 py-0.5 rounded text-xs font-semibold">✕ Close</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Top Info */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-3 items-end">
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-gray-700 font-bold ml-1">Bill No</label>
              <input value={billNo} readOnly className={`${inputClass} bg-gray-100 text-center w-full`} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-gray-700 font-bold ml-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={`${inputClass} w-full`} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-gray-700 font-bold ml-1">Bill Type</label>
              <select value={billType} onChange={e => setBillType(e.target.value)} className={`${inputClass} w-full`}>
                <option value="Retail">Retail</option>
                <option value="Wholesale">Wholesale</option>
                <option value="Net-Rate">Net-Rate</option>
                <option value="Estimate">Estimate</option>
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-gray-700 font-bold ml-1">Payment Type</label>
              <select value={paymentType} onChange={e => setPaymentType(e.target.value)} className={`${inputClass} w-full`}>
                <option value="Credit">Credit</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-gray-700 font-bold ml-1">LR Date</label>
              <input type="date" value={lrDate} onChange={e => setLrDate(e.target.value)} className={`${inputClass} w-full`} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-gray-700 font-bold ml-1">Parcel Count</label>
              <input value={totalParcel} onChange={e => setTotalParcel(e.target.value)} className={`${inputClass} text-center w-full`} />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-gray-700 font-bold ml-1">To Address</label>
              <input value={toAddress} onChange={e => setToAddress(e.target.value)} className={`${inputClass} w-full`} />
            </div>
          </div>

          {/* CUSTOMER */}
          <div className="border border-gray-300 rounded-sm overflow-hidden shadow-sm">
            <div className={headerGradient}>CUSTOMER DETAILS</div>
            <div className="p-3 bg-[#f8fafc]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-6">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-gray-700 font-semibold w-24 flex-shrink-0 text-right">Customer Name</label>
                  <input value={customerName} onChange={e => setCustomerName(e.target.value)} className={`${inputClass} w-full`} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-gray-700 font-semibold w-20 flex-shrink-0 text-right">Phone No.</label>
                  <input value={mobNo} onChange={e => setMobNo(e.target.value)} className={`${inputClass} w-full`} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-gray-700 font-semibold w-16 flex-shrink-0 text-right">LR No.</label>
                  <input value={lrNo} onChange={e => setLrNo(e.target.value)} className={`${inputClass} w-full`} />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-gray-700 font-semibold w-24 flex-shrink-0 text-right">GST No.</label>
                  <input value={gstNo} onChange={e => setGstNo(e.target.value)} className={`${inputClass} w-full uppercase`} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-gray-700 font-semibold w-20 flex-shrink-0 text-right">Aadhar No.</label>
                  <input value={aadharNo} onChange={e => setAadharNo(e.target.value)} className={`${inputClass} w-full`} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-gray-700 font-semibold w-16 flex-shrink-0 text-right">Cash Type</label>
                  <select value={cashStatus} onChange={e => setCashStatus(e.target.value)} className={`${inputClass} w-full`}>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>

                <div className="col-span-1 md:col-span-3 flex items-center gap-2">
                  <label className="text-[11px] text-gray-700 font-semibold w-24 flex-shrink-0 text-right">Address</label>
                  <input value={address} onChange={e => setAddress(e.target.value)} className={`${inputClass} w-full`} />
                </div>
              </div>
            </div>
          </div>

          {/* ENTRY */}
          <div className="border border-gray-300 rounded-sm overflow-visible shadow-sm">
            <div className={`${headerGradient} rounded-t-[1px]`}>PRODUCT ENTRY</div>
            <div className="p-3 bg-white">
              <div className="flex flex-wrap md:flex-nowrap gap-2 items-end">
                <div className="flex flex-col gap-0.5 w-20">
                  <label className="text-[10px] text-gray-700 font-bold ml-1">Product Code</label>
                  <input value={currentEntry.productCode} readOnly={isImmutable} onChange={e => setCurrentEntry({...currentEntry, productCode: e.target.value})} className={`${inputClass} w-full text-center ${isImmutable ? "bg-gray-100 cursor-not-allowed text-gray-500" : ""}`} />
                </div>
                
                <div className="flex flex-col gap-0.5 relative flex-1">
                  <label className="text-[10px] text-gray-700 font-bold ml-1">Product Name</label>
                  <input 
                    value={currentEntry.name} 
                    onChange={e => {
                      setCurrentEntry({...currentEntry, name: e.target.value});
                      setShowSuggestions(true);
                      setFocusedIndex(0);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onKeyDown={(e) => {
                      const filtered = products.filter(p => (p.name || "").toLowerCase().includes(currentEntry.name.toLowerCase()));
                      if (e.key === "ArrowDown") {
                        e.preventDefault(); setFocusedIndex(prev => Math.min(prev + 1, filtered.length - 1));
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault(); setFocusedIndex(prev => Math.max(prev - 1, 0));
                      } else if (e.key === "Enter" && showSuggestions && filtered[focusedIndex]) {
                        e.preventDefault(); handleProductSelect(filtered[focusedIndex]);
                      }
                    }}
                    className={`${inputClass} w-full`} 
                  />
                  {showSuggestions && (
                    <div ref={suggestionRef} className="absolute top-full left-0 w-full z-50 bg-white border border-gray-400 shadow-lg max-h-48 overflow-y-auto">
                      {products.filter(p => (p.name || "").toLowerCase().includes(currentEntry.name.toLowerCase())).map((p, idx) => (
                        <div 
                          key={p.id || idx} 
                          className={`px-3 py-1.5 text-[11px] font-medium cursor-pointer flex justify-between ${idx === focusedIndex ? 'bg-blue-500 text-white' : 'hover:bg-blue-100 text-gray-800'}`}
                          onClick={() => handleProductSelect(p)}
                        >
                          <span>{p.name}</span>
                          <span className={(p.storeStockPieces || 0) > 0 ? (idx === focusedIndex ? "text-blue-100" : "text-green-600") : "text-red-500"}>Stk: {(p.storeStockPieces || 0) || 0}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                

                <div className="flex flex-col gap-0.5 w-16">
                  <label className="text-[10px] text-gray-700 font-bold ml-1 text-center">Quantity</label>
                  <input type="number" value={currentEntry.qty || ""} onChange={e => setCurrentEntry({...currentEntry, qty: Number(e.target.value)})} className={`${inputClass} w-full text-center`} />
                </div>

                <div className="flex flex-col gap-0.5 w-20">
                  <label className="text-[10px] text-gray-700 font-bold ml-1 text-right">Rate</label>
                  <input type="number" value={currentEntry.rate || ""} readOnly={isImmutable} onChange={e => setCurrentEntry({...currentEntry, rate: Number(e.target.value)})} className={`${inputClass} w-full text-right ${isImmutable ? "bg-gray-100 cursor-not-allowed text-gray-500" : ""}`} />
                </div>

                <div className="flex flex-col gap-0.5 w-20">
                  <label className="text-[10px] text-gray-700 font-bold ml-1">Unit</label>
                  <select value={currentEntry.uom} disabled={isImmutable} onChange={e => setCurrentEntry({...currentEntry, uom: e.target.value})} className={`${inputClass} w-full ${isImmutable ? "bg-gray-100 cursor-not-allowed text-gray-500" : ""}`}>
                    <option value="BOX">BOX</option>
                    <option value="CASE">CASE</option>
                    <option value="PCS">PCS</option>
                  </select>
                </div>

                <div className="flex flex-col gap-0.5 w-24">
                  <label className="text-[10px] text-gray-700 font-bold ml-1 text-right">Total amount</label>
                  <input value={currentEntry.amount.toFixed(2)} readOnly className={`${inputClass} w-full text-right bg-gray-100 text-gray-800 font-bold`} />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-3 border-t border-gray-100 pt-3">
                <button onClick={handleAddEntry} className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold text-[11px] px-5 py-1.5 rounded shadow-sm flex items-center gap-1 transition-colors">
                  <span className="text-base leading-none mb-0.5">+</span> Add
                </button>
                <button onClick={handleRemoveSelected} className="bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold text-[11px] px-5 py-1.5 rounded shadow-sm flex items-center gap-1 transition-colors">
                  <span className="text-base leading-none mb-0.5">-</span> Remove
                </button>
              </div>
            </div>
          </div>

          {/* LIST */}
          <div className="border border-gray-300 rounded-sm shadow-sm overflow-hidden flex flex-col h-[280px]">
            <div className={headerGradient}>PRODUCT LIST</div>
            <div className="overflow-y-auto flex-1 bg-white">
              <table className="w-full text-[11px] border-collapse">
                <thead className="sticky top-0 bg-[#f1f5f9] z-10 border-b border-gray-300 shadow-sm">
                  <tr>
                    <th className="p-1.5 border-r border-gray-300 w-8 text-center">
                      <input type="checkbox" checked={items.length > 0 && selectedItemIds.length === items.length} onChange={e => toggleSelectAll(e.target.checked)} className="cursor-pointer" />
                    </th>
                    <th className="p-1.5 border-r border-gray-300 w-10 text-center font-bold text-gray-700">S.No</th>
                    <th className="p-1.5 border-r border-gray-300 w-24 text-left font-bold text-gray-700">Product Code</th>
                    <th className="p-1.5 border-r border-gray-300 text-left font-bold text-gray-700">Product Name</th>
                    
                    <th className="p-1.5 border-r border-gray-300 w-12 text-center font-bold text-gray-700">Qty</th>
                    <th className="p-1.5 border-r border-gray-300 w-16 text-center font-bold text-gray-700">Unit</th>
                    <th className="p-1.5 border-r border-gray-300 w-20 text-right font-bold text-gray-700">Rate</th>
                    <th className="p-1.5 border-r border-gray-300 w-20 text-right font-bold text-gray-700">Discount(%)</th>
                    <th className="p-1.5 border-r border-gray-300 w-24 text-right font-bold text-gray-700">Discount Amt</th>
                    <th className="p-1.5 border-r border-gray-300 w-24 text-right font-bold text-gray-700">After Discount</th>
                    <th className="p-1.5 w-24 text-right font-bold text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const lineDiscountAmt = item.hasDiscount ? (item.amount * (discountPct / 100)) : 0;
                    const lineAfterDiscount = item.amount - lineDiscountAmt;
                    return (
                      <tr key={item.id} className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                        <td className="p-1.5 border-r border-gray-200 text-center">
                          <input type="checkbox" checked={selectedItemIds.includes(item.id)} onChange={e => toggleSelect(item.id, e.target.checked)} className="cursor-pointer" />
                        </td>
                        <td className="p-1.5 border-r border-gray-200 text-center text-gray-600">{idx + 1}</td>
                        <td className="p-1.5 border-r border-gray-200 text-gray-800">{item.productCode}</td>
                        <td className="p-1.5 border-r border-gray-200 text-gray-800 font-medium">{item.name}</td>
                        
                        <td className="p-1.5 border-r border-gray-200 text-center">
                          <input type="number" min="1" value={item.qty || ""} onChange={(e) => handleUpdateItem(item.id, "qty", Number(e.target.value))} className="w-full text-center bg-transparent focus:bg-white border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 outline-none transition-colors" />
                        </td>
                        <td className="p-1.5 border-r border-gray-200 text-center">
                          <select value={item.uom} disabled={isImmutable} onChange={(e) => handleUpdateItem(item.id, "uom", e.target.value)} className={`w-full text-center bg-transparent focus:bg-white border-b-2 border-transparent ${isImmutable ? "cursor-not-allowed text-gray-400" : "hover:border-gray-300 focus:border-blue-500 outline-none appearance-none cursor-pointer transition-colors text-gray-600"}`}>
                            <option value="BOX">BOX</option>
                            <option value="CASE">CASE</option>
                            <option value="PCS">PCS</option>
                          </select>
                        </td>
                        <td className="p-1.5 border-r border-gray-200 text-right">
                          <input type="number" min="0" step="0.01" value={item.price} readOnly={isImmutable} onChange={(e) => handleUpdateItem(item.id, "price", Number(e.target.value))} className={`w-full text-right bg-transparent focus:bg-white border-b-2 border-transparent ${isImmutable ? "cursor-not-allowed text-gray-400" : "hover:border-gray-300 focus:border-blue-500 outline-none transition-colors text-gray-800"}`} />
                        </td>
                        <td className="p-1.5 border-r border-gray-200 text-right text-gray-600">{item.hasDiscount ? discountPct.toFixed(2) : "0.00"}</td>
                        <td className="p-1.5 border-r border-gray-200 text-right text-gray-600">{lineDiscountAmt.toFixed(2)}</td>
                        <td className="p-1.5 border-r border-gray-200 text-right text-gray-800">{lineAfterDiscount.toFixed(2)}</td>
                        <td className="p-1.5 text-right font-semibold text-gray-800">{lineAfterDiscount.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  {Array.from({ length: Math.max(0, 5 - items.length) }).map((_, i) => (
                    <tr key={`empty-${i}`} className="border-b border-gray-100 h-[29px]">
                      <td className="border-r border-gray-100"></td><td className="border-r border-gray-100"></td><td className="border-r border-gray-100"></td><td className="border-r border-gray-100"></td><td className="border-r border-gray-100"></td><td className="border-r border-gray-100"></td><td className="border-r border-gray-100"></td><td className="border-r border-gray-100"></td><td className="border-r border-gray-100"></td><td className="border-r border-gray-100"></td><td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TOTALS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* PAYMENT DETAILS */}
            <div className="border border-gray-300 rounded-sm overflow-hidden shadow-sm h-fit bg-white">
              <div className={headerGradient}>PAYMENT DETAILS</div>
              <div className="p-3 space-y-2.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] text-gray-700 font-medium">Bill Amount</label>
                  <input value={grandTotal.toFixed(2)} readOnly className={`${inputClass} w-28 text-right`} />
                </div>
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] text-gray-700 font-medium">Received Amount</label>
                  <input type="number" value={rcvdAmount || ""} onChange={e => setRcvdAmount(Number(e.target.value))} className={`${inputClass} w-28 text-right bg-white`} />
                </div>
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] text-gray-700 font-medium">Balance Amount</label>
                  <input value={balanceAmt.toFixed(2)} readOnly className={`${inputClass} w-28 text-right font-bold ${balanceAmt > 0 ? "text-red-600 bg-red-50" : "text-gray-800 bg-gray-50"}`} />
                </div>
              </div>
            </div>

            {/* DISCOUNT / CHARGES */}
            <div className="border border-gray-300 rounded-sm overflow-hidden shadow-sm h-fit bg-white">
              <div className={headerGradient}>DISCOUNT / CHARGES</div>
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-3 items-center gap-2">
                  <label className="text-[11px] text-gray-700 font-medium col-span-1">Discount (%)</label>
                  <div className="flex items-center col-span-1 border border-gray-400 bg-white shadow-sm overflow-hidden">
                    <input type="number" value={discountPct || ""} onChange={e => setDiscountPct(Number(e.target.value))} className={`h-6 text-[11px] px-1 w-full text-center outline-none border-none`} />
                    <div className="bg-gray-200 px-1.5 border-l border-gray-400 flex flex-col justify-center text-[8px]">
                      <span className="leading-none rotate-180">▼</span><span className="leading-none">▼</span>
                    </div>
                  </div>
                  <div className="flex flex-col col-span-1">
                    <span className="text-[9px] text-gray-500 mb-0.5 text-center leading-none">Discount amt</span>
                    <input value={discountAmt.toFixed(2)} readOnly className={`${inputClass} w-full text-right bg-gray-200`} />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 items-center gap-2 pt-2">
                  <label className="text-[11px] text-gray-700 font-medium col-span-1">Charge Name</label>
                  <div className="col-span-2 relative">
                    <input 
                      type="text" 
                      list="chargeOptions"
                      value={miscChargeName} 
                      onChange={e => setMiscChargeName(e.target.value)} 
                      className={`${inputClass} w-full`}
                      placeholder="e.g. Packing, Service..."
                    />
                    <datalist id="chargeOptions">
                      <option value="Packing" />
                      <option value="Transport" />
                      <option value="Service" />
                      <option value="Labor" />
                      <option value="Freight" />
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-3 items-center gap-2">
                  <span className="col-span-1"></span>
                  <div className="flex flex-col col-span-1">
                    <span className="text-[9px] text-gray-500 mb-0.5 text-center leading-none">Charge(%)</span>
                    <input type="number" value={miscChargePct || ""} onChange={e => setMiscChargePct(Number(e.target.value))} className={`${inputClass} w-full text-center`} />
                  </div>
                  <div className="flex flex-col col-span-1">
                    <span className="text-[9px] text-gray-500 mb-0.5 text-center leading-none">Charge amt</span>
                    <input type="number" value={calculatedMiscAmt.toFixed(2)} className={`${inputClass} w-full text-right bg-gray-200`} readOnly />
                  </div>
                </div>
              </div>
            </div>

            {/* BILL SUMMARY */}
            <div className="border border-gray-300 rounded-sm overflow-hidden shadow-sm bg-white flex flex-col">
              <div className={headerGradient}>BILL SUMMARY</div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center px-3 py-1.5 border-b border-gray-200">
                    <span className="text-[11px] text-gray-700 font-medium">Sub Total</span>
                    <span className="text-[11px] text-gray-800 font-semibold">{totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-1.5 border-b border-gray-200">
                    <span className="text-[11px] text-gray-700 font-medium">Discount Amount</span>
                    <span className="text-[11px] text-gray-800 font-semibold">{discountAmt.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center px-3 py-1.5 border-b border-gray-200">
                    <span className="text-[11px] text-gray-700 font-medium">Total After Discount</span>
                    <span className="text-[11px] text-gray-800 font-bold">{taxableAmount.toFixed(2)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 px-3 py-1.5 border-b border-gray-200 items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-600 font-medium w-12">CGST(%)</span>
                      <input type="number" value={cgstPct || ""} onChange={e => setCgstPct(Number(e.target.value))} className={`${inputClass} flex-1 text-center`} />
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[10px] text-gray-600 text-right w-16">CGST</span>
                      <input value={cgstAmt.toFixed(2)} readOnly className={`${inputClass} w-16 text-right`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 px-3 py-1.5 border-b border-gray-200 items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-600 font-medium w-12">SGST(%)</span>
                      <input type="number" value={sgstPct || ""} onChange={e => setSgstPct(Number(e.target.value))} className={`${inputClass} flex-1 text-center`} />
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[10px] text-gray-600 text-right w-16">SGST</span>
                      <input value={sgstAmt.toFixed(2)} readOnly className={`${inputClass} w-16 text-right`} />
                    </div>
                  </div>
                </div>

                <div className="bg-[#4ade80] px-4 py-2.5 flex justify-between items-center text-white border-t border-gray-300 mt-auto shadow-inner">
                  <span className="text-[13px] font-bold tracking-wide">GRAND TOTAL</span>
                  <span className="text-[13px] font-bold tracking-wide">{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap justify-center md:justify-start gap-2.5 pt-4">
            <button onClick={() => handleSaveWrapper('completed', false)} className="bg-[#22c55e] hover:bg-[#16a34a] text-white text-[11px] font-bold px-5 py-2 rounded-sm shadow flex items-center gap-1.5 transition-colors min-w-[80px] justify-center">
              <span className="text-sm">💾</span> Save
            </button>
            <button onClick={() => handleSaveWrapper('held')} className="bg-[#3b82f6] hover:bg-[#2563eb] text-white text-[11px] font-bold px-5 py-2 rounded-sm shadow flex items-center gap-1.5 transition-colors min-w-[80px] justify-center">
              <span className="text-sm">✏️</span> Edit
            </button>
            <button onClick={() => handleSaveWrapper('cancelled')} className="bg-[#ef4444] hover:bg-[#dc2626] text-white text-[11px] font-bold px-5 py-2 rounded-sm shadow flex items-center gap-1.5 transition-colors min-w-[80px] justify-center">
              <span className="text-sm">🗑️</span> Delete
            </button>
            <button onClick={() => handleSaveWrapper('completed', true)} className="bg-[#f97316] hover:bg-[#ea580c] text-white text-[11px] font-bold px-5 py-2 rounded-sm shadow flex items-center gap-1.5 transition-colors min-w-[80px] justify-center">
              <span className="text-sm">🖨️</span> Print
            </button>
            <button onClick={() => {
              setCustomerName(""); setAddress(""); setMobNo(""); setGstNo(""); setAadharNo(""); setLrNo("");
              setItems([]); setDiscountPct(0); setMiscCharges(0); setRcvdAmount(0);
            }} className="bg-[#9ca3af] hover:bg-[#6b7280] text-white text-[11px] font-bold px-5 py-2 rounded-sm shadow flex items-center gap-1.5 transition-colors min-w-[80px] justify-center">
              <span className="text-sm">🧹</span> Clear
            </button>
            <button onClick={onBack} className="bg-[#4b5563] hover:bg-[#374151] text-white text-[11px] font-bold px-5 py-2 rounded-sm shadow flex items-center gap-1.5 transition-colors min-w-[80px] justify-center">
              <span className="text-sm">↪️</span> Exit
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
