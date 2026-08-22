/** @param {NS} ns */
// ============================================================
// DEPRECATED FOR NORMAL USE
//
// stock-watch.js was developed during Session 14/15 as a
// diagnostic tool for observing 4S market forecasts, rolling
// history, sustained long/short signals, and open positions.
//
// It has been superseded for normal gameplay by stock-trader.js,
// which autonomously handles stock selection, buying, selling,
// position sizing, cash reserves, and persistent profit tracking.
//
// This script remains useful for debugging, market analysis, and tuning
// future versions of the autonomous trader.
//
// Normal operation:
//   stock-trader.js  -> autonomous production trading
//   stock-watch.js   -> optional diagnostic/analysis tool
// ============================================================
export async function main(ns) {
    ns.disableLog("ALL");

    const history = {};
    const HISTORY_LENGTH = 24;   // 24 samples
    const SAMPLE_MS = 5000;      // every 5 sec = 2 minutes of history

    while (true) {
        const symbols = ns.stock.getSymbols();

        const stocks = symbols.map(sym => {
            const forecast = ns.stock.getForecast(sym);
            const volatility = ns.stock.getVolatility(sym);
            const position = ns.stock.getPosition(sym);

            if (!history[sym]) {
                history[sym] = [];
            }

            history[sym].push(forecast);

            if (history[sym].length > HISTORY_LENGTH) {
                history[sym].shift();
            }

            const samples = history[sym];

            const avgForecast =
                samples.reduce((sum, value) => sum + value, 0) /
                samples.length;

            const bullishSamples =
                samples.filter(value => value >= 0.60).length;

            const bearishSamples =
                samples.filter(value => value <= 0.40).length;

            const bullishPct =
                bullishSamples / samples.length;

            const bearishPct =
                bearishSamples / samples.length;

            const score =
                Math.abs(avgForecast - 0.5) * volatility;

            return {
                sym,
                forecast,
                avgForecast,
                volatility,
                score,
                bullishPct,
                bearishPct,
                samples: samples.length,
                longShares: position[0],
                shortShares: position[2]
            };
        });

        const longs = stocks
            .filter(s =>
                s.avgForecast >= 0.60 &&
                s.bullishPct >= 0.75
            )
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        const shorts = stocks
            .filter(s =>
                s.avgForecast <= 0.40 &&
                s.bearishPct >= 0.75
            )
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        ns.clearLog();

        ns.print("=== PR0MPTS MARKET WATCH v2 ===");
        ns.print("Updated: " + new Date().toLocaleTimeString());
        ns.print(
            "History: " +
            Math.min(HISTORY_LENGTH, stocks[0]?.samples ?? 0) +
            "/" +
            HISTORY_LENGTH +
            " samples"
        );

        ns.print("");
        ns.print("--- SUSTAINED LONGS ---");

        if (longs.length === 0) {
            ns.print("No sustained bullish signals.");
        }

        for (const s of longs) {
            ns.printf(
                "%-5s Now:%6.2f%% Avg:%6.2f%% Bull:%5.1f%% Vol:%5.2f%%",
                s.sym,
                s.forecast * 100,
                s.avgForecast * 100,
                s.bullishPct * 100,
                s.volatility * 100
            );
        }

        ns.print("");
        ns.print("--- SUSTAINED SHORTS ---");

        if (shorts.length === 0) {
            ns.print("No sustained bearish signals.");
        }

        for (const s of shorts) {
            ns.printf(
                "%-5s Now:%6.2f%% Avg:%6.2f%% Bear:%5.1f%% Vol:%5.2f%%",
                s.sym,
                s.forecast * 100,
                s.avgForecast * 100,
                s.bearishPct * 100,
                s.volatility * 100
            );
        }

        ns.print("");
        ns.print("--- OUR POSITIONS ---");

        const owned = stocks.filter(
            s => s.longShares > 0 || s.shortShares > 0
        );

        if (owned.length === 0) {
            ns.print("No open positions.");
        }

        for (const s of owned) {
            const type =
                s.longShares > 0 ? "LONG" : "SHORT";

            const shares =
                s.longShares > 0
                    ? s.longShares
                    : s.shortShares;

            ns.printf(
                "%-5s %-5s %9s Now:%6.2f%% Avg:%6.2f%%",
                s.sym,
                type,
                ns.format.number(shares, 2),
                s.forecast * 100,
                s.avgForecast * 100
            );
        }

        await ns.sleep(SAMPLE_MS);
    }
}