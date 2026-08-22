# Bitburner Research Library

> Curated reference material used to support the Bitburner 100%
> Playbook.

------------------------------------------------------------------------

# Purpose

This document tracks useful Bitburner references, guides, discussions,
and verified facts.

The Playbook answers: **What are we doing?**\
The Research Library answers: **Why do we believe this is correct?**

------------------------------------------------------------------------

# Reliability Scale

  Rating   Meaning
  -------- ------------------------------------------------
  ★★★★★    Official documentation or source code
  ★★★★☆    Strong community consensus or maintained guide
  ★★★☆☆    Useful but needs verification
  ★★☆☆☆    Anecdotal or narrow use case
  ★☆☆☆☆    Outdated, unreliable, or superseded

------------------------------------------------------------------------

# Official Resources

## Official Documentation

**URL:**\
https://bitburner-fork-oddiz.readthedocs.io/

**Reliability:** ★★★★★

**Topics:** - Netscript - Game mechanics - Guides and tips

**Status:** Active reference

**Notes:**\
Primary reference for documented game mechanics and scripting behaviour.

------------------------------------------------------------------------

## Official NS API Reference

**URL:**\
https://github.com/bitburner-official/bitburner-src/blob/stable/markdown/bitburner.ns.md

**Reliability:** ★★★★★

**Topics:** - Complete Netscript API - Function reference - Parameters -
Return values - Available namespaces

**Status:** Active reference

**Notes:**\
Authoritative reference for every `ns` function. Use when writing
scripts or verifying API behaviour.

------------------------------------------------------------------------

## Official Getting Started Guide

**URL:**\
https://github.com/bitburner-official/bitburner-src/blob/stable/src/Documentation/doc/en/help/getting_started.md

**Reliability:** ★★★★★

**Topics:** - Early-game progression - Starter scripts - Rooting
servers - Purchasing servers - Hacknet - Early hacking strategy

**Status:** Active reference

**Notes:**\
Official beginner guide. Excellent for understanding intended
progression. Strategy recommendations should be validated against
current game balance before being incorporated into the Playbook.

------------------------------------------------------------------------

## Official Source Code

**URL:**\
https://github.com/bitburner-official/bitburner-src

**Reliability:** ★★★★★

**Topics:** - Achievement logic - Hidden mechanics - Exact formulas -
Current implementation

**Status:** Active reference

**Notes:**\
Ultimate source of truth. Use to verify undocumented mechanics,
achievement requirements, formulas, and implementation details.

------------------------------------------------------------------------

## In-Game Guide --- Automating IPvGO

**Source:**\
In-game Bitburner documentation --- `Automating IPvGO`

**Reliability:** ★★★★★

**Topics:** - IPvGO - `ns.go` API - Go automation - Territory control -
Router networks - Capture and defence logic - Scripted opponent play -
Advanced Go strategy

**Status:** Future implementation reference

**What is IPvGO?**\
IPvGO is Bitburner's Go-inspired strategic territory-control minigame.
The player places routers on a subnet grid and competes against
faction-controlled opponents to build networks, surround territory,
preserve open connections (liberties), and capture opposing networks.
Playing IPvGO can provide node power, stat multipliers, and faction
favor, making it relevant to longer-term progression and the 100%
achievement project.

**Why this resource is useful:**\
This in-game guide is a practical roadmap for automating IPvGO through
Netscript rather than relying entirely on manual play. It begins with a
simple bot that selects valid moves and gradually introduces stronger
decision-making, including:

-   Reading the board with `ns.go.getBoardState()`.
-   Finding legal moves with `ns.go.analysis.getValidMoves()`.
-   Expanding existing friendly networks.
-   Detecting and capturing vulnerable enemy networks.
-   Defending friendly networks that are close to capture.
-   Using liberties and chain information to judge network safety.
-   Smothering opposing networks by reducing their available liberties.
-   Expanding networks toward useful empty space.
-   Encircling and controlling territory.
-   Resetting boards and allowing a script to play repeated games.
-   Developing more advanced strategies involving jumps, knight-style
    moves, pattern matching, controlled empty nodes, and the creation of
    two-eye structures.

