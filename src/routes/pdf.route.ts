import { join } from "path";
import { PDFOptions } from "puppeteer";
import config from "../config";
import { browserManager } from "../modules/browser/browserManager";
import { Request, Response, Router } from "express";
import downloadDir from "../utils/downloadDir";
import validatePDFQueryParams from "../modules/pdf/generatePdf.validation";

const pdfRoute = Router();

/**
 * GET /pdf/generate
 *
 * Generates a PDF from the given URL and returns the download URL.
 *
 * Query parameters:
 *   - url (required): The web page URL to convert.
 *   - id (required): A unique session identifier.
 *   - size: Paper format (A3 | A4 | A5 | Legal | Letter). Default: A4.
 *   - landscape: Render in landscape orientation. Default: false.
 *   - scale: Rendering scale percentage (70–150). Default: 100.
 *   - printBackground: Include CSS backgrounds. Default: true.
 *   - printHeaderFooter: Include header/footer. Default: false.
 *   - margin: Global margin in px applied to all sides. Default: 0.
 *   - marginTop/Right/Bottom/Left: Per-side margin overrides in px.
 */
pdfRoute.get("/generate", async (req: Request, res: Response): Promise<any> => {
  const sessionId = req.query.id as string | undefined;
  try {
    // Validate query params
    const validatedQuery = validatePDFQueryParams(req.query);
    if (validatedQuery.error || !validatedQuery.data) {
      return res.status(400).json(validatedQuery);
    }

    const options = validatedQuery.data;
    const url = options.url;
    const id = options.id;

    // Initialize the shared browser (no-op if already running)
    await browserManager.initialize();

    // Open the target URL in a new browser tab
    const page = await browserManager.createSession(url, id);

    // Allow the page to finish any post-load rendering (e.g. lazy images)
    await new Promise<void>((resolve) => setTimeout(resolve, config.postLoadDelay));

    // Build a filesystem-safe filename from the page title + timestamp
    const pageTitle = await page.title();
    const safeTitle = pageTitle
      .split(" ")
      .join("-")
      .replace(/[^a-zA-Z0-9-]/g, "");
    const timestampInSeconds = Math.floor(Date.now() / 1000);
    const filename = `${safeTitle}-${timestampInSeconds}`;

    const pdfPath = join(downloadDir(), `${filename}.pdf`);

    // Build Puppeteer PDF options from validated query params
    const pdfOptions: PDFOptions = {
      path: pdfPath,
      format: options.size,
      landscape: options.landscape,
      scale: options.scale / 100,
      printBackground: options.printBackground,
      displayHeaderFooter: options.printHeaderFooter,
      margin: {
        top: `${options.marginTop}px`,
        right: `${options.marginRight}px`,
        bottom: `${options.marginBottom}px`,
        left: `${options.marginLeft}px`,
      },
      headerTemplate: options.printHeaderFooter
        ? `<div style="font-size: 10px; text-align: center; width: 100%;">
             <span class="date"></span> - <span class="url"></span>
           </div>`
        : "",
      footerTemplate: options.printHeaderFooter
        ? `<div style="font-size: 10px; text-align: center; width: 100%;">
             <span class="pageNumber"></span> / <span class="totalPages"></span>
           </div>`
        : "",
      preferCSSPageSize: true,
    };

    await page.pdf(pdfOptions);

    return res.json({
      error: false,
      message: "PDF generated successfully",
      pdfUrl: `/downloads/${filename}.pdf`,
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return res.status(500).json({
      error: true,
      message: `Failed to generate PDF. ${error.message}`,
    });
  } finally {
    // Close the browser tab for this session to free resources
    if (sessionId) {
      await browserManager.closeSession(sessionId).catch((err) => {
        console.error("Failed to close browser session:", err);
      });
    }
  }
});

export default pdfRoute;
