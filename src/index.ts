import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import config from "./config";
import apiKeyAuth from "./middleware/apiKeyAuth";
import globalErrorHandler from "./middleware/globalErrorHandler";
import notFound from "./middleware/notFound";
import pdfRoute from "./routes/pdf.route";
import setupRoute from "./routes/setup.route";
import downloadDir from "./utils/downloadDir";
import publicDir from "./utils/publicDir";
import { isDriveSetupDone } from "./modules/drive/driveConfigManager";

const app = express();

// ── Trust Proxy for express-rate-limit ──
// Set this to ensure rate limiting correctly handles X-Forwarded-For headers
app.set("trust proxy", 1);

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

// ── Drive status (so the setup UI can check if already configured) ──
app.get("/api/drive-status", (_req: Request, res: Response) => {
  res.json({ configured: isDriveSetupDone() });
});

// ── Setup page guard: block setup-drive.html when already configured ──
app.get("/setup-drive.html", (req: Request, res: Response, next: NextFunction): any => {
  if (isDriveSetupDone()) {
    return res.status(403).send(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Setup Locked</title>'
      + '<style>body{background:#0d1117;color:#e6edf3;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;}'
      + '.box{max-width:400px}.icon{font-size:3rem;margin-bottom:1rem}h2{margin-bottom:.5rem}p{color:#8b949e}a{color:#58a6ff}</style></head>'
      + '<body><div class="box"><div class="icon">&#128274;</div><h2>Setup Locked</h2>'
      + '<p>Google Drive is already configured. This page is no longer accessible.</p>'
      + '<p style="margin-top:1rem"><a href="/">Back to Home</a></p></div></body></html>',
    );
  }
  next();
});

// Setup API routes (blocked after configuration is saved)
app.use("/api/setup", setupRoute);

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
