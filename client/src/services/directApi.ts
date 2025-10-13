// خدمات API مباشرة لـ DMA Radius Manager (للتطبيق المحمول)
import { DIRECT_API } from "../config/api";

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    username: string;
    credits: number;
  };
}

export interface UserData {
  success: boolean;
  firstname?: string;
  lastname?: string;
  email?: string;
  credits?: number;
}

export interface RemainingData {
  success: boolean;
  remainingBytes?: number;
  totalBytes?: number;
  expiry?: string;
}

// تسجيل الدخول مباشرة
export async function directLogin(username: string, password: string): Promise<LoginResponse> {
  try {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(DIRECT_API.login, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const text = await response.text();
    
    try {
      const jsonResponse = JSON.parse(text);
      console.log('📦 JSON Response:', jsonResponse);
      
      // التحقق من الاستجابة JSON
      if (jsonResponse.success === true) {
        return {
          success: true,
          message: jsonResponse.message || 'تم تسجيل الدخول بنجاح',
          user: { 
            username, 
            credits: jsonResponse.credits || 0,
            ...jsonResponse.user 
          }
        };
      } else {
        return {
          success: false,
          message: jsonResponse.message || 'خطأ في اسم المستخدم أو كلمة المرور'
        };
      }
    } catch {
      // 🔐 CRITICAL SECURITY FIX: تحليل أكثر دقة للنصوص
      console.log('📄 Raw DMA Response:', text);
      const lowerText = text.toLowerCase();
      
      // تحقق صحيح ودقيق من استجابة DMA Radius Manager
      // يجب أن تحتوي على مؤشرات واضحة للنجاح
      if (lowerText.includes('logged in successfully') || 
          lowerText.includes('authentication successful') ||
          lowerText.includes('welcome') ||
          (lowerText.includes('success') && lowerText.includes('user') && !lowerText.includes('invalid') && !lowerText.includes('error'))) {
        
        // التحقق من عدم وجود رسائل خطأ في النص
        if (lowerText.includes('invalid') || 
            lowerText.includes('incorrect') || 
            lowerText.includes('wrong') || 
            lowerText.includes('failed') ||
            lowerText.includes('error') ||
            lowerText.includes('denied')) {
          return {
            success: false,
            message: 'بيانات تسجيل الدخول غير صحيحة'
          };
        }
        
        return {
          success: true,
          message: 'تم تسجيل الدخول بنجاح',
          user: { username, credits: 0 }
        };
      } else {
        // أي استجابة أخرى تعتبر فشل في تسجيل الدخول
        console.log('❌ Login failed - unrecognized response');
        return {
          success: false,
          message: 'خطأ في اسم المستخدم أو كلمة المرور'
        };
      }
    }
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    return {
      success: false,
      message: 'خطأ في الاتصال بالخادم'
    };
  }
}

// الحصول على بيانات المستخدم
export async function directGetUserData(username: string): Promise<UserData> {
  try {
    const url = `${DIRECT_API.userdata}?username=${username}`;
    const response = await fetch(url, {
      credentials: 'include',
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('خطأ في جلب بيانات المستخدم:', error);
    return { success: false };
  }
}

// الحصول على البيانات المتبقية
export async function directGetRemaining(username: string): Promise<RemainingData> {
  try {
    const url = `${DIRECT_API.remaining}?apiuser=api&apipass=api123&q=get_remaining&username=${username}`;
    const response = await fetch(url);

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('خطأ في جلب البيانات المتبقية:', error);
    return { success: false };
  }
}

// كشف البيئة (هل هو تطبيق محمول أم ويب؟)
export function isMobileApp(): boolean {
  return (
    window.location.protocol === "capacitor:" ||
    window.location.protocol === "file:" ||
    (window.location.hostname !== "localhost" && !window.location.hostname.includes("replit"))
  );
}