The guide also provides a natural development path for a future
`go-bot.js`: start with legal/random play, then progressively add
expansion, capture, defence, territory evaluation, and increasingly
sophisticated board analysis.

**Operational takeaway:**\
Do not divert the current run simply to build IPvGO automation. Retain
this guide as the primary implementation reference for when IPvGO
becomes relevant to progression or achievement hunting. Building the bot
iteratively will fit the project's broader strategy of replacing
repetitive manual systems with increasingly capable automation.

------------------------------------------------------------------------


## In-Game Guide --- The Darkweb Network

**Source:**\
In-game Bitburner documentation --- `The Darkweb Network`

**Reliability:** ★★★★★

**Topics:** - Darknet - `ns.dnet` API - Dynamic network exploration -
Authentication - Sessions - Self-replicating scripts - `.cache` files -
Phishing - RAM reallocation - Stasis links - Server migration - Stock
volatility

**Status:** Active and future implementation reference

**What is the Darknet?**\
The Darknet is a separate, unstable network environment in Bitburner
that becomes accessible after obtaining `DarkscapeNavigator.exe`.
Unlike the normal network, its topology can change over time: servers
may restart, move between connections, go offline, form loops, or exist
in disconnected islands. Darknet servers generally cannot be operated
on remotely in the same way as ordinary servers, so effective
exploration depends on scripts that can probe nearby machines,
authenticate to them, preserve credentials, and spread through the
network.

**Why this resource is useful:**\
This in-game guide explains both the design of the Darknet and the
intended use of the `ns.dnet` API. It directly supports the project's
existing Darknet exploration and provides the foundation for turning
experimental workers into a resilient distributed automation system.
Important capabilities covered include:

-   Discovering directly connected Darknet servers with
    `ns.dnet.probe()`.
-   Inspecting server state, model information, and password hints with
    `ns.dnet.getServerDetails()`.
-   Cracking nearby servers with `ns.dnet.authenticate()` and extracting
    useful authentication clues from logs with `ns.dnet.heartbleed()`.
-   Preserving discovered passwords so access can be recovered after
    scripts are killed or network conditions change.
-   Establishing per-script sessions with `ns.dnet.connectToSession()`
    so scripts can use authenticated servers.
-   Copying and executing scripts across the Darknet once the required
    session and connectivity conditions are satisfied.
-   Finding and opening valuable `.cache` files with
    `ns.dnet.openCache()`.
-   Reclaiming blocked server RAM with `ns.dnet.memoryReallocation()`.
-   Running `ns.dnet.phishingAttack()` for money, charisma progression,
    and possible `.cache` rewards.
-   Stabilising strategically important servers with
    `ns.dnet.setStasisLink()`, allowing persistent remote access.
-   Forcing server movement with `ns.dnet.induceServerMigration()` to
    help cross otherwise disconnected parts of the Darknet.
-   Increasing stock volatility with `ns.dnet.promoteStock()`, creating
    a potential future link between Darknet automation and the project's
    stock-market strategy.

The guide also includes an official example of a simple self-replicating
Darknet script. It probes neighbouring servers, solves supported
authentication models, copies itself to successfully authenticated
machines, and launches another copy there. Its TODOs provide a useful
development roadmap for adding password persistence, additional server
models, Heartbleed analysis, RAM reclamation, cache collection, and
phishing.

**Operational takeaway:**\
Retain this guide as the primary design reference for future Darknet
automation. Our earlier Darknet exploration established the basic
workflow; this document explains how to make that workflow resilient to
moving, restarting, disconnected, and disappearing servers. The example
script should also be retained as reference architecture rather than
treated as a finished solution. Longer term, Darknet RAM, caches,
phishing, server migration, stasis links, and stock promotion may all
become useful components of the wider automation system.

------------------------------------------------------------------------

