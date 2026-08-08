import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { useAuth } from "@/context/AuthContext";
import { Lock, LogIn, Image as ImageIcon, ZoomIn, X, Gift } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import { getChitSchemes, ChitSchemeItem, trackCustomerAction } from "@/lib/api";

interface ChitSchemeImage {
  id: string;
  url: string;
  title?: string;
  description?: string;
}

const DEFAULT_IMAGES: ChitSchemeImage[] = [
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

const ChitScheme: React.FC = () => {
  const { isUserLoggedIn, userPhone, userName, openLoginModal } = useAuth();
  const [images, setImages] = useState<ChitSchemeImage[]>([]);
  const [activeZoomImage, setActiveZoomImage] = useState<ChitSchemeImage | null>(null);

  useEffect(() => {
    if (isUserLoggedIn && userPhone) {
      trackCustomerAction({
        phone: userPhone,
        name: userName || undefined,
        source: "chit_scheme"
      }).catch(err => console.warn("Failed to track chit scheme action:", err));
    }
  }, [isUserLoggedIn, userPhone, userName]);

  useEffect(() => {
    getChitSchemes()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((item: ChitSchemeItem) => ({
            id: item._id || item.id || '',
            url: item.url,
            title: item.title || '',
            description: item.description || ''
          }));
          setImages(mapped);
        } else {
          setImages(DEFAULT_IMAGES);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch chit schemes from API:", err);
        setImages(DEFAULT_IMAGES);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <UserHeader />

      {/* Breadcrumb Header Bar */}
      <div className="bg-[#F8F7FA] border-b border-gray-200/80 py-3.5 px-4 sm:px-12">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-xs text-gray-600 font-medium">
          <Link to="/" className="hover:text-[#4C1D95] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#4C1D95] font-bold">Chit Scheme</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 py-10 px-4 sm:px-12 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center border border-amber-200 shadow-2xs">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2A1B54]">
              Sai Yogi Chit Scheme
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Exclusive monthly savings schemes and promotional benefits
            </p>
          </div>
        </div>

        {!isUserLoggedIn ? (
          /* Locked State for Guest Users */
          <div className="max-w-xl mx-auto my-12 bg-amber-50/80 border-2 border-amber-200/90 rounded-3xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-900 mx-auto mb-4 flex items-center justify-center border border-amber-300">
              <Lock className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Please login to view Chit Scheme
            </h2>

            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Our Chit Scheme details and special offers are available exclusively for registered members. Enter your 10-digit mobile number to view all scheme benefits.
            </p>

            <button
              onClick={openLoginModal}
              className="bg-[#7A1416] hover:bg-[#A80000] text-white px-6 py-3 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 mx-auto cursor-pointer active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Login to View Scheme</span>
            </button>
          </div>
        ) : (
          /* Unlocked State for Logged-In Users: Displays Admin Uploaded Images ONLY */
          <div className="space-y-6">
            <div className="bg-amber-50/90 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
              <span>🎉 Welcome! Here are your active Chit Scheme details & offers:</span>
            </div>

            {images.length === 0 ? (
              <div className="py-16 text-center text-gray-400 font-medium text-sm border-2 border-dashed border-gray-200 rounded-3xl">
                <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                No Chit Scheme images available at the moment. Please check back soon!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="group bg-white rounded-3xl border border-gray-200/90 overflow-hidden shadow-sm hover:shadow-md transition-all relative"
                  >
                    <div className="aspect-[16/9] w-full overflow-hidden bg-gray-100 relative flex items-center justify-center">
                      <img
                        src={img.url}
                        alt={img.title || "Chit Scheme Image"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        onClick={() => setActiveZoomImage(img)}
                        className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-bold text-xs cursor-pointer"
                      >
                        <ZoomIn className="w-5 h-5" />
                        <span>Click to Enlarge</span>
                      </button>
                    </div>

                    {(img.title || img.description) && (
                      <div className="p-4 bg-white border-t border-gray-100 space-y-1">
                        {img.title && <h3 className="font-bold text-gray-900 text-sm leading-snug">{img.title}</h3>}
                        {img.description && <p className="text-xs text-gray-600 font-medium leading-relaxed">{img.description}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Image Lightbox Modal */}
      {activeZoomImage && (
        <Dialog open={!!activeZoomImage} onOpenChange={() => setActiveZoomImage(null)}>
          <DialogContent className="max-w-4xl p-2 bg-black/95 border-0 rounded-3xl overflow-hidden [&>button]:text-white">
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <img
                src={activeZoomImage.url}
                alt={activeZoomImage.title || "Chit Scheme"}
                className="max-h-[80vh] w-auto object-contain rounded-2xl"
              />
              {activeZoomImage.title && (
                <p className="text-white text-xs font-bold mt-3 text-center px-4 py-1 bg-white/10 rounded-full backdrop-blur-sm">
                  {activeZoomImage.title}
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Footer */}
      <UserFooter />
    </div>
  );
};

export default ChitScheme;
