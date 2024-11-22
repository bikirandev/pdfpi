import puppeteer, { Browser, Page } from "puppeteer";

class BrowserManager {
  private browser: Browser | null;
  private sessions: Map<string, Page>;

  constructor() {
    this.browser = null;
    this.sessions = new Map();
  }

  async initialize(): Promise<void> {
    console.log("Initializing browser");

    // Check if browser is already initialized
    if (this.browser) {
      console.log("Browser already initialized");
      return;
    }

    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    });
  }

  async createSession(url: string, sessionId: string): Promise<Page> {
    if (!this.browser) {
      throw new Error("Browser not initialized");
    }

    if (this.sessions.has(sessionId)) {
      console.log("Session already exists", sessionId);
      var p = this.sessions.get(sessionId);
      if (p) {
        return p;
      }
    }

    console.log("Creating session", sessionId);
    const page = await this.browser.newPage();

    // Set viewport for better rendering
    await page.setViewport({
      width: 1920,
      height: 2080,
      deviceScaleFactor: 1,
    });

    await page.goto(url, {
      waitUntil: ["networkidle0", "domcontentloaded"],
      timeout: 30000,
    });
    console.log("Page created");

    this.sessions.set(sessionId, page);
    return page;
  }

  setSession(sessionId: string, page: Page): void {
    console.log("Setting session");
    this.sessions.set(sessionId, page);
  }

  getSession(sessionId: string): Page | undefined {
    console.log("Getting session");
    return this.sessions.get(sessionId);
  }

  async closeSession(sessionId: string): Promise<void> {
    const page = this.sessions.get(sessionId);
    if (page) {
      await page.close();
      this.sessions.delete(sessionId);
    }
  }
}

export const browserManager = new BrowserManager();
