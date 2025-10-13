import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Activity, Calendar, BarChart3, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Logo from "@/components/logo";
import { fetchUsageReport } from "@/lib/api-service";

export default function UsageReports() {
  try {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  const [dailyData, setDailyData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [yearlyData, setYearlyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const currentUsername = user?.username || '';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "غير مُخوَّل",
        description: "تم تسجيل خروجك. جارٍ تسجيل الدخول مرة أخرى...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // جلب كل تقارير الاستخدام (يومي/شهري/سنوي)
  useEffect(() => {
    if (!currentUsername) return;
    const loadReports = async () => {
      setLoading(true);
      try {
        const [daily, monthly, yearly] = await Promise.all([
          fetchUsageReport(currentUsername, "daily"),
          fetchUsageReport(currentUsername, "monthly"),
          fetchUsageReport(currentUsername, "yearly")
        ]);
        setDailyData(daily);
        setMonthlyData(monthly);
        setYearlyData(yearly);
      } catch (error) {
        toast({
          title: "خطأ في جلب التقارير",
          description: "حدث خطأ أثناء جلب تقارير الاستخدام",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, [currentUsername, toast]);

  if (isLoading || loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // حساب ملخص usage من جميع البيانات
  const calculateStats = (data: any[]) => {
    if (!data || data.length === 0) return {
      totalSessions: 0,
      totalUsed: 0,
      totalDownload: 0,
      totalUpload: 0,
      totalDuration: 0,
      avgDaily: 0
    };
    
    const totals = data.reduce((acc, report) => {
      acc.sessions += report.session_count || 0;
      acc.download += parseFloat(report.download_gb || 0);
      acc.upload += parseFloat(report.upload_gb || 0);
      acc.used += parseFloat(report.data_used_gb || 0);
      acc.duration += report.duration_minutes || 0;
      return acc;
    }, { sessions: 0, download: 0, upload: 0, used: 0, duration: 0 });
    
    return {
      totalSessions: totals.sessions,
      totalUsed: totals.used,
      totalDownload: totals.download,
      totalUpload: totals.upload,
      totalDuration: totals.duration,
      avgDaily: data.length > 0 ? totals.used / data.length : 0
    };
  };
  
  // Extract reports arrays from data
  const daily = dailyData?.reports || [];
  const monthly = monthlyData?.reports || [];
  const yearly = yearlyData?.reports || [];
  
  // استخدام الإحصائيات من API إذا كانت متوفرة
  const apiStats = dailyData?.statistics || monthlyData?.statistics || yearlyData?.statistics;
  
  let stats;
  try {
    stats = apiStats ? {
      totalSessions: apiStats.total_sessions || 0,
      totalUsed: apiStats.total_data_used_gb || 0,
      totalDownload: apiStats.total_download_gb || 0,
      totalUpload: apiStats.total_upload_gb || 0,
      totalDuration: apiStats.total_duration_minutes || 0,
      avgDaily: apiStats.avg_daily_usage_gb || 0
    } : calculateStats(daily || monthly || yearly || []);
  } catch (error) {
    console.error('Error calculating stats:', error);
    stats = {
      totalSessions: 0,
      totalUsed: 0,
      totalDownload: 0,
      totalUpload: 0,
      totalDuration: 0,
      avgDaily: 0
    };
  }
  
  const { totalSessions, totalUsed, totalDownload, totalUpload, totalDuration, avgDaily } = stats;

  return (
    <div className="p-4 space-y-6">
      {/* شريط العنوان */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/")}
            className="p-2"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Logo size="sm" className="ml-2" />
          <h1 className="text-2xl font-bold text-gray-800">تقرير الاستخدام</h1>
        </div>
        <Badge variant="outline" className="text-blue-600 border-blue-600">
          <Activity className="w-4 h-4 mr-2" />
          تقارير مفصلة
        </Badge>
      </div>

      {/* ملخص usage */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>ملخص الاستهلاك</CardTitle>
          <CardDescription>إحصائيات شاملة من تقاريرك اليومية</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-blue-800">{totalUsed.toFixed(2)} GB</div>
            <div className="text-gray-600 text-xs mt-1">إجمالي الاستهلاك</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-700">{totalDownload.toFixed(2)} GB</div>
            <div className="text-gray-600 text-xs mt-1">إجمالي التحميل</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-cyan-700">{totalUpload.toFixed(2)} GB</div>
            <div className="text-gray-600 text-xs mt-1">إجمالي الرفع</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{totalSessions}</div>
            <div className="text-gray-600 text-xs mt-1">عدد الجلسات</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{Math.round(totalDuration)}</div>
            <div className="text-gray-600 text-xs mt-1">إجمالي الوقت (دقيقة)</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{avgDaily.toFixed(2)} GB</div>
            <div className="text-gray-600 text-xs mt-1">متوسط استهلاك يومي</div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="yearly" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            سنوي
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            شهري
          </TabsTrigger>
          <TabsTrigger value="daily" className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            يومي
          </TabsTrigger>
        </TabsList>

        {/* التقرير السنوي */}
        <TabsContent value="yearly">
          <Card>
            <CardHeader>
              <CardTitle>التقرير السنوي</CardTitle>
              <CardDescription>إجمالي الاستخدام لكل عام</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-right p-3 font-medium text-gray-600">السنة</th>
                      <th className="text-right p-3 font-medium text-gray-600">إجمالي التحميل (GB)</th>
                      <th className="text-right p-3 font-medium text-gray-600">إجمالي الرفع (GB)</th>
                      <th className="text-right p-3 font-medium text-gray-600">إجمالي الاستخدام (GB)</th>
                      <th className="text-right p-3 font-medium text-gray-600">إجمالي الوقت (دقيقة)</th>
                      <th className="text-right p-3 font-medium text-gray-600">عدد الجلسات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearly && yearly.length > 0 ? (
                      yearly.map((report: any, index: number) => {
                        try {
                          return (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-3 font-medium text-blue-600">{report.year || report.period || ''}</td>
                              <td className="p-3 text-green-600">{typeof (report.download_gb || report.total_download || 0) === 'number' ? (report.download_gb || report.total_download || 0).toFixed(2) : '0'}</td>
                              <td className="p-3 text-blue-600">{typeof (report.upload_gb || report.total_upload || 0) === 'number' ? (report.upload_gb || report.total_upload || 0).toFixed(2) : '0'}</td>
                              <td className="p-3 font-medium">{typeof (report.data_used_gb || report.total_usage || 0) === 'number' ? (report.data_used_gb || report.total_usage || 0).toFixed(2) : '0'}</td>
                              <td className="p-3">{Math.round(report.duration_minutes || report.total_time || 0)}</td>
                              <td className="p-3">{report.session_count || report.sessions || '0'}</td>
                            </tr>
                          );
                        } catch (e) {
                          console.error('Error rendering yearly report row:', e);
                          return null;
                        }
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-gray-500">
                          لا توجد بيانات متاحة للتقرير السنوي
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* التقرير الشهري */}
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>التقرير الشهري</CardTitle>
              <CardDescription>إجمالي الاستخدام لكل شهر في السنة المحددة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-right p-3 font-medium text-gray-600">الشهر/السنة</th>
                      <th className="text-right p-3 font-medium text-gray-600">إجمالي التحميل (GB)</th>
                      <th className="text-right p-3 font-medium text-gray-600">إجمالي الرفع (GB)</th>
                      <th className="text-right p-3 font-medium text-gray-600">إجمالي الاستخدام (GB)</th>
                      <th className="text-right p-3 font-medium text-gray-600">إجمالي الوقت (دقيقة)</th>
                      <th className="text-right p-3 font-medium text-gray-600">عدد الجلسات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthly && monthly.length > 0 ? (
                      monthly.map((report: any, index: number) => {
                        try {
                          return (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-3 font-medium text-blue-600">{report.year || ''}-{report.month || report.period || ''}</td>
                              <td className="p-3 text-green-600">{typeof (report.download_gb || report.total_download || 0) === 'number' ? (report.download_gb || report.total_download || 0).toFixed(2) : '0'}</td>
                              <td className="p-3 text-blue-600">{typeof (report.upload_gb || report.total_upload || 0) === 'number' ? (report.upload_gb || report.total_upload || 0).toFixed(2) : '0'}</td>
                              <td className="p-3 font-medium">{typeof (report.data_used_gb || report.total_usage || 0) === 'number' ? (report.data_used_gb || report.total_usage || 0).toFixed(2) : '0'}</td>
                              <td className="p-3">{Math.round(report.duration_minutes || report.total_time || 0)}</td>
                              <td className="p-3">{report.session_count || report.sessions || '0'}</td>
                            </tr>
                          );
                        } catch (e) {
                          console.error('Error rendering monthly report row:', e);
                          return null;
                        }
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-gray-500">
                          لا توجد بيانات متاحة للتقرير الشهري
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* التقرير اليومي */}
        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>التقرير اليومي</CardTitle>
              <CardDescription>إجمالي الاستخدام لكل يوم</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-right p-3 font-medium text-gray-600">اليوم</th>
                      <th className="text-right p-3 font-medium text-gray-600">إجمالي التحميل (GB)</th>
                      <th className="text-right p-3 font-medium text-gray-600">إجمالي الرفع (GB)</th>
                      <th className="text-right p-3 font-medium text-gray-600">إجمالي الاستخدام (GB)</th>
                      <th className="text-right p-3 font-medium text-gray-600">إجمالي الوقت (دقيقة)</th>
                      <th className="text-right p-3 font-medium text-gray-600">عدد الجلسات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daily && daily.length > 0 ? (
                      daily.map((report: any, index: number) => {
                        try {
                          return (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-3 font-medium text-blue-600">{report.date || report.day || report.period || ''}</td>
                              <td className="p-3 text-green-600">{typeof (report.download_gb || report.total_download || 0) === 'number' ? (report.download_gb || report.total_download || 0).toFixed(2) : '0'}</td>
                              <td className="p-3 text-blue-600">{typeof (report.upload_gb || report.total_upload || 0) === 'number' ? (report.upload_gb || report.total_upload || 0).toFixed(2) : '0'}</td>
                              <td className="p-3 font-medium">{typeof (report.data_used_gb || report.total_usage || 0) === 'number' ? (report.data_used_gb || report.total_usage || 0).toFixed(2) : '0'}</td>
                              <td className="p-3">{Math.round(report.duration_minutes || report.total_time || 0)}</td>
                              <td className="p-3">{report.session_count || report.sessions || '0'}</td>
                            </tr>
                          );
                        } catch (e) {
                          console.error('Error rendering daily report row:', e);
                          return null;
                        }
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-gray-500">
                          لا توجد بيانات متاحة للتقرير اليومي
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
  } catch (error) {
    console.error('Error rendering UsageReports:', error);
    return (
      <div className="p-4 space-y-6">
        <div className="h-screen flex items-center justify-center">
          <Card className="p-6 max-w-md">
            <CardContent className="text-center">
              <p className="text-red-500 mb-4">حدث خطأ في عرض التقارير</p>
              <Button onClick={() => window.location.reload()}>
                إعادة تحميل الصفحة
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
}
