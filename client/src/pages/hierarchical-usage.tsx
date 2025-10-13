import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Calendar, BarChart3, Clock, Download, Upload, Wifi } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Logo from "@/components/logo";

interface YearData {
  year: number;
  total_sessions: number;
  total_gb: number;
  total_duration: number;
}

interface MonthData {
  month: number;
  month_name: string;
  total_sessions: number;
  total_gb: number;
  total_duration: number;
}

interface DayData {
  day: number;
  date: string;
  total_sessions: number;
  total_gb: number;
  total_duration: number;
}

interface SessionData {
  radacctid: number;
  acctstarttime: string;
  acctstoptime: string;
  acctsessiontime: number;
  download_mb: number;
  upload_mb: number;
  total_mb: number;
  nasipaddress: string;
  framedipaddress: string;
}

export default function HierarchicalUsage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  const [years, setYears] = useState<YearData[]>([]);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  
  const [monthsData, setMonthsData] = useState<Record<number, MonthData[]>>({});
  const [daysData, setDaysData] = useState<Record<string, DayData[]>>({});
  const [sessionsData, setSessionsData] = useState<Record<string, SessionData[]>>({});
  
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

  // دالة للحصول على JWT token  
  const getAuthHeaders = async () => {
    // استخدام Capacitor Preferences أو localStorage
    let token = '';
    try {
      // Try Capacitor Preferences first (for mobile)
      const { Preferences } = await import('@capacitor/preferences');
      const result = await Preferences.get({ key: 'auth_token' });
      token = result.value || '';
    } catch {
      // Fallback to localStorage (for web)
      token = localStorage.getItem('auth_token') || '';
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  // جلب قائمة السنوات
  useEffect(() => {
    if (!currentUsername || !isAuthenticated) return;
    const loadYears = async () => {
      setLoading(true);
      try {
        const headers = await getAuthHeaders();
        const response = await fetch(`/api/usage/years/${currentUsername}`, {
          headers,
        });
        
        if (response.status === 401) {
          // Token expired, show user-friendly message and redirect
          toast({
            title: "انتهت صلاحية الجلسة",
            description: "انتهت صلاحية توكن الدخول. سيتم توجيهك لتجديد التوكن...",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = `/update-token?username=${currentUsername}&redirect=/hierarchical-usage`;
          }, 2000);
          return;
        }
        
        const data = await response.json();
        if (data.success) {
          setYears(data.years);
        } else {
          throw new Error(data.message || 'فشل في جلب البيانات');
        }
      } catch (error) {
        console.error('Error loading years:', error);
        toast({
          title: "خطأ في جلب البيانات",
          description: "حدث خطأ أثناء جلب بيانات السنوات. تحقق من اتصال الإنترنت.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadYears();
  }, [currentUsername, isAuthenticated, toast]);

  // جلب بيانات الشهور لسنة معينة
  const loadMonths = async (year: number) => {
    if (monthsData[year]) return; // البيانات محملة مسبقاً
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/usage/months/${currentUsername}/${year}`, {
        headers,
      });
      const data = await response.json();
      if (data.success) {
        setMonthsData(prev => ({ ...prev, [year]: data.months }));
      } else if (response.status === 401) {
        // Token expired, redirect to login
        window.location.href = "/api/login";
        return;
      }
    } catch (error) {
      console.error('Error loading months:', error);
      toast({
        title: "خطأ في جلب البيانات",
        description: "حدث خطأ أثناء جلب بيانات الشهور",
        variant: "destructive",
      });
    }
  };

  // جلب بيانات الأيام لشهر معين
  const loadDays = async (year: number, month: number) => {
    const key = `${year}-${month}`;
    if (daysData[key]) return; // البيانات محملة مسبقاً
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/usage/days/${currentUsername}/${year}/${month}`, {
        headers,
      });
      const data = await response.json();
      if (data.success) {
        setDaysData(prev => ({ ...prev, [key]: data.days }));
      } else if (response.status === 401) {
        // Token expired, redirect to update token page
        window.location.href = `/update-token?username=${currentUsername}&redirect=/hierarchical-usage`;
        return;
      }
    } catch (error) {
      toast({
        title: "خطأ في جلب البيانات",
        description: "حدث خطأ أثناء جلب بيانات الأيام",
        variant: "destructive",
      });
    }
  };

  // جلب بيانات الجلسات ليوم معين
  const loadSessions = async (year: number, month: number, day: number) => {
    const key = `${year}-${month}-${day}`;
    if (sessionsData[key]) return; // البيانات محملة مسبقاً
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/usage/sessions/${currentUsername}/${year}/${month}/${day}`, {
        headers,
      });
      const data = await response.json();
      if (data.success) {
        setSessionsData(prev => ({ ...prev, [key]: data.sessions }));
      } else if (response.status === 401) {
        // Token expired, redirect to update token page
        window.location.href = `/update-token?username=${currentUsername}&redirect=/hierarchical-usage`;
        return;
      }
    } catch (error) {
      toast({
        title: "خطأ في جلب البيانات",
        description: "حدث خطأ أثناء جلب بيانات الجلسات",
        variant: "destructive",
      });
    }
  };

  // Toggle year expansion
  const toggleYear = async (year: number) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
      await loadMonths(year);
    }
    setExpandedYears(newExpanded);
  };

  // Toggle month expansion
  const toggleMonth = async (year: number, month: number) => {
    const key = `${year}-${month}`;
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
      await loadDays(year, month);
    }
    setExpandedMonths(newExpanded);
  };

  // Toggle day expansion
  const toggleDay = async (year: number, month: number, day: number) => {
    const key = `${year}-${month}-${day}`;
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
      await loadSessions(year, month, day);
    }
    setExpandedDays(newExpanded);
  };

  // تنسيق الوقت
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}س ${minutes}د`;
  };

  // تنسيق التاريخ والوقت
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ar-SA', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  // أسماء الشهور بالعربية
  const getArabicMonthName = (monthNum: number) => {
    const months = [
      '', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[monthNum] || `شهر ${monthNum}`;
  };

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

  return (
    <div className="p-4 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <div>
            <h1 className="text-2xl font-bold">سجل الاستهلاك الهرمي</h1>
            <p className="text-muted-foreground">عرض تفصيلي مُتدرج للاستهلاك حسب السنة → الشهر → اليوم → الجلسات</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setLocation("/")}>
          العودة للوحة الرئيسية
        </Button>
      </div>

      {/* Hierarchical Usage Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            السجل الهرمي للاستهلاك
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {years.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد بيانات استهلاك متاحة
            </div>
          ) : (
            years.map(year => (
              <div key={year.year} className="border rounded-lg p-4">
                {/* السنة */}
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                  onClick={() => toggleYear(year.year)}
                >
                  <div className="flex items-center gap-3">
                    {expandedYears.has(year.year) ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span className="text-lg font-semibold">سنة {year.year}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="secondary">{year.total_sessions} جلسة</Badge>
                    <Badge variant="outline">{(typeof year.total_gb === 'number' ? year.total_gb : Number(year.total_gb || 0)).toFixed(2)} GB</Badge>
                    <Badge variant="outline">{formatDuration(year.total_duration)}</Badge>
                  </div>
                </div>

                {/* الشهور */}
                {expandedYears.has(year.year) && monthsData[year.year] && (
                  <div className="mr-6 mt-3 space-y-2">
                    {monthsData[year.year].map(month => (
                      <div key={month.month} className="border-r-2 border-gray-200 pr-4">
                        <div 
                          className="flex items-center justify-between cursor-pointer hover:bg-blue-50 p-2 rounded"
                          onClick={() => toggleMonth(year.year, month.month)}
                        >
                          <div className="flex items-center gap-3">
                            {expandedMonths.has(`${year.year}-${month.month}`) ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                            <Calendar className="h-4 w-4 text-green-600" />
                            <span className="font-medium">{getArabicMonthName(month.month)}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <Badge variant="secondary">{month.total_sessions} جلسة</Badge>
                            <Badge variant="outline">{(typeof month.total_gb === 'number' ? month.total_gb : Number(month.total_gb || 0)).toFixed(2)} GB</Badge>
                            <Badge variant="outline">{formatDuration(month.total_duration)}</Badge>
                          </div>
                        </div>

                        {/* الأيام */}
                        {expandedMonths.has(`${year.year}-${month.month}`) && daysData[`${year.year}-${month.month}`] && (
                          <div className="mr-6 mt-2 space-y-1">
                            {daysData[`${year.year}-${month.month}`].map(day => (
                              <div key={day.day} className="border-r-2 border-gray-100 pr-4">
                                <div 
                                  className="flex items-center justify-between cursor-pointer hover:bg-green-50 p-2 rounded"
                                  onClick={() => toggleDay(year.year, month.month, day.day)}
                                >
                                  <div className="flex items-center gap-3">
                                    {expandedDays.has(`${year.year}-${month.month}-${day.day}`) ? 
                                      <ChevronDown className="h-3 w-3" /> : 
                                      <ChevronRight className="h-3 w-3" />
                                    }
                                    <Calendar className="h-4 w-4 text-purple-600" />
                                    <span>يوم {day.day}</span>
                                    <span className="text-xs text-gray-500">({day.date})</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs">
                                    <Badge variant="secondary">{day.total_sessions} جلسة</Badge>
                                    <Badge variant="outline">{(typeof day.total_gb === 'number' ? day.total_gb : Number(day.total_gb || 0)).toFixed(2)} GB</Badge>
                                    <Badge variant="outline">{formatDuration(day.total_duration)}</Badge>
                                  </div>
                                </div>

                                {/* الجلسات */}
                                {expandedDays.has(`${year.year}-${month.month}-${day.day}`) && sessionsData[`${year.year}-${month.month}-${day.day}`] && (
                                  <div className="mr-6 mt-2 space-y-1">
                                    {sessionsData[`${year.year}-${month.month}-${day.day}`].map(session => (
                                      <div key={session.radacctid} className="bg-gray-50 p-3 rounded border-r-4 border-orange-400">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <Wifi className="h-4 w-4 text-orange-600" />
                                            <span className="text-sm font-medium">جلسة #{session.radacctid}</span>
                                          </div>
                                          <Badge variant="outline">{(typeof session.total_mb === 'number' ? session.total_mb : Number(session.total_mb || 0)).toFixed(1)} MB</Badge>
                                        </div>
                                        <div className="mt-2 grid grid-cols-2 gap-4 text-xs text-gray-600">
                                          <div>
                                            <span className="font-medium">البداية:</span> {formatDateTime(session.acctstarttime)}
                                          </div>
                                          {session.acctstoptime && (
                                            <div>
                                              <span className="font-medium">النهاية:</span> {formatDateTime(session.acctstoptime)}
                                            </div>
                                          )}
                                          <div className="flex items-center gap-1">
                                            <Download className="h-3 w-3" />
                                            <span>{(typeof session.download_mb === 'number' ? session.download_mb : Number(session.download_mb || 0)).toFixed(1)} MB</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Upload className="h-3 w-3" />
                                            <span>{(typeof session.upload_mb === 'number' ? session.upload_mb : Number(session.upload_mb || 0)).toFixed(1)} MB</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span>{formatDuration(session.acctsessiontime)}</span>
                                          </div>
                                          <div>
                                            <span className="font-medium">IP:</span> {session.framedipaddress || 'غير محدد'}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}