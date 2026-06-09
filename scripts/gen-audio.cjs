// Generates simple lofi ambient audio WAV files using pure Node.js (no deps)
// Run: node scripts/gen-audio.cjs
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const DURATION = 30; // seconds per track
const NUM_SAMPLES = SAMPLE_RATE * DURATION;

function writeWav(filename, samples) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  // WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);       // PCM chunk size
  buffer.writeUInt16LE(1, 20);        // PCM format
  buffer.writeUInt16LE(1, 22);        // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32);        // block align
  buffer.writeUInt16LE(16, 34);       // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  fs.writeFileSync(filename, buffer);
  console.log('Written:', filename);
}

// Pink noise (rain / ambient sound) using Paul Kellet's filter
function pinkNoise(vol = 0.3) {
  const samples = new Float32Array(NUM_SAMPLES);
  let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886*b0 + w*0.0555179; b1 = 0.99332*b1 + w*0.0750759;
    b2 = 0.96900*b2 + w*0.1538520; b3 = 0.86650*b3 + w*0.3104856;
    b4 = 0.55000*b4 + w*0.5329522; b5 = -0.7616*b5 - w*0.0168980;
    samples[i] = (b0+b1+b2+b3+b4+b5+b6 + w*0.5362) * 0.11 * vol;
    b6 = w * 0.115926;
  }
  return samples;
}

// White noise
function whiteNoise(vol = 0.2) {
  const samples = new Float32Array(NUM_SAMPLES);
  for (let i = 0; i < NUM_SAMPLES; i++) samples[i] = (Math.random() * 2 - 1) * vol;
  return samples;
}

// Gentle sine drone with harmonics (sci-fi hum)
function sciFiHum(baseFreq = 60, vol = 0.25) {
  const samples = new Float32Array(NUM_SAMPLES);
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;
    samples[i] = (
      Math.sin(2 * Math.PI * baseFreq * t) * 0.5 +
      Math.sin(2 * Math.PI * baseFreq * 2.0 * t) * 0.25 +
      Math.sin(2 * Math.PI * baseFreq * 3.0 * t) * 0.1 +
      (Math.random() * 2 - 1) * 0.03 // subtle noise
    ) * vol;
  }
  return samples;
}

// Soft chord + noise (cafe style)
function cafeAmbience(vol = 0.2) {
  const samples = new Float32Array(NUM_SAMPLES);
  const noiseFloor = whiteNoise(0.05);
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;
    const chord =
      Math.sin(2 * Math.PI * 261.63 * t) * 0.1 + // C4
      Math.sin(2 * Math.PI * 329.63 * t) * 0.08 + // E4
      Math.sin(2 * Math.PI * 392.00 * t) * 0.06;  // G4
    // Slow tremolo
    const tremolo = 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.08 * t);
    samples[i] = (chord * tremolo + noiseFloor[i]) * vol;
  }
  return samples;
}

// Summer: layered high-frequency sine waves (crickets-ish)
function summerAmbience(vol = 0.2) {
  const samples = new Float32Array(NUM_SAMPLES);
  const noise = pinkNoise(0.1);
  const freqs = [3200, 3400, 3600, 4000, 4200];
  for (let i = 0; i < NUM_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;
    for (const f of freqs) {
      const amp = 0.5 + 0.5 * Math.sin(2 * Math.PI * (0.5 + Math.random() * 0.5) * t);
      s += Math.sin(2 * Math.PI * f * t) * amp * 0.04;
    }
    samples[i] = (s + noise[i]) * vol;
  }
  return samples;
}

const outDir = path.join(__dirname, '..', 'public', 'audio');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

writeWav(path.join(outDir, 'track1.wav'), pinkNoise(0.35));       // Rain on Roof
writeWav(path.join(outDir, 'track2.wav'), pinkNoise(0.5));        // Thunderstorm (louder pink)
writeWav(path.join(outDir, 'track3.wav'), cafeAmbience(0.4));     // Cafe Ambience
writeWav(path.join(outDir, 'track4.wav'), sciFiHum(55, 0.3));     // Sci-Fi Hum
writeWav(path.join(outDir, 'track5.wav'), summerAmbience(0.35));  // Summer

console.log('All audio tracks generated!');
