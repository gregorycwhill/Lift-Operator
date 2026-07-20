# Playtest Notes

This is a working observation log. Do not convert observations directly into configuration changes without recording a hypothesis and expected evidence in the format defined by `BALANCE_WORKFLOW.md`.

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

The corresponding implementation sequence, acceptance gates, and evidence requirements are in
`IMPLEMENTATION_HANDOFF.md` Section 17 and `TEST_PLAN.md` Milestone K.


