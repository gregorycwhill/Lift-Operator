# Lift Operator — Target Game Play Map

**Document role:** Authored round progression, learning arc, and candidate tuning intent
**Campaign scope:** 25 implemented authored rounds; tuning remains evidence-led
**Status:** Active product design reference; not a delivery-status or test-evidence record
**Owner class:** Product and design
**Last reviewed:** 1 August 2026
**Companion documents:** `Lift-Operator_GDD.md`, `Game Economy.md`, `BALANCE_WORKFLOW.md`

**Authority boundary:** This map describes intended progression and candidate tuning. Canonical numerical values live in
`design/game-balance.v1.json`; current implementation status belongs in `DELIVERY_PLAN.md`, and acceptance evidence
belongs in `TEST_PLAN.md`.

## 1. How to use this document

This map defines what each round is trying to teach and the parameter direction required to create that experience.

Values are divided into:

- **Structural targets:** intended campaign shape and mechanic sequence.
- **Initial tuning candidates:** starting numbers to test, not final balance.
- **Success measures:** evidence used to decide whether tuning worked.

The approved structured version of this map should eventually generate the round section of `config.js`. Canonical
numbers live in `design/game-balance.v1.json`; current delivery evidence belongs in `TEST_PLAN.md`.

## 2. Campaign rhythm

| Act | Rounds | Player experience | Failure expectation |
| --- | --- | --- | --- |
| Act I — Arcade Operator | 1–3 | Direct control, speed, novelty, immediate feedback | R1 rare; R2 low; R3 first credible failure |
| Act II — Automation Manager | 4–6 | Policy choice, triage, redundancy, tactical power-ups | One or two retries at major walls |
| Act III — Systems Director | 7–9 | Traffic topology, specialization, interacting hazards | Failure should reveal allocation/timing errors |
| Act IV — Automation Engineer | 10–11 | Customization, loadout planning, complex bottlenecks | Expected retries and strategy revision |
| Act V — Master Operator | 12–13 | Known systems recombined under resource constraints | Mastery walls; success should feel earned |

## 3. Progression rules

1. Introduce one primary problem per round.
2. Introduce a tool close to its problem, but do not make it the only answer.
3. Give every new concept a later pressure test.
4. Reduce new mechanics as interaction depth increases.
5. Ensure the player can describe why they failed.
6. Preserve the same seed on retry by default.
7. Do not require a purchase the player could not reasonably afford.
8. Avoid simultaneous random hazards that create unavoidable losses.
9. Every mastery wall must support multiple solution classes.
10. A new lift increases coordination complexity and should not coincide with too many other introductions.
11. Built-in automation is a force multiplier, never an autoplay button.
12. From Round 2 onward, unattended all-Sweep play with every lift on Sweep and no manual intervention, policy change,
    custom automation, or power-up must fail every fixed gate seed through Round 25.
13. Intended strategies must materially outperform all-Sweep through timely intervention, specialization, policy changes, or resource use.
14. Hands-Free completion is an advanced custom-automation mastery outcome; built-in automations never qualify.

### Round-start orientation contract

Every attempt begins with a visible countdown after the briefing closes: ten seconds in Round 2 to teach automation,
and five seconds in every other round. The round timer and guest spawning remain frozen, while lift automation controls
are usable. The countdown can be dismissed through its dedicated start-now control.

Teaching cues are transient rather than permanent HUD elements. When built-in automation first becomes available, its controls pulse in a friendly, colourful way. The same cue system must support first-use discovery of player-authored custom automation and automations shared with the player. Interaction acknowledges a cue so it does not repeatedly nag an established player.

Automation deployment follows a deliberate two-step pattern. When disarmed, select one or more lift controllers as a
batch; then click a carousel policy to arm it and assign it immediately. Alternatively, arm a policy first: lift
controllers glow for five seconds, and each clicked lift receives the armed policy. The policy remains armed until its
card is clicked again. Carousel scrolling previews only, and each lift continues to display its assigned policy as
compact status information. The carousel uses wide previous/next controls and a compact policy label; the Dock Library
button toggles the accordion library, whose panel closes with an icon-only `×` control.

Lift capacity appears as a floating effect above each lift during the countdown, then disappears. It reappears whenever effective capacity changes, including modifier activation and expiry. Normal play does not carry a permanent capacity label.

### All-Sweep behavioural floor

From Round 14 onward, welcome briefings identify every active challenge system so loadout choices are informed by
the actual round composition. Room Service guests are never Checkout guests; Gym Bros may board a stinky lift because
they are immune to stink.

The minimum competent automated behaviour is:

```text
Every available lift uses Sweep
No manual targeting
No automation changes
No power-ups
```

This baseline must not complete any fixed gate seed from Round 2 onward. It proves that the player must remain engaged
rather than select Automation once and watch the round complete.

This rule applies to built-in policies. From the custom-automation phase onward, a player-authored policy may complete an eligible round unattended and earn Hands-Free recognition because designing that policy is itself the player intervention and mastery challenge.

Failure timing still matters. Round 2 all-Sweep should fail late enough for Sweep's workload benefit to be obvious and
should be recoverable through a small number of perceptive manual interventions. Later rounds should defeat all-Sweep
through their specific, diagnosable bottleneck. Round 12 measures endurance duration: all-Sweep loses its twentieth life
before 240 seconds, while a competent strategy survives 240–480 seconds. Intended strategies must survive at least 80%
of their fixed seed set; remaining deterministic failures require trace and human-evidence review.

## 4. Mechanic introduction sequence

“Introduced” means explained and intentionally relevant. “Recombined” means previously learned behaviour becomes important again.
The table identifies teaching emphasis, not the complete event set active in a round.

### Active-challenge authority

The Game Play Map is the authoritative source for each authored round's active challenges. Every round must explicitly
list its active challenges in the round matrix below; an omitted challenge is inactive. Challenges do **not** inherit
merely because they were introduced in an earlier round. The canonical balance data, runtime event resolver, and
player briefing must be derived from this same matrix rather than maintaining separate eligibility or exclusion rules.

