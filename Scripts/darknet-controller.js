
/**
 * PR0MPTS - Darknet Controller v2.1
 * Unified Network Intelligence
 *
 * Run on home.
 *
 * Usage:
 *   run darknet-controller.js --once
 *   run darknet-controller.js
 *
 * Passive only. No authentication or attacks.
 */

/** @param {NS} ns */
export async function main(ns) {
  const CFG = {
    interval: 30000,
    staleAfter: 90000,
    stateFile: "darknet-state-v2.txt",
    statsFile: "darknet-stats-v2.txt",
    gatewayFile: "darknet-gateway-report.txt",
    maxEvents: 500
  };

  const once = ns.args.includes("--once");
  ns.disableLog("sleep");

  if (ns.getHostname() !== "home") {
    ns.tprint("ERROR: Run controller on home.");
    return;
  }

  if (typeof ns.dnet?.probe !== "function") {
    ns.tprint("ERROR: Darknet API unavailable.");
    return;
  }

  let state = {
    version: "2.1",
    started: new Date().toISOString(),
    scans: 0,
    servers: {},
    links: {},
    events: []
  };

  if (ns.fileExists(CFG.stateFile, "home")) {
    try {
      const saved = JSON.parse(ns.read(CFG.stateFile));

      if (!saved || !saved.servers ||
          typeof saved.servers !== "object" ||
          !Array.isArray(saved.events)) {
        throw new Error("Invalid state format");
      }

      state = {
        ...state,
        ...saved,
        version: "2.1",
        links: saved.links || {},
        events: saved.events
      };
    } catch (e) {
      ns.tprint("ERROR: State load failed: " + e);
      ns.tprint("No data overwritten.");
      return;
    }
  }

  function event(type, host, detail = "") {
    state.events.push({
      timestamp: new Date().toISOString(),
      type,
      host,
      detail
    });

    state.events = state.events.slice(-CFG.maxEvents);
  }

  function ensureServer(host, now) {
    if (!state.servers[host]) {
      state.servers[host] = {
        hostname: host,
        firstSeen: now,
        lastSeen: now,
        sightings: 0,
        visible: false,
        status: "UNKNOWN",
        auth: {
          status: "NOT_ATTEMPTED",
          failures: 0,
          nextRetry: null
        },
        session: {
          status: "UNKNOWN",
          lastVerified: null
        }
      };

      event("DISCOVERED", host);
      ns.tprint("[NEW SERVER] " + host);
    }

    return state.servers[host];
  }

  function linkKey(origin, target) {
    return JSON.stringify([origin, target]);
  }

  function observe(origin, neighbours, now) {
    const unique = [
      ...new Set(
        neighbours.filter(
          h => typeof h === "string" && h.length > 0
        )
      )
    ];

    ensureServer(origin, now);

    const current = new Set(unique);

    for (const target of unique) {
      const record = ensureServer(target, now);
      const key = linkKey(origin, target);

      if (!state.links[key]) {
        state.links[key] = {
          origin,
          target,
          firstSeen: now,
          lastSeen: now,
          active: true,
          sightings: 0
        };

        event("LINK_DISCOVERED", target, origin);
      } else if (!state.links[key].active) {
        state.links[key].active = true;
        event("LINK_RETURNED", target, origin);
      }

      const link = state.links[key];
      link.lastSeen = now;
      link.sightings++;

      record.lastSeen = now;
      record.sightings++;
    }

    for (const link of Object.values(state.links)) {
      if (link.origin === origin &&
          link.active &&
          !current.has(link.target)) {
        link.active = false;
        event("LINK_LOST", link.target, origin);
      }
    }
  }

  function markOriginStale(origin) {
    for (const link of Object.values(state.links)) {
      if (link.origin === origin && link.active) {
        link.active = false;
        event("LINK_STALE", link.target, origin);
      }
    }
  }

  async function scan() {
    const now = new Date().toISOString();
    const nowMs = Date.now();

    // Scan immediate home neighbours.
    const homeNeighbours = ns.dnet.probe();

    if (!Array.isArray(homeNeighbours)) {
      throw new Error("Invalid home probe result");
    }

    observe("home", homeNeighbours, now);

    // Import gateway observations.
    let gatewayStatus = "MISSING";
    let gatewayCount = 0;
    let gatewayAgeSeconds = null;

    if (ns.fileExists(CFG.gatewayFile, "home")) {
      try {
        const report = JSON.parse(
          ns.read(CFG.gatewayFile)
        );

        const reportMs = Date.parse(report.timestamp);
        const age = nowMs - reportMs;

        if (report.origin !== "darkweb" ||
            !Array.isArray(report.neighbours) ||
            !Number.isFinite(age)) {
          gatewayStatus = "INVALID";
        } else {
          gatewayAgeSeconds = Math.round(age / 1000);

          if (age < -5000 || age > CFG.staleAfter) {
            gatewayStatus = "STALE";
          } else {
            gatewayStatus = "ACTIVE";
            gatewayCount = report.neighbours.length;

            // Use observation time, not import time.
            // Avoid counting the same report twice.
            if (state.lastGatewayReport !== report.timestamp) {
              observe(
                "darkweb",
                report.neighbours,
                report.timestamp
              );

              state.lastGatewayReport = report.timestamp;
            }
          }
        }
      } catch (e) {
        gatewayStatus = "INVALID";
        ns.print("[GATEWAY ERROR] " + String(e));
      }
    }

    if (gatewayStatus !== "ACTIVE") {
      markOriginStale("darkweb");
    }

    // Recalculate visibility from active links.
    const activeHosts = new Set(["home"]);

    for (const link of Object.values(state.links)) {
      if (link.active) {
        activeHosts.add(link.origin);
        activeHosts.add(link.target);
      }
    }

    for (const record of Object.values(state.servers)) {
      const wasVisible = record.visible;
      const isVisible = activeHosts.has(record.hostname);

      record.visible = isVisible;
      record.status = isVisible
        ? "VISIBLE"
        : "NOT_VISIBLE";

      if (wasVisible && !isVisible) {
        event("SERVER_LOST", record.hostname);
      }

      if (!wasVisible && isVisible &&
          record.sightings > 0) {
        event("SERVER_VISIBLE", record.hostname);
      }
    }

    state.version = "2.1";
    state.scans++;
    state.lastScan = now;
    state.gatewayStatus = gatewayStatus;

    const records = Object.values(state.servers);
    const links = Object.values(state.links);

    const stats = {
      version: "2.1",
      updated: now,
      scans: state.scans,
      controller: "home",
      knownServers: records.filter(
        r => r.hostname !== "home"
      ).length,
      visibleServers: records.filter(
        r => r.visible && r.hostname !== "home"
      ).length,
      knownLinks: links.length,
      activeLinks: links.filter(l => l.active).length,
      gatewayStatus,
      gatewayNeighbours: gatewayCount,
      gatewayAgeSeconds,
      authenticated: records.filter(
        r => r.auth?.status === "AUTHENTICATED"
      ).length,
      retryIntervalSeconds: 30,
      maxAuthFailures: 5,
      mode: "UNIFIED_RECONNAISSANCE"
    };

    await ns.write(
      CFG.stateFile,
      JSON.stringify(state, null, 2),
      "w"
    );

    await ns.write(
      CFG.statsFile,
      JSON.stringify(stats, null, 2),
      "w"
    );

    ns.print(
      `[SCAN ${state.scans}] ` +
      `Known=${stats.knownServers} ` +
      `Visible=${stats.visibleServers} ` +
      `Links=${stats.activeLinks} ` +
      `Gateway=${gatewayStatus}`
    );

    if (state.scans === 1 ||
        state.scans % 10 === 0) {
      ns.tprint(
        `[DARKNET v2.1] ` +
        `${stats.knownServers} known | ` +
        `${stats.visibleServers} visible | ` +
        `Gateway: ${gatewayStatus}`
      );
    }
  }

  ns.tprint("=== PR0MPTS DARKNET v2.1 ===");
  ns.tprint("Unified reconnaissance enabled.");
  ns.tprint("Interval: 30 seconds");
  ns.tprint("Gateway stale threshold: 90 seconds");
  ns.tprint("Authentication: DISABLED");

  do {
    try {
      await scan();
    } catch (e) {
      ns.tprint("[SCAN ERROR] " + String(e));
    }

    if (!once) {
      await ns.sleep(CFG.interval);
    }
  } while (!once);
}
