import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileArchive, CheckCircle2, AlertTriangle, X, RefreshCw, FileSpreadsheet, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { uploadBulkImportZip, getBulkImportStatus, downloadBulkImportTemplate } from "@/lib/api";

interface BulkImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  open,
  onOpenChange,
  onImportComplete
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<"idle" | "queued" | "processing" | "completed" | "failed">("idle");
  const [progress, setProgress] = useState({
    totalCount: 0,
    processedCount: 0,
    successCount: 0,
    failedCount: 0,
    percentage: 0,
    errors: [] as Array<{ row: number; productName: string; image: string; error: string }>,
    summary: null as any
  });

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset modal state when closed
  useEffect(() => {
    if (!open) {
      stopPolling();
      setFile(null);
      setIsUploading(false);
      setJobId(null);
      setJobStatus("idle");
      setProgress({
        totalCount: 0,
        processedCount: 0,
        successCount: 0,
        failedCount: 0,
        percentage: 0,
        errors: [],
        summary: null
      });
    }
  }, [open]);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  // Poll job status every 1 second
  useEffect(() => {
    if (!jobId || (jobStatus !== "queued" && jobStatus !== "processing")) {
      return;
    }

    stopPolling();

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await getBulkImportStatus(jobId);
        if (res.success) {
          setJobStatus(res.status);
          setProgress({
            totalCount: res.totalCount || 0,
            processedCount: res.processedCount || 0,
            successCount: res.successCount || 0,
            failedCount: res.failedCount || 0,
            percentage: res.percentage || 0,
            errors: res.errors || [],
            summary: res.summary
          });

          if (res.status === "completed" || res.status === "failed") {
            stopPolling();
            setIsUploading(false);
            if (res.status === "completed") {
              toast.success(`Import finished! ${res.successCount} products imported.`);
              if (onImportComplete) onImportComplete();
            } else {
              toast.error(res.summary?.error || "Bulk import failed");
            }
          }
        }
      } catch (err) {
        console.error("Error polling bulk import status:", err);
      }
    }, 1000);

    return () => stopPolling();
  }, [jobId, jobStatus]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.toLowerCase().endsWith(".zip")) {
        toast.error("Please select a .zip archive file");
        return;
      }
      setFile(selected);
    }
  };

  const handleStartImport = async () => {
    if (!file) {
      toast.error("Please choose a ZIP file to import");
      return;
    }

    try {
      setIsUploading(true);
      setJobStatus("queued");
      toast.info("Uploading ZIP file...");

      const res = await uploadBulkImportZip(file);
      if (res.success && res.jobId) {
        setJobId(res.jobId);
        setJobStatus("processing");
        toast.success("File uploaded. Background processing started!");
      } else {
        throw new Error(res.message || "Failed to start bulk import");
      }
    } catch (err: any) {
      setIsUploading(false);
      setJobStatus("idle");
      toast.error(err.message || "Bulk import upload failed");
    }
  };

  const handleDownloadErrorReport = () => {
    if (progress.errors.length === 0) {
      toast.info("No errors to download!");
      return;
    }

    const headers = ["Row", "Product Name", "Image Filename", "Error Reason"];
    const csvRows = [headers.join(",")];

    progress.errors.forEach(e => {
      const rowNum = e.row;
      const pName = `"${String(e.productName || "").replace(/"/g, '""')}"`;
      const img = `"${String(e.image || "").replace(/"/g, '""')}"`;
      const errReason = `"${String(e.error || "").replace(/"/g, '""')}"`;
      csvRows.push([rowNum, pName, img, errReason].join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `bulk-import-error-report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full bg-white rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <DialogTitle className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
              <FileArchive className="w-6 h-6 text-[#A80000]" />
              <span>Bulk Product Import</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-gray-500 mt-1">
              Import 250+ products at once using a ZIP file containing Excel data and images.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Action 1: Template Download Banner */}
          <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-amber-700 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-amber-900">Need the Excel Template?</h4>
                <p className="text-xs text-amber-700">Download sample Excel file formatted for product import.</p>
              </div>
            </div>
            <Button
              type="button"
              onClick={downloadBulkImportTemplate}
              variant="outline"
              className="bg-white hover:bg-amber-100 border-amber-300 text-amber-900 font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-4 h-4" />
              Download Template
            </Button>
          </div>

          {/* Action 2: Expected ZIP Structure Guide */}
          <div className="p-3.5 bg-gray-50 border border-gray-200/80 rounded-xl text-xs text-gray-600 font-mono">
            <p className="font-sans font-bold text-gray-800 mb-1">Expected ZIP Structure:</p>
            <p>products-import.zip</p>
            <p className="pl-4">├── products.xlsx</p>
            <p className="pl-4">└── images/</p>
            <p className="pl-8">├── product001.jpg</p>
            <p className="pl-8">└── product002.jpg</p>
          </div>

          {/* Action 3: File Input / Dropzone */}
          {jobStatus === "idle" && (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-700">Select ZIP Archive File (.zip)</label>
              <div className="relative border-2 border-dashed border-gray-300 hover:border-[#A80000] rounded-2xl p-6 text-center transition-colors bg-gray-50/50 cursor-pointer">
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <Upload className="w-10 h-10 text-gray-400" />
                  {file ? (
                    <div>
                      <p className="text-sm font-bold text-[#A80000]">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-gray-700">Click or drag `.zip` file here</p>
                      <p className="text-xs text-gray-400">Supports up to 100MB ZIP archives</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleStartImport}
                  disabled={!file || isUploading}
                  className="bg-gradient-to-b from-[#C80000] to-[#880000] hover:brightness-110 text-white font-black text-sm rounded-xl px-6 border-b-4 border-[#660000] shadow-md"
                >
                  {isUploading ? "Uploading..." : "Start Bulk Import"}
                </Button>
              </div>
            </div>
          )}

          {/* Real-time Progress Bar & Status */}
          {(jobStatus === "queued" || jobStatus === "processing") && (
            <div className="p-6 bg-blue-50/50 border border-blue-200/80 rounded-2xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-blue-950 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  {jobStatus === "queued" ? "Queuing Import Job..." : "Importing Products..."}
                </span>
                <span className="text-sm font-black text-blue-800">{progress.percentage}%</span>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full bg-blue-200/60 rounded-full h-3.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-600 to-[#A80000] h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-blue-800 font-bold">
                <span>Processed: {progress.processedCount} / {progress.totalCount}</span>
                <span>Success: {progress.successCount} | Failed: {progress.failedCount}</span>
              </div>
            </div>
          )}

          {/* Completion Summary & Error Table */}
          {(jobStatus === "completed" || jobStatus === "failed") && (
            <div className="space-y-6 animate-in fade-in">
              {/* Summary Metrics */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-gray-100 rounded-2xl border border-gray-200">
                  <p className="text-xs text-gray-500 font-bold uppercase">Total</p>
                  <p className="text-xl font-black text-gray-900">{progress.totalCount}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <p className="text-xs text-emerald-600 font-bold uppercase">Imported</p>
                  <p className="text-xl font-black text-emerald-700">{progress.successCount}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-2xl border border-red-200">
                  <p className="text-xs text-red-600 font-bold uppercase">Failed</p>
                  <p className="text-xl font-black text-red-700">{progress.failedCount}</p>
                </div>
              </div>

              {/* Error Details Table if any failed rows */}
              {progress.errors.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-red-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      Failed Rows ({progress.errors.length})
                    </h4>
                    <Button
                      type="button"
                      onClick={handleDownloadErrorReport}
                      variant="outline"
                      className="text-xs font-bold text-red-700 border-red-300 hover:bg-red-50 rounded-xl h-8 px-3"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      Download Error Report (CSV)
                    </Button>
                  </div>

                  <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0 border-b border-gray-200">
                        <tr>
                          <th className="p-2.5 w-14 text-center">Row</th>
                          <th className="p-2.5">Product Name</th>
                          <th className="p-2.5">Image</th>
                          <th className="p-2.5">Error Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {progress.errors.map((err, idx) => (
                          <tr key={idx} className="hover:bg-red-50/40">
                            <td className="p-2.5 text-center font-bold text-gray-600">{err.row}</td>
                            <td className="p-2.5 font-bold text-gray-900 truncate max-w-[120px]">{err.productName}</td>
                            <td className="p-2.5 text-gray-500 truncate max-w-[100px]">{err.image}</td>
                            <td className="p-2.5 font-semibold text-red-600">{err.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    setJobStatus("idle");
                    setFile(null);
                  }}
                  variant="outline"
                  className="rounded-xl font-bold"
                >
                  Import Another ZIP
                </Button>
                <Button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="bg-gray-900 hover:bg-black text-white font-bold rounded-xl px-6"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportModal;
