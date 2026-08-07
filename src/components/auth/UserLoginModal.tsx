import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Phone, Lock, ArrowRight, RefreshCw, CheckCircle2, ShieldCheck, X, LogOut, User, Crown, Gift, Sparkles, ChevronRight, ShoppingBag, Smartphone } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface UserLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (phone: string, name?: string) => void;
}

export const UserLoginModal: React.FC<UserLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { isUserLoggedIn, userPhone, logoutUser } = useAuth();
  const { setIsCartOpen } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [name, setName] = useState(localStorage.getItem("user_name") || "");
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
      setError("");
      setTimer(30);
      setIsResendDisabled(true);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validatePhone = (inputPhone: string) => {
    // Standard Indian 10 digit mobile number starting with 6,7,8,9
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

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setError("Please enter your mobile number");
      return;
    }

    if (phone.length !== 10 || !validatePhone(phone)) {
      setError("Please enter a valid 10-digit mobile number (e.g. 9876543210)");
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep("otp");
      setTimer(30);
      setIsResendDisabled(true);
      toast.success(`OTP sent to +91 ${phone}`, {
        description: `Your 6-digit verification code is: ${code}`,
        duration: 15000,
      });
    }, 600);
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-3xl border-0 shadow-2xl bg-[#F7F5F0] [&>button]:hidden">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-[#7A1416] via-[#A80000] to-[#7A1416] text-white p-5 relative">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-6 h-6 text-[#F4C542]" />
            </div>
            <div>
              <DialogTitle className="text-base font-black uppercase tracking-wide text-white leading-tight">
                Sai Yogi Crackers
              </DialogTitle>
              <DialogDescription className="text-[10px] text-amber-300 font-bold tracking-wider uppercase">
                Celebrate Every Moment ✨
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 bg-[#F7F5F0]">
          {isUserLoggedIn ? (
            <div className="space-y-4 font-sans">
              {/* Profile Card */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-md text-center relative overflow-hidden">
                {/* Clean Avatar */}
                <div className="relative inline-block mx-auto mb-2">
                  <div className="w-20 h-20 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center shadow-md">
                    <User className="w-10 h-10 text-[#7A1416]" />
                  </div>
                </div>

                <h3 className="text-2xl font-black text-gray-900 tracking-tight">User Profile</h3>

                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-3 mt-1">
                  Registered Mobile Number
                </p>

                {/* Mobile Number Box */}
                <div className="bg-red-50/70 border border-red-100 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#7A1416] text-white flex items-center justify-center shadow-sm">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="text-base sm:text-lg font-black text-gray-900 tracking-wider">
                      +91 {userPhone || "98765 43210"}
                    </span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Active Session</span>
                  </span>
                </div>
              </div>

              {/* Middle Festive Banner */}
              <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-red-100 text-[#7A1416] flex items-center justify-center shrink-0 shadow-2xs border border-red-200/50">
                    <Gift className="w-6 h-6 text-[#7A1416]" />
                  </div>
                  <div>
                    <h4 className="font-display font-black text-gray-900 text-sm leading-snug">
                      Thank you for being with Sai Yogi Crackers!
                    </h4>
                    <p className="text-xs text-amber-900/80 font-semibold mt-0.5">
                      Light up more celebrations with us
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block text-amber-500 text-2xl shrink-0">
                  🎆
                </div>
              </div>

              {/* Action Cards Grid: My Account & My Enquiry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* My Account Card */}
                <button
                  onClick={() => {
                    onClose();
                    navigate("/my-account");
                  }}
                  className="bg-white hover:bg-red-50/40 border border-gray-200/80 rounded-2xl p-4 flex items-center justify-between text-left transition-all group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-[#7A1416] border border-red-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <User className="w-5 h-5 text-[#7A1416]" />
                    </div>
                    <div>
                      <h5 className="font-black text-gray-900 text-sm">My Account</h5>
                      <p className="text-[11px] text-gray-500 font-medium">View & edit your details</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#7A1416] transition-colors" />
                </button>

                {/* My Enquiry Card */}
                <button
                  onClick={() => {
                    onClose();
                    navigate("/my-enquiry");
                  }}
                  className="bg-white hover:bg-red-50/40 border border-gray-200/80 rounded-2xl p-4 flex items-center justify-between text-left transition-all group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-[#7A1416] border border-red-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <ShoppingBag className="w-5 h-5 text-[#7A1416]" />
                    </div>
                    <div>
                      <h5 className="font-black text-gray-900 text-sm">My Enquiry</h5>
                      <p className="text-[11px] text-gray-500 font-medium">Track your enquiries</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#7A1416] transition-colors" />
                </button>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full py-3 bg-white hover:bg-red-50 text-gray-700 hover:text-red-700 border border-gray-200 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs mt-2"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                <span>Logout Account</span>
              </button>
            </div>
          ) : step === "phone" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-gray-900 text-sm uppercase tracking-wide">
                  WhatsApp Mobile Verification
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Please enter your WhatsApp mobile number. A 6-digit verification code will be sent to verify your account.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-red-900 font-semibold text-xs mb-1 block">
                  WhatsApp Mobile Number *
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-gray-100 border border-gray-300 rounded-md text-xs font-black text-gray-700">
                    +91
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    autoFocus
                    className={`flex-1 border ${
                      error ? "border-red-500 bg-red-50/20" : "border-red-200 focus:border-red-500"
                    } bg-white h-10 px-3 text-xs font-bold rounded-md focus:outline-none transition-all`}
                  />
                </div>
                {error && <p className="text-xs text-red-600 font-bold mt-1.5">{error}</p>}
              </div>

              <div className="space-y-3 pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSubmitting || phone.length !== 10}
                  className="w-full bg-[#00a859] hover:bg-[#008f4c] text-white font-bold tracking-wider py-3.5 rounded-md uppercase text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    "SEND VERIFICATION CODE"
                  )}
                </button>
                <p className="text-center text-[11px] text-gray-500 font-normal">
                  * By continuing, you agree to Sai Yogi Crackers Terms of Service & Privacy Policy.
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-gray-900 text-sm uppercase tracking-wide">
                  Enter Verification Code
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  We sent a 6-digit verification code to <strong className="text-gray-900 font-black">+91 {phone}</strong>.
                </p>
                <div className="bg-emerald-100/90 border border-emerald-300/60 px-3.5 py-1.5 rounded-lg text-emerald-950 text-xs font-black tracking-widest mt-1 shadow-xs">
                  DEMO CODE: {generatedOtp || "1234"}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-red-900 font-semibold text-xs mb-1 block">
                  6-Digit Verification Code *
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
                  className={`w-full border ${
                    error ? "border-red-500 bg-red-50/20" : "border-red-200 focus:border-red-500"
                  } bg-white h-11 text-center font-black tracking-widest text-lg rounded-md focus:outline-none transition-all`}
                />
              </div>

              {/* Name Input Below OTP */}
              <div className="space-y-1.5">
                <label className="text-red-900 font-semibold text-xs mb-1 block">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Enter your full name"
                  className="w-full border border-red-200 focus:border-red-500 bg-white h-10 px-3 text-xs font-semibold rounded-md focus:outline-none transition-all"
                  required
                />
              </div>

              <div className="flex justify-between items-center text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setError("");
                  }}
                  className="text-red-700 font-bold hover:underline cursor-pointer"
                >
                  ← Change Phone Number
                </button>
                {isResendDisabled ? (
                  <span className="text-gray-400 font-bold">Resend Code in {timer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    Resend Code
                  </button>
                )}
              </div>

              {error && <p className="text-xs text-red-600 font-bold mt-1.5">{error}</p>}

              <div className="space-y-3 pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#00a859] hover:bg-[#008f4c] text-white font-bold tracking-wider py-3.5 rounded-md uppercase text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    "VERIFY CODE & CONTINUE"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
