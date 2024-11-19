// const downloadsDir = join(__dirname, "downloads");
// return download dir and if doesn't exist create it
import { join } from "path";
import fs from "fs";

const downloadDir = () => {
  const downloadsDir = join(__dirname, "downloads");
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });

    return downloadsDir;
  }
  return downloadsDir;
};

export default downloadDir;