Checkout and Rooftop Party are mutually exclusive. Checkout remains a probabilistic share of otherwise ordinary guest
traffic; Rooftop Party redirects only its authored share. Room Service is never Checkout, Gym Bros are never Checkout,
and Gym Bros may board any stinky lift. This section supersedes the former persistent-event eligibility rule.

The matrix below is now the implemented authority. The generated balance artifact, runtime resolver, and briefing
composer must remain synchronized with it; changes to a round's active challenges require focused config, runtime, and
briefing tests before release.

### Active-challenge matrix

This is the approved authored schedule. `—` means the challenge is inactive in that round. The matrix is deliberately
explicit: it replaces inferred persistence and is the source from which canonical activation, round briefings, and
runtime behaviour must be derived.

| R | Room Service | Gym Bros | Checkout | Rooftop | VIP | Gravity | Counterweights | Capsule lifts | Jams | Stink | Zoning | Open Plan | Endurance |
| ---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | — | — | — | — | — | — | — | — | — | — | — | — | — |
| 2 | — | — | — | — | — | — | — | — | — | — | — | — | — |
| 3 | ✓ | — | — | — | — | — | — | — | — | — | — | — | — |
| 4 | ✓ | — | — | — | — | — | — | — | — | — | — | — | — |
| 5 | ✓ | — | — | — | — | — | — | — | — | — | — | — | — |
| 6 | ✓ | — | — | — | — | — | — | — | ✓ | — | — | — | — |
| 7 | ✓ | — | ✓ | — | — | — | — | — | ✓ | — | — | — | — |
| 8 | ✓ | — | — | — | ✓ | — | — | — | ✓ | — | — | — | — |
| 9 | ✓ | — | — | ✓ | — | — | — | — | ✓ | ✓ | — | — | — |
| 10 | ✓ | — | ✓ | — | ✓ | — | — | — | ✓ | ✓ | — | — | — |
| 11 | ✓ | ✓ | — | ✓ | — | — | — | — | ✓ | ✓ | — | — | — |
| 12 | ✓ | ✓ | — | ✓ | ✓ | — | — | — | ✓ | ✓ | — | — | ✓ |
| 13 | ✓ | ✓ | — | — | — | ✓ | — | — | ✓ | ✓ | — | — | — |
| 14 | ✓ | ✓ | ✓ | — | ✓ | — | — | — | ✓ | ✓ | ✓ | — | — |
| 15 | ✓ | ✓ | — | ✓ | ✓ | — | — | — | ✓ | ✓ | ✓ | — | — |
| 16 | ✓ | ✓ | ✓ | — | ✓ | — | — | — | ✓ | ✓ | ✓ | — | — |
| 17 | ✓ | ✓ | — | ✓ | ✓ | — | — | — | ✓ | ✓ | ✓ | — | — |
| 18 | ✓ | ✓ | ✓ | — | ✓ | — | — | — | ✓ | ✓ | ✓ | — | — |
| 19 | ✓ | ✓ | — | ✓ | ✓ | — | — | — | ✓ | ✓ | ✓ | — | — |
| 20 | ✓ | ✓ | ✓ | — | ✓ | — | — | — | ✓ | ✓ | ✓ | — | — |
| 21 | — | — | — | — | — | — | ✓ | — | ✓ | ✓ | — | — | — |
| 22 | — | ✓ | — | — | — | — | ✓ | — | ✓ | ✓ | — | ✓ | — |
| 23 | ✓ | ✓ | — | — | ✓ | — | ✓ | — | ✓ | ✓ | ✓ | ✓ | — |
| 24 | — | — | — | — | ✓ | — | — | ✓ | ✓ | — | — | — | — |
| 25 | — | — | — | ✓ | ✓ | — | — | ✓ | ✓ | — | ✓ | — | — |

Capsule rounds deliberately exclude Room Service and Gym Bros while retaining VIP pressure. Counterweight Round 21
is a restrained puzzle introduction; R22 adds Open Plan, and R23 is the scaled mastery combination. R25 is the
capsule finale, combining Rooftop, VIP, Jams, and Zoning.

| Mechanic | Introduce | First pressure test | Late mastery use |
| --- | ---: | ---: | ---: |
| Manual routing | 1 | 2 | Hybrid intervention throughout |
| Sweep | 2 | 3 | Directional/zoned roles |
| Room Service | 3 | 4 | 11 |
| Priority Sweep | 4 | 6 | 8, 11–13 |
| Voting | 5 | 7 | 9, 12 |
| Weighted Voting | 5 | 8 | 11–13 |
| Wrench | 6 | 6 | 9, 12–13 |
| Lift jams | 6 | 9 | 12–13 |
| Wide Doors | 3 | 4 | 9, 11–13 |
| Checkout funnel | 7 | 7 | 12 |
| Turbo | 7 | 8 | 9, 13 |
| VIP | 8 | 8 | 11–13 |
| Calming Musak | 8 | 8 | 9, 12–13 |
| Stink | 9 | 9 | 11–13 |
| Air Freshener | 9 | 9 | 11–13 |
| Rooftop event | 9 | 9 | 12 |
| Custom automation | 10 | 11 | 12–13 |
| TARDIS | 10 | 11 | 12–13 |
| Group Think | 10 | 12 | 12 |
| Gym Bros | 11 | 11 | 12–13 |
| Double-Decker | 11 | 13 | 13 |
| Endurance until death | 12 | 12 | — |
| Gravity | 13 | 13 | — |
| Open Plan | Round 22 (post-R20) | 22–23 | Timed adjacent-lift transfer; outside core 1–20 balance |

### Why Open Plan is outside the core 13-round balance

Open Plan is technically and cognitively complex and is not required to complete the intended arcade-to-automation arc.
It enters only after the R20 campaign in the authored Counterweight trilogy: R22 teaches timed lateral recovery and R23
combines it with zoning. It must remain unavailable to the core 1–20 balance until lateral transfer is reliable,
observable, and testable.

### Deferred advanced telemetry automation

Round 20+ content may expose underlying operational sensors such as arrival rate, delivery rate, queue growth, critical exposure, recent life-loss rate, and lift utilisation. Advanced players should initially construct their own survival forecast from those inputs rather than receive a ready-made Survival Index block.

