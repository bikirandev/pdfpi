import { join } from "path";
import fs from "fs";

const downloadDir = (): string => {
  // Locate the 'app' folder at /src/app
  const appDir = join(__dirname, "..", "app");
  const downloadsDir = join(appDir, "downloads");

  // Ensure the 'downloads' directory exists
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  // Return the absolute path to the 'downloads' directory
  return downloadsDir;
};

export default downloadDir;
