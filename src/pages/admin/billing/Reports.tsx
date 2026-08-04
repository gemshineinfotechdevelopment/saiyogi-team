import { apiRequest } from "@/lib/api";
import { formatDate, getLocalDate } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileText, PieChart as PieChartIcon, Table as TableIcon, Layers, Package, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  XAxis, YAxis, CartesianGrid, AreaChart, Area 
} from 'recharts';
import { PrintPortal } from "@/components/printing/PrintPortal";
import { ReportPrintTemplate } from "@/components/printing/ReportPrintTemplate";

type ReportType = "dashboard" | "Retail" | "Wholesale" | "Net-Rate";
type ViewMode = "register" | "summary" | "stock";

export default function Reports() {
  const [activeReport, setActiveReport] = useState<ReportType>("dashboard");
  const [viewMode, setViewMode] = useState<ViewMode>("register");
  const [fromDate, setFromDate] = useState(() => {
    const d = getLocalDate();
    return d.substring(0, 7) + "-01";
  });
  const [toDate, setToDate] = useState(getLocalDate());
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (isPrinting) {
      const timer = setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPrinting]);

  useEffect(() => {
    if (activeReport === "dashboard") {
      fetchDashboardData();
    } else {
      fetchData();
    }
  }, [activeReport, fromDate, toDate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const json = await apiRequest('/reports/dashboard');
      setDashboardStats(json);
    } catch (err) {
      toast.error("Failed to fetch dashboard stats");
    } finally {
      setLoading(false);
    }
  };



  

  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint = '/estimates';
      if (activeReport !== "dashboard") {
        endpoint += `?type=${activeReport}`;
      }
      
      const json = await apiRequest(endpoint);
      
      if (!Array.isArray(json)) {
        setData([]);
        return;
      }

      // Filter by date client-side
      const filtered = json.filter((item: any) => {
        return item.date >= fromDate && item.date <= toDate;
      });
      
      setData(filtered);
    } catch (err) {
      toast.error("Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    return data.reduce((acc, curr) => {
      const net = curr.totalAmount || 0;
      const disc = curr.discountAmt || (net * ((curr.discountPct || 0) / 100));
      acc.billAmt += net + disc;
      acc.discAmt += disc;
      acc.netAmt += net;
      acc.recdAmt += curr.rcvdAmount || 0;
      return acc;
    }, { billAmt: 0, discAmt: 0, netAmt: 0, recdAmt: 0 });
  }, [data]);

  const productSummary = useMemo(() => {
    const summary: Record<string, { qty: number, amount: number }> = {};
    data.forEach(bill => {
      bill.items.forEach((item: any) => {
        if (!summary[item.name]) {
          summary[item.name] = { qty: 0, amount: 0 };
        }
        summary[item.name].qty += (item.qty || 0);
        summary[item.name].amount += (item.amount || 0);
      });
    });
    return Object.entries(summary).sort((a, b) => b[1].amount - a[1].amount);
  }, [data]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const renderDashboard = () => {
    if (loading && !dashboardStats) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    const stats = dashboardStats || {
      totalSales: 0,
      totalOrders: 0,
      openBills: 0,
      inventoryItems: 0,
      salesByCategory: [],
      monthlyTrends: []
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Sales", value: `₹${(stats.totalSales || 0).toLocaleString('en-IN')}`, color: "text-primary", icon: TrendingUp },
            { label: "Total Orders", value: stats.totalOrders || 0, color: "text-blue-500", icon: FileText },
            { label: "Open Bills", value: stats.openBills || 0, color: "text-orange-500", icon: Layers },
            { label: "Inventory Items", value: stats.inventoryItems || 0, color: "text-green-500", icon: Package },
          ].map(stat => (
            <div key={stat.label} className="bg-card rounded-xl border border-border shadow-card p-5">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={cn("w-5 h-5", stat.color)} />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Live</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border shadow-card p-6 min-h-[400px] flex flex-col">
             <h3 className="text-sm font-bold text-foreground mb-6 flex items-center gap-2">
               <PieChartIcon className="w-4 h-4 text-primary" />
               Sales Distribution by Category
             </h3>
             <div className="flex-1 w-full min-h-[300px]">
                {stats.salesByCategory && stats.salesByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.salesByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                      >
                        {stats.salesByCategory.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-xs italic">
                    No category data available
                  </div>
                )}
             </div>
             <div className="grid grid-cols-2 gap-2 mt-4">
                {stats.salesByCategory?.slice(0, 4).map((entry: any, index: number) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-[10px] font-medium truncate">{entry.name}</span>
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card p-6 min-h-[400px] flex flex-col">
             <h3 className="text-sm font-bold text-foreground mb-6 flex items-center gap-2">
               <TrendingUp className="w-4 h-4 text-blue-500" />
               Monthly Growth Trends
             </h3>
             <div className="flex-1 w-full min-h-[300px]">
                {stats.monthlyTrends && stats.monthlyTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.monthlyTrends}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorSales)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-xs italic">
                    No trend data available
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSalesRegister = () => (
    <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-5 border-b border-border bg-muted/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-bold text-lg text-foreground tracking-tight">SALES REGISTER - {activeReport.toUpperCase()} ESTIMATE</h3>
          <p className="text-xs text-muted-foreground font-medium">Reporting Period: <span className="text-primary">{fromDate}</span> to <span className="text-primary">{toDate}</span></p>
        </div>
        <div className="flex bg-muted/50 p-1 rounded-lg border border-border">
          <button onClick={() => setViewMode("register")} className={cn("px-4 py-1.5 text-xs font-semibold rounded-md transition-all", viewMode === "register" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>Detailed Register</button>
          <button onClick={() => setViewMode("summary")} className={cn("px-4 py-1.5 text-xs font-semibold rounded-md transition-all", viewMode === "summary" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>Sales Summary</button>
        </div>
      </div>

      {viewMode === "register" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="py-3.5 px-4 text-left font-bold text-muted-foreground uppercase text-[10px] tracking-wider">S.No</th>
                <th className="py-3.5 px-4 text-left font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Bill No</th>
                <th className="py-3.5 px-4 text-left font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Date</th>
                <th className="py-3.5 px-4 text-left font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Customer Name</th>
                <th className="py-3.5 px-4 text-right font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Bill Amt</th>
                <th className="py-3.5 px-4 text-right font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Disc Amt</th>
                <th className="py-3.5 px-4 text-right font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Net Amount</th>
                <th className="py-3.5 px-4 text-right font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Recd Amt</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-20 text-center"><div className="flex flex-col items-center gap-2"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div><span className="text-xs text-muted-foreground">Gathering records...</span></div></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={8} className="py-20 text-center text-muted-foreground">No records found for the selected period.</td></tr>
              ) : (
                <>
                  {data.map((item, idx) => {
                    const net = item.totalAmount || 0;
                    const disc = item.discountAmt || (net * ((item.discountPct || 0) / 100));
                    const bill = net + disc;
                    return (
                      <tr key={item._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 text-muted-foreground font-mono">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-primary">{item.billNo}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{formatDate(item.date)}</td>
                        <td className="py-3 px-4 font-semibold text-foreground">{item.customerName || "Walk-in Customer"}</td>
                        <td className="py-3 px-4 text-right tabular-nums">₹{bill.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-right text-destructive tabular-nums">-₹{disc.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-right font-bold tabular-nums text-foreground">₹{net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-right text-success font-bold tabular-nums">₹{(item.rcvdAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-primary/5 font-black border-t-2 border-primary/20">
                     <td colSpan={4} className="py-4 px-4 text-right text-primary uppercase tracking-widest text-[10px]">Grand Total</td>
                     <td className="py-4 px-4 text-right tabular-nums">₹{totals.billAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                     <td className="py-4 px-4 text-right tabular-nums">₹{totals.discAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                     <td className="py-4 px-4 text-right tabular-nums text-primary text-base">₹{totals.netAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                     <td className="py-4 px-4 text-right tabular-nums text-success text-base">₹{totals.recdAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="py-3.5 px-4 text-left font-bold text-muted-foreground uppercase text-[10px] tracking-wider">S.No</th>
                <th className="py-3.5 px-4 text-left font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Product Name</th>
                <th className="py-3.5 px-4 text-center font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Quantity</th>
                <th className="py-3.5 px-4 text-right font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {productSummary.length === 0 ? (
                <tr><td colSpan={4} className="py-20 text-center text-muted-foreground">No aggregated data available.</td></tr>
              ) : (
                productSummary.map(([name, stats], idx) => (
                  <tr key={name} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-foreground">{name}</td>
                    <td className="py-3 px-4 text-center font-bold text-primary">{stats.qty}</td>
                    <td className="py-3 px-4 text-right font-black text-foreground">₹{stats.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <AppLayout title="Analytics & Reports">
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap bg-muted/50 p-1.5 rounded-2xl border border-border shadow-inner">
            {[
              { id: "dashboard", label: "Dashboard", Icon: PieChartIcon },
              { id: "Retail", label: "Retail Report", Icon: FileText },
              { id: "Wholesale", label: "Wholesale Report", Icon: FileText },
              { id: "Net-Rate", label: "Net-Rate Report", Icon: FileText },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id as ReportType)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                  activeReport === tab.id 
                    ? "bg-card text-primary shadow-elevated scale-105 border border-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <tab.Icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-1.5 shadow-sm">
                <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="h-9 border-0 bg-transparent text-sm w-36 focus-visible:ring-0 font-semibold" />
                <span className="text-muted-foreground text-[10px] font-black uppercase px-2 bg-muted rounded py-1">TO</span>
                <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="h-9 border-0 bg-transparent text-sm w-36 focus-visible:ring-0 font-semibold" />
             </div>
              <Button variant="default" className="h-12 px-6 shadow-lg shadow-primary/20 font-bold" onClick={() => setIsPrinting(true)}>
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
          </div>
        </div>

        <div className="min-h-[600px] mb-12">
          {activeReport === "dashboard" ? renderDashboard() : renderSalesRegister()}
        </div>
      </div>

      {isPrinting && (
        <PrintPortal>
          <ReportPrintTemplate
            title={`${activeReport} Report - ${viewMode === 'register' ? 'Sales Register' : 'Summary'}`}
            fromDate={fromDate}
            toDate={toDate}
            data={data}
            viewMode={viewMode}
            totals={totals}
            productSummary={productSummary}
          />
        </PrintPortal>
      )}
    </AppLayout>
  );
}

