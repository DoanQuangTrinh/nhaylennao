/**
 * Web Audio Engine for Real Nightclub Sound Effects & DJ Audio
 * Synthesizes realistic bar sounds (glass clink, champagne pop, CO2 hiss, crowd cheer)
 * using Web Audio API nodes so no external MP3 asset downloads can fail.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export type SfxType = "cheers" | "champagne" | "co2" | "applause" | "dj_scratch" | "drink" | "firework" | "laser";

/** Play synthesized nightclub sound effects */
export function playBarSfx(type: SfxType) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    switch (type) {
      case "cheers":
      case "drink": {
        // High-pitched crystal glass clink sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(2400, now);
        osc.frequency.exponentialRampToValueAtTime(1800, now + 0.15);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);

        // Harmonic second crystal glass
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(3200, now + 0.02);
        osc2.frequency.exponentialRampToValueAtTime(2200, now + 0.2);

        gain2.gain.setValueAtTime(0.3, now + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc2.start(now + 0.02);
        osc2.stop(now + 0.3);
        break;
      }

      case "champagne": {
        // Champagne Pop! Low thump + high cork pop + fizz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);

        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);

        // White noise fizz / bubble spray
        const bufferSize = ctx.sampleRate * 0.5; // 0.5 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 3500;
        filter.Q.value = 3;

        const fizzGain = ctx.createGain();
        fizzGain.gain.setValueAtTime(0.25, now + 0.04);
        fizzGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        whiteNoise.connect(filter);
        filter.connect(fizzGain);
        fizzGain.connect(ctx.destination);

        whiteNoise.start(now + 0.04);
        whiteNoise.stop(now + 0.45);
        break;
      }

      case "co2": {
        // High-pressure CO2 Jet Hiss (Bandpassed noise sweep)
        const dur = 1.2;
        const bufferSize = ctx.sampleRate * dur;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(2500, now + 0.3);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.6, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + dur);
        break;
      }

      case "applause": {
        // Crowd applause / cheers
        const dur = 1.5;
        const bufferSize = ctx.sampleRate * dur;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 1800;
        filter.Q.value = 1.2;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + dur);
        break;
      }

      case "dj_scratch": {
        // DJ vinyl scratch effect
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.16);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }

      case "firework": {
        // VIP Pyrotechnics Fountain Blast
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);

        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);

        // Crackle Sparkles
        const bufferSize = ctx.sampleRate * 0.8;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.85 ? 1 : 0.1);
        }
        const sparkle = ctx.createBufferSource();
        sparkle.buffer = buffer;
        const sparkGain = ctx.createGain();
        sparkGain.gain.setValueAtTime(0.4, now + 0.1);
        sparkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        sparkle.connect(sparkGain);
        sparkGain.connect(ctx.destination);
        sparkle.start(now + 0.1);
        sparkle.stop(now + 0.8);
        break;
      }

      case "laser": {
        // Sci-Fi Disco Laser Sweep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(2200, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
    }
  } catch (e) {
    console.warn("Audio Context SFX error", e);
  }
}

/** Nightclub Web Audio Synthesizer Beat Generator for background music */
class NightclubBeatSynth {
  private isPlaying = false;
  private intervalId: number | null = null;
  private bpm = 128;
  private step = 0;

  start(bpm = 128) {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.bpm = bpm;
    this.step = 0;

    const stepMs = (60 / this.bpm / 4) * 1000;
    this.intervalId = window.setInterval(() => this.tick(), stepMs);
  }

  stop() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isPlaying = false;
  }

  setBpm(bpm: number) {
    this.bpm = bpm;
    if (this.isPlaying) {
      this.stop();
      this.start(bpm);
    }
  }

  getIsPlaying() {
    return this.isPlaying;
  }

  private tick() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 4/4 Kick drum on steps 0, 4, 8, 12
      if (this.step % 4 === 0) {
        const kickOsc = ctx.createOscillator();
        const kickGain = ctx.createGain();

        kickOsc.type = "sine";
        kickOsc.frequency.setValueAtTime(130, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

        kickGain.gain.setValueAtTime(0.7, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        kickOsc.connect(kickGain);
        kickGain.connect(ctx.destination);

        kickOsc.start(now);
        kickOsc.stop(now + 0.12);
      }

      // Off-beat Hi-Hat on steps 2, 6, 10, 14
      if (this.step % 4 === 2) {
        const bufferSize = ctx.sampleRate * 0.05;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const hatNoise = ctx.createBufferSource();
        hatNoise.buffer = buffer;

        const hatFilter = ctx.createBiquadFilter();
        hatFilter.type = "highpass";
        hatFilter.frequency.value = 7000;

        const hatGain = ctx.createGain();
        hatGain.gain.setValueAtTime(0.2, now);
        hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        hatNoise.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(ctx.destination);

        hatNoise.start(now);
        hatNoise.stop(now + 0.05);
      }

      // Bass synth line on steps
      if (this.step % 2 === 0) {
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        const notes = [55, 65.41, 73.42, 82.41]; // A1, C2, D2, E2
        const note = notes[(Math.floor(this.step / 2) % notes.length)]!;

        bassOsc.type = "sawtooth";
        bassOsc.frequency.setValueAtTime(note, now);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(150, now + 0.1);

        bassGain.gain.setValueAtTime(0.15, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        bassOsc.connect(filter);
        filter.connect(bassGain);
        bassGain.connect(ctx.destination);

        bassOsc.start(now);
        bassOsc.stop(now + 0.1);
      }

      this.step = (this.step + 1) % 16;
    } catch {
      // Audio play blocked or inactive
    }
  }
}

export const barBeatSynth = new NightclubBeatSynth();