# Community Resources

## Placeholder - Steam Achievement Guide

**URL:**\
TBD

**Reliability:** ★★★☆☆

**Topics:** - Achievements

**Status:** Pending review

**Notes:**\
Potentially useful, but must be verified before influencing the
Playbook.

------------------------------------------------------------------------

# Verified Knowledge

## Achievement Routing

**Status:** Active

**Sources:** - In-game achievement tracker - Official source code when
exact trigger conditions require verification - Playthrough observations
from Sessions 8 and 9

**Summary:**

Achievement hunting is now being integrated into normal progression
instead of being treated as a separate endgame task.

**Verified Examples**

-   `Big trouble` unlocks when a server is drained to \$0.
-   `Thank you folders!` unlocks when at least 30 scripts exist on
    `home`.
-   `Formulas.exe` unlocks when Formulas.exe is acquired.
-   `World explorer` unlocks after travelling.
-   `Gains!` unlocks after working out at a gym.
-   `I.I.I.I` unlocks after joining The Black Hand.

**Routing Principle**

Prefer achievements that can be completed alongside normal progression,
faction work, automation, or pre-reset spending. Delay expensive or
disruptive achievements until the network and economy can absorb the
detour.

------------------------------------------------------------------------

# Verified Playthrough Findings

## Augmentation Cycle Strategy

**Reliability:** ★★★★☆

**Source:** Repeated playthrough observation across Runs 1--3

**Findings:**

-   Installing several augmentations together is more efficient than
    resetting for every individual upgrade.
-   Purchased augmentations can be held without immediately installing
    them.
-   A short delay before installation can be worthwhile when one or two
    nearby achievements can be completed first.
-   Money that will be lost on reset should be converted into permanent
    value before installation.
-   Useful end-of-run purchases include augmentations, NeuroFlux
    Governor levels, Home RAM, and other permanent upgrades.
-   Run 3 was the most efficient reset cycle because it combined story
    progression, faction work, infrastructure upgrades, and achievement
    hunting.

------------------------------------------------------------------------

## Reset Persistence

**Reliability:** ★★★★☆

**Source:** Direct playthrough observation

**Persists after augmentation installation:**

-   Installed augmentations
-   Achievements
-   Faction favor
-   Scripts stored on `home`
-   Player knowledge and documented routes

**Must be rebuilt or reacquired:**

-   Money
-   Hacking level
-   Root access
-   Active scripts
-   Hacknet Nodes
-   Programs
-   Faction membership
-   Faction reputation

**Operational implication:**\
The most valuable reset-preparation asset is a reusable automation and
recovery toolkit stored on `home`.

------------------------------------------------------------------------

## Home Infrastructure

**Reliability:** ★★★★☆

**Source:** Direct playthrough observation

**Findings:**

-   Home RAM upgrades are permanent and become increasingly valuable as
    utility scripts and automation grow.
-   Home RAM was upgraded from 32 GB to 1 TB before the end of Run 3.
-   Home RAM works well as an end-of-run money sink when the next
    augmentation installation is imminent.
-   Extra Home RAM supports deployment control, achievement scripts,
    faction RAM sharing, and future orchestration tools.

------------------------------------------------------------------------

## Dark Web Program Progression

**Reliability:** ★★★★☆

**Source:** In-game program list and achievement tracker

**Findings:**

-   The complete program set includes:
    -   BruteSSH.exe
    -   FTPcrack.exe
    -   relaySMTP.exe
    -   HTTPWorm.exe
    -   SQLInject.exe
    -   DeepscanV1.exe
    -   DeepscanV2.exe
    -   AutoLink.exe
    -   ServerProfiler.exe
    -   DarkscapeNavigator.exe
    -   Formulas.exe
-   Formulas.exe is the final major Dark Web program milestone.
-   Acquiring Formulas.exe awards its own Steam achievement.
-   Owning every port-opening program significantly simplifies network
    rooting and faction progression.

------------------------------------------------------------------------

## Automation Reliability

