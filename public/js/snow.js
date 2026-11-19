// Falling snowflakes drawn on a full-screen canvas.
// Usage: const snow = new Snowfall("snow-container"); snow.start(); ... snow.stop();
// stop() lets the flakes already on screen finish falling, then removes the canvas.
class Snowfall {
  constructor(targetId, options = {}) {
    this.container = document.getElementById(targetId);
    this.options = {
      max: 120, // flakes on screen at the same time
      minSize: 6,
      maxSize: 22,
      // Nethesis blues: white flakes would be invisible on the light background
      colors: ["#00a0de", "#6bd1f0", "#06b6d4", "#084759", "#ffffff"],
      ...options,
    };
    this.flakes = [];
    this.spawning = false;
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

  tick(now) {
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;

    // Keep the number of flakes around "max", spread over time
    if (this.spawning && this.flakes.length < this.options.max && Math.random() < 0.6) {
      this.flakes.push(this.createFlake());
    }

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.flakes = this.flakes.filter((f) => f.y - f.size < this.height);

    for (const f of this.flakes) {
      f.t += dt;
      f.y += f.speed * dt;
      f.angle += f.spin * dt;
      const x = f.x + Math.sin(f.t * f.swayFreq + f.phase) * f.swayAmp;
      this.drawFlake(x, f.y, f.size, f.angle, f.color);
    }

    if (this.spawning || this.flakes.length) {
      this.frame = requestAnimationFrame((t) => this.tick(t));
    } else {
      this.destroy();
    }
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
