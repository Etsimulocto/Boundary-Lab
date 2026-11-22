# Boundary Lab 🌀

**Boundary Lab v0.2** is a local browser-based **classical geometry sandbox** for exploring which constraints are associated with persistent organization. No libraries, server, login, quantum hardware or API keys are required.

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

## v0.2: Border field generators

A new, separately configurable perimeter force is applied to nodes within a chosen distance of any wall. The inward component pushes nodes away from the edge; a small tangential component produces stirring. Pulse amplitude modulates its strength over time (clamped so it never becomes an outward pull). Four luminous generator markers and highlighted strips visualize the active field. These are model rules, not electromagnetic field simulations.

To test whether energy injection prolongs rearrangement, compare identical seeds with **edge field strength 0** versus **1.8** while holding pulse, reach, boundaries and all other controls constant. Note that changes still reset the simulation, preserving controlled comparisons.
