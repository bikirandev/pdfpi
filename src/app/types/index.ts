import { PaperFormat } from "puppeteer";
export type TObj = { [key: string]: any };

export type TQueryParams = {
  url: string;
  size: PaperFormat;
  title: string;
  landscape: boolean;
  scale: number;
  printBackground: boolean;
  printHeaderFooter: boolean;
  autoPrint: boolean;
  adjustSinglePage: boolean;
  margin: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
};
