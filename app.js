const canvas = document.getElementById('flightCanvas');
const ctx = canvas.getContext('2d');
const horizonCanvas = document.getElementById('horizonCanvas');
const horizonCtx = horizonCanvas.getContext('2d');
const headingValue = document.getElementById('headingValue');
const airspeedValue = document.getElementById('airspeedValue');
const altimeterValue = document.getElementById('altimeterValue');

const simState = {
  pitch: 0,
  roll: 0,
  yaw: 0,
  speed: 128,
  throttle: 0.65,
  altitude: 1200,
  heading: 45,
  position: { x: 0, y: 1200, z: 0 },
  stalled: false,
  paused: false,
  control: {
    pitch: 0,
    roll: 0,
    yaw: 0,
    throttle: 0,
  },
};

const controlConfig = {
  maxPitchRate: 30,
  maxRollRate: 42,
  maxYawRate: 28,
  gravity: 9.8,
  drag: 0.005,
  liftFactor: 0.12,
  throttleStep: 0.02,
};

const keys = {
  KeyW: false,
  KeyS: false,
  KeyA: false,
  KeyD: false,
  KeyQ: false,
  KeyE: false,
  Equal: false,
  Minus: false,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeAngle(angle) {
  return ((angle % 360) + 360) % 360;
}

function handleKeyChange(code, active) {
  if (code === 'Space' && active) {
    simState.paused = !simState.paused;
  }
  if (keys.hasOwnProperty(code)) {
    keys[code] = active;
  }
}

window.addEventListener('keydown', (event) => {
  handleKeyChange(event.code, true);
});
window.addEventListener('keyup', (event) => {
  handleKeyChange(event.code, false);
});

function updateControls(dt) {
  simState.control.pitch = 0;
  simState.control.roll = 0;
  simState.control.yaw = 0;
  simState.control.throttle = 0;

  if (keys.KeyW) simState.control.pitch = -1;
  if (keys.KeyS) simState.control.pitch = 1;
  if (keys.KeyA) simState.control.roll = -1;
  if (keys.KeyD) simState.control.roll = 1;
  if (keys.KeyQ) simState.control.yaw = -1;
  if (keys.KeyE) simState.control.yaw = 1;
  if (keys.Equal) simState.control.throttle = 1;
  if (keys.Minus) simState.control.throttle = -1;

  simState.throttle = clamp(simState.throttle + simState.control.throttle * controlConfig.throttleStep, 0, 1);
}

function simulate(dt) {
  if (simState.paused) return;
  updateControls(dt);

  simState.pitch += simState.control.pitch * controlConfig.maxPitchRate * dt;
  simState.roll += simState.control.roll * controlConfig.maxRollRate * dt;
  simState.yaw += simState.control.yaw * controlConfig.maxYawRate * dt;

  simState.pitch = clamp(simState.pitch, -35, 35);
  simState.roll = clamp(simState.roll, -60, 60);
  simState.yaw = normalizeAngle(simState.yaw);
  simState.heading = normalizeAngle(simState.heading + simState.yaw * dt * 8);

  const effectiveLift = controlConfig.liftFactor * (simState.speed / 150) * Math.cos((simState.pitch * Math.PI) / 180);
  const descentRate = controlConfig.gravity * (1 - effectiveLift);

  const pitchAltEffect = Math.sin((simState.pitch * Math.PI) / 180) * 120;
  simState.altitude += (effectiveLift * 180 - descentRate * 100 + pitchAltEffect) * dt;
  simState.altitude = Math.max(simState.altitude, 0);

  const throttleSpeed = 80 + simState.throttle * 260;
  const pitchSpeedModifier = 1 - Math.abs(simState.pitch) * 0.007;
  const rollDrag = 1 - Math.abs(simState.roll) * 0.002;
  const drag = 1 - controlConfig.drag * dt * 20;
  simState.speed = clamp(simState.speed * drag + throttleSpeed * dt * 0.55 * pitchSpeedModifier * rollDrag, 40, 540);

  simState.position.x += simState.speed * Math.cos((simState.heading * Math.PI) / 180) * dt * 0.3;
  simState.position.z += simState.speed * Math.sin((simState.heading * Math.PI) / 180) * dt * 0.3;
  simState.position.y = simState.altitude;

  simState.stalled = simState.speed < 75 && simState.pitch > 12;
}

function drawSky(width, height) {
  const sky = ctx.createLinearGradient(0, 0, 0, height * 0.55);
  sky.addColorStop(0, '#0a1b40');
  sky.addColorStop(0.7, '#3f7ed6');
  sky.addColorStop(1, '#76c2ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height * 0.55);

  const ground = ctx.createLinearGradient(0, height * 0.55, 0, height);
  ground.addColorStop(0, '#3b6f25');
  ground.addColorStop(1, '#0b2211');
  ctx.fillStyle = ground;
  ctx.fillRect(0, height * 0.55, width, height * 0.45);
}

function drawHorizon(width, height) {
  const halfW = width / 2;
  const halfH = height / 2;
  const horizonOffset = simState.pitch * 2.6;
  const rollRadians = (simState.roll * Math.PI) / 180;

  ctx.save();
  ctx.translate(halfW, halfH);
  ctx.rotate(-rollRadians);
  ctx.translate(0, horizonOffset);

  ctx.fillStyle = '#3f7ed6';
  ctx.fillRect(-width, -halfH * 2, width * 2, halfH * 2);
  ctx.fillStyle = '#3b6f25';
  ctx.fillRect(-width, 0, width * 2, halfH * 2);

  ctx.strokeStyle = '#f1f7ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-width, 0);
  ctx.lineTo(width, 0);
  ctx.stroke();

  for (let i = -5; i <= 5; i++) {
    const y = i * 24;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-70, y);
    ctx.lineTo(70, y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(halfW - 14, halfH);
  ctx.lineTo(halfW + 14, halfH);
  ctx.stroke();
}

function drawRunway(width, height) {
  const horizonY = height * 0.45 - simState.pitch * 2.6;
  const centerX = width / 2;
  const bottom = height;
  const runwayWidth = 160;

  ctx.save();
  ctx.translate(centerX, horizonY);
  const rollRadians = (simState.roll * Math.PI) / 180;
  ctx.rotate(-rollRadians);
  ctx.translate(-centerX, -horizonY);

  const slope = (bottom - horizonY) / 8;
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(centerX - runwayWidth / 2, horizonY);
  ctx.lineTo(centerX + runwayWidth / 2, horizonY);
  ctx.lineTo(centerX + runwayWidth * 0.2, bottom);
  ctx.lineTo(centerX - runwayWidth * 0.2, bottom);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  for (let i = 0; i < 12; i++) {
    const y = horizonY + (bottom - horizonY) * (i / 11);
    const dash = 20 + i * 0.8;
    ctx.beginPath();
    ctx.moveTo(centerX - dash / 2, y);
    ctx.lineTo(centerX + dash / 2, y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawClouds(width, height) {
  const cloudCount = 9;
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  for (let i = 0; i < cloudCount; i++) {
    const x = ((simState.position.x * 0.04 + i * 180) % (width + 200)) - 100;
    const y = 50 + ((i * 70) % 140) + Math.sin(Date.now() * 0.0005 + i) * 12;
    const size = 58 + (i % 3) * 12;
    ctx.beginPath();
    ctx.ellipse(x, y, size, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + size * 0.6, y + 8, size * 0.8, size * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - size * 0.5, y + 4, size * 0.7, size * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFlightPath(width, height) {
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  for (let i = 1; i <= 9; i++) {
    const y = height * 0.55 + i * 24;
    ctx.beginPath();
    ctx.moveTo(width * 0.08, y);
    ctx.lineTo(width * 0.92, y);
    ctx.stroke();
  }
}

function drawCockpitHUD(width, height) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(width * 0.5, height * 0.58);
  ctx.lineTo(width * 0.5, height * 0.72);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.6, 70, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(width * 0.35, height * 0.72);
  ctx.lineTo(width * 0.65, height * 0.72);
  ctx.stroke();
  ctx.restore();
}

function drawInstrumentPanel() {
  const size = horizonCanvas.width;
  const center = size / 2;
  const pitchOffset = simState.pitch * 1.4;
  const rollRadians = (simState.roll * Math.PI) / 180;

  horizonCtx.clearRect(0, 0, size, size);
  horizonCtx.save();
  horizonCtx.translate(center, center);
  horizonCtx.rotate(-rollRadians);
  horizonCtx.translate(0, pitchOffset);

  const sky = horizonCtx.createLinearGradient(0, -center, 0, center);
  sky.addColorStop(0, '#3f7ed6');
  sky.addColorStop(0.5, '#77b8ea');
  sky.addColorStop(1, '#3f7ed6');
  horizonCtx.fillStyle = sky;
  horizonCtx.fillRect(-center, -center, size, center);

  horizonCtx.fillStyle = '#2b4f2d';
  horizonCtx.fillRect(-center, 0, size, center);

  horizonCtx.strokeStyle = '#fff';
  horizonCtx.lineWidth = 3;
  horizonCtx.beginPath();
  horizonCtx.moveTo(-center, 0);
  horizonCtx.lineTo(center, 0);
  horizonCtx.stroke();

  horizonCtx.strokeStyle = 'rgba(255,255,255,0.7)';
  horizonCtx.lineWidth = 2;
  for (let i = -3; i <= 3; i++) {
    const y = i * 22;
    horizonCtx.beginPath();
    const widthLine = 80 - Math.abs(i) * 12;
    horizonCtx.moveTo(-widthLine / 2, y);
    horizonCtx.lineTo(widthLine / 2, y);
    horizonCtx.stroke();
  }

  horizonCtx.restore();

  horizonCtx.strokeStyle = 'rgba(255,255,255,0.9)';
  horizonCtx.lineWidth = 4;
  horizonCtx.beginPath();
  horizonCtx.moveTo(center - 28, center);
  horizonCtx.lineTo(center + 28, center);
  horizonCtx.moveTo(center, center - 20);
  horizonCtx.lineTo(center, center + 20);
  horizonCtx.stroke();

  horizonCtx.strokeStyle = '#7cd1ff';
  horizonCtx.lineWidth = 2;
  horizonCtx.beginPath();
  horizonCtx.moveTo(center - 40, center);
  horizonCtx.lineTo(center + 40, center);
  horizonCtx.moveTo(center, center - 15);
  horizonCtx.lineTo(center, center + 15);
  horizonCtx.stroke();
}

function drawHudText(width, height) {
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = '400 16px system-ui';
  ctx.fillText(`Speed: ${Math.round(simState.speed)} kt`, 24, 32);
  ctx.fillText(`Altitude: ${Math.round(simState.altitude)} ft`, 24, 56);
  ctx.fillText(`Heading: ${Math.round(simState.heading)}°`, 24, 80);
  ctx.fillText(`Throttle: ${Math.round(simState.throttle * 100)}%`, 24, 104);
  ctx.fillText(simState.paused ? 'PAUSED' : '', width - 110, 32);
  if (simState.stalled) {
    ctx.fillStyle = '#ff5864';
    ctx.font = '700 30px system-ui';
    ctx.fillText('STALL WARNING', width * 0.5 - 120, height * 0.25);
  }
}

let lastTime = performance.now();

function render(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.036);
  lastTime = timestamp;

  simulate(dt);
  const width = canvas.width;
  const height = canvas.height;

  drawSky(width, height);
  drawClouds(width, height);
  drawHorizon(width, height);
  drawRunway(width, height);
  drawFlightPath(width, height);
  drawCockpitHUD(width, height);
  drawHudText(width, height);
  drawInstrumentPanel();
  headingValue.textContent = `${Math.round(simState.heading).toString().padStart(3, '0')}°`;
  airspeedValue.textContent = `${Math.round(simState.speed)} kt`;
  altimeterValue.textContent = `${Math.round(simState.altitude)} ft`;

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
