import { useState, useEffect } from "react";
import { Save, Settings, Loader, Edit2, X, Plus, Trash2 } from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSiteSettings, SiteSettings } from "@/context/SiteSettingsContext";
import { updateSettings as updateSettingsAPI } from "@/lib/api";
import { toast } from "sonner";

const AdminContent = () => {
  const { settings, updateSettings } = useSiteSettings();
  const [form, setForm] = useState<SiteSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Only sync remote settings into the form when not actively editing
    if (!isEditing) {
      setForm(settings);
    }
  }, [settings, isEditing]);

  const handleCancel = () => {
    setForm(settings);
    setIsEditing(false);
    toast.info("Changes discarded");
  };

  const handleSave = async () => {
    if (!form.contact?.phone?.trim() || !form.contact?.address?.trim()) {
      toast.error("Please fill in phone and address");
      return;
    }
    if (form.discountPercent < 0 || form.discountPercent > 100) {
      toast.error("Discount must be between 0 and 100");
      return;
    }
    if (form.minimumPurchaseAmount < 0 || form.minPurchaseOutsideTN < 0) {
      toast.error("Minimum purchase amount cannot be negative");
      return;
    }

    setIsSaving(true);
    try {
      await updateSettingsAPI({
        siteName: form.siteName,
        siteDescription: form.siteDescription,
        discountPercent: form.discountPercent,
        minimumPurchaseAmount: form.minimumPurchaseAmount,
        minPurchaseOutsideTN: form.minPurchaseOutsideTN,
        currency: form.currency,
        contact: form.contact,
        socialLinks: form.socialLinks,
        news: form.news,
        enablePackingCharge: form.enablePackingCharge,
        youtubeVideos: form.youtubeVideos,
      });

      // Update global context state immediately
      await updateSettings(form);

      toast.success("Settings saved successfully! Changes will appear across the site.");
      setIsEditing(false);
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
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" /> Content & Settings
              </h1>
              <p className="text-sm text-muted-foreground">Manage company information and global settings</p>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} className="gap-2">
                <Edit2 className="h-4 w-4" /> Edit
              </Button>
            )}
          </div>

          <div className="max-w-2xl space-y-6">
            {/* Site Information */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="font-display font-bold text-lg">Site Information</h2>
              <div className="space-y-2">
                <Label>Site Name</Label>
                <Input
                  value={form.siteName}
                  onChange={(e) => setForm({ ...form, siteName: e.target.value })}
                  disabled={!isEditing}
                  maxLength={100}
                  className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Site Description</Label>
                <textarea
                  className={`w-full rounded-lg border border-border bg-secondary p-2 text-sm min-h-[60px] ${!isEditing ? "bg-muted cursor-not-allowed opacity-60" : ""}`}
                  value={form.siteDescription}
                  onChange={(e) => setForm({ ...form, siteDescription: e.target.value.slice(0, 300) })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* News / Marquee Section */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="font-display font-bold text-lg flex items-center gap-2">
                News / Announcement
              </h2>
              <div className="space-y-2">
                <Label>News (Marquee Text)</Label>
                <textarea
                  className={`w-full rounded-lg border border-border bg-secondary p-2 text-sm min-h-[80px] ${!isEditing ? "bg-muted cursor-not-allowed opacity-60" : ""}`}
                  placeholder="Enter important news or announcements to show in the marquee..."
                  value={form.news || ""}
                  onChange={(e) => setForm({ ...form, news: e.target.value })}
                  disabled={!isEditing}
                />
                <p className="text-[10px] text-muted-foreground italic">This text will run across the top of the home page as a scrolling marquee.</p>
              </div>
            </div>



            {/* Contact Information */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="font-display font-bold text-lg">Contact Information</h2>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.contact?.email || ""}
                  onChange={(e) => setForm({ ...form, contact: { ...form.contact!, email: e.target.value } })}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={form.contact?.phone || ""}
                  onChange={(e) => setForm({ ...form, contact: { ...form.contact!, phone: e.target.value } })}
                  disabled={!isEditing}
                  maxLength={20}
                  className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <textarea
                  className={`w-full rounded-lg border border-border bg-secondary p-2 text-sm min-h-[80px] ${!isEditing ? "bg-muted cursor-not-allowed opacity-60" : ""}`}
                  value={form.contact?.address || ""}
                  onChange={(e) => setForm({ ...form, contact: { ...form.contact!, address: e.target.value.slice(0, 300) } })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* Pricing Settings */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="font-display font-bold text-lg">Pricing</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Percentage (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.discountPercent}
                    onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                  />
                  <p className="text-xs text-muted-foreground">Applied to all discounted products</p>
                </div>
                <div className="space-y-2">
                  <Label>Min Purchase (Inside Tamil Nadu) (₹)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.minimumPurchaseAmount}
                    onChange={(e) => setForm({ ...form, minimumPurchaseAmount: Number(e.target.value) })}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                  />
                  <p className="text-[10px] text-muted-foreground">Minimum order value for TN customers</p>
                </div>
                <div className="space-y-2">
                  <Label>Min Purchase (Outside Tamil Nadu) (₹)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.minPurchaseOutsideTN}
                    onChange={(e) => setForm({ ...form, minPurchaseOutsideTN: Number(e.target.value) })}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                  />
                  <p className="text-[10px] text-muted-foreground">Minimum order value for Outside TN customers</p>
                </div>
                <div className="space-y-2 col-span-1 md:col-span-2 pt-2 border-t border-border mt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Packing Charge (Flat / 3%)</Label>
                      <p className="text-xs text-muted-foreground">Automatically add ₹120 (for orders ≤ 3999) or 3% packing charge to website orders</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={form.enablePackingCharge ?? true}
                        onChange={(e) => setForm({ ...form, enablePackingCharge: e.target.checked })}
                        disabled={!isEditing}
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* YouTube Promotional Videos */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="font-display font-bold text-lg flex items-center gap-2">
                Promotional YouTube Videos
              </h2>
              <div className="space-y-4">
                {(form.youtubeVideos || []).map((video, index) => (
                  <div key={index} className="flex gap-4 items-end bg-secondary/50 p-4 rounded-lg border border-border flex-wrap md:flex-nowrap">
                    <div className="flex-1 space-y-2 w-full min-w-[200px]">
                      <Label>Title</Label>
                      <Input
                        placeholder="e.g. Grand Celebration Video"
                        value={video.title}
                        onChange={(e) => {
                          const newVideos = [...(form.youtubeVideos || [])];
                          newVideos[index].title = e.target.value;
                          setForm({ ...form, youtubeVideos: newVideos });
                        }}
                        disabled={!isEditing}
                        className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                      />
                    </div>
                    <div className="flex-1 space-y-2 w-full min-w-[200px]">
                      <Label>YouTube URL</Label>
                      <Input
                        placeholder="e.g. https://www.youtube.com/watch?v=..."
                        value={video.url}
                        onChange={(e) => {
                          const newVideos = [...(form.youtubeVideos || [])];
                          newVideos[index].url = e.target.value;
                          setForm({ ...form, youtubeVideos: newVideos });
                        }}
                        disabled={!isEditing}
                        className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                      />
                    </div>
                    {isEditing && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => {
                          const newVideos = [...(form.youtubeVideos || [])];
                          newVideos.splice(index, 1);
                          setForm({ ...form, youtubeVideos: newVideos });
                        }}
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 border-dashed"
                    onClick={() => {
                      const newVideos = [...(form.youtubeVideos || []), { title: '', url: '' }];
                      setForm({ ...form, youtubeVideos: newVideos });
                    }}
                  >
                    <Plus className="h-4 w-4" /> Add Video
                  </Button>
                )}
                <p className="text-[10px] text-muted-foreground italic">These videos will be displayed in the Fireworks Showcase section on the Home page.</p>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="font-display font-bold text-lg">Social Media Links</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {["facebook", "twitter", "instagram", "youtube"].map((platform) => (
                  <div key={platform} className="space-y-2">
                    <Label className="capitalize">{platform}</Label>
                    <Input
                      value={form.socialLinks?.[platform as keyof typeof form.socialLinks] || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          socialLinks: {
                            ...form.socialLinks,
                            [platform]: e.target.value,
                          },
                        })
                      }
                      disabled={!isEditing}
                      className={!isEditing ? "bg-muted cursor-not-allowed" : ""}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="gap-2"
                >
                  <X className="h-4 w-4" /> Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save Changes
                    </>
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

export default AdminContent;
