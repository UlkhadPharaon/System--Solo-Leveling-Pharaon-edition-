import confetti from 'canvas-confetti';

/**
 * Triggers a celebratory confetti burst when a Victory Log is logged.
 */
export const triggerVictoryConfetti = () => {
  const count = 200;
  const defaults = {
    origin: { y: 0.65 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    try {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
        colors: ['#D4AF37', '#E0B529', '#7B3FE4', '#1E8A49', '#C94277', '#38bdf8', '#ffffff'],
      });
    } catch (e) {
      console.error('Confetti trigger error:', e);
    }
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
};

/**
 * Triggers an epic side-cannon and center confetti burst when all daily tasks are completed.
 */
export const triggerAllTasksCompletedConfetti = () => {
  const duration = 2.5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 35, spread: 360, ticks: 70, zIndex: 9999 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  // Immediate center burst
  try {
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#1E8A49', '#7B3FE4', '#1D6FA5', '#f43f5e'],
      zIndex: 9999,
    });
  } catch (e) {}

  // Side cannons over 2.5s
  const interval: ReturnType<typeof setInterval> = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    try {
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#D4AF37', '#1E8A49', '#7B3FE4', '#1D6FA5', '#f43f5e'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#D4AF37', '#1E8A49', '#7B3FE4', '#1D6FA5', '#f43f5e'],
      });
    } catch (e) {
      clearInterval(interval);
    }
  }, 250);
};
