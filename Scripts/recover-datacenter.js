
/**
 * PR0MPTS - Datacenter Recovery Diagnostics
 * recover-datacenter.js v1.2
 *
 * Bitburner 3.0 Cloud API.
 * READ-ONLY: Never modifies infrastructure.
 *
 * @param {NS} ns
 */
export async function main(ns) {
    const HOME = "home";

    const CONFIG = {
        serverPrefix: "pr0mpts-",
        targetServers: 25,
        targetRam: 1048576,
        threadsPerServer: 1000,
        xpTarget: "n00dles",
        xpWorker: "xp-worker.js",
        xpDeployer: "xp-deploy.js",
        builder: "datacenter-build.js",
        checker: "datacenter-check.js",
        stats: "xp-stats.js",
    };

    const money = ns.getServerMoneyAvailable(HOME);

    const fmtMoney = (value) =>
        "$" + ns.format.number(value);

    const fmtRam = (value) => {
        if (value >= 1048576)
            return ns.format.number(
                value / 1048576
            ) + " PiB";

        if (value >= 1024)
            return ns.format.number(
                value / 1024
            ) + " TiB";

        return ns.format.number(value) + " GB";
    };

    const matchesScript = (filename, name) =>
        filename === name ||
        filename.endsWith("/" + name);

    const section = (title) => {
        ns.tprint("");
        ns.tprint("=== " + title + " ===");
    };

    // Bitburner 3.0 Cloud API.
    const purchased = ns.cloud.getServerNames();
    const purchasedLimit = ns.cloud.getServerLimit();
    const maxRam = ns.cloud.getRamLimit();

    const managed = purchased.filter(name =>
        name.startsWith(CONFIG.serverPrefix)
    );

    const unmanaged = purchased.filter(name =>
        !name.startsWith(CONFIG.serverPrefix)
    );

    const availableSlots = Math.max(
        0, purchasedLimit - purchased.length
    );

    const missingServers = Math.max(
        0, CONFIG.targetServers - managed.length
    );

    const purchasableServers = Math.min(
        missingServers, availableSlots
    );

    const targetRam = Math.min(
        CONFIG.targetRam, maxRam
    );

    let serverCost = null;
    let costError = null;

    if (targetRam >= 2) {
        try {
            serverCost = ns.cloud.getServerCost(targetRam);
        } catch (error) {
            costError = String(error);
        }
    }

    let totalRam = 0;
    let xpProcesses = 0;
    let xpThreads = 0;
    let xpHosts = 0;
    let undersizedServers = 0;
    let missingWorkerFiles = 0;
    let healthyHosts = 0;
    let wrongTargetProcesses = 0;

    for (const server of managed) {
        const ram = ns.getServerMaxRam(server);
        const processes = ns.ps(server);

        totalRam += ram;

        if (ram < CONFIG.targetRam) {
            undersizedServers++;
        }

        const workerPresent = ns.fileExists(
            CONFIG.xpWorker, server
        );

        if (!workerPresent) {
            missingWorkerFiles++;
        }

        let serverThreads = 0;
        let correctTargetThreads = 0;

        for (const process of processes) {
            if (!matchesScript(
                process.filename,
                CONFIG.xpWorker
            )) continue;

            xpProcesses++;
            xpThreads += process.threads;
            serverThreads += process.threads;

            if (
                process.args.length > 0 &&
                String(process.args[0]) !==
                    CONFIG.xpTarget
            ) {
                wrongTargetProcesses++;
            } else {
                correctTargetThreads +=
                    process.threads;
            }
        }

        if (serverThreads > 0) {
            xpHosts++;
        }

        if (
            ram >= CONFIG.targetRam &&
            correctTargetThreads >=
                CONFIG.threadsPerServer &&
            workerPresent
        ) {
            healthyHosts++;
        }
    }

    const expectedThreads =
        CONFIG.targetServers *
        CONFIG.threadsPerServer;

    const missingThreads = Math.max(
        0, expectedThreads - xpThreads
    );

    const estimatedCost = serverCost === null
        ? null
        : purchasableServers * serverCost;

    ns.tprint("");
    ns.tprint("======================================");
    ns.tprint(" PR0MPTS DATACENTER RECOVERY - v1.2");
    ns.tprint(" READ-ONLY / BITBURNER 3.0");
    ns.tprint("======================================");

    section("DATACENTER CONFIGURATION");

    ns.tprint(
        "Target servers: " + CONFIG.targetServers
    );

    ns.tprint(
        "Target RAM/server: " +
        fmtRam(CONFIG.targetRam)
    );

    ns.tprint(
        "XP target: " + CONFIG.xpTarget
    );

    ns.tprint(
        "Target threads/server: " +
        CONFIG.threadsPerServer
    );

    section("PURCHASED SERVER CAPACITY");

    ns.tprint(
        "Purchased server limit: " +
        purchasedLimit
    );

    ns.tprint(
        "Current purchased servers: " +
        purchased.length
    );

    ns.tprint(
        "Managed PR0MPTS servers: " +
        managed.length
    );

    ns.tprint(
        "Other purchased servers: " +
        unmanaged.length
    );

    ns.tprint(
        "Available server slots: " +
        availableSlots
    );

    ns.tprint(
        "Maximum server RAM: " +
        fmtRam(maxRam)
    );

    section("CURRENT DATACENTER");

    ns.tprint(
        "Managed datacenter RAM: " +
        fmtRam(totalRam)
    );

    ns.tprint(
        "Servers below target RAM: " +
        undersizedServers
    );

    ns.tprint(
        "Servers missing XP worker: " +
        missingWorkerFiles
    );

    ns.tprint(
        "XP worker processes: " +
        xpProcesses
    );

    ns.tprint(
        "XP worker hosts: " +
        xpHosts
    );

    ns.tprint(
        "XP worker threads: " +
        xpThreads
    );

    ns.tprint(
        "Expected XP threads: " +
        expectedThreads
    );

    ns.tprint(
        "Thread shortfall: " +
        missingThreads
    );

    ns.tprint(
        "Fully configured XP hosts: " +
        healthyHosts + "/" +
        CONFIG.targetServers
    );

    if (wrongTargetProcesses > 0) {
        ns.tprint(
            "[WARN] Workers with unexpected targets: " +
            wrongTargetProcesses
        );
    }

    section("REBUILD ESTIMATE");

    ns.tprint(
        "Missing managed servers: " +
        missingServers
    );

    ns.tprint(
        "New servers possible: " +
        purchasableServers
    );

    if (serverCost !== null) {
        ns.tprint(
            "Cost per new server: " +
            fmtMoney(serverCost)
        );

        ns.tprint(
            "Estimated new-server cost: " +
            fmtMoney(estimatedCost)
        );

        ns.tprint(
            "Can afford estimated cost: " +
            (money >= estimatedCost
                ? "YES" : "NO")
        );
    } else {
        ns.tprint(
            "Server cost estimate: UNAVAILABLE"
        );

        if (costError !== null) {
            ns.tprint(
                "[WARN] " + costError
            );
        }
    }

    ns.tprint(
        "Available cash: " +
        fmtMoney(money)
    );

    if (maxRam < CONFIG.targetRam) {
        ns.tprint(
            "[WARN] Current RAM limit is below target. " +
            "Estimate uses available maximum."
        );
    }

    section("RECOVERY SCRIPT AVAILABILITY");

    for (const script of [
        CONFIG.xpWorker,
        CONFIG.xpDeployer,
        CONFIG.builder,
        CONFIG.checker,
        CONFIG.stats,
    ]) {
        ns.tprint(
            (ns.fileExists(script, HOME)
                ? "[OK] " : "[--] ") +
            script
        );
    }

    section("RECOVERY ASSESSMENT");

    if (managed.length >= CONFIG.targetServers) {
        ns.tprint(
            "[OK] Target server count reached."
        );
    } else {
        ns.tprint(
            "[ACTION] More managed servers required."
        );
    }

    if (
        managed.length > 0 &&
        undersizedServers === 0
    ) {
        ns.tprint(
            "[OK] Existing servers meet RAM target."
        );
    } else if (undersizedServers > 0) {
        ns.tprint(
            "[ACTION] RAM upgrades required."
        );
    }

    if (
        xpThreads >= expectedThreads &&
        healthyHosts >= CONFIG.targetServers
    ) {
        ns.tprint(
            "[OK] XP deployment meets target."
        );
    } else {
        ns.tprint(
            "[ACTION] XP deployment needs attention."
        );
    }

    if (unmanaged.length > 0) {
        ns.tprint(
            "[INFO] Unmanaged purchased servers detected."
        );
    }

    section("RECOVERY GUIDANCE");

    ns.tprint(
        "Inspect: run datacenter-check.js"
    );

    ns.tprint(
        "Build: run datacenter-build.js"
    );

    ns.tprint(
        "Deploy: run xp-deploy.js " +
        CONFIG.xpTarget + " " +
        CONFIG.threadsPerServer + " " +
        CONFIG.targetServers
    );

    ns.tprint(
        "Monitor: run xp-stats.js"
    );

    ns.tprint("");
    ns.tprint(
        "No changes made. Diagnostic complete."
    );
}
