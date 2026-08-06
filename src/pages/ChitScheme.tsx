import React, { useState } from "react";
import { ShieldCheck, Gift, Calendar, TrendingUp, HelpCircle, CheckCircle, ChevronDown } from "lucide-react";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { toast } from "sonner";

interface SchemePlan {
  name: string;
  monthlyAmount: number;
  months: number;
  totalPaid: number;
  bonusAmount: number;
  totalReturn: number;
  tag: string;
  perks: string[];
}

const SCHEME_PLANS: SchemePlan[] = [
  {
    name: "Silver Plan",
    monthlyAmount: 500,
    months: 10,
    totalPaid: 5000,
    bonusAmount: 500,
    totalReturn: 5500,
    tag: "Budget Friendly",
    perks: [
      "Assorted Ground Crackers & Sparklers Box",
      "Diwali sweets voucher value of ₹250",
      "Guaranteed early delivery before Diwali",
    ],
  },
  {
    name: "Gold Plan",
    monthlyAmount: 1000,
    months: 10,
    totalPaid: 10000,
    bonusAmount: 1200,
    totalReturn: 11200,
    tag: "Most Popular",
    perks: [
      "Deluxe Aerial Shots & Fancy Crackers Box",
      "Diwali sweets voucher value of ₹500",
      "Free home delivery across Tamil Nadu",
      "Priority customer support",
    ],
  },
  {
    name: "Platinum Plan",
    monthlyAmount: 2000,
    months: 10,
    totalPaid: 20000,
    bonusAmount: 2800,
    totalReturn: 22800,
    tag: "Best Value",
    perks: [
      "Premium Mega Gift Box (75+ items)",
      "High-altitude multi-color sky shots pack",
      "Diwali sweets voucher value of ₹1,000",
      "Free door delivery all over South India",
      "Custom item replacement options",
    ],
  },
];

const FAQS = [
  {
    q: "How does the Sai Yogi Crackers Savings Scheme work?",
    a: "It's simple: you choose a monthly budget (₹500, ₹1000, or ₹2000) and pay for 10 consecutive months. At the end of the term, we add a generous bonus value, and you get to pick a premium Sivakasi crackers pack worth the entire amount plus the bonus!",
  },
  {
    q: "When can I collect my crackers?",
    a: "You can collect your cracker packages starting 15 days before Diwali. If you choose home delivery (available for Gold and Platinum plans), your packages will be dispatched early to avoid festive rush.",
  },
  {
    q: "Can I choose my own crackers or is it a pre-packed gift box?",
    a: "Yes! While we offer expert-curated value boxes corresponding to your plan, you also have the option to visit our catalog and select custom products matching your total return value.",
  },
  {
    q: "What if I miss a monthly payment?",
    a: "Don't worry. You can catch up on missed payments in the following month. To qualify for the full bonus, all 10 payments must be completed before the scheme closing date (3 weeks prior to Diwali).",
  },
  {
    q: "Is my money safe and guaranteed?",
    a: "Absolutely. Sai Yogi Crackers is a registered manufacturer and distributor with wholesale licenses. We guarantee 100% genuine and high-quality Sivakasi crackers for every single scheme member.",
  },
];

