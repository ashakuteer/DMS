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

  app.enableCors({
    origin: [
      "https://dms-sepia-gamma.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
  console.log("CORS ENABLED - origin: dms-sepia-gamma.vercel.app");

  app.setGlobalPrefix("api");

  app.use("/uploads", express.static(join(process.cwd(), "uploads")));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port =
    Number(process.env.API_PORT) ||
    Number(process.env.PORT) ||
    3001;
console.log("🚀 VERSION 2 - CORS FINAL FIX");
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
