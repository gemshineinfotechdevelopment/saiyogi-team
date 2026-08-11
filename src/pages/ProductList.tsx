import React from 'react';
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { Download, FileText, FileX } from "lucide-react";
import { Button } from "@/components/ui/button";

const ProductList = () => {
  const { settings, isLoading } = useSiteSettings();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <UserHeader />
      
      <main className="flex-grow pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col items-center justify-center">
        
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Our Latest Price List
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Download our complete catalog and updated price list for {new Date().getFullYear()} directly to your device.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-100 dark:border-gray-700 mt-8 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center gap-6">
              {!isLoading && settings.priceListPdf ? (
                <>
                  <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                    <FileText className="h-12 w-12 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ready to Download</h2>
                    <p className="text-gray-500 text-sm">PDF Format • Instant Download</p>
                  </div>
                  
                  <Button 
                    asChild 
                    size="lg" 
                    className="mt-4 px-8 py-6 text-lg rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-1 w-full sm:w-auto font-bold"
                  >
                    <a href={settings.priceListPdf} target="_blank" rel="noopener noreferrer" download>
                      <Download className="mr-2 h-6 w-6" />
                      Download Price List
                    </a>
                  </Button>
                </>
              ) : !isLoading && !settings.priceListPdf ? (
                <>
                  <div className="h-24 w-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-2">
                    <FileX className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Not Available Yet</h2>
                    <p className="text-gray-500">The latest price list will be uploaded shortly.</p>
                  </div>
                </>
              ) : (
                <div className="h-40 flex items-center justify-center w-full">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-full mb-4"></div>
                    <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </main>

      <UserFooter />
    </div>
  );
};

export default ProductList;
