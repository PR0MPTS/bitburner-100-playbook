/** @param {NS} ns */
export async function main(ns) {
    const symbols = ns.stock.getSymbols();

    const stocks = symbols.map(sym => {
        const ask = ns.stock.getAskPrice(sym);
        const forecast = ns.stock.getForecast(sym);
        const volatility = ns.stock.getVolatility(sym);
        const position = ns.stock.getPosition(sym);

        const longShares = position[0];
        const shortShares = position[2];

        const score = Math.abs(forecast - 0.5) * volatility;

        let action = "WATCH";

        // Existing long position
        if (longShares > 0) {
            if (forecast < 0.50) {
                action = "EXIT";
            } else {
                action = "HOLD";
            }

        // Existing short position
        } else if (shortShares > 0) {
            if (forecast > 0.50) {
                action = "EXIT";
            } else {
                action = "HOLD";
            }

        // No position - strong bullish signal
        } else if (forecast >= 0.60) {
            action = "BUY";

        // No position - strong bearish signal
        } else if (forecast <= 0.40) {
            action = "SHORT";
        }

        return {
            sym,
            ask,
            forecast,
            volatility,
            score,
            action,
            longShares,
            shortShares
        };
    });

    stocks.sort((a, b) => b.score - a.score);

    ns.tprintf("=== PR0MPTS MARKET SCANNER v4 ===");
    ns.tprintf(
        "%-5s %-7s %14s %9s %8s %9s %12s",
        "SYM",
        "ACTION",
        "ASK",
        "FORECAST",
        "VOL",
        "SCORE",
        "POSITION"
    );

    ns.tprintf("-".repeat(82));

    for (const s of stocks) {
        let position = "-";

        if (s.longShares > 0) {
            position = "L:" + ns.format.number(s.longShares, 2);
        } else if (s.shortShares > 0) {
            position = "S:" + ns.format.number(s.shortShares, 2);
        }

        ns.tprintf(
            "%-5s %-7s %14s %8.2f%% %7.2f%% %9.4f %12s",
            s.sym,
            s.action,
            formatPrice(s.ask),
            s.forecast * 100,
            s.volatility * 100,
            s.score * 10000,
            position
        );
    }

    function formatPrice(price) {
        if (price < 0.01) {
            return "$" + price.toExponential(4);
        }

        if (price < 1000) {
            return "$" + price.toFixed(3);
        }

        return "$" + ns.format.number(price, 3);
    }
}