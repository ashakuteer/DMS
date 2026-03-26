import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { join } from "path";
import * as express from "express";

// ─── BigInt fix ─────────────────────────────────────────
(BigInt.prototype as any).toJSON = function () {
  const n = Number(this);
  if (!Number.isSafeInteger(n)) {
    console.warn(`BigInt value ${this} exceeds safe range`);
  }
  return n;
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Build the allowed-origins list from env + known patterns
  const frontendUrl = process.env.FRONTEND_URL?.trim();

  const allowedExact = new Set<string>([
    // Hardcoded production Vercel URL (backward compat)
    "https://dms-sepia-gamma.vercel.app",
    // Dev origins
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5000",
  ]);

  // Add FRONTEND_URL from Railway env if present (may be comma-separated list)
  if (frontendUrl) {
    frontendUrl.split(",").forEach((u) => {
      const trimmed = u.trim();
      if (trimmed) allowedExact.add(trimmed);
    });
  }

  const allowedPatterns = [
    /\.vercel\.app$/,       // all Vercel preview & production deployments
    /\.replit\.dev$/,
    /\.repl\.co$/,
    /\.replit\.app$/,
    /\.repl\.run$/,
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow server-to-server / curl (no Origin header)
      if (!origin) return callback(null, true);

      if (allowedExact.has(origin)) return callback(null, true);

      const isAllowed = allowedPatterns.some((p) => p.test(origin));
      if (isAllowed) return callback(null, true);

      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  const allowedList = Array.from(allowedExact).join(", ");
  console.log(`CORS enabled — exact: [${allowedList}] + *.vercel.app + *.replit.*`);

  app.setGlobalPrefix("api");

  app.use("/uploads", express.static(join(process.cwd(), "uploads")));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const port =
    Number(process.env.API_PORT) ||
    Number(process.env.PORT) ||
    3001;

  await app.listen(port, "0.0.0.0");
  console.log(`API server running on http://0.0.0.0:${port}`);
}

// ─── Error protection ───────────────────────────────────
process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT EXCEPTION]", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("[UNHANDLED REJECTION]", reason);
});

bootstrap().catch((err) => {
  console.error("[BOOTSTRAP ERROR]", err);
  process.exit(1);
});
