import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Logo from "@/components/logo";
import { 
  Wifi, 
  Download, 
  Calendar, 
  BarChart3, 
  Clock, 
  Signal, 
  Zap,
  RefreshCw,
  AlertTriangle,
  Bell,
  User,
  LogOut
} from "lucide-react";

interface DashboardData {
  user: {
    firstName: string;
    email: string;
  };
  data?: {
    firstName?: string;
    username?: string;
    [key: string]: any;
  };
  service: {
    name: string;
    remainingData: number;
    totalData: number;
    expiryDate: string;
    daysRemaining: number;
    activationDate: string;
    isExpired: boolean;
  } | null;
  stats: {
    dailyUsage: number;
    sessionTime: number;
    signalStrength: string;
    currentSpeed: string;
    connectionStatus: string;
  };
  invoices?: Array<{
    id: string;
    date: string;
    price: string;
    paid: string;
    paymode: string;
    service: string;
    managername: string;
  }>;
  unpaidInvoices: Array<{
    id: number;
    amount: number;
    price?: number;
    dueDate: string;
    description: string;
  }>;
  hasUnpaidInvoice: boolean;
  // New dynamic fields
  serviceName?: string;
  speedMbps?: string;
  dailyUsageGB?: string;
  sessionTimeFormatted?: string;
}

interface RemainingDataResponse {
  success: boolean;
  data: {
    username: string;
    service: string;
    package_gb: number;
    used_gb: number;
    remaining_gb: number;
    expiration: string;
    // Legacy fields for compatibility
    dlbytes?: number;
    ulbytes?: number;
    totalbytes?: number;
    totalGb?: number;
    onlinetime?: number;
    expiry?: string;
    lastUpdated?: string;
  };
}

