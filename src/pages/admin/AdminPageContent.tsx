import { useState, useRef, useEffect } from "react";
import { uploadImageToCloudinary, updateSettings as updateSettingsAPI } from "@/lib/api";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, Save, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const AdminPageContent = () => {
  const { settings, updateSettings, isLoading } = useSiteSettings();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [banners, setBanners] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize state when settings load
  useEffect(() => {
    if (settings?.heroBanners) {
      setBanners(settings.heroBanners);
    }
  }, [settings?.heroBanners]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";

    const newBanners: string[] = [];
    setIsSaving(true);
    let hasError = false;

    for (const file of files) {
      try {
        toast({ title: "Uploading", description: `Uploading ${file.name}...` });
        const cloudinaryUrl = await uploadImageToCloudinary(file, "banners");
        newBanners.push(cloudinaryUrl);
      } catch (error: any) {
        hasError = true;
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${file.name}: ${error.message || error}`,
          variant: "destructive",
        });
      }
    }

    if (newBanners.length > 0) {
      setBanners((prev) => [...prev, ...newBanners]);
      if (!hasError) {
        toast({ title: "Success", description: "All images uploaded successfully. Don't forget to save changes!" });
      } else {
        toast({ title: "Partial Success", description: "Some images were uploaded. Don't forget to save changes!" });
      }
    }
    
    setIsSaving(false);
  };

  const removeBanner = (index: number) => {
    setBanners((prev) => prev.filter((_, i) => i !== index));
  };

  const moveBanner = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === banners.length - 1) return;
    
    setBanners(prev => {
      const newBanners = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const temp = newBanners[targetIndex];
      newBanners[targetIndex] = newBanners[index];
      newBanners[index] = temp;
      return newBanners;
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateSettingsAPI({ ...settings, heroBanners: banners });
      await updateSettings({ ...settings, heroBanners: banners }); // Update local context
      toast({
        title: "Success",
        description: "Home page banners updated successfully.",
      });
    } catch (error) {
      console.error("Error saving banners:", error);
      toast({
        title: "Error",
        description: "Failed to update banners.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminNavbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Home Page Banners</h2>
                <p className="text-sm text-gray-500 mt-1">Manage the hero slideshow images displayed on the home page.</p>
              </div>
              <Button onClick={handleSave} disabled={isSaving || isLoading} className="gap-2 shrink-0">
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Banner Images</CardTitle>
                <CardDescription>
                  Upload high-quality images. Recommended resolution: 1920x600 pixels.
                  Supported formats: JPG, PNG, WebP.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                    multiple
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-dashed border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 flex flex-col items-center justify-center gap-2"
                  >
                    <ImagePlus className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-600 font-medium">Click to upload banner images</span>
                  </Button>
                </div>

                {banners.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700">Current Banners ({banners.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {banners.map((banner, index) => (
                        <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                          <div className="aspect-[3/1] relative">
                            <img 
                              src={banner} 
                              alt={`Banner ${index + 1}`} 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button
                                size="icon"
                                variant="secondary"
                                onClick={() => moveBanner(index, 'up')}
                                disabled={index === 0}
                                className="h-8 w-8 rounded-full"
                              >
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="secondary"
                                onClick={() => moveBanner(index, 'down')}
                                disabled={index === banners.length - 1}
                                className="h-8 w-8 rounded-full"
                              >
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="destructive"
                                onClick={() => removeBanner(index)}
                                className="h-8 w-8 rounded-full"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="p-2 text-xs text-center text-gray-500 font-medium bg-gray-50 border-t border-gray-100">
                            Slide {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
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

export default AdminPageContent;
