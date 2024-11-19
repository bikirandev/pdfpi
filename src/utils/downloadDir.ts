import { join } from "path";
import fs from "fs";


const downloadDir = (): string => {
  // Locate the 'app' folder at /downloads
  const downloadsDir = join(__dirname, "../..", "downloads");

  // Ensure the 'downloads' directory exists
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  // Return the absolute path to the 'downloads' directory
  return downloadsDir;
};

export default downloadDir;
