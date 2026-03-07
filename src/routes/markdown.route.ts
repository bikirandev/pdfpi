import { join } from "path";
import { PDFOptions } from "puppeteer";
import config from "../config";
import { browserManager } from "../modules/browser/browserManager";
import { Request, Response, Router } from "express";
import downloadDir from "../utils/downloadDir";
import validateMarkdownBody from "../modules/markdown/generateMarkdownPdf.validation";
import { markdownToHtml } from "../modules/markdown/markdownToHtml";
import {
  uploadToGoogleDrive,
  isGoogleDriveConfigured,
} from "../modules/drive/googleDriveManager";

const markdownRoute = Router();

/**
 * POST /markdown/generate
 *
 * Converts a Markdown document to a PDF and returns the download URL.
 *
 * Request body (JSON):
 *   - markdown  (required): Raw Markdown text to convert.
 *   - title:    Filename title (without extension). Default: "Document".
 *   - size:     Paper format (A3 | A4 | A5 | Legal | Letter). Default: A4.
 *   - landscape: Render in landscape orientation. Default: false.
 *   - scale:    Rendering scale percentage (70–150). Default: 100.
 *   - printBackground: Include CSS backgrounds. Default: true.
 *   - printHeaderFooter: Include header/footer. Default: false.
 *   - margin:   Global margin in px applied to all sides. Default: 0.
 *   - marginTop/Right/Bottom/Left: Per-side margin overrides in px.
 *   - save:     Upload the generated PDF to Google Drive. Default: false.
 */
markdownRoute.post(
  "/generate",
  async (req: Request, res: Response): Promise<any> => {
    const sessionId = `md-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      // Validate request body
      const validated = validateMarkdownBody(req.body);
      if (validated.error || !validated.data) {
        return res.status(400).json(validated);
      }

      const options = validated.data;

      // Convert markdown → sanitized, styled HTML
      const htmlContent = markdownToHtml(options.markdown, options.title);

      // Initialize the shared browser (no-op if already running)
      await browserManager.initialize();

      // Open a new tab and set the generated HTML as the page content
      const page = await browserManager.createContentSession(
        htmlContent,
        sessionId
      );

      // Allow any remaining rendering to settle (e.g. webfonts)
      await new Promise<void>((resolve) =>
        setTimeout(resolve, config.postLoadDelay)
      );

      // Build a filesystem-safe filename from the title + timestamp
      const safeTitle = options.title
        .split(" ")
        .join("-")
        .replace(/[^a-zA-Z0-9-]/g, "");
      const timestampInSeconds = Math.floor(Date.now() / 1000);
      const filename = `${safeTitle || "Document"}-${timestampInSeconds}`;
      const pdfPath = join(downloadDir(), `${filename}.pdf`);

      // Build Puppeteer PDF options
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
          ? `<div style="font-size:10px;text-align:center;width:100%;">
               <span class="title"></span>
             </div>`
          : "",
        footerTemplate: options.printHeaderFooter
          ? `<div style="font-size:10px;text-align:center;width:100%;">
               <span class="pageNumber"></span> / <span class="totalPages"></span>
             </div>`
          : "",
        preferCSSPageSize: false,
      };

      await page.pdf(pdfOptions);

      // Optionally upload to Google Drive
      let driveFile = null;
      if (options.save) {
        if (!isGoogleDriveConfigured()) {
          return res.status(400).json({
            error: true,
            message:
              "Google Drive is not configured on this server. Set GOOGLE_SERVICE_ACCOUNT_KEY_PATH and GOOGLE_DRIVE_FOLDER_ID.",
          });
        }
        driveFile = await uploadToGoogleDrive(pdfPath);
      }

      return res.json({
        error: false,
        message: "PDF generated successfully",
        pdfUrl: `/downloads/${filename}.pdf`,
        ...(driveFile && {
          drive: {
            id: driveFile.id,
            name: driveFile.name,
            viewUrl: driveFile.webViewLink,
            downloadUrl: driveFile.webContentLink,
          },
        }),
      });
    } catch (error: any) {
      console.error("Markdown PDF generation error:", error);
      return res.status(500).json({
        error: true,
        message: `Failed to generate PDF. ${error.message}`,
      });
    } finally {
      // Always close the browser tab for this session to free resources
      await browserManager.closeSession(sessionId).catch((err) => {
        console.error("Failed to close browser session:", err);
      });
    }
  }
);

export default markdownRoute;
