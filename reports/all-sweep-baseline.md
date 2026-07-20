# All-Sweep Balance Baseline

Balance version: `0.2.6-playtest-remediation`
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
| 6 | 1234 | died | 178s | 0 | 93 | 69s | 0.00 | 33 | 51.3s | MEETS_ALL_SWEEP_FLOOR |
| 6 | 3141 | survived | 180s | 11 | 112 | 73s | 0.43 | 29 | 49.2s | VIOLATION_SURVIVED |
| 6 | 6060 | survived | 180s | 2 | 89 | 70s | 0.40 | 33 | 51.1s | VIOLATION_SURVIVED |
| 7 | 1234 | died | 144s | 0 | 113 | 99s | 0.00 | 40 | 45.6s | MEETS_ALL_SWEEP_FLOOR |
| 7 | 3141 | died | 168s | 0 | 142 | 51s | 0.00 | 51 | 50.2s | MEETS_ALL_SWEEP_FLOOR |
| 7 | 6060 | died | 148s | 0 | 122 | 62s | 0.00 | 43 | 43.4s | MEETS_ALL_SWEEP_FLOOR |
| 8 | 1234 | died | 160s | 0 | 122 | 56s | 0.00 | 31 | 52.8s | MEETS_ALL_SWEEP_FLOOR |
| 8 | 3141 | died | 146s | 0 | 100 | 58s | 0.00 | 32 | 45.9s | MEETS_ALL_SWEEP_FLOOR |
| 8 | 6060 | died | 138s | 0 | 91 | 60s | 0.00 | 38 | 49.2s | MEETS_ALL_SWEEP_FLOOR |
| 9 | 1234 | died | 138s | 0 | 85 | 54s | 0.00 | 86 | 49.1s | MEETS_ALL_SWEEP_FLOOR |
| 9 | 3141 | died | 144s | 0 | 82 | 51s | 0.00 | 95 | 45.2s | MEETS_ALL_SWEEP_FLOOR |
| 9 | 6060 | died | 143s | 0 | 91 | 51s | 0.00 | 84 | 41.1s | MEETS_ALL_SWEEP_FLOOR |
| 10 | 1234 | died | 109s | 0 | 87 | 59s | 0.00 | 54 | 46.9s | MEETS_ALL_SWEEP_FLOOR |
| 10 | 3141 | died | 140s | 0 | 126 | 74s | 0.00 | 59 | 51.4s | MEETS_ALL_SWEEP_FLOOR |
| 10 | 6060 | died | 118s | 0 | 93 | 54s | 0.00 | 51 | 49.3s | MEETS_ALL_SWEEP_FLOOR |
| 11 | 1234 | died | 109s | 0 | 92 | 51s | 0.00 | 65 | 49.6s | MEETS_ALL_SWEEP_FLOOR |
| 11 | 3141 | died | 127s | 0 | 125 | 49s | 0.00 | 71 | 46.8s | MEETS_ALL_SWEEP_FLOOR |
| 11 | 6060 | died | 100s | 0 | 79 | 49s | 0.00 | 62 | 48.3s | MEETS_ALL_SWEEP_FLOOR |
| 12 | 1234 | died | 161s | 0 | 117 | - | - | 75 | 44.8s | COMPARATOR_REQUIRED |
| 12 | 3141 | died | 150s | 0 | 105 | - | - | 71 | 37.4s | COMPARATOR_REQUIRED |
| 12 | 6060 | died | 161s | 0 | 116 | - | - | 73 | 52.2s | COMPARATOR_REQUIRED |
| 13 | 1234 | died | 118s | 0 | 62 | 59s | 0.00 | 51 | 52.9s | MEETS_ALL_SWEEP_FLOOR |
| 13 | 3141 | died | 120s | 0 | 70 | 60s | 0.00 | 44 | 46.8s | MEETS_ALL_SWEEP_FLOOR |
| 13 | 6060 | died | 109s | 0 | 51 | 50s | 0.00 | 55 | 51.6s | MEETS_ALL_SWEEP_FLOOR |

## Current findings

- Hard invariant violations: 5
- Runs meeting the all-Sweep failure floor: 28
- Round 12 runs awaiting a competent-strategy comparator: 3

A violation is a measured balance finding, not a test-runner failure. Parameter tuning should reduce violations without silently regenerating acceptance criteria.
