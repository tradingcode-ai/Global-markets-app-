import cron from "node-cron";
import { runAgentCycle } from "./marketNewsAgent.js";
import { CONFIG } from "./config.js";

export function initScheduler() {
  console.log(`[Scheduler] Geactiveerd voor tijdzone ${CONFIG.TIMEZONE}`);

  // 07:00 Amsterdamse tijd (Morning Europe)
  cron.schedule("0 7 * * 1-5", async () => {
    console.log("[Scheduler] Start 07:00 MORNING_EUROPE cyclus...");
    await executeWithRetry("MORNING_EUROPE");
  }, { timezone: CONFIG.TIMEZONE });

  // 15:30 Amsterdamse tijd (US Open)
  cron.schedule("30 15 * * 1-5", async () => {
    console.log("[Scheduler] Start 15:30 US_OPEN cyclus...");
    await executeWithRetry("US_OPEN");
  }, { timezone: CONFIG.TIMEZONE });

  // 21:30 Amsterdamse tijd (Market Close)
  cron.schedule("30 21 * * 1-5", async () => {
    console.log("[Scheduler] Start 21:30 MARKET_CLOSE cyclus...");
    await executeWithRetry("MARKET_CLOSE");
  }, { timezone: CONFIG.TIMEZONE });
}

async function executeWithRetry(edition, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await runAgentCycle(edition);
    } catch (err) {
      console.error(`[Scheduler Error] Poging ${attempt}/${maxAttempts} mislukt:`, err);
      if (attempt < maxAttempts) {
        const delay = attempt * 10000;
        console.log(`[Scheduler] Wachten ${delay / 1000}s voor retry...`);
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }
}
