import { useLocation } from "wouter";
import { Home, BarChart3, Settings, FileText, Router } from "lucide-react";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { 
      id: "services", 
      label: "الخدمات", 
      icon: Settings, 
      path: "/services" 
    },
    { 
      id: "reports", 
      label: "التقارير", 
      icon: BarChart3, 
      path: "/hierarchical-usage" 
    },
    { 
      id: "dashboard", 
      label: "الرئيسية", 
      icon: Home, 
      path: "/",
      isCenter: true 
    },
    { 
      id: "invoices", 
      label: "الفواتير", 
      icon: FileText, 
      path: "/invoices" 
    },
    { 
      id: "router", 
      label: "الراوتر", 
      icon: Router, 
      path: "/router-control" 
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <button
              key={item.id}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center justify-center transition-colors ${
                item.isCenter
                  ? `text-primary bg-blue-50 rounded-t-2xl ${isActive ? 'bg-blue-100' : ''}`
                  : isActive
                  ? "text-primary"
                  : "text-gray-600 hover:text-primary"
              }`}
            >
              <Icon className={`${item.isCenter ? 'text-xl' : 'text-lg'} mb-1`} />
              <span className={`text-xs ${item.isCenter ? 'font-medium' : ''}`}>
                {item.label}
              </span>
              {item.id === "invoices" && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  1
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
