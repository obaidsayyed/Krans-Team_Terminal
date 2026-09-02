// Web Audio API Synthesizer for Ringing Notifications & Emergency Sirens

let audioCtx: AudioContext | null = null;
let isMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setMuted(muted: boolean) {
  isMuted = muted;
}

export function getIsMuted(): boolean {
  return isMuted;
}

/**
 * Plays a realistic continuous telephone/dispatch "Ringing" bell
 * Used when a complaint is registered or allocated to a preferred service
 */
export function playDispatchRingtone() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    
    // Play 3 ring bursts: "Brrrring... Brrrring... Brrrring..."
    const bursts = [0, 0.6, 1.2];
    
    bursts.forEach(startTime => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Dual frequencies typical of European/North-American telephone / dispatch alert bells (440Hz + 480Hz or 400Hz + 450Hz)
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, now + startTime);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(480, now + startTime);

      // Amplitude modulation for realistic bell flutter (20Hz warble)
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(20, now + startTime);
      lfoGain.gain.setValueAtTime(0.05, now + startTime);
      lfo.connect(osc1.frequency);
      lfo.start(now + startTime);
      lfo.stop(now + startTime + 0.4);

      // Envelope for each ring
      gainNode.gain.setValueAtTime(0, now + startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, now + startTime + 0.05);
      gainNode.gain.setValueAtTime(0.2, now + startTime + 0.35);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + startTime + 0.45);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now + startTime);
      osc2.start(now + startTime);

      osc1.stop(now + startTime + 0.45);
      osc2.stop(now + startTime + 0.45);
    });
  } catch (e) {
    console.warn('Audio playback not permitted yet or failed:', e);
  }
}

/**
 * Plays high-urgency Admin Escalation Alert Ringing Bell
 * Strictly triggered ONLY when a user escalates a complaint to Admin Command HQ
 */
export function playAdminEscalationRingtone() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    
    // High-priority dual pulsating buzzer/bell for Admin Command Desk (520Hz + 660Hz alternating)
    const bursts = [0, 0.35, 0.7, 1.05, 1.4];
    
    bursts.forEach((startTime, idx) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc2.type = 'sine';
      
      const f1 = idx % 2 === 0 ? 580 : 700;
      const f2 = idx % 2 === 0 ? 660 : 880;

      osc1.frequency.setValueAtTime(f1, now + startTime);
      osc2.frequency.setValueAtTime(f2, now + startTime);

      gainNode.gain.setValueAtTime(0, now + startTime);
      gainNode.gain.linearRampToValueAtTime(0.24, now + startTime + 0.03);
      gainNode.gain.setValueAtTime(0.24, now + startTime + 0.22);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + startTime + 0.28);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now + startTime);
      osc2.start(now + startTime);

      osc1.stop(now + startTime + 0.28);
      osc2.stop(now + startTime + 0.28);
    });
  } catch (e) {
    console.warn('Admin escalation audio failed:', e);
  }
}

/**
 * Plays high-urgency Emergency SOS Siren
 */
export function playEmergencySiren() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sawtooth';

    // Yelp siren pattern (650Hz up to 1200Hz back and forth)
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.linearRampToValueAtTime(1150, now + 0.25);
    osc.frequency.linearRampToValueAtTime(650, now + 0.5);
    osc.frequency.linearRampToValueAtTime(1150, now + 0.75);
    osc.frequency.linearRampToValueAtTime(650, now + 1.0);
    osc.frequency.linearRampToValueAtTime(1150, now + 1.25);
    osc.frequency.linearRampToValueAtTime(650, now + 1.5);

    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 1.4);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.6);
  } catch (e) {
    console.warn('Siren audio failed:', e);
  }
}

/**
 * Plays standard pleasant notification ping / chime
 */
export function playNotificationChime() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6

    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.2);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.45);
  } catch (e) {
    console.warn('Chime audio failed:', e);
  }
}

/**
 * Plays Success / Resolution celebration chime
 */
export function playResolutionChime() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteStart = now + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0.14, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteStart);
      osc.stop(noteStart + 0.3);
    });
  } catch (e) {
    console.warn('Resolution chime failed:', e);
  }
}
