/** @param {NS} ns */
export async function main(ns) {
    const target = ns.args[0] ?? "n00dles";

    while (ns.getServerSecurityLevel(target) > ns.getServerMinSecurityLevel(target)) {
        await ns.weaken(target);
    }

    while (ns.getServerMoneyAvailable(target) > 0) {
        await ns.hack(target);
    }

    ns.tprint(`${target} has been drained.`);
}