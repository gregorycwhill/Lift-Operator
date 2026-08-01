# Playtest Verbatim Archive

**Status:** Active playtest evidence archive; not a work queue  
**Source:** Playtester messages and decisions reconstructed from the project chat transcript  
**Last reviewed:** 25 July 2026

This archive preserves direct playtester wording where it was available. Known transcript times are retained exactly;
the chat context did not expose dates for most later messages, so those entries are marked `date/time unavailable`.
Interpretations and implementation decisions belong in the active roadmap, delivery plan, and test plan rather than here.

## Retrospective verbatims

### Date unavailable — Marie, 4:18 PM

> Hey are you sure the rockets last for ten seconds? I was playing round 7 and it looked like it was 3 or 4 seconds.

### Date unavailable — Marie, 4:34 PM

> The rooftop bar only lasts for a few seconds. So I just started this strategy for getting everyone up there and then it was over. It should last for at least half the round and then everyone should want to leave at once - so you have huge amounts of guests on the 14th floor trying to get back to their rooms.

### Date unavailable — Marie, 4:37 PM

> Yeah Round 13 is unplayable. I only got 12 credits to spend and with the necessary mechanic and deoderiser ones there is not enough to purchase rockets. It's not really feasible to manually manage the lifts to ensure not to many guests get on and anyway they spawn so fast that you need to have the lifts fairly full.

### Date unavailable — Marie, 4:40 PM

> It doesn't help that the rockets don't last as long as they should. Interestingly enough though, stink actually helps to lighten the load.

### Date unavailable — later playtest batch

> will the gym bros get in a stinky lift? If not, why not?

> The rocket bug is still a bug with the top floor

> the power ups definitely don't last as long as they say they do.

> The rooftop level doesn’t work. Need to maths out the spawn rate versus the lift capacity OR make sure more powerups are available

> The gravity level doesn’t work. It’s not practical to control the number of people getting into the lifts and, even if you did, there are not enough lifts. MIGHT work if there were lots of rocket powerups. Suggest reducing the spawn rate 50%

> Gold Tiered Muzak says it pauses everything for 15 seconds. Does that include people waiting for the lifts? If not, please make it clearer.

> On round 19, the right side of the right lift is slightly cut off by the edge of the screen.

> Partying guests should all reset to green at the end of the party.

> When Infinite Capacity power-up wears off, guests need to get off at the next stop.

> On Round 20 the lifts disappear off the right-hand side of the screen - I am not actually sure how many lifts there are on this floor.

> Before Round 3, make sure you explain what room service carts are.

### Date unavailable — economy, audio, and interaction batch

> If you try to start the game without choosing any power ups, could you have a popup that asks if you “really” want to start the game without spending your credits?

> They’re not. Use it or lose it.

_Later product decision: Credits carry forward across successful rounds; see `Game Economy.md` and `DELIVERY_PLAN.md`._

> The countdown timer at the start of higher rounds runs for too long. There should be an override - player can click on the timer to begin immediately

> Menu music should continue from where it left off when starting.

> When you click on the Leaderboard / Debug etc buttons and that modal is already opened, it should close it. Ie make the button a toggle

> All sounds go for too long. They should be capped at 5s unless otherwise instructed. Except: Musak runs for as long as the Musak is in effect.

> Blue suitcase on green background is illegible; choose a friendly colour

> Round 13 - pedal power - might be too easy now! The spawn rate is really low.

> The rocket icons are still stuffing up where the lifts are positioned - they are sometimes between floors.

> Round 14 - I only had 10 points to allocate. It’s not really enough to win ... Actually, that strategy worked.

> There is a sound when people get out of the lift but what about one when they get in? A kind of popping noise?

> The “Avengers are in Trouble” music that happens in the game sort of turns off after a while.

> I tested it and the gym bros wouldn’t get in a stinky lift

> I think the power-up durations are fine but my impression is that they don’t last for as long as you say they do. That might just be a perception thing - worth you timing them.

> Floors, 13, 14 etc have “Finish Campaign” on the announcement during the muzak.

### Date unavailable — modal and UI clarification

> when you click on the Leaderboard, Debug or Workshop buttons, any currently open modals are closed before the new one is open. If the button for a currently-open modal is clicked, it just closes it.

### Date/time unavailable — R7/R9 traffic mix

> The only categories of guests are people checking out with suitcases, people going to the roof and the VIP. No one, say, going to Level 9.

> Okay so Round 9 is also just checkout and it's meant to be rooftop. I think it's worth fixing this bug before I play more.

> So round 7 ALL the guests are checking out. Is that intentional? The text at the start says that half the hotel is checking out.

## Capture protocol for future feedback

Append direct wording as a new entry under **Retrospective verbatims**. Include the following when the source supplies
it: date/time, player or source, round, browser/device, seed, balance version, and loadout. Preserve wording exactly;
record later interpretation or disposition outside the quote and in the active delivery/test documents.

## Historical interpreted notes

## Baseline session — before documentation true-up

### Round 1

Observations:

- Pacing felt too slow. Door, boarding, and travel timing all contributed.
- Round Review showed average wait as `0.0s`, indicating an accounting defect.
- The round awarded 38 points, enough to buy high-tier versions of most items.
- Current prices therefore did not create meaningful scarcity.

Classification:

- Average wait: **Defect**
- Pacing: **Balance**
- Payout/price relationship: **Balance and economy-model issue**

Do not assume that multiplying all prices by ten is the final solution. Payout and prices must be redesigned together.

### Round 2

Observation:

- Exiting the shop restored the old game board, triggered round completion again, and produced another Round Review.
- Normal progression testing could not continue.
- Debug Warp was used to reach Round 2.

Classification:

- **Critical lifecycle defect**

This issue must be fixed before balance conclusions from later rounds are considered reliable.

## Future entry template

```text
Date:
Commit:
Balance version:
Player:
Round:
Seed:
Attempt:
Loadout:
Automations:

Observation:
Perceived failure cause:
Measured failure cause:
Strategy change on retry:
Outcome:
Suggested hypothesis:
```

## Clarified playtest feedback — 20 July 2026

The following items are now implementation-plan requirements rather than informal observations:

- Debug Warp must expose every available round so late rounds can be tested.
- Checkout guests heading to floor G use suitcase icons; this does not apply to checkout guests going elsewhere.
- Room Service icons are too wide and need a 30% reduction in displayed horizontal width.
- Rocket behavior must be tested against the intended 10-second duration.
- The rooftop bar event is the defining event of its round: it needs a long, seeded-but-player-unpredictable active
  window, followed by a major return wave from floor 14.
- Round 13 needs more Credits from the preceding Endurance round and a 20% reduction in relevant spawn rates.
- Stink is an accepted discretionary tactic for relieving overloaded lifts and should remain viable.

The corresponding implementation sequence, acceptance gates, and evidence requirements were in the historical
`docs/archive/IMPLEMENTATION_HANDOFF.md` Section 17 and the active `TEST_PLAN.md` at the time.


