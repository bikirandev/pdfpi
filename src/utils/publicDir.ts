import { join } from "path";

/**
 * Returns the absolute path to the `public/` directory that lives at the
 * project root (one level above `src/` / `dist/`).
 */
const publicDir = (): string => join(__dirname, "../..", "public");

export default publicDir;