This is not part of the current campaign. The Projected Survival Index used to tune Rounds 1–13 remains design-only and invisible to both players and automation policies.

## 5. Round summary

Initial numerical candidates are deliberately conservative. Spawn values use the current interpretation of expected spawn attempts per one-second spawner tick.

| R | Theme | Objective | Floors | Lifts | Spawn start→end | Primary introduction | Shop unlock |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- |
| 1 | First Shift | Survive 180s | 10 | 1 | 0.15→0.30 | Manual routing | None |
| 2 | Probation by Automation | Survive 180s | 10 | 1 | 0.60→0.75 | Sweep | None |
| 3 | Room Service, Going Up | Survive 180s | 10 | 2 | 1.00→1.20 | Room Service, lift roles | Wide Doors |
| 4 | Code Red | Survive 180s | 10 | 2 | 0.99→1.17 | Priority Sweep | Wide Doors T2 |
| 5 | The Guests Have Spoken | Survive 180s | 10 | 3 | 1.47→1.68 | Voting and Weighted Voting | None |
| 6 | Out of Service | Survive 180s | 15 | 3 | 1.00→1.20 | Lift jams, redundancy | Wrench |
| 7 | Everybody Out | Survive 150s | 12 | 4 | 1.00→1.30 | Ground-floor funnel | Turbo |
| 8 | The Important Guest | Survive 150s | 12 | 4 | 0.95→1.20 | VIP exclusivity | Musak |
| 9 | Party at the Top | Survive 180s | 15 | 5 | 1.10→1.40 | Stink and rooftop event | Freshener |
| 10 | Build It Yourself | Deliver 40 | 15 | 5 | 1.20→1.50 | Custom scripts | TARDIS, Group Think |
| 11 | Peak Performance | Survive 180s | 15 | 5 | 0.96→1.15 | Gym Bros and mixed weight | Double-Decker |
| 12 | The Longest Shift | Survive until 20 lives are lost | 15 | 4 | 0.80→1.00 | Resource endurance and recombination | Higher tiers |
| 13 | Uphill Battle | Deliver 50 | 15 | 5 | 1.20→1.55 | Gravity and load optimization | Full catalog |

These figures are the next accepted tuning targets where they differ from the current canonical balance; implementation
must update the canonical source and generated artifact together.

## 5.1 Player briefing contract

Every authored round has a rank, unique title, narrative briefing, learning focus, optional first-use rule card, and
active-challenge list before the player chooses a loadout. The narrative describes decision pressure without replacing
contractual rules. The following is the human authoring source; each record is transcribed into canonical round data and
`ui-briefing.js` is only the renderer.

