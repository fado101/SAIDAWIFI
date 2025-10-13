import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, MessageCircle, Send, User, Clock, CheckCircle, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/logo";

interface SupportTicket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
}

export default function Support() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");

  const { data: tickets, isLoading, error, refetch } = useQuery<SupportTicket[]>({
    queryKey: ["/api/support/tickets"],
    retry: false,
  });

  const { data: userProfile } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const submitMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      await apiRequest("POST", "/api/support/submit", { message });
    },
    onSuccess: () => {
      toast({
        title: "تم إرسال الرسالة",
        description: "تم إرسال رسالتك إلى الدعم الفني بنجاح. سيتم الرد عليك في أقرب وقت ممكن.",
      });
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
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
        title: "خطأ",
        description: "فشل في إرسال رسالة الدعم",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
      case "مفتوح":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <MessageCircle className="w-3 h-3 ml-1" />
            مفتوح
          </Badge>
        );
      case "closed":
      case "مغلق":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <CheckCircle className="w-3 h-3 ml-1" />
            مغلق
          </Badge>
        );
      case "pending":
      case "قيد الانتظار":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 ml-1" />
            قيد الانتظار
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            جديد
          </Badge>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
      case "عالي":
        return (
          <Badge variant="destructive">
            عالي
          </Badge>
        );
      case "medium":
      case "متوسط":
        return (
          <Badge variant="default">
            متوسط
          </Badge>
        );
      case "low":
      case "منخفض":
        return (
          <Badge variant="secondary">
            منخفض
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            عادي
          </Badge>
        );
    }
  };

  const handleSubmitMessage = () => {
    if (!newMessage.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى كتابة رسالة قبل الإرسال",
        variant: "destructive",
      });
      return;
    }

    submitMessageMutation.mutate(newMessage);
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
              <h1 className="text-3xl font-bold text-gray-900">الدعم الفني</h1>
            </div>
          </header>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">جارٍ تحميل طلبات الدعم...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">الدعم الفني</h1>
            </div>
          </header>
          <Card className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">خطأ في تحميل البيانات</h3>
            <p className="text-gray-600 mb-4">تعذر الاتصال بالخادم لجلب طلبات الدعم</p>
            <Button onClick={() => refetch()} className="mx-auto">
              <RefreshCw className="w-4 h-4 ml-2" />
              إعادة المحاولة
            </Button>
          </Card>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-gray-900">الدعم الفني</h1>
          </div>
        </header>

        {/* Quick Contact Info */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <MessageCircle className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800">مرحباً {userProfile?.firstName || 'بك'}</h3>
            </div>
            <p className="text-blue-700 mb-3">
              نحن هنا لمساعدتك! يمكنك إرسال رسالة إلى فريق الدعم الفني وسنرد عليك في أقرب وقت ممكن.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-600">
              <div>
                <p>• أوقات العمل: 24/7</p>
                <p>• متوسط وقت الرد: 2-4 ساعات</p>
              </div>
              <div>
                <p>• دعم فني متخصص</p>
                <p>• حل سريع للمشاكل</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Message Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-green-600" />
              إرسال رسالة جديدة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اكتب رسالتك أو استفسارك
                </label>
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="اكتب هنا مشكلتك أو استفسارك بالتفصيل..."
                  className="min-h-[120px]"
                  disabled={submitMessageMutation.isPending}
                />
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmitMessage}
                  disabled={submitMessageMutation.isPending || !newMessage.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submitMessageMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 ml-2 border-2 border-white border-t-transparent rounded-full" />
                      جارٍ الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 ml-2" />
                      إرسال الرسالة
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Tickets History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              سجل الدعم الفني
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!tickets || tickets.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد رسائل دعم سابقة</h3>
                <p className="text-gray-600">
                  بمجرد إرسال رسالة دعم، ستظهر هنا مع الردود من فريق الدعم الفني.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {ticket.title || `رسالة دعم #${ticket.id}`}
                          </h4>
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{ticket.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {new Date(ticket.createdAt).toLocaleDateString("ar-SA", {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>بواسطة: {userProfile?.firstName || 'أنت'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Support Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>معلومات مفيدة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">المشاكل الشائعة</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• مشاكل في سرعة الإنترنت</li>
                  <li>• صعوبة في الاتصال</li>
                  <li>• استفسارات حول الفواتير</li>
                  <li>• طلبات تجديد الباقة</li>
                  <li>• مشاكل تقنية أخرى</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">نصائح للحصول على مساعدة أفضل</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• اذكر تفاصيل المشكلة بوضوح</li>
                  <li>• أرفق رقم حسابك إن أمكن</li>
                  <li>• حدد وقت حدوث المشكلة</li>
                  <li>• اذكر أي رسائل خطأ ظهرت لك</li>
                  <li>• كن مهذباً ومحترماً</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}