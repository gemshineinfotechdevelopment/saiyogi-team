import { useState, useMemo, useEffect } from "react";
import { Users, FileText, ArrowUpDown } from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { getOrders } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  name: string;
  email: string;
  phone?: string;
  alternatePhone?: string;
  deliveryAddress?: string;
  state?: string;
  district?: string;
  lastOrderDate?: string;
  totalOrders: number;
  totalSpent: number;
  purchases: any[];
}

const buildCustomers = (ordersData: any[]): Customer[] => {
  const map = new Map<string, Customer>();
  ordersData.forEach((o) => {
    // Use phone as primary key, fallback to email if phone is missing
    const key = o.customerPhone || o.customerEmail;
    const existing = map.get(key);
    const orderAmt = Number(o.subtotal) + (Number(o.packingCharge) || 0);
    if (existing) {
      existing.totalOrders += 1;
      existing.totalSpent += orderAmt;
      existing.purchases.push(o);
      // Update last order date
      if (o.createdAt) {
        existing.lastOrderDate = o.createdAt;
      }
      // Update customer details from approved orders
      existing.phone = existing.phone || o.customerPhone;
      existing.alternatePhone = existing.alternatePhone || o.alternatePhoneNumber;
      existing.deliveryAddress = existing.deliveryAddress || o.deliveryAddress?.fullAddress;
      existing.state = existing.state || o.deliveryAddress?.state;
      existing.district = existing.district || o.deliveryAddress?.district;
    } else {
      const customer: Customer = {
        name: o.customerName,
        email: o.customerEmail,
        phone: o.customerPhone,
        alternatePhone: o.alternatePhoneNumber,
        deliveryAddress: o.deliveryAddress?.fullAddress,
        state: o.deliveryAddress?.state,
        district: o.deliveryAddress?.district,
        lastOrderDate: o.createdAt,
        totalOrders: 1,
        totalSpent: orderAmt,
        purchases: [o]
      };
      map.set(key, customer || {} as Customer);
    }
  });
  return Array.from(map.values());
};

const generateInvoiceHTML = (order: any) => {
  return `
    <html><head><title>Invoice ${order.orderNumber || order._id}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;color:#333}
    h1{color:#FFD700;margin-bottom:4px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px}th{background:#f5f5f5}
    .total{font-size:18px;font-weight:bold;margin-top:20px}.header{display:flex;justify-content:space-between}
    </style></head><body>
    <h1>🎆 Narendiraa Enterprises</h1><p>Tax Invoice</p>
    <hr/>
    <div class="header"><div><strong>Invoice:</strong> ${order.orderNumber || order._id?.slice(-8)}<br/><strong>Date:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}</div>
    <div><strong>Customer:</strong> ${order.customerName}<br/><strong>Email:</strong> ${order.customerEmail}</div></div>
    <table><tr><th>Items</th><th>Status</th><th>Total</th></tr>
    <tr><td>${order.items?.length || 0} item(s)</td><td>${order.status}</td><td>₹${(Number(order.subtotal) + (Number(order.packingCharge) || 0)).toLocaleString()}</td></tr></table>
    <p class="total">Grand Total: ₹${(Number(order.subtotal) + (Number(order.packingCharge) || 0)).toLocaleString()}</p>
    <p style="margin-top:40px;font-size:12px;color:#999">This is a computer-generated invoice.</p>
    </body></html>`;
};

const downloadInvoicePDF = (order: any) => {
  const html = generateInvoiceHTML(order);
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  }
};

