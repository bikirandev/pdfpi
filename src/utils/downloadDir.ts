import { join } from "path";
import fs from "fs";

/**
 * Returns the absolute path to the `downloads/` directory that lives at the
 * project root (one level above `src/` / `dist/`).  The directory is created
 * automatically if it does not already exist.
 */
const downloadDir = (): string => {
  const downloadsDir = join(__dirname, "../..", "downloads");

  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  return downloadsDir;
};

export default downloadDir;
