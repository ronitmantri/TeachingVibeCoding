# Flight Deck Simulator

A lightweight HTML5 flight simulator that runs entirely in the browser using canvas and JavaScript.

## Features

- Instrument-style attitude indicator, compass, airspeed, and altimeter
- Simplified flight physics with pitch, roll, yaw, throttle, and altitude
- Dynamic horizon, runway view, and cloud field
- Keyboard controls for takeoff, cruise, and descent

## Controls

- `W` / `S` — Pitch down / up
- `A` / `D` — Roll left / right
- `Q` / `E` — Yaw left / right
- `+` / `-` — Throttle up / down
- `Space` — Pause / resume

## Run locally

Open `index.html` in your browser or use a local HTTP server:

```bash
python3 -m http.server 8000
```

Then visit `http://127.0.0.1:8000`.
