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

/* ✅ يتطابق مع JSON القادم من السيرفر */
interface DashboardData {
  username: string;
  firstName?: string;
  lastName?: string;
  service: string;
  downrate: number;
  uprate: number;
  expiration: string;
  expirationIso: string;
  expirationUnix: number;
  isExpired: boolean;
  daysLeft: number;
  remainingGb: number;
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
    dlbytes?: number;
    ulbytes?: number;
    totalbytes?: number;
    totalGb?: number;
    onlinetime?: number;
    expiry?: string;
    lastUpdated?: string;
  };
}

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [isRenewalDialogOpen, setIsRenewalDialogOpen] = useState(false);

  /* ✅ جلب بيانات الـ Dashboard */
  const { data: dashboardResponse, isLoading: dashboardLoading, error: dashboardError } = useQuery<{ success: boolean; data: DashboardData }>({
    queryKey: ["/api/dashboard"],
    enabled: isAuthenticated,
    retry: 3,
  });

  const dashboardData = dashboardResponse?.data;

  /* ✅ جلب بيانات الرصيد */
  const { data: realRemainingData, isLoading: remainingDataLoading } = useQuery<RemainingDataResponse>({
    queryKey: ["/api/remaining-detailed"],
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

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

  if (dashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">جاري تحميل بيانات اللوحة...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">فشل في تحميل بيانات اللوحة الرئيسية</p>
        {dashboardError && (
          <p className="text-sm text-red-600 mt-2">خطأ: {dashboardError.message}</p>
        )}
      </div>
    );
  }

  /* ✅ نسبة الاستخدام */
  const usagePercentage = dashboardData.remainingGb && dashboardData.remainingGb > 0
    ? ((100 - dashboardData.remainingGb) / 100) * 100
    : 0;

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

            <div className="flex items-center gap-3">
              <div className="bg-gray-300 rounded-full w-8 h-8 flex items-center justify-center ml-2">
                <User className="text-gray-600" size={16} />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {dashboardData?.firstName || dashboardData?.username || "المستخدم"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = "/api/logout"}
                className="flex items-center gap-2 h-8 px-3"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">خروج</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              مرحباً، {dashboardData?.firstName || dashboardData?.username || "المستخدم"}
            </h2>
            <p className="text-blue-100">نتمنى لك يوماً سعيداً مع خدماتنا</p>
          </div>
          <div className="hidden sm:block">
            <User className="text-6xl text-blue-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
