import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { 
  Phone, 
  MessageSquare, 
  ChevronDown, 
  X, 
  ShieldCheck, 
  RefreshCw, 
  User, 
  CheckCircle2, 
  LogOut, 
  ShoppingBag, 
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getCustomers } from "@/lib/api";

interface UserLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (phone: string, name?: string) => void;
}

export const UserLoginModal: React.FC<UserLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { isUserLoggedIn, userPhone, userName, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(30);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer for OTP resend
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === "otp" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Reset modal state on open/close
  useEffect(() => {
    if (!isOpen) {
      setStep("phone");
      setPhone("");
      setOtp("");
      setGeneratedOtp("");
      setName("");
      setError("");
      setTimer(30);
      setIsResendDisabled(true);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validatePhone = (inputPhone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(inputPhone);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val.length <= 10) {
      setPhone(val);
      if (error) setError("");
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setError("Please enter your mobile number");
      return;
    }

    if (phone.length !== 10 || !validatePhone(phone)) {
      setError("Please enter a valid 10-digit mobile number (e.g. 9876543210)");
      return;
    }

    setIsSubmitting(true);

    try {
      const localTracks = JSON.parse(localStorage.getItem("local_customer_tracks") || "{}");
      const existingLocal = localTracks[phone];
      let foundName = "";
      if (existingLocal && existingLocal.name && existingLocal.name !== "Customer") {
        foundName = existingLocal.name;
      } else {
        const customers = await getCustomers();
        const existingApi = customers.find(c => String(c.phone).replace(/\D/g, "").slice(-10) === phone);
        if (existingApi && existingApi.name && existingApi.name !== "Customer") {
          foundName = existingApi.name;
        }
      }
      if (foundName) {
        setName(foundName);
      }
    } catch (err) {
      console.warn("Failed to check existing customer", err);
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    
    setTimeout(() => {
      setIsSubmitting(false);
      setStep("otp");
      setTimer(30);
      setIsResendDisabled(true);
      toast.success(`OTP sent to +91 ${phone}`, {
        description: `Your 6-digit verification code is: ${code}`,
        duration: 15000,
      });
    }, 400);
  };

  const handleResendOtp = () => {
    if (isResendDisabled) return;
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setTimer(30);
    setIsResendDisabled(true);
    toast.success(`New OTP sent to +91 ${phone}`, {
      description: `Your 6-digit verification code is: ${code}`,
      duration: 15000,
    });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the OTP");
      return;
    }

    if (otp.trim() !== generatedOtp && otp.trim() !== "1234") {
      setError("Invalid verification code. Please check and try again.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter your full name");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success("Login Successful! Welcome to Sai Yogi Crackers.");
      onSuccess(phone, name.trim());
      onClose();
    }, 600);
  };

  const handleLogout = () => {
    logoutUser();
    toast.success("Logged out successfully");
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="top" 
        className="p-0 border-b-0 rounded-b-[28px] sm:rounded-b-[36px] bg-white max-w-xl sm:max-w-2xl mx-auto overflow-hidden shadow-2xl [&>button]:hidden flex flex-col max-h-[90vh]"
      >
        {/* Top Header Bar */}
        <div className="relative flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100 shrink-0">
          <div className="w-8" />
          
          <SheetTitle className="text-base sm:text-lg font-black tracking-widest text-[#A80000] uppercase text-center flex-1">
            {isUserLoggedIn ? "MY ACCOUNT" : step === "phone" ? "LOGIN" : "VERIFY OTP"}
          </SheetTitle>

          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-full hover:bg-red-50 text-[#A80000] hover:text-[#7A1416] transition-colors cursor-pointer border-0 shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
          {isUserLoggedIn ? (
            /* LOGGED IN USER PROFILE VIEW */
            <div className="space-y-4 font-sans max-w-md mx-auto">
              <div className="bg-red-50/60 rounded-2xl p-4 border border-red-100 text-center relative overflow-hidden">
                <div className="relative inline-block mx-auto mb-2">
                  <div className="w-14 h-14 rounded-full bg-red-100 border-2 border-red-200 flex items-center justify-center shadow-xs">
                    <User className="w-7 h-7 text-[#7A1416]" />
                  </div>
                </div>

                <h3 className="text-lg font-black text-gray-900 tracking-tight">
                  {userName || localStorage.getItem("user_name") || "User"}
                </h3>

                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2 mt-0.5">
                  Registered Mobile Number
                </p>

                <div className="bg-white border border-red-200 rounded-xl p-3 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#7A1416] text-white flex items-center justify-center shadow-xs shrink-0">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-black text-gray-900 tracking-wider">
                      +91 {userPhone || "98765 43210"}
                    </span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Active</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    onClose();
                    navigate("/my-account");
                  }}
                  className="bg-white hover:bg-red-50/50 border border-gray-200 hover:border-red-200 rounded-xl p-3 flex items-center justify-between text-left transition-all group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-[#7A1416] border border-red-100 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-[#7A1416]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-black text-gray-900 text-xs truncate">My Account</h5>
                      <p className="text-[10px] text-gray-500 font-medium truncate">View details</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#7A1416] transition-colors shrink-0" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    navigate("/my-enquiry");
                  }}
                  className="bg-white hover:bg-red-50/50 border border-gray-200 hover:border-red-200 rounded-xl p-3 flex items-center justify-between text-left transition-all group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-[#7A1416] border border-red-100 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-4 h-4 text-[#7A1416]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-black text-gray-900 text-xs truncate">My Enquiry</h5>
                      <p className="text-[10px] text-gray-500 font-medium truncate">Track enquiries</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#7A1416] transition-colors shrink-0" />
                </button>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full py-3 bg-white hover:bg-red-50 text-gray-700 hover:text-red-700 border border-gray-200 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                <span>Logout Account</span>
              </button>
            </div>
          ) : step === "phone" ? (
            /* STEP 1: PHONE NUMBER INPUT - BOTTOM SHEET WITH ORIGINAL BRAND RED COLORS */
            <form onSubmit={handleSendOtp} className="space-y-4 font-sans max-w-lg mx-auto">
              <div className="text-center">
                <label className="text-slate-700 font-semibold text-xs sm:text-sm text-center mb-3 block">
                  Whatsapp Number <span className="text-red-500">*</span>
                </label>

                {/* Pill Shaped Input Box */}
                <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] focus-within:border-[#A80000] focus-within:ring-2 focus-within:ring-[#A80000]/20 rounded-xl sm:rounded-2xl overflow-hidden transition-all shadow-2xs max-w-lg mx-auto">
                  {/* +91 Badge */}
                  <div className="bg-red-50/80 text-[#7A1416] font-bold text-xs sm:text-sm px-3.5 sm:px-4 py-3 border-r border-[#E2E8F0] flex items-center gap-1.5 shrink-0 select-none">
                    <span>+91</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#7A1416]" />
                  </div>

                  {/* Input Field */}
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="Whatsapp Number"
                    maxLength={10}
                    autoFocus
                    className="flex-1 bg-transparent text-slate-800 text-xs sm:text-sm font-semibold px-3.5 sm:px-4 py-3 outline-none focus:outline-none placeholder:text-slate-400 placeholder:font-medium"
                  />
                </div>

                {error && <p className="text-xs text-red-600 font-bold mt-2 text-center">{error}</p>}
              </div>

              {/* Action Button: SEND OTP */}
              <div className="pt-2 flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmitting || phone.length !== 10}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#7A1416] via-[#A80000] to-[#7A1416] hover:opacity-95 text-white font-extrabold tracking-wider py-3.5 px-8 sm:px-12 rounded-xl sm:rounded-2xl uppercase text-xs sm:text-sm shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-all min-w-[200px]"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4 text-white fill-white/20" />
                      <span>SEND OTP</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-center text-[10px] sm:text-xs text-slate-400 font-medium pt-1">
                * A 6-digit verification code will be sent to your WhatsApp number.
              </p>
            </form>
          ) : (
            /* STEP 2: OTP & NAME INPUT */
            <form onSubmit={handleVerifyOtp} className="space-y-4 font-sans max-w-lg mx-auto">
              <div className="text-center space-y-1.5">
                <p className="text-xs sm:text-sm text-slate-600 font-semibold">
                  Enter verification code sent to <strong className="text-slate-900 font-black">+91 {phone}</strong>
                </p>
                <div className="bg-amber-100 text-amber-950 font-black text-xs px-3.5 py-1 rounded-full border border-amber-300 inline-block">
                  DEMO CODE: {generatedOtp || "1234"}
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-slate-700 font-semibold text-xs mb-1 block text-left">
                    6-Digit Verification Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 6) {
                        setOtp(val);
                        if (error) setError("");
                      }
                    }}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    autoFocus
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#A80000] focus:ring-2 focus:ring-[#A80000]/20 h-11 px-4 text-center font-black tracking-widest text-base sm:text-lg rounded-xl sm:rounded-2xl outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold text-xs mb-1 block text-left">
                    Your Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Enter your full name"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#A80000] focus:ring-2 focus:ring-[#A80000]/20 h-11 px-4 text-xs sm:text-sm font-semibold rounded-xl sm:rounded-2xl outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setName("");
                    setError("");
                  }}
                  className="text-[#A80000] font-bold hover:underline cursor-pointer"
                >
                  ← Change Number
                </button>
                {isResendDisabled ? (
                  <span className="text-slate-400 font-bold">Resend in {timer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-[#A80000] font-bold hover:underline cursor-pointer"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              {error && <p className="text-xs text-red-600 font-bold text-center mt-1">{error}</p>}

              <div className="pt-2 flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#7A1416] via-[#A80000] to-[#7A1416] hover:opacity-95 text-white font-extrabold tracking-wider py-3.5 px-8 sm:px-12 rounded-xl sm:rounded-2xl uppercase text-xs sm:text-sm shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-all min-w-[200px]"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-white" />
                      <span>VERIFY CODE &amp; CONTINUE</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UserLoginModal;
