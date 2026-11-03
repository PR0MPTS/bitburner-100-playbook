
/**
 * ============================================================
 * PR0MPTS | BITBURNER AUTOMATION
 * ============================================================
 *
 * Script:      darknet-auth.js
 * Version:     1.0.0
 * Project:     Bitburner 100% Playbook
 * Module:      Operation Darknet
 *
 * PURPOSE
 * ------------------------------------------------------------
 * Inspect directly visible Darknet servers and collect
 * authentication intelligence.
 *
 * Records authentication models, password hints,
 * password formats, password lengths, and charisma
 * requirements.
 *
 * VERSION HISTORY
 * ------------------------------------------------------------
 * v1.0.0
 * - Initial authentication intelligence collector.
 * - Added live Darknet neighbour discovery.
 * - Added server authentication metadata inspection.
 * - Added required charisma reporting.
 * - Added JSON intelligence report generation.
 * - Added automatic report transfer to home.
 * - Added standardised PR0MPTS documentation header.
 *
 * DEPENDENCIES
 * ------------------------------------------------------------
 * - Bitburner Darknet API (ns.dnet)
 * - DarkscapeNavigator.exe
 *
 * CONFIGURATION
 * ------------------------------------------------------------
 * Execution host: darkweb
 * Execution mode: One-shot
 * Report file:    darknet-auth-report.txt
 * Destination:    home
 *
 * OPERATIONAL NOTES
 * ------------------------------------------------------------
 * - Read-only authentication reconnaissance.
 * - Does not attempt passwords.
 * - Does not establish authentication sessions.
 * - Reports reflect the topology at execution time.
 * - Existing reports are overwritten on each run.
 * - Safe to run alongside existing automation.
 *
 * USAGE
 * ------------------------------------------------------------
 * run darknet-auth.js
 *
 * ============================================================
 */

/** @param {NS} ns */
export async function main(ns) {
  const REPORT = "darknet-auth-report.txt";

  if (ns.getHostname() !== "darkweb") {
    ns.tprint("ERROR: Run this script on darkweb.");
    return;
  }

  if (
    typeof ns.dnet?.probe !== "function" ||
    typeof ns.dnet?.getServerDetails !== "function"
  ) {
    ns.tprint(
      "ERROR: Required Darknet API unavailable."
    );
    return;
  }

  const neighbours = [...new Set(ns.dnet.probe())];
  const servers = [];

  ns.tprint(
    "=== PR0MPTS DARKNET AUTH INTEL ==="
  );

  ns.tprint(
    `Targets discovered: ${neighbours.length}`
  );

  for (const host of neighbours) {
    try {
      const details = ns.dnet.getServerDetails(host);

      const record = {
        hostname: host,
        timestamp: new Date().toISOString(),
        isOnline: details.isOnline ?? null,
        isConnected:
          details.isConnectedToCurrentServer ?? null,
        hasSession: details.hasSession ?? null,
        modelId: details.modelId ?? null,
        passwordHint: details.passwordHint ?? null,
        passwordFormat:
          details.passwordFormat ?? null,
        passwordLength:
          details.passwordLength ?? null,
        requiredCharisma:
          ns.dnet.getServerRequiredCharismaLevel(host)
      };

      servers.push(record);

      ns.tprint(
        `[INTEL] ${host} | ` +
        `Model: ${record.modelId} | ` +
        `Online: ${record.isOnline}`
      );
    } catch (error) {
      servers.push({
        hostname: host,
        error: String(error)
      });

      ns.tprint(
        `[ERROR] ${host}: ${String(error)}`
      );
    }
  }

  const report = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    origin: ns.getHostname(),
    targets: servers.length,
    servers
  };

  await ns.write(
    REPORT,
    JSON.stringify(report, null, 2),
    "w"
  );

  const copied = await ns.scp(
    REPORT,
    "home",
    "darkweb"
  );

  ns.tprint(
    copied
      ? "Authentication intelligence saved to home."
      : "WARNING: Could not transfer report."
  );
}
