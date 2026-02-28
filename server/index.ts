import { spawn, ChildProcess, execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

console.log("Starting NGO Donor Management System...");

let apiProcess: ChildProcess | null = null;
let webProcess: ChildProcess | null = null;

function killPort(port: number) {
  try {
    execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, { stdio: "ignore" });
  } catch {}
}

function sleep(ms: number) {
  execSync(`sleep ${ms / 1000}`);
}

killPort(3001);
killPort(5000);
sleep(2000);

function startAPI() {
  console.log("Starting NestJS API on port 3001...");
  
  apiProcess = spawn("npx", ["nest", "start", "--watch"], {
    cwd: path.join(rootDir, "apps", "api"),
    stdio: "inherit",
    shell: true,
    env: { ...process.env, API_PORT: "3001" }
  });

  apiProcess.on("error", (err) => {
    console.error("API error:", err);
  });

  apiProcess.on("close", (code) => {
    console.log(`API process exited with code ${code}`);
  });
}

function startWeb() {
  killPort(5000);
  sleep(500);
  console.log("Starting Next.js frontend on port 5000...");
  
  webProcess = spawn("npx", ["next", "dev", "-p", "5000", "-H", "0.0.0.0"], {
    cwd: path.join(rootDir, "apps", "web"),
    stdio: "inherit",
    shell: true,
    env: { ...process.env, PORT: "5000" }
  });

  webProcess.on("error", (err) => {
    console.error("Web error:", err);
  });

  webProcess.on("close", (code) => {
    console.log(`Web process exited with code ${code}`);
  });
}

function cleanup() {
  console.log("\nShutting down...");
  if (apiProcess && !apiProcess.killed) {
    try { process.kill(-apiProcess.pid!, "SIGKILL"); } catch {}
    apiProcess.kill("SIGKILL");
  }
  if (webProcess && !webProcess.killed) {
    try { process.kill(-webProcess.pid!, "SIGKILL"); } catch {}
    webProcess.kill("SIGKILL");
  }
  killPort(3001);
  killPort(5000);
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

startAPI();
setTimeout(startWeb, 5000);
