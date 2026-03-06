import { PaperFormat } from "puppeteer";

/** Generic key-value object used for untyped query-string inputs. */
export type TObj = { [key: string]: any };

/** Fully validated and normalised PDF generation parameters. */
export type TQueryParams = {
  /** Web page URL to convert to PDF. */
  url: string;
  /** Unique session / request identifier. */
  id: string;
  /** Puppeteer paper format (e.g. "A4", "Letter"). */
  size: PaperFormat;
  /** Filename title (without extension) for the generated PDF. */
  title: string;
  /** Render in landscape orientation when `true`. */
  landscape: boolean;
  /** Rendering scale percentage (70–150). */
  scale: number;
  /** Whether to include CSS background colours and images. */
  printBackground: boolean;
  /** Whether to show browser-generated header and footer. */
  printHeaderFooter: boolean;
  /** Reserved – auto-print trigger (not yet implemented). */
  autoPrint: boolean;
  /** Reserved – fit output to a single page (not yet implemented). */
  adjustSinglePage: boolean;
  /** Global margin applied to all sides (px) when side-specific values are absent. */
  margin: number;
  /** Top margin override (px). */
  marginTop: number;
  /** Right margin override (px). */
  marginRight: number;
  /** Bottom margin override (px). */
  marginBottom: number;
  /** Left margin override (px). */
  marginLeft: number;
  /** When `true`, upload the generated PDF to Google Drive. */
  save: boolean;
};
