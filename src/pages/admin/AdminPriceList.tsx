import React, { useState } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, FileText, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { uploadImageToCloudinary, updateSettings as updateSettingsAPI } from "@/lib/api";

const AdminPriceList = () => {
  const { settings, updateSettings } = useSiteSettings();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState(settings.priceListPdf || "");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a valid PDF file.");
      return;
    }

    setIsUploading(true);
    try {
      // Reusing the upload endpoint. It should accept PDFs since we changed resource_type to 'auto' in backend.
      const url = await uploadImageToCloudinary(file, "price_lists");
      setCurrentPdfUrl(url);
      toast.success("PDF uploaded successfully! Don't forget to save changes.");
    } catch (err: any) {
      toast.error(`Failed to upload PDF: ${err.message || err}`);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettingsAPI({
        ...settings,
        priceListPdf: currentPdfUrl,
      });

      await updateSettings({
        ...settings,
        priceListPdf: currentPdfUrl,
      });

      toast.success("Price List updated and saved successfully!");
    } catch (error: any) {
      const msg = error?.message || "Failed to save settings";
      toast.error(msg);
      console.error("Failed to update settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <AdminNavbar />
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Manage Price List
              </h1>
              <p className="text-gray-500 mt-1">Upload and manage the downloadable Price List PDF for customers.</p>
            </div>
          </div>

          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle>Current Price List Document</CardTitle>
              <CardDescription>
                This is the PDF file that customers will download when they visit the Price List page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentPdfUrl ? (
                <div className="p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Price List PDF</p>
                      <a href={currentPdfUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                        View Current File
                      </a>
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => setCurrentPdfUrl("")}>
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="p-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <FileText className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">No Price List Uploaded</p>
                  <p className="text-sm text-gray-500 mb-4">Upload a PDF file to display it to customers.</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Upload New Price List (PDF)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2" disabled={isUploading}>
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {isUploading ? "Uploading PDF..." : "Choose PDF File"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button onClick={handleSave} disabled={isSaving || isUploading} className="flex items-center gap-2">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

export default AdminPriceList;