| R | Rank | Player-facing title | Narrative briefing | Learning focus |
| ---: | --- | --- | --- | --- |
| 1 | Trainee | First Shift | Welcome to the Grand Hotel. Click a floor to send the lift, collect waiting guests and deliver them before their patience runs out. Boarding and alighting take time; guests who turn red are one bad wait away from costing you a life. | Manual shaft control; guest patience; boarding and alighting; mixed destinations. |
| 2 | Trainee | Probation by Automation | Management has installed an Automation Dock and confidently described it as “self-managing”. Use the extended countdown to deploy Sweep, then stay alert: automation can handle routine movement, but it cannot recognise every developing crisis for you. | Automation Dock; Sweep; automation as assistance rather than autoplay. |
| 3 | Operator | Room Service, Going Up | Your promotion comes with a second lift—and a procession of bulky Room Service carts. They are heavy and slow to board, so sending whichever car is nearest will not always work. Divide the workload and consider giving each lift a distinct role. | Second lift; Room Service; lift specialisation; Wide Doors. |
| 4 | Operator | Code Red | Dinner service is peaking and several guests are approaching breaking point. Priority Sweep can seek out Critical passengers, but rescuing every emergency while neglecting ordinary queues only creates the next emergency. | Priority Sweep; triage without starving routine service. |
| 5 | Operator | The Guests Have Spoken | Three lifts now serve floors that all believe their queue is the most important in the hotel. Voting responds to concentrated demand; Weighted Voting listens more closely to urgency. Decide how much democracy the transport system can withstand. | Voting; Weighted Voting; allocating policies across three lifts. |
| 6 | Manager | Out of Service | The maintenance budget has delivered its verdict: lifts can now jam. A disabled car leaves a hole in the fleet while queues continue to grow across fifteen floors. Use the Wrench, preserve redundancy and avoid plans that work only while everything works. | Jams; Wrench; redundancy and recovery. |
| 7 | Manager | Everybody Out | Checkout has begun. Many guests are funnelling toward Ground, but the rest of the hotel has not stopped moving just because reception is busy. Turbo can recover distance quickly; your real task is deciding which lifts serve the funnel and which preserve ordinary traffic. | Checkout traffic; directional funnels; Turbo. |
| 8 | Manager | The Important Guest | A VIP has arrived with an itinerary, a schedule and no interest in sharing a cabin. She takes priority when a suitable empty lift reaches her. Calming Musak may buy patience elsewhere while you provide the discreet three-leg service management promised. | VIP priority and empty-cabin rule; three-leg journey; Calming Musak. |
| 9 | Manager | Party at the Top | The rooftop bar has declared Happy Hour, pulling traffic sharply upward. Worse, one inconsiderate passenger can now contaminate a cabin so badly that most guests refuse to enter. Redirect the surge, quarantine bad air and deploy Air Freshener before one foul lift poisons the network. | Rooftop Party; Stink; Air Freshener; temporary traffic redirection. |
| 10 | Engineer | Build It Yourself | Standard policies have taken you this far. The Automation Workshop is now open, and management expects you to turn operational insight into actual logic. Build or adapt a custom policy while Checkout traffic, a VIP, breakdowns and contaminated cabins compete for attention. | Custom Workshop automation; TARDIS Mode; Group Think. |
| 11 | Engineer | Peak Performance | The hotel gym has launched a membership drive. Gym Bros are heavy, travel in awkward combinations and are strangely untroubled by foul-smelling lifts. With rooftop traffic adding vertical pressure, decide whether to separate heavy passengers, increase capacity or redesign the fleet’s work. | Gym Bros; mixed passenger weights; Double-Decker. |
| 12 | Engineer | The Longest Shift | There is no tidy finish tonight. Every familiar problem is active, resources are scarce and the only question is how long you can keep the Grand Hotel operating before the twentieth guest gives up spectacularly. Spend for endurance and turn inevitable defeat into a record shift. | Endurance scoring; higher-tier resources; death as the completion condition. |
| 13 | Engineer | Uphill Battle | Sustainability consultants have connected the lift system to pedal power. Heavy cars now climb more slowly, so filling every cabin is no longer automatically efficient. Balance load against upward travel while familiar carts, Gym Bros, jams and contaminated cabins test your command of the whole system. | Gravity; load versus upward speed; full-system optimisation. |
| 14 | Director | Divide and Conquer | The tower is now too large for every lift to serve every floor effectively. Service Zoning lets you assign Low and High service bands, reducing wasteful cross-building travel. Ground remains part of every zone, and a poor boundary can strand demand as effectively as no plan at all. | Service Zoning; Zoned Low; Zoned High; zone boundaries. |
| 15 | Director | The Sky Lounge Gala | A six-lift zoned fleet should have made tonight easy. Then the VIP booked the rooftop venue. Ordinary guests, heavy gym traffic and gala passengers now share the same architecture, so zones must concentrate service without becoming walls around the wrong demand. | Scaling zoning to six lifts; shared rooftop and VIP pressure. |
| 16 | Director | No Zone Is an Island | Maintenance failures are striking inside a carefully divided fleet. A perfect zone with one working lift is not a resilient zone. Build overlapping coverage, preserve recovery paths and keep Checkout traffic moving when a jam removes the car your plan depended on most. | Overlapping zones; resilient coverage; recovery design. |
| 17 | Director | Rooftop Express | Twenty-five floors now stand between the lobby and the party. The VIP expects priority, rooftop guests expect speed and everyone else expects not to be abandoned midway. Create local service and express coverage without allowing your fastest route to consume the whole fleet. | Express roles inside a zoned fleet; long-distance service. |
| 18 | Director | Festival Weekend | The city festival has filled every room, reception is buried in Checkout traffic and every operational exception has arrived at once. Your zones must survive VIP priority, heavy passengers, slow carts, breakdowns and contaminated cabins without collapsing into frantic manual rescue. | Exception-safe zoning; large-scale recombination. |
| 19 | Architect | The Vertical City | Thirty floors and eight lifts have turned the hotel into a small city standing on end. Local service, rooftop demand and VIP movement now require an architecture rather than a collection of settings. Design roles that remain legible when failures begin tearing holes in the plan. | Eight-lift zone architecture; legible fleet roles. |
| 20 | Architect | The Grand Network | This is the largest conventional lift system the Grand Hotel can build: ten cars serving a tower under full commercial pressure. Checkout, VIP priority, heavy traffic and failures will expose every vague assignment and duplicated role. Make the fleet behave like a network rather than ten lifts sharing a postcode. | Ten-lift conventional fleet mastery; whole-network design. |
| 21 | Executive | Joined at the Cable | Engineering has installed a counterweight pair. Move one lift upward and its neighbour moves down, whether that helps your plan or ruins it. The cabins remain independent, but a jam stops travel for the pair. Learn the geometry while demand is restrained and mistakes are still educational. | Counterweighted pairs; complementary motion; paired jam behaviour. |
| 22 | Executive | Meet in the Middle | Four paired lifts have created a passenger-placement problem: the right guest can easily end up in the wrong car. Open Plan temporarily permits destination-aware transfers between adjacent lifts stopped at the same floor. Use it to repair the network, not to avoid planning one. | Open Plan; timed adjacent-lift transfers; passenger redistribution. |
| 23 | Executive | The Entangled Hotel | The prototype is now an eight-lift counterweight network carrying real hotel traffic. Zoning determines where cars should serve; linked motion determines where they can be; Open Plan provides a brief chance to correct passenger placement. The laboratory conditions are officially over. | Counterweights, Zoning and Open Plan at fleet scale. |
| 24 | Commissioner | Welcome to the Future | The old shafts have been replaced by ten high-speed, single-passenger capsules. They cross the building quickly, but each carries only one guest, so manual control cannot keep pace with the demand currents for long. Dispatch through automation, protect VIP service and recover from frequent short jams. | Capsule lifts; single-passenger capacity; continuous demand currents. |
| 25 | Commissioner | Terminal Velocity | Twenty capsules. Thirty floors. One final live demonstration for the board. Demand shifts between ordinary travel, VIP movements and rooftop surges, while zoning must give the fleet enough structure to respond without becoming rigid. You began by clicking one lift; now design the nervous system of an entire building. | Twenty-capsule fleet mastery; capsule zoning; final campaign synthesis. |

| Before round | New rank | Promotion copy |
| ---: | --- | --- |
| 1 | Trainee | **Appointment — Trainee** · Welcome to the Grand Hotel Vertical Transport Department. Please avoid losing guests during your induction. |
| 3 | Operator | **Promotion — Operator** · You have demonstrated the two qualities management values most: basic competence and continued attendance. |
| 6 | Manager | **Promotion — Manager** · You are now responsible not only for moving guests, but for explaining why they were not moved sooner. |
| 10 | Engineer | **Promotion — Engineer** · Repeated success with unreliable machinery has qualified you to design more unreliable machinery. |
| 14 | Director | **Promotion — Director** · You no longer operate lifts. You operate the people, policies and machinery that operate lifts. |
| 19 | Architect | **Promotion — Architect** · The hotel has expanded your remit to include several parts of the skyline. |
| 21 | Executive | **Promotion — Executive** · Conventional lift operations are now beneath your pay grade. Safety has been informed. |
| 24 | Commissioner | **Appointment — Commissioner** · You have successfully operated every lift the hotel owns. Engineering has therefore removed the lifts. |

