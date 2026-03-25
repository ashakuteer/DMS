import { spawn, ChildProcess, execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

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

const rootBin = path.join(rootDir, "node_modules", ".bin");

function startWeb() {
  console.log("Starting Next.js frontend on port 5000...");
  const nextBin = path.join(rootBin, "next");
  const webDir = path.join(rootDir, "apps", "web");
  webProcess = spawn(nextBin, ["dev", "-p", "5000", "-H", "0.0.0.0"], {
    cwd: webDir,
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: "5000",
      NEXT_TELEMETRY_DISABLED: "1",
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
      PATH: `${rootBin}:${process.env.PATH}`,
    }
  });
  webProcess.on("error", (err) => console.error("Web error:", err));
  webProcess.on("close", (code) => console.log(`Web process exited with code ${code}`));
}

function startAPI() {
  console.log("Starting NestJS API on port 3001...");
  const nestBin = path.join(rootBin, "nest");
  apiProcess = spawn(nestBin, ["start", "--watch"], {
    cwd: path.join(rootDir, "apps", "api"),
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: "3001",
      API_PORT: "3001",
      DATABASE_URL: process.env.DATABASE_URL || "",
      PATH: `${rootBin}:${process.env.PATH}`,
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
