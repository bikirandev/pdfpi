import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import globalErrorHandler from "./middleware/globalErrorHandler";
import notFound from "./middleware/notFound";
import pdfRoute from "./routes/pdf.route";
import downloadDir from "./utils/downloadDir";
import publicDir from "./utils/publicDir";

const app = express();
const port = 7301;

// Parse incoming JSON bodies (up to 10 MB)
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Serve generated PDFs as static files
app.use("/downloads", express.static(downloadDir()));

// Serve landing page and other public assets
app.use(express.static(publicDir()));

// API routes
app.use("/pdf", pdfRoute);

// 404 handler – must be registered after all routes
app.use((req: Request, res: Response, next: NextFunction): any =>
  notFound(req, res, next),
);

// Global error handler – must be the last middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction): any =>
  globalErrorHandler(err, req, res, next),
);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
