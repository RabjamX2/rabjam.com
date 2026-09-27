import { mkdtempSync, writeFileSync } from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";

function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function run(command, args, options = {}) {
    execFileSync(command, args, {
        stdio: "inherit",
        ...options,
    });
}

const branch = process.env.DEPLOY_BRANCH || process.env.GITHUB_REF_NAME || "main";
const host = requireEnv("DEPLOY_HOST");
const user = requireEnv("DEPLOY_USER");
const remotePath = requireEnv("DEPLOY_PATH");
const port = process.env.DEPLOY_PORT || "22";
const restartCommand = process.env.DEPLOY_RESTART_COMMAND || "";

const tempDir = mkdtempSync(path.join(os.tmpdir(), "mern-poker-deploy-"));
const keyPath = path.join(tempDir, "deploy_key");

if (process.env.DEPLOY_SSH_KEY) {
    let keyContent = process.env.DEPLOY_SSH_KEY.trim();
    
    // Check if base64 encoded
    if (!keyContent.includes("-----BEGIN")) {
        try {
            const decoded = Buffer.from(keyContent, "base64").toString("utf-8");
            if (decoded.includes("-----BEGIN")) {
                keyContent = decoded;
            }
        } catch {}
    }

    // Convert literal \n string sequences to real newlines
    if (keyContent.includes("\\n")) {
        keyContent = keyContent.replace(/\\n/g, "\n");
    }

    keyContent = keyContent.replace(/\r\n/g, "\n").trim() + "\n";

    const lines = keyContent.trim().split("\n");
    console.log(`SSH Key Loaded: Header="${lines[0]}", Footer="${lines[lines.length - 1]}", Lines=${lines.length}`);

    writeFileSync(keyPath, keyContent, { mode: 0o600 });
} else {
    throw new Error("Missing required environment variable: DEPLOY_SSH_KEY");
}

const sshBaseArgs = [
    "-i",
    keyPath,
    "-p",
    port,
    "-o",
    "StrictHostKeyChecking=no",
    `${user}@${host}`,
];

const defaultRestartCmd = "pm2 startOrReload ecosystem.config.cjs --update-env";

const remoteScript = [
    "set -euo pipefail",
    `cd ${JSON.stringify(remotePath)}`,
    `git fetch origin ${JSON.stringify(branch)}`,
    `git checkout ${JSON.stringify(branch)}`,
    `git reset --hard origin/${branch}`,
    "npm ci --prefix server",
    "npm ci --prefix client",
    "(cd server && npx prisma generate)",
    "(cd server && npx prisma migrate deploy)",
    "npm run build --prefix client",
    restartCommand ? restartCommand : defaultRestartCmd,
].join(" && ");

run("ssh", [...sshBaseArgs, remoteScript]);
