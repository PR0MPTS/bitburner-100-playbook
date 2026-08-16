/** @param {NS} ns */
export async function main(ns) {
    const info = ns.getResetInfo();

    ns.tprint("=== OWNED AUGMENTATIONS ===");

    for (const [name, level] of info.ownedAugs) {
        if (level > 1) {
            ns.tprint(`${name} - Level ${level}`);
        } else {
            ns.tprint(name);
        }
    }
}