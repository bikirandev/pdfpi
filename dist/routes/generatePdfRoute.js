"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const path_1 = require("path");
const puppeteer_1 = __importDefault(require("puppeteer"));
const generatePdfRouter = (0, express_1.Router)();
const downloadsDir = (0, path_1.join)(__dirname, "downloads");
generatePdfRouter.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { url, options } = req.body;
    if (!url) {
        return res.json({ error: "URL is required" }).status(400);
    }
    let browser;
    try {
        browser = yield puppeteer_1.default.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--disable-gpu",
            ],
        });
        const page = yield browser.newPage();
        // Set viewport for better rendering
        yield page.setViewport({
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1,
        });
        // Add timeout and error handling for navigation
        yield page.goto(url, {
            waitUntil: ["networkidle0", "domcontentloaded"],
            timeout: 30000,
        });
        // Wait for any lazy-loaded content
        yield page.evaluate(() => new Promise((resolve) => {
            setTimeout(resolve, 1000);
        }));
        const timestamp = Date.now();
        const pdfPath = (0, path_1.join)(downloadsDir, `webpage-${timestamp}.pdf`);
        yield page.pdf({
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
    }
    catch (error) {
        console.error("PDF generation error:", error);
        res.status(500).json({
            error: "Failed to generate PDF",
            details: error.message,
        });
    }
    finally {
        if (browser) {
            yield browser.close();
        }
    }
}));
exports.default = generatePdfRouter;
