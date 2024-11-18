import { join } from "path";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import generatePdfRoute from "./app/routes/generatePdfRoute";
import globalErrorHandler from "./app/middleware/globalErrorHandler";
import notFound from "./app/middleware/notFound";

const app = express();
const port = 7301;

// Ensure downloads directory exists
const downloadsDir = join(__dirname, "downloads");
// await fs.mkdir(downloadsDir, { recursive: true });

app.use(cors());
app.use(express.json());
app.use("/downloads", express.static(downloadsDir));


// Query Params
// url: string
// title: string [default: "PDF"]
// size: string [A3, A4, A5, Legal, Letter] [default: A4]
// landscape: boolean [default: false]
// scale: number [70 - 200]% [default: 100]
// printBackground: boolean [default: true]
// printHeaderFooter: boolean [default: false]
// autoPrint: boolean [default: false]
// adjustSinglePage: boolean [default: false]

// margin: float [default: 0]
// marginTop: float [default: 0]
// marginRight: float [default: 0]
// marginBottom: float [default: 0]
// marginLeft: float [default: 0]
app.use("/generate-pdf", generatePdfRoute);

// handle 404 errors
app.use((req: Request, res: Response, next: NextFunction): any =>
  notFound(req, res, next)
);

// handle global errors
app.use((err: Error, req: Request, res: Response, next: NextFunction): any =>
  globalErrorHandler(err, req, res, next)
);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
