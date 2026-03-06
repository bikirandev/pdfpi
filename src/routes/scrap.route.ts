import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";

const scrapRoute = Router();

/** Absolute path to the directory where scraped JSON files are stored. */
const DATA_DIR = path.join(__dirname, "../../data");

// Ensure the `data` directory exists at startup
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * POST /api/scraped-data
 *
 * Accepts an HTML payload together with its source URL and persists it to
 * disk as a timestamped JSON file under the `data/` directory.
 *
 * Request body:
 *   - html  (string, required): The raw HTML content that was scraped.
 *   - url   (string, required): The origin URL of the scraped page.
 */
scrapRoute.post("/", async (req: Request, res: Response): Promise<any> => {
  try {
    const { html, url } = req.body;

    if (!html || !url) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Build a timestamped filename that encodes the source URL
    const filename = `${Date.now()}-${url.replace(/[^a-zA-Z0-9]/g, "_")}.json`;
    const filePath = path.join(DATA_DIR, filename);

    const scrapedAt = new Date().toISOString();

    const dataToSave = { url, scrapedAt, html };

    // Write to disk asynchronously and respond once the write is complete
    fs.writeFile(filePath, JSON.stringify(dataToSave, null, 2), (err) => {
      if (err) {
        console.error("Error saving scraped data:", err);
        return res.status(500).json({ message: "Failed to store data" });
      }

      console.log(`Scraped data saved: ${filePath}`);
      return res.json({
        error: false,
        message: "Data stored successfully",
        data: { url, scrapedAt, html },
      });
    });
  } catch (error: any) {
    console.error("Unexpected error in scrap route:", error);
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
});

export default scrapRoute;
