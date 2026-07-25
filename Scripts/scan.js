/** @param {NS} ns */
export async function main(ns) {
    const server = ns.getHostname();
    const neighbours = ns.scan(server).sort();

    const hackingLevel = ns.getHackingLevel();
    const availableOpeners = countPortOpeners(ns);

    ns.tprint("----- Local Network Scan -----");
    ns.tprint(`Connected to: ${server}`);
    ns.tprint(`Hacking level: ${hackingLevel}`);
    ns.tprint(`Port openers available: ${availableOpeners}`);
    ns.tprint(`Connected servers: ${neighbours.length}`);
    ns.tprint("------------------------------");

    for (const neighbour of neighbours) {
        const requiredLevel =
            ns.getServerRequiredHackingLevel(neighbour);

        const requiredPorts =
            ns.getServerNumPortsRequired(neighbour);

        const hasRoot =
            ns.hasRootAccess(neighbour);

        const hasBackdoor =
            ns.getServer(neighbour).backdoorInstalled;

        const currentMoney =
            ns.getServerMoneyAvailable(neighbour);

        const maxMoney =
            ns.getServerMaxMoney(neighbour);

        const maxRam =
            ns.getServerMaxRam(neighbour);

        const canHack =
            hackingLevel >= requiredLevel;

        const canRoot =
            availableOpeners >= requiredPorts;

        let rootStatus;

        if (hasRoot) {
            rootStatus = "ROOTED";
        } else if (canRoot) {
            rootStatus = "ROOTABLE NOW";
        } else {
            rootStatus = "LOCKED";
        }

        const moneyStatus =
            maxMoney > 0
                ? `$${ns.format.number(currentMoney)} / $${ns.format.number(maxMoney)}`
                : "No money";

        ns.tprint(
            `${neighbour} | ` +
            `Hack: ${requiredLevel} ${canHack ? "(OK)" : "(LOW)"} | ` +
            `Ports: ${requiredPorts}/${availableOpeners} | ` +
            `Status: ${rootStatus} | ` +
            `Backdoor: ${hasBackdoor ? "YES" : "NO"} | ` +
            `RAM: ${ns.format.ram(maxRam)} | ` +
            `Money: ${moneyStatus}`
        );
    }
}

/**
 * Counts the port-opening programs currently available on home.
 *
 * @param {NS} ns
 * @returns {number}
 */
function countPortOpeners(ns) {
    const programs = [
        "BruteSSH.exe",
        "FTPCrack.exe",
        "relaySMTP.exe",
        "HTTPWorm.exe",
        "SQLInject.exe",
    ];

    return programs.filter((program) =>
        ns.fileExists(program, "home")
    ).length;
}