**Briefing derivation rule:** challenge names and availability are generated from `activeChallenges`. The rank, title,
narrative, learning focus, rule card, and promotion copy above are transcribed into each canonical `briefing` record.
Any change requires a focused snapshot for the affected round and a matrix parity check for all 25 rounds.

**R11 Rooftop evacuation rule:** R11 retains the authored Rooftop Party and its long, unpredictable-feeling event,
but the event start is constrained to leave a 45-second post-party evacuation window inside the three-minute round.
R11 uses the owner-tested lower arrival curve as its canonical balance value.
R11 remains a five-lift, fifteen-floor challenge with Room Service, Gym Bros, Rooftop, Jams, and Stink active.

**R11 canonical arrival curve:** owner playtesting passed R11 twice with four to five
power-ups and did not reproduce premature lift departure. Test the lower `0.96`â€“`1.15` guests/second curve next.
The promoted curve is `0.96`â€“`1.15` guests/second; base capacity remains 10.

**R11 briefing clarification:** the first-use Gym Bros rule states that three or more Gym Bros make a
lift stinky, as well as stating that Gym Bros are immune to Stink. This explains both the risk of grouping them and
their exceptional boarding behaviour.

**Rooftop last-drinks cue (pending):** issue a visible â€œLast drinks!â€ toast five seconds before Happy Hour releases.
The party remains active until its scheduled release; the cue is advance notice, not an early evacuation.

The earlier candidate-comparison note above is superseded: future R11 replay uses only the canonical `0.96`–`1.15`
guests/second curve.

**Standard-building travel bands:** conventional buildings up to 15 floors use the short-building travel band
(0.45 seconds per floor); conventional buildings above 15 floors use the tall-building band (0.4166666667 seconds per
floor). Counterweight and capsule rounds retain their dedicated movement rules.

## 6. Detailed round designs

### Round 1 — First Shift

**Role in arc:** Arcade onboarding  
**New problem:** Guests have competing destinations and limited patience.  
**Likely failure:** The player waits for a full lift or overlooks a growing queue.  
**Evidence:** Queue color changes and the first loss of a life.  
**Insight:** Frequent service is safer than perfect loading.

**Solution space**

- Short manual trips.
- Prioritize visibly aging queues.
- Learn the relationship between car position, destination, and waiting floor.

**Mastery**

- Finish with no lost lives.
- Understand click-to-route without needing external instructions.

**Target feel**

- Fast doors and movement.
- Immediate first guest.
- No shop or economy distraction.
- A first-time completion rate of roughly 90–95%.

### Round 2 — Let It Sweep

**Role in arc:** Introduce automation as relief, not replacement.  
**New problem:** Traffic exceeds comfortable single-lift manual attention.  
**Likely failure:** Player enables Sweep, stops paying attention, and allows one neglected queue to trigger a late collapse.
**Evidence:** Sweep improves general flow but does not recognize the exceptional queue requiring intervention.
**Insight:** Automation handles routine work; the operator remains responsible for exceptions.

**Solution space**

- Enable Sweep and observe it.
- Use Sweep with occasional manual correction.
- Clicking a floor while Sweep is active is an explicit pickup command: on arrival, the lift ignores its previous travel direction and boards every waiting guest who can legally fit. Capacity, VIP, rage, and hazard restrictions still apply; Sweep resumes after the stop.
- Stay manual with high-skill routing.

**Mastery**

- Complete using Sweep plus timely manual rescue.
- Recognize when to override automation and when to return control to it.

**Target feel**

- Clearly harder manually than Round 1.
- Pure unattended Sweep dies during the final 20–30% of the round across the accepted seed set.
- Hybrid Sweep survives with a small number of high-leverage manual interventions.
- The player must remain attentive without fighting the automation constantly.
- Completion rate roughly 75–90% on first attempt.

### Round 3 — Rush Delivery

**Role in arc:** First tactical wall  
**New problem:** A second lift and Room Service reveal boarding throughput and role assignment.  
**Likely failure:** Both lifts chase the same queues; bulky carts delay urgent passengers.  
**Evidence:** Lifts cluster together and remain boarding while other queues age.  
**Insight:** More lifts require coordination; capacity and boarding speed are different bottlenecks.

**Solution space**

- Split the building into zones.
- Put one lift on Sweep and manually manage the other.
- Buy Wide Doors.
- Keep bulky traffic separate from urgent queues.

**Mastery**

- Maintain distinct lift roles.
- Correctly identify when Wide Doors is more useful than capacity.

**Target feel**

- First round where a new player may fail once.
- Wide Doors Bronze should be affordable. The automated balance comparator carries four uses as a conservative proof that an active response can survive; human playtesting must determine whether successful play actually requires too many purchases.

### Round 4 — Triage Protocol

**Role in arc:** Urgency management  
**New problem:** Serving maximum volume is insufficient when a minority of guests are near rage.  
**Likely failure:** Both lifts optimize throughput and ignore critical outliers.  
**Evidence:** Healthy total service but repeated critical losses.  
**Insight:** One lift should protect urgent demand while another maintains flow.

**Solution space**

- Priority Sweep on one lift.
- Manual rescue lift plus Sweep.
- Wide Doors timed during a bulky queue.
- Musak is not yet available; routing must do most of the work.

**Mastery**

- Use heterogeneous automation roles.
- Reduce critical defenestrations without collapsing total throughput.

### Round 5 — Democracy

**Role in arc:** Policy comparison and recovery round  
**New problem:** With three lifts, directional sweep is not always the best response to concentrated demand.  
**Likely failure:** Assign the same automation to every lift.  
**Evidence:** Multiple lifts duplicate routes or ignore a dominant floor.  
**Insight:** Automation is a policy choice; different policies suit different traffic shapes.

**Solution space**

- Combine Sweep, Priority, and Voting.
- Use Weighted Voting for urgency.
- Reserve one manual lift.

**Mastery**

- Explain why each lift has its assigned policy.
- Complete without needing a new power-up.

### Round 6 — Maintenance Crisis

