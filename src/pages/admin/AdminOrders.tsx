import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { useEffect, useState } from "react";
import { getOrders, approveOrder, updatePackingStatus, updateHoldDays } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { generateOrderReceiptPDF } from "@/lib/pdf-generator";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { Input } from "@/components/ui/input";

/** Returns true when today is BEFORE the hold window expires */
const isOrderOnHold = (order: any): boolean => {
  if (!order.holdDays || order.holdDays <= 0) return false;
  const createdAt = order.createdAt ? new Date(order.createdAt) : null;
  if (!createdAt) return false;
  const holdUntil = new Date(createdAt);
  holdUntil.setDate(holdUntil.getDate() + Number(order.holdDays));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  holdUntil.setHours(0, 0, 0, 0);
  return today < holdUntil;
};

/** Returns true when the hold window has EXPIRED (ready to send) */
const isHoldReady = (order: any): boolean => {
  if (!order.holdDays || order.holdDays <= 0) return false;
  const createdAt = order.createdAt ? new Date(order.createdAt) : null;
  if (!createdAt) return false;
  const holdUntil = new Date(createdAt);
  holdUntil.setDate(holdUntil.getDate() + Number(order.holdDays));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  holdUntil.setHours(0, 0, 0, 0);
  return today >= holdUntil;
};

