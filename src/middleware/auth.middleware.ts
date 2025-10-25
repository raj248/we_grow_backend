import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import cookie from "cookie";

export const verifyAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("I got in");
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.admin_token;
  console.log("token", token);
  if (!token) {
    // if (process.env.NODE_ENV === "development") {
    //   return next();
    // }
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      adminId: string;
    };
    (req as any).adminId = decoded.adminId;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};
