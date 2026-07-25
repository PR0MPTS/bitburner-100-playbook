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

    const minSecurity = ns.getServerMinSecurityLevel(target);
    const maxMoney = ns.getServerMaxMoney(target);

    if (maxMoney <= 0) {
        ns.tprint(`ERROR: Server "${target}" has no money to recover.`);
        return;
    }

    ns.tprint(`Recovering ${target}...`);

    // Restore minimum security.
    while (ns.getServerSecurityLevel(target) > minSecurity + SECURITY_BUFFER) {
        await ns.weaken(target);
    }

    // Restore maximum money while keeping security under control.
    while (ns.getServerMoneyAvailable(target) < maxMoney) {
        await ns.grow(target);

        while (ns.getServerSecurityLevel(target) > minSecurity + SECURITY_BUFFER) {
            await ns.weaken(target);
        }
    }

    ns.tprint(`${target} fully recovered.`);
}