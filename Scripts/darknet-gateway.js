
/**
 * ============================================================
 * PR0MPTS | BITBURNER AUTOMATION
 * ============================================================
 *
 * Script:      darknet-gateway.js
 * Version:     1.0.0
 * Project:     Bitburner 100% Playbook
 * Module:      Operation Darknet
 *
 * PURPOSE
 * ------------------------------------------------------------
 * Monitor the Darknet gateway's immediate neighbours and
 * publish topology reports to the home server.
 *
 * Enables the home-based Darknet controller to maintain
 * visibility into the changing Darknet network.
 *
 * VERSION HISTORY
 * ------------------------------------------------------------
 * v1.0.0
 * - Initial gateway reconnaissance worker.
 * - Added neighbour discovery using ns.dnet.probe().
 * - Added JSON report generation.
 * - Added automatic report transfer to home.
 * - Added continuous 30-second monitoring.
 * - Added optional --once execution mode.
 * - Added standardised PR0MPTS documentation header.
 *
 * DEPENDENCIES
 * ------------------------------------------------------------
 * - Bitburner Darknet API (ns.dnet)
 * - DarkscapeNavigator.exe
 * - darknet-controller.js (report consumer)
 *
 * CONFIGURATION
 * ------------------------------------------------------------
 * Execution host: darkweb
 * Scan interval:  30 seconds
 * Report file:    darknet-gateway-report.txt
 * Destination:    home
 *
 * OPERATIONAL NOTES
 * ------------------------------------------------------------
 * - Must execute on darkweb.
 * - Does not attempt authentication.
 * - Does not establish or maintain Darknet sessions.
 * - Reports are overwritten each scan.
 * - The controller maintains historical discoveries.
 * - Safe to run alongside existing automation.
 *
 * USAGE
 * ------------------------------------------------------------
 * run darknet-gateway.js
 * run darknet-gateway.js --once
 *
 * ============================================================
 */

/** @param {NS} ns */
export async function main(ns) {
  const REPORT = "darknet-gateway-report.txt";
  const INTERVAL = 30000;
  const once = ns.args.includes("--once");

  ns.disableLog("sleep");

  if (ns.getHostname() !== "darkweb") {
    ns.tprint("ERROR: Run this worker on darkweb.");
    return;
  }

  do {
    try {
      const neighbours = ns.dnet.probe();
      const timestamp = new Date().toISOString();

      const report = {
        version: "1.0",
        timestamp,
        origin: ns.getHostname(),
        neighbours: [...new Set(neighbours)],
        count: neighbours.length
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

      if (!copied) {
        ns.print(
          "WARNING: Could not copy report home."
        );
      } else {
        ns.print(
          `[GATEWAY] ${report.count} neighbours reported`
        );
      }
    } catch (error) {
      ns.print(
        "[GATEWAY ERROR] " + String(error)
      );
    }

    if (!once) {
      await ns.sleep(INTERVAL);
    }
  } while (!once);
}
