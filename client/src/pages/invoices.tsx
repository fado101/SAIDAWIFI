import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FileText, CheckCircle, XCircle, CreditCard, Building, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/logo";

interface Invoice {
  id: string;
  date: string;
  price: string;
  paid: string;
  paymode: string;
  service: string;
  managername: string;
}

export default function Invoices() {
  const [, setLocation] = useLocation();
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const { data: invoicesResponse, isLoading, error, refetch } = useQuery<{success: boolean, invoices: Invoice[]}>({
    queryKey: ["/api/invoices"],
    retry: false,
  });

  // Extract invoices from response object
  const invoices = invoicesResponse?.invoices || [];
  
  const filteredInvoices = invoices.filter(invoice => {
    const paidDate = new Date(invoice.paid);
    const isPaid = paidDate.getFullYear() > 1900;
    console.log(`Filter invoice ${invoice.id}: paid=${invoice.paid}, year=${paidDate.getFullYear()}, isPaid=${isPaid}`);
    if (selectedFilter === "paid") return isPaid;
    if (selectedFilter === "unpaid") return !isPaid;
    return true;
  });

  const getStatusBadge = (invoice: Invoice) => {
    const paidDate = new Date(invoice.paid);
    const isPaid = paidDate.getFullYear() > 1900;
    console.log(`Status badge for invoice ${invoice.id}: paid=${invoice.paid}, year=${paidDate.getFullYear()}, isPaid=${isPaid}`);
    if (isPaid) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 ml-1" />
          مدفوعة
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="w-3 h-3 ml-1" />
          غير مدفوعة
        </Badge>
      );
    }
  };

  const getPaymentMethodText = (paymode: string) => {
    switch (paymode) {
      case "0":
        return "غير محدد";
      case "1":
        return "نقد";
      case "2":
        return "شيك";
      case "3":
        return "بطاقة ائتمان";
      case "4":
        return "تحويل بنكي";
      case "5":
        return "PayPal";
      default:
        return "غير محدد";
    }
  };

  const getPaymentMethodIcon = (paymode: string) => {
    switch (paymode) {
      case "0":
        return <CreditCard className="w-4 h-4" />;
      case "1":
        return <CreditCard className="w-4 h-4" />;
      case "2":
        return <CreditCard className="w-4 h-4" />;
      case "3":
        return <CreditCard className="w-4 h-4" />;
      case "4":
        return <Building className="w-4 h-4" />;
      case "5":
        return <CreditCard className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    if (numPrice >= 1000) {
      return `${(numPrice / 1000).toFixed(0)}k`;
    }
    return numPrice.toFixed(0);
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
              <h1 className="text-3xl font-bold text-gray-900">الفواتير</h1>
            </div>
          </header>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">جارٍ تحميل الفواتير...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">الفواتير</h1>
            </div>
          </header>
          <Card className="p-8 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">خطأ في تحميل الفواتير</h3>
            <p className="text-gray-600 mb-4">تعذر الاتصال بالخادم لجلب بيانات الفواتير</p>
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
          <div className="flex items-center gap-2 sm:gap-4 mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/")}
              className="p-2 shrink-0"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Logo size="sm" className="ml-1 sm:ml-3 shrink-0" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">الفواتير</h1>
          </div>
          
          {/* Filter Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 mb-6 overflow-x-auto">
            <Button
              variant={selectedFilter === "all" ? "default" : "outline"}
              onClick={() => setSelectedFilter("all")}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap shrink-0"
            >
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
              الكل ({invoices?.length || 0})
            </Button>
            <Button
              variant={selectedFilter === "paid" ? "default" : "outline"}
              onClick={() => setSelectedFilter("paid")}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap shrink-0"
            >
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              مدفوعة ({invoices?.filter(inv => {
                const paidDate = new Date(inv.paid);
                return paidDate.getFullYear() > 1900;
              }).length || 0})
            </Button>
            <Button
              variant={selectedFilter === "unpaid" ? "default" : "outline"}
              onClick={() => setSelectedFilter("unpaid")}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap shrink-0"
            >
              <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              غير مدفوعة ({invoices?.filter(inv => {
                const paidDate = new Date(inv.paid);
                return paidDate.getFullYear() <= 1900;
              }).length || 0})
            </Button>
          </div>
        </header>

        {/* Invoices List */}
        <div className="space-y-4">
          {filteredInvoices.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد فواتير</h3>
              <p className="text-gray-600">
                {selectedFilter === "all" 
                  ? "لم يتم العثور على أي فواتير لحسابك"
                  : selectedFilter === "paid"
                  ? "لا توجد فواتير مدفوعة"
                  : "لا توجد فواتير غير مدفوعة"
                }
              </p>
            </Card>
          ) : (
            filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="overflow-hidden">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                          فاتورة #{invoice.id}
                        </h3>
                        <div className="shrink-0">
                          {getStatusBadge(invoice)}
                        </div>
                      </div>
                      <div className="space-y-1 text-xs sm:text-sm">
                        <p className="text-gray-600">
                          التاريخ: {new Date(invoice.date).toLocaleDateString("sv-SE")}
                        </p>
                        <p className="text-gray-600 break-words">
                          الخدمة: {invoice.service}
                        </p>
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(invoice.paymode)}
                          <span className="text-gray-600 break-words">
                            {getPaymentMethodText(invoice.paymode)}
                          </span>
                        </div>
                        {invoice.paid && invoice.paid !== '0000-00-00' && (
                          <p className="text-green-600">
                            دُفعت: {new Date(invoice.paid).toLocaleDateString("sv-SE")}
                          </p>
                        )}
                        <p className="text-gray-600 break-words">
                          المدير: {invoice.managername}
                        </p>
                      </div>
                    </div>
                    <div className="text-right sm:text-left shrink-0">
                      <p className={`text-lg sm:text-xl font-bold break-words ${
                        invoice.paid && invoice.paid !== '0000-00-00'
                          ? "text-green-600" 
                          : "text-red-600"
                      }`}>
                        {formatPrice(invoice.price)}
                      </p>
                      <p className="text-xs text-gray-500">ليرة سورية</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary */}
        {invoices && invoices.length > 0 && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ملخص الفواتير</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{invoices.length}</p>
                  <p className="text-sm text-gray-600">إجمالي الفواتير</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {invoices.filter(inv => {
                      const paidDate = new Date(inv.paid);
                      return paidDate.getFullYear() > 1900;
                    }).length}
                  </p>
                  <p className="text-sm text-gray-600">الفواتير المدفوعة</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {invoices.filter(inv => {
                      const paidDate = new Date(inv.paid);
                      return paidDate.getFullYear() <= 1900;
                    }).length}
                  </p>
                  <p className="text-sm text-gray-600">الفواتير غير المدفوعة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}