import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wifi, Users, Shield, Clock } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in fade-in duration-500">
        <div className="text-center mb-8">
          <div className="bg-primary rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Wifi className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">مرحباً بك</h1>
          <p className="text-gray-600">شبكة صيدا للعملاء</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center text-gray-700">
            <Users className="w-5 h-5 ml-3 text-primary" />
            <span className="text-sm">إدارة حسابك وخدماتك</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Shield className="w-5 h-5 ml-3 text-primary" />
            <span className="text-sm">متابعة استهلاك البيانات</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Clock className="w-5 h-5 ml-3 text-primary" />
            <span className="text-sm">دعم فني على مدار الساعة</span>
          </div>
        </div>

        <Button 
          onClick={handleLogin}
          className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          تسجيل الدخول
        </Button>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ليس لديك حساب؟{" "}
            <a href="#" className="text-primary hover:underline font-medium">
              تواصل مع الدعم الفني
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
