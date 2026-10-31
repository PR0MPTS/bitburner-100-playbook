
/**
 * PR0MPTS - Economy Recovery Diagnostics
 * recover-economy.js v1.1
 *
 * Bitburner 3.0 compatible.
 * READ-ONLY: No purchases, restarts or deployments.
 *
 * @param {NS} ns
 */
export async function main(ns) {
    const HOME = "home";
    const TRADER = "stock-trader.js";
    const DEPLOY = "deploy.js";
    const WORKER = "worker.js";

    const PORT_PROGRAMS = [
        "BruteSSH.exe",
        "FTPCrack.exe",
        "relaySMTP.exe",
        "HTTPWorm.exe",
        "SQLInject.exe",
    ];

    const CASH_RESERVE = 100e9;
    const MIN_TRADE = 1e9;
    const MAX_POSITION_FRACTION = 0.10;

    const money = ns.getServerMoneyAvailable(HOME);
    const player = ns.getPlayer();

    const fmtMoney = (value) =>
        "$" + ns.format.number(value);

    const yesNo = (value) => value ? "YES" : "NO";

    const section = (title) => {
        ns.tprint("");
        ns.tprint("=== " + title + " ===");
    };

    const matchesScript = (filename, name) =>
        filename === name ||
        filename.endsWith("/" + name);

    const homeProcesses = ns.ps(HOME);

    const isRunning = (name) =>
        homeProcesses.some((p) =>
            matchesScript(p.filename, name)
        );

    // Independent stock checks.
    // A failed check does not invalidate the others.
    const checkStock = (label, check) => {
        try {
            const result = Boolean(check());

            ns.tprint(
                (result ? "[OK] " : "[--] ") +
                label + ": " + yesNo(result)
            );

            return result;
        } catch (error) {
            ns.tprint(
                "[WARN] " + label +
                ": Unable to check - " + String(error)
            );
            return null;
        }
    };

    ns.tprint("");
    ns.tprint("======================================");
    ns.tprint(" PR0MPTS ECONOMY RECOVERY - v1.1");
    ns.tprint(" READ-ONLY / BITBURNER 3.0");
    ns.tprint("======================================");

    section("PLAYER STATUS");

    ns.tprint(
        "Hacking level: " + player.skills.hacking
    );

    ns.tprint(
        "Available cash: " + fmtMoney(money)
    );

    section("NETWORK RECOVERY");

    let programsAvailable = 0;

    for (const program of PORT_PROGRAMS) {
        const available = ns.fileExists(program, HOME);

        if (available) programsAvailable++;

        ns.tprint(
            (available ? "[OK] " : "[--] ") + program
        );
    }

    ns.tprint(
        "Port programs: " +
        programsAvailable + "/" + PORT_PROGRAMS.length
    );

    const deployPresent = ns.fileExists(DEPLOY, HOME);

    ns.tprint(
        "deploy.js present: " + yesNo(deployPresent)
    );

    section("HACKING NETWORK");

    const purchased = new Set(
        ns.cloud.getServerNames()
    );

    const visited = new Set([HOME]);
    const queue = [HOME];

    let publicServers = 0;
    let rootedPublic = 0;
    let workerProcesses = 0;
    let workerThreads = 0;

    for (let i = 0; i < queue.length; i++) {
        const server = queue[i];

        for (const neighbor of ns.scan(server)) {
            if (visited.has(neighbor)) continue;

            visited.add(neighbor);
            queue.push(neighbor);
        }

        if (server === HOME || purchased.has(server)) {
            continue;
        }

        publicServers++;

        if (ns.hasRootAccess(server)) {
            rootedPublic++;
        }

        for (const process of ns.ps(server)) {
            if (!matchesScript(
                process.filename, WORKER
            )) continue;

            workerProcesses++;
            workerThreads += process.threads;
        }
    }

    ns.tprint(
        "Public servers discovered: " + publicServers
    );

    ns.tprint(
        "Rooted public servers: " + rootedPublic
    );

    ns.tprint(
        "Active money-worker processes: " +
        workerProcesses
    );

    ns.tprint(
        "Active money-worker threads: " +
        workerThreads
    );

    ns.tprint(
        "Purchased servers excluded: " +
        purchased.size
    );

    section("STOCK MARKET");

    const wse = checkStock(
        "WSE account",
        () => ns.stock.hasWseAccount()
    );

    const tix = checkStock(
        "TIX API",
        () => ns.stock.hasTixApiAccess()
    );

    const fourS = checkStock(
        "4S market data",
        () => ns.stock.has4SData()
    );

    const fourSApi = checkStock(
        "4S API",
        () => ns.stock.has4SDataTixApi()
    );

    const stockReady =
        tix === true && fourSApi === true;

    const stockUnknown =
        tix === null || fourSApi === null;

    section("AUTONOMOUS TRADER");

    const traderPresent = ns.fileExists(
        TRADER, HOME
    );

    const traderRunning = isRunning(TRADER);

    ns.tprint(
        "Trader script present: " +
        yesNo(traderPresent)
    );

    ns.tprint(
        "Trader running on Home: " +
        yesNo(traderRunning)
    );

    ns.tprint(
        "Configured cash reserve: " +
        fmtMoney(CASH_RESERVE)
    );

    ns.tprint(
        "Minimum trade value: " +
        fmtMoney(MIN_TRADE)
    );

    const deployableCash = Math.max(
        0, money - CASH_RESERVE
    );

    const maxNewPosition =
        deployableCash * MAX_POSITION_FRACTION;

    const capitalReady =
        maxNewPosition >= MIN_TRADE;

    ns.tprint(
        "Estimated maximum new position: " +
        fmtMoney(maxNewPosition)
    );

    ns.tprint(
        "Capital meets position-size threshold: " +
        yesNo(capitalReady)
    );

    section("RECOVERY ASSESSMENT");

    if (!deployPresent) {
        ns.tprint(
            "[ACTION] Restore deploy.js on Home."
        );
    } else if (workerThreads === 0) {
        ns.tprint(
            "[ACTION] No money workers detected. " +
            "Review deploy.js."
        );
    } else {
        ns.tprint(
            "[OK] Distributed hacking is active."
        );
    }

    if (stockReady) {
        ns.tprint(
            "[OK] Required scripted stock APIs available."
        );
    } else if (stockUnknown) {
        ns.tprint(
            "[WARN] Stock API readiness could not " +
            "be fully determined."
        );
    } else {
        ns.tprint(
            "[ACTION] Restore TIX and/or 4S API access."
        );
    }

    if (!traderPresent) {
        ns.tprint(
            "[ACTION] Restore stock-trader.js."
        );
    } else if (!traderRunning) {
        ns.tprint(
            "[ACTION] Trader is not running on Home."
        );
    } else {
        ns.tprint(
            "[OK] Stock trader is running on Home."
        );
    }

    if (!capitalReady) {
        ns.tprint(
            "[INFO] Rebuild trading capital. " +
            "Position sizing is below the minimum."
        );
    } else {
        ns.tprint(
            "[OK] Capital supports a new minimum-size trade."
        );
    }

    section("RECOVERY COMMANDS");

    ns.tprint(
        "Money network: run deploy.js"
    );

    ns.tprint(
        "Stock trader: run stock-trader.js"
    );

    ns.tprint(
        "Only run recovery commands when needed."
    );

    ns.tprint("");
    ns.tprint(
        "No changes made. Diagnostic complete."
    );
}
