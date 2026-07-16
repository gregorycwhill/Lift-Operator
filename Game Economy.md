# Lift Operator — Target Game Economy

**Document role:** Canonical target earning, spending, retry, and progression design  
**Status:** Initial economy model for simulation and playtesting  
**Principle:** The economy creates decisions; it does not reward grinding or allow every problem to be purchased away.

## 1. Economy goals

The economy should make the player ask:

- What caused my last failure?
- Which one or two interventions would change the outcome?
- Should I buy a premium answer or combine smaller tools?
- Should I save for a later mastery wall?
- Can better automation replace consumable spending?
- When during the round is the item most valuable?

For most shop visits:

- A typical player can afford one meaningful purchase.
- An excellent player can afford a premium purchase or several tactical items.
- A struggling player has access to at least one recovery option.
- The player cannot afford every relevant answer.
- Saving is a valid and visible strategy.

## 2. Currency model

### 2.1 Operational Points

Operational Points are the visible shop currency.

They are:

- Earned from completed round performance.
- Spent on attempt loadouts.
- Carried forward between successful rounds.
- Not farmable through repeated failed attempts.

### 2.2 Career achievements

Achievements are permanent records of mastery.

Their primary rewards should be:

- Badge/trophy progression.
- Rank or showcase recognition.
- Optional small one-time Operational Point bonuses.
- Potential future cosmetic or sandbox unlocks.

Achievements must not be the main source of routine purchasing power.

## 3. Retry and transaction model

The retry model uses a checkpoint created immediately after the previous round’s payout and before the next shop:

1. Save the point balance, target round, and round seed.
2. Enter the shop and choose a provisional loadout.
3. Start the attempt with those items in inventory.
4. If the player dies in an ordinary round, discard the entire attempt.
5. Restore the saved point balance in full.
6. Clear inventory and cart.
7. Recreate the same round with the same seed.
8. Return to the shop so the player can choose a different loadout.
9. On successful completion, commit spending and award the round payout once.

Nothing from the failed gameplay attempt carries forward: no spent points, inventory, cart, served counts, achievements, timers, hazard state, or lift state. The player keeps only the knowledge gained from the attempt.

This makes difficult rounds repeatable strategy puzzles without enabling point farming.

### 3.1 Endurance exception

Round 12 ends when the player loses the 20th and final life. That death is the expected completion condition, not a failed attempt.

Therefore:

- The pre-attempt snapshot is not restored.
- Purchases and consumed items commit.
- The Endurance payout is awarded once.
- The score records survival time and guests served.
- The campaign automatically advances to Round 13.
- Round 12 cannot be farmed by replaying from the normal campaign flow.

## 4. Round payout model

### 4.1 Principles

Payout should:

- Be predictable enough for planning.
- Reward the behaviour taught by the round.
- Avoid large positive feedback loops where strong players buy everything.
- Avoid punishing a successful player for using a power-up.
- Be capped tightly enough to protect scarcity.

### 4.2 Proposed formula

Each normally completed round awards:

```text
base completion award
+ service quality bonus
+ lives preserved bonus
+ round objective bonus
+ first-time achievement bonuses
```

Do not award one point per guest. Guest counts increase substantially across rounds and would inflate the economy.

Do not award remaining-time bonuses in fixed-duration survival rounds. Time remaining is meaningful only for delivery-quota rounds.

### 4.3 Candidate payout bands

| Round | Minimum success | Typical success | Excellent success | Cumulative typical before spending |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 3 | 4 | 5 | 4 |
| 2 | 4 | 5 | 6 | 9 |
| 3 | 5 | 6 | 8 | 15 |
| 4 | 5 | 7 | 9 | 22 |
| 5 | 6 | 8 | 10 | 30 |
| 6 | 7 | 9 | 12 | 39 |
| 7 | 8 | 10 | 13 | 49 |
| 8 | 8 | 11 | 14 | 60 |
| 9 | 9 | 12 | 16 | 72 |
| 10 | 10 | 13 | 17 | 85 |
| 11 | 11 | 14 | 18 | 99 |
| 12 | 18 | 28 | 45+ | 127 |
| 13 | 15 | 20 | 25 | 147 |

These cumulative figures intentionally ignore spending. They are used to evaluate total campaign purchasing capacity.

