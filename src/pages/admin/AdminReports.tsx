import { useEffect, useState, useMemo } from "react";
import { getOrders } from "@/lib/api";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, TrendingUp, IndianRupee } from "lucide-react";

const AdminReports = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
    setIsLoading(true);
    getOrders()
      .then((data) => {
        if (Array.isArray(data)) {
          setOrders(data);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  const productStats = useMemo(() => {
    const stats: Record<string, { name: string; quantity: number; revenue: number }> = {};

    orders.forEach((order) => {
      // Only count valid or completed orders if necessary, but we'll include all for now 
      // since the prompt says "whole project ku sethu" (for the whole project)
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const name = item.product?.name || item.productName || "Unknown Product";
          const quantity = item.quantity || 1;
          
          // Calculate price using netRate if available, fallback to price or originalPrice
          const price = item.netRate !== undefined ? item.netRate : 
                        (item.price !== undefined ? item.price : 
                        (item.product?.netRate !== undefined ? item.product.netRate :
                        (item.product?.price !== undefined ? item.product.price : 0)));
          
          const revenue = quantity * price;

          if (!stats[name]) {
            stats[name] = { name, quantity: 0, revenue: 0 };
          }
          stats[name].quantity += quantity;
          stats[name].revenue += revenue;
        });
      }
    });

    return Object.values(stats).sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  const totalRevenue = productStats.reduce((sum, p) => sum + p.revenue, 0);
  const totalProductsSold = productStats.reduce((sum, p) => sum + p.quantity, 0);

  // Top 5 products for chart
  const chartData = productStats.slice(0, 5);

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <AdminNavbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">Sales Reports</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Overview of product sales and performance across all orders
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
                  <IndianRupee className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{Math.round(totalRevenue).toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Units Sold</CardTitle>
                  <Package className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalProductsSold.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Orders</CardTitle>
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orders.length.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>

            {chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={false} />
                        <YAxis width={80} tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${Math.round(value)}`} />
                        <Tooltip
                          cursor={{ fill: '#f3f4f6' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: number) => [`₹${Math.round(value).toLocaleString()}`, 'Revenue']}
                        />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Product Sales Details</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading reports data...</div>
                ) : productStats.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No sales data available.</div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product Name</TableHead>
                          <TableHead className="text-right">Units Sold</TableHead>
                          <TableHead className="text-right">Total Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productStats.map((product, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="text-right">{product.quantity.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-medium">
                              ₹{Math.round(product.revenue).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminReports;