**Reliability:** ★★★★☆

**Source:** Direct playthrough observation

**Current stable toolset:**

-   `deploy.js`
-   `worker.js`
-   `drain.js`
-   `recover.js`

**Findings:**

-   `deploy.js` evolved from manual deployment support into an automated
    network recovery tool.
-   `worker.js` provides stable unattended hack/grow/weaken behavior.
-   `drain.js` isolates the server-draining achievement from normal
    production logic.
-   `recover.js` restores depleted servers after one-off achievement
    work.
-   The automation network remained stable through a long Run 3 economy
    and faction grind.
-   Purpose-built scripts are safer than temporarily changing general
    production scripts for achievement objectives.

------------------------------------------------------------------------

## Achievement-Efficient Progression

**Reliability:** ★★★★☆

**Source:** Sessions 8 and 9

**Findings:**

-   Story progression and achievement hunting can run in parallel.
-   Low-risk achievements should be completed when their setup cost is
    small.
-   Achievement work should not interrupt stable income or faction
    progression unless the reward justifies the delay.
-   The `Thank you folders!` achievement can be planned around useful
    script growth rather than filler alone.
-   The `Big trouble` achievement is safest when paired with a recovery
    script.
-   The most efficient reset so far deliberately waited for two nearby
    achievements before installation.

------------------------------------------------------------------------

## Infiltration Benchmarks

**Reliability:** ★★★☆☆

**Source:** Direct playthrough testing during Session 10

**Benchmarks:**

  Company        Approx. Combat Stats   Displayed Difficulty Result
  ------------ ---------------------- ---------------------- ------------------------
  Joe's Guns                      \~1                     89 Too hard
  Joe's Guns                     \~30                     81 Too hard
  Joe's Guns                    \~100                     64 Still too hard
  ECorp                         \~100                    461 Not allowed to attempt

**Findings:**

-   Raising combat stats reduced the displayed infiltration difficulty
    at Joe's Guns.
-   Even with combat stats around 100, Joe's Guns remained too difficult
    to complete.
-   ECorp's displayed difficulty was dramatically higher and
    infiltration was not available at the tested state.
-   Combat stats alone are not enough to make infiltration practical at
    this stage.
-   Infiltration should be revisited after stronger combat progression,
    more relevant augmentations, or better understanding of the
    minigames.

**Research status:**\
Useful baseline only. These results are observational and should not be
treated as universal thresholds.

------------------------------------------------------------------------

## Crime Progression

**Reliability:** ★★★★☆

**Source:** Direct playthrough observation during Session 10

**Findings:**

-   At approximately 100 combat stats, Homicide had about a 55% success
    rate.
-   Karma dropped quickly enough to show visible progress during a short
    session.
-   Repeated Homicide immediately led to unlocking Slum Snakes.
-   Training Strength, Defense, Dexterity, and Agility evenly created a
    solid base before beginning serious crime progression.
-   Joining Slum Snakes opened another source of combat- and
    crime-focused augmentations.
-   Crime provides a meaningful alternative to hacking-only progression
    through:
    -   Karma reduction
    -   New faction access
    -   Additional augmentation paths
    -   Broader character development
-   Crime can be left running while the automated hacking network
    continues generating money and hacking experience.
-   Crime progression gives the playthrough a useful change of pace
    without sacrificing long-term account progress.

**Operational takeaway:**\
For the current build, balanced combat training to roughly 100 in all
four combat stats is a workable entry point for Homicide-based Karma
progression.

------------------------------------------------------------------------

# Current Research Focus

## Automation Strategy

**Status:** Active

**Summary:**

Our current strategy favours reliable, unattended automation over
short-term optimisation.

**Key Decisions**

-   Use a central `deploy.js` script to scan, root, deploy, choose
    targets, and restore the network after resets.
-   Use a generic `worker.js` that continuously decides whether to
    weaken, grow, or hack based on the server's current state.
-   Allow deployment to any target by passing the desired server to
    `deploy.js`, avoiding hard-coded targets.