const ChitScheme = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    state: "Tamil Nadu",
    plan: "Gold Plan (₹1,000/month)",
    message: "",
  });

  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [calcMonthly, setCalcMonthly] = useState(1000);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error("Please fill in your name and phone number");
      return;
    }
    toast.success(`Enquiry submitted successfully! Our representative will call you on ${formData.phone} within 24 hours.`);
    setFormData({
      name: "",
      phone: "",
      state: "Tamil Nadu",
      plan: "Gold Plan (₹1,000/month)",
      message: "",
    });
  };

  // Calculator Logic
  const getCalcReturns = () => {
    const totalPaid = calcMonthly * 10;
    let bonusRate = 0.10;
    if (calcMonthly >= 2000) bonusRate = 0.14;
    else if (calcMonthly >= 1000) bonusRate = 0.12;
    const bonus = Math.round(totalPaid * bonusRate);
    return {
      paid: totalPaid,
      bonus: bonus,
      total: totalPaid + bonus,
    };
  };

  const calcResult = getCalcReturns();

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] font-sans text-gray-900 antialiased">
      <UserHeader />

      {/* Hero Section */}
      <section className="relative w-full h-[280px] md:h-[400px] bg-black overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img
            src="/fireworks_bg.png"
            alt="Diwali savings banner"
            className="w-full h-full object-cover opacity-60"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1533230898524-411517f83021?auto=format&fit=crop&q=80&w=1920";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/60" />
        </div>

        <div className="container relative z-10 text-center px-4 max-w-4xl">
          <span className="bg-[#F4C542] text-[#1A1A1A] text-[10px] font-black px-4 py-1.5 uppercase tracking-widest mb-4 inline-block rounded-full shadow-md animate-bounce">
            ✨ Diwali Savings Scheme 2026 ✨
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-4 drop-shadow-md leading-tight">
            Sai Yogi <span className="text-[#F4C542]">Diwali Cracker Chit</span>
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto font-medium leading-relaxed">
            Plan your celebrations in advance. Save monthly for 10 months and get premium cracker boxes with massive bonuses and free home delivery.
          </p>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-start gap-4 p-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-[#7A1416] shrink-0 border border-red-100">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase text-gray-800 tracking-wide mb-1">Heavy Bonus</h3>
                <p className="text-xs text-gray-500 font-medium">Get up to 15% extra bonus value added to your paid savings amount.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-[#7A1416] shrink-0 border border-red-100">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase text-gray-800 tracking-wide mb-1">Easy 10 Months</h3>
                <p className="text-xs text-gray-500 font-medium">Split the festival budget into simple, easy monthly payments.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-[#7A1416] shrink-0 border border-red-100">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase text-gray-800 tracking-wide mb-1">100% Genuine</h3>
                <p className="text-xs text-gray-500 font-medium">Premium quality fireworks sourced directly from top Sivakasi factories.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-[#7A1416] shrink-0 border border-red-100">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase text-gray-800 tracking-wide mb-1">Gift Vouchers</h3>
                <p className="text-xs text-gray-500 font-medium">Get complimentary festival sweet boxes and discount vouchers.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Comparison */}
      <section className="py-16 container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="font-black text-[#7A1416] text-3xl sm:text-4xl uppercase tracking-tight mb-2 drop-shadow-2xs">
            Choose Your Savings Plan
          </h2>
          <div className="w-24 h-1 bg-[#7A1416] mx-auto rounded-full mb-3"></div>
          <p className="text-gray-600 text-sm max-w-xl mx-auto font-medium">
            We offer multiple slabs to suit every budget. Select a monthly contribution and unlock your Diwali festival pack.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {SCHEME_PLANS.map((plan, index) => (
            <div
              key={index}
              className={`bg-white border rounded-3xl p-6 shadow-md transition-all duration-300 hover:scale-102 hover:shadow-xl flex flex-col justify-between relative overflow-hidden ${
                index === 1 ? "border-[#F4C542] ring-2 ring-[#F4C542]/20" : "border-gray-200"
              }`}
            >
              {index === 1 && (
                <span className="absolute top-3 right-3 bg-[#F4C542] text-[#1A1A1A] text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {plan.tag}
                </span>
              )}

              <div>
                <h3 className="font-black text-lg text-gray-800 uppercase tracking-wide mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1.5 my-4">
                  <span className="text-3xl font-black text-[#7A1416]">₹ {plan.monthlyAmount}</span>
                  <span className="text-xs text-gray-500 font-bold">/ Month</span>
                </div>
                <div className="bg-[#F7F5F0] p-4 rounded-2xl mb-6">
                  <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                    <span>Total Paid (10 Months):</span>
                    <span>₹ {plan.totalPaid}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black text-emerald-600 mb-1">
                    <span>Sai Yogi Bonus:</span>
                    <span>+ ₹ {plan.bonusAmount}</span>
                  </div>
                  <div className="border-t border-gray-200 my-2 pt-2 flex justify-between text-sm font-black text-gray-900">
                    <span>Total Crackers Value:</span>
                    <span className="text-[#7A1416]">₹ {plan.totalReturn}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider">Included Benefits:</h4>
                  {plan.perks.map((perk, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-600 font-semibold">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              <a
                href="#enquiry-form"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    plan: `${plan.name} (₹${plan.monthlyAmount}/month)`
                  }));
                }}
                className={`w-full py-3.5 rounded-xl font-black text-xs text-center uppercase tracking-widest transition-all duration-300 ${
                  index === 1
                    ? "bg-[#7A1416] text-white hover:bg-red-800"
                    : "bg-[#F7F5F0] text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                Enroll / Enquire Now
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Calculator Section */}
      <section className="py-16 bg-gradient-to-b from-white to-[#FFF6E5]">
        <div className="container mx-auto px-4 max-w-4xl bg-white border border-[#F4C542]/40 rounded-3xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <h2 className="font-black text-[#7A1416] text-2xl uppercase tracking-tight mb-2">
              Savings & Returns Calculator
            </h2>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
              Move the slider to see your returns & free cracker bonuses!
            </p>
          </div>

          <div className="space-y-8 max-w-xl mx-auto">
            {/* Slider */}
            <div className="space-y-3">
              <div className="flex justify-between font-black text-sm text-gray-800">
                <span>Monthly Savings Amount:</span>
                <span className="text-[#7A1416] text-lg">₹ {calcMonthly}</span>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="100"
                value={calcMonthly}
                onChange={(e) => setCalcMonthly(parseInt(e.target.value))}
                className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#7A1416]"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                <span>Min: ₹ 500</span>
                <span>Max: ₹ 5,000</span>
              </div>
            </div>

            {/* Calculations display */}
            <div className="grid grid-cols-3 gap-4 bg-[#F7F5F0] p-5 rounded-2xl text-center">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">You Save (10m)</p>
                <p className="font-black text-lg text-gray-800">₹ {calcResult.paid}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#2e7d32] font-black uppercase tracking-wider mb-1">Free Bonus</p>
                <p className="font-black text-lg text-emerald-600">+ ₹ {calcResult.bonus}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Total Crackers</p>
                <p className="font-black text-lg text-[#7A1416]">₹ {calcResult.total}</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-[10px] text-gray-400 font-medium italic">
                * Note: Silver Plan (₹500) receives 10% bonus, Gold Plan (₹1000+) receives 12% bonus, and plans above ₹2000 receive 14% bonus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enquiry Form */}
      <section id="enquiry-form" className="py-16 container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
          {/* Left: Info Card */}
          <div className="bg-[#7A1416] p-8 text-white flex flex-col justify-between">
            <div>
              <h3 className="font-display text-2xl font-black uppercase tracking-wide mb-3">Join The Scheme</h3>
              <p className="text-sm text-red-100 font-medium leading-relaxed mb-6">
                Fill out the quick enquiry sheet, and our Sivakasi scheme coordinates team will call you to complete registration and explain payment schedules.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#F4C542] text-xs font-bold">1</span>
                  <span className="text-xs font-bold">No hidden charges or registration fees</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#F4C542] text-xs font-bold">2</span>
                  <span className="text-xs font-bold">Digital receipts issued for every payment</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#F4C542] text-xs font-bold">3</span>
                  <span className="text-xs font-bold">Option to change plans in the first 2 months</span>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 text-xs text-red-200">
              📞 Questions? Call us directly: <span className="text-white font-black hover:underline cursor-pointer">+91 98765 43210</span>
            </div>
          </div>

          {/* Right: Form */}
          <div className="p-8">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-500 font-black uppercase tracking-wider block mb-1">Your Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#7A1416] transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-black uppercase tracking-wider block mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter 10-digit number"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#7A1416] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-wider block mb-1">State</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#7A1416] transition-colors"
                  >
                    <option>Tamil Nadu</option>
                    <option>Andhra Pradesh</option>
                    <option>Karnataka</option>
                    <option>Kerala</option>
                    <option>Puducherry</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-wider block mb-1">Target Plan</label>
                  <select
                    name="plan"
                    value={formData.plan}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#7A1416] transition-colors"
                  >
                    <option>Silver Plan (₹500/month)</option>
                    <option>Gold Plan (₹1,000/month)</option>
                    <option>Platinum Plan (₹2,000/month)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-black uppercase tracking-wider block mb-1">Custom Notes / Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Mention preferred contact time or questions..."
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#7A1416] transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#7A1416] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-800 transition-colors shadow-md active:scale-98"
              >
                Submit Savings Enquiry
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="font-black text-[#7A1416] text-2xl uppercase tracking-tight mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
              Have doubts? Find quick answers about the chit scheme policies.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/50">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-100/50 transition-colors"
                >
                  <span className="font-black text-sm text-gray-800">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${
                      activeFaq === idx ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-6 pb-4 pt-1 text-xs text-gray-600 font-semibold leading-relaxed border-t border-gray-100 bg-white">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <UserFooter />
    </div>
  );
};

export default ChitScheme;
