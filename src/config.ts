import dotenv from "dotenv";
dotenv.config();

function envStr(key: string, fallback: string): string {
  return process.env[key]?.trim() || fallback;
}

function envInt(key: string, fallback: number): number {
  const v = process.env[key];
  if (v === undefined || v === "") return fallback;
  const n = parseInt(v, 10);
  return isNaN(n) ? fallback : n;
}

function envBool(key: string, fallback: boolean): boolean {
  const v = process.env[key]?.toLowerCase();
  if (v === undefined || v === "") return fallback;
  return v === "true" || v === "1";
}

const config = {
  /** Current environment */
  nodeEnv: envStr("NODE_ENV", "production"),
  /** Server port */
  port: envInt("PORT", 7301),
  /** Server bind host */
  host: envStr("HOST", "0.0.0.0"),

  /** API key for authentication (empty = auth disabled) */
  apiKey: envStr("API_KEY", ""),
  /** Allowed CORS origins (comma-separated, or "*") */
  corsOrigins: envStr("CORS_ORIGINS", "*"),

  /** Rate-limit: max requests per window per IP */
  rateLimitMax: envInt("RATE_LIMIT_MAX", 20),
  /** Rate-limit: window duration in minutes */
  rateLimitWindowMin: envInt("RATE_LIMIT_WINDOW_MIN", 1),

  /** Viewport width for the headless browser */
  viewportWidth: envInt("VIEWPORT_WIDTH", 1920),
  /** Viewport height for the headless browser */
  viewportHeight: envInt("VIEWPORT_HEIGHT", 2080),
  /** Timeout (ms) for page navigation */
  pageLoadTimeout: envInt("PAGE_LOAD_TIMEOUT", 30000),
  /** Timeout (ms) for creating a new browser tab */
  pageCreateTimeout: envInt("PAGE_CREATE_TIMEOUT", 10000),
  /** Delay (ms) after page load before generating PDF */
  postLoadDelay: envInt("POST_LOAD_DELAY", 2000),
  /** Run browser in headless mode */
  headless: envBool("HEADLESS", true),
  /** Custom Chromium executable path (e.g. /usr/bin/chromium for Alpine Docker) */
  chromiumPath: envStr("PUPPETEER_EXECUTABLE_PATH", ""),

  /** Max JSON body size */
  jsonBodyLimit: envStr("JSON_BODY_LIMIT", "10mb"),
} as const;

export default config;
