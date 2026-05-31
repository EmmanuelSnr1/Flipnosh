/**
 * Web Audio API notification sounds.
 * CLIENT-SIDE ONLY — all functions fail silently if Web Audio is unavailable.
 */

/** Two-tone ascending beep — used for new paid/COD orders */
export function playNewOrderSound(): void {
  try {
    const ctx  = new AudioContext();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    // Ascending: 880 Hz → 1100 Hz
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.7);
  } catch {
    // Web Audio not available — silent fail
  }
}

/** Descending tone — used for payment failures */
export function playPaymentFailedSound(): void {
  try {
    const ctx  = new AudioContext();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    // Descending: 660 Hz → 440 Hz
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.setValueAtTime(440, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.10, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // Web Audio not available — silent fail
  }
}

/** Plays both tones back-to-back — used on the sound test button */
export function testNotificationSound(): void {
  playNewOrderSound();
  setTimeout(playPaymentFailedSound, 1_000);
}
