import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";

const scrapRoute = Router();
const DATA_DIR = path.join(__dirname, "../../data"); // Ensure it's outside `src`

// Ensure the `data` folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Store scraped data
scrapRoute.post("/", async (req: Request, res: Response): Promise<any> => {
  try {
    const { html, url } = req.body;

    if (!html || !url) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Generate unique filename based on timestamp
    const filename = `${Date.now()}-${url.replace(/[^a-zA-Z0-9]/g, "_")}.json`;
    const filePath = path.join(DATA_DIR, filename);

    // Prepare data to save
    const dataToSave = {
      url,
      scrapedAt: new Date().toISOString(),
      html,
    };

    // Write data to JSON file
    fs.writeFile(filePath, JSON.stringify(dataToSave, null, 2), (err) => {
      if (err) {
        console.error("Error saving data:", err);
        return res.status(500).json({ message: "Failed to store data" });
      }

      console.log(`Scraped data saved at: ${filePath}`);
      res.json({
        error: false,
        message: "Data stored successfully",
        data: {
          url,
          scrapedAt: new Date().toISOString(),
          html,
        },
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({
      error: true,
      message: "Server error",
      stack: error,
    });
  }
});

export default scrapRoute;