const AdminOrders = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  const [orderList, setOrderList] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isApproving, setIsApproving] = useState(false);
  const { settings } = useSiteSettings();

  const downloadPDF = (order: any) => {
    const orderData = {
      orderNumber: order.orderNumber || order._id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      deliveryAddress: order.deliveryAddress?.fullAddress || order.shippingAddress?.fullAddress || '',
      state: order.deliveryAddress?.state || '',
      district: order.deliveryAddress?.district || '',
      items: order.items.map((i: any) => ({
        ...i,
        productName: i.product?.name || i.productName || 'Product',
        originalPrice: i.originalPrice !== undefined ? i.originalPrice : (i.product?.price || i.price),
        hasDiscount: i.hasDiscount !== undefined ? i.hasDiscount : (i.product?.hasDiscount !== undefined ? i.product.hasDiscount : true),
        netRate: i.netRate !== undefined ? i.netRate : i.product?.netRate,
        displayNetRate: i.displayNetRate !== undefined ? i.displayNetRate : i.product?.displayNetRate
      })),
      subtotal: order.subtotal,
      packingCharge: order.packingCharge || Math.round(order.subtotal * 0.03),
      total: order.total || (order.subtotal + (order.packingCharge || Math.round(order.subtotal * 0.03))),
      date: new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN'),
      discountPercent: settings.discountPercent,
      siteName: settings.siteName,
      siteAddress: settings.contact?.address || '',
      sitePhone: settings.contact?.phone || '',
      siteEmail: settings.contact?.email || '',
    };
    generateOrderReceiptPDF(orderData);
    toast.success("Downloading PDF...");
  };
  const [phoneFilter, setPhoneFilter] = useState("");
  type StatusFilter = 'all' | 'approved' | 'packing' | 'hold';
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isUpdatingPacking, setIsUpdatingPacking] = useState(false);
  const [isUpdatingHold, setIsUpdatingHold] = useState(false);
  const [holdDaysInput, setHoldDaysInput] = useState<number>(0);

  useEffect(() => {
    if (selectedOrder) {
      setHoldDaysInput(selectedOrder.holdDays || 0);
    }
  }, [selectedOrder]);

  const handleUpdateHoldDays = async () => {
    if (!selectedOrder) return;

    try {
      setIsUpdatingHold(true);
      await updateHoldDays(selectedOrder._id, holdDaysInput);
      
      // Update local state lists
      setOrderList((prev) =>
        prev.map((o) =>
          o._id === selectedOrder._id ? { ...o, holdDays: holdDaysInput } : o
        )
      );
      
      setSelectedOrder((prev: any) => ({ ...prev, holdDays: holdDaysInput }));
      toast.success(`Hold duration updated to ${holdDaysInput} days!`);
    } catch (error) {
      console.error("Error updating hold days:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update hold days");
    } finally {
      setIsUpdatingHold(false);
    }
  };

  const handleRemoveHold = async (orderId: string) => {
    try {
      await updateHoldDays(orderId, 0);
      setOrderList((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, holdDays: 0 } : o
        )
      );
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, holdDays: 0 }));
      }
      toast.success(`Hold removed successfully!`);
    } catch (error) {
      console.error("Error removing hold:", error);
      toast.error(error instanceof Error ? error.message : "Failed to remove hold");
    }
  };

  const fetchOrders = () => {
    getOrders().then((data) => {
      if (Array.isArray(data)) {
        setOrderList(data);
      }
    }).catch(() => setOrderList([]));
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = (id: string, status: any) => {
    setOrderList((prev) => prev.map((o) => o._id === id ? { ...o, status } : o));
    toast.success(`Order updated to ${status}`);
  };

  const handleApproveOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      setIsApproving(true);
      await approveOrder(selectedOrder._id);
      
      // Update local state
      setOrderList((prev) =>
        prev.map((o) =>
          o._id === selectedOrder._id ? { ...o, approved: true } : o
        )
      );
      
      setSelectedOrder((prev: any) => ({ ...prev, approved: true }));
      toast.success("Order approved and customer updated!");
    } catch (error) {
      console.error("Error approving order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to approve order");
    } finally {
      setIsApproving(false);
    }
  };

  const handleTogglePackingStatus = async () => {
    if (!selectedOrder) return;
    
    try {
      setIsUpdatingPacking(true);
      const newStatus = selectedOrder.packingStatus === 'packed' ? 'unpacked' : 'packed';
      const response = await updatePackingStatus(selectedOrder._id, newStatus);
      
      // Update local state
      setOrderList((prev) =>
        prev.map((o) =>
          o._id === selectedOrder._id ? { ...o, packingStatus: newStatus } : o
        )
      );
      
      setSelectedOrder((prev: any) => ({ ...prev, packingStatus: newStatus }));
      toast.success(`Order marked as ${newStatus}!`);
    } catch (error) {
      console.error("Error updating packing status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update packing status");
    } finally {
      setIsUpdatingPacking(false);
    }
  };

  const phoneFiltered = orderList.filter((o) => {
    const q = phoneFilter.trim().toLowerCase();
    if (!q) return true;
    const phone = String(o.customerPhone || o.phone || "").toLowerCase();
    const name = String(o.customerName || o.name || "").toLowerCase();
    const email = String(o.customerEmail || o.email || "").toLowerCase();
    const orderNo = String(o.orderNumber || o._id || "").toLowerCase();
    return phone.includes(q) || name.includes(q) || email.includes(q) || orderNo.includes(q);
  });
  const tabCounts = {
    all: phoneFiltered.length,
    approved: phoneFiltered.filter((o) => o.approved).length,
    packing: phoneFiltered.filter((o) => o.packingStatus === 'packed').length,
    // Count any order where admin set hold days (> 0)
    hold: phoneFiltered.filter((o) => o.holdDays && Number(o.holdDays) > 0).length,
  };

  const filteredOrders = phoneFiltered
    .filter((o) => {
      if (statusFilter === 'approved') return o.approved;
      if (statusFilter === 'packing') return o.packingStatus === 'packed';
      // Show any order where admin set hold days (> 0), active or expired
      if (statusFilter === 'hold') return o.holdDays && Number(o.holdDays) > 0;
      return true;
    })
    .sort((a, b) => {
      // Ready (expired) hold orders float to the absolute top
      const aReady = isHoldReady(a) ? 1 : 0;
      const bReady = isHoldReady(b) ? 1 : 0;
      if (bReady !== aReady) return bReady - aReady;

      // Active hold orders float to the top
      const aOnHold = isOrderOnHold(a) ? 1 : 0;
      const bOnHold = isOrderOnHold(b) ? 1 : 0;
      if (bOnHold !== aOnHold) return bOnHold - aOnHold;
      // Within the same group, newest first
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedData = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  

  return (
    <>
      <AdminNavbar />
      <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold">Orders</h1>
          <Link to="/" className="text-sm text-primary hover:underline lg:hidden">← Store</Link>
        </div>

        {/* Filter tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          {([
            { key: 'all',      label: 'All Orders',  icon: '📋', activeClass: 'bg-primary text-primary-foreground border-primary' },
            { key: 'approved', label: 'Approved',     icon: '✅', activeClass: 'bg-green-600 text-white border-green-600' },
            { key: 'packing',  label: 'Packed',       icon: '📦', activeClass: 'bg-blue-600 text-white border-blue-600' },
            { key: 'hold',     label: 'On Hold',      icon: '🔒', activeClass: 'bg-amber-500 text-white border-amber-500' },
          ] as { key: StatusFilter; label: string; icon: string; activeClass: string }[]).map(({ key, label, icon, activeClass }) => (
            <button
              key={key}
              onClick={() => { setStatusFilter(key); setCurrentPage(1); }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                statusFilter === key
                  ? activeClass
                  : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/40'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
              <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                statusFilter === key ? 'bg-white/20' : 'bg-secondary'
              }`}>
                {tabCounts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* Phone search + count */}
        <div className="mb-6 flex gap-3 flex-wrap items-center">
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
          <span className="px-3 py-2 text-sm text-muted-foreground">Showing {filteredOrders.length} orders</span>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left p-3">Order ID</th>
                  <th className="text-left p-3">Customer</th>
                  <th className="text-left p-3">Phone</th>
                  <th className="text-right p-3 hidden sm:table-cell">Items</th>
                  <th className="text-right p-3">Total</th>
                  <th className="text-center p-3">Packing</th>
                  <th className="text-center p-3">Approved</th>
                  <th className="text-center p-3">Hold Status</th>
                  <th className="text-right p-3 hidden md:table-cell">Date</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((o) => {
                  const onHold = isOrderOnHold(o);
                  const isReady = isHoldReady(o);
                  return (
                  <tr
                    key={o._id}
                    className={`border-b transition-colors ${
                      isReady
                        ? "bg-red-500/10 border-l-4 border-l-red-500 hover:bg-red-500/20"
                        : onHold
                        ? "bg-amber-500/10 border-l-4 border-l-amber-500 hover:bg-amber-500/20"
                        : "border-border hover:bg-secondary/30"
                    }`}
                  >
                    <td className="p-3 font-semibold">{o.orderNumber || o._id?.slice(-8)}</td>
                    <td className="p-3">
                      <p>{o.customerName}</p>
                      <p className="text-xs text-muted-foreground">{o.customerEmail}</p>
                    </td>
                    <td className="p-3 text-sm">{o.customerPhone}</td>
                    <td className="p-3 text-right hidden sm:table-cell">{o.items?.length || 0}</td>
                    <td className="p-3 text-right font-bold text-primary">₹{Number(o.subtotal) + (Number(o.packingCharge) || 0)}</td>
                    <td className="p-3 text-center">
                      <Badge variant={o.packingStatus === 'packed' ? 'default' : 'secondary'} className={o.packingStatus === 'packed' ? 'bg-blue-600' : ''}>
                        {o.packingStatus ? (o.packingStatus === 'packed' ? '📦 Packed' : '🔹 Unpacked') : 'N/A'}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      {o.approved ? (
                        <Badge variant="default" className="bg-green-600">✓ Approved</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {o.holdDays && o.holdDays > 0 ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <Badge
                            variant="outline"
                            className={`${
                              isHoldReady(o)
                                ? "border-red-500 text-red-600 bg-red-500/20 font-bold animate-pulse"
                                : isOrderOnHold(o)
                                ? "border-amber-500 text-amber-600 bg-amber-500/20 font-bold"
                                : "border-gray-400 text-gray-400 bg-gray-400/10"
                            }`}
                          >
                            {isHoldReady(o) ? "🔥" : isOrderOnHold(o) ? "🔒" : "⏳"} {o.holdDays}d Hold
                          </Badge>
                          {(() => {
                            const until = new Date(o.createdAt);
                            until.setDate(until.getDate() + Number(o.holdDays));
                            return (
                              <span className={`text-[10px] font-medium ${isHoldReady(o) ? 'text-red-600' : 'text-amber-600'}`}>
                                {isHoldReady(o) ? 'Ready to send!' : `Until ${until.toLocaleDateString('en-IN')}`}
                              </span>
                            );
                          })()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">No Hold</span>
                      )}
                    </td>
                    <td className="p-3 text-right text-muted-foreground hidden md:table-cell text-xs">
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex flex-col gap-1 items-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedOrder(o)}
                          className="text-xs w-full max-w-[100px]"
                        >
                          View Details
                        </Button>
                        {isHoldReady(o) && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleRemoveHold(o._id)}
                            className="text-xs w-full max-w-[100px] h-7 bg-red-600 hover:bg-red-700"
                          >
                            Remove Hold
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-card border-t border-border mt-4 rounded-b-lg">
              <div className="text-sm text-muted-foreground">
                Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredOrders.length)} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length} entries
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                <div className="text-sm font-medium">Page {currentPage} of {Math.max(1, totalPages)}</div>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}>Next</Button>
              </div>
            </div>
          )}
        </div>

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>Order ID: {selectedOrder?.orderNumber || selectedOrder?._id?.slice(-8)}</DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm mb-2">Customer Information</h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                      <p><strong>Email:</strong> {selectedOrder.customerEmail}</p>
                      <p><strong>Phone:</strong> {selectedOrder.customerPhone}</p>
                      {selectedOrder.alternatePhoneNumber && (
                        <p><strong>Alternate Phone:</strong> {selectedOrder.alternatePhoneNumber}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm mb-2">Order Summary</h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>Subtotal:</strong> ₹{selectedOrder.subtotal}</p>
                      <p><strong>Packing Charges (3%):</strong> ₹{selectedOrder.packingCharge || Math.round(Number(selectedOrder.subtotal) * 0.03)}</p>
                      <p className="text-green-600 text-xs italic"><strong>Delivery Charges:</strong> Excluded</p>
                      <p className="font-bold"><strong>Total:</strong> ₹{Number(selectedOrder.subtotal) + (Number(selectedOrder.packingCharge) || Math.round(Number(selectedOrder.subtotal) * 0.03))}</p>
                      <p><strong>Status:</strong> {selectedOrder.status}</p>
                      <p><strong>Packing Status:</strong> {selectedOrder.packingStatus ? (selectedOrder.packingStatus === 'packed' ? '📦 Packed' : '🔹 Unpacked') : 'Not set'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-2">Delivery Address</h3>
                  <p className="text-sm text-white bg-secondary p-2 rounded">
                    {selectedOrder.deliveryAddress?.fullAddress || selectedOrder.shippingAddress?.fullAddress || "No address provided"}
                    {selectedOrder.deliveryAddress?.district && <span className="block mt-1"><strong>District:</strong> {selectedOrder.deliveryAddress.district}</span>}
                    {selectedOrder.deliveryAddress?.state && <span className="block mt-1"><strong>State:</strong> {selectedOrder.deliveryAddress.state}</span>}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-2">Items</h3>
                  <ul className="text-sm text-white space-y-1 bg-secondary p-2 rounded">
                    {selectedOrder.items?.map((item: any, idx: number) => (
                      <li key={idx}>
                        {item.product?.name || item.productName || 'Product'} - Qty: {item.quantity} × ₹{item.price}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-2">Customer Hold Settings</h3>
                  <div className="flex items-center gap-3 bg-secondary p-3 rounded">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Hold Duration (Days):</p>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="365"
                          value={holdDaysInput}
                          onChange={(e) => setHoldDaysInput(Math.max(0, parseInt(e.target.value, 10) || 0))}
                          className="w-24 h-9 bg-card text-foreground"
                        />
                        <span className="text-sm">days</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleUpdateHoldDays}
                      disabled={isUpdatingHold}
                      className="bg-primary text-primary-foreground hover:bg-primary/95"
                    >
                      {isUpdatingHold ? "Updating..." : "Save Hold"}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => downloadPDF(selectedOrder)}
                    className="flex-1"
                  >
                    Download PDF
                  </Button>
                  {!selectedOrder.approved && (
                    <Button
                      onClick={handleApproveOrder}
                      disabled={isApproving}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isApproving ? "Approving..." : "Approve & Update Customer"}
                    </Button>
                  )}
                  {selectedOrder.approved && (
                    <Button variant="default" disabled className="flex-1">
                      ✓ Already Approved
                    </Button>
                  )}
                  {selectedOrder.approved && (
                    <Button
                      onClick={handleTogglePackingStatus}
                      disabled={isUpdatingPacking}
                      className={`flex-1 ${selectedOrder.packingStatus === 'packed' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'} text-white`}
                    >
                      {isUpdatingPacking ? "Updating..." : selectedOrder.packingStatus === 'packed' ? '📦 Mark Unpacked' : '🔹 Mark Packed'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        </main>
      </div>
    </>
  );
}

export default AdminOrders;