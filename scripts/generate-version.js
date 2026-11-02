const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const workspaceFolder = path.resolve(__dirname, "..");
const version = execFileSync("git", ["describe", "--tags", "--always"], {
    cwd: workspaceFolder,
    encoding: "utf8",
}).trim();
const outputPath = path.join(workspaceFolder, ".vscode", "game-version.js");

fs.writeFileSync(
    outputPath,
    `window.PACMAN_VERSION = ${JSON.stringify(version)};\n`,
    "utf8"
);
console.log(`Generated game version: ${version}`);
