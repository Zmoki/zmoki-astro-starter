// The build's commit, for <meta name="version"> and the health check. Asks git
// rather than a host env var: every supported host and CI clones with .git present.
import { execSync } from "child_process";

export const commitHash = execSync("git rev-parse --short HEAD").toString().trim();
