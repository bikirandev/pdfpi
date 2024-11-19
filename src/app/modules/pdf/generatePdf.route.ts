import { Request, Response, Router } from "express";
import { join } from "path";
import puppeteer, { PDFOptions } from "puppeteer";
import validatePDFQueryParams from "./generatePdf.validation";
import downloadDir from "../../utils/downloadDir";

const generatePdfRoute = Router();

generatePdfRoute.get("/", async (req: Request, res: Response): Promise<any> => {
  //get query params
  const query = req.query;

  const validatedQuery = validatePDFQueryParams(query);

  if (validatedQuery.error || validatedQuery.data === undefined) {
    return res.json(validatedQuery).status(400);
  }

  const options = validatedQuery.data;
  const url = options.url;

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
    const pdfPath = join(downloadDir(), `webpage-${timestamp}.pdf`);

    // Set PDF options
    const pdfOptions: PDFOptions = {
      path: pdfPath,
      format: options.size,
      landscape: options.landscape,
      scale: options.scale / 100,
      printBackground: options.printBackground,
      displayHeaderFooter: options.printHeaderFooter,
      margin: {
        top: options.marginTop + "px",
        right: options.marginRight + "px",
        bottom: options.marginBottom + "px",
        left: options.marginLeft + "px",
      },
      headerTemplate: options.printHeaderFooter
        ? `
          <div style="font-size: 10px; text-align: center; width: 100%;">
            <span class="date"></span> - <span class="url"></span>
          </div>
        `
        : "",
      footerTemplate: options.printHeaderFooter
        ? `
          <div style="font-size: 10px; text-align: center; width: 100%;">
            <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>
         `
        : "",
      preferCSSPageSize: true,
    };

    await page.pdf(pdfOptions);

    // Return the PDF URL
    res.json({
      error: false,
      message: "PDF generated successfully",
      pdfUrl: `/downloads/webpage-${timestamp}.pdf`,
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    res.status(500).json({
      error: true,
      message: error.message,
      // message: "Failed to generate PDF",
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

export default generatePdfRoute;
