"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const path_1 = require("path");
const express = __importStar(require("express"));
BigInt.prototype.toJSON = function () {
    const n = Number(this);
    if (!Number.isSafeInteger(n)) {
        console.warn(`BigInt value ${this} exceeds safe range`);
    }
    return n;
};
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: [
            "https://dms-sepia-gamma.vercel.app",
            "http://localhost:3000",
            "http://localhost:5000",
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    });
    app.setGlobalPrefix("api");
    app.use("/uploads", express.static((0, path_1.join)(process.cwd(), "uploads")));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
    }));
    const port = Number(process.env.API_PORT) ||
        Number(process.env.PORT) ||
        3001;
    await app.listen(port, "0.0.0.0");
    console.log(`API server running on http://0.0.0.0:${port}`);
}
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
//# sourceMappingURL=main.js.map