**Role in arc:** Availability and redundancy wall  
**New problem:** Lift jams make a perfectly optimized system brittle.  
**Likely failure:** Depend on one critical lift role with no backup.  
**Evidence:** One jam causes queues assigned to that lift to collapse.  
**Insight:** Robust systems tolerate component failure; Wrench restores availability but does not clear accumulated demand.

**Solution space**

- Buy and time a Wrench.
- Maintain overlapping coverage.
- Reassign lift roles after a jam.
- Accept one jam and preserve the Wrench for a worse moment.

**Mastery**

- Recover from a jam without cascading failure.
- Understand that repair and backlog recovery are separate problems.

### Round 7 — Checkout Rush

**Role in arc:** Traffic-topology puzzle  
**New problem:** Half of traffic flows toward Ground, producing a directional funnel.  
**Likely failure:** All lifts continue general-purpose routing.  
**Evidence:** Upper-floor queues move, but lobby-bound guests dominate losses.  
**Insight:** Traffic shape should determine specialized service.

**Solution space**

- Dedicate one or two lifts to downward checkout traffic.
- Use Voting to follow demand concentration.
- Use Turbo for rapid lobby cycling.
- Zone upper floors and Ground service separately.

**Mastery**

- Create a dedicated funnel strategy.
- Avoid sending every lift to Ground simultaneously.

### Round 8 — VIP Security

**Role in arc:** Constraint and reservation puzzle  
**New problem:** A VIP makes three journeys and carries a severe life penalty at every stage.<br>
**Likely failure:** Automation repeatedly targets the VIP but normal guests occupy the arriving lift, or the player loses
track of the VIP after her first trip.
**Evidence:** The VIP remains waiting while lifts visit the floor unsuccessfully.  
**Insight:** Some demand requires reserved capacity and explicit exclusion.

**Solution space**

- Reserve one lift near empty.
- Manually clear and dispatch a VIP car.
- Use Priority/Weighted automation with intervention.
- Use Musak to buy time for surrounding queues.

**Mastery**

- Serve the VIP without allowing the rest of the building to collapse.
- Treat empty capacity as a strategic resource.

### Round 9 — Happy Hour

**Role in arc:** Multi-stage event and timing wall  
**New problem:** Stink temporarily removes lift capacity while the rooftop event creates a synchronized destination spike and later release.  
**Likely failure:** Spend recovery items on the first minor incident or commit all lifts to the roof.  
**Evidence:** Quarantined cars, mass redirection, then a second congestion wave when the event ends.  
**Insight:** A round has phases; reserve resources for the dangerous transition.

**Solution space**

- Save Freshener for a high-value contaminated lift.
- Preserve one lift for ordinary traffic.
- Use Turbo for rooftop recovery.
- Use Wide Doors during the release wave.
- Reassign automations between event phases.

**Mastery**

- Anticipate the event release.
- Survive using a timed combination rather than one universal effect.

### Round 10 — Automation Workshop

**Role in arc:** Strategic expression and recovery  
**Objective:** Deliver a quota rather than merely survive a timer.  
**New problem:** Built-in automations have visible limitations under a known pattern.  
**Likely failure:** Create a script that changes target too frequently or ignores onboard passengers.  
**Evidence:** Script thought/telemetry shows unstable decisions; lift oscillates or strands riders.  
**Insight:** Good automation encodes priority and state, not just a nearest-floor rule.

**Solution space**

- Continue using built-ins.
- Clone and modify a built-in.
- Write a specialized custom policy.
- Use Group Think or TARDIS as temporary relief.

**Mastery**

- Complete with at least one custom lift.
- Observe a measurable advantage or learn why the script underperformed.

### Round 11 — Heavy Lifting

**Role in arc:** Capacity versus speed mastery wall  
**New problem:** Gym Bros and Room Service create mixed weight and boarding pressure; groups can trigger stink.  
**Likely failure:** Maximize nominal capacity and produce very slow, contaminated lifts.  
**Evidence:** Full cars travel/board poorly and cause secondary effects.  
**Insight:** The fullest possible lift is not always the highest-throughput lift.

**Solution space**

- Dedicated heavy-service lift.
- Wide Doors plus selective routing.
- Double-Decker with controlled loading.
- Custom script using effective load.
- Freshener reserved for density-triggered stink.

**Mastery**

- Balance weight, boarding time, and urgency.
- Avoid treating all guests as identical units.

### Round 12 — Endurance Operations

**Role in arc:** Resource-management capstone and high-earning score round  
**Objective:** Start with 20 lives and continue until the 20th life is lost. There is no timer and no delivery quota.  
**Completion:** Death is expected and automatically advances the campaign to Round 13.  
**Score question:** How many minutes can the player last, and how many guests can they serve, before the final defenestration?  
**New problem:** The player must extend an inevitably losing operation for as long as possible without exhausting a finite loadout.  
**Likely failure:** Use expensive/global power-ups too early.  
**Evidence:** Strong opening followed by no recovery options as traffic pressure continues to rise.  
**Insight:** Resource timing and automation efficiency determine endurance.

**Solution space**

- Conservative, specialized automations.
- Bronze/silver tactical items rather than one early gold effect.
- Group Think to reduce route fragmentation.
- Custom scripts to reduce emergency demand.
- Accept that lives will be lost and spend resources where they buy the most additional survival time.

**Mastery**

- Survive materially longer on a replay or with a better strategy.
- Convert scarce power-ups into additional minutes rather than a short-lived opening advantage.
- Demonstrate that better automation reduces consumable dependence.

**Economy role**

- Round 12 is allowed to award substantially more points than an ordinary round.
- Payout scales with survival time, guests served, and service quality.
- Purchases and item consumption commit when the player dies because death completes the round.
- No retry is offered; the player automatically proceeds to Round 13.
- The large payout gives the player resources to prepare for the final gravity challenge.

**Testing note**

The 30-second Workflow Monkey must use a test-only Endurance pressure multiplier or life-loss accelerator so it can exercise the death → payout → automatic Round 13 transition without waiting for a full human endurance run.

### Round 13 — Pedal Power

