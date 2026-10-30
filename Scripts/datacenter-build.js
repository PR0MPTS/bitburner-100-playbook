
/** @param {NS} ns */
export async function main(ns) {
    const cloud = ns.cloud;

    const limit = cloud.getServerLimit();
    const maxRam = cloud.getRamLimit();
    const cost = cloud.getServerCost(maxRam);

    ns.tprint("=== PR0MPTS DATACENTER BUILD ===");

    let purchased = 0;
    let spent = 0;

    for (let i = 0; i < limit; i++) {
        const name = `pr0mpts-${String(i + 1).padStart(2, "0")}`;

        // Never replace an existing server.
        if (ns.serverExists(name)) {
            ns.tprint(`SKIP: ${name} already exists`);
            continue;
        }

        if (cloud.getServerNames().length >= limit) {
            ns.tprint("Server capacity reached.");
            break;
        }

        const cash = ns.getServerMoneyAvailable("home");

        if (cash < cost) {
            ns.tprint(`Insufficient funds for ${name}`);
            break;
        }

        try {
            const result = cloud.purchaseServer(name, maxRam);

            if (result) {
                purchased++;
                spent += cost;
                ns.tprint(
                    `PURCHASED: ${name} | ${ns.format.ram(maxRam)}`
                );
            } else {
                ns.tprint(`FAILED: ${name}`);
            }
        } catch (error) {
            ns.tprint(`ERROR: ${name} | ${String(error)}`);
            break;
        }
    }

    const owned = cloud.getServerNames();

    ns.tprint("=== BUILD SUMMARY ===");
    ns.tprint(`Purchased: ${purchased}`);
    ns.tprint(`Total owned: ${owned.length}/${limit}`);
    ns.tprint(`Estimated spent: $${ns.format.number(spent)}`);
    ns.tprint(
        `Remaining cash: $${ns.format.number(
            ns.getServerMoneyAvailable("home")
        )}`
    );
}
