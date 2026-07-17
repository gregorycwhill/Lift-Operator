# Campaign Balance Envelope

Balance version: `0.1.1-round-3-pressure`

| Round | Classification | Sweep survival | Strong survival | Sweep time | Strong time | Arrival | Delivery | Utilisation | Queue trend |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2 | UNDERLOADED | 1/3 | 0/3 | 174s | 156s | 0.60 | 0.32 | 1.90 | 0.28 |
| 3 | CONTESTED | 0/3 | 3/3 | 153s | 180s | 1.09 | 0.61 | 1.81 | 0.48 |
| 4 | UNDERLOADED | 3/3 | 2/3 | 180s | 162s | 0.89 | 0.63 | 1.41 | 0.26 |
| 5 | UNDERLOADED | 3/3 | 2/3 | 180s | 178s | 1.03 | 0.81 | 1.27 | 0.22 |
| 6 | UNPROVEN | 0/3 | 0/3 | 120s | 115s | 1.14 | 0.46 | 2.69 | 0.68 |
| 7 | UNPROVEN | 0/3 | 0/3 | 146s | 120s | 1.31 | 0.73 | 1.81 | 0.58 |
| 8 | UNPROVEN | 0/3 | 0/3 | 146s | 129s | 1.10 | 0.69 | 1.61 | 0.42 |
| 9 | UNPROVEN | 0/3 | 0/3 | 113s | 99s | 1.37 | 0.55 | 2.47 | 0.81 |
| 10 | UNPROVEN | 0/3 | 0/3 | 118s | 102s | 1.62 | 0.73 | 2.26 | 0.89 |
| 11 | UNPROVEN | 0/3 | 0/3 | 103s | 96s | 1.85 | 0.73 | 2.63 | 1.12 |
| 12 | UNPROVEN | 0/3 | 0/3 | 94s | 86s | 2.13 | 0.72 | 3.00 | 1.41 |
| 13 | UNPROVEN | 0/3 | 0/3 | 87s | 85s | 1.62 | 0.43 | 3.79 | 1.19 |

The candidate strong comparator is an omniscient direct dispatcher. Where it fails to outperform Sweep, the round is Unproven rather than Overloaded; direct dispatch loses en-route pickup efficiency and is not yet a credible feasibility bound.
