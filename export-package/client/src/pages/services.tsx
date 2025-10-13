import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Wifi, Zap, Calendar, CheckCircle, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/logo";

interface UsageData {
  user: {
    firstName: string;
    email: string;
  };
  service: {
    name: string;
    remainingData: number;
    totalData: number;
    expiryDate: string;
    daysRemaining: number;
    isExpired: boolean;
  };
  stats: {
    dailyUsage: number;
    sessionTime: number;
    signalStrength: string;
    currentSpeed: string;
    connectionStatus: string;
  };
  serviceName: string;
  speedMbps: string;
}

interface ServiceDetails {
  name: string;
  speed: string;
  dataLimit: number;
  currentUsage: number;
  remainingData: number;
  expiryDate: string;
  daysRemaining: number;
  isActive: boolean;
}

export default function Services() {
  const [, setLocation] = useLocation();

  const { data: usageData, isLoading, error, refetch } = useQuery<UsageData>({
    queryKey: ["/api/dashboard"],
    retry: false,
  });

  const parseServiceName = (serviceName: string) => {
    // Parse service name like "300GB-10M-PPPOE"
    const parts = serviceName.split('-');
    let dataLimit = 0;
    let speed = '';
    
    if (parts.length >= 2) {
      const dataStr = parts[0];
      const speedStr = parts[1];
      
      // Extract data limit
      const dataMatch = dataStr.match(/(\d+)GB/);
      if (dataMatch) {
        dataLimit = parseInt(dataMatch[1]);
      }
      
      // Extract speed
      const speedMatch = speedStr.match(/(\d+)M/);
      if (speedMatch) {
        speed = `${speedMatch[1]} Mbps`;
      }
    }
    
    return { dataLimit, speed };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/")}
                className="p-2"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">الخدمات والباقات</h1>
            </div>
          </header>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">جارٍ تحميل معلومات الخدمة...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/")}
                className="p-2"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">الخدمات والباقات</h1>
            </div>
          </header>
          <Card className="p-8 text-center">
            <Wifi className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">خطأ في تحميل البيانات</h3>
            <p className="text-gray-600 mb-4">تعذر الاتصال بالخادم لجلب معلومات الخدمة</p>
            <Button onClick={() => refetch()} className="mx-auto">
              <RefreshCw className="w-4 h-4 ml-2" />
              إعادة المحاولة
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const serviceInfo = parseServiceName(usageData?.serviceName || usageData?.service?.name || '');
  const serviceDetails: ServiceDetails = {
    name: usageData?.serviceName || usageData?.service?.name || 'غير محدد',
    speed: serviceInfo.speed || usageData?.speedMbps || 'غير محدد',
    dataLimit: serviceInfo.dataLimit || usageData?.service?.totalData || 0,
    currentUsage: (serviceInfo.dataLimit || usageData?.service?.totalData || 0) - (usageData?.service?.remainingData || 0),
    remainingData: usageData?.service?.remainingData || 0,
    expiryDate: usageData?.service?.expiryDate || '',
    daysRemaining: usageData?.service?.daysRemaining || 0,
    isActive: !usageData?.service?.isExpired
  };

  const usagePercentage = serviceDetails.dataLimit > 0 
    ? (serviceDetails.currentUsage / serviceDetails.dataLimit) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/")}
              className="p-2"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">الخدمات والباقات</h1>
          </div>
        </header>

        {/* Current Service Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="w-6 h-6 text-blue-600" />
                الباقة الحالية
              </div>
              <Badge variant={serviceDetails.isActive ? "default" : "destructive"}>
                {serviceDetails.isActive ? "نشطة" : "منتهية الصلاحية"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">اسم الباقة</p>
                <p className="text-xl font-bold text-gray-900">{serviceDetails.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">السرعة</p>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <p className="text-xl font-bold text-blue-600">{serviceDetails.speed}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">حجم الباقة</p>
                <p className="text-xl font-bold text-green-600">{serviceDetails.dataLimit} GB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>إحصائيات الاستهلاك</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Usage Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">استهلاك البيانات</span>
                  <span className="text-sm font-medium text-gray-700">
                    {serviceDetails.currentUsage.toFixed(1)} / {serviceDetails.dataLimit} GB
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      usagePercentage > 90 ? 'bg-red-500' : 
                      usagePercentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, usagePercentage)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  تم استهلاك {usagePercentage.toFixed(1)}% من الباقة
                </p>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {serviceDetails.remainingData.toFixed(1)} GB
                  </p>
                  <p className="text-sm text-gray-600">متبقي من الباقة</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {usageData?.stats?.dailyUsage?.toFixed(2) || '0.00'} GB
                  </p>
                  <p className="text-sm text-gray-600">الاستهلاك اليومي</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {serviceDetails.daysRemaining}
                  </p>
                  <p className="text-sm text-gray-600">يوم متبقي</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              تفاصيل الخدمة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">تاريخ انتهاء الصلاحية</p>
                <p className="text-lg font-semibold text-gray-800">
                  {serviceDetails.expiryDate ? new Date(serviceDetails.expiryDate).toLocaleDateString("sv-SE") : 'غير محدد'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">حالة الاتصال</p>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    usageData?.stats?.connectionStatus === 'متصل' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <p className="text-lg font-semibold text-gray-800">
                    {usageData?.stats?.connectionStatus || 'غير محدد'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">قوة الإشارة</p>
                <p className="text-lg font-semibold text-gray-800">
                  {usageData?.stats?.signalStrength || 'غير محدد'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">وقت الجلسة الحالي</p>
                <p className="text-lg font-semibold text-gray-800">
                  {usageData?.stats?.sessionTime ? 
                    `${Math.floor(usageData.stats.sessionTime / 3600)}:${Math.floor((usageData.stats.sessionTime % 3600) / 60).toString().padStart(2, '0')}:${(usageData.stats.sessionTime % 60).toString().padStart(2, '0')}` 
                    : '00:00:00'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Features */}
        <Card>
          <CardHeader>
            <CardTitle>مميزات الباقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">اتصال مستقر وسريع</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">دعم فني على مدار الساعة</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">حماية متقدمة للشبكة</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">مراقبة الاستهلاك في الوقت الفعلي</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Type Information */}
        {serviceDetails.name.includes('PPPOE') && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>معلومات نوع الاتصال</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">PPPoE (Point-to-Point Protocol over Ethernet)</h4>
                <p className="text-blue-700 text-sm">
                  نوع اتصال موثوق يوفر أمان عالي وسرعة مستقرة. يتطلب اسم مستخدم وكلمة مرور للاتصال.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}