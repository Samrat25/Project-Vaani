import { AudioSample } from './types';

export const AUDIO_SAMPLES: AudioSample[] = [
  { id: 'airspace-dispute', name: 'AIRSPACE DISPUTE', category: 'military', duration: 15, noiseProfile: { type: 'helicopter', intensity: 0.7, baseFreq: 40, label: 'Helicopter rotor + radio static' } },
  { id: 'chinook', name: 'CHINOOK', category: 'military', duration: 18, noiseProfile: { type: 'helicopter', intensity: 0.85, baseFreq: 25, label: 'Heavy helicopter blade wash' } },
  { id: 'aircraft-refuelling', name: 'AIRCRAFT REFUELLING', category: 'military', duration: 12, noiseProfile: { type: 'engine', intensity: 0.6, baseFreq: 100, label: 'Jet engine idle + pump noise' } },
  { id: 'engine-issues', name: 'ENGINE ISSUES', category: 'military', duration: 14, noiseProfile: { type: 'engine', intensity: 0.75, baseFreq: 80, label: 'Vehicle engine misfire + comms' } },
  { id: 'urban-warfare', name: 'URBAN WARFARE', category: 'military', duration: 20, noiseProfile: { type: 'gunfire', intensity: 0.9, baseFreq: 200, label: 'Small arms + urban reverb' } },
  { id: 'ph-crash-roadside', name: 'PH CRASH ROADSIDE 91', category: 'emergency', duration: 16, noiseProfile: { type: 'crowd', intensity: 0.5, baseFreq: 300, label: 'Traffic + crowd + sirens' } },
  { id: 'ph-crash-granite', name: 'PH CRASH GRANITE 42', category: 'emergency', duration: 13, noiseProfile: { type: 'wind', intensity: 0.65, baseFreq: 60, label: 'High wind + debris impact' } }
];
