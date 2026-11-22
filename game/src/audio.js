// Ember Sigil Duel — synthesized sound, no audio files.
// One file, one job: tiny WebAudio blips for play, hit, shield, win and loss.

let ctx = null;
let muted = false;

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function ensureCtx() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, ms, type, gain) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(gain || 0.12, ac.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + ms / 1000);
  osc.connect(amp);
  amp.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + ms / 1000);
}

/** `name` is one of: play, hit, shield, break, turn, win, loss, denied. */
export function playSound(name) {
  if (muted) return;
  switch (name) {
    case 'play': tone(520, 90, 'triangle', 0.1); break;
    case 'hit': tone(180, 140, 'sawtooth', 0.12); tone(120, 180, 'square', 0.07); break;
    case 'shield': tone(660, 120, 'sine', 0.1); tone(880, 160, 'sine', 0.07); break;
    case 'break': tone(980, 100, 'triangle', 0.12); tone(1240, 180, 'triangle', 0.1); break;
    case 'turn': tone(440, 70, 'sine', 0.07); break;
    case 'win': [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 220, 'triangle', 0.11), i * 110)); break;
    case 'loss': [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 260, 'sawtooth', 0.07), i * 130)); break;
    case 'denied': tone(140, 120, 'square', 0.08); break;
    default: break;
  }
}