-   Optimise for continuous progression while offline or AFK rather than
    maximum income per second.
-   Delay advanced HWGW batch hacking until later in the playthrough
    when RAM, hacking speed, formulas access, and available tools make
    batching worthwhile.

**Outcome**

This approach has provided stable income, consistent hacking experience,
fast post-reset recovery, and enough spare capacity to pursue
achievements without abandoning faction or story progression.

------------------------------------------------------------------------

# Research Log

## 2026-08-22

-   Added the in-game `The Darkweb Network` guide as a ★★★★★ official
    resource.
-   Documented the Darknet as a dynamic, unstable network requiring
    local probing, authentication, sessions, credential persistence, and
    self-replicating scripts.
-   Recorded the `ns.dnet` capabilities for cache collection, RAM
    reclamation, phishing, stasis links, forced server migration, and
    stock-volatility promotion.
-   Retained the official self-replicating starter script as reference
    architecture for future Darknet automation.
-   Identified a potential future integration between Darknet stock
    promotion and the automated stock-market strategy.

-   Added the in-game `Automating IPvGO` guide as a ★★★★★ official
    resource.
-   Documented IPvGO as Bitburner's Go-inspired territory-control
    minigame involving router networks, liberties, captures, and
    controlled space.
-   Recorded the guide as the future primary implementation reference
    for an automated `go-bot.js`.
-   Identified an iterative automation path from legal/random moves
    through expansion, capture, defence, territory control, and advanced
    board analysis.

## 2026-07-10

-   Created Research Library.
-   Added initial official documentation and source code references.

## 2026-07-12

-   Added the official NS API Reference as the primary scripting
    reference.
-   Added the official Getting Started Guide as the canonical early-game
    progression reference.
-   Clarified the distinct roles of the documentation, API reference,
    guide, and source code.

## 2026-07-21

-   Documented the current automation architecture built around
    `deploy.js` and `worker.js`.
-   Confirmed the transition from individual hack scripts to a
    self-balancing worker model.
-   Recorded the decision to prioritise reliability and unattended
    progression before advanced batch hacking.
-   Identified achievement-focused research as the next major area of
    investigation following faction progression and BruteSSH
    acquisition.

## 2026-07-25

-   Added achievement-routing observations from the first dedicated
    achievement sprint.
-   Documented `drain.js` and `recover.js` as a safe achievement
    workflow.
-   Recorded that purchased servers and Home RAM upgrades can support
    achievement hunting without stopping normal automation.
-   Confirmed that The Black Hand becomes available through progression
    involving `I.I.I.I`.

## 2026-07-30

-   Documented Formulas.exe as the final Dark Web program milestone and
    a Steam achievement trigger.
-   Recorded `Thank you folders!` as requiring at least 30 scripts on
    `home`.
-   Added reset-persistence findings for augmentations, achievements,
    favor, scripts, programs, factions, and reputation.
-   Added the end-of-run spending strategy: convert reset-lost cash into
    permanent upgrades before installation.
-   Recorded the Home RAM upgrade from 32 GB to 1 TB.
-   Documented Run 3 as the first successful balance of story
    progression, faction progression, infrastructure growth, and
    achievement hunting.
-   Confirmed that the stable automation stack remained `deploy.js`,
    `worker.js`, `drain.js`, and `recover.js`.

## 2026-08-01

-   Added direct infiltration benchmarks for Joe's Guns and ECorp.
-   Recorded that Joe's Guns remained too difficult even at
    approximately 100 combat stats.
-   Documented Homicide at approximately 55% success with combat stats
    near 100.
-   Confirmed that repeated Homicide reduced Karma quickly and unlocked
    Slum Snakes.
-   Recorded balanced combat training as a practical foundation for
    crime progression.
-   Added the strategic finding that crime can run alongside the
    automated hacking network without interrupting hacking income or
    experience.
-   Identified Slum Snakes as a new source of combat- and crime-focused
    augmentations.
