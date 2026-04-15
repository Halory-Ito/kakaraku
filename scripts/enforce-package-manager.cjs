const userAgent = process.env.npm_config_user_agent || "";
const isNetlify = process.env.NETLIFY === "true";
const isPnpm = userAgent.includes("pnpm/");

if (isNetlify) {
	console.log("[preinstall] NETLIFY environment detected, skip pnpm-only check.");
	process.exit(0);
}

if (isPnpm) {
	process.exit(0);
}

console.error("[preinstall] This project requires pnpm for local installs.");
console.error("[preinstall] Please run: pnpm install");
process.exit(1);
