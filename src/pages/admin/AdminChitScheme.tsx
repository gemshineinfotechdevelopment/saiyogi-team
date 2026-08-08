import React, { useState, useEffect } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { Image as ImageIcon, Upload, Trash2, AlertCircle, Edit2, FileText, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { uploadImageToCloudinary, getChitSchemes, createChitScheme, updateChitScheme, deleteChitScheme, ChitSchemeItem } from "@/lib/api";

export interface ChitSchemeImage {
  id: string;
  url: string;
  title?: string;
  description?: string;
}

const AdminChitScheme: React.FC = () => {
  const [images, setImages] = useState<ChitSchemeImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Edit Modal State
  const [editingImage, setEditingImage] = useState<ChitSchemeImage | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const loadChitSchemes = async () => {
    setLoading(true);
    try {
      const data = await getChitSchemes();
      const mapped = (data || []).map((item: ChitSchemeItem) => ({
        id: item._id || item.id || '',
        url: item.url,
        title: item.title || '',
        description: item.description || ''
      }));
      setImages(mapped);
    } catch (err) {
      console.error("Failed to load chit schemes from backend:", err);
      toast.error("Failed to load Chit Schemes from database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChitSchemes();

    const interval = setInterval(loadChitSchemes, 15000);
    const onFocus = () => loadChitSchemes();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setSelectedFile(file);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setFilePreview(URL.createObjectURL(file));
    if (!uploadTitle) {
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleClearSelectedFile = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select an image file first");
      return;
    }

    setIsUploading(true);
    try {
      toast.loading(`Uploading ${selectedFile.name}...`, { id: "upload-toast" });
      const cloudinaryUrl = await uploadImageToCloudinary(selectedFile, "chit_schemes");
      const titleToSave = uploadTitle.trim() || selectedFile.name.replace(/\.[^/.]+$/, "");

      await createChitScheme({
        title: titleToSave,
        description: uploadDescription.trim() || "",
        url: cloudinaryUrl
      });

      toast.success("Chit Scheme image uploaded & saved successfully!", { id: "upload-toast" });
      
      handleClearSelectedFile();
      setUploadTitle("");
      setUploadDescription("");
      loadChitSchemes();
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message || err}`, { id: "upload-toast" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenEditModal = (img: ChitSchemeImage) => {
    setEditingImage(img);
    setEditTitle(img.title || "");
    setEditDescription(img.description || "");
  };

  const handleSaveEdit = async () => {
    if (!editingImage) return;

    try {
      toast.loading("Updating Chit Scheme...", { id: "edit-toast" });
      await updateChitScheme(editingImage.id, {
        title: editTitle.trim(),
        description: editDescription.trim()
      });
      toast.success("Chit Scheme updated in database!", { id: "edit-toast" });
      setEditingImage(null);
      loadChitSchemes();
    } catch (err: any) {
      toast.error(`Update failed: ${err.message || err}`, { id: "edit-toast" });
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (confirm("Are you sure you want to delete this Chit Scheme image?")) {
      try {
        toast.loading("Deleting image...", { id: "delete-toast" });
        await deleteChitScheme(id);
        toast.success("Chit Scheme deleted from Cloudinary & database!", { id: "delete-toast" });
        loadChitSchemes();
      } catch (err: any) {
        toast.error(`Delete failed: ${err.message || err}`, { id: "delete-toast" });
      }
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
                Select image, add title & description, then click upload to save to Cloudinary & MongoDB
              </p>
            </div>
          </div>

          {/* Upload Form Card */}
          <form onSubmit={handleUploadSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs mb-8 space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Upload className="w-5 h-5 text-primary" />
              Add New Chit Scheme Image & Details
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
<<<<<<< HEAD
              {/* Left Side: Image File Selection & Preview */}
              <div className="flex flex-col">
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1.5">
                  1. Select Image File *
=======
              {/* Left Side: Image Upload Option */}
              <div className="border-2 border-dashed border-gray-200 hover:border-primary/50 rounded-2xl p-6 text-center transition-colors bg-gray-50/50 flex flex-col items-center justify-center min-h-[220px]">
                <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-base font-bold text-gray-800 mb-1">
                  Select Image File
                </p>
                <p className="text-xs text-gray-500 mb-5 font-medium">
                  Max: 1200x1600px, Max 1MB (PNG, JPG, WEBP)
                </p>
                <label className={`bg-primary text-white text-xs font-bold px-6 py-3 rounded-xl cursor-pointer hover:bg-primary/90 transition-all shadow-xs flex items-center gap-2 active:scale-95 ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}>
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>{isUploading ? 'Uploading to Cloudinary & Saving...' : 'Browse & Upload Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isUploading}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
>>>>>>> 5a1840951f31f4d02411a6d3ff710e9aac6a669b
                </label>
                {filePreview ? (
                  <div className="relative border border-gray-200 rounded-2xl p-3 bg-gray-50 flex-1 flex flex-col items-center justify-center min-h-[220px]">
                    <img
                      src={filePreview}
                      alt="Selected preview"
                      className="max-h-44 w-full object-contain rounded-xl"
                    />
                    <div className="mt-3 flex items-center justify-between w-full px-2 pt-2 border-t border-gray-200/60">
                      <span className="text-xs font-semibold text-gray-700 truncate max-w-[200px]">
                        {selectedFile?.name}
                      </span>
                      <button
                        type="button"
                        onClick={handleClearSelectedFile}
                        className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 p-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" /> Remove File
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-200 hover:border-primary/50 rounded-2xl p-6 text-center transition-colors bg-gray-50/50 flex flex-col items-center justify-center min-h-[220px] cursor-pointer flex-1">
                    <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-sm font-bold text-gray-800 mb-1">
                      Click to Select Image
                    </p>
                    <p className="text-xs text-gray-500 mb-4 font-medium">
                      PNG, JPG, WEBP formats supported
                    </p>
                    <span className="bg-white border border-gray-300 text-gray-700 text-xs font-bold px-4 py-2 rounded-xl shadow-2xs">
                      Choose File
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Right Side: Image Details & Submit Button */}
              <div className="bg-gray-50/60 border border-gray-200/80 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>2. Scheme Details</span>
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
                      className="w-full text-xs p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-semibold"
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

                <div className="pt-2 border-t border-gray-200/60">
                  <button
                    type="submit"
                    disabled={isUploading || !selectedFile}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-xs py-3.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading & Saving...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload & Save Chit Scheme</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Uploaded Images Gallery */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center justify-between">
              <span>Current Chit Scheme Images ({images.length})</span>
            </h2>

            {loading ? (
              <div className="py-12 text-center text-gray-400 font-medium text-sm flex justify-center items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                Loading Chit Schemes...
              </div>
            ) : images.length === 0 ? (
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