const AdminCustomers = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => { getOrders().then(setOrders).catch(() => setOrders([])); }, []);
  const customers = useMemo(() => buildCustomers(orders), [orders]);
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [phoneFilter, setPhoneFilter] = useState("");

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) =>
        c.phone?.toLowerCase().includes(phoneFilter.toLowerCase())
      )
      .sort((a, b) => {
        const dateA = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
        const dateB = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
        return dateB - dateA; // Newest first (descending order)
      });
  }, [customers, phoneFilter]);

  const sortedPurchases = useMemo(() => {
    if (!selectedCustomer) return [];
    return [...selectedCustomer.purchases].sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.date || 0).getTime();
      const db = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.date || 0).getTime();
      return sortAsc ? da - db : db - da;
    });
  }, [selectedCustomer, sortAsc]);
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const paginatedData = filteredCustomers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  

  return (
    <>
      <AdminNavbar />
      <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Customers
          </h1>
          <p className="text-sm text-muted-foreground">{filteredCustomers.length} of {customers.length} customers</p>
        </div>

        <div className="mb-6 flex gap-3">
          <input
            type="text"
            placeholder="Filter by phone number..."
            value={phoneFilter}
            onChange={(e) => { setPhoneFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary flex-1 max-w-xs"
          />
          {phoneFilter && (
            <button
              onClick={() => setPhoneFilter("")}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead className="hidden md:table-cell">Last Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((c) => (
                <TableRow key={c.phone || c.email}>
                  <TableCell className="font-semibold">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.phone || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {c.district && c.state ? `${c.district}, ${c.state}` : (c.state || c.district || "—")}
                  </TableCell>
                  <TableCell>{c.totalOrders}</TableCell>
                  <TableCell className="font-bold text-primary">₹{c.totalSpent.toLocaleString()}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => { setSelectedCustomer(c); setSortAsc(false); }}>
                      View History
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredCustomers.length)} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredCustomers.length)} of {filteredCustomers.length} entries
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                <div className="text-sm font-medium">Page {currentPage} of {Math.max(1, totalPages)}</div>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>Next</Button>
              </div>
            </div>
          )}
        </div>

        {/* Customer Details & Purchase History Dialog */}
        <Dialog open={!!selectedCustomer} onOpenChange={(o) => !o && setSelectedCustomer(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedCustomer?.name} — Customer Profile</DialogTitle>
              <DialogDescription>{selectedCustomer?.email}</DialogDescription>
            </DialogHeader>
            
            {selectedCustomer && (
              <div className="space-y-6">
                {/* Customer Details */}
                <div className="bg-secondary text-white p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-white/70">Email</p>
                      <p className="font-medium">{selectedCustomer.email}</p>
                    </div>
                    <div>
                      <p className="text-white/70">Phone</p>
                      <p className="font-medium">{selectedCustomer.phone || "Not provided"}</p>
                    </div>
                    {selectedCustomer.alternatePhone && (
                      <div>
                        <p className="text-white/70">Alternate Phone</p>
                        <p className="font-medium">{selectedCustomer.alternatePhone}</p>
                      </div>
                    )}
                  </div>
                  {selectedCustomer.deliveryAddress && (
                    <div className="mt-4">
                      <p className="text-white/70 text-sm">Delivery Address</p>
                      <p className="font-medium text-sm text-foreground bg-background p-2 rounded mt-1">{selectedCustomer.deliveryAddress}</p>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-primary/10 p-3 rounded">
                    <p className="text-muted-foreground">Total Orders</p>
                    <p className="font-bold text-lg">{selectedCustomer.totalOrders}</p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded">
                    <p className="text-muted-foreground">Total Spent</p>
                    <p className="font-bold text-lg">₹{selectedCustomer.totalSpent.toLocaleString()}</p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded col-span-2 md:col-span-1">
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-bold text-base truncate" title={selectedCustomer.district && selectedCustomer.state ? `${selectedCustomer.district}, ${selectedCustomer.state}` : (selectedCustomer.state || selectedCustomer.district || "—")}>
                      {selectedCustomer.district && selectedCustomer.state ? `${selectedCustomer.district}, ${selectedCustomer.state}` : (selectedCustomer.state || selectedCustomer.district || "—")}
                    </p>
                  </div>
                </div>

                {/* Purchase History */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">Purchase History</h3>
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => setSortAsc(!sortAsc)}>
                      <ArrowUpDown className="h-3 w-3" /> Sort ({sortAsc ? "Oldest" : "Newest"})
                    </Button>
                  </div>
                  <div className="max-h-60 overflow-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Approved</TableHead>
                          <TableHead>Invoice</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedPurchases.map((o) => (
                          <TableRow key={o._id}>
                            <TableCell className="font-semibold">{o.orderNumber || o._id?.slice(-8)}</TableCell>
                            <TableCell className="text-xs">{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "N/A"}</TableCell>
                            <TableCell>{o.items?.length || 0}</TableCell>
                            <TableCell className="font-bold">₹{(Number(o.subtotal) + (Number(o.packingCharge) || 0)).toLocaleString()}</TableCell>
                            <TableCell>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                o.status === "delivered" ? "bg-green-500/20 text-green-500" :
                                o.status === "shipped" ? "bg-blue-500/20 text-blue-500" :
                                o.status === "processing" ? "bg-primary/20 text-primary" :
                                o.status === "cancelled" ? "bg-destructive/20 text-destructive" :
                                "bg-muted text-muted-foreground"
                              }`}>{o.status}</span>
                            </TableCell>
                            <TableCell>
                              {o.approved ? (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-500">✓ Yes</span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">No</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => { downloadInvoicePDF(o); toast({ title: "Invoice opened" }); }}>
                                <FileText className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <Button onClick={() => setSelectedCustomer(null)} className="w-full">Close</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
        </main>
      </div>
    </>
  );
}

export default AdminCustomers;
