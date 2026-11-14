import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileSpreadsheet, Download, Calendar, ArrowDownUp, Filter } from "lucide-react";
import { toast } from "sonner";

export interface ExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  totalCount: number;
  onExport: (options: { dateSortOrder: 'desc' | 'asc'; startDate?: string; endDate?: string }) => number | void;
  // Optional items list to preview count based on selected date filters
  items?: any[];
  getDate?: (item: any) => string | Date | undefined;
}

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  isOpen,
  onClose,
  title,
  description = "Download your records in Microsoft Excel (.xlsx) format with customized date sorting and date range.",
  totalCount,
  onExport,
  items,
  getDate = (item) => item.createdAt || item.date || item.updatedAt
}) => {
  const [dateSortOrder, setDateSortOrder] = useState<'desc' | 'asc'>('desc');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | '7days' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  // Handle Preset Changes
  const handlePresetChange = (preset: 'all' | 'today' | '7days' | 'month' | 'custom') => {
    setDatePreset(preset);
    const today = new Date();
    const toDateStr = today.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'today') {
      setStartDate(toDateStr);
      setEndDate(toDateStr);
    } else if (preset === '7days') {
      const past7 = new Date();
      past7.setDate(today.getDate() - 7);
      setStartDate(past7.toISOString().split('T')[0]);
      setEndDate(toDateStr);
    } else if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(toDateStr);
    }
  };

  // Calculate live matching count
  const matchingCount = useMemo(() => {
    if (!items || items.length === 0) return totalCount;
    if (!startDate && !endDate) return items.length;

    return items.filter(item => {
      const rawDate = getDate(item);
      if (!rawDate) return true;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return true;

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (d < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
      return true;
    }).length;
  }, [items, totalCount, startDate, endDate, getDate]);

  const handleDownload = () => {
    try {
      setIsExporting(true);
      const count = onExport({
        dateSortOrder,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
      const exportedCount = typeof count === 'number' ? count : matchingCount;
      toast.success(`Successfully exported ${exportedCount} records to Excel! 🎉`);
      onClose();
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error(err.message || "Failed to export Excel file");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg p-6 bg-white rounded-3xl font-sans space-y-5">
        <DialogHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
              <FileSpreadsheet className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-black text-gray-900">
                {title}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 font-medium mt-0.5">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 text-xs">
          {/* SECTION 1: DATE SORTING OPTION */}
          <div className="space-y-2">
            <label className="font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowDownUp className="w-3.5 h-3.5 text-emerald-700" />
              <span>1. Date Sorting Order *</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setDateSortOrder('desc')}
                className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  dateSortOrder === 'desc'
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-bold shadow-2xs'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 font-medium'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black">⬇️ Newest First</span>
                  {dateSortOrder === 'desc' && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                </div>
                <span className="text-[11px] text-gray-500 font-normal">Latest dates at the top (Default)</span>
              </button>

              <button
                type="button"
                onClick={() => setDateSortOrder('asc')}
                className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  dateSortOrder === 'asc'
                    ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-bold shadow-2xs'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 font-medium'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black">⬆️ Oldest First</span>
                  {dateSortOrder === 'asc' && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                </div>
                <span className="text-[11px] text-gray-500 font-normal">Chronological / earliest first</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: DATE RANGE FILTER */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>2. Date Range Filter</span>
              </label>
              <span className="text-[11px] text-gray-400 font-semibold">(Optional)</span>
            </div>

            {/* Quick Date Presets */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'all', label: 'All Dates' },
                { key: 'today', label: 'Today' },
                { key: '7days', label: 'Last 7 Days' },
                { key: 'month', label: 'This Month' },
                { key: 'custom', label: 'Custom Range' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handlePresetChange(key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    datePreset === key
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Date Inputs */}
            {(datePreset === 'custom' || startDate || endDate) && (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="space-y-1">
                  <span className="text-[11px] text-gray-500 font-bold block">From Date:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setDatePreset('custom');
                    }}
                    className="w-full text-xs p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-gray-500 font-bold block">To Date:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setDatePreset('custom');
                    }}
                    className="w-full text-xs p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none font-medium"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Record Count Preview Box */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-700" />
              <span className="text-gray-700 font-semibold">Records to Export:</span>
            </div>
            <div className="text-right">
              <span className="text-emerald-950 font-black text-sm">{matchingCount}</span>
              <span className="text-gray-500 font-medium text-[11px]"> of {totalCount} records</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 text-xs transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isExporting || matchingCount === 0}
            onClick={handleDownload}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>{isExporting ? 'Generating Excel...' : 'Download Excel (.xlsx)'}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExcelExportModal;

