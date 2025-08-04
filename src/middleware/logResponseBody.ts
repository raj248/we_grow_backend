// middleware/logResponseBody.ts
import { Request, Response, NextFunction } from "express";
import { logger } from "~/utils/log";

export function logResponseBody(req: Request, res: Response, next: NextFunction) {
  const oldJson = res.json;
  if (req.path !== '/logs') {
    res.json = function (body) {
      logger.info({
        url: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode,
        responseBody: body,
      });
      return oldJson.call(this, body);
    };
  }

  next();
}
