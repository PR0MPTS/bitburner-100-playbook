/** @param {NS} ns */
export async function main(ns) {
    const target = String(ns.args[0] ?? "n00dles");

    // Weaken when security rises more than 5 above its minimum.
    const SECURITY_BUFFER = 5;

    // Grow when the server falls below 75% of its maximum money.
    const MONEY_THRESHOLD = 0.75;

    if (!ns.serverExists(target)) {
        ns.tprint(`ERROR: Server "${target}" does not exist.`);
        return;
    }

    const maximumMoney = ns.getServerMaxMoney(target);

    if (maximumMoney <= 0) {
        ns.tprint(`ERROR: Server "${target}" has no money to hack.`);
        return;
    }

    while (true) {
        const currentSecurity = ns.getServerSecurityLevel(target);
        const minimumSecurity = ns.getServerMinSecurityLevel(target);

        const currentMoney = ns.getServerMoneyAvailable(target);

        if (currentSecurity > minimumSecurity + SECURITY_BUFFER) {
            await ns.weaken(target);
        } else if (currentMoney < maximumMoney * MONEY_THRESHOLD) {
            await ns.grow(target);
        } else {
            await ns.hack(target);
        }
    }
}