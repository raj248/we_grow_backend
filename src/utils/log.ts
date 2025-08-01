// src/utils/log.ts

import winston from "winston";
import DailyRotateFile from 'winston-daily-rotate-file';
import util from "util";
import path from "path";

type LogLevel = "LOG" | "INFO" | "WARN" | "ERROR";
const logs: string[] = [];

function formatLog(level: LogLevel, message: string): string {
  return `[${new Date().toISOString()}] [${level}] ${message}`;
}

function prettyFormat(message: any): string {
  if (typeof message === "object") {
    return process.env.NODE_ENV === "development"
      ? util.inspect(message, { depth: null, colors: true })
      : JSON.stringify(message);
  }
  return message;
}

function pushLog(entry: string): void {
  logs.push(entry);
  if (logs.length > 50) logs.shift();
}

// Rotating file transport
const fileTransport = new DailyRotateFile({
  filename: path.join("logs", "app-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "10m",
  maxFiles: "14d",
  level: "info",
});

// Winston Logger Configuration
const winstonLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      let parsedMessage = message;
      if (typeof message === "string") {
        try {
          parsedMessage = JSON.parse(message);
        } catch {
          // keep as string
        }
      }
      const messageString =
        typeof parsedMessage === "object"
          ? (process.env.NODE_ENV === "development"
            ? util.inspect(parsedMessage, { depth: null, colors: true })
            : JSON.stringify(parsedMessage))
          : parsedMessage;

      const metaString =
        Object.keys(meta).length > 0
          ? (process.env.NODE_ENV === "development"
            ? util.inspect(meta, { depth: null, colors: true })
            : JSON.stringify(meta))
          : "";

      return `[${timestamp}] [${level.toUpperCase()}] ${messageString}${metaString ? `\n${metaString}` : ""}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === "development"
        ? winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
        : winston.format.simple(),
    }),
    fileTransport
  ],
});

// Logging functions
function log(message: any): void {
  const entry = formatLog("LOG", String(message));
  pushLog(entry);
  winstonLogger.info(prettyFormat(message));
}

function info(message: any): void {
  const entry = formatLog("INFO", String(message));
  pushLog(entry);
  winstonLogger.info(prettyFormat(message));
}

function warn(message: any): void {
  const entry = formatLog("WARN", String(message));
  pushLog(entry);
  winstonLogger.warn(prettyFormat(message));
}

function error(message: any): void {
  const entry = formatLog("ERROR", String(message));
  pushLog(entry);
  winstonLogger.error(prettyFormat(message));
}

export const logger = {
  logs,
  log,
  info,
  warn,
  error,
} as const;
