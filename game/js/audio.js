// Ember Court — synthesized sound effects and a quiet ambient loop (WebAudio only).
'use strict';

/** All sound is synthesized; nothing is fetched. */
const AudioEngine = {
  ctx: null,
  muted: false,
  musicTimer: null,

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return true;
  },

  tone(freq, dur, type, vol, when, slideTo) {
    if (this.muted || !this.ensure()) return;
    const t0 = this.ctx.currentTime + (when || 0);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  },

  playCard() { this.tone(520, 0.12, 'triangle', 0.1, 0, 760); },
  hit() { this.tone(140, 0.22, 'sawtooth', 0.16, 0, 60); this.tone(90, 0.18, 'square', 0.08, 0.02, 50); },
  guard() { this.tone(660, 0.18, 'sine', 0.1, 0, 880); this.tone(990, 0.22, 'sine', 0.06, 0.06); },
  draw() { this.tone(440, 0.08, 'triangle', 0.07, 0, 620); },
  turn() { this.tone(392, 0.1, 'triangle', 0.07); this.tone(523, 0.12, 'triangle', 0.07, 0.09); },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.12, i * 0.13));
  },
  lose() {
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.32, 'sine', 0.1, i * 0.15));
  },

  /** A slow, quiet arpeggio loop. */
  startMusic() {
    if (this.musicTimer || !this.ensure()) return;
    const notes = [220, 262, 330, 392, 330, 262];
    let i = 0;
    this.musicTimer = setInterval(() => {
      if (!this.muted) this.tone(notes[i % notes.length], 0.9, 'sine', 0.035);
      i++;
    }, 620);
  },

  stopMusic() {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
  },

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  },
};
