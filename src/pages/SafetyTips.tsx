import { Check, X, AlertCircle, Shield } from "lucide-react";
import UserHeader from "@/components/layout/UserHeader";
import UserFooter from "@/components/layout/UserFooter";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const SafetyTips = () => {
  const dos = [
    "Use crackers in open, well-ventilated areas away from buildings",
    "Wear protective gear including safety glasses and gloves",
    "Keep a fire extinguisher and water bucket nearby",
    "Light crackers from a safe distance using long sticks",
    "Keep children and pets at least 30 feet away",
    "Wait for crackers to cool before disposing",
    "Store crackers in a cool, dry place away from moisture",
    "Have a first aid kit available",
    "Use crackers during designated festival hours only",
  ];

  const donts = [
    "Never light crackers in crowded areas or indoors",
    "Never hold crackers in your hand while lighting",
    "Don't run after lit crackers",
    "Never pick up a cracker that didn't ignite",
    "Never allow children to handle crackers unsupervised",
    "Don't store crackers near heat sources or open flames",
    "Never mix different types of crackers or chemicals",
    "Never point crackers at people or animals",
    "Don't use crackers near hospitals, schools, or religious places",
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FEF2F2' }}>
      <UserHeader />

      {/* Header Section */}
      <section className="bg-gradient-to-r from-red-600 to-orange-600 text-white py-12">
        <div className="container">
          <div className="flex items-center gap-4 mb-4">
            <Shield className="h-10 w-10" />
            <h1 className="font-display text-4xl font-bold">Safety Tips & Guidelines</h1>
          </div>
          <p className="text-yellow-100 text-lg">Celebrate safely with our comprehensive cracker safety instructions</p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container py-12 flex-1">
        <div className="grid md:grid-cols-2 gap-8">
          {/* DO's Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-green-600 rounded-full p-3">
                <Check className="h-6 w-6 text-white" />
              </div>
              <h2 className="font-display text-3xl font-bold text-green-700">DO's</h2>
            </div>

            <div className="space-y-4">
              {dos.map((item, index) => (
                <div
                  key={index}
                  className="animate-fade-in group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex gap-4 p-4 rounded-lg bg-white border-2 border-green-300 hover:border-green-600 hover:shadow-lg transition-all duration-300 hover:translate-x-2 cursor-pointer">
                    <div className="flex-shrink-0 pt-1">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-green-600 text-white">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="flex-1 group-hover:text-green-700 transition-colors">
                      <p className="font-medium text-green-900">{item}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DON'Ts Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-red-600 rounded-full p-3">
                <X className="h-6 w-6 text-white" />
              </div>
              <h2 className="font-display text-3xl font-bold text-red-700">DON'Ts</h2>
            </div>

            <div className="space-y-4">
              {donts.map((item, index) => (
                <div
                  key={index}
                  className="animate-fade-in group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex gap-4 p-4 rounded-lg bg-white border-2 border-red-300 hover:border-red-600 hover:shadow-lg transition-all duration-300 hover:translate-x-2 cursor-pointer">
                    <div className="flex-shrink-0 pt-1">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-red-600 text-white">
                        <X className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="flex-1 group-hover:text-red-700 transition-colors">
                      <p className="font-medium text-red-900">{item}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Emergency Info Section */}
        <div className="mt-16 p-6 rounded-lg bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-300">
          <div className="flex gap-4 items-start">
            <AlertCircle className="h-8 w-8 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-display text-xl font-bold text-red-900 mb-2">In Case of Emergency</h3>
              <ul className="space-y-2 text-red-800">
                <li>
                  <strong>For burns:</strong> Immerse in cool water for 10-20 minutes and seek medical attention
                </li>
                <li>
                  <strong>For eye injuries:</strong> Flush with clean water for at least 15 minutes and visit a doctor immediately
                </li>
                <li>
                  <strong>For severe injuries:</strong> Call emergency services (911 or local emergency number) immediately
                </li>
                <li>
                  <strong>For allergic reactions:</strong> Seek immediate medical help
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center space-y-4">
          <p className="text-primary font-semibold text-lg">Ready to celebrate safely?</p>
          <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 text-white">
            <Link to="/catalog">Browse Our Products</Link>
          </Button>
        </div>
      </main>

      <UserFooter />
    </div>
  );
};

export default SafetyTips;
