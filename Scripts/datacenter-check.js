
/** @param {NS} ns */
export async function main(ns) {
    const cloud = ns.cloud;

    const limit = cloud.getServerLimit();
    const maxRam = cloud.getRamLimit();
    const owned = cloud.getServerNames();
    const cost = cloud.getServerCost(maxRam);
    const cash = ns.getServerMoneyAvailable("home");

    ns.tprint("=== PR0MPTS DATACENTER ===");
    ns.tprint(`Servers: ${owned.length}/${limit}`);
    ns.tprint(`Maximum RAM: ${ns.format.ram(maxRam)}`);
    ns.tprint(
        `Cost per max server: $${ns.format.number(cost)}`
    );
    ns.tprint(
        `Available cash: $${ns.format.number(cash)}`
    );

    ns.tprint("=== EXISTING SERVERS ===");

    for (const server of owned) {
        const ram = ns.getServerMaxRam(server);
        const used = ns.getServerUsedRam(server);

        ns.tprint(
            `${server}: ${ns.format.ram(ram)} ` +
            `(Used: ${ns.format.ram(used)})`
        );
    }

    const remaining = limit - owned.length;

    ns.tprint("=== EXPANSION ESTIMATE ===");
    ns.tprint(`Available slots: ${remaining}`);
    ns.tprint(
        `Cost to fill empty slots at max RAM: ` +
        `$${ns.format.number(remaining * cost)}`
    );
}
