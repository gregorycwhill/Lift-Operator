// GENERATED FILE - DO NOT EDIT.
// Source: design/game-balance.v1.json
// Balance version: 0.2.10-fleet-onboarding
window.GameBalanceData = {
  "balanceVersion": "0.2.10-fleet-onboarding",
  "events": {
    "jam": {
      "introducedRound": 6
    },
    "checkout": {
      "introducedRound": 7
    },
    "vip": {
      "introducedRound": 8
    },
    "rooftop": {
      "introducedRound": 9
    },
    "stink": {
      "introducedRound": 9
    },
    "gym": {
      "introducedRound": 11
    },
    "roomService": {
      "introducedRound": 3
    }
  },
  "payouts": {
    "standard": {
      "pointsPerGuest": 1,
      "remainingTimeIntervalSec": 10,
      "creditMultiplier": 0.1
    },
    "endurance": {
      "survivalIntervalSec": 30,
      "serviceIntervalGuests": 10,
      "creditMultiplier": 1,
      "cap": 50
    }
  },
  "shopUnlocks": {
    "wrench": [
      6,
      6,
      12
    ],
    "freshener": [
      9,
      9,
      12
    ],
    "musak": [
      8,
      8,
      12
    ],
    "turbo": [
      7,
      7,
      12
    ],
    "tardis": [
      10,
      10,
      12
    ],
    "doors": [
      3,
      4,
      12
    ],
    "groupThink": [
      10,
      10,
      12
    ],
    "doubleDecker": [
      11,
      11,
      12
    ],
    "openPlan": [
      22,
      22,
      22
    ]
  },
  "automationUnlocks": {
    "manual": 1,
    "sweep": 2,
    "priority": 4,
    "voting": 5,
    "weighted-voting": 5,
    "custom": 10
  },
  "achievements": {
    "service": {
      "id": "service",
      "name": "Service Award",
      "desc": "Safely deliver heavy passenger guest volumes inside a single round.",
      "bronze": {
        "label": "Bronze Fish",
        "req": 10,
        "icon": "🟫🐟",
        "reward": 2
      },
      "silver": {
        "label": "Silver Fish",
        "req": 30,
        "icon": "⬜🐟",
        "reward": 5
      },
      "gold": {
        "label": "Gold Fish",
        "req": 50,
        "icon": "🟨🐟",
        "reward": 10
      }
    },
    "handsfree": {
      "id": "handsfree",
      "name": "Hands-Free Inventor",
      "desc": "Operate automated transit routines without manual click adjustments.",
      "bronze": {
        "label": "Bronze Automation",
        "req": 2,
        "icon": "🟫🤖",
        "reward": 2
      },
      "silver": {
        "label": "Silver Automation",
        "req": 6,
        "icon": "⬜🤖",
        "reward": 5
      },
      "gold": {
        "label": "Gold Automation",
        "req": 9,
        "icon": "🟨🤖",
        "reward": 10
      }
    },
    "sardine": {
      "id": "sardine",
      "name": "Sardine Packer",
      "desc": "Deliver fully loaded lifts packed perfectly to maximum capacity weight.",
      "bronze": {
        "label": "Bronze Packer",
        "req": 1,
        "icon": "🟫📦",
        "reward": 2
      },
      "silver": {
        "label": "Silver Packer",
        "req": 3,
        "icon": "⬜📦",
        "reward": 5
      },
      "gold": {
        "label": "Gold Packer",
        "req": 5,
        "icon": "🟨📦",
        "reward": 10
      }
    },
    "hacker": {
      "id": "hacker",
      "name": "Hacker Award",
      "desc": "Optimise custom logic to run for thousands of simulation cycles.",
      "bronze": {
        "label": "Bronze Logic",
        "req": 500,
        "icon": "🟫⌨️",
        "reward": 2
      },
      "silver": {
        "label": "Silver Logic",
        "req": 5000,
        "icon": "⬜⌨️",
        "reward": 5
      },
      "gold": {
        "label": "Master Coder",
        "req": 20000,
        "icon": "🟨⌨️",
        "reward": 10
      }
    },
    "parallel": {
      "id": "parallel",
      "name": "Parallel Universe",
      "desc": "Successfully bridge gaps between shafts using lateral transfer logic.",
      "bronze": {
        "label": "Bronze Bridge",
        "req": 1,
        "icon": "🟫↔️",
        "reward": 2
      },
      "silver": {
        "label": "Silver Bridge",
        "req": 10,
        "icon": "⬜↔️",
        "reward": 5
      },
      "gold": {
        "label": "Quantum Leap",
        "req": 25,
        "icon": "🟨↔️",
        "reward": 10
      }
    },
    "doubleup": {
      "id": "doubleup",
      "name": "Double Trouble",
      "desc": "Utilise double-decker infrastructure to move large volumes of people.",
      "bronze": {
        "label": "Bronze Deck",
        "req": 5,
        "icon": "🟫🚡",
        "reward": 2
      },
      "silver": {
        "label": "Silver Deck",
        "req": 15,
        "icon": "⬜🚡",
        "reward": 5
      },
      "gold": {
        "label": "Ocean Liner",
        "req": 40,
        "icon": "🟨🚡",
        "reward": 10
      }
    }
  },
  "powerups": {
    "wrench": {
      "tiers": [
        {
          "cost": 1,
          "duration": 0
        },
        {
          "cost": 3,
          "duration": 0
        },
        {
          "cost": 5,
          "duration": 60
        }
      ]
    },
    "freshener": {
      "tiers": [
        {
          "cost": 1,
          "duration": 15
        },
        {
          "cost": 3,
          "duration": 15
        },
        {
          "cost": 5,
          "duration": 30
        }
      ]
    },
    "musak": {
      "tiers": [
        {
          "cost": 1,
          "duration": 15
        },
        {
          "cost": 3,
          "duration": 15
        },
        {
          "cost": 5,
          "duration": 15
        }
      ]
    },
    "turbo": {
      "tiers": [
        {
          "cost": 1,
          "duration": 10,
          "scalar": 0.1
        },
        {
          "cost": 3,
          "duration": 15,
          "scalar": 0.05
        },
        {
          "cost": 5,
          "duration": 20,
          "scalar": 0.05
        }
      ]
    },
    "tardis": {
      "tiers": [
        {
          "cost": 1,
          "duration": 15,
          "scalar": 999
        },
        {
          "cost": 3,
          "duration": 15,
          "scalar": 999
        },
        {
          "cost": 5,
          "duration": 30,
          "scalar": 999
        }
      ]
    },
    "doors": {
      "tiers": [
        {
          "cost": 2,
          "duration": 20,
          "scalar": 0.5
        },
        {
          "cost": 4,
          "duration": 30,
          "scalar": 0.33
        },
        {
          "cost": 6,
          "duration": 30,
          "scalar": 0.05
        }
      ]
    },
    "groupThink": {
      "tiers": [
        {
          "cost": 2,
          "duration": 0
        },
        {
          "cost": 4,
          "duration": 0
        },
        {
          "cost": 6,
          "duration": 0
        }
      ]
    },
    "doubleDecker": {
      "tiers": [
        {
          "cost": 3,
          "duration": 30
        },
        {
          "cost": 5,
          "duration": 60
        },
        {
          "cost": 8,
          "duration": 45
        }
      ]
    },
    "openPlan": {
      "tiers": [
        {
          "cost": 4,
          "duration": 20
        },
        {
          "cost": 6,
          "duration": 45
        },
        {
          "cost": 10,
          "duration": 60
        }
      ]
    }
  },
  "system": {
    "showcaseLimit": 6,
    "lateralTolerance": 0.2,
    "maxSpawnDelaySec": 3,
    "vipArrivalDelayMinRatio": 0.25,
    "vipArrivalDelayMaxRatio": 0.35,
    "gravityFallbackScalar": 0.4,
    "roundTime": 180,
    "countdown": {
      "secondsPerLift": 3,
      "minimumSeconds": 5,
      "maximumSeconds": 30,
      "roundOverrides": {
        "2": 10
      }
    },
    "startingLives": 20,
    "liftCapacity": 10,
    "liftSpeedSec": 0.5,
    "doorSpeedSec": 0.5,
    "boardSpeedSec": 0.5,
    "roomServiceChance": 0.05,
    "vipPenalty": 10,
    "jam": {
      "chancePerSec": 0.005,
      "minSec": 10,
      "maxSec": 20
    },
    "stink": {
      "chancePerSec": 0.005,
      "durationSec": 20,
      "gymBroThreshold": 3
    },
    "checkoutChance": 0.5,
    "sunset": {
      "minSec": 30,
      "maxSec": 90,
      "durationSec": 90,
      "guestRatio": 0.5
    },
    "patience": {
      "happy": 20,
      "annoyed": 40,
      "critical": 60,
      "rage": 80
    }
  },
  "rounds": {
    "1": {
      "floors": 10,
      "lifts": 1,
      "liftCapacity": 15,
      "spawnStart": 0.15,
      "spawnEnd": 0.3,
      "objective": "SURVIVAL",
      "gravityScalar": 0,
      "activeChallenges": [],
      "briefing": {
        "title": "First Shift",
        "teaching": "Manual shaft control; red guests cost lives; boarding and alighting take time.",
        "emphasis": "Basic mixed destinations."
      }
    },
    "2": {
      "floors": 10,
      "lifts": 1,
      "liftCapacity": 15,
      "spawnStart": 0.27,
      "spawnEnd": 0.3375,
      "objective": "SURVIVAL",
      "gravityScalar": 0,
      "activeChallenges": [],
      "briefing": {
        "title": "Let It Sweep",
        "teaching": "Sweep automation and the Automation Dock.",
        "emphasis": "One lift; learn to deploy automation during the extended countdown."
      }
    },
    "3": {
      "floors": 10,
      "lifts": 2,
      "liftCapacity": 15,
      "spawnStart": 1,
      "spawnEnd": 1.3,
      "objective": "SURVIVAL",
      "gravityScalar": 0,
      "activeChallenges": [
        "roomService"
      ],
      "briefing": {
        "title": "Rush Delivery",
        "teaching": "A second lift and Room Service carts.",
        "emphasis": "Heavy Room Service deliveries amid rising ordinary demand."
      }
    },
    "4": {
      "floors": 10,
      "lifts": 2,
      "spawnStart": 0.99,
      "spawnEnd": 1.17,
      "objective": "SURVIVAL",
      "gravityScalar": 0,
      "activeChallenges": [
        "roomService"
      ],
      "briefing": {
        "title": "Triage Protocol",
        "teaching": "Priority Sweep.",
        "emphasis": "Rescue Critical guests without abandoning the rest of the hotel."
      }
    },
    "5": {
      "floors": 10,
      "lifts": 3,
      "spawnStart": 1.47,
      "spawnEnd": 1.8,
      "objective": "SURVIVAL",
      "gravityScalar": 0,
      "activeChallenges": [
        "roomService"
      ],
      "briefing": {
        "title": "Democracy",
        "teaching": "Voting and Weighted Voting.",
        "emphasis": "Allocate three lifts across competing queue concentrations."
      }
    },
    "6": {
      "floors": 15,
      "lifts": 3,
      "spawnStart": 1.2,
      "spawnEnd": 1.5,
      "objective": "SURVIVAL",
      "gravityScalar": 0,
      "activeChallenges": [
        "roomService",
        "jam"
      ],
      "briefing": {
        "title": "Maintenance Crisis",
        "teaching": "Wrench and jam recovery.",
        "emphasis": "Jams create temporary fleet gaps across fifteen floors."
      }
    },
    "7": {
      "floors": 15,
      "lifts": 4,
      "spawnStart": 1.25,
      "spawnEnd": 1.4,
      "objective": "SURVIVAL",
      "gravityScalar": 0,
      "activeChallenges": [
        "roomService",
        "checkout",
        "jam"
      ],
      "briefing": {
        "title": "Checkout Rush",
        "teaching": "Checkout routing and Turbo.",
        "emphasis": "A probabilistic share of guests needs Ground; retain ordinary service."
      }
    },
    "8": {
      "floors": 15,
      "lifts": 4,
      "spawnStart": 1,
      "spawnEnd": 1.25,
      "objective": "SURVIVAL",
      "gravityScalar": 0,
      "activeChallenges": [
        "roomService",
        "vip",
        "jam"
      ],
      "briefing": {
        "title": "VIP Security",
        "teaching": "VIP rules and Musak.",
        "emphasis": "A Happy VIP makes three timed legs and takes priority when boardable."
      }
    },
    "9": {
      "floors": 15,
      "lifts": 5,
      "liftCapacity": 20,
      "spawnStart": 1,
      "spawnEnd": 1.7,
      "objective": "SURVIVAL",
      "gravityScalar": 0,
      "activeChallenges": [
        "roomService",
        "rooftop",
        "jam"
      ],
      "briefing": {
        "title": "Happy Hour",
        "teaching": "Rooftop Party and Freshener.",
        "emphasis": "Rooftop demand changes traffic; Jams remain active."
      }
    },
    "10": {
      "floors": 15,
      "lifts": 5,
      "spawnStart": 1.5,
      "spawnEnd": 1.75,
      "objective": "SURVIVAL",
      "gravityScalar": 0,
      "activeChallenges": [
        "roomService",
        "checkout",
        "vip",
        "jam",
        "stink"
      ],
      "briefing": {
        "title": "Workshop Under Pressure",
        "teaching": "Custom Workshop scripts, TARDIS, and Group Think.",
        "emphasis": "Checkout, VIP, Jams, and Stink combine with Room Service."
      }
    },
    "11": {
      "floors": 15,
      "lifts": 5,
      "spawnStart": 1.75,
      "spawnEnd": 2,
      "objective": "SURVIVAL",
      "gravityScalar": 0,
      "activeChallenges": [
        "roomService",
        "gym",
        "rooftop",
        "jam",
        "stink"
      ],
      "briefing": {
        "title": "Heavy Lifting",
        "teaching": "Gym Bros and Double-Decker.",
        "emphasis": "Gym Bros, Rooftop traffic, Jams, and Stink test capacity decisions."
      }
    },
    "12": {
      "floors": 15,
      "lifts": 4,
      "spawnStart": 0.5,
      "spawnEnd": 2.6,
      "objective": "ENDURANCE",
      "gravityScalar": 0,
      "activeChallenges": [
        "roomService",
        "gym",
        "rooftop",
        "vip",
        "jam",
        "stink",
        "endurance"
      ],
      "briefing": {
        "title": "Endurance Operations",
        "teaching": "Endurance scoring and higher-tier resources.",
        "emphasis": "No completion timer: survive a multi-event hotel until all lives are lost."
      }
    },
    "13": {
      "floors": 15,
      "lifts": 4,
      "spawnStart": 0.9,
      "spawnEnd": 1.05,
      "objective": "PEDAL_SURVIVAL",
      "gravityScalar": 1.12,
      "activeChallenges": [
        "roomService",
        "gym",
        "gravity",
        "jam",
        "stink"
      ],
      "briefing": {
        "title": "Pedal Power",
        "teaching": "Gravity-aware dispatch.",
        "emphasis": "Heavy upward cars slow down while Room Service, Gym Bros, Jams, and Stink persist."
      }
    },
    "14": {
      "floors": 20,
      "lifts": 5,
      "spawnStart": 1.5,
      "spawnEnd": 1.9,
      "objective": "SURVIVAL",
      "gravityScalar": 0,
      "creditMultiplier": 0.15,
      "zoningEnabled": true,
      "activeChallenges": [
        "roomService",
        "gym",
        "checkout",
        "vip",
        "jam",
        "stink",
        "zoning"
      ],
      "briefing": {
        "title": "Split-Level Service",
        "teaching": "Service Zoning; Zoned Low and Zoned High.",
        "emphasis": "Zoning begins amid Checkout, VIP, Gym Bros, Jams, and Stink."
      }
    },
    "15": {
      "floors": 20,
      "lifts": 6,
      "spawnStart": 1.55,
      "spawnEnd": 2,
      "objective": "SURVIVAL",
      "gravityScalar": 0,
      "creditMultiplier": 0.15,
      "zoningEnabled": true,
      "vipEvent": true,
      "rooftopEvent": true,
      "activeChallenges": [
        "roomService",
        "gym",
        "rooftop",
        "vip",
        "jam",
        "stink",
        "zoning"
      ],
      "briefing": {
        "title": "VIP Rooftop Gala",
        "teaching": "Scale zoning to six lifts.",
        "emphasis": "Rooftop demand and VIP traffic share a zoned fleet."
      }
    },
    "16": {
      "floors": 20,
      "lifts": 6,
      "spawnStart": 1.6,
      "spawnEnd": 2.1,
      "objective": "SURVIVAL",
      "gravityScalar": 0,
      "creditMultiplier": 0.15,
      "zoningEnabled": true,
      "jamEvent": true,
      "stinkEvent": true,
      "activeChallenges": [
        "roomService",
        "gym",
        "checkout",
        "vip",
        "jam",
        "stink",
        "zoning"
      ],
      "briefing": {
        "title": "Maintenance Blackout",
        "teaching": "Overlapping zone recovery.",
        "emphasis": "Checkout, VIP, Jams, and Stink stress six-lift resilience."
      }
    },
    "17": {
      "floors": 25,
      "lifts": 6,
      "spawnStart": 1.65,
      "spawnEnd": 2.2,
      "objective": "SURVIVAL",
      "gravityScalar": 0,
      "creditMultiplier": 0.15,
      "zoningEnabled": true,
      "checkoutEvent": true,
      "activeChallenges": [
        "roomService",
        "gym",
        "rooftop",
        "vip",
        "jam",
        "stink",
        "zoning"
      ],
      "briefing": {
        "title": "Rooftop Express",
        "teaching": "Express coverage across twenty-five floors.",
        "emphasis": "Rooftop and VIP pressure, plus Jams/Stink, require legible zones."
      }
    },
    "18": {
      "floors": 25,
      "lifts": 7,
      "spawnStart": 1.7,
      "spawnEnd": 2.3,
      "objective": "SURVIVAL",
      "gravityScalar": 0,
      "creditMultiplier": 0.15,
      "zoningEnabled": true,
      "vipEvent": true,
      "rooftopEvent": true,
      "stinkEvent": true,
      "gymEvent": true,
      "activeChallenges": [
        "roomService",
        "gym",
        "checkout",
        "vip",
        "jam",
        "stink",
        "zoning"
      ],
      "briefing": {
        "title": "Festival Weekend",
        "teaching": "Exception-safe zoning.",
        "emphasis": "Checkout, VIP, Gym Bros, Jams, and Stink interact at scale."
      }
    },
    "19": {
      "floors": 30,
      "lifts": 8,
      "spawnStart": 1.75,
      "spawnEnd": 2.4,
      "objective": "SURVIVAL",
      "gravityScalar": 0,
      "creditMultiplier": 0.15,
      "zoningEnabled": true,
      "vipEvent": true,
      "rooftopEvent": true,
      "stinkEvent": true,
      "gymEvent": true,
      "activeChallenges": [
        "roomService",
        "gym",
        "rooftop",
        "vip",
        "jam",
        "stink",
        "zoning"
      ],
      "briefing": {
        "title": "The Vertical City",
        "teaching": "Eight-lift zone architecture.",
        "emphasis": "Rooftop/VIP demand, Gym Bros, Jams, and Stink across thirty floors."
      }
    },
    "20": {
      "floors": 30,
      "lifts": 10,
      "spawnStart": 1.8,
      "spawnEnd": 2.5,
      "objective": "SURVIVAL",
      "gravityScalar": 0,
      "zoningEnabled": true,
      "vipEvent": true,
      "rooftopEvent": true,
      "stinkEvent": true,
      "gymEvent": true,
      "activeChallenges": [
        "roomService",
        "gym",
        "checkout",
        "vip",
        "jam",
        "stink",
        "zoning"
      ],
      "briefing": {
        "title": "Grand Hotel Network",
        "teaching": "Ten-lift fleet management.",
        "emphasis": "Checkout/VIP demand, Gym Bros, Jams, and Stink in the largest conventional fleet."
      }
    },
    "21": {
      "floors": 11,
      "lifts": 2,
      "spawnStart": 0.25,
      "spawnEnd": 0.4,
      "objective": "SURVIVAL",
      "gravityScalar": 0,
      "creditMultiplier": 0.15,
      "counterweightEnabled": true,
      "counterweightIntro": true,
      "activeChallenges": [
        "counterweights",
        "jam",
        "stink"
      ],
      "briefing": {
        "title": "Counterweight Basics",
        "teaching": "Adjacent lifts move in opposite directions.",
        "emphasis": "A low-pressure pair puzzle with only Jams and Stink as hazards."
      }
    },
    "22": {
      "floors": 15,
      "lifts": 4,
      "spawnStart": 0.55,
      "spawnEnd": 0.75,
      "objective": "SURVIVAL",
      "gravityScalar": 0,
      "creditMultiplier": 0.15,
      "counterweightEnabled": true,
      "openPlanIntro": true,
      "activeChallenges": [
        "gym",
        "counterweights",
        "jam",
        "stink",
        "openPlan"
      ],
      "briefing": {
        "title": "Counterweight Crossovers",
        "teaching": "Open Plan transfers.",
        "emphasis": "Four paired lifts; Gym Bros, Jams, and Stink complicate passenger placement."
      }
    },
    "23": {
      "floors": 29,
      "lifts": 8,
      "spawnStart": 0.95,
      "spawnEnd": 1.2,
      "objective": "SURVIVAL",
      "gravityScalar": 0,
      "creditMultiplier": 0.15,
      "counterweightEnabled": true,
      "zoningEnabled": true,
      "openPlanIntro": true,
      "activeChallenges": [
        "roomService",
        "gym",
        "vip",
        "counterweights",
        "jam",
        "stink",
        "zoning",
        "openPlan"
      ],
      "briefing": {
        "title": "Counterweight Network",
        "teaching": "Counterweights, Zoning, and Open Plan at fleet scale.",
        "emphasis": "Room Service, VIP, Gym Bros, Jams, and Stink in an eight-lift network."
      }
    },
    "24": {
      "floors": 15,
      "lifts": 10,
      "liftCapacity": 1,
      "spawnStart": 2.8,
      "spawnEnd": 3.6,
      "objective": "SURVIVAL",
      "gravityScalar": 0,
      "creditMultiplier": 0.15,
      "capsuleMode": true,
      "capsuleTravelSecPerFloor": 0.2,
      "jamMinSec": 6,
      "jamMaxSec": 10,
      "demandCurrents": 2,
      "activeChallenges": [
        "vip",
        "capsule",
        "jam"
      ],
      "briefing": {
        "title": "SciiFi Dispatch",
        "teaching": "Single-person capsule lifts and demand currents.",
        "emphasis": "VIP pressure and short Jams; automations must manage ten capsules."
      }
    },
    "25": {
      "floors": 30,
      "lifts": 20,
      "liftCapacity": 1,
      "spawnStart": 4,
      "spawnEnd": 5,
      "objective": "SURVIVAL",
      "gravityScalar": 0,
      "creditMultiplier": 0.15,
      "capsuleMode": true,
      "capsuleTravelSecPerFloor": 0.2,
      "jamMinSec": 6,
      "jamMaxSec": 10,
      "demandCurrents": 2.5,
      "activeChallenges": [
        "rooftop",
        "vip",
        "capsule",
        "jam",
        "zoning"
      ],
      "briefing": {
        "title": "SciiFi Overdrive",
        "teaching": "Twenty-capsule automation fleet.",
        "emphasis": "Rooftop, VIP, Zoning, and short Jams combine under changing demand."
      }
    }
  }
};
