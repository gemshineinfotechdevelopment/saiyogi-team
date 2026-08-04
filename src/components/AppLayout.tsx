import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import { Link } from "react-router-dom";
import React from "react";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  noPadding?: boolean;
  hideHeader?: boolean;
}

export const AppLayout = ({ children, title, noPadding, hideHeader }: AppLayoutProps) => {
  return (
    <>
      <AdminNavbar />
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className={`flex-1 overflow-auto ${noPadding ? "" : "p-6 lg:p-8"}`}>
          {!hideHeader && title && (
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-display text-2xl font-bold">{title}</h1>
              </div>
              <Link to="/" className="text-sm text-primary hover:underline lg:hidden">← Store</Link>
            </div>
          )}
          {children}
        </main>
      </div>
    </>
  );
};
