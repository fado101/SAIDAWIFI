import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import UsageReports from "@/pages/usage-reports-new";
import HierarchicalUsage from "@/pages/hierarchical-usage";
import Invoices from "@/pages/invoices";
import Services from "@/pages/services";
import RouterControl from "@/pages/router-control";
import ApiTest from "@/pages/ApiTest";
import { DebugPage } from "@/pages/debug";
import BottomNavigation from "@/components/bottom-navigation";
import AuthFixService from '@/services/authFixService';
import { useEffect } from 'react';


function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">جارٍ التحقق من بيانات الدخول...</p>
        </div>
      </div>
    );
  }


  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen">
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/usage-reports" component={UsageReports} />
        <Route path="/hierarchical-usage" component={HierarchicalUsage} />
        <Route path="/invoices" component={Invoices} />
        <Route path="/services" component={Services} />
        <Route path="/router-control" component={RouterControl} />
        <Route path="/api-test" component={ApiTest} />
        <Route path="/debug" component={DebugPage} />
        <Route component={Dashboard} />
      </Switch>
      <BottomNavigation />
    </div>
  );
}

function App() {
  
  // إصلاح مشاكل المصادقة في المواقع المنشورة (محدود ومحكم)
  useEffect(() => {
    // تحقق إذا كان هذا موقع منشور ولم يتم الإصلاح بالفعل
    if (!AuthFixService.isProductionSite() || AuthFixService.hasFixRunThisSession()) {
      return;
    }
    
    console.log('🌐 موقع منشور تم اكتشافه - فحص المصادقة...');
    
    // تأخير للسماح لـ useAuth بالتحميل الكامل
    const timer = setTimeout(async () => {
      try {
        const result = await AuthFixService.fixProductionAuthIssues();
        AuthFixService.markFixCompleted();
        
        if (!result.success && result.needsLogin) {
          console.log('🔄 إعادة تحميل مطلوبة بسبب مشاكل المصادقة');
          // إعادة تحميل فقط عند الحاجة الفعلية
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } catch (error) {
        AuthFixService.markFixCompleted(); // منع التكرار حتى في حالة الفشل
        const errorMessage = error instanceof Error ? error.message : 'خطأ غير محدد';
        console.log('ℹ️ خطأ في فحص المصادقة للموقع المنشور:', errorMessage);
      }
    }, 2000); // تأخير أطول للسماح للنظام بالتحميل الكامل
    
    return () => clearTimeout(timer);
  }, []); // تشغيل مرة واحدة عند تحميل التطبيق

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          <Router />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
