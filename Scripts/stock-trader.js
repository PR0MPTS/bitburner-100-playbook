/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("ALL");

    // ============================================================
    // PR0MPTS AUTONOMOUS STOCK TRADER v2
    //
    // Features:
    // - Autonomous long trading using 4S forecast data
    // - Automatic position sizing
    // - $100b protected cash reserve
    // - Automatic exit when forecast falls below 50%
    // - Persistent realised profit/loss tracking
    // - Win/loss tracking
    // - Unrealised profit/loss tracking
    // - Total stock-market P/L
    // - Human-readable company names
    // ============================================================

    const VERSION = "v2";

    const CHECK_INTERVAL = 5000;

    const BUY_FORECAST = 0.65;
    const SELL_FORECAST = 0.50;

    const MIN_CASH_RESERVE = 100e9;
    const MAX_POSITION_FRACTION = 0.10;
    const MIN_TRADE_VALUE = 1e9;

    const COMMISSION = 100_000;

    const STATS_FILE = "stock-trader-stats.txt";

    // ------------------------------------------------------------
    // COMPANY NAMES
    // ------------------------------------------------------------

    const COMPANY_NAMES = {
        ECP: "ECorp",
        MGCP: "MegaCorp",
        BLD: "Blade Industries",
        CLRK: "Clarke Incorporated",
        OMN: "Omnia Cybersystems",
        FSIG: "Four Sigma",
        KGI: "KuaiGong International",
        FLCM: "Fulcrum Technologies",
        STM: "Storm Technologies",
        DCOMM: "DefComm",
        HLS: "Helios Labs",
        VITA: "VitaLife",
        ICRS: "Icarus Microsystems",
        UNV: "Universal Energy",
        AERO: "AeroCorp",
        OMGA: "Omega Software",
        FNS: "FoodNStuff",
        SGC: "Sigma Cosmetics",
        JGN: "Joe's Guns",
        CTYS: "Catalyst Ventures",
        MDYN: "Microdyne Technologies",
        TITN: "Titan Laboratories",
        LXO: "LexoCorp",
        RHOC: "Rho Construction",
        APHE: "Alpha Enterprises",
        SYSC: "SysCore Securities",
        CTK: "CompuTek",
        NTLK: "NetLink Technologies"
    };

    function companyName(sym) {
        return COMPANY_NAMES[sym] || sym;
    }

    // ------------------------------------------------------------
    // LOAD PERSISTENT STATS
    // ------------------------------------------------------------

    let stats = {
        version: VERSION,
        realisedProfit: 0,
        tradesClosed: 0,
        winningTrades: 0,
        losingTrades: 0
    };

    const savedStats = ns.read(STATS_FILE);

    if (savedStats && savedStats.trim() !== "") {
        try {
            const loaded = JSON.parse(savedStats);

            stats.realisedProfit =
                Number(loaded.realisedProfit) || 0;

            stats.tradesClosed =
                Number(loaded.tradesClosed) || 0;

            stats.winningTrades =
                Number(loaded.winningTrades) || 0;

            stats.losingTrades =
                Number(loaded.losingTrades) || 0;

        } catch {
            ns.tprint(
                "WARNING: Could not read existing stock trader stats."
            );
        }
    }

    // ------------------------------------------------------------
    // SAVE STATS
    // ------------------------------------------------------------

    async function saveStats() {
        stats.version = VERSION;

        await ns.write(
            STATS_FILE,
            JSON.stringify(stats, null, 2),
            "w"
        );
    }

    // ------------------------------------------------------------
    // STARTUP
    // ------------------------------------------------------------

    ns.tprint(
        "=== PR0MPTS AUTONOMOUS STOCK TRADER v2 ==="
    );

    ns.tprint(
        "BUY >= 65% | SELL < 50% | LONGS ONLY"
    );

    ns.tprint(
        "Cash reserve: $100b"
    );

    ns.tprint(
        "Persistent stock P/L tracking ENABLED"
    );

    ns.tprint(
        "Stats file: " + STATS_FILE
    );

    ns.tprint(
        "Previous realised P/L: $" +
        ns.format.number(stats.realisedProfit)
    );

    ns.tprint(
        "------------------------------------------"
    );

    // ------------------------------------------------------------
    // MAIN TRADING LOOP
    // ------------------------------------------------------------

    while (true) {

        const symbols = ns.stock.getSymbols();

        // ========================================================
        // PROCESS EACH STOCK
        // ========================================================

        for (const sym of symbols) {

            const forecast =
                ns.stock.getForecast(sym);

            const position =
                ns.stock.getPosition(sym);

            const longShares =
                position[0];

            const longAvgPrice =
                position[1];

            // ====================================================
            // SELL EXISTING LONG
            // ====================================================

            if (
                longShares > 0 &&
                forecast < SELL_FORECAST
            ) {

                const sellPrice =
                    ns.stock.sellStock(
                        sym,
                        longShares
                    );

                if (sellPrice > 0) {

                    // Buy commission + sell commission
                    const totalCommission =
                        COMMISSION * 2;

                    const profit =
                        ((sellPrice - longAvgPrice) *
                            longShares)
                        - totalCommission;

                    stats.realisedProfit += profit;
                    stats.tradesClosed++;

                    if (profit >= 0) {
                        stats.winningTrades++;
                    } else {
                        stats.losingTrades++;
                    }

                    await saveStats();

                    ns.tprint(
                        "SELL ALL: " +
                        companyName(sym) +
                        " (" +
                        sym +
                        ") | " +
                        ns.format.number(longShares) +
                        " shares | Forecast " +
                        (forecast * 100).toFixed(2) +
                        "% | P/L $" +
                        ns.format.number(profit)
                    );

                    ns.tprint(
                        "TOTAL REALISED STOCK P/L: $" +
                        ns.format.number(
                            stats.realisedProfit
                        )
                    );
                }

                continue;
            }

            // ====================================================
            // ALREADY HOLDING
            // ====================================================

            if (longShares > 0) {
                continue;
            }

            // ====================================================
            // BUY NEW LONG
            // ====================================================

            if (forecast >= BUY_FORECAST) {

                const currentCash =
                    ns.getServerMoneyAvailable(
                        "home"
                    );

                const availableCash =
                    currentCash -
                    MIN_CASH_RESERVE;

                if (
                    availableCash <=
                    MIN_TRADE_VALUE
                ) {
                    continue;
                }

                const askPrice =
                    ns.stock.getAskPrice(sym);

                const maxShares =
                    ns.stock.getMaxShares(sym);

                const budget =
                    availableCash *
                    MAX_POSITION_FRACTION;

                let shares =
                    Math.floor(
                        (budget - COMMISSION) /
                        askPrice
                    );

                shares =
                    Math.min(
                        shares,
                        maxShares
                    );

                if (shares <= 0) {
                    continue;
                }

                const estimatedCost =
                    (shares * askPrice) +
                    COMMISSION;

                if (
                    estimatedCost <
                    MIN_TRADE_VALUE
                ) {
                    continue;
                }

                const boughtPrice =
                    ns.stock.buyStock(
                        sym,
                        shares
                    );

                if (boughtPrice > 0) {

                    ns.tprint(
                        "BUY: " +
                        companyName(sym) +
                        " (" +
                        sym +
                        ") | " +
                        ns.format.number(shares) +
                        " shares | Forecast " +
                        (forecast * 100).toFixed(2) +
                        "% | Cost ~$" +
                        ns.format.number(
                            estimatedCost
                        )
                    );
                }
            }
        }

        // ========================================================
        // CALCULATE CURRENT PORTFOLIO
        // ========================================================

        let unrealisedProfit = 0;
        let openPositions = 0;

        for (const sym of symbols) {

            const position =
                ns.stock.getPosition(sym);

            const shares =
                position[0];

            const avgPrice =
                position[1];

            if (shares <= 0) {
                continue;
            }

            openPositions++;

            const bidPrice =
                ns.stock.getBidPrice(sym);

            const positionProfit =
                ((bidPrice - avgPrice) *
                    shares)
                - COMMISSION;

            unrealisedProfit +=
                positionProfit;
        }

        const totalProfit =
            stats.realisedProfit +
            unrealisedProfit;

        const winRate =
            stats.tradesClosed > 0
                ? (
                    stats.winningTrades /
                    stats.tradesClosed
                ) * 100
                : 0;

        // --------------------------------------------------------
        // SCRIPT WINDOW DISPLAY
        // --------------------------------------------------------

        ns.clearLog();

        ns.print(
            "=== PR0MPTS STOCK TRADER v2 ==="
        );

        ns.print(
            "Updated: " +
            new Date().toLocaleTimeString()
        );

        ns.print(
            "--------------------------------"
        );

        ns.print(
            "Realised P/L:   $" +
            ns.format.number(
                stats.realisedProfit
            )
        );

        ns.print(
            "Unrealised P/L: $" +
            ns.format.number(
                unrealisedProfit
            )
        );

        ns.print(
            "TOTAL STOCK P/L: $" +
            ns.format.number(
                totalProfit
            )
        );

        ns.print(
            "--------------------------------"
        );

        ns.print(
            "Closed trades: " +
            stats.tradesClosed
        );

        ns.print(
            "Wins: " +
            stats.winningTrades +
            " | Losses: " +
            stats.losingTrades
        );

        ns.print(
            "Win rate: " +
            winRate.toFixed(1) +
            "%"
        );

        ns.print(
            "Open positions: " +
            openPositions
        );

        ns.print(
            "Cash: $" +
            ns.format.number(
                ns.getServerMoneyAvailable(
                    "home"
                )
            )
        );

        ns.print(
            "--------------------------------"
        );

        // --------------------------------------------------------
        // SHOW OPEN POSITIONS
        // --------------------------------------------------------

        for (const sym of symbols) {

            const position =
                ns.stock.getPosition(sym);

            const shares =
                position[0];

            const avgPrice =
                position[1];

            if (shares <= 0) {
                continue;
            }

            const bidPrice =
                ns.stock.getBidPrice(sym);

            const positionProfit =
                ((bidPrice - avgPrice) *
                    shares)
                - COMMISSION;

            const forecast =
                ns.stock.getForecast(sym);

            ns.print(
                companyName(sym) +
                " | " +
                ns.format.number(shares) +
                " shares | " +
                (forecast * 100).toFixed(2) +
                "% | P/L $" +
                ns.format.number(
                    positionProfit
                )
            );
        }

        await ns.sleep(
            CHECK_INTERVAL
        );
    }
}