import { Request, Response, Router } from "express";
import { join } from "path";
import puppeteer, { PDFOptions } from "puppeteer";
import validatePDFQueryParams from "../modules/pdf/generatePdf.validation";
import downloadDir from "../utils/downloadDir";

const channelRoute = Router();

// GET: /channel/create
channelRoute.get("/create", async (req: Request, res: Response): Promise<any> => {
    

});

export default channelRoute;