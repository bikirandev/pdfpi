import { NextFunction, Request, Response } from "express";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const notFound = (req: Request, res: Response, next: NextFunction) => {
  return res.status(404).json({
    statusCode: 404,
    success: false,
    message: "Not Found",
  });
};

export default notFound;
