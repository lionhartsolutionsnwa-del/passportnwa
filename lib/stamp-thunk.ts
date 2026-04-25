// Synthesizes a wooden "stamp thunk" using Web Audio — no asset needed.
// Two layers: a low sine impact thump + a noisy attack burst.

export function playStampThunk() {
  if (typeof window === "undefined") return;
  const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
  if (!Ctor) return;

  const ctx = new Ctor();
  const now = ctx.currentTime;

  // --- LOW THUMP (sine, 70Hz dropping to 40Hz) ---
  const thumpOsc = ctx.createOscillator();
  thumpOsc.type = "sine";
  thumpOsc.frequency.setValueAtTime(80, now);
  thumpOsc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

  const thumpGain = ctx.createGain();
  thumpGain.gain.setValueAtTime(0, now);
  thumpGain.gain.linearRampToValueAtTime(0.55, now + 0.005);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  thumpOsc.connect(thumpGain).connect(ctx.destination);

  // --- NOISE ATTACK (the wooden "tap") ---
  const bufSize = ctx.sampleRate * 0.05;
  const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = 1200;
  noiseFilter.Q.value = 0.8;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.4, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);

  thumpOsc.start(now);
  thumpOsc.stop(now + 0.25);
  noise.start(now);
  noise.stop(now + 0.06);

  // Gracefully close context after sound finishes
  setTimeout(() => ctx.close().catch(() => {}), 400);
}
