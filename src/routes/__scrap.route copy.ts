import { Request, Response, Router } from "express";
import { browserManager } from "../modules/browser/browserManager";
const router = Router();

/**
 * Starts a new scraping session
 */
router.get(
  "/start-session",
  async (req: Request, res: Response): Promise<any> => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "URL parameter is required" });
    }

    try {
      await browserManager.initialize(); // Ensure the browser is initialized

      const sessionId = Date.now().toString();
      const page = await browserManager.createSession(url as string, sessionId);

      // Check if CAPTCHA is present
      const captchaDetected = await page.evaluate(() => {
        const captchaSelectors = [
          "iframe[src*='captcha']",
          "iframe[src*='recaptcha']",
          "div.g-recaptcha",
          "input[name='recaptcha']",
          "[id*='captcha']",
        ];

        return captchaSelectors.some((selector) => {
          const el = document.querySelector(selector);
          if (el) {
            const style = window.getComputedStyle(el);
            return (
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              el.clientHeight > 0
            );
          }
          return false;
        });
      });
      console.log(captchaDetected, "captchaDetected");
      if (!captchaDetected) {
        return res.json({
          error: false,
          message: "Captcha Detected",
          captchaDetected: true,
          data: { sessionId },
        });
      } else {
        // No CAPTCHA detected, fetch content immediately
        const content = await page.evaluate(
          () => document.documentElement.outerHTML
        );
        await browserManager.closeSession(sessionId); // Close session after fetching

        return res.json({
          error: false,
          message: "No Captcha Detected",
          data: { content },
          captchaDetected: false,
        });
      }
    } catch (error: any) {
      res
        .status(500)
        .json({ error: "Failed to start session", details: error.message });
    }
  }
);

/**
 * Fetches the webpage content from an active session
 */
router.get("/fetch", async (req: Request, res: Response): Promise<any> => {
  const { sessionId, selector } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: "Session ID is required" });
  }

  const page = browserManager.getSession(sessionId as string);
  if (!page) {
    return res
      .status(400)
      .json({ error: "Invalid session or session expired" });
  }

  try {
    let content = "";
    if (selector) {
      content = await page.$eval(selector as string, (el) => el.outerHTML);
    } else {
      content = await page.evaluate(() => document.documentElement.outerHTML);
    }

    await browserManager.closeSession(sessionId as string); // Close session after fetching

    res.send(content);
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to fetch website content",
      details: error.message,
    });
  }
});

export default router;
