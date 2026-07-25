/** @param {NS} ns */
export async function main(ns) {
    // target n00dles server
    const target = ns.args[0] ?? "n00dles";
    // get the minimum security level and maximum money for the target server
    const minSecurity = ns.getServerMinSecurityLevel(target);
    const maxMoney = ns.getServerMaxMoney(target);

    ns.tprint(`Recovering ${target}...`);
    // while the target server's security level is above the minimum, weaken it
    while (ns.getServerSecurityLevel(target) > minSecurity) {
        await ns.weaken(target);
    }
    // while the target server's money is below the maximum, grow it
    while (ns.getServerMoneyAvailable(target) < maxMoney) {
        await ns.grow(target);
        // if the target server's security level is above the minimum, weaken it
        if (ns.getServerSecurityLevel(target) > minSecurity) {
            await ns.weaken(target);
        }
    }

    ns.tprint(`${target} recovered: minimum security and maximum money.`);
}