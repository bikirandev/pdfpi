import { Request, Response, Router } from "express";
import { join } from "path";
import puppeteer from "puppeteer";
import validatePDFQueryParams from "./generatePdf.validation";

const generatePdfRoute = Router();

const downloadsDir = join(__dirname, "downloads");

generatePdfRoute.get("/", async (req: Request, res: Response): Promise<any> => {
  const { options, url } = req.body;
  //get query params
  const query = req.query;

  const validatedQuery = validatePDFQueryParams(query);
  if (validatedQuery.error) {
    return res.json({ error: "Invalid query params" }).status(400);
  }
  console.log(validatedQuery, "validatedQuery");

  if (!url) {
    return res.json({ error: "URL is required" }).status(400);
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
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
  } catch (error: any) {
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

export default generatePdfRoute;
