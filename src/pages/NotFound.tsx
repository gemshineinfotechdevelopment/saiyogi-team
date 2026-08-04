import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import companyLogo from "@/assets/saiyogi-logo-1.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="text-center flex flex-col items-center max-w-md">
        <img src={companyLogo} alt="Sai Yogi Crackers" className="h-24 md:h-32 mb-4 object-contain" />
        <h1 className="mb-2 text-6xl md:text-8xl font-black text-[#7A1416]">404</h1>
        <h2 className="mb-4 text-2xl md:text-3xl font-bold text-gray-800 uppercase tracking-widest">Sai Yogi Crackers</h2>
        <p className="mb-8 text-base md:text-lg text-gray-600 font-medium">Oops! The page you are looking for was not found.</p>
        <Link 
          to="/" 
          className="bg-[#7A1416] text-white px-8 py-3 rounded font-bold uppercase tracking-wide hover:bg-red-800 transition-colors shadow-sm inline-flex items-center gap-2"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
