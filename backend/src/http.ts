import type { Request, Response } from "express";

export function handleError(res: Response, error: unknown): void {
  const err = error as { status?: number; message?: string };
  const status = err.status ?? 500;
  res.status(status).json({
    error: err.message ?? "Unexpected server error",
  });
}

export function readString(req: Request, key: string): string | undefined {
  const value = req.body?.[key] ?? req.query[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
