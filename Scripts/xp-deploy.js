
/** @param {NS} ns */
export async function main(ns) {
    const WORKER = "xp-worker.js";
    const TARGET = String(ns.args[0] ?? "n00dles");
    const THREADS = Math.floor(Number(ns.args[1] ?? 1000));
    const SERVER_LIMIT = Math.floor(Number(ns.args[2] ?? 25));

    ns.tprint("=== PR0MPTS XP DATACENTER ===");

    if (!ns.fileExists(WORKER, "home")) {
        ns.tprint(`ERROR: ${WORKER} missing on home.`);
        return;
    }

    if (!ns.serverExists(TARGET) || !ns.hasRootAccess(TARGET)) {
        ns.tprint(`ERROR: Invalid or unrooted target: ${TARGET}`);
        return;
    }

    if (!Number.isSafeInteger(THREADS) || THREADS < 1) {
        ns.tprint("ERROR: Thread count must be a positive integer.");
        return;
    }

    if (!Number.isSafeInteger(SERVER_LIMIT) || SERVER_LIMIT < 1) {
        ns.tprint("ERROR: Server limit must be a positive integer.");
        return;
    }

    const servers = ns.cloud.getServerNames()
        .filter(s => s.startsWith("pr0mpts-"))
        .sort()
        .slice(0, SERVER_LIMIT);

    const workerRam = ns.getScriptRam(WORKER, "home");

    if (!(workerRam > 0)) {
        ns.tprint("ERROR: Invalid worker RAM.");
        return;
    }

    let started = 0;
    let alreadyRunning = 0;
    let skipped = 0;
    let totalThreads = 0;

    ns.tprint(`Target: ${TARGET}`);
    ns.tprint(`Requested threads/server: ${THREADS}`);
    ns.tprint(`Selected servers: ${servers.length}`);

    for (const server of servers) {
        if (!ns.hasRootAccess(server)) {
            ns.tprint(`SKIP: ${server} has no root access.`);
            skipped++;
            continue;
        }

        const processes = ns.ps(server);
        const existing = processes.filter(
            p => p.filename === WORKER
        );

        const matching = existing.find(
            p =>
                String(p.args[0]) === TARGET &&
                p.threads === THREADS
        );

        // Preserve existing matching workers.
        if (matching) {
            ns.tprint(`RUNNING: ${server} | ${THREADS} threads`);
            alreadyRunning++;
            totalThreads += THREADS;
            continue;
        }

        // Never terminate or overwrite another XP worker.
        if (existing.length > 0) {
            ns.tprint(
                `SKIP: ${server} has an XP worker with ` +
                `different settings.`
            );
            skipped++;
            continue;
        }

        const availableRam =
            ns.getServerMaxRam(server) -
            ns.getServerUsedRam(server);

        const requiredRam = THREADS * workerRam;

        if (availableRam < requiredRam) {
            ns.tprint(
                `SKIP: ${server} needs ` +
                `${ns.format.ram(requiredRam)}, ` +
                `available ${ns.format.ram(availableRam)}`
            );
            skipped++;
            continue;
        }

        try {
            const copied = await ns.scp(WORKER, server, "home");

            if (!copied) {
                ns.tprint(`ERROR: SCP failed on ${server}`);
                skipped++;
                continue;
            }

            const pid = ns.exec(
                WORKER,
                server,
                THREADS,
                TARGET
            );

            if (pid === 0) {
                ns.tprint(`ERROR: Could not start on ${server}`);
                skipped++;
                continue;
            }

            started++;
            totalThreads += THREADS;

            ns.tprint(
                `ACTIVE: ${server} | ${THREADS} threads | PID ${pid}`
            );
        } catch (error) {
            ns.tprint(`ERROR: ${server} | ${String(error)}`);
            skipped++;
        }
    }

    ns.tprint("=== DEPLOYMENT SUMMARY ===");
    ns.tprint(`New workers started: ${started}`);
    ns.tprint(`Existing workers preserved: ${alreadyRunning}`);
    ns.tprint(`Servers skipped: ${skipped}`);
    ns.tprint(`Total matching XP threads: ${totalThreads}`);
    ns.tprint(`XP target: ${TARGET}`);
}
