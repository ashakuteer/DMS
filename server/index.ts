import { spawn, ChildProcess, execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

if (!process.env.HOME || !fs.existsSync(process.env.HOME)) {
  process.env.HOME = "/tmp";
  fs.mkdirSync("/tmp/.config", { recursive: true });
}

console.log("Starting NGO Donor Management System...");
console.log("API will run on port 3001");
console.log("Web will run on port 5000");

let apiProcess: ChildProcess | null = null;
let webProcess: ChildProcess | null = null;

function killPort(port: number) {
  try {
    execSync(`fuser -k ${port}/tcp 2>/dev/null || true`, { stdio: "ignore" });
  } catch {}
  try {
    execSync(`lsof -ti:${port} 2>/dev/null | xargs -r kill -9 2>/dev/null || true`, { stdio: "ignore" });
  } catch {}
}

function killByName(pattern: string) {
  try {
    execSync(`pkill -9 -f "${pattern}" 2>/dev/null || true`, { stdio: "ignore" });
  } catch {}
}

killByName("next dev");
killByName("next-server");
killByName("nest start");
killPort(3001);
killPort(5000);

let pnpmBin: string;
try {
  pnpmBin = execSync("which pnpm", { encoding: "utf8", env: process.env }).trim();
} catch {
  pnpmBin = "/nix/store/61lr9izijvg30pcribjdxgjxvh3bysp4-pnpm-10.26.1/bin/pnpm";
}

const sharedEnv = {
  ...process.env,
  HOME: process.env.HOME || "/tmp",
};

function startWeb() {
  console.log("Starting Next.js frontend on port 5000...");
  webProcess = spawn(pnpmBin, ["--filter", "@ngo-donor/web", "run", "dev"], {
    cwd: rootDir,
    stdio: "inherit",
    env: {
      ...sharedEnv,
      PORT: "5000",
      NEXT_TELEMETRY_DISABLED: "1",
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
      API_INTERNAL_URL: "http://localhost:3001",
    }
  });
  webProcess.on("error", (err) => console.error("Web error:", err));
  webProcess.on("close", (code) => console.log(`Web process exited with code ${code}`));
}

function startAPI() {
  console.log("Starting NestJS API on port 3001...");
  apiProcess = spawn(pnpmBin, ["--filter", "@ngo-donor/api", "run", "dev"], {
    cwd: rootDir,
    stdio: "inherit",
    env: {
      ...sharedEnv,
      PORT: "3001",
      API_PORT: "3001",
      DATABASE_URL: process.env.DATABASE_URL || "",
    }
  });
  apiProcess.on("error", (err) => console.error("API error:", err));
  apiProcess.on("close", (code) => console.log(`API process exited with code ${code}`));
}

function cleanup() {
  console.log("\nShutting down...");
  killByName("next dev");
  killByName("next-server");
  killByName("nest start");
  if (apiProcess && !apiProcess.killed) {
    try { process.kill(-apiProcess.pid!, "SIGKILL"); } catch {}
    try { apiProcess.kill("SIGKILL"); } catch {}
  }
  if (webProcess && !webProcess.killed) {
    try { process.kill(-webProcess.pid!, "SIGKILL"); } catch {}
    try { webProcess.kill("SIGKILL"); } catch {}
  }
  killPort(3001);
  killPort(5000);
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

startWeb();
setTimeout(startAPI, 2000);
