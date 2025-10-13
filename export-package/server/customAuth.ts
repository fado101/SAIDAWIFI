import type { Express, RequestHandler, Request } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import jwt from "jsonwebtoken";
import { radiusApi } from "./radiusApi";
import { storage } from "./storage";

// JWT configuration
// ✅ إصلاح أمني: استخدام متغير بيئي بدلاً من المفتاح المدمج
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' 
  ? (() => { throw new Error('JWT_SECRET environment variable is required in production') })()
  : "saida_wifi_super_secret"); // JWT secret key
const JWT_EXPIRY = "7d"; // Token expires in 7 days

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const MemoryStoreSession = MemoryStore(session);
  const sessionStore = new MemoryStoreSession({
    checkPeriod: sessionTtl,
    ttl: sessionTtl,
  });
  
  return session({
    secret: process.env.SESSION_SECRET || "dev-secret-key-for-testing",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for development
      maxAge: sessionTtl,
      sameSite: 'lax',
    },
    name: 'sessionId',
  });
}

export async function setupCustomAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Note: Login endpoint is now handled in routes.ts to avoid conflicts

  // Logout endpoint
  app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ success: true, message: "Logout successful" });
    });
  });
}

// JWT authentication middleware - للاستخدام في جميع Routes
export const authenticateJWT: RequestHandler = async (req, res, next) => {
  try {
    // 🔐 Security: Only log basic request info, never headers containing sensitive data
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔐 JWT Auth Check - Route: ${req.method} ${req.path}`);
    }
    
    // Check for Authorization header
    const authHeader = req.headers.authorization;
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🎫 Authorization Header:`, authHeader ? '[TOKEN PROVIDED]' : 'NOT PROVIDED');
    }
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid Authorization header found');
      return res.status(401).json({ 
        success: false, 
        message: "يرجى إرسال التوكن في الهيدر Authorization" 
      });
    }

    // Extract token
    const token = authHeader.substring(7);
    
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Add user info to request
    req.user = {
      username: decoded.username,
      iat: decoded.iat
    };
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ JWT Auth Success for user: ${decoded.username}`);
    }
    next();
  } catch (error) {
    console.error("❌ JWT Auth Failed:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        success: false, 
        message: "توكن غير صالح" 
      });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        success: false, 
        message: "انتهت صلاحية التوكن" 
      });
    }
    return res.status(401).json({ 
      success: false, 
      message: "التوكن غير صالح أو منتهي الصلاحية" 
    });
  }
};

// Legacy session authentication (deprecated - use authenticateJWT instead)
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // First check if JWT is present
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return authenticateJWT(req, res, next);
  }

  // Fall back to session authentication
  const sessionUser = (req.session as any)?.user;
  
  console.log('Session check - sessionUser:', sessionUser);
  console.log('Session check - authenticated:', sessionUser?.authenticated);

  if (!sessionUser?.authenticated) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Attach user info to request
  req.user = {
    username: sessionUser.username,
    userData: sessionUser.userData,
  };

  next();
};