interface UserProfileResponse {
  success: boolean;
  data: {
    username: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    [key: string]: any;
  };
}

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [isRenewalDialogOpen, setIsRenewalDialogOpen] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "غير مصرح",
        description: "تم تسجيل خروجك. جارٍ تسجيل الدخول مرة أخرى...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    enabled: isAuthenticated,
    retry: 3,
  });

  // Handle dashboard errors using useEffect
  useEffect(() => {
    if (dashboardError && !isUnauthorizedError(dashboardError)) {
      console.error("Dashboard error:", dashboardError);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات اللوحة الرئيسية",
        variant: "destructive",
      });
    }
  }, [dashboardError, toast]);

  // Automatically fetch real remaining data from API
  const { data: realRemainingData, isLoading: remainingDataLoading } = useQuery<RemainingDataResponse>({
    queryKey: ["/api/remaining-detailed"],
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch real user profile data
  const { data: userProfile, isLoading: userProfileLoading } = useQuery<UserProfileResponse>({
    queryKey: ["/api/user-profile"],
    enabled: isAuthenticated,
    refetchInterval: 60000, // Refresh every minute
  });

  // ✅ Package to Service ID mapping
  const getServiceId = (packageType: string): number => {
    const packageMap = {
      '50GB': 3,    // 50GB-4M-PPPOE → srvid=3 (65,000)
      '100GB': 1,   // 100GB-4M-PPPOE → srvid=1 (100,000)
      '200GB': 7,   // 200GB-6M-PPPOE → srvid=7 (175,000)
      '300GB': 2    // 300GB-10M-PPPOE → srvid=2 (275,000)
    };
    return packageMap[packageType as keyof typeof packageMap] || 1; // Default to 100GB if not found
  };

  const renewalMutation = useMutation({
    mutationFn: async (packageType: string) => {
      // Get current username from authentication
      const authData = queryClient.getQueryData(["/api/auth/user"]) as any;
      const username = authData?.username;

      if (!username) {
        throw new Error("لم يتم العثور على اسم المستخدم");
      }

      if (!packageType) {
        throw new Error("يرجى اختيار نوع الباقة");
      }

      // 🔄 Convert package type to service ID
      const srvid = getServiceId(packageType);
      console.log(`📦 Converting package ${packageType} to srvid: ${srvid}`);

      return await apiRequest("POST", "/api/renewal-request", { username, srvid });
    },
    onSuccess: (response: any) => {
      // Reset dialog state
      setSelectedPackage('');
      setIsRenewalDialogOpen(false);

      if (response.success) {
        toast({
          title: "تم التجديد بنجاح",
          description: response.message || "تم تجديد الباقة بنجاح لمدة شهر إضافي",
        });

        // Show package details
        if (response.packageType && response.packagePrice) {
          setTimeout(() => {
            toast({
              title: "تفاصيل الباقة الجديدة",
              description: `تم تفعيل باقة ${response.packageType} بقيمة ${response.packagePrice} دج`,
            });
          }, 1500);
        }

        // If there are details about invoice
        if (response.details) {
          setTimeout(() => {
            toast({
              title: "ملاحظة",
              description: response.details,
            });
          }, 3000);
        }
      } else {
        toast({
          title: "فشل التجديد",
          description: response.message || "فشل في تجديد الباقة",
          variant: "destructive",
        });

        // Show error details if available
        if (response.error) {
          console.error("Renewal error details:", response.error);
        }
      }

      // Refetch all data to update status
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/remaining-detailed"] });

      // Force update real data after 3 seconds
      setTimeout(() => {
        updateDataMutation.mutate();
      }, 3000);
    },
    onError: (error) => {
      // Don't show error toasts if we're logging out
      if (sessionStorage.getItem('isLoggingOut') === 'true') {
        return;
      }

      if (isUnauthorizedError(error)) {
        toast({
          title: "غير مصرح",
          description: "تم تسجيل خروجك. جارٍ تسجيل الدخول مرة أخرى...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "خطأ",
        description: error.message || "خطأ في الاتصال بالسيرفر",
        variant: "destructive",
      });
    },
  });

  const updateDataMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("GET", "/api/remaining-data", {});
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث",
        description: "تم تحديث البيانات المتبقية بنجاح",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: (error) => {
      // Don't show error toasts if we're logging out
      if (sessionStorage.getItem('isLoggingOut') === 'true') {
        return;
      }

      if (isUnauthorizedError(error)) {
        toast({
          title: "غير مصرح",
          description: "تم تسجيل خروجك. جارٍ تسجيل الدخول مرة أخرى...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "خطأ",
        description: "فشل في تحديث البيانات المتبقية",
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    // Set a flag in sessionStorage to prevent error toasts during logout
    sessionStorage.setItem('isLoggingOut', 'true');

    // Clear all authentication data properly using authService
    try {
      // Import authService
      const authService = (await import('@/services/authService')).default;
      await authService.clearAuth();
      console.log('✅ Authentication cleared via authService');
    } catch (error) {
      console.error('❌ Error clearing auth via authService:', error);
      
      // Fallback: clear all possible token storage keys
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('jwt_auth_token');
      localStorage.removeItem('jwt_user_data');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userSession');
      sessionStorage.clear();
      console.log('✅ Fallback token clearing completed');
    }

    // Clear all cached data immediately
    queryClient.clear();

    // Make logout request with keepalive to ensure delivery
    try {
      if ('sendBeacon' in navigator) {
        navigator.sendBeacon('/api/logout', new Blob());
      } else {
        fetch("/api/logout", { 
          method: "POST",
          keepalive: true 
        }).catch(() => {
          // Ignore errors
        });
      }
    } catch (error) {
      console.log('Logout request failed, proceeding anyway');
    }

    // Clear the logout flag and show success message
    sessionStorage.removeItem('isLoggingOut');
    
    toast({
      title: "تم تسجيل الخروج بنجاح",
      description: "شكراً لاستخدام بوابة العملاء",
    });

    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  const detailedDataMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/remaining-detailed", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "البيانات التفصيلية",
        description: `إجمالي البيانات: ${data.data.totalGb} GB`,
      });
      console.log('Detailed data response:', data);
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في جلب البيانات التفصيلية",
        variant: "destructive",
      });
    },
  });

  // Debug logging
  console.log('Dashboard debug info:', {
    isAuthenticated,
    isLoading,
    dashboardLoading,
    dashboardData,
    dashboardError,
    errorMessage: dashboardError?.message || 'No error'
  });

  if (dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل بيانات اللوحة...</p>
        </div>
      </div>
    );
  }

  // Don't show error if user is not authenticated
  if (!dashboardData) {
    if (!isAuthenticated && !isLoading) {
      // User is logged out, let the useEffect redirect handle it
      return null;
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600">فشل في تحميل بيانات اللوحة الرئيسية</p>
          {dashboardError && (
            <p className="text-sm text-red-600 mt-2">
              خطأ: {dashboardError.message}
            </p>
          )}
        </div>
      </div>
    );
  }

  const usagePercentage = dashboardData.service && 
    dashboardData.service.totalData && 
    dashboardData.service.remainingData !== null ? 
    ((dashboardData.service.totalData - dashboardData.service.remainingData) / dashboardData.service.totalData) * 100 : 0;

  // Calculate real expiry status based on actual API data
  const isReallyExpired = realRemainingData?.data ? (
    (realRemainingData.data.remaining_gb ?? 0) <= 0 || 
    new Date(realRemainingData.data.expiration || realRemainingData.data.expiry || '').getTime() < new Date().getTime()
  ) : dashboardData?.service?.isExpired;

  const realRemainingGb = realRemainingData?.data?.remaining_gb || 0;

  const formatSessionTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}:00`;
  };

  return (
    <div className="min-h-screen pb-20" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Logo size="sm" className="ml-3" />
              <h1 className="text-xl font-semibold text-gray-900">نظام إدارة الشبكة</h1>
            </div>

            <div className="flex items-center space-x-4 space-x-reverse">
              {/* Notifications */}
              <div className="relative">
                <button className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none">
                  <Bell className="text-xl" />
                  {dashboardData.hasUnpaidInvoice && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      1
                    </span>
                  )}
                </button>
              </div>

              {/* User Profile */}
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <div className="bg-gray-300 rounded-full w-8 h-8 flex items-center justify-center ml-2">
                    <User className="text-gray-600" size={16} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {dashboardData?.data?.firstName || dashboardData?.data?.username || user?.username || "المستخدم"}
                  </span>
                </div>

                {/* Logout Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2 h-8 px-3"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">خروج</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Subscription Expiry Warning */}
        {isReallyExpired && (
          <div className="bg-red-100 border-l-4 border-red-500 rounded-lg p-5 mb-6 shadow-lg border border-red-300 animate-pulse">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-8 w-8 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-red-800 font-bold mb-3 text-xl">⚠️ تنبيه مهم</h3>
                <p className="text-red-800 text-lg font-semibold mb-3">
                  انتهت صلاحية حسابك أو لم يبق لديك المزيد من التحميلات. يرجى التجديد للاستمرار في استخدام الخدمة.
                </p>
                <div className="bg-red-50 p-3 rounded-md">
                  <p className="text-red-800 font-medium mb-2">التفاصيل:</p>
                  <div className="text-sm text-red-700 space-y-1">
                    {realRemainingGb <= 0 && (
                      <p>• نفدت البيانات المتاحة ({(realRemainingGb || 0).toFixed(1)} GB متبقي)</p>
                    )}
                    {realRemainingData?.data && new Date(realRemainingData.data.expiration || realRemainingData.data.expiry || '').getTime() < new Date().getTime() && (
                      <p>• انتهت صلاحية الاشتراك في {new Date(realRemainingData.data.expiration || realRemainingData.data.expiry || '').toLocaleDateString("sv-SE")}</p>
                    )}
                    <p className="mt-2 font-medium">• اتصل بالدعم الفني للتجديد فوراً</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auto-Renewal Notification */}
        {(() => {
          const autoRenewalInvoices = dashboardData?.unpaidInvoices?.filter((invoice: any) => 
            invoice.paymode === 2 && 
            (invoice.comment?.includes('Auto renewal') || 
             invoice.comment?.includes('Free renewal') ||
             invoice.remark?.includes('Auto renewal'))
          ) || [];

          return autoRenewalInvoices.length > 0 && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 rounded-lg p-5 mb-6 shadow-lg border border-yellow-300">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-yellow-800 font-bold mb-2 text-lg">⚠️ تنبيه تجديد تلقائي</h3>
                  <p className="text-yellow-800 text-base mb-3">
                    تم تجديد اشتراكك تلقائياً بدون رصيد. يرجى تسوية الفاتورة المعلقة عن طريق التحويل البنكي.
                  </p>
                  <div className="bg-yellow-50 p-3 rounded-md">
                    <p className="text-yellow-800 font-medium mb-1">تفاصيل الفاتورة:</p>
                    <div className="text-sm text-yellow-700">
                      <p>• المبلغ: {(autoRenewalInvoices[0] as any)?.amount} دج</p>
                      <p>• الخدمة: {(autoRenewalInvoices[0] as any)?.service}</p>
                      <p>• طريقة الدفع: تحويل بنكي</p>
                      <p>• رقم الفاتورة: {(autoRenewalInvoices[0] as any)?.invnum}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                مرحباً، {dashboardData?.data?.firstName || dashboardData?.data?.username || user?.username || "المستخدم"}
              </h2>
              <p className="text-blue-100">نتمنى لك يوماً سعيداً مع خدماتنا</p>
            </div>
            <div className="hidden sm:block">
              <User className="text-6xl text-blue-200" />
            </div>
          </div>
        </div>

        {/* Unpaid Invoice Alert - Keep this important notification */}
        {dashboardData?.hasUnpaidInvoice && dashboardData?.unpaidInvoices?.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between mb-6">
            <div className="flex items-center">
              <AlertTriangle className="text-yellow-600 ml-3" />
              <div>
                <p className="font-medium text-gray-800">لديك فاتورة غير مدفوعة</p>
                <p className="text-sm text-gray-600">
                  القيمة:{" "}
                  <span className="font-bold text-yellow-600">
                    {(() => {
                      const invoice = dashboardData?.unpaidInvoices?.[0];
                      const amount = invoice?.price ?? invoice?.amount;
                      return amount ? amount.toLocaleString('ar-SY') : '0';
                    })()} ليرة سورية
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Real API Data Display - Always Visible */}
        {realRemainingData?.data && (
          <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">البيانات الفورية من الخادم</h2>
                <div className="flex items-center gap-2">
                  {isReallyExpired ? (
                    <>
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-red-600 font-medium">منتهي الصلاحية</span>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-600 font-medium">متصل</span>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">المتبقي من الباقة</p>
                  <p className="text-3xl font-bold text-green-600">
                    {(() => {
                      const totalGb = realRemainingData?.data?.remaining_gb || realRemainingData?.data?.totalGb || 0;
                      return totalGb.toFixed(1);
                    })()} GB
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">تاريخ انتهاء الباقة</p>
                  <p className="text-lg font-semibold text-yellow-600">
                    {new Date(realRemainingData.data.expiration || realRemainingData.data.expiry || '').toLocaleDateString("sv-SE")}
                  </p>
                  <p className="text-sm text-gray-500">
                    متبقي {Math.max(0, Math.ceil((new Date(realRemainingData.data.expiration || realRemainingData.data.expiry || '').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} يوم
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">آخر تحديث</p>
                  <p className="text-sm text-gray-700">
                    {new Date().toLocaleTimeString("en-GB")}
                  </p>
                  <p className="text-xs text-blue-600">تحديث تلقائي كل 30 ثانية</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Service Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Current Service Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">الخدمة الحالية</h3>
                <Wifi className="text-primary text-xl" />
              </div>
              <div className="space-y-2">
                <p className={`text-2xl font-bold ${isReallyExpired ? 'text-red-600' : 'text-primary'}`}>
                  {isReallyExpired ? "غير محدد / منتهية" : (dashboardData?.invoices?.[0]?.service || "غير محدد")}
                </p>
                <p className="text-sm text-gray-600">
                  {isReallyExpired ? "يتطلب التجديد" : (
                    `نشطة منذ ${dashboardData.service?.activationDate 
                      ? new Date(dashboardData.service.activationDate).toLocaleDateString("sv-SE")
                      : "غير محدد"
                    }`
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Remaining Data Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">البيانات المتبقية</h3>
                <Download className="text-green-600 text-xl" />
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-green-600">
                  {(() => {
                    const remainingGb = realRemainingData?.data?.remaining_gb;
                    const fallbackRemaining = dashboardData?.service?.remainingData;
                    if (remainingGb != null) {
                      return remainingGb.toFixed(1);
                    } else if (fallbackRemaining != null) {
                      return fallbackRemaining.toFixed(1);
                    } else {
                      return "—";
                    }
                  })()} GB
                </p>
                <Progress 
                  value={realRemainingData?.data 
                    ? (() => {
                        // Extract actual package size from service name
                        const serviceName = dashboardData?.invoices?.[0]?.service || dashboardData?.service?.name || "";
                        let actualPackageGb = 100; // Default fallback
                        
                        if (serviceName.includes("50GB")) actualPackageGb = 50;
                        else if (serviceName.includes("100GB")) actualPackageGb = 100;
                        else if (serviceName.includes("200GB")) actualPackageGb = 200;
                        else if (serviceName.includes("300GB")) actualPackageGb = 300;
                        else if (serviceName.includes("500GB")) actualPackageGb = 500;
                        
                        const remainingGb = realRemainingData.data.remaining_gb || 0;
                        
                        // Show percentage of remaining data (blue bar shows remaining)
                        const remainingPercentage = Math.max(0, Math.min(100, (remainingGb / actualPackageGb) * 100));
                        return remainingPercentage;
                      })()
                    : (100 - usagePercentage)} 
                  className="w-full h-2" 
                />
                <p className="text-sm text-gray-600">
                  متبقي من الباقة الحالية
                </p>
                {(updateDataMutation.isPending || remainingDataLoading) && (
                  <p className="text-xs text-blue-600">جارٍ تحديث البيانات...</p>
                )}
                {realRemainingData?.data?.lastUpdated && (
                  <p className="text-xs text-gray-500">
                    آخر تحديث: {new Date(realRemainingData.data.lastUpdated).toLocaleTimeString("ar-SA")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subscription Expiry Card */}
          <Card className="hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">انتهاء الاشتراك</h3>
                <Calendar className="text-yellow-600 text-xl" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-yellow-600">
                  {realRemainingData?.data?.expiration 
                    ? new Date(realRemainingData.data.expiration).toLocaleDateString("sv-SE")
                    : (dashboardData.service?.expiryDate 
                      ? new Date(dashboardData.service.expiryDate).toLocaleDateString("sv-SE")
                      : "غير محدد"
                    )
                  }
                </p>
                <p className="text-sm text-gray-600">
                  متبقي{" "}
                  <span className="font-medium text-yellow-600">
                    {realRemainingData?.data?.expiration 
                      ? Math.max(0, Math.ceil((new Date(realRemainingData.data.expiration).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                      : (dashboardData.service?.daysRemaining || 0)
                    } يوم
                  </span>
                </p>
              </div>

              {/* Renewal Button */}
              <div className="mt-4">
                <Dialog open={isRenewalDialogOpen} onOpenChange={setIsRenewalDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      disabled={
                        renewalMutation.isPending ||
                        // Button is disabled when service is active AND has remaining data (based on real data)
                        (!isReallyExpired && realRemainingGb > 0)
                      }
                      className={`w-full ${
                        isReallyExpired || realRemainingGb <= 0
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {renewalMutation.isPending ? (
                        <span className="flex items-center justify-center">
                          <span className="animate-spin ml-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                          جارٍ المعالجة...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <RefreshCw className="ml-2 h-4 w-4" />
                          إعادة تجديد الاشتراك
                        </span>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md mx-auto">
                    <DialogHeader>
                      <DialogTitle className="text-center text-xl font-bold text-blue-600">
                        اختر باقة التجديد
                      </DialogTitle>
                      <DialogDescription className="text-center text-gray-600">
                        اختر الباقة التي تناسب احتياجاتك
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-3 mt-4">
                      {[
                        { type: '50GB', price: '65,000', name: '50GB - 4Mbps', speed: '4 ميجابت' },
                        { type: '100GB', price: '100,000', name: '100GB - 4Mbps', speed: '4 ميجابت' },
                        { type: '200GB', price: '175,000', name: '200GB - 6Mbps', speed: '6 ميجابت' },
                        { type: '300GB', price: '275,000', name: '300GB - 10Mbps', speed: '10 ميجابت' }
                      ].map((pkg) => (
                        <Button
                          key={pkg.type}
                          variant={selectedPackage === pkg.type ? "default" : "outline"}
                          className={`w-full p-4 h-auto text-right justify-between ${
                            selectedPackage === pkg.type 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'hover:bg-blue-50 border-gray-300'
                          }`}
                          onClick={() => setSelectedPackage(pkg.type)}
                        >
                          <div className="flex flex-col items-end">
                            <div className="font-bold text-lg">{pkg.name}</div>
                            <div className="text-sm opacity-80">السرعة: {pkg.speed}</div>
                            <div className="text-sm opacity-80">المدة: 31 يوم</div>
                          </div>
                          <div className="text-left">
                            <div className="font-bold text-lg">{pkg.price}</div>
                            <div className="text-sm opacity-80">ليرة سورية</div>
                          </div>
                        </Button>
                      ))}
                    </div>

                    <div className="flex gap-3 mt-6">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setIsRenewalDialogOpen(false);
                          setSelectedPackage('');
                        }}
                      >
                        إلغاء
                      </Button>
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={!selectedPackage || renewalMutation.isPending}
                        onClick={() => {
                          if (selectedPackage) {
                            renewalMutation.mutate(selectedPackage);
                            setIsRenewalDialogOpen(false);
                          }
                        }}
                      >
                        {renewalMutation.isPending ? 'جارٍ التجديد...' : 'تأكيد التجديد'}
                      </Button>
                    </div>

                    <p className="text-xs text-center text-gray-500 mt-4">
                      سيتم إنشاء فاتورة غير مدفوعة يمكنك دفعها لاحقاً
                    </p>
                  </DialogContent>
                </Dialog>

                {/* Show status message under button */}
                {(isReallyExpired || realRemainingGb <= 0) && (
                  <p className="text-xs text-red-600 mt-2 text-center">
                    يرجى التجديد لاستمرار الخدمة
                  </p>
                )}
                {!isReallyExpired && realRemainingGb > 0 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    الاشتراك نشط - لا يحتاج للتجديد
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service Expiry Alert - Critical notification */}
        {dashboardData.service?.isExpired && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between mb-6">
            <div className="flex items-center flex-1">
              <AlertTriangle className="text-red-600 ml-3" />
              <div>
                <p className="font-medium text-red-800">انتهت صلاحية الحساب</p>
                <p className="text-sm text-red-600">
                  يرجى التجديد للاستمرار في استخدام الخدمة
                </p>
              </div>
            </div>
            <Button
              onClick={() => renewalMutation.mutate('100GB')}
              disabled={renewalMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white ml-4"
              size="sm"
            >
              {renewalMutation.isPending ? (
                <span className="flex items-center">
                  <span className="animate-spin ml-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  جارٍ المعالجة...
                </span>
              ) : (
                <span className="flex items-center">
                  <RefreshCw className="ml-2 h-4 w-4" />
                  تجديد الآن
                </span>
              )}
            </Button>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <BarChart3 className="text-primary text-2xl mb-3 mx-auto" />
              <h4 className="text-sm font-medium text-gray-600 mb-1">الاستخدام اليومي</h4>
              <p className="text-xl font-bold text-gray-900">
                {(() => {
                  const dailyUsageGB = (dashboardData as any)?.dailyUsageGB;
                  const statsUsage = dashboardData?.stats?.dailyUsage;
                  if (dailyUsageGB) {
                    return dailyUsageGB;
                  } else if (statsUsage != null) {
                    return Math.abs(statsUsage).toFixed(1) + " جيجابايت";
                  } else {
                    return "0.0 جيجابايت";
                  }
                })()}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Clock className="text-green-600 text-2xl mb-3 mx-auto" />
              <h4 className="text-sm font-medium text-gray-600 mb-1">الجلسة الحالية</h4>
              <p className="text-xl font-bold text-gray-900">
                {(dashboardData as any)?.sessionTimeFormatted || formatSessionTime(dashboardData?.stats?.sessionTime || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Wifi className={`text-2xl mb-3 mx-auto ${
                !isReallyExpired ? "text-green-600" : "text-red-600"
              }`} />
              <h4 className="text-sm font-medium text-gray-600 mb-1">حالة الاتصال</h4>
              <p className={`text-xl font-bold ${
                !isReallyExpired ? "text-green-600" : "text-red-600"
              }`}>
                {isReallyExpired ? "منتهي الصلاحية" : (dashboardData?.stats?.connectionStatus || "متصل")}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Zap className="text-orange-600 text-2xl mb-3 mx-auto" />
              <h4 className="text-sm font-medium text-gray-600 mb-1">السرعة الحالية</h4>
              <p className="text-xl font-bold text-gray-900">
                {(dashboardData as any)?.speedMbps || 
                 dashboardData?.stats?.currentSpeed ||
                 (dashboardData?.invoices?.[0]?.service?.includes('10M') ? "10 ميجابت/ثانية" : 
                  dashboardData?.invoices?.[0]?.service?.includes('4M') ? "4 ميجابت/ثانية" : 
                  "4 ميجابت/ثانية")}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