**Role in arc:** Final optimization puzzle  
**New problem:** Upward travel slows with load, reversing the normal assumption that full lifts are always efficient.  
**Likely failure:** Use TARDIS or Double-Decker to maximize load and create extremely slow climbs.  
**Evidence:** Heavy cars visibly stall upward while lighter cars cycle faster.  
**Insight:** Throughput is a product of load and cycle time; optimal loads are below maximum.

**Solution space**

- Smaller upward batches.
- Separate up and down service.
- Turbo for critical heavy climbs.
- Custom load-aware routing.
- Double-Decker used selectively rather than continuously.

**Mastery**

- Complete by optimizing flow rather than maximizing capacity.
- Apply lessons from every earlier bottleneck.

## 6.5 Extended campaign structure: Rounds 14–20

Rounds 14–20 form a second campaign arc built around scale, fleet architecture, and Workshop engagement. Floors and
lifts increase before spawn-rate tuning. The first new scale mechanic is **Service Zoning**: a player-configured
direct-service band for each lift.

### Service Zoning rules

- A lift has an inclusive lower and upper service floor.
- G is a normal serviced floor within the zone, not a transfer hub. A zone such as `G–10` includes G and Floors 1–10.
- G is shared by every zoned policy, including Zoned High. It is three times as likely as an ordinary floor as both a
  guest origin and destination, making lobby flow a deliberate shared-service demand.
- Guests board only when the lift can carry them directly from their current floor to their destination within its
  configured zone. Multi-lift journeys and transfers are deferred.
- Including G reflects real lift operation and is especially useful for Room Service and Checkout traffic, which often
  begins or ends at the ground/lobby floor.
- If a guest’s origin or destination is outside a lift’s zone, that lift refuses boarding with a plain explanation.
- Round 14 introduces the optional Zoned Low and Zoned High built-in policies; all existing built-ins remain available.
- Workshop policies can be copied and adapted with a Service Zone block, then assigned from the normal in-game lift menu.
- Workshop edits to a Service Zone block show covered floors, uncovered floors, and whether any direct origin-to-destination route is absent.
- Overlapping zones provide resilience; disjoint zones reduce empty travel but are vulnerable when a lift jams.

| Round | Title | Floors | Lifts | Structural challenge | Zoning/Workshop lesson |
| --- | --- | ---: | ---: | --- | --- |
| 14 | Divide and Conquer | 20 | 5 | Rising arrivals across lower, middle, and upper traffic bands | Configure direct local zones including G while preserving flexible Ground coverage |
| 15 | The Sky Lounge Gala | 20 | 6 | VIP traffic combined with Rooftop Party | Preserve direct VIP and rooftop coverage |
| 16 | No Zone Is an Island | 20 | 6 | Jams and stink create temporary fleet gaps | Keep overlapping rescue coverage |
| 17 | Rooftop Express | 25 | 6 | Rooftop and VIP traffic combine with Jams and Stink | Use local and express zones while retaining flexible recovery coverage |
| 18 | Festival Weekend | 25 | 7 | Checkout, VIP, Gym Bros, Jams, and Stink interact | Configure exception-safe zones and a flexible lift |
| 19 | The Vertical City | 30 | 8 | Rooftop and VIP pressure compete with Gym Bros, Jams, and Stink | Make Workshop zoning strategically advantageous |
| 20 | The Grand Network | 30 | 10 | Checkout and VIP pressure combine with Gym Bros, Jams, and Stink | Master direct-service fleet architecture |

The current screen renders approximately seven lifts comfortably. R14–R18 should remain usable within that limit;
R19–R20 use a compact large-fleet layout so all eight lifts remain visible on supported desktop widths.
Every round should retain manual/hybrid, built-in automation plus loadout, and custom Workshop solutions where practical.

## 6.6 Post-R20 counterweight trilogy: Rounds 21–23

This authored puzzle trilogy shifts the late-game challenge from raw fleet scale to coupled spatial planning. Counterweight
pairs are always immediately adjacent (`L1↔L2`, then `L3↔L4`, and so on). A command to either car moves its partner in
the opposite direction; the pair maintains complementary floors. The player retains ordinary controls and is never
warned, restricted, or given a master/slave interface.

| Round | Title | Floors | Lifts | Role in arc | Intended solution space |
| --- | --- | ---: | ---: | --- | --- |
| 21 | Joined at the Cable | 11 | 2 | Teach paired movement as a low-pressure spatial puzzle | Manual anticipation, cabin-load planning, and recovery from a bad command |
| 22 | Meet in the Middle | 15 | 4 | Introduce Open Plan after the player has experienced misplaced passenger load | Timed adjacent-lift transfers, pair positioning, and power-up timing |
| 23 | The Entangled Hotel | 29 | 8 | Scale paired movement into fleet architecture | Zoned automation, zone overlap, Open Plan, loadouts, and manual recovery |

### Counterweight operating rules

- Passenger loads, doors, boarding, alighting, and guest patience remain independent in each car.
- A jam immobilises its car and stops its partner travelling, but the partner may still board/alight at its current floor.
- Turbo applies to the pair at half its normal speed benefit. Gravity always matters through the car travelling upward.
- Stink, Wrench, TARDIS, Wide Doors, Group Think, Double-Decker, Musak, and ordinary automations remain available under
  their normal rules unless a counterweight rule above explicitly changes their movement consequence.
- Built-in automations are pair-owned in counterweight rounds. Applying a built-in to either controller assigns the
  matching pair behaviour to both cars; applying Manual to either controller makes the whole pair Manual. Pair-aware
  Sweep-family policies evaluate demand from both cars and issue one legal mirrored target pair, with no hidden
  left-hand policy owner.
- A floor click on either shaft is a pair manual command: the clicked car receives the requested stop and its partner
  receives the forced complementary stop. It takes precedence until both cars have completed their service, then the
  pair's built-in policy resumes. The interaction remains deliberately consequence-rich, but works identically from
  either side of a pair.
- Zoned automation remains optional. Selecting Zoned Low or Zoned High on one car establishes that car's role and gives
  its partner the complementary role; a batch assignment retains the conventional left-low/right-high default. A
  manual command may leave a zone temporarily and zoning resumes afterwards.
