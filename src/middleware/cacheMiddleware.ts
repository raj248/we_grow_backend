import { Request, Response, NextFunction } from "express";
import { getLastUpdated, setLastUpdated } from "~/utils/cacheManager";
import { logger } from "~/utils/log";

const cacheStore: Map<string, { data: any; fetchedAt: number }> = new Map();

/**
 * Accepts a static string or a function that returns routeKey dynamically.
 */

export function cacheMiddleware(
  routeKey: string | ((req: Request) => string)
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = typeof routeKey === "function" ? routeKey(req) : routeKey;

      const clientTimestamp = Number(req.query.timestamp || req.params.timestamp);
      const serverLastUpdated = getLastUpdated(key);

      // 1. Timestamp match: return 304 Not Modified
      if (
        clientTimestamp &&
        serverLastUpdated &&
        clientTimestamp === serverLastUpdated
      ) {
        logger.log(`[Cache] Not Modified for ${key}`);
        return res.status(304).end(); // no body
      }

      // 2. Check server cache
      const cached = cacheStore.get(key);
      if (cached && serverLastUpdated && cached.fetchedAt >= serverLastUpdated) {
        logger.log(`[Cache] Hit for ${key}`);
        return res.json({
          success: true,
          data: cached.data,
          lastUpdated: serverLastUpdated,
          source: "cache",
        });
      }

      // 3. On cache miss, override res.json to intercept controller result
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        logger.log(`[Cache] Miss for ${key}`);
        if (body?.success && body?.data) {
          const now = Date.now();
          cacheStore.set(key, { data: body.data, fetchedAt: now });
          setLastUpdated(key);
          body.lastUpdated = now;
          body.source = "origin";
        }
        return originalJson(body);
      };

      next(); // pass to controller
    } catch (err) {
      next(err);
    }
  };
}