Round 12 is intentionally wider and more generous than other rounds. A strong Endurance performance should create a noticeable final-round preparation dividend.

### 4.4 Candidate component weights

For timed survival rounds:

| Component | Candidate award |
| --- | ---: |
| Complete round | Round-specific base: 3–10 |
| Lose no lives | +2 |
| Lose no more than 10% of starting lives | +1 |
| Average wait below target | +1 |
| 90th-percentile wait below target | +1 |
| Round-specific mastery condition | +1 to +3 |

For quota rounds:

| Component | Candidate award |
| --- | ---: |
| Complete quota | Round-specific base |
| Finish faster than target | +1 to +3 |
| Lives preserved | +0 to +2 |
| Resource efficiency | +0 to +2 |
| Round-specific mastery | +1 to +3 |

All bonuses require caps. A player should understand the maximum possible award before starting.

### 4.5 Endurance payout

Round 12 uses a separate formula because it has no success threshold and may run much longer than a normal round.

```text
Endurance payout
= floor(survival seconds / survival-point interval)
+ floor(guests served / service-point interval)
+ service-quality bonuses
+ Endurance achievements
```

Initial candidate:

| Component | Candidate |
| --- | ---: |
| Survival | 1 point per completed 30 seconds |
| Service | 1 point per 10 guests served |
| Average wait below Endurance target | +2 |
| 90th-percentile wait below target | +2 |
| Survive 5 / 10 / 15 minutes | one-time achievement tiers |

The payout should be generous without making Round 13 purchases meaningless. Candidate safeguards:

- Cap repeatable Operational Points at 40–50.
- Continue recording uncapped survival time and score for personal-best purposes.
- Award time achievements once per tier.

The correct cap should be chosen after observing plausible survival times.

## 5. Price architecture

### 5.1 Tier philosophy

- **Bronze:** Tactical, narrow, affordable in the round it is introduced.
- **Silver:** Reliable, broader, and usually requires most of one round’s income.
- **Gold:** Transformative and scarce; normally requires saving across rounds.

Gold must not be universally best. A precise Bronze item used at the correct time should often outperform a mistimed Gold item.

### 5.2 Candidate price bands

| Tier | Candidate cost range | Intended affordability |
| --- | ---: | --- |
| Bronze | 4–7 | Common tactical purchase |
| Silver | 10–15 | One major investment |
| Gold | 20–28 | Saving or excellent performance |

The current 1/3/5-style prices are retired as target values because they trivialize scarcity under almost any useful payout model.

## 6. Candidate power-up catalog

These are initial prices and effect directions. Exact durations require simulation and playtesting.

| Power-up | Bronze | Silver | Gold | Balance role |
| --- | --- | --- | --- | --- |
| Wrench | 4: repair one lift | 10: repair all lifts | 22: repair all + short immunity | Availability recovery |
| Wide Doors | 5: 2× boarding, 15s | 12: 3× boarding, 20s | 24: near-instant, 15s | Boarding throughput |
| Turbo | 5: one lift, 10s | 12: one lift, 20s | 25: all lifts, 12s | Travel/recovery |
| Musak | 5: one lift, 15s | 11: all onboard guests, 15s | 23: global pause + partial soothe | Patience |
| Freshener | 4: clear one lift | 10: clear all active stink | 22: clear all + short immunity | Quarantine recovery |
| TARDIS | 7: one lift, 12s | 14: one lift, 25s | 28: all lifts, 12s | Capacity |
| Group Think | 6: one floor | 13: one lift + one floor | 26: global consensus | Destination concentration |
| Double-Decker | 7: one lift, 20s | 15: one lift, 45s | 28: all lifts, 20s | Sustained capacity with risk |
| Open Plan | Experimental | Experimental | Experimental | Outside campaign economy |

### Design cautions

- TARDIS does not solve boarding delay or gravity.
- Double-Decker should increase gravity sensitivity and retain its footprint constraint.
- Gold global effects should be shorter than Silver single-target effects where breadth is the main upgrade.
- Wrench immunity must not make jams irrelevant for most of a round.
- Musak should buy time, not erase accumulated failure.
- Group Think changes demand and may be powerful enough to require limited availability.

## 7. Shop unlock schedule

The shop should not display the full catalog from Round 2. Too many options obscure the problem–solution relationship.