- Custom Workshop automations remain an explicitly advanced per-cabin exception: they are not silently converted to a
  pair policy, and their coupled movement consequence must remain visible to the player.
- The visual loop is fixed to the building: a solid rounded-square cable attaches at the top and bottom of both cars and
  runs across two top pulleys and two bottom pulleys positioned outside the pair’s shafts. No oval or dashed cable is used.

### Open Plan role

Open Plan is unavailable in Round 21. In R22 and later, it is a timed, tiered lateral-transfer window. Bronze and Silver
target one lift as a transfer hub: compatible destination-aware guests may move between it and either adjacent lift
stopped at the same floor, including across a pair boundary such as `L2↔L3`. Bronze lasts 20 seconds and Silver 45
seconds. Gold lasts 60 seconds and enables the whole-building adjacent-transfer effect. Transfers still obey capacity,
stink, Gym Bro, VIP, and all ordinary boarding rules.

All counterweight rounds use an odd floor count so each pair can meet at the middle floor. Expiry ends an Open Plan
window; it must not leave lateral transfer or its active visual state permanently enabled.

The R21 briefing teaches the physical rule with a simple example. R22 teaches that Open Plan repairs passenger
distribution rather than cancelling counterweight movement. R23 asks the player to combine both ideas with zoning and
the established power-up economy.

## 6.7 Post-R23 SciiFi capsule-dispatch arc: Rounds 24–25

This implemented two-round arc replaces large shared cars with many narrow, tube-bound capsule pods. A pod holds one guest
and is only slightly wider than a guest icon. R24 uses 10 pods over 15 floors and targets a three-second end-to-end
trip; R25 uses 20 pods over 30 floors and targets six seconds, preserving the same per-floor speed.

| Round | Title | Floors | Capsules | Traffic design | Intended solution space |
| --- | --- | ---: | ---: | --- | --- |
| 24 | Welcome to the Future | 15 | 10 | Continuous seeded currents, initially readable and lightly overlapping | Batch-assign existing Zoned Low/High/custom policies; retain flexible G coverage |
| 25 | Terminal Velocity | 30 | 20 | Multiple overlapping currents with persistent G pressure | Rebalance a large automation fleet, recover from jams, and use selective manual rescue |

The briefing states that demand patterns will change, but there are no in-round wave announcements. Default campaign
objective, lives, and economy apply initially and are tuning targets rather than locked balance claims.

### Capsule-round rules

- Capsules render as compact cars inside tubes, with no cables, pulleys, or counterweight visual language.
- Manual targeting remains legal, but these rounds must make automation the practical primary operating model.
- Existing Service Zoning and custom Workshop policies are sufficient; no capsule-specific automation primitive is added.
- Room Service, Gym Bros, and Stink/farter events are excluded; VIP remains active in both rounds and Rooftop is active
  in R25. Freshener, TARDIS, and Double-Decker are not offered in the shop.
- Jams remain common but use a shorter authored duration; passengers stay in the jammed capsule normally. Wrench
  remains useful because fleet redundancy lowers the consequence without removing the disruption.
- Open Plan remains legal under its normal adjacent, same-floor rule, but is deliberately niche. Turbo remains visible,
  provides a 15% speed increase, and is intentionally low-value because pods are already fast.

### Capsule-dispatch tuning questions

Fixed-seed simulations and playtest should establish wave weights, overlap timing, spawn curves, shortened jam range,
shop costs, and whether all-Sweep is sufficiently but not overwhelmingly inferior to a sensible zoned fleet. Presentation
must prove that 20 pods and their automation/status cues remain readable without horizontal scrolling or degraded click
targets.

## 7. Hazard tuning principles

### Random hazards

- Random hazards must use deterministic seeded schedules.
- A single unavoidable event should not decide the round.
- Minimum spacing should prevent overlapping jams/stinks from exceeding designed pressure.
- Hazard probability must be expressed consistently per second or as scheduled events, never mixed silently with frame ticks.

### Scheduled events

VIP and rooftop events should have predictable windows communicated in the briefing or through in-game warning. Exact timing can remain seed-dependent.

### Escalation

Later difficulty should primarily increase:

- Interaction between known mechanics.
- Traffic concentration.
- Resource scarcity.
- Consequence of poor automation.
- Duration of sustained pressure.

It should not primarily increase raw hazard frequency.

### Planned audio feedback

Audio is a feedback layer, not a new mechanic or difficulty lever. It uses one adaptive gameplay loop whose layers and
tempo respond internally to pressure, while menus and modal pauses use quiet neutral music and victory uses a separate
fanfare. Each power-up and hazard receives a distinct, learnable effect. It must never change guest, lift, hazard,
RNG, or timer behaviour. Remaining device acceptance work is listed in `TEST_PLAN.md`.

## 8. Target success bands

These are initial design targets for human playtesting, not automated pass criteria.

| Round band | First-attempt completion | Completion after two retries |
| --- | ---: | ---: |
| 1–2 | 80–95% | 95%+ |
| 3–5 | 55–80% | 80–95% |
| 6–9 | 35–65% | 65–85% |
| 10–11 | 25–55% | 55–80% |
| 12 | Not applicable: death completes the round | Compare survival-time improvement |
| 13 | 15–40% | 45–70% |

Different player cohorts—manual-first, automation-first, and experienced—should be measured separately.

Round 12 is evaluated by survival distribution rather than completion rate:

- Median survival time on first attempt.
- Improvement over the player’s prior Endurance result.
- Guests served per minute.
- Points earned.
- Time at which each power-up is consumed.
- Whether the player understands why the operation eventually collapsed.

## 9. Round validation checklist

Before accepting a round:

- Is its main failure diagnosable?
- Does the briefing describe the problem without prescribing one answer?
- Can at least three strategic approaches plausibly work?
- Is every required tool affordable or avoidable?
- Does the same seed produce the same environment?
- Does a correct strategy materially outperform an incorrect one?
- Is the difficulty caused by the intended bottleneck?
- Does the review screen expose the evidence needed to improve?
- Does the round retest an earlier lesson?
- Is there a clear mastery behaviour?
