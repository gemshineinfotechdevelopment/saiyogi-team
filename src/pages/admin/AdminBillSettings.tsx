import { useState, useEffect } from "react";
import { Save, Settings, Loader, Edit2, X } from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSiteSettings, SiteSettings } from "@/context/SiteSettingsContext";
import { useSettings } from "@/context/SettingsContext";
import { updateSettings as updateSettingsAPI } from "@/lib/api";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

const AdminBillSettings = () => {
  const { settings: siteSettings, updateSettings } = useSiteSettings();
  const { refreshSettings } = useSettings();
  const [form, setForm] = useState<SiteSettings>(siteSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setForm(siteSettings);
    }
  }, [siteSettings, isEditing]);

  const handleCancel = () => {
    setForm(siteSettings);
    setIsEditing(false);
    toast.info("Changes discarded");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettingsAPI({
        billing: form.billing,
      });

      await updateSettings({ ...siteSettings, billing: form.billing });
      
      // Force SettingsContext to refresh so that the print templates get the latest data immediately
      await refreshSettings();

      toast.success("Bill settings saved successfully!");
      setIsEditing(false);
    } catch (error: any) {
      const msg = error?.message || "Failed to save bill settings";
      toast.error(msg);
      console.error("Failed to update bill settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateBillingField = (field: keyof NonNullable<SiteSettings['billing']>, value: any) => {
    setForm((prev) => ({
      ...prev,
      billing: {
        ...(prev.billing || {}),
        [field]: value
      }
    }));
  };

  return (
    <>
      <AdminNavbar />
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" /> Bill Settings
              </h1>
              <p className="text-sm text-muted-foreground">Manage company information for printed bills</p>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} className="gap-2">
                <Edit2 className="h-4 w-4" /> Edit
              </Button>
            )}
          </div>

          <div className="max-w-2xl space-y-6">
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="font-display font-bold text-lg">Billing Information</h2>
              
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input
                  value={form.billing?.companyName || ""}
                  onChange={(e) => updateBillingField("companyName", e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g. Narendraa Enterprises"
                  className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={form.billing?.phone || ""}
                    onChange={(e) => updateBillingField("phone", e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g. +91 9876543210"
                    className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp Number</Label>
                  <Input
                    value={form.billing?.whatsapp || ""}
                    onChange={(e) => updateBillingField("whatsapp", e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g. +91 9876543210"
                    className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.billing?.email || ""}
                  onChange={(e) => updateBillingField("email", e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g. info@company.com"
                  className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <Label>Company GST Number</Label>
                <Input
                  value={form.billing?.gstNumber || ""}
                  onChange={(e) => updateBillingField("gstNumber", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter GST Number"
                  className={!isEditing ? "bg-muted cursor-not-allowed" : "uppercase"}
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-border rounded-md bg-secondary/50">
                <div className="space-y-0.5">
                  <Label className="text-base">Apply GST</Label>
                  <p className="text-sm text-muted-foreground">Show Company GST number on printed PDF bills.</p>
                </div>
                <Switch
                  checked={form.billing?.applyGst || false}
                  onCheckedChange={(checked) => updateBillingField("applyGst", checked)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <Button onClick={handleCancel} variant="outline" className="gap-2">
                  <X className="h-4 w-4" /> Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                  {isSaving ? (
                    <><Loader className="h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="h-4 w-4" /> Save Changes</>
                  )}
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminBillSettings;