| Available before round | Newly visible items |
| ---: | --- |
| 3 | Wide Doors Bronze |
| 4 | Wide Doors Silver |
| 6 | Wrench Bronze/Silver |
| 7 | Turbo Bronze/Silver |
| 8 | Musak Bronze/Silver |
| 9 | Freshener Bronze/Silver; selected Gold tiers begin appearing |
| 10 | TARDIS and Group Think Bronze/Silver |
| 11 | Double-Decker Bronze/Silver |
| 12 | Gold tiers for established items |
| 13 | Full campaign catalog except Open Plan |

An item may become visible one round before it becomes strategically necessary, allowing anticipation and saving.

## 8. Loadout constraints

Currency alone may not create sufficient choice once the bank grows.

Candidate additional constraint:

- Maximum of three carried power-up items per attempt during rounds 6–9.
- Maximum of four during rounds 10–13.

This turns the shop into a loadout puzzle and prevents stockpiling every answer. It also improves UI clarity.

The constraint should be playtested before adoption. If prices alone create strong scarcity, inventory slots may be unnecessary.

## 9. Achievement redesign

### 9.1 Achievement categories

| Category | Purpose |
| --- | --- |
| Progress | Celebrate campaign milestones |
| Execution | Reward skillful operation |
| Automation | Reward policy and custom-script mastery |
| Efficiency | Reward solving problems with fewer resources |
| Experimentation | Encourage alternative strategies |

### 9.2 Candidate achievement families

| Achievement | Bronze | Silver | Gold | Economic reward |
| --- | --- | --- | --- | ---: |
| Service Award | Campaign delivery milestone | Higher milestone | Major milestone | 1 / 2 / 3 |
| Hands-Free | Complete 1 eligible round | 3 rounds | 6 rounds | 1 / 2 / 3 |
| Flawless Shift | No lives lost once | 3 times | 6 times | 1 / 2 / 3 |
| Sardine Packer | One exact full load | 3 | 8 | 1 / 2 / 3 |
| Hacker | Custom-script completion | 3 completions | Complete mastery round | 1 / 2 / 4 |
| Lean Operator | Complete with no power-ups | 2 difficult rounds | Late-game wall | 1 / 2 / 4 |
| Recovery Expert | Recover one severe incident | 5 | 15 | 1 / 2 / 3 |

Achievement bonuses are intentionally small relative to item prices. Their primary value is status and long-term identity.

Achievements based only on raw script tick counts should be reconsidered because inefficient scripts can generate more ticks without demonstrating mastery.

## 10. Anti-inflation rules

- Award points only once per successful round completion per campaign progression state.
- Ordinary failed attempts restore the previous-round point checkpoint, clear inventory/cart, and award nothing.
- Round 12 death counts as completion, commits the attempt, and awards its Endurance payout once.
- Debug and simulation modes never write career or bank progress.
- Achievement rewards are granted once per tier.
- Payouts are capped.
- No repeatable time bonus in survival rounds.
- Endurance survival time is a deliberate exception and uses its own capped formula.
- Shop prices and payout bands are versioned together.

## 11. Economic balance tests

For each campaign version, simulate at least three player profiles:

### Struggling player

- Minimum successful payouts.
- Buys reactive Bronze items frequently.
- Fails wall rounds multiple times.
- Must never become permanently unable to continue.

### Typical player

- Typical payouts.
- Buys one item most rounds.
- Saves occasionally for Silver/Gold.
- Faces meaningful shop choices throughout.

### Expert player

- Excellent payouts.
- Uses automation to reduce consumption.
- Can access more Gold items, but still cannot trivialize every round.

Measure:

- Bank before and after each shop.
- Items affordable and selected.
- Unspent bank.
- Total item uses.
- Percentage of rounds solved without purchases.
- Whether one power-up dominates purchasing.
- Whether any intended solution is economically unavailable.

## 12. Acceptance criteria

The economy is functioning when:

- Round 1 does not fund most of the catalog.
- A typical player cannot buy every relevant item before a wall.
- Multiple viable loadouts exist.
- Saving is sometimes better than spending.
- Failure encourages experimentation rather than grinding.
- Achievements feel rewarding without causing inflation.
- Better automation measurably reduces expected consumable cost.
- No player is permanently trapped by earlier purchases.
- Gold effects feel exceptional and remain scarce.
