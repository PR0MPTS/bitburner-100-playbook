/** @param {NS} ns */
export async function main(ns) {
    const target = ns.args[0];

    if (!target) {
        ns.tprint("Usage: run route.js <server>");
        return;
    }

    const queue = ["home"];
    const parent = { home: null };

    while (queue.length > 0) {
        const server = queue.shift();

        if (server === target) {
            const path = [];
            let current = target;

            while (current !== null) {
                path.unshift(current);
                current = parent[current];
            }

            ns.tprint(`Route to ${target}:`);
            ns.tprint(path.join(" -> "));

            ns.tprint("\nCommands:");
            for (const host of path.slice(1)) {
                ns.tprint(`connect ${host}`);
            }
            ns.tprint("backdoor");

            return;
        }

        for (const neighbour of ns.scan(server)) {
            if (!(neighbour in parent)) {
                parent[neighbour] = server;
                queue.push(neighbour);
            }
        }
    }

    ns.tprint(`Could not find ${target}.`);
}