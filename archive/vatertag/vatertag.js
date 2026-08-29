const sky = document.querySelector("[data-sky]");
const openButton = document.querySelector("[data-open-letter]");
const letterSection = document.querySelector("[data-letter-section]");
const letter = document.querySelector("[data-letter]");
const concertCard = document.querySelector("[data-concert-card]");
const revealButton = document.querySelector("[data-reveal-concert]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function showLetter() {
  letterSection.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  window.setTimeout(() => {
    letter.classList.add("is-visible");
  }, reduceMotion ? 0 : 420);
}

function burstNotes(origin) {
  if (reduceMotion) return;
  const notes = ["♪", "♫", "♬", "♩", "𝄞", "B"];
  for (let i = 0; i < 18; i += 1) {
    const note = document.createElement("span");
    const angle = (Math.PI * 2 * i) / 18;
    const distance = 78 + Math.random() * 90;
    note.className = "note-burst";
    note.textContent = notes[i % notes.length];
    note.style.setProperty("--x", `${origin.clientX}px`);
    note.style.setProperty("--y", `${origin.clientY}px`);
    note.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    note.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
    note.style.setProperty("--rot", `${Math.random() * 120 - 60}deg`);
    document.body.appendChild(note);
    note.addEventListener("animationend", () => note.remove(), { once: true });
  }
}

openButton.addEventListener("click", showLetter);

revealButton.addEventListener("click", (event) => {
  concertCard.classList.add("is-revealed");
  revealButton.setAttribute("aria-expanded", "true");
  burstNotes(event);
});

const letterObserver = new IntersectionObserver(
  (entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      letter.classList.add("is-visible");
    }
  },
  { threshold: 0.35 }
);

letterObserver.observe(letterSection);

function initSky() {
  if (!sky) return;
  const ctx = sky.getContext("2d");
  let width = 0;
  let height = 0;
  let dpr = 1;
  let frame = 0;
  const particles = [];

  function resize() {
    dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    sky.width = Math.floor(width * dpr);
    sky.height = Math.floor(height * dpr);
    sky.style.width = `${width}px`;
    sky.style.height = `${height}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    particles.length = 0;
    const count = Math.min(95, Math.max(42, Math.floor((width * height) / 13000)));
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.8 + 0.4,
        speed: Math.random() * 0.28 + 0.08,
        phase: Math.random() * Math.PI * 2,
        hue: Math.random() > 0.72 ? "rose" : "gold"
      });
    }
  }

  function draw(time) {
    ctx.clearRect(0, 0, width, height);
    for (const particle of particles) {
      particle.y -= particle.speed;
      particle.x += Math.sin(time * 0.0008 + particle.phase) * 0.18;
      if (particle.y < -8) {
        particle.y = height + 8;
        particle.x = Math.random() * width;
      }
      const alpha = 0.25 + Math.sin(time * 0.002 + particle.phase) * 0.18;
      ctx.beginPath();
      ctx.fillStyle = particle.hue === "rose"
        ? `rgba(255, 111, 145, ${alpha + 0.12})`
        : `rgba(241, 198, 106, ${alpha})`;
      ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!reduceMotion) {
      frame = requestAnimationFrame(draw);
    }
  }

  resize();
  draw(0);
  if (!reduceMotion) {
    frame = requestAnimationFrame(draw);
  }
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else if (!reduceMotion && !frame) {
      frame = requestAnimationFrame(draw);
    }
  });
}

initSky();
