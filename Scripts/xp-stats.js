
/** @param {NS} ns */
export async function main(ns) {
    const servers = ns.cloud.getServerNames();
    const worker = "xp-worker.js";

    let active = 0;
    let threads = 0;
    let ramUsed = 0;
    let ramTotal = 0;

    for (const server of servers) {
        ramUsed += ns.getServerUsedRam(server);
        ramTotal += ns.getServerMaxRam(server);

        const processes = ns.ps(server);

        for (const process of processes) {
            if (process.filename !== worker) continue;

            active++;
            threads += process.threads;
        }
    }

    const player = ns.getPlayer();

    ns.tprint("=== PR0MPTS XP FARM STATUS ===");
    ns.tprint(`Purchased servers: ${servers.length}`);
    ns.tprint(`XP worker processes: ${active}`);
    ns.tprint(`Total XP threads: ${threads.toLocaleString()}`);
    ns.tprint(`RAM used: ${ns.format.ram(ramUsed)}`);
    ns.tprint(`RAM available: ${ns.format.ram(ramTotal - ramUsed)}`);
    ns.tprint(`Hacking level: ${player.skills.hacking}`);
    ns.tprint(`Hacking XP: ${ns.format.number(player.exp.hacking)}`);
}
