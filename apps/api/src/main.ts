import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { join } from "path";
import * as express from "express";

// ─── Global BigInt JSON serialization fix ────────────────────────────────────
// Prisma $queryRaw returns COUNT(*) as BigInt. If any escapes Number() conversion
// it would throw "Cannot serialize BigInt" and crash the entire request/process.
// This ensures BigInts are always safely serialized as numbers.
(BigInt.prototype as any).toJSON = function () {
  const n = Number(this);
  if (!Number.isSafeInteger(n)) {
    console.warn(`BigInt value ${this} exceeds Number.MAX_SAFE_INTEGER — precision may be lost`);
  }
  return n;
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Explicit allowlist — covers the Vercel production app, all Vercel preview URLs,
  // Replit dev/app domains, and local development ports.
  const ALLOWED_ORIGINS = new Set([
    "https://dms-sepia-gamma.vercel.app",
    "http://localhost:3000",
    "http://localhost:5000",
  ]);

  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        ALLOWED_ORIGINS.has(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".replit.dev") ||
        origin.endsWith(".repl.co") ||
        origin.endsWith(".replit.app")
      ) {
        callback(null, true);
      } else {
        callback(null, true); // permissive during rollout — tighten post-launch
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
    exposedHeaders: ["Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.setGlobalPrefix("api");

  app.use("/uploads", express.static(join(process.cwd(), "uploads")));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Use API_PORT for the NestJS API, falling back to PORT (only in Railway/prod) or 3001
  const port =
    Number(process.env.API_PORT) ||
    Number(process.env.PORT) ||
    3001;

  await app.listen(port, "0.0.0.0");

  console.log(`API server running on http://0.0.0.0:${port}`);
}

// ─── Prevent process crash from unhandled errors ──────────────────────────────
process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT EXCEPTION] Process will NOT exit:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[UNHANDLED REJECTION] Process will NOT exit:", reason);
});

bootstrap().catch((err) => {
  console.error("[BOOTSTRAP ERROR] Failed to start NestJS:", err);
  process.exit(1);
});
