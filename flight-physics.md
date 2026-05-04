# Flight Simulator Physics

This project uses a simplified flight model to emulate a realistic pilot experience.

## Key concepts

- **Lift**: Derived from speed and pitch. Higher speed and level pitch produce more lift.
- **Gravity**: Always pulls the aircraft downward, offset by lift.
- **Throttle**: Controls forward acceleration and indirectly supports climb performance.
- **Pitch / Roll / Yaw**: Controls change the aircraft attitude and heading.

## Behavior

- Pitch influences climb and descent. A nose-up attitude increases altitude gain until lift stalls.
- Roll tilts the horizon and modifies the visual cue for banking.
- Yaw slowly changes heading and is useful for coordinated turns.
- Stall warnings occur when speed is too low while the nose is too high.
