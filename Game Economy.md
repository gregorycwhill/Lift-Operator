# Lift Operator — Game Economy

**Status:** Marie's Birthday Edition authority  
**Parameter source:** `design/game-balance.v1.json`

## Currency model

**Credits** are spendable. **Campaign score** is the lifetime Credits earned in the current campaign and does not fall
when the player buys an item. “Total Credits” in player-facing summaries means the spendable balance.

Standard rounds award one raw point per served guest plus one raw point per ten seconds remaining, then apply the
canonical standard multiplier (`0.1`) and any round multiplier. Endurance awards from survival intervals and service
intervals, capped at 50 Credits. Runtime calculations must read canonical balance data.

On ordinary death, the attempt is rolled back completely: pre-attempt Credits return and attempt inventory is empty.
On success, purchased/unused inventory and earned Credits commit at the round boundary.

## Current catalog

| Power-up | Tier costs | Unlock rounds | Tactical role |
|---|---:|---:|---|
| Wrench | 1 / 3 / 5 | 6 / 6 / 12 | Repair jams / provide protection |
| Pet Snacks | 1 / 3 / 5 | 5 / 5 / 12 | Prevent or resolve pet conflict; does not prevent Stink |
| Wide Doors | 1 / 2 / 3 | 3 / 4 / 12 | Faster boarding during pressure |
| Rocket | 1 / 3 / 5 | 7 / 7 / 12 | Faster lift travel |
| Musak | 2 / 4 / 8 | 8 / 8 / 12 | Pause or reduce patience pressure |
| Air Freshener | 1 / 3 / 5 | 9 / 9 / 12 | Suppress Stink; does not resolve pet conflict |
| TARDIS | 2 / 3 / 5 | 10 / 10 / 12 | Temporary extreme capacity |
| Group Think | 2 / 4 / 6 | 10 / 10 / 12 | Coordinate demand response |
| Double-Decker | 1 / 2 / 3 | 11 / 11 / 12 | Temporary double capacity |

Pet Snacks tiers are deliberately asymmetric:

- Bronze: one lift for 10 seconds.
- Silver: one lift for 30 seconds.
- Gold: every lift for 20 seconds.

This makes targeted timing cheaper and stronger than indiscriminate protection. It is a conflict tool, not a universal
pet solution; admission filters and five-pet Stink remain meaningful.

## Economy design rules

1. A new mechanic receives an affordable first countermeasure before or at introduction.
2. A power-up should create a recovery window, not erase the round's core decision.
3. Tier costs increase monotonically; higher tiers may trade duration for broader scope.
4. The player should be able to fail, reconsider a small loadout, and retry without grinding earlier rounds.
5. Balance changes consider the full campaign budget, not one isolated round.
6. Pets recur often enough that Pet Snacks are useful, but filters must remain a viable no-spend response.
7. Checkout waves should reward timing throughput tools within the wave rather than continuous purchase pressure.

## Save compatibility

The Birthday release contains a narrow migration from `0.2.x` campaign checkpoints. Removed inventory is filtered and
its purchase cost is refunded (`2/3/5` by stored tier) to spendable Credits. Campaign score is unchanged because a
refund is not new earning. Checkpoints are pre-round, so a late campaign resumes at the same round under the new
conventional-lift rules rather than inside removed live state.

This migration is intentionally specific. Do not build a general migration framework for the time-bound release.

## Balance review outputs

Economy sweeps report, by band and seed:

- opening/closing Credits and Credits spent;
- inventory selected/used/unspent;
- completion rate and lives remaining;
- improvement over the no-purchase and unattended-Sweep controls;
- pet conflict resolution rate and Freshener/Pet Snacks misuse;
- anomalous runs where a single purchase dominates or the intended profile cannot recover.

Stop tuning when correctness is green, competent profiles meet the thresholds in `TEST_PLAN.md`, human play identifies
no P0 confusion, and two consecutive accepted sweeps produce no material threshold improvement. Do not optimise a few
rounds at the cost of end-to-end campaign delivery.
