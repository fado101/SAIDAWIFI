import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

console.log("🚀 Server bootstrap starting...");

// ✅ CRITICAL FIX: تحديد بيئة النشر تلقائياً
if (!process.env.NODE_ENV) {
  // إذا كان الرابط يحتوي على .replit.app فهو نشر
  const hostname = process.env.REPL_SLUG || process.env.REPLIT_SLUG || '';
  if (hostname || process.env.REPLIT_DEPLOYMENT === '1') {
    process.env.NODE_ENV = 'production';
    console.log('🌍 Auto-detected production environment for deployment');
  } else {
    process.env.NODE_ENV = 'development';
    console.log('🔧 Development environment detected');
  }
} else {
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
}

// ✅ CRITICAL FIX: إعدادات CORS محسنة للنشر
app.use(cors({
  origin: function (origin, callback) {
    // السماح بالطلبات بدون origin (مثل mobile apps)
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'https://saidawifi.com',
      'https://www.saidawifi.com'
    ];
    // السماح بجميع نطاقات replit
    if (origin.includes('.replit.dev') || origin.includes('.replit.app')) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // في النشر، السماح بجميع الطلبات لتجنب مشاكل CORS
    if (process.env.NODE_ENV === 'production') {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'Pragma'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 86400 // 24 hours
}));

// ✅ CRITICAL FIX: إعدادات middleware محسنة
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ إضافة middleware للتعامل مع preflight requests
app.options('*', cors());

// ✅ إضافة security headers للنشر
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// ✅ CRITICAL: إضافة logging شامل لجميع الطلبات في النشر
app.use((req, res, next) => {
  console.log(`📞 ${req.method} ${req.url} - Origin: ${req.get('origin')} - Content-Type: ${req.get('content-type')}`);
  if (req.method === 'POST' && req.url.includes('/api/login')) {
    console.log(`🔐 LOGIN ATTEMPT: Body keys: ${Object.keys(req.body)}`);
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += `:: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });
  next();
});

(async () => {
  console.log("⚡ Registering routes...");
  await registerRoutes(app); // فقط لتسجيل الـ routes
  console.log("✅ Routes registered.");

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
     const status = err.status || err.statusCode || 500;
     const message = err.message || "Internal Server Error";
     res.status(status).json({ message });
     throw err;
  });

  // Static routes
  console.log("📦 Setting up static routes...");
  app.use('/flutter', express.static('flutter_web'));
  app.get('/app', (req, res) => res.sendFile('pure_html.html', { root: 'flutter_web' }));
  app.get('/hierarchical-usage', (req, res) => res.sendFile('hierarchical_usage.html', { root: 'flutter_web' }));
  app.get('/update-token', (req, res) => res.sendFile('update_token.html', { root: 'flutter_web' }));
  app.get('/flutter/simple', (req, res) => res.sendFile('simple.html', { root: 'flutter_web' }));
  app.get('/flutter', (req, res) => res.sendFile('index.html', { root: 'flutter_web' }));
  app.get('/flutter/*', (req, res) => {
    if (req.path.startsWith('/flutter/api/')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile('index.html', { root: 'flutter_web' });
  });

  // Vite dev only
  if (app.get("env") === "development") {
    console.log("🛠 Development mode: setting up Vite...");
    const { createServer } = await import("http");
    const server = createServer(app);
    await setupVite(app, server);
  } else {
    console.log("🌐 Production mode: serving static files...");
    serveStatic(app);
  }

  // ✅ CRITICAL FIX: استخدام Port 80 للنشر حسب إعدادات .replit
  const PORT = Number(process.env.PORT) || 80;
  console.log("🌍 process.env.PORT =", process.env.PORT);
  console.log("🔊 Final port to be used:", PORT);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
})();