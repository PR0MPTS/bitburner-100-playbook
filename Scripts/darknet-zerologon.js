
/**
 * ============================================================
 * PR0MPTS | BITBURNER AUTOMATION
 * ============================================================
 *
 * Script:      darknet-zerologon.js
 * Version:     1.1.0
 * Project:     Bitburner 100% Playbook
 * Module:      Operation Darknet
 *
 * PURPOSE
 * ------------------------------------------------------------
 * Identify directly connected ZeroLogon Darknet servers
 * and attempt authentication using an empty password.
 *
 * VERSION HISTORY
 * ------------------------------------------------------------
 * v1.1.0
 * - Added live neighbour discovery using ns.dnet.probe().
 * - Added automatic selection of eligible ZeroLogon targets.
 * - Added online and direct-connection validation.
 * - Added handling for error 351 (Direct Connection Required).
 * - Added standardised PR0MPTS script documentation header.
 *
 * v1.0.0
 * - Initial ZeroLogon authentication test.
 * - Supported manually specified targets.
 * - Added authentication result reporting.
 * - Identified error 351 during initial testing.
 *
 * DEPENDENCIES
 * ------------------------------------------------------------
 * - Bitburner Darknet API (ns.dnet)
 * - DarkscapeNavigator.exe
 *
 * OPERATIONAL NOTES
 * ------------------------------------------------------------
 * - Must run on darkweb.
 * - Automatically selects the first eligible ZeroLogon
 *   server from the current network topology.
 * - Makes one authentication attempt per execution.
 * - Does not perform brute-force password guessing.
 * - Error 351 is treated as a connectivity failure,
 *   not an incorrect-password failure.
 * - Authentication sessions are process-specific.
 * - Does not modify existing automation systems.
 *
 * ============================================================
 */

/** @param {NS} ns */
export async function main(ns) {
  if (ns.getHostname() !== "darkweb") {
    ns.tprint("ERROR: Run on darkweb.");
    return;
  }

  const neighbours = ns.dnet.probe();

  ns.tprint("=== ZEROLOGON TEST v1.1.0 ===");
  ns.tprint(`Live neighbours: ${neighbours.length}`);

  let target = null;

  for (const host of neighbours) {
    try {
      const details = ns.dnet.getServerDetails(host);

      if (
        details.isOnline &&
        details.isConnectedToCurrentServer &&
        details.modelId === "ZeroLogon"
      ) {
        target = host;
        break;
      }
    } catch (error) {
      ns.print(`[SKIP] ${host}: ${String(error)}`);
    }
  }

  if (!target) {
    ns.tprint(
      "No directly connected ZeroLogon target available."
    );
    return;
  }

  ns.tprint(`Target: ${target}`);
  ns.tprint("Attempting empty-password authentication...");

  try {
    const result = await ns.dnet.authenticate(target, "");

    ns.tprint("Result: " + JSON.stringify(result));

    if (result.success) {
      ns.tprint("SUCCESS: Authentication accepted.");
    } else if (result.code === 351) {
      ns.tprint(
        "CONNECTIVITY: Target moved or connection lost."
      );
      ns.tprint("Not counted as a password failure.");
    } else {
      ns.tprint(
        "Authentication unsuccessful. Code: " +
        result.code
      );
    }
  } catch (error) {
    ns.tprint("ERROR: " + String(error));
  }
}
