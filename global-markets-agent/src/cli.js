import { runAgentCycle, getCurrentEdition } from "./marketNewsAgent.js";

const rawEdition = (process.argv[2] || "").trim().toUpperCase();
const edition = (!rawEdition || rawEdition === "AUTO") ? getCurrentEdition() : rawEdition;
console.log(`[CLI] Handmatige start voor editie: ${edition}`);

runAgentCycle(edition)
  .then(res => {
    console.log("[CLI] Resultaat:", JSON.stringify(res, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error("[CLI Fatal Error]:", err);
    process.exit(1);
  });
