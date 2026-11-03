
/**
 * ============================================================
 * PR0MPTS | BITBURNER AUTOMATION
 * ============================================================
 *
 * Script:      darknet-scout.js
 * Version:     1.0.0
 * Project:     Bitburner 100% Playbook
 * Module:      Operation Darknet
 *
 * PURPOSE
 * ------------------------------------------------------------
 * Perform passive reconnaissance of the Bitburner Darknet.
 *
 * Discovers neighbouring Darknet servers visible from the
 * execution host and records their hostnames and IP addresses.
 *
 * Supports one-shot reconnaissance and continuous monitoring
 * without attempting authentication or modifying servers.
 *
 * VERSION HISTORY
 * ------------------------------------------------------------
 * v1.0.0
 * - Initial standalone Darknet reconnaissance utility.
 * - Added neighbour discovery using ns.dnet.probe().
 * - Added IP discovery using ns.dnet.probe(true).
 * - Added hostname and IP snapshot generation.
 * - Added JSON report output.
 * - Added optional continuous monitoring with --watch.
 * - Added 60-second monitoring interval.
 * - Added Darknet API availability validation.
 * - Added standardised PR0MPTS documentation header.
 *
 * DEPENDENCIES
 * ------------------------------------------------------------
 * - Bitburner Darknet API (ns.dnet)
 * - DarkscapeNavigator.exe
 *
 * CONFIGURATION
 * ------------------------------------------------------------
 * Execution host:       Any host with Darknet API access
 * Default mode:         One-shot reconnaissance
 * Watch mode:           --watch
 * Watch interval:       60 seconds
 * Output file:          darknet-scout-state.txt
 *
 * OPERATIONAL NOTES
 * ------------------------------------------------------------
 * - Performs passive reconnaissance only.
 * - Does not authenticate or attack Darknet servers.
 * - Does not establish or maintain sessions.
 * - Does not deploy additional workers.
 * - Discovers only neighbours visible from its host.
 * - Does not recursively explore the Darknet.
 * - Each scan overwrites the previous snapshot.
 * - Does not maintain historical discoveries.
 * - Output is saved locally on the execution host.
 * - Safe to run alongside existing automation.
 *
 * USAGE
 * ------------------------------------------------------------
 * run darknet-scout.js
 * run darknet-scout.js --watch
 *
 * ============================================================
 */

/** @param {NS} ns */
export async function main(ns) {
  const watch = ns.args.includes("--watch");
  const interval = 60000;
  const output = "darknet-scout-state.txt";

  ns.disableLog("sleep");

  if (!ns.dnet || typeof ns.dnet.probe !== "function") {
    ns.tprint("ERROR: Darknet API unavailable.");
    ns.tprint("Check your Bitburner version.");
    return;
  }

  ns.tprint("=== PR0MPTS DARKNET SCOUT v1.0 ===");
  ns.tprint("Mode: PASSIVE RECONNAISSANCE");

  do {
    try {
      const hosts = ns.dnet.probe();
      const ips = ns.dnet.probe(true);
      const timestamp = new Date().toISOString();

      const records = hosts.map((host, i) => ({
        hostname: host,
        ip: ips[i] ?? null
      }));

      const snapshot = {
        version: "1.0",
        timestamp,
        origin: ns.getHostname(),
        neighbours: records,
        neighbourCount: records.length
      };

      await ns.write(
        output,
        JSON.stringify(snapshot, null, 2),
        "w"
      );

      ns.tprint(
        `[DARKNET] ${timestamp} | ` +
        `${records.length} neighbour(s)`
      );

      for (const record of records) {
        ns.tprint(
          `  ${record.hostname}`
        );
      }

      if (records.length === 0) {
        ns.tprint(
          "No Darknet neighbours visible from this host."
        );
      }

      ns.tprint(`Snapshot saved: ${output}`);
    } catch (error) {
      ns.tprint(`Darknet scout error: ${String(error)}`);
      return;
    }

    if (watch) {
      await ns.sleep(interval);
    }
  } while (watch);
}
