# All-Sweep Balance Baseline

Balance version: `0.1.0-stabilized`  
Policy: Every lift uses Sweep; no manual targets, policy changes, or power-ups.

| Round | Seed | Outcome | Elapsed | Lives | Served | First peril | Min SI | Peak queue | P90 journey | Classification |
| ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 2 | 1234 | died | 176s | 0 | 56 | 89s | 0.00 | 28 | 53.1s | VIOLATION_FAILURE_TIMING |
| 2 | 3141 | died | 167s | 0 | 49 | 70s | 0.00 | 30 | 53.7s | VIOLATION_FAILURE_TIMING |
| 2 | 6060 | survived | 180s | 3 | 61 | 57s | 0.41 | 25 | 55.3s | VIOLATION_SURVIVED |
| 3 | 1234 | survived | 180s | 12 | 108 | 94s | 0.58 | 28 | 51.7s | VIOLATION_SURVIVED |
| 3 | 3141 | survived | 180s | 17 | 94 | - | - | 23 | 38.0s | VIOLATION_SURVIVED |
| 3 | 6060 | survived | 180s | 19 | 104 | - | - | 18 | 48.2s | VIOLATION_SURVIVED |
| 4 | 1234 | survived | 180s | 18 | 120 | - | - | 26 | 42.0s | VIOLATION_SURVIVED |
| 4 | 3141 | survived | 180s | 11 | 109 | 110s | 0.58 | 32 | 51.1s | VIOLATION_SURVIVED |
| 4 | 6060 | survived | 180s | 4 | 109 | 63s | 0.44 | 35 | 53.9s | VIOLATION_SURVIVED |
| 5 | 1234 | survived | 180s | 20 | 147 | - | - | 28 | 43.9s | VIOLATION_SURVIVED |
| 5 | 3141 | survived | 180s | 18 | 144 | 114s | 0.92 | 29 | 41.5s | VIOLATION_SURVIVED |
| 5 | 6060 | survived | 180s | 17 | 149 | 116s | 0.85 | 25 | 40.6s | VIOLATION_SURVIVED |
| 6 | 1234 | died | 126s | 0 | 63 | 62s | 0.00 | 46 | 53.4s | MEETS_ALL_SWEEP_FLOOR |
| 6 | 3141 | died | 133s | 0 | 78 | 56s | 0.00 | 46 | 51.5s | MEETS_ALL_SWEEP_FLOOR |
| 6 | 6060 | died | 100s | 0 | 29 | 57s | 0.00 | 60 | 55.1s | MEETS_ALL_SWEEP_FLOOR |
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
| 12 | 1234 | died | 92s | 0 | 63 | - | - | 106 | 50.0s | COMPARATOR_REQUIRED |
| 12 | 3141 | died | 89s | 0 | 55 | - | - | 99 | 49.7s | COMPARATOR_REQUIRED |
| 12 | 6060 | died | 101s | 0 | 85 | - | - | 96 | 48.0s | COMPARATOR_REQUIRED |
| 13 | 1234 | died | 91s | 0 | 43 | 53s | 0.00 | 75 | 45.5s | MEETS_ALL_SWEEP_FLOOR |
| 13 | 3141 | died | 82s | 0 | 35 | 49s | 0.00 | 66 | 51.3s | MEETS_ALL_SWEEP_FLOOR |
| 13 | 6060 | died | 87s | 0 | 33 | 51s | 0.00 | 69 | 46.5s | MEETS_ALL_SWEEP_FLOOR |

## Current findings

- Hard invariant violations: 12
- Runs meeting the all-Sweep failure floor: 21
- Round 12 runs awaiting a competent-strategy comparator: 3

A violation is a measured balance finding, not a test-runner failure. Parameter tuning should reduce violations without silently regenerating acceptance criteria.
