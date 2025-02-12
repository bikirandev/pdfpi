import { Request, Response, Router } from "express";
import { browserManager } from "../modules/browser/browserManager";

const router = Router();

router.get(
  "/start-session",
  async (req: Request, res: Response): Promise<any> => {
    const { url } = req.query;
    const sessionId = req.query.sessionId as string;

    console.log(req?.query, "req?.query");

    if (!url) {
      console.log(url, "url-ok");
      return res.status(400).json({ error: "URL parameter is required" });
    }
    if (!sessionId) {
      console.log(sessionId, "sessionId-ok");
      return res.status(400).json({ error: "Session ID is required" });
    }

    // Check if session exist or not
    const session = browserManager.getSession(sessionId);
    if (session) {
      return res.status(200).json({ sessionId, message: "Already exist" });
    }

    if (session) {
      console.log(session, "session-ok");
      return res.status(200).json({ sessionId, message: "Already exist" });
    }

    console.log(sessionId, "sessionId");
    console.log(session, "session[sessionId]");
    try {
      await browserManager.initialize(false); // Ensure the browser is initialized
      await browserManager.createSession(url as string, sessionId);

      // activeSessions[sessionId] = sessionId;
      return res
        .status(200)
        .json({ sessionId, message: "Solve the CAPTCHA, then click Fetch." });
    } catch (error) {
      res.status(500).json({ error: "Failed to start session" });
    }
  }
);

router.get("/fetch", async (req: Request, res: Response): Promise<any> => {
  const { sessionId } = req.query;
  const id = sessionId as string;

  console.log(sessionId, "sessionId");

  if (!sessionId) {
    return res
      .status(400)
      .json({ error: "Invalid session or session expired" });
  }

  try {
    console.log(sessionId, "sessionId");
    const page = browserManager.getSession(id);
    console.log(page, "page");

    if (!page) {
      return res.status(400).json({ error: "Session expired or not found" });
    }

    // Add more debugging logs
    console.log("Fetching page content...");

    // Ensure the page is still open before calling evaluate()
    if (page.isClosed()) {
      console.error("Page was closed before fetching content.");
      return res.status(400).json({ error: "Session expired or page closed." });
    }

    // Ensure the page is still connected to the browser
    if (!page.browser()) {
      console.error("Page is no longer connected to the browser.");
      return res.status(400).json({ error: "Browser disconnected." });
    }

    // Wait for page to load completely
    await page.waitForSelector("body", { timeout: 5000 });

    // Fetch page content
    const content = await page.evaluate(
      () => document.documentElement.outerHTML
    );

    console.log("Content fetched successfully");

    await browserManager.closeSession(id); // Close session after fetching

    res.send(content);
  } catch (error) {
    console.error("Unhandled error in fetch route:", error);
    res.status(500).json({ error: "Failed to fetch website content" });
  }
});

export default router;
