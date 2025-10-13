import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Wifi, Users, Settings, Eye, EyeOff, RefreshCw, Router, CheckCircle, AlertCircle, Edit } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Logo from "@/components/logo";

interface WiFiSettings {
  ssid: string;
  password: string;
}

interface RouterInfo {
  wifiSettings: WiFiSettings;
  connectedDevices: number;
  routerIP: string;
  status: 'online' | 'offline';
}

export default function RouterControl() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newSSID, setNewSSID] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // جلب معلومات الراوتر الكاملة
  const { data: routerInfo, isLoading, error, refetch } = useQuery<{ success: boolean; data: RouterInfo }>({
    queryKey: ["/api/router/info"],
    retry: false,
    refetchInterval: 30000, // تحديث كل 30 ثانية
  });

  // اختبار الاتصال بالراوتر
  const { data: connectionTest } = useQuery({
    queryKey: ["/api/router/test"],
    retry: false,
    refetchInterval: 60000, // اختبار كل دقيقة
  });

  // تحديث إعدادات الواي فاي
  const updateWifiMutation = useMutation({
    mutationFn: async ({ ssid, password }: { ssid: string; password: string }) => {
      await apiRequest("POST", "/api/router/wifi", { ssid, password });
    },
    onSuccess: () => {
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث إعدادات الواي فاي بنجاح. قد تحتاج إلى إعادة الاتصال بالشبكة.",
      });
      setEditDialogOpen(false);
      setNewSSID("");
      setNewPassword("");
      queryClient.invalidateQueries({ queryKey: ["/api/router/info"] });
    },
    onError: (error) => {
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
        title: "خطأ في التحديث",
        description: "فشل في تحديث إعدادات الواي فاي. تأكد من صحة البيانات المدخلة.",
        variant: "destructive",
      });
    },
  });

  // تعبئة الحقول عند فتح مربع التحرير
  useEffect(() => {
    if (editDialogOpen && routerInfo?.data) {
      setNewSSID(routerInfo.data.wifiSettings.ssid);
      setNewPassword(routerInfo.data.wifiSettings.password);
    }
  }, [editDialogOpen, routerInfo]);

  // التحقق من صحة كلمة المرور
  const isValidPassword = (password: string) => {
    return password.length >= 8 && password.length <= 63;
  };

  // التحقق من صحة اسم الشبكة
  const isValidSSID = (ssid: string) => {
    return ssid.length >= 1 && ssid.length <= 32;
  };

  const handleSubmitWifiSettings = () => {
    if (!isValidSSID(newSSID)) {
      toast({
        title: "خطأ في اسم الشبكة",
        description: "اسم الشبكة يجب أن يكون بين 1-32 حرف",
        variant: "destructive",
      });
      return;
    }

    if (!isValidPassword(newPassword)) {
      toast({
        title: "خطأ في كلمة المرور",
        description: "كلمة مرور الواي فاي يجب أن تكون بين 8-63 حرف",
        variant: "destructive",
      });
      return;
    }

    updateWifiMutation.mutate({ ssid: newSSID, password: newPassword });
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
              <h1 className="text-3xl font-bold text-gray-900">التحكم بالراوتر</h1>
            </div>
          </header>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">جارٍ تحميل معلومات الراوتر...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">التحكم بالراوتر</h1>
            </div>
          </header>
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">خطأ في الاتصال بالراوتر</h3>
            <p className="text-gray-600 mb-4">تعذر الاتصال بالراوتر لجلب المعلومات</p>
            <Button onClick={() => refetch()} className="mx-auto">
              <RefreshCw className="w-4 h-4 ml-2" />
              إعادة المحاولة
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const router = routerInfo?.data;
  const isRouterOnline = router?.status === 'online';

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
            <h1 className="text-3xl font-bold text-gray-900">التحكم بالراوتر</h1>
            <Logo />
          </div>
        </header>

        {/* حالة الراوتر */}
        <Card className={`mb-6 ${isRouterOnline ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Router className={`w-6 h-6 ${isRouterOnline ? 'text-green-600' : 'text-red-600'}`} />
                <div>
                  <h3 className="text-lg font-semibold">حالة الراوتر</h3>
                  <p className="text-sm text-gray-600">عنوان الراوتر: {router?.routerIP || '50.0.0.10'}</p>
                </div>
              </div>
              <Badge className={`${isRouterOnline ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                {isRouterOnline ? (
                  <>
                    <CheckCircle className="w-3 h-3 ml-1" />
                    متصل
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 ml-1" />
                    غير متصل
                  </>
                )}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* إعدادات الواي فاي */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-blue-600" />
                إعدادات الواي فاي
              </div>
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!isRouterOnline}>
                    <Edit className="w-4 h-4 ml-2" />
                    تعديل
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>تعديل إعدادات الواي فاي</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="ssid">اسم الشبكة (SSID)</Label>
                      <Input
                        id="ssid"
                        value={newSSID}
                        onChange={(e) => setNewSSID(e.target.value)}
                        placeholder="أدخل اسم الشبكة الجديد"
                        maxLength={32}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        بين 1-32 حرف ({newSSID.length}/32)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="password">كلمة مرور الواي فاي</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="أدخل كلمة المرور الجديدة"
                        maxLength={63}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        بين 8-63 حرف ({newPassword.length}/63)
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                        إلغاء
                      </Button>
                      <Button 
                        onClick={handleSubmitWifiSettings}
                        disabled={updateWifiMutation.isPending || !isValidSSID(newSSID) || !isValidPassword(newPassword)}
                      >
                        {updateWifiMutation.isPending ? (
                          <>
                            <div className="animate-spin w-4 h-4 ml-2 border-2 border-white border-t-transparent rounded-full" />
                            جارٍ التحديث...
                          </>
                        ) : (
                          "حفظ التغييرات"
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-700">اسم الشبكة (SSID)</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg border">
                  <p className="font-mono text-lg">{router?.wifiSettings.ssid || 'غير متوفر'}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">كلمة مرور الواي فاي</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg border flex items-center justify-between">
                  <p className="font-mono text-lg">
                    {showPassword 
                      ? (router?.wifiSettings.password || 'غير متوفر')
                      : '•'.repeat(router?.wifiSettings.password?.length || 8)
                    }
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* الأجهزة المتصلة */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              الأجهزة المتصلة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-green-600">
                  {router?.connectedDevices || 0}
                </p>
                <p className="text-sm text-gray-600">جهاز متصل حالياً</p>
              </div>
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  size="sm"
                >
                  <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
                  تحديث
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* معلومات تقنية */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              المعلومات التقنية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">مواصفات الراوتر</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• النوع: TP-Link TL-WR840N V4</li>
                  <li>• عنوان IP: {router?.routerIP || '50.0.0.10'}</li>
                  <li>• البروتوكول: HTTP Basic Auth</li>
                  <li>• التحديث التلقائي: كل 30 ثانية</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">إرشادات الاستخدام</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• تأكد من أن الراوتر متصل بالشبكة</li>
                  <li>• كلمة المرور يجب أن تكون 8-63 حرف</li>
                  <li>• قد تحتاج لإعادة الاتصال بعد التغيير</li>
                  <li>• تحديث البيانات يتم تلقائياً</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}