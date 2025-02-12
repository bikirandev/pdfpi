import puppeteer, { Browser, Page } from "puppeteer";

class BrowserManager {
  private browser: Browser | null;
  private sessions: Map<string, Page>;
  private headless: boolean;

  constructor(headless: boolean = true) {
    this.browser = null;
    this.sessions = new Map();
    this.headless = headless;
  }

  async initialize(headless?: boolean): Promise<void> {
    console.log("Initializing browser");

    if (this.browser) {
      console.log("Browser already initialized");
      return;
    }

    this.headless = headless !== undefined ? headless : this.headless;

    try {
      this.browser = await puppeteer.launch({
        headless: this.headless,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
        ],
      });
    } catch (error) {
      console.error("Failed to launch browser:", error);
      throw new Error("Failed to launch Puppeteer browser");
    }
  }

  async createSession(url: string, sessionId: string): Promise<Page> {
    if (!this.browser) {
      throw new Error("Browser not initialized");
    }

    if (this.sessions.has(sessionId)) {
      console.log("Session already exists", sessionId);
      const existingPage = this.sessions.get(sessionId);
      if (existingPage) {
        return existingPage;
      }
    }

    console.log("Creating session", sessionId);

    let page: Page;

    try {
      // Enforce a timeout for creating a new page
      page = await Promise.race([
        this.browser.newPage(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Timed out creating a new page")),
            10000
          )
        ),
      ]);
    } catch (error) {
      console.error("Error creating a new page:", error);
      throw new Error("Failed to create a new browser tab");
    }

    // Set viewport for better rendering
    await page.setViewport({
      width: 1920,
      height: 2080,
      deviceScaleFactor: 1,
    });

    try {
      await page.goto(url, {
        waitUntil: ["networkidle0", "domcontentloaded"],
        timeout: 30000,
      });
      console.log("Page created successfully");
    } catch (error) {
      console.error("Error navigating to URL:", error);
      throw new Error("Failed to load the page");
    }

    this.sessions.set(sessionId, page);
    return page;
  }

  setSession(sessionId: string, page: Page): void {
    console.log("Setting session");
    this.sessions.set(sessionId, page);
  }

  getSession(sessionId: string): Page | undefined {
    console.log("Getting session", sessionId);
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
