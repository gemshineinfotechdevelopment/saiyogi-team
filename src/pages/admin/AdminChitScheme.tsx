import React, { useState, useEffect } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { Image as ImageIcon, Upload, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export interface ChitSchemeImage {
  id: string;
  url: string;
  title?: string;
}

const DEFAULT_CHIT_IMAGES: ChitSchemeImage[] = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1200&auto=format&fit=crop",
    title: "Diwali Special Savings Scheme 2026"
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?q=80&w=1200&auto=format&fit=crop",
    title: "Monthly Firecracker Advance Booking Perks"
  }
];

const AdminChitScheme: React.FC = () => {
  const [images, setImages] = useState<ChitSchemeImage[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("chit_scheme_images");
    if (saved) {
      try {
        setImages(JSON.parse(saved));
      } catch {
        setImages(DEFAULT_CHIT_IMAGES);
      }
    } else {
      setImages(DEFAULT_CHIT_IMAGES);
    }
  }, []);

  const saveImagesToStorage = (updated: ChitSchemeImage[]) => {
    try {
      setImages(updated);
      localStorage.setItem("chit_scheme_images", JSON.stringify(updated));
      toast.success("Chit Scheme images updated successfully!");
    } catch (err) {
      toast.error("Failed to save: Storage quota exceeded. Please delete some existing images first.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newUploaded: ChitSchemeImage[] = [];
    let processed = 0;
    const fileList = Array.from(files);

    fileList.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Scale image down to max width 1000px maintaining aspect ratio
          const maxWidth = 1000;
          const scale = Math.min(1, maxWidth / img.width);
          const targetWidth = Math.round(img.width * scale);
          const targetHeight = Math.round(img.height * scale);

          const canvas = document.createElement("canvas");
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext("2d");

          if (ctx) {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, targetWidth, targetHeight);
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

            newUploaded.push({
              id: `${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
              url: dataUrl,
              title: file.name.replace(/\.[^/.]+$/, "")
            });
          } else {
            newUploaded.push({
              id: `${Date.now()}-${index}`,
              url: event.target?.result as string,
              title: file.name.replace(/\.[^/.]+$/, "")
            });
          }

          processed++;
          if (processed === fileList.length) {
            setImages(prev => {
              const updated = [...prev, ...newUploaded];
              saveImagesToStorage(updated);
              return updated;
            });
          }
        };

        img.onerror = () => {
          processed++;
          if (processed === fileList.length && newUploaded.length > 0) {
            setImages(prev => {
              const updated = [...prev, ...newUploaded];
              saveImagesToStorage(updated);
              return updated;
            });
          }
        };

        if (typeof event.target?.result === "string") {
          img.src = event.target.result;
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const handleDeleteImage = (id: string) => {
    const updated = images.filter((img) => img.id !== id);
    saveImagesToStorage(updated);
  };

  return (
    <>
      <AdminNavbar />
      <div className="flex min-h-screen bg-gray-50/50">
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900">
                Chit Scheme Management
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Upload and manage Chit Scheme images displayed to logged-in users
              </p>
            </div>
          </div>

          {/* Single Upload Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs mb-8 space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Upload Chit Scheme Images
            </h2>

            {/* File Upload Box */}
            <div className="border-2 border-dashed border-gray-200 hover:border-primary/50 rounded-2xl p-8 text-center transition-colors bg-gray-50/50 flex flex-col items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-base font-bold text-gray-800 mb-1">
                Upload multiple image files
              </p>
              <p className="text-xs text-gray-500 mb-5 font-medium">
                PNG, JPG, WEBP formats supported
              </p>
              <label className="bg-primary text-white text-xs font-bold px-5 py-3 rounded-xl cursor-pointer hover:bg-primary/90 transition-all shadow-xs flex items-center gap-2 active:scale-95">
                <Upload className="w-4 h-4" />
                <span>Browse Files</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Uploaded Images Gallery */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center justify-between">
              <span>Current Chit Scheme Images ({images.length})</span>
            </h2>

            {images.length === 0 ? (
              <div className="py-12 text-center text-gray-400 font-medium text-sm">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No images uploaded yet. Upload images above to display on the Chit Scheme page.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="group relative bg-gray-50 rounded-2xl border border-gray-200/80 overflow-hidden shadow-xs"
                  >
                    <div className="aspect-video w-full overflow-hidden bg-gray-100">
                      <img
                        src={img.url}
                        alt={img.title || "Chit Scheme Image"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-3.5 flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-gray-900 truncate">
                        {img.title || "Chit Scheme Banner"}
                      </span>
                      <button
                        onClick={() => handleDeleteImage(img.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminChitScheme;
