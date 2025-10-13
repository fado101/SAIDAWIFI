import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDownIcon, ArrowUpIcon, ChevronRightIcon, ChevronDownIcon, CalendarIcon, BarChart3Icon, ActivityIcon, ArrowLeft, WifiIcon } from "lucide-react";
import { useLocation } from "wouter";
import Logo from "@/components/logo";

interface SessionData {
  acctstarttime: string;
  acctstoptime: string;
  acctinputoctets: number;
  acctoutputoctets: number;
  acctsessiontime: number;
  framedipaddress: string;
  calledstationid: string;
}

interface DayData {
  date: string;
  download_gb: number;
  upload_gb: number;
  total_gb: number;
  session_count: number;
  sessions?: SessionData[];
}

interface MonthData {
  year: string;
  month: string;
  download_gb: number;
  upload_gb: number;
  total_gb: number;
  days?: DayData[];
}

interface YearData {
  year: string;
  download_gb: number;
  upload_gb: number;
  total_gb: number;
  months?: MonthData[];
}

export default function UsageReports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [monthlyData, setMonthlyData] = useState<Record<string, MonthData[]>>({});
  const [dailyData, setDailyData] = useState<Record<string, DayData[]>>({});
  const [sessionData, setSessionData] = useState<Record<string, SessionData[]>>({});

  const currentUsername = user?.username || '';

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // جلب ملخص آخر 30 يوم
  const { data: last30Days } = useQuery({
    queryKey: [`/api/usage/last30days/${currentUsername}`],
    enabled: !!currentUsername,
  });

  // جلب البيانات السنوية
  const { data: yearlyData } = useQuery({
    queryKey: [`/api/usage/yearly/${currentUsername}`],
    enabled: !!currentUsername,
  });

  // جلب بيانات الشهور عند توسيع السنة
  useEffect(() => {
    Object.keys(expandedYears).forEach(async (year) => {
      if (expandedYears[year] && !monthlyData[year] && currentUsername) {
        try {
          const response = await fetch(`/api/usage/monthly/${currentUsername}/${year}`, {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            setMonthlyData(prev => ({ ...prev, [year]: data }));
          }
        } catch (error) {
          console.error('Error fetching monthly data:', error);
        }
      }
    });
  }, [expandedYears, currentUsername]);

  // جلب بيانات الأيام عند توسيع الشهر
  useEffect(() => {
    Object.keys(expandedMonths).forEach(async (yearMonth) => {
      if (expandedMonths[yearMonth] && !dailyData[yearMonth] && currentUsername) {
        const [year, month] = yearMonth.split('-');
        try {
          const response = await fetch(`/api/usage/daily/${currentUsername}/${year}/${month}`, {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            setDailyData(prev => ({ ...prev, [yearMonth]: data }));
          }
        } catch (error) {
          console.error('Error fetching daily data:', error);
        }
      }
    });
  }, [expandedMonths, currentUsername]);

  // جلب جلسات اليوم عند توسيع اليوم
  useEffect(() => {
    Object.keys(expandedDays).forEach(async (date) => {
      if (expandedDays[date] && !sessionData[date] && currentUsername) {
        try {
          const response = await fetch(`/api/usage/sessions/${currentUsername}/${date}`, {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            setSessionData(prev => ({ ...prev, [date]: data }));
          }
        } catch (error) {
          console.error('Error fetching session data:', error);
        }
      }
    });
  }, [expandedDays, currentUsername]);

  const toggleYear = (year: string) => {
    setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
  };

  const toggleMonth = (yearMonth: string) => {
    setExpandedMonths(prev => ({ ...prev, [yearMonth]: !prev[yearMonth] }));
  };

  const toggleDay = (date: string) => {
    setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const formatBytes = (bytes: number) => {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  if (isLoading || !currentUsername) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Logo size="sm" />
              <h1 className="text-xl font-semibold text-gray-900">تقارير الاستخدام</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ملخص آخر 30 يوم */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3Icon className="h-5 w-5 text-blue-600" />
              ملخص الاستهلاك - آخر 30 يوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/80 backdrop-blur rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">إجمالي التحميل</span>
                  <ArrowDownIcon className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {last30Days?.download_gb?.toFixed(2) || '0.00'} GB
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">إجمالي الرفع</span>
                  <ArrowUpIcon className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {last30Days?.upload_gb?.toFixed(2) || '0.00'} GB
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">الاستهلاك الكلي</span>
                  <ActivityIcon className="h-4 w-4 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {last30Days?.total_gb?.toFixed(2) || '0.00'} GB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* التقارير السنوية */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-gray-600" />
              التقارير التفصيلية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {yearlyData?.map((yearData: YearData) => (
                <div key={yearData.year} className="border rounded-lg overflow-hidden">
                  {/* السنة */}
                  <div
                    className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => toggleYear(yearData.year)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedYears[yearData.year] ? (
                        <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                      )}
                      <span className="font-semibold text-lg">{yearData.year}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-600">↓ {yearData.download_gb.toFixed(2)} GB</span>
                      <span className="text-blue-600">↑ {yearData.upload_gb.toFixed(2)} GB</span>
                      <span className="font-semibold">{yearData.total_gb.toFixed(2)} GB</span>
                    </div>
                  </div>

                  {/* الشهور */}
                  {expandedYears[yearData.year] && monthlyData[yearData.year] && (
                    <div className="border-t">
                      {monthlyData[yearData.year].map((monthData: MonthData) => {
                        const monthKey = `${monthData.year}-${monthData.month}`;
                        const monthName = new Date(parseInt(monthData.year), parseInt(monthData.month) - 1).toLocaleDateString('ar-EG', { month: 'long' });
                        
                        return (
                          <div key={monthKey} className="border-b last:border-b-0">
                            {/* الشهر */}
                            <div
                              className="flex items-center justify-between p-4 pl-8 hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => toggleMonth(monthKey)}
                            >
                              <div className="flex items-center gap-3">
                                {expandedMonths[monthKey] ? (
                                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                                )}
                                <span className="font-medium">{monthName}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="text-green-600">↓ {monthData.download_gb.toFixed(2)} GB</span>
                                <span className="text-blue-600">↑ {monthData.upload_gb.toFixed(2)} GB</span>
                                <span className="font-medium">{monthData.total_gb.toFixed(2)} GB</span>
                              </div>
                            </div>

                            {/* الأيام */}
                            {expandedMonths[monthKey] && dailyData[monthKey] && (
                              <div className="bg-gray-50/50">
                                {dailyData[monthKey].map((dayData: DayData) => (
                                  <div key={dayData.date} className="border-t">
                                    {/* اليوم */}
                                    <div
                                      className="flex items-center justify-between p-3 pl-12 hover:bg-gray-100 cursor-pointer transition-colors"
                                      onClick={() => toggleDay(dayData.date)}
                                    >
                                      <div className="flex items-center gap-3">
                                        {expandedDays[dayData.date] ? (
                                          <ChevronDownIcon className="h-3 w-3 text-gray-400" />
                                        ) : (
                                          <ChevronRightIcon className="h-3 w-3 text-gray-400" />
                                        )}
                                        <span className="text-sm">{dayData.date}</span>
                                      </div>
                                      <div className="flex items-center gap-3 text-xs">
                                        <span className="text-green-600">↓ {dayData.download_gb.toFixed(2)} GB</span>
                                        <span className="text-blue-600">↑ {dayData.upload_gb.toFixed(2)} GB</span>
                                        <span className="font-medium">{dayData.total_gb.toFixed(2)} GB</span>
                                        <span className="text-gray-500">({dayData.session_count} جلسة)</span>
                                      </div>
                                    </div>

                                    {/* الجلسات */}
                                    {expandedDays[dayData.date] && sessionData[dayData.date] && (
                                      <div className="bg-white p-4 pl-16">
                                        <div className="space-y-2">
                                          {sessionData[dayData.date].map((session: SessionData, index: number) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-xs">
                                              <div className="flex items-center gap-3">
                                                <WifiIcon className="h-4 w-4 text-gray-400" />
                                                <div>
                                                  <div className="font-medium">{new Date(session.acctstarttime).toLocaleTimeString('ar-EG')}</div>
                                                  <div className="text-gray-500">المدة: {formatDuration(session.acctsessiontime)}</div>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-4">
                                                <span className="text-green-600">↓ {formatBytes(session.acctoutputoctets)} GB</span>
                                                <span className="text-blue-600">↑ {formatBytes(session.acctinputoctets)} GB</span>
                                                <span className="font-medium">
                                                  {formatBytes(session.acctinputoctets + session.acctoutputoctets)} GB
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}