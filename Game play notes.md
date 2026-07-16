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


