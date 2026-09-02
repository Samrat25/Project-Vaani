import { AudioSample } from './types';

export async function generateTestAudio(ctx: AudioContext, sample: AudioSample): Promise<AudioBuffer> {
  const sampleRate = ctx.sampleRate;
  const duration = sample.duration;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  // Simple PRNG
  let seed = 1;
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const np = sample.noiseProfile;
  const intensity = np.intensity;
  const baseFreq = np.baseFreq || 100;

  let brownNoise = 0;
  
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    let sampleVal = 0;

    // --- Voice Component ---
    // Envelope: 2-4 Hz amplitude modulation
    const env = 0.5 + 0.5 * Math.sin(2 * Math.PI * 3 * t) * Math.sin(2 * Math.PI * 0.5 * t);
    
    // Frequency wobble
    const wobble = Math.sin(2 * Math.PI * 0.2 * t) * 5;
    
    // Formants
    const f1 = Math.sin(2 * Math.PI * (300 + wobble) * t);
    const f2 = Math.sin(2 * Math.PI * (800 + wobble * 2) * t);
    const f3 = Math.sin(2 * Math.PI * (1200 + wobble * 3) * t);
    const f4 = Math.sin(2 * Math.PI * (2500 + wobble * 4) * t);
    
    let voice = (f1 * 0.4 + f2 * 0.3 + f3 * 0.2 + f4 * 0.1) * env * 0.4;
    
    // Silence gaps to simulate words
    if (Math.sin(2 * Math.PI * 0.5 * t) < -0.6) voice = 0;

    // --- Noise Component ---
    let noise = 0;
    const wNoise = random() * 2 - 1;

    switch (np.type) {
      case 'helicopter': {
        brownNoise = (brownNoise + (0.02 * wNoise)) / 1.02;
        noise = brownNoise * 3.5;
        const chop = (t % (1 / baseFreq)) < 0.05 ? 1 : 0;
        noise += chop * 0.5;
        noise += wNoise * 0.1;
        break;
      }
      case 'gunfire': {
        const cluster = Math.max(0, Math.sin(2 * Math.PI * t * 0.5));
        if (random() < 0.0001 * cluster) {
            noise = wNoise * 4.0;
        } else {
            noise = wNoise * 0.2;
        }
        break;
      }
      case 'engine': {
        noise = wNoise * 0.2 + Math.sin(2 * Math.PI * baseFreq * t) * 0.3 + Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.1;
        break;
      }
      case 'wind': {
        const slowMod = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.2 * t) * Math.sin(2 * Math.PI * 0.8 * t);
        brownNoise = (brownNoise + (0.05 * wNoise)) / 1.05;
        noise = brownNoise * 3.0 * slowMod;
        break;
      }
      case 'crowd': {
        noise = wNoise * 0.3 * (0.8 + 0.2 * Math.sin(2 * Math.PI * 1 * t));
        break;
      }
      case 'static': {
        noise = wNoise * 0.8;
        if (random() < 0.005) noise += wNoise * 2.0;
        break;
      }
      case 'urban':
      case 'vehicle': {
        noise = (wNoise * 0.2) + (Math.sin(2 * Math.PI * baseFreq * t) * 0.2);
        if (random() < 0.0001) noise += wNoise * 1.5;
        break;
      }
    }

    noise *= intensity;

    sampleVal = voice + noise;
    data[i] = Math.max(-1, Math.min(1, sampleVal));
  }

  return buffer;
}
