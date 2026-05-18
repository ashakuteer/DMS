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

  const allowedOrigins = [
    'https://dms-sepia-gamma.vercel.app',
    'http://localhost:3000',
    'http://localhost:5000',
  ];
  if (process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL.split(',').forEach(u => {
      const trimmed = u.trim();
      if (trimmed) allowedOrigins.push(trimmed);
    });
  }
  if (process.env.REPLIT_DEV_DOMAIN) {
    allowedOrigins.push(`https://${process.env.REPLIT_DEV_DOMAIN}`);
  }

  console.log('CORS allowed origins:', allowedOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
