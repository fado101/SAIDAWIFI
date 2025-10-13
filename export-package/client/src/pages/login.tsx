import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, User } from "lucide-react";
import Logo from "@/components/logo";
import authService from "@/services/authService";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // Clear any existing authentication on login page load
  useEffect(() => {
    sessionStorage.removeItem('isLoggingOut');
  }, []);

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      console.log('🔑 Starting JWT login process for:', username);
      
      // التحقق من وجود اسم المستخدم وكلمة المرور
      if (!username.trim() || !password.trim()) {
        throw new Error('يرجى إدخال اسم المستخدم وكلمة المرور');
      }
      
      // استخدام خدمة المصادقة الجديدة JWT فقط
      const result = await authService.login(username.trim(), password.trim());
      
      if (result.success && result.user) {
        console.log('✅ JWT Login successful:', result.user.username);
        return {
          isAuthenticated: true,
          ...result.user
        };
      } else {
        console.error('❌ JWT Login failed:', result.message);
        throw new Error(result.message || 'فشل في تسجيل الدخول');
      }
    },
    onSuccess: async (response: any) => {
      console.log('✅ Login successful:', response);
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً بك ${response.username || username}`,
      });
      
      // تحديث بيانات المصادقة في React Query
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // انتظار إضافي للتأكد من حفظ التوكن
      setTimeout(() => {
        console.log('🔄 Navigating to dashboard');
        setLocation("/dashboard");
      }, 500);
    },
    onError: (error: any) => {
      let title = "خطأ في تسجيل الدخول";
      let description = "اسم المستخدم أو كلمة المرور غير صحيحة";
      
      if (error.message && error.message.includes("قاعدة البيانات")) {
        title = "خطأ في الخادم";
        description = "يوجد مشكلة في إعدادات الخادم. يرجى التواصل مع الدعم الفني";
      } else if (error.message && error.message.includes("الشبكة")) {
        title = "خطأ في الاتصال";
        description = "لا يمكن الوصول للخادم. تأكد من اتصال الإنترنت";
      } else if (error.message) {
        description = error.message;
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم المستخدم وكلمة المرور",
        variant: "destructive",
      });
      return;
    }

    console.log(`🔐 FRONTEND: Attempting JWT login for user: ${username}`);
    loginMutation.mutate({ username: username.trim(), password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center p-4">
      {/* Main container with dark blue frame - exact same as login button */}
      <div className="bg-blue-600 hover:bg-blue-700 p-4 rounded-3xl shadow-2xl">
        <div className="bg-blue-600/20 backdrop-blur-sm p-8 rounded-2xl">
          {/* White interior card - larger size */}
          <Card className="w-full max-w-lg bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg">
          <CardHeader className="text-center pb-8">
            {/* Circular logo with light blue frame */}
            <div className="flex justify-center mb-8">
              <Logo size="lg" />
            </div>
            <CardTitle className="text-3xl font-bold text-blue-600">
              شبكة صيدا
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="username" className="text-right block text-base font-medium text-blue-600">
                  اسم المستخدم
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="أدخل اسم المستخدم"
                    className="pl-12 h-12 text-base bg-blue-600/10 border-blue-600/40 focus:border-blue-600 focus:ring-blue-600/20 text-gray-800"
                    dir="ltr"
                    required
                    disabled={loginMutation.isPending}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="password" className="text-right block text-base font-medium text-blue-600">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    className="pl-12 h-12 text-base bg-blue-600/10 border-blue-600/40 focus:border-blue-600 focus:ring-blue-600/20 text-gray-800"
                    dir="ltr"
                    required
                    disabled={loginMutation.isPending}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin ml-2" />
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  "دخول"
                )}
              </Button>
            </form>
          </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}