import { spawn, ChildProcess } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

console.log("🚀 Starting NGO Donor Management System...");

let apiProcess: ChildProcess | null = null;
let webProcess: ChildProcess | null = null;

// Start NestJS API on port 3001
function startAPI() {
  console.log("📡 Starting NestJS API on port 3001...");
  
  apiProcess = spawn("npx", ["nest", "start", "--watch"], {
    cwd: path.join(rootDir, "apps", "api"),
    stdio: "inherit",
    shell: true,
    env: { ...process.env, API_PORT: "3001" }
  });

  apiProcess.on("error", (err) => {
    console.error("❌ API error:", err);
  });

  apiProcess.on("close", (code) => {
    console.log(`API process exited with code ${code}`);
  });
}

// Start Next.js on port 5000
function startWeb() {
  console.log("🌐 Starting Next.js frontend on port 5000...");
  
  webProcess = spawn("npx", ["next", "dev", "-p", "5000", "-H", "0.0.0.0"], {
    cwd: path.join(rootDir, "apps", "web"),
    stdio: "inherit",
    shell: true,
    env: { ...process.env, PORT: "5000" }
  });

  webProcess.on("error", (err) => {
    console.error("❌ Web error:", err);
  });

  webProcess.on("close", (code) => {
    console.log(`Web process exited with code ${code}`);
  });
}

// Cleanup function
function cleanup() {
  console.log("\n👋 Shutting down...");
  if (apiProcess) {
    apiProcess.kill();
  }
  if (webProcess) {
    webProcess.kill();
  }
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

// Start API first, then web after a short delay
startAPI();
setTimeout(startWeb, 3000);
