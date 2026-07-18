# All-Sweep Balance Baseline

Balance version: `0.2.3-r2-capacity-playtest`
Policy: Every lift uses Sweep; no manual targets, policy changes, or power-ups.

| Round | Seed | Outcome | Elapsed | Lives | Served | First peril | Min SI | Peak queue | P90 journey | Classification |
| ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 2 | 1234 | survived | 180s | 9 | 51 | - | - | 25 | 53.9s | VIOLATION_SURVIVED |
| 2 | 3141 | survived | 180s | 9 | 59 | 90s | 0.71 | 17 | 49.7s | VIOLATION_SURVIVED |
| 2 | 6060 | survived | 180s | 11 | 62 | 59s | 0.83 | 20 | 52.0s | VIOLATION_SURVIVED |
| 3 | 1234 | died | 177s | 0 | 124 | 59s | 0.00 | 39 | 52.2s | MEETS_ALL_SWEEP_FLOOR |
| 3 | 3141 | died | 145s | 0 | 81 | 73s | 0.00 | 43 | 49.9s | MEETS_ALL_SWEEP_FLOOR |
| 3 | 6060 | died | 131s | 0 | 74 | 69s | 0.00 | 41 | 46.3s | MEETS_ALL_SWEEP_FLOOR |
| 4 | 1234 | died | 164s | 0 | 106 | 73s | 0.00 | 47 | 54.0s | MEETS_ALL_SWEEP_FLOOR |
| 4 | 3141 | died | 167s | 0 | 111 | 88s | 0.00 | 43 | 49.7s | MEETS_ALL_SWEEP_FLOOR |
| 4 | 6060 | died | 146s | 0 | 88 | 77s | 0.00 | 46 | 53.5s | MEETS_ALL_SWEEP_FLOOR |
| 5 | 1234 | died | 140s | 0 | 130 | 54s | 0.00 | 57 | 49.5s | MEETS_ALL_SWEEP_FLOOR |
| 5 | 3141 | died | 152s | 0 | 140 | 66s | 0.00 | 67 | 48.8s | MEETS_ALL_SWEEP_FLOOR |
| 5 | 6060 | died | 156s | 0 | 151 | 71s | 0.00 | 52 | 48.0s | MEETS_ALL_SWEEP_FLOOR |
| 6 | 1234 | died | 160s | 0 | 71 | 69s | 0.00 | 39 | 49.6s | MEETS_ALL_SWEEP_FLOOR |
| 6 | 3141 | died | 169s | 0 | 83 | 57s | 0.00 | 38 | 55.8s | MEETS_ALL_SWEEP_FLOOR |
| 6 | 6060 | died | 127s | 0 | 38 | 72s | 0.00 | 38 | 49.5s | MEETS_ALL_SWEEP_FLOOR |
| 7 | 1234 | died | 138s | 0 | 98 | 73s | 0.00 | 53 | 43.2s | MEETS_ALL_SWEEP_FLOOR |
| 7 | 3141 | died | 169s | 0 | 136 | 51s | 0.00 | 57 | 49.4s | MEETS_ALL_SWEEP_FLOOR |
| 7 | 6060 | died | 132s | 0 | 86 | 61s | 0.00 | 58 | 50.6s | MEETS_ALL_SWEEP_FLOOR |
| 8 | 1234 | died | 133s | 0 | 86 | 56s | 0.00 | 37 | 47.2s | MEETS_ALL_SWEEP_FLOOR |
| 8 | 3141 | died | 154s | 0 | 107 | 58s | 0.00 | 41 | 48.0s | MEETS_ALL_SWEEP_FLOOR |
| 8 | 6060 | died | 152s | 0 | 108 | 60s | 0.00 | 34 | 49.8s | MEETS_ALL_SWEEP_FLOOR |
| 9 | 1234 | died | 114s | 0 | 63 | 55s | 0.00 | 68 | 49.0s | MEETS_ALL_SWEEP_FLOOR |
| 9 | 3141 | died | 116s | 0 | 66 | 51s | 0.00 | 58 | 43.1s | MEETS_ALL_SWEEP_FLOOR |
| 9 | 6060 | died | 109s | 0 | 57 | 49s | 0.00 | 66 | 48.0s | MEETS_ALL_SWEEP_FLOOR |
| 10 | 1234 | died | 110s | 0 | 72 | 59s | 0.00 | 75 | 44.5s | MEETS_ALL_SWEEP_FLOOR |
| 10 | 3141 | died | 139s | 0 | 122 | 50s | 0.00 | 72 | 51.1s | MEETS_ALL_SWEEP_FLOOR |
| 10 | 6060 | died | 106s | 0 | 69 | 54s | 0.00 | 77 | 48.2s | MEETS_ALL_SWEEP_FLOOR |
| 11 | 1234 | died | 96s | 0 | 59 | 51s | 0.00 | 81 | 47.5s | MEETS_ALL_SWEEP_FLOOR |
| 11 | 3141 | died | 121s | 0 | 116 | 49s | 0.00 | 84 | 49.6s | MEETS_ALL_SWEEP_FLOOR |
| 11 | 6060 | died | 91s | 0 | 55 | 48s | 0.00 | 77 | 42.4s | MEETS_ALL_SWEEP_FLOOR |
| 12 | 1234 | died | 154s | 0 | 65 | - | - | 53 | 52.2s | COMPARATOR_REQUIRED |
| 12 | 3141 | died | 184s | 0 | 87 | - | - | 55 | 45.9s | COMPARATOR_REQUIRED |
| 12 | 6060 | died | 104s | 0 | 24 | - | - | 42 | 35.5s | COMPARATOR_REQUIRED |
| 13 | 1234 | died | 91s | 0 | 43 | 53s | 0.00 | 75 | 45.5s | MEETS_ALL_SWEEP_FLOOR |
| 13 | 3141 | died | 82s | 0 | 35 | 49s | 0.00 | 66 | 51.3s | MEETS_ALL_SWEEP_FLOOR |
| 13 | 6060 | died | 87s | 0 | 33 | 51s | 0.00 | 69 | 46.5s | MEETS_ALL_SWEEP_FLOOR |

## Current findings

- Hard invariant violations: 3
- Runs meeting the all-Sweep failure floor: 30
- Round 12 runs awaiting a competent-strategy comparator: 3

A violation is a measured balance finding, not a test-runner failure. Parameter tuning should reduce violations without silently regenerating acceptance criteria.
