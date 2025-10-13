import express from 'express';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// رابط تحميل ملف APK
router.get('/download-apk', (req, res) => {
  const filePath = path.join(process.cwd(), 'saida-wifi-apk-ready.tar.gz');
  
  // التحقق من وجود الملف
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ 
      error: 'ملف APK غير موجود',
      message: 'الرجاء تشغيل سكريپت prepare-apk.sh أولاً'
    });
  }
  
  // إعداد headers للتحميل
  const fileName = 'saida-wifi-apk-ready.tar.gz';
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Type', 'application/gzip');
  res.setHeader('Content-Length', fs.statSync(filePath).size);
  
  // إرسال الملف
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
  
  fileStream.on('error', (error) => {
    console.error('خطأ في إرسال الملف:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'خطأ في تحميل الملف' });
    }
  });
  
  console.log(`📦 بدء تحميل APK: ${fileName} (${fs.statSync(filePath).size} bytes)`);
});

// صفحة معلومات التحميل
router.get('/apk-info', (req, res) => {
  const filePath = path.join(process.cwd(), 'saida-wifi-apk-ready.tar.gz');
  const fileExists = fs.existsSync(filePath);
  const fileSize = fileExists ? fs.statSync(filePath).size : 0;
  
  const html = `
  <!DOCTYPE html>
  <html dir="rtl" lang="ar">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تحميل تطبيق SAIDA WiFi APK</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        min-height: 100vh;
      }
      .container {
        background: rgba(255,255,255,0.1);
        padding: 30px;
        border-radius: 15px;
        backdrop-filter: blur(10px);
        text-align: center;
      }
      .download-btn {
        display: inline-block;
        background: #4CAF50;
        color: white;
        padding: 15px 30px;
        text-decoration: none;
        border-radius: 8px;
        font-size: 18px;
        margin: 20px 0;
        transition: all 0.3s ease;
      }
      .download-btn:hover {
        background: #45a049;
        transform: translateY(-2px);
      }
      .info-box {
        background: rgba(255,255,255,0.2);
        padding: 20px;
        border-radius: 10px;
        margin: 20px 0;
        text-align: right;
      }
      .status {
        font-size: 20px;
        margin: 10px 0;
      }
      .success { color: #4CAF50; }
      .error { color: #f44336; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>🚀 تطبيق SAIDA WiFi Manager</h1>
      
      <div class="status ${fileExists ? 'success' : 'error'}">
        ${fileExists ? '✅ ملف APK جاهز للتحميل' : '❌ ملف APK غير متوفر'}
      </div>
      
      ${fileExists ? `
        <div class="info-box">
          <h3>معلومات الملف:</h3>
          <p><strong>الاسم:</strong> saida-wifi-apk-ready.tar.gz</p>
          <p><strong>الحجم:</strong> ${(fileSize / (1024*1024)).toFixed(1)} ميجابايت</p>
          <p><strong>النوع:</strong> حزمة APK جاهزة للبناء</p>
        </div>
        
        <a href="/api/download-apk" class="download-btn">
          📦 تحميل الملف
        </a>
        
        <div class="info-box">
          <h3>طريقة الاستخدام:</h3>
          <ol>
            <li>حمل الملف</li>
            <li>فك الضغط: <code>tar -xzf saida-wifi-apk-ready.tar.gz</code></li>
            <li>في مجلد android: <code>./gradlew assembleDebug</code></li>
            <li>العثور على APK في: <code>android/app/build/outputs/apk/debug/</code></li>
          </ol>
        </div>
      ` : `
        <div class="info-box">
          <p>لم يتم العثور على ملف APK. الرجاء تشغيل الأمر التالي أولاً:</p>
          <code>./prepare-apk.sh</code>
        </div>
      `}
      
      <div class="info-box">
        <h3>📱 استخدم التطبيق مباشرة:</h3>
        <p><a href="/" style="color: #4CAF50;">افتح التطبيق في المتصفح</a></p>
      </div>
    </div>
  </body>
  </html>`;
  
  res.send(html);
});

export default router;