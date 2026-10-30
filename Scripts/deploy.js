
/** @param {NS} ns */
export async function main(ns) {
    const HOME = "home";
    const WORKER = "worker.js";

    const servers = scanNetwork(ns, HOME);
    const purchased = new Set(ns.cloud.getServerNames());

    ns.tprint(`Discovered ${servers.length} servers.`);
    ns.tprint(`Reserved XP servers: ${purchased.size}`);

    let rootedCount = 0;

    // Root accessible network servers.
    for (const server of servers) {
        if (server === HOME || purchased.has(server)) continue;

        if (!ns.hasRootAccess(server)) {
            const openedPorts = openPorts(ns, server);
            const requiredPorts =
                ns.getServerNumPortsRequired(server);

            if (openedPorts >= requiredPorts) {
                try {
                    ns.nuke(server);
                } catch {
                    ns.tprint(`Failed to root ${server}.`);
                }
            }
        }

        if (ns.hasRootAccess(server)) {
            rootedCount++;
        }
    }

    const requestedTarget = String(ns.args[0] ?? "");
    let target;

    if (requestedTarget !== "") {
        if (!servers.includes(requestedTarget)) {
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
            ns.tprint(`ERROR: Insufficient hacking level.`);
            return;
        }

        if (ns.getServerMaxMoney(requestedTarget) <= 0) {
            ns.tprint(`ERROR: Target has no money.`);
            return;
        }

        target = requestedTarget;
    } else {
        target = selectTarget(ns, servers);

        if (!target) {
            ns.tprint("ERROR: No suitable hacking target.");
            return;
        }
    }

    ns.tprint(`Hacking target: ${target}`);

    let deployedHosts = 0;
    let totalThreads = 0;

    for (const server of servers) {
        if (server === HOME) continue;
        if (purchased.has(server)) continue;
        if (!ns.hasRootAccess(server)) continue;

        ns.scriptKill(WORKER, server);

        const copied = await ns.scp(WORKER, server, HOME);

        if (!copied) {
            ns.tprint(`Failed to copy worker to ${server}.`);
            continue;
        }

        const maxRam = ns.getServerMaxRam(server);
        const usedRam = ns.getServerUsedRam(server);
        const workerRam = ns.getScriptRam(WORKER, server);

        if (workerRam <= 0) continue;

        const availableRam = maxRam - usedRam;
        const threads = Math.floor(availableRam / workerRam);

        if (threads <= 0) continue;

        const pid = ns.exec(WORKER, server, threads, target);

        if (pid === 0) {
            ns.tprint(`Failed to start worker on ${server}.`);
            continue;
        }

        deployedHosts++;
        totalThreads += threads;

        ns.tprint(
            `ACTIVE: ${server} | ${threads} threads | ${target}`
        );
    }

    ns.tprint("=== DEPLOYMENT COMPLETE ===");
    ns.tprint(`Network servers discovered: ${servers.length}`);
    ns.tprint(`Rooted network servers: ${rootedCount}`);
    ns.tprint(`Money worker hosts: ${deployedHosts}`);
    ns.tprint(`Money worker threads: ${totalThreads}`);
    ns.tprint(`Reserved XP servers: ${purchased.size}`);
    ns.tprint(`Money target: ${target}`);
}

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

function openPorts(ns, server) {
    const tools = [
        ["BruteSSH.exe", () => ns.brutessh(server)],
        ["FTPCrack.exe", () => ns.ftpcrack(server)],
        ["relaySMTP.exe", () => ns.relaysmtp(server)],
        ["HTTPWorm.exe", () => ns.httpworm(server)],
        ["SQLInject.exe", () => ns.sqlinject(server)],
    ];

    let opened = 0;

    for (const [file, action] of tools) {
        if (!ns.fileExists(file, "home")) continue;

        try {
            action();
            opened++;
        } catch {
            // Ignore failed port-opening attempts.
        }
    }

    return opened;
}

function selectTarget(ns, servers) {
    const hackingLevel = ns.getHackingLevel();

    const candidates = servers.filter(server =>
        server !== "home" &&
        ns.hasRootAccess(server) &&
        ns.getServerMaxMoney(server) > 0 &&
        ns.getServerRequiredHackingLevel(server) <= hackingLevel
    );

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => {
        const scoreA =
            ns.getServerMaxMoney(a) *
            ns.hackAnalyzeChance(a) /
            ns.getHackTime(a);

        const scoreB =
            ns.getServerMaxMoney(b) *
            ns.hackAnalyzeChance(b) /
            ns.getHackTime(b);

        return scoreB - scoreA;
    });

    return candidates[0];
}
