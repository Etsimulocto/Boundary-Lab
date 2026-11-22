# Boundary Lab 🌀

**Boundary Lab v0.5** is a local browser-based **classical geometry sandbox** for exploring which constraints are associated with persistent organization. No libraries, server, login, quantum hardware or API keys are required.

## Run

Download or clone this repository and open `index.html` in a modern browser. Click **Run**, **Pause**, **Step +1**, or **Reset same seed**.

## Controls

- 10–180 points with three visual categories
- Attraction, short-range repulsion, interaction radius, speed, momentum memory, noise and category mutation
- Link topology: all elements, same-type only or nearby IDs
- Boundaries: wraparound, reflection or open exits
- Four perimeter field emitters with inward force, pulsing intensity, tangential shear and adjustable reach
- Presets: no-forces control, aggregation, repulsion, selective interactions and open-boundary loss and border field storm
- Repeatable seeds; JSON and CSV exports

## Measurements

The app records active points, the number of proximity links, connected components, largest connected cluster, one-tick link retention and category Shannon entropy. Samples are recorded every ten ticks. The chart shows largest-cluster size over time.

**Warning:** Graph links are proximity measurements, not physical bonds. Category entropy is not thermodynamic or quantum entropy. This is a toy mathematical model, **not** a simulation of quantum fields or evidence of an external projector.

## First controlled experiment

1. Fix the seed at 4107, set attraction to zero and leave everything else unchanged.
2. Run 1,000 ticks and export the result.
3. Change **only** attraction to 2.0, reset using the *same* seed, run 1,000 ticks and export.
4. Repeat both conditions across at least twenty seeds.
5. Compare distributions of largest-cluster size and link retention. Don't infer emergence solely from a pleasing image.

The presets are illustrative, but vary several controls at once. To attribute changes to a specific rule, vary only one control at a time.

## Why this exists

The starting research question is: **Which constraints are necessary for persistent, organized behavior to emerge from minimal geometry?**

A classical processor can model alternative rules even though the processor itself obeys our physics. A useful future quantum experiment would require a *separate, specific quantum hypothesis* and observables that cannot be more easily explored classically.

## Next phases

Automated seed sweeps; control-vs-treatment comparison; time-window persistence; null models; significance and effect-size reporting; unit tests; parameter heatmaps; optional quantum circuit experiments.

The model is neither calibrated to physical units nor claimed to represent a real universe. Its value is in reproducible comparisons between explicit assumptions.

## v0.5: Border field generators

A new, separately configurable perimeter force is applied to nodes within a chosen distance of any wall. The inward component pushes nodes away from the edge; a small tangential component produces stirring. Pulse amplitude modulates its strength over time (clamped so it never becomes an outward pull). Four luminous generator markers and highlighted strips visualize the active field. These are model rules, not electromagnetic field simulations.

To test whether energy injection prolongs rearrangement, compare identical seeds with **edge field strength 0** versus **1.8** while holding pulse, reach, boundaries and all other controls constant. Note that changes still reset the simulation, preserving controlled comparisons.

## v0.5: Curved perimeter fields

**Field arc radius** varies continuously from **0 (flat field fronts)** to **100 (strongly bowed circular arcs)**. The left and right generators use the height of the arena for their circular profiles; the top and bottom use its width. The deepest field extent still comes from **Field reach**. With the arc slider above zero, the field tapers toward the corners instead of occupying a straight strip along the entire wall. The same curved geometry determines both the force zone and its visualization. The Border field storm preset starts with radius 75. Changing the slider resets the seeded experiment to keep comparisons consistent.

## v0.5: orbital diagnostics and browser safeguards

- Optional fading particle **trails**, with a configurable trail length (0–80 recorded samples).
- **Cluster center and radius markers** for groups of three or more nodes, with clockwise/counterclockwise indicators.
- **Mean signed angular rate** around connected-component centers, with cluster-wide translation subtracted. Opposing spins can cancel.
- **Cluster joins/departures**, estimated from connected-component membership over ten-tick measurement intervals. These are *not* proof of real gravitational capture or escape; split/merge events can count as joins or departures.
- Adjustable **soft collision core** (defaults to zero), to reduce exact overlaps; unlike overlays, this modifies simulated forces.
- Performance: bounded trail histories, drawn proximity links sampled above 2,200 lines, low-quality option limiting them to about 750 and drawing every second tick. Measurements still use the full graph.
- Visual controls do not reset a running experiment. Physics controls still reset to preserve seeded comparisons.

Suggested orbital exploration: set interactions to **Nearby IDs only**, momentum memory to **1**, random disturbance to **0**, and start with **soft collision core 0.5**. Use center markers and trails to see if a group truly rotates versus merely translating.

The statistics remain exploratory numerical diagnostics in a classical toy model.

## v0.5 — Optional pseudo-chemistry

The **Bonding laboratory** preset enables differently sized nodes and persistent explicit spring bonds. Cyan, amber and violet nodes have maximum valence 1, 2 and 3 respectively. Controls configure size scaling, bond selection (all/same/different/complementary), formation distance, break distance, and spring strength. Bond counts, formation events and breakage events are measured and exported. Bond formation is deterministic: closest eligible pairs connect first, with a fixed tie-breaker. Changing physical controls resets to the seed. Old modes remain available with chemistry disabled.

This is exploratory **pseudo-chemistry**, not realistic atomic valence or quantum chemistry. Bonds are spring constraints; no chemical energy or electron behavior is modeled. High bond density can still make crowded clusters. With 180 nodes, pair evaluation is quadratic; low rendering quality is available.
