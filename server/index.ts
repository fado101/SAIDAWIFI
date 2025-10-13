import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

console.log("🚀 Server bootstrap starting...");

// Detect environment
if (!process.env.NODE_ENV) {
  const hostname = process.env.REPL_SLUG || process.env.REPLIT_SLUG || '';
  if (hostname || process.env.REPLIT_DEPLOYMENT === '1') {
    process.env.NODE_ENV = 'production';
    console.log('🌍 Auto-detected production environment');
  } else {
    process.env.NODE_ENV = 'development';
    console.log('🔧 Development environment detected');
  }
} else {
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
}

// CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'https://saidawifi.com',
      'https://www.saidawifi.com'
    ];
    if (origin.includes('.replit.dev') || origin.includes('.replit.app')) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (process.env.NODE_ENV === 'production') {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With','Accept','Origin','Cache-Control','Pragma'],
  maxAge: 86400
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.options('*', cors());

app.use((req, res, next) => {
  console.log(`📞 ${req.method} ${req.url} - Origin: ${req.get('origin')}`);
  next();
});

(async () => {
  console.log("⚡ Registering routes...");
  await registerRoutes(app);
  console.log("✅ Routes registered.");

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || "Internal Server Error" });
    throw err;
  });

  // Static
  app.use('/flutter', express.static('flutter_web'));
  app.get('/flutter', (_req, res) => res.sendFile('index.html', { root: 'flutter_web' }));
  app.get('/flutter/*', (_req, res) => res.sendFile('index.html', { root: 'flutter_web' }));

  if (app.get("env") === "development") {
    const { createServer } = await import("http");
    const server = createServer(app);
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Port
  const PORT = Number(process.env.PORT) || 80;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
})();   // ← ← ← مهم جدًا إغلاق القوس هنا
