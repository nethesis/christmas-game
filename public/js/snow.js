// Falling snowflakes drawn on a full-screen canvas, piling up at the bottom.
// Usage: const snow = new Snowfall("snow-container"); snow.start(); ... snow.stop();
// stop() lets the flakes already on screen finish falling; the snow pile stays.
class Snowfall {
  constructor(targetId, options = {}) {
    this.container = document.getElementById(targetId);
    this.options = {
      max: 120, // flakes on screen at the same time
      minSize: 6,
      maxSize: 22,
      // Nethesis blues: white flakes would be invisible on the light background
      colors: ["#00a0de", "#6bd1f0", "#06b6d4", "#084759", "#ffffff"],
      pileColumn: 4, // px, horizontal resolution of the snow pile
      pileMax: 70, // px, maximum pile height (also capped at 10% of the screen)
      pileGrowth: 0.4, // pile area added per landed flake, relative to size²
      ...options,
    };
    this.flakes = [];
    this.pile = [];
    this.spawning = false;
    this.running = false;
    this.frame = null;
    this.onResize = () => this.resize();
  }

  start() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.container.appendChild(this.canvas);
    this.resize();
    window.addEventListener("resize", this.onResize);

    this.spawning = true;
    this.running = true;
    this.last = performance.now();
    this.frame = requestAnimationFrame((t) => this.tick(t));
  }

  stop() {
    this.spawning = false;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Resample the pile to the new number of columns
    const columns = Math.ceil(this.width / this.options.pileColumn) + 1;
    const old = this.pile;
    this.pile = Array.from({ length: columns }, (_, i) =>
      old.length ? old[Math.min(old.length - 1, Math.round((i / columns) * old.length))] : 0
    );
    this.pileMax = Math.min(this.options.pileMax, this.height * 0.1);

    if (!this.running) {
      this.draw();
    }
  }

  createFlake() {
    const { minSize, maxSize, colors } = this.options;
    const size = minSize + Math.random() * (maxSize - minSize);
    return {
      x: Math.random() * this.width,
      y: -size,
      size,
      speed: 40 + size * 4 + Math.random() * 40, // px/s, bigger flakes fall faster
      swayAmp: 15 + Math.random() * 30,
      swayFreq: 0.5 + Math.random() * 1,
      phase: Math.random() * Math.PI * 2,
      angle: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 1.5, // rad/s
      color: colors[Math.floor(Math.random() * colors.length)],
      t: 0,
    };
  }

  pileHeightAt(x) {
    const i = Math.max(0, Math.min(this.pile.length - 1, Math.round(x / this.options.pileColumn)));
    return this.pile[i];
  }

  // Add a small mound where a flake landed; growth slows down near pileMax
  addToPile(x, size) {
    const col = this.options.pileColumn;
    const center = Math.round(x / col);
    const radius = Math.max(2, Math.round((size * 1.5) / col));
    const area = size * size * this.options.pileGrowth;
    const peak = area / (radius * col); // triangle of base 2*radius columns

    for (let d = -radius; d <= radius; d++) {
      const i = center + d;
      if (i < 0 || i >= this.pile.length) continue;
      const room = 1 - this.pile[i] / this.pileMax;
      this.pile[i] += peak * (1 - Math.abs(d) / (radius + 1)) * Math.max(0, room);
    }
  }

  // Let steep slopes slide sideways so the pile stays soft and rounded
  settlePile() {
    const p = this.pile;
    const maxStep = this.options.pileColumn * 0.6;
    for (let i = 0; i < p.length - 1; i++) {
      const diff = p[i] - p[i + 1];
      if (Math.abs(diff) > maxStep) {
        const move = (diff - Math.sign(diff) * maxStep) / 4;
        p[i] -= move;
        p[i + 1] += move;
      }
    }
  }

  tick(now) {
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;

    // Keep the number of flakes around "max", spread over time
    if (this.spawning && this.flakes.length < this.options.max && Math.random() < 0.6) {
      this.flakes.push(this.createFlake());
    }

    for (const f of this.flakes) {
      f.t += dt;
      f.y += f.speed * dt;
      f.angle += f.spin * dt;
      f.drawX = f.x + Math.sin(f.t * f.swayFreq + f.phase) * f.swayAmp;

      // Landed on the pile (or off screen sideways): becomes part of the pile
      const ground = this.height - this.pileHeightAt(f.drawX);
      if (f.y + f.size * 0.3 >= ground) {
        f.landed = true;
        if (f.drawX >= 0 && f.drawX <= this.width) {
          this.addToPile(f.drawX, f.size);
        }
      }
    }
    this.flakes = this.flakes.filter((f) => !f.landed);
    this.settlePile();
    this.draw();

    if (this.spawning || this.flakes.length) {
      this.frame = requestAnimationFrame((t) => this.tick(t));
    } else {
      // Snowfall over: keep the canvas so the pile stays on screen
      this.running = false;
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    for (const f of this.flakes) {
      this.drawFlake(f.drawX ?? f.x, f.y, f.size, f.angle, f.color);
    }
    this.drawPile();
  }

  drawPile() {
    const ctx = this.ctx;
    const col = this.options.pileColumn;
    const h = this.height;
    if (!this.pile.some((v) => v > 0.5)) return;

    // Smooth outline through the column tops
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h - this.pile[0]);
    for (let i = 1; i < this.pile.length; i++) {
      const x0 = (i - 1) * col;
      const x1 = i * col;
      ctx.quadraticCurveTo(x0, h - this.pile[i - 1], (x0 + x1) / 2, h - (this.pile[i - 1] + this.pile[i]) / 2);
    }
    ctx.lineTo(this.width, h);
    ctx.closePath();

    // Almost white snow, with a faint shadow so it stands out from the light background
    const top = h - this.pileMax;
    const gradient = ctx.createLinearGradient(0, top, 0, h);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(1, "#f8fcfe");
    ctx.save();
    ctx.shadowColor = "rgba(8, 71, 89, 0.12)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = -1;
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = "rgba(0, 160, 222, 0.1)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Six-armed snowflake with small branches on each arm
  drawFlake(x, y, size, angle, color) {
    const ctx = this.ctx;
    const r = size / 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, size / 12);
    ctx.lineCap = "round";
    if (color === "#ffffff") {
      ctx.shadowColor = "rgba(8, 71, 89, 0.35)";
      ctx.shadowBlur = 3;
    }
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -r);
      ctx.moveTo(0, -r * 0.55);
      ctx.lineTo(-r * 0.28, -r * 0.8);
      ctx.moveTo(0, -r * 0.55);
      ctx.lineTo(r * 0.28, -r * 0.8);
      ctx.rotate(Math.PI / 3);
    }
    ctx.stroke();
    ctx.restore();
  }

  destroy() {
    cancelAnimationFrame(this.frame);
    window.removeEventListener("resize", this.onResize);
    this.canvas.remove();
  }
}
