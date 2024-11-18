import { join } from "path";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import generatePdfRouter from "./routes/generatePdfRoute";

const app = express();
const port = 7301;

// Ensure downloads directory exists
const downloadsDir = join(__dirname, "downloads");
// await fs.mkdir(downloadsDir, { recursive: true });

app.use(cors());
app.use(express.json());
app.use("/downloads", express.static(downloadsDir));
app.use("/generate-pdf", generatePdfRouter);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal server error",
    details: err.message,
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
