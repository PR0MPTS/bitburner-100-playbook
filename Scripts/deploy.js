/** @param {NS} ns */
export async function main(ns) {
    const HOME = "home";
    const WORKER = "worker.js";

    // Discover every server connected to home.
    const servers = scanNetwork(ns, HOME);

    ns.tprint(`Discovered ${servers.length} servers.`);

    // Attempt to open ports and gain root access everywhere possible.
    let rootedCount = 0;

    for (const server of servers) {
        if (server === HOME) continue;

        if (!ns.hasRootAccess(server)) {
            openPorts(ns, server);

            const requiredPorts = ns.getServerNumPortsRequired(server);

            try {
                ns.nuke(server);
            } catch {
                ns.tprint(
                    `Skipped ${server}: requires ${requiredPorts} open ports.`
                );
            }
        }

        if (ns.hasRootAccess(server)) {
            rootedCount++;
        }
    }

    // Use a manually supplied target, or automatically choose one.
    const requestedTarget = String(ns.args[0] ?? "");
    let target;

    if (requestedTarget !== "") {
        if (!servers.includes(requestedTarget) && requestedTarget !== HOME) {
            ns.tprint(`ERROR: Unknown target "${requestedTarget}".`);
            return;
        }

        if (!ns.hasRootAccess(requestedTarget)) {
            ns.tprint(`ERROR: No root access on "${requestedTarget}".`);
            return;
        }

        if (
            ns.getServerRequiredHackingLevel(requestedTarget) >
            ns.getHackingLevel()
        ) {
            ns.tprint(
                `ERROR: Hacking level is too low for "${requestedTarget}".`
            );
            return;
        }

        if (ns.getServerMaxMoney(requestedTarget) <= 0) {
            ns.tprint(`ERROR: "${requestedTarget}" has no money.`);
            return;
        }

        target = requestedTarget;
        ns.tprint(`Manual target selected: ${target}`);
    } else {
        target = selectTarget(ns, servers);

        if (!target) {
            ns.tprint("ERROR: No suitable hacking target was found.");
            return;
        }

        ns.tprint(`Automatically selected target: ${target}`);
    }

    // Copy and start worker.js on every rooted server with available RAM.
    let deployedHosts = 0;
    let totalThreads = 0;

    for (const server of servers) {
        if (server === HOME) continue;
        if (!ns.hasRootAccess(server)) continue;

        // Stop only our worker, rather than killing unrelated scripts.
        ns.scriptKill(WORKER, server);

        const copied = await ns.scp(WORKER, server, HOME);

        if (!copied) {
            ns.tprint(`Failed to copy ${WORKER} to ${server}.`);
            continue;
        }

        const maxRam = ns.getServerMaxRam(server);
        const usedRam = ns.getServerUsedRam(server);
        const workerRam = ns.getScriptRam(WORKER, server);
        const availableRam = maxRam - usedRam;
        const threads = Math.floor(availableRam / workerRam);

        if (threads <= 0) {
            ns.tprint(`Skipped ${server}: insufficient RAM.`);
            continue;
        }

        const pid = ns.exec(WORKER, server, threads, target);

        if (pid === 0) {
            ns.tprint(`Failed to start ${WORKER} on ${server}.`);
            continue;
        }

        deployedHosts++;
        totalThreads += threads;

        ns.tprint(
            `Started ${WORKER} on ${server} with ${threads} threads targeting ${target}.`
        );
    }

    ns.tprint("----- Deployment complete -----");
    ns.tprint(`Servers discovered: ${servers.length}`);
    ns.tprint(`Servers with root access: ${rootedCount}`);
    ns.tprint(`Worker hosts active: ${deployedHosts}`);
    ns.tprint(`Total worker threads: ${totalThreads}`);
    ns.tprint(`Current target: ${target}`);
}

/**
 * Recursively discovers the entire network.
 *
 * @param {NS} ns
 * @param {string} start
 * @returns {string[]}
 */
function scanNetwork(ns, start) {
    const discovered = [];
    const visited = new Set([start]);
    const queue = [start];

    while (queue.length > 0) {
        const current = queue.shift();
        discovered.push(current);

        for (const neighbour of ns.scan(current)) {
            if (visited.has(neighbour)) continue;

            visited.add(neighbour);
            queue.push(neighbour);
        }
    }

    return discovered;
}

/**
 * Uses every port-opening program currently available on home.
 *
 * @param {NS} ns
 * @param {string} server
 */
function openPorts(ns, server) {
    const tools = [
        {
            file: "BruteSSH.exe",
            run: () => ns.brutessh(server),
        },
        {
            file: "FTPCrack.exe",
            run: () => ns.ftpcrack(server),
        },
        {
            file: "relaySMTP.exe",
            run: () => ns.relaysmtp(server),
        },
        {
            file: "HTTPWorm.exe",
            run: () => ns.httpworm(server),
        },
        {
            file: "SQLInject.exe",
            run: () => ns.sqlinject(server),
        },
    ];

    for (const tool of tools) {
        if (ns.fileExists(tool.file, "home")) {
            tool.run();
        }
    }
}

/**
 * Chooses a rooted, hackable money server.
 *
 * The score rewards:
 * - more maximum money,
 * - a higher chance to hack,
 * - shorter hacking time.
 *
 * @param {NS} ns
 * @param {string[]} servers
 * @returns {string | null}
 */
function selectTarget(ns, servers) {
    const hackingLevel = ns.getHackingLevel();

    const candidates = servers.filter((server) => {
        return (
            server !== "home" &&
            ns.hasRootAccess(server) &&
            ns.getServerMaxMoney(server) > 0 &&
            ns.getServerRequiredHackingLevel(server) <= hackingLevel
        );
    });

    if (candidates.length === 0) {
        return null;
    }

    candidates.sort((a, b) => {
        const scoreA =
            (ns.getServerMaxMoney(a) * ns.hackAnalyzeChance(a)) /
            ns.getHackTime(a);

        const scoreB =
            (ns.getServerMaxMoney(b) * ns.hackAnalyzeChance(b)) /
            ns.getHackTime(b);

        return scoreB - scoreA;
    });

    return candidates[0];
}