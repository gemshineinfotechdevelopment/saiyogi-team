import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { History, Search, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function TransferHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/api/inventory/ledger?type=${typeFilter}&source=${sourceFilter}`);
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [typeFilter, sourceFilter]);

  const filteredHistory = history.filter(item => 
    (item.product?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.referenceNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.notes || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <AdminNavbar />
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight text-sidebar-primary flex items-center gap-2">
            <History className="w-6 h-6" /> Inventory Movement Ledger
          </h2>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <CardTitle className="text-sm font-medium">All Movements</CardTitle>
              <div className="flex gap-2">
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border border-input rounded-md px-3 h-9 text-sm">
                  <option value="">All Types (IN/OUT)</option>
                  <option value="IN">IN (Addition)</option>
                  <option value="OUT">OUT (Deduction)</option>
                </select>
                <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="border border-input rounded-md px-3 h-9 text-sm">
                  <option value="">All Sources</option>
                  <option value="WEBSITE_ORDER">Website Order</option>
                  <option value="RETAIL_BILL">Retail Bill</option>
                  <option value="TRANSFER_TO_SHOP">Transfer to Shop</option>
                  <option value="STOCK_ADJUSTMENT">Stock Adjustment</option>
                  <option value="CANCELLED_BILL">Cancelled Bill</option>
                  <option value="CANCELLED_ORDER">Cancelled Order</option>
                </select>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search product, ref no, notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-10">Loading history...</div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground font-medium">
                    <tr>
                      <th className="px-4 py-3 border-b">Date & Time</th>
                      <th className="px-4 py-3 border-b">Product Name</th>
                      <th className="px-4 py-3 border-b">Type</th>
                      <th className="px-4 py-3 border-b">Source</th>
                      <th className="px-4 py-3 border-b text-right">Quantity</th>
                      <th className="px-4 py-3 border-b text-right">Balance</th>
                      <th className="px-4 py-3 border-b">Ref No</th>
                      <th className="px-4 py-3 border-b">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((item) => (
                      <tr key={item._id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-medium text-sidebar-primary">
                          {item.product?.name || "Unknown Product"}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          <span className={`px-2 py-1 rounded text-xs ${item.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {item.source}
                        </td>
                        <td className={`px-4 py-3 text-right font-bold ${item.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                          {item.type === 'IN' ? '+' : '-'}{item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right font-bold">
                          {item.currentStock}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {item.referenceNumber || "-"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground italic">
                          {item.notes || "-"}
                        </td>
                      </tr>
                    ))}
                    {filteredHistory.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-muted-foreground">
                          No transfer history found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </main>
      </div>
    </>
  );
}
