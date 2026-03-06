import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import config from "./config";
import apiKeyAuth from "./middleware/apiKeyAuth";
import globalErrorHandler from "./middleware/globalErrorHandler";
import notFound from "./middleware/notFound";
import pdfRoute from "./routes/pdf.route";
import downloadDir from "./utils/downloadDir";
import publicDir from "./utils/publicDir";

const app = express();

// ── Security headers ──
app.use(
  helmet({
    contentSecurityPolicy: false, // allow inline styles/scripts in UI
    crossOriginEmbedderPolicy: false,
  })
);

// ── CORS ──
const corsOrigins = config.corsOrigins;
app.use(
  cors(
    corsOrigins === "*"
      ? {}
      : { origin: corsOrigins.split(",").map((o) => o.trim()) }
  )
);

// ── Rate limiting ──
app.use(
  rateLimit({
    windowMs: config.rateLimitWindowMin * 60 * 1000,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: true,
      message: "Too many requests – please try again later.",
    },
  })
);

// Parse incoming JSON bodies
app.use(express.json({ limit: config.jsonBodyLimit }));

// Serve generated PDFs as static files
app.use("/downloads", express.static(downloadDir()));

// Serve landing page and other public assets
app.use(express.static(publicDir()));

// ── API key endpoint (so the UI can check if auth is enabled) ──
app.get("/api/auth-status", (_req: Request, res: Response) => {
  res.json({ authEnabled: !!config.apiKey });
});

// API routes (protected by API key when configured)
app.use("/pdf", apiKeyAuth, pdfRoute);

// 404 handler – must be registered after all routes
app.use((req: Request, res: Response, next: NextFunction): any =>
  notFound(req, res, next),
);

// Global error handler – must be the last middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction): any =>
  globalErrorHandler(err, req, res, next),
);

app.listen(config.port, config.host, () => {
  console.log(`Server running at http://${config.host}:${config.port}`);
  if (config.apiKey) {
    console.log("API key authentication: ENABLED");
  } else {
    console.log("API key authentication: DISABLED (open access)");
  }
});
