
/** @param {NS} ns */
export async function main(ns) {
    const target = String(ns.args[0] ?? "n00dles");

    if (!ns.serverExists(target)) {
        ns.tprint(`ERROR: Unknown target ${target}`);
        return;
    }

    if (!ns.hasRootAccess(target)) {
        ns.tprint(`ERROR: No root access on ${target}`);
        return;
    }

    while (true) {
        await ns.weaken(target);
    }
}
