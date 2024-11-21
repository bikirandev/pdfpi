import { join } from "path";
import { PDFOptions } from "puppeteer";
import { browserManager } from "../modules/browser/browserManager";
import { Request, Response, Router } from "express";
import downloadDir from "../utils/downloadDir";
import validatePDFQueryParams from "../modules/pdf/generatePdf.validation";

const pdfRoute = Router();

// GET: /pdf/generate
pdfRoute.get("/generate", async (req: Request, res: Response): Promise<any> => {
  try {
    //get query params
    const query = req.query;

    // Validate query params
    const validatedQuery = validatePDFQueryParams(query);
    if (validatedQuery.error || !validatedQuery.data) {
      return res.json(validatedQuery).status(400);
    }
    const options = validatedQuery.data;
    const url = options.url;

    // Initialize browser
    await browserManager.initialize();

    // Create a new session
    var id = options.id;
    const page = await browserManager.createSession(url, id);

    // Delay for 2 seconds to allow page to load
    await setTimeout(() => {}, 2000);

    // const timestamp = Date.now();
    const pdfPath = join(downloadDir(), `${options.title}.pdf`);

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
      pdfUrl: `../downloads/${options.title}.pdf`,
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    res.status(500).json({
      error: true,
      message: `Failed to generate PDF. ${error.message}`,
    });
  } finally {
    // if (browser) {
    //   await browser.close();
    // }

    console.log("Closing session");
  }
});

export default pdfRoute;
