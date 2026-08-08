import React, { useState, useEffect } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { Image as ImageIcon, Upload, Trash2, AlertCircle, Edit2, Check, X, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { uploadImageToCloudinary } from "@/lib/api";

export interface ChitSchemeImage {
  id: string;
  url: string;
  title?: string;
  description?: string;
}

const DEFAULT_CHIT_IMAGES: ChitSchemeImage[] = [
  {
    id: "1",
    url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1200&auto=format&fit=crop",
    title: "Diwali Special Savings Scheme 2026",
    description: "Save monthly and get up to 50% extra fireworks bonus on Diwali!"
  },
  {
    id: "2",
    url: "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?q=80&w=1200&auto=format&fit=crop",
    title: "Monthly Firecracker Advance Booking Perks",
    description: "Lock wholesale rates today with zero price rise guarantee."
  }
];

const AdminChitScheme: React.FC = () => {
  const [images, setImages] = useState<ChitSchemeImage[]>([]);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Edit Modal State
  const [editingImage, setEditingImage] = useState<ChitSchemeImage | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

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
      toast.success("Chit Scheme updated successfully!");
    } catch (err) {
      toast.error("Failed to save: Storage quota exceeded. Please delete older images first.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newUploaded: ChitSchemeImage[] = [];
    const fileList = Array.from(files);

    for (let index = 0; index < fileList.length; index++) {
      const file = fileList[index];
      try {
        const cloudinaryUrl = await uploadImageToCloudinary(file, "chit_schemes");
        const autoTitle = uploadTitle.trim() || file.name.replace(/\.[^/.]+$/, "");
        newUploaded.push({
          id: `${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
          url: cloudinaryUrl,
          title: autoTitle,
          description: uploadDescription.trim() || ""
        });
      } catch (err: any) {
        toast.error(`Failed to upload ${file.name} to Cloudinary: ${err.message || err}`);
      }
    }

    if (newUploaded.length > 0) {
      const updated = [...images, ...newUploaded];
      saveImagesToStorage(updated);
      setUploadTitle("");
      setUploadDescription("");
    }
    setIsUploading(false);
    e.target.value = "";
  };

  const handleOpenEditModal = (img: ChitSchemeImage) => {
    setEditingImage(img);
    setEditTitle(img.title || "");
    setEditDescription(img.description || "");
  };

  const handleSaveEdit = () => {
    if (!editingImage) return;

    const updated = images.map((img) =>
      img.id === editingImage.id
        ? { ...img, title: editTitle.trim(), description: editDescription.trim() }
        : img
    );

    saveImagesToStorage(updated);
    setEditingImage(null);
  };

  const handleDeleteImage = (id: string) => {
    if (confirm("Are you sure you want to delete this Chit Scheme image?")) {
      const updated = images.filter((img) => img.id !== id);
      saveImagesToStorage(updated);
    }
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
                Upload images with titles and descriptions for logged-in user Chit Scheme view
              </p>
            </div>
          </div>

          {/* Upload Card with Left Upload Option & Right Image Details */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs mb-8 space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Upload className="w-5 h-5 text-primary" />
              Add Chit Scheme Image & Details
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Left Side: Image Upload Option */}
              <div className="border-2 border-dashed border-gray-200 hover:border-primary/50 rounded-2xl p-6 text-center transition-colors bg-gray-50/50 flex flex-col items-center justify-center min-h-[220px]">
                <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-base font-bold text-gray-800 mb-1">
                  Select Image File
                </p>
                <p className="text-xs text-gray-500 mb-5 font-medium">
                  PNG, JPG, WEBP formats supported (Uploads to Cloudinary)
                </p>
                <label className={`bg-primary text-white text-xs font-bold px-6 py-3 rounded-xl cursor-pointer hover:bg-primary/90 transition-all shadow-xs flex items-center gap-2 active:scale-95 ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}>
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>{isUploading ? 'Uploading to Cloudinary...' : 'Browse & Upload Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isUploading}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Right Side: Image Details */}
              <div className="bg-gray-50/60 border border-gray-200/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>Image Details</span>
                  </h3>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      Scheme Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Diwali Mega Savings Scheme 2026"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      className="w-full text-xs p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      Scheme Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Save ₹1000/month & get bonus 50% fireworks free!"
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      className="w-full text-xs p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 font-medium italic bg-amber-50/80 border border-amber-200/60 p-2.5 rounded-xl text-amber-900">
                  💡 Fill in Title & Description, then click <strong>Browse & Upload Image</strong> on the left. You can also edit details later anytime.
                </p>
              </div>
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
                    className="group bg-gray-50 rounded-2xl border border-gray-200/80 overflow-hidden shadow-xs flex flex-col"
                  >
                    <div className="aspect-video w-full overflow-hidden bg-gray-100 relative">
                      <img
                        src={img.url}
                        alt={img.title || "Chit Scheme Image"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1">
                          {img.title || "Untitled Scheme"}
                        </h4>
                        {img.description ? (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                            {img.description}
                          </p>
                        ) : (
                          <p className="text-[11px] text-gray-400 italic mt-1">No description provided</p>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => handleOpenEditModal(img)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                          title="Edit Title & Description"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteImage(img.id)}
                          className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                          title="Delete Image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Edit Title & Description Modal */}
      {editingImage && (
        <Dialog open={!!editingImage} onOpenChange={() => setEditingImage(null)}>
          <DialogContent className="sm:max-w-md p-6 bg-white rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Edit Image Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Scheme Title
                </label>
                <input
                  type="text"
                  placeholder="Scheme Title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-xs p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Scheme Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Scheme Description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full text-xs p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2 border-t">
              <button
                onClick={() => setEditingImage(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                Save Changes
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default AdminChitScheme;
