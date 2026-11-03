
/**
 * ============================================================
 * PR0MPTS | BITBURNER AUTOMATION
 * ============================================================
 *
 * Script:      darknet-status.js
 * Version:     1.0.0
 * Project:     Bitburner 100% Playbook
 * Module:      Operation Darknet
 *
 * PURPOSE
 * ------------------------------------------------------------
 * Display a read-only summary of collected Darknet
 * reconnaissance intelligence.
 *
 * VERSION HISTORY
 * ------------------------------------------------------------
 * v1.0.0
 * - Initial Darknet intelligence dashboard.
 * - Added persistent state and statistics reporting.
 * - Added recent server discovery history.
 * - Added gateway health and topology statistics.
 * - Added standardised PR0MPTS documentation header.
 *
 * DEPENDENCIES
 * ------------------------------------------------------------
 * - darknet-controller.js v2.1.0 state files
 *
 * CONFIGURATION
 * ------------------------------------------------------------
 * Execution host: home
 * Mode:           One-shot, read-only
 * State file:     darknet-state-v2.txt
 * Stats file:     darknet-stats-v2.txt
 *
 * OPERATIONAL NOTES
 * ------------------------------------------------------------
 * - Does not call the Darknet API.
 * - Does not authenticate or attack servers.
 * - Does not write or modify any files.
 * - Does not launch background processes.
 * - Authentication count reflects controller records,
 *   not necessarily live sessions.
 *
 * USAGE
 * ------------------------------------------------------------
 * run darknet-status.js
 *
 * ============================================================
 */

/** @param {NS} ns */
export async function main(ns) {
  const STATE = "darknet-state-v2.txt";
  const STATS = "darknet-stats-v2.txt";

  if (ns.getHostname() !== "home") {
    ns.tprint("ERROR: Run on home.");
    return;
  }

  if (
    !ns.fileExists(STATE, "home") ||
    !ns.fileExists(STATS, "home")
  ) {
    ns.tprint("ERROR: Darknet intelligence files missing.");
    return;
  }

  let state;
  let stats;

  try {
    state = JSON.parse(ns.read(STATE));
    stats = JSON.parse(ns.read(STATS));
  } catch (error) {
    ns.tprint("ERROR: Cannot read intelligence files.");
    ns.tprint(String(error));
    return;
  }

  const servers = Object.values(state.servers || {})
    .filter(s => s.hostname !== "home");

  const links = Object.values(state.links || {});

  const recent = [...servers]
    .sort((a, b) =>
      Date.parse(b.firstSeen) -
      Date.parse(a.firstSeen)
    )
    .slice(0, 5);

  const line = (label, value) =>
    ns.tprint(
      label.padEnd(24) + String(value)
    );

  ns.tprint("");
  ns.tprint("======================================");
  ns.tprint(" PR0MPTS | DARKNET INTELLIGENCE");
  ns.tprint("======================================");

  line("Known servers:", servers.length);
  line(
    "Currently visible:",
    servers.filter(s => s.visible).length
  );
  line(
    "Historical / hidden:",
    servers.filter(s => !s.visible).length
  );

  ns.tprint("--------------------------------------");

  line("Known connections:", links.length);
  line(
    "Active connections:",
    links.filter(l => l.active).length
  );

  ns.tprint("--------------------------------------");

  line("Gateway status:", stats.gatewayStatus);
  line("Gateway neighbours:", stats.gatewayNeighbours);
  line("Gateway age (sec):", stats.gatewayAgeSeconds);
  line("Completed scans:", stats.scans);
  line("Last scan:", stats.updated);

  ns.tprint("--------------------------------------");

  line(
    "Recorded authenticated:",
    servers.filter(
      s => s.auth?.status === "AUTHENTICATED"
    ).length
  );

  ns.tprint("--------------------------------------");
  ns.tprint(" MOST RECENT DISCOVERIES");
  ns.tprint("--------------------------------------");

  if (recent.length === 0) {
    ns.tprint(" No servers discovered yet.");
  }

  for (const server of recent) {
    ns.tprint(
      ` ${server.hostname} | ${server.firstSeen}`
    );
  }

  ns.tprint("======================================");
  ns.tprint("");
}
