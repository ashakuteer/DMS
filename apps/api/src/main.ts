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

  // Build allowed origins list
  // FRONTEND_URL may contain one or more comma-separated URLs (e.g. from Railway env)
  const allowedOrigins: string[] = [
    'https://dms-sepia-gamma.vercel.app',
    'http://localhost:3000',
    'http://localhost:5000',
  ];

  if (process.env.FRONTEND_URL) {
    const envUrls = process.env.FRONTEND_URL
      .split(',')
      .map(u => u.trim())
      .filter(Boolean);
    for (const url of envUrls) {
      if (!allowedOrigins.includes(url)) {
        allowedOrigins.push(url);
      }
    }
  }

  if (process.env.REPLIT_DEV_DOMAIN) {
    allowedOrigins.push(`https://${process.env.REPLIT_DEV_DOMAIN}`);
  }
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    allowedOrigins.push(`https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
  }

  console.log('[CORS] Allowed origins:', allowedOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no Origin header)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        /\.replit\.dev$/.test(origin) ||
        /\.repl\.co$/.test(origin) ||
        /\.replit\.app$/.test(origin) ||
        /\.vercel\.app$/.test(origin)
      ) {
        return callback(null, true);
      }

      console.warn(`[CORS] Blocked origin: ${origin}`);
      // Return false (not an Error) — throwing in the cors middleware causes
      // a 500 with no CORS headers, which the browser then misreports as a
      // generic CORS failure. Returning false sends a clean response without
      // the Access-Control-Allow-Origin header, which the browser blocks
      // correctly and the network tab shows clearly.
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

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
  console.log(`[CORS] ${allowedOrigins.length} origins configured`);
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
