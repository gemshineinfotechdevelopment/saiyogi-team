import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { getLocalDate } from "@/lib/utils";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { 
  Search, Printer, Building2, RefreshCw, Warehouse, Store, History
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";

export default function InventoryManagement() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const invData = await apiRequest("/api/inventory");
      setInventory(invData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return (
    <>
      <AdminNavbar />
      <div className="flex min-h-screen bg-gray-50/50">
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-md text-white">
                <Warehouse className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-blue-600">Inventory Management</h2>
            </div>
          </div>

          <Tabs defaultValue="levels" className="w-full">
            <TabsList className="bg-white border shadow-sm p-1 h-auto mb-4">
              <TabsTrigger value="levels" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 px-6 py-2">
                <Warehouse className="w-4 h-4 mr-2" />
                Stock Levels
              </TabsTrigger>
              <TabsTrigger value="transfer" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 px-6 py-2">
                <RefreshCw className="w-4 h-4 mr-2" />
                Stock Transfer
              </TabsTrigger>
              <TabsTrigger value="adjust" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 px-6 py-2">
                <Store className="w-4 h-4 mr-2" />
                Adjust Inventory
              </TabsTrigger>
              <TabsTrigger value="ledger" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 px-6 py-2">
                <History className="w-4 h-4 mr-2" />
                Transaction Ledger
              </TabsTrigger>
            </TabsList>

            <TabsContent value="levels">
              <StockLevelsTab inventory={inventory} />
            </TabsContent>
            
            <TabsContent value="transfer">
              <StockTransferTab inventory={inventory} fetchInventory={fetchInventory} />
            </TabsContent>

            <TabsContent value="adjust">
              <AdjustInventoryTab inventory={inventory} fetchInventory={fetchInventory} />
            </TabsContent>

            <TabsContent value="ledger">
              <TransactionLedgerTab />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
}

function StockLevelsTab({ inventory }: { inventory: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("shop");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  // Derive unique categories
  const categories = Array.from(new Set(inventory.filter(i => i.category).map(i => i.category?.name || i.category))).filter(Boolean);

  const filtered = inventory.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const catName = item.category?.name || item.category;
    const matchCat = categoryFilter === "All Categories" || catName === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-4 mt-2">
      <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100">
        <div className="flex gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-gray-50/50 border-gray-200"
            />
          </div>
          <select 
            className="border border-gray-200 rounded-md px-4 bg-gray-50/50 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option>All Categories</option>
            {categories.map((c: any) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        
        <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v)} className="bg-gray-50/50 p-1 rounded-md border border-gray-200">
          <ToggleGroupItem value="shop" aria-label="Shop" className="data-[state=on]:bg-white data-[state=on]:shadow-sm">
            <Printer className="w-4 h-4 mr-2 text-blue-600" />
            Shop (Pieces)
          </ToggleGroupItem>
          <ToggleGroupItem value="godown" aria-label="Godown" className="data-[state=on]:bg-white data-[state=on]:shadow-sm">
            <Building2 className="w-4 h-4 mr-2 text-red-600" />
            Godown (Cases)
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium uppercase text-xs tracking-wider">S.No</th>
              <th className="px-6 py-4 font-medium uppercase text-xs tracking-wider">Product</th>
              <th className="px-6 py-4 font-medium uppercase text-xs tracking-wider">Category</th>
              <th className="px-6 py-4 font-medium uppercase text-xs tracking-wider">{viewMode === 'shop' ? 'Shop Stock (Pieces)' : 'Godown Stock (Cases)'}</th>
              <th className="px-6 py-4 font-medium uppercase text-xs tracking-wider">Shop Status</th>
              <th className="px-6 py-4 font-medium uppercase text-xs tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((item: any, idx: number) => (
              <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-gray-500">{idx + 1}</td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900">{item.name}</div>
                  <div className="text-xs text-gray-500 mt-1">1 Case = {item.piecesPerCase || 1} Pieces</div>
                </td>
                <td className="px-6 py-4 text-gray-500">{item.category?.name || item.category || '-'}</td>
                <td className="px-6 py-4 font-bold text-gray-900">
                  {viewMode === 'shop' ? `${item.storeStockPieces || 0} Pieces` : `${item.godownStockCases || 0} Cases`}
                </td>
                <td className="px-6 py-4">
                  {item.isOutOfStock ? (
                    <span className="px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">Critical</span>
                  ) : item.isLowStock ? (
                    <span className="px-2.5 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">Low</span>
                  ) : (
                    <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Healthy</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-sm font-medium text-gray-500 hover:text-blue-600 flex items-center justify-end gap-1.5 ml-auto transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" /> Quick Adjust
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StockTransferTab({ inventory, fetchInventory }: { inventory: any[], fetchInventory: () => void }) {
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [remarks, setRemarks] = useState("");
  const [date, setDate] = useState(getLocalDate());
  const [loading, setLoading] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !quantity) return toast.error("Please fill all required fields");
    
    setLoading(true);
    try {
      await apiRequest("/api/inventory/transfer", {
        method: "POST",
        body: JSON.stringify({ productId: selectedProduct, quantity: parseInt(quantity), remarks })
      });
      toast.success("Stock transferred successfully!");
      setQuantity("");
      setRemarks("");
      setSelectedProduct("");
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message || "Failed to transfer stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">Stock Transfer (Godown Cases → Shop Pieces)</h3>
        <p className="text-sm text-gray-500">Transfer full cases from warehouse which will unpack into shop pieces</p>
      </div>

      <form onSubmit={handleTransfer} className="space-y-5">
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">Select Product</Label>
          <select
            className="flex h-10 w-full rounded-md border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            required
          >
            <option value="">Choose product...</option>
            {inventory.map(item => (
              <option key={item._id} value={item._id}>
                {item.name} (Godown: {item.godownStockCases || 0} Cases)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">Transfer Quantity (Cases)</Label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter Cases to move"
              className="bg-gray-50/50"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">Transfer Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-gray-50/50"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">Notes / Remarks</Label>
          <Input
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Counter refill for weekend sales"
            className="bg-gray-50/50"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 h-10 mt-2">
          {loading ? "Processing..." : "Complete Transfer"}
        </Button>
      </form>
    </div>
  );
}

function AdjustInventoryTab({ inventory, fetchInventory }: { inventory: any[], fetchInventory: () => void }) {
  const [selectedProduct, setSelectedProduct] = useState("");
  const [targetLocation, setTargetLocation] = useState("GODOWN");
  const [adjustmentType, setAdjustmentType] = useState("INCREASE");
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(getLocalDate());
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !quantity) return toast.error("Please fill all required fields");
    
    setLoading(true);
    try {
      await apiRequest("/api/inventory/adjust-custom", {
        method: "POST",
        body: JSON.stringify({ 
          productId: selectedProduct, 
          targetLocation, 
          adjustmentType, 
          quantity: parseInt(quantity), 
          reason 
        })
      });
      toast.success("Inventory adjusted successfully!");
      setQuantity("");
      setReason("");
      setSelectedProduct("");
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message || "Failed to adjust inventory");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 max-w-2xl bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">Inventory Stock Adjustment</h3>
        <p className="text-sm text-gray-500">Record adjustments in target unit: Cases for Godown, Pieces for Shop</p>
      </div>

      <form onSubmit={handleAdjust} className="space-y-5">
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">Select Product</Label>
          <select
            className="flex h-10 w-full rounded-md border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            required
          >
            <option value="">Choose product...</option>
            {inventory.map(item => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">Adjustment Target Location</Label>
            <select
              className="flex h-10 w-full rounded-md border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={targetLocation}
              onChange={(e) => setTargetLocation(e.target.value)}
            >
              <option value="GODOWN">Godown Stock (Cases)</option>
              <option value="SHOP">Shop Stock (Pieces)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">Adjustment Type</Label>
            <select
              className="flex h-10 w-full rounded-md border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value)}
            >
              <option value="INCREASE">Increase Stock (+)</option>
              <option value="DECREASE">Decrease Stock (-)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">
              Quantity ({targetLocation === 'GODOWN' ? 'Cases' : 'Pieces'})
            </Label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`Enter amount in ${targetLocation === 'GODOWN' ? 'Cases' : 'Pieces'}`}
              className="bg-gray-50/50"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-gray-700">Adjustment Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-gray-50/50"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-gray-700">Reason / Detailed remarks</Label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Broken package discarded"
            className="bg-gray-50/50"
            required
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 h-10 mt-2">
          {loading ? "Processing..." : "Record Adjustment"}
        </Button>
      </form>
    </div>
  );
}

function TransactionLedgerTab() {
  const [ledger, setLedger] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("All Transactions");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/inventory/ledger");
      setLedger(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const filtered = ledger.filter((item) => {
    const matchSearch = (item.product?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === "All Transactions" || item.source === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-4 mt-2">
      <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100">
        <div className="flex gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-gray-50/50 border-gray-200"
            />
          </div>
          <select 
            className="border border-gray-200 rounded-md px-4 bg-gray-50/50 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option>All Transactions</option>
            <option value="STOCK_ADJUSTMENT">STOCK_ADJUSTMENT</option>
            <option value="SALE">SALE</option>
            <option value="TRANSFER_TO_SHOP">TRANSFER_TO_SHOP</option>
            <option value="OPENING_STOCK">OPENING_STOCK</option>
          </select>
          <div className="flex items-center gap-2 border border-gray-200 rounded-md px-3 bg-gray-50/50">
            <input type="date" className="bg-transparent text-sm outline-none" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
            <span className="text-gray-400 text-xs uppercase font-medium">to</span>
            <input type="date" className="bg-transparent text-sm outline-none" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="border-gray-200 text-gray-700 bg-white">Export Excel</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">Print / PDF</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-100">
            <tr>
              <th className="px-4 py-4 font-bold uppercase text-[10px] tracking-wider">S.No</th>
              <th className="px-4 py-4 font-bold uppercase text-[10px] tracking-wider">Date</th>
              <th className="px-4 py-4 font-bold uppercase text-[10px] tracking-wider">Product Name</th>
              <th className="px-4 py-4 font-bold uppercase text-[10px] tracking-wider text-center">Type</th>
              <th className="px-4 py-4 font-bold uppercase text-[10px] tracking-wider text-center">Qty Adjusted</th>
              <th className="px-4 py-4 font-bold uppercase text-[10px] tracking-wider text-center">Prev Stock (G Cases / S Pieces)</th>
              <th className="px-4 py-4 font-bold uppercase text-[10px] tracking-wider text-center">Updated Stock (G Cases / S Pieces)</th>
              <th className="px-4 py-4 font-bold uppercase text-[10px] tracking-wider">User</th>
              <th className="px-4 py-4 font-bold uppercase text-[10px] tracking-wider">Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">Loading ledger...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">No transactions found.</td>
              </tr>
            ) : (
              filtered.map((item: any, idx: number) => (
                <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-4 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-4 font-medium text-gray-700">{new Date(item.createdAt).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-4 font-bold text-gray-900">{item.product?.name || "Unknown"}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 rounded-full border border-gray-200">
                      {item.source}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-green-600">
                    {item.qtyAdjustedStr || `${item.type === 'IN' ? '+' : '-'}${item.quantity}`}
                  </td>
                  <td className="px-4 py-4 text-center text-gray-500">
                    {item.prevGodownCases ?? 0} Cases / {item.prevShopPieces ?? 0} Pieces
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-gray-900">
                    {item.updatedGodownCases ?? 0} Cases / {item.updatedShopPieces ?? 0} Pieces
                  </td>
                  <td className="px-4 py-4 text-gray-500">{item.createdBy?.name || "demo..."}</td>
                  <td className="px-4 py-4 text-gray-500 truncate max-w-[150px]" title={item.notes}>{item.notes || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
