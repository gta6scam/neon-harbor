// audio-sound.js — SoundWeaver Audio, the game's named sound system. Everything is
// synthesised live with WebAudio — no audio files: three radio stations that play
// generative harbour music from their own scales, an engine voice tied to speed,
// a two-tone siren wash when units close in, and one-shot effects for pickups,
// deliveries, gunfire and crashes. Key 0 mutes the whole system.

import { RADIO } from './data-crew.js';

export function createAudio() {
  let ac = null, master = null, radioGain = null, engineOsc = null, engineGain = null, sirenOsc = null, sirenGain = null;
  let stationIdx = 0, step = 0, radioTimer = null;
  const A = {
    muted: false, stationIdx: 0,

    ensure() {
      if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ac = new AC();
      master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination);
      radioGain = ac.createGain(); radioGain.gain.value = 0.16; radioGain.connect(master);
      engineOsc = ac.createOscillator(); engineOsc.type = 'sawtooth';
      const engineFilter = ac.createBiquadFilter(); engineFilter.type = 'lowpass'; engineFilter.frequency.value = 320;
      engineGain = ac.createGain(); engineGain.gain.value = 0;
      engineOsc.connect(engineFilter); engineFilter.connect(engineGain); engineGain.connect(master);
      engineOsc.start();
      sirenOsc = ac.createOscillator(); sirenOsc.type = 'triangle'; sirenOsc.frequency.value = 720;
      sirenGain = ac.createGain(); sirenGain.gain.value = 0;
      sirenOsc.connect(sirenGain); sirenGain.connect(master);
      sirenOsc.start();
      this.startRadio();
    },

    startRadio() {
      if (radioTimer) clearInterval(radioTimer);
      const st = RADIO[stationIdx];
      radioTimer = setInterval(() => {
        if (!ac || A.muted) return;
        const root = 110;
        const note = st.scale[step % st.scale.length];
        const bar = Math.floor(step / st.scale.length) % 4;
        const freq = root * Math.pow(2, (note + (bar === 3 ? 3 : 0)) / 12) * 2;
        const o = ac.createOscillator(); o.type = st.wave; o.frequency.value = freq;
        const g = ac.createGain();
        g.gain.setValueAtTime(0.5, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + st.tempo * 0.95);
        o.connect(g); g.connect(radioGain);
        o.start(); o.stop(ac.currentTime + st.tempo);
        if (step % 2 === 0) {
          const b = ac.createOscillator(); b.type = 'sine'; b.frequency.value = root / 2;
          const bg = ac.createGain();
          bg.gain.setValueAtTime(0.7, ac.currentTime);
          bg.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + st.tempo * 1.8);
          b.connect(bg); bg.connect(radioGain);
          b.start(); b.stop(ac.currentTime + st.tempo * 1.8);
        }
        step++;
      }, RADIO[stationIdx].tempo * 1000);
    },

    nextStation() {
      stationIdx = (stationIdx + 1) % RADIO.length;
      A.stationIdx = stationIdx;
      step = 0;
      this.startRadio();
      return RADIO[stationIdx];
    },
    station() { return RADIO[stationIdx]; },

    setEngine(norm, inCar) {
      if (!ac) return;
      const target = inCar && !A.muted ? 0.05 + norm * 0.05 : 0;
      engineGain.gain.setTargetAtTime(target, ac.currentTime, 0.08);
      engineOsc.frequency.setTargetAtTime(55 + norm * 165, ac.currentTime, 0.06);
    },
    setSiren(proximity) {
      if (!ac) return;
      const g = A.muted ? 0 : Math.max(0, proximity) * 0.028;
      sirenGain.gain.setTargetAtTime(g, ac.currentTime, 0.2);
      sirenOsc.frequency.setTargetAtTime(680 + Math.sin(ac.currentTime * 2.4) * 130, ac.currentTime, 0.05);
    },

    blip(freq, dur, type = 'square', vol = 0.2) {
      if (!ac || A.muted) return;
      const o = ac.createOscillator(); o.type = type; o.frequency.value = freq;
      const g = ac.createGain();
      g.gain.setValueAtTime(vol, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + dur);
      o.connect(g); g.connect(master);
      o.start(); o.stop(ac.currentTime + dur);
    },
    noise(dur, vol, freq) {
      if (!ac || A.muted) return;
      const len = Math.floor(ac.sampleRate * dur);
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ac.createBufferSource(); src.buffer = buf;
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq;
      const g = ac.createGain(); g.gain.value = vol;
      src.connect(f); f.connect(g); g.connect(master);
      src.start();
    },
    sfx(name) {
      if (!ac) return;
      if (name === 'pickup') { this.blip(660, 0.09); setTimeout(() => this.blip(990, 0.12), 70); }
      if (name === 'deliver') { this.blip(523, 0.1, 'triangle', 0.26); setTimeout(() => this.blip(784, 0.16, 'triangle', 0.26), 90); }
      if (name === 'shot') this.noise(0.11, 0.5, 900);
      if (name === 'crash') this.noise(0.3, 0.6, 160);
      if (name === 'passed') { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.blip(f, 0.22, 'triangle', 0.24), i * 110)); }
      if (name === 'fail') { this.blip(196, 0.4, 'sawtooth', 0.2); }
    },

    toggleMute() {
      A.muted = !A.muted;
      if (master) master.gain.value = A.muted ? 0 : 0.5;
      return A.muted;
    },
  };
  return A;
}
