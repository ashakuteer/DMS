import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { join } from "path";
import * as express from "express";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS FIX for Vercel frontend
  app.enableCors({
    origin: [
      "https://dms-sepia-gamma.vercel.app",
      "http://localhost:5000",
      "http://localhost:3000"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
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

  // Railway / production port handling
  const port =
    Number(process.env.PORT) ||
    Number(process.env.API_PORT) ||
    3001;

  await app.listen(port, "0.0.0.0");

  console.log(`API server running on http://0.0.0.0:${port}`);
}

bootstrap();
