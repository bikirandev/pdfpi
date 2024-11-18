import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 7301;

// Ensure downloads directory exists
const downloadsDir = join(__dirname, "downloads");
await fs.mkdir(downloadsDir, { recursive: true });

app.use(cors());
app.use(express.json());
app.use("/downloads", express.static(downloadsDir));

app.post("/generate-pdf", async (req, res) => {
  const { url, options } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Set viewport for better rendering
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // Add timeout and error handling for navigation
    await page.goto(url, {
      waitUntil: ["networkidle0", "domcontentloaded"],
      timeout: 30000,
    });

    // Wait for any lazy-loaded content
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 1000);
        })
    );

    const timestamp = Date.now();
    const pdfPath = join(downloadsDir, `webpage-${timestamp}.pdf`);

    await page.pdf({
      path: pdfPath,
      format: options.format,
      landscape: options.orientation === "landscape",
      scale: options.scale,
      printBackground: options.printBackground,
      displayHeaderFooter: options.showHeaderFooter,
      margin: {
        top: options.margins.top + "px",
        right: options.margins.right + "px",
        bottom: options.margins.bottom + "px",
        left: options.margins.left + "px",
      },

      headerTemplate: options.showHeaderFooter
        ? `
        <div style="font-size: 10px; text-align: center; width: 100%;">
          <span class="date"></span> - <span class="url"></span>
        </div>
      `
        : "",
      footerTemplate: options.showHeaderFooter
        ? `
        <div style="font-size: 10px; text-align: center; width: 100%;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `
        : "",

      preferCSSPageSize: true,
    });

    res.json({
      success: true,
      pdfUrl: `/downloads/webpage-${timestamp}.pdf`,
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({
      error: "Failed to generate PDF",
      details: error.message,
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal server error",
    details: err.message,
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
