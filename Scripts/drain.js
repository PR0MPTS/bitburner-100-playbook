/** @param {NS} ns */
export async function main(ns) {
    const target = String(ns.args[0] ?? "n00dles");
    const SECURITY_BUFFER = 5;

    if (!ns.serverExists(target)) {
        ns.tprint(`ERROR: Server "${target}" does not exist.`);
        return;
    }

    if (!ns.hasRootAccess(target)) {
        ns.tprint(`ERROR: No root access on "${target}".`);
        return;
    }

    if (ns.getServerMaxMoney(target) <= 0) {
        ns.tprint(`ERROR: Server "${target}" has no money to drain.`);
        return;
    }

    ns.tprint(`Draining ${target}...`);

    while (ns.getServerMoneyAvailable(target) > 0) {
        const currentSecurity = ns.getServerSecurityLevel(target);
        const minimumSecurity = ns.getServerMinSecurityLevel(target);

        if (currentSecurity > minimumSecurity + SECURITY_BUFFER) {
            await ns.weaken(target);
        } else {
            await ns.hack(target);
        }
    }

    ns.tprint(`${target} has been completely drained.`);
}