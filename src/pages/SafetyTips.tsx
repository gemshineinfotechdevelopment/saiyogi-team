import React, { useState } from "react";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { 
  Bell, 
  Sparkles, 
  BookOpen, 
  MapPin, 
  Droplet, 
  MoveRight, 
  Eye, 
  RefreshCw, 
  AlertTriangle, 
  ZapOff, 
  Trash2, 
  ShieldAlert, 
  Award, 
  AlertCircle,
  ShieldCheck,
  ShieldAlert as AlertShield,
  Briefcase
} from "lucide-react";

const SafetyTips = () => {
  const [activeTab, setActiveTab] = useState<'dos' | 'donts' | 'essentials'>('dos');

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-gray-800">
      <UserHeader />

      <main className="container mx-auto px-4 py-12 max-w-6xl flex-1">
        
        {/* Beautiful Header Banner */}
        <div className="bg-gradient-to-br from-[#A80000] via-[#5c0a0b] to-[#1A1A1A] text-center py-16 px-6 rounded-3xl mb-12 relative overflow-hidden border border-[#F4C542]/20 shadow-xl">
          <div className="absolute top-0 left-10 w-24 h-24 bg-[#F4C542]/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-0 right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <span className="text-[#F4C542] text-xs font-black tracking-widest uppercase mb-2 inline-block">✨ Celebrate Responsibly ✨</span>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-wider mb-4 font-display">Safety Guidelines</h1>
          <p className="text-gray-200 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
            Ensure a safe, joyful, and memorable festival of lights for your family by strictly following these essential guidelines.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-12 bg-gray-50 border border-gray-150 p-2.5 rounded-3xl max-w-2xl mx-auto shadow-inner">
          <button
            onClick={() => setActiveTab('dos')}
            className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'dos'
                ? "bg-green-600 text-white shadow-md scale-105"
                : "text-gray-600 hover:text-green-600 hover:bg-green-50/50"
            }`}
          >
            <ShieldCheck className="h-4 w-4" /> Things to Do
          </button>
          
          <button
            onClick={() => setActiveTab('donts')}
            className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'donts'
                ? "bg-[#A80000] text-white shadow-md scale-105"
                : "text-gray-600 hover:text-[#A80000] hover:bg-red-50/50"
            }`}
          >
            <AlertShield className="h-4 w-4" /> Things to Avoid
          </button>
          
          <button
            onClick={() => setActiveTab('essentials')}
            className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'essentials'
                ? "bg-[#F4C542] text-gray-900 shadow-md scale-105"
                : "text-gray-600 hover:text-[#A37B0C] hover:bg-amber-50/50"
            }`}
          >
            <Briefcase className="h-4 w-4" /> Safety Kit
          </button>
        </div>

        {/* TAB 1: DO'S */}
        {activeTab === 'dos' && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-8 justify-center">
              <span className="h-1.5 w-12 bg-green-500 rounded-full"></span>
              <h2 className="text-xl md:text-2xl font-black uppercase text-green-700 tracking-wider">The Golden Do's</h2>
              <span className="h-1.5 w-12 bg-green-500 rounded-full"></span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border border-green-200/50 p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left">
                <div className="bg-green-100 text-green-700 w-11 h-11 rounded-xl flex items-center justify-center mb-4 border border-green-200/30">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-sm text-green-950 uppercase tracking-wide mb-1">01. Read Instructions</h3>
                <p className="text-xs text-green-800 leading-relaxed font-semibold font-medium">Carefully read and follow instructions printed on every firework before igniting.</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border border-green-200/50 p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left">
                <div className="bg-[#FFF6E5] text-[#A80000] w-11 h-11 rounded-xl flex items-center justify-center mb-4 border border-[#F4C542]/20">
                  <MapPin className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-sm text-green-955 uppercase tracking-wide mb-1">02. Open Outdoor Spaces</h3>
                <p className="text-xs text-green-800 leading-relaxed font-semibold font-medium">Use fireworks only in open outdoor spaces, away from dry grass, buildings, or vehicles.</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border border-green-200/50 p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left">
                <div className="bg-green-100 text-green-700 w-11 h-11 rounded-xl flex items-center justify-center mb-4 border border-green-200/30">
                  <Droplet className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-sm text-green-955 uppercase tracking-wide mb-1">03. Keep Water Nearby</h3>
                <p className="text-xs text-green-800 leading-relaxed font-semibold font-medium">Always keep a bucket of water, wet sand, or a garden hose ready for immediate emergencies.</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border border-green-200/50 p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left">
                <div className="bg-green-150 text-green-700 w-11 h-11 rounded-xl flex items-center justify-center mb-4 border border-green-200/30">
                  <MoveRight className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-sm text-green-955 uppercase tracking-wide mb-1">04. Maintain Distance</h3>
                <p className="text-xs text-green-800 leading-relaxed font-semibold font-medium">Ignite only one firework at a time, and retreat to a safe distance immediately after lighting.</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border border-green-200/50 p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left">
                <div className="bg-green-150 text-green-700 w-11 h-11 rounded-xl flex items-center justify-center mb-4 border border-green-200/30">
                  <Eye className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-sm text-green-955 uppercase tracking-wide mb-1">05. Point Safely Away</h3>
                <p className="text-xs text-green-800 leading-relaxed font-semibold font-medium">Ensure fireworks are aimed away from buildings, houses, dry bushes, and bystanders.</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border border-green-200/50 p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left">
                <div className="bg-green-150 text-green-700 w-11 h-11 rounded-xl flex items-center justify-center mb-4 border border-green-200/30">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-sm text-green-955 uppercase tracking-wide mb-1">06. Safe Disposal</h3>
                <p className="text-xs text-green-800 leading-relaxed font-semibold font-medium">Soak all spent firecracker remnants completely in water before discarding to avoid rekindling.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DON'TS */}
        {activeTab === 'donts' && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-8 justify-center">
              <span className="h-1.5 w-12 bg-red-500 rounded-full"></span>
              <h2 className="text-xl md:text-2xl font-black uppercase text-red-700 tracking-wider">Critical Don'ts</h2>
              <span className="h-1.5 w-12 bg-red-500 rounded-full"></span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-red-50 to-rose-50/50 border border-red-200/50 p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left">
                <div className="bg-red-100 text-red-700 w-11 h-11 rounded-xl flex items-center justify-center mb-4 border border-red-200/30">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-sm text-red-955 uppercase tracking-wide mb-1">01. No Child Solos</h3>
                <p className="text-xs text-red-800 leading-relaxed font-semibold font-medium">Never let children light or handle fireworks without close, active adult supervision.</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-rose-50/50 border border-red-200/50 p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left">
                <div className="bg-red-150 text-red-700 w-11 h-11 rounded-xl flex items-center justify-center mb-4 border border-red-200/30">
                  <ZapOff className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-sm text-red-955 uppercase tracking-wide mb-1">02. Never Relight Duds</h3>
                <p className="text-xs text-red-800 leading-relaxed font-semibold font-medium">Do not attempt to relight fireworks that failed to ignite. Wait 20 mins and soak in water.</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-rose-50/50 border border-red-200/50 p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left">
                <div className="bg-red-150 text-red-700 w-11 h-11 rounded-xl flex items-center justify-center mb-4 border border-red-200/30">
                  <Trash2 className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-sm text-red-955 uppercase tracking-wide mb-1">03. No Throwing</h3>
                <p className="text-xs text-red-800 leading-relaxed font-semibold font-medium">Never target, throw, or aim fireworks towards other people, pets, or parked vehicles.</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-rose-50/50 border border-red-200/50 p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left">
                <div className="bg-[#FFF6E5] text-[#A80000] w-11 h-11 rounded-xl flex items-center justify-center mb-4 border border-[#F4C542]/20">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-sm text-red-955 uppercase tracking-wide mb-1">04. No Intoxication</h3>
                <p className="text-xs text-red-800 leading-relaxed font-semibold font-medium">Never handle fireworks under the influence of alcohol or substances that affect safety judgment.</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-rose-50/50 border border-red-200/50 p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left">
                <div className="bg-red-150 text-red-700 w-11 h-11 rounded-xl flex items-center justify-center mb-4 border border-red-200/30">
                  <Award className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-sm text-red-955 uppercase tracking-wide mb-1">05. No Modifications</h3>
                <p className="text-xs text-red-800 leading-relaxed font-semibold font-medium">Do not dismantle, alter, or attempt to make homemade fireworks. Stick to brand items.</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-rose-50/50 border border-red-200/50 p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left">
                <div className="bg-red-150 text-red-700 w-11 h-11 rounded-xl flex items-center justify-center mb-4 border border-red-200/30">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-sm text-red-955 uppercase tracking-wide mb-1">06. No Pocket Storage</h3>
                <p className="text-xs text-red-800 leading-relaxed font-semibold font-medium">Never keep fireworks in pockets, and avoid igniting them inside metal or glass containers.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ESSENTIALS KIT & REMINDER */}
        {activeTab === 'essentials' && (
          <div className="animate-fade-in space-y-12">
            
            {/* Essentials Kit */}
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-black uppercase text-[#A80000] mb-2 tracking-widest font-display">Safety Essentials Kit</h2>
              <p className="text-xs text-gray-500 font-bold uppercase mb-8 tracking-wider">Keep these items ready before igniting any fireworks</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group hover:-translate-y-1">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3 border border-blue-100 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" /></svg>
                  </div>
                  <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-wide">Water Bucket</h3>
                  <p className="text-[10px] text-gray-400 font-semibold mt-1 leading-normal">To extinguish sparks & cool spent fireworks</p>
                </div>

                <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group hover:-translate-y-1">
                  <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mb-3 border border-yellow-100 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                  </div>
                  <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-wide">Sand Bucket</h3>
                  <p className="text-[10px] text-gray-400 font-semibold mt-1 leading-normal">For smothering dry firecracker sparks quickly</p>
                </div>

                <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group hover:-translate-y-1">
                  <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-3 border border-red-100 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="9" width="18" height="12" rx="2" /><path d="M12 5V9M10 7h4M12 13v4M10 15h4" /></svg>
                  </div>
                  <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-wide">First Aid Kit</h3>
                  <p className="text-[10px] text-gray-400 font-semibold mt-1 leading-normal">Equipped with burn creams & bandages</p>
                </div>

                <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group hover:-translate-y-1">
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-3 border border-green-100 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2"><path d="M20.38 3.46L16 2.03l-4.38 1.43L7.24 2 2 3.46V12c0 5.52 4.48 10 10 10s10-4.48 10-10V3.46z" /></svg>
                  </div>
                  <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-wide">Cotton Clothes</h3>
                  <p className="text-[10px] text-gray-400 font-semibold mt-1 leading-normal">Always wear thick cotton, avoid synthetics</p>
                </div>
              </div>
            </div>

            {/* Important Reminder (Gold Warning Alert Box) */}
            <div className="bg-gradient-to-br from-amber-50 to-[#FFF6E5] border border-[#F4C542]/30 p-8 rounded-3xl shadow-md relative overflow-hidden transition-all duration-300 hover:shadow-lg text-left">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#F4C542]/10 rounded-full blur-xl"></div>
              <div className="flex items-start gap-4">
                <div className="bg-[#F4C542]/20 text-[#A37B0C] p-2.5 rounded-2xl shadow-sm border border-[#F4C542]/30 shrink-0">
                  <Bell className="h-6 w-6 fill-current" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase text-amber-950 tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 fill-current animate-pulse text-[#F4C542]" />
                    Important Reminder
                  </h2>
                  <p className="text-amber-900/90 text-sm md:text-base font-semibold leading-relaxed tracking-wide">
                    Fireworks bring absolute joy when handled responsibly. Always prioritize child safety, adhere to instructions, and respect your local neighborhood guidelines. A little caution makes for a safer, brighter, and happier celebration for everyone!
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      <UserFooter />
    </div>
  );
};

export default SafetyTips;
