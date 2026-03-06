import puppeteer, { Browser, Page } from "puppeteer";

/**
 * Manages a single shared Puppeteer browser instance and its open page
 * sessions.  Using a singleton browser avoids the overhead of launching a
 * new Chrome process for every request.
 *
 * Usage:
 *   ```ts
 *   await browserManager.initialize();
 *   const page = await browserManager.createSession(url, sessionId);
 *   // … use page …
 *   await browserManager.closeSession(sessionId);
 *   ```
 */
class BrowserManager {
  private browser: Browser | null;
  private sessions: Map<string, Page>;
  private headless: boolean;

  constructor(headless: boolean = true) {
    this.browser = null;
    this.sessions = new Map();
    this.headless = headless;
  }

  /**
   * Launches the Puppeteer browser if it has not been started yet.
   * Subsequent calls are no-ops.
   *
   * @param headless - Override the headless setting for this call only.
   */
  async initialize(headless?: boolean): Promise<void> {
    if (this.browser) {
      console.log("Browser already initialized");
      return;
    }

    if (headless !== undefined) {
      this.headless = headless;
    }

    console.log("Initializing browser");

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

  /**
   * Opens a new browser tab, navigates it to `url`, and associates the
   * resulting page with `sessionId`.  If a session with the same ID already
   * exists, the existing page is returned immediately.
   *
   * @throws If the browser has not been initialised.
   * @throws If the page cannot be created within 10 seconds.
   * @throws If the page fails to navigate to `url` within 30 seconds.
   */
  async createSession(url: string, sessionId: string): Promise<Page> {
    if (!this.browser) {
      throw new Error("Browser not initialized");
    }

    const existing = this.sessions.get(sessionId);
    if (existing) {
      console.log("Reusing existing session", sessionId);
      return existing;
    }

    console.log("Creating session", sessionId);

    let page: Page;

    try {
      // Enforce a timeout when creating a new tab
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

    // Use a wide viewport to avoid responsive-layout truncation
    await page.setViewport({ width: 1920, height: 2080, deviceScaleFactor: 1 });

    try {
      await page.goto(url, {
        waitUntil: ["networkidle0", "domcontentloaded"],
        timeout: 30000,
      });
      console.log("Page loaded successfully for session", sessionId);
    } catch (error) {
      console.error("Error navigating to URL:", error);
      throw new Error("Failed to load the page");
    }

    this.sessions.set(sessionId, page);
    return page;
  }

  /** Stores a pre-existing page under the given session ID. */
  setSession(sessionId: string, page: Page): void {
    this.sessions.set(sessionId, page);
  }

  /** Returns the page associated with `sessionId`, or `undefined` if none. */
  getSession(sessionId: string): Page | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Closes the browser tab for `sessionId` and removes it from the session
   * registry.  Safe to call even if the session no longer exists.
   */
  async closeSession(sessionId: string): Promise<void> {
    const page = this.sessions.get(sessionId);
    if (page) {
      await page.close();
      this.sessions.delete(sessionId);
      console.log("Session closed", sessionId);
    }
  }
}

/** Shared singleton – import and use this throughout the application. */
export const browserManager = new BrowserManager();
