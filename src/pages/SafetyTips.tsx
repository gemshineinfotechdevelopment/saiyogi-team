import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { CheckCircle2, Ban, Bell } from "lucide-react";

const SafetyTips = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-[#7A1416]">
      <UserHeader />

      <main className="container mx-auto px-4 py-12 md:py-16 max-w-4xl flex-1">
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-black mb-6 uppercase tracking-wide">Safety Tips</h1>
          <p className="text-lg md:text-xl font-semibold">Celebrate Responsibly: Important Firework Safety Tips for a Safe and Memorable Festival</p>
        </div>

        <div className="space-y-12 pl-4 md:pl-8">
          {/* Things to Do */}
          <div>
            <div className="flex items-center gap-4 mb-6 -ml-8">
              <CheckCircle2 className="h-6 w-6 text-black" strokeWidth={3} />
              <h2 className="text-xl font-black uppercase">Things to Do</h2>
            </div>
            <div className="space-y-6 text-base md:text-lg font-bold tracking-wide">
              <p>1. Carefully read and follow the instructions printed on every firework before use.</p>
              <p>2. Use fireworks only in an open outdoor space, away from homes, trees, vehicles, and other combustible materials.</p>
              <p>3. Keep a bucket of water, sand, or a garden hose nearby in case of emergencies.</p>
              <p>4. Ignite one firework at a time and maintain a safe distance immediately after lighting it.</p>
              <p>5. Ensure fireworks are directed away from people, pets, buildings, and parked vehicles.</p>
              <p>6. After use, soak spent fireworks in water before disposing of them to prevent accidental fires.</p>
            </div>
          </div>

          {/* Things to Avoid */}
          <div>
            <div className="flex items-center gap-4 mb-6 -ml-8">
              <Ban className="h-6 w-6 text-black" strokeWidth={3} />
              <h2 className="text-xl font-black uppercase">Things to Avoid</h2>
            </div>
            <div className="space-y-6 text-base md:text-lg font-bold tracking-wide">
              <p>1. Never allow children to light or handle fireworks without close adult supervision.</p>
              <p>2. Do not try to relight fireworks that fail to ignite or appear defective.</p>
              <p>3. Avoid aiming or throwing fireworks toward people, animals, or property.</p>
              <p>4. Never use fireworks while under the influence of alcohol, drugs, or any substance that affects judgment.</p>
              <p>5. Do not alter, dismantle, or attempt to create homemade fireworks.</p>
              <p>6. Avoid carrying fireworks in your pockets or igniting them inside metal, glass, or other enclosed containers.</p>
            </div>
          </div>

          {/* Important Reminder */}
          <div>
            <div className="flex items-center gap-4 mb-6 -ml-8 pt-4">
              <Bell className="h-6 w-6 fill-black text-black" strokeWidth={3} />
              <h2 className="text-xl font-black uppercase">Important Reminder</h2>
            </div>
            <div className="text-base md:text-lg font-bold leading-relaxed tracking-wide">
              <p>Fireworks can bring joy when used responsibly. Always make safety your top priority, follow the manufacturer's instructions, and comply with your local firework laws and regulations. A little caution ensures a brighter, safer celebration for everyone.</p>
            </div>
          </div>
        </div>
      </main>

      <UserFooter />
    </div>
  );
};

export default SafetyTips;
