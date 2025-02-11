import { Router, Request, Response } from "express";
import { browserManager } from "../modules/browser/browserManager";

const scrapRoute = Router();

// GET: /html/fetch
scrapRoute.get("/fetch", async (req: Request, res: Response): Promise<any> => {
  try {
    // Get query params
    const url = req.query.url as string;
    const id = (req.query.id as string) || "100"; // Assign a default ID if not provided

    if (!url) {
      return res
        .status(400)
        .json({ error: true, message: "URL parameter is required" });
    }

    // Initialize browser
    await browserManager.initialize();

    // Create a new session
    const page = await browserManager.createSession(url, id);

    // Wait for page to load completely
    await page.waitForSelector("body", { timeout: 5000 });

    // Get page content
    const htmlContent = await page.content();

    // Return the HTML response
    res.status(200).send(htmlContent);
  } catch (error: any) {
    console.error("Error fetching HTML:", error);
    res.status(500).json({
      error: true,
      message: `Failed to fetch HTML. ${error.message}`,
    });
  } finally {
    console.log("Closing session");
  }
});

export default scrapRoute;
