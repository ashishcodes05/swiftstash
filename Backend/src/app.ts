import express, { type NextFunction, type Request, type Response } from "express";
import { env } from "./config/env.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes.js";
import directoryRoutes from "./modules/directory/directory.routes.js";
import fileRoutes from "./modules/file/file.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import { rateLimiter } from "./middlewares/rateLimiter.middleware.js";
import helmet from "helmet";

export const app = express();

app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups"},
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "https://accounts.google.com"],
      "frame-src": ["'self'", "https://accounts.google.com"],
      "connect-src": [
        "'self'",
        "https://accounts.google.com",
        "https://*.amazonaws.com",
      ],
    }
  }
}));

const allowedOrigins = [
  ...(env.NODE_ENV === "development" ? [
    "http://localhost:5173",
    "http://localhost:5174",
  ] : []),
  ...env.CORS_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean),
]

app.use(
  cors({
    origin: function (origin, callback){
      if(!origin || allowedOrigins.indexOf(origin) !== -1){
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.COOKIE_SECRET));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Swiftstash Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1/auth', rateLimiter({ capacity: 10, refillRate: 0.5 }), authRoutes);
app.use('/api/v1/directory', rateLimiter({ capacity: 30, refillRate: 2 }), authMiddleware, directoryRoutes);
app.use('/api/v1/file', rateLimiter({ capacity: 100, refillRate: 15 }), authMiddleware, fileRoutes);
app.use('/api/v1/user', rateLimiter({ capacity: 10, refillRate: 0.5 }), authMiddleware, userRoutes);

app.use(rateLimiter({ capacity: 50, refillRate: 5 }), (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err : Error, req : Request, res: Response, next : NextFunction) => {
  console.error("Error occurred:", err);
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});
