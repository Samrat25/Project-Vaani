import { AudioSample, AnalyserData, TelemetryData } from './types';
import { generateTestAudio } from './generateTestAudio';

export class VaaniAudioEngine {
  private ctx: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private rawAnalyser: AnalyserNode | null = null;
  private procAnalyser: AnalyserNode | null = null;
  
  // Filter chain
  private highpass1: BiquadFilterNode | null = null;
  private highpass2: BiquadFilterNode | null = null;
  private lowpass: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  
  // Gain nodes for routing
  private rawGain: GainNode | null = null;
  private procGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  
  private currentBuffer: AudioBuffer | null = null;
  private startTime: number = 0;
  private pauseOffset: number = 0;
  private _isPlaying: boolean = false;
  private _isIsolationOn: boolean = false;
  
  // Raw analyser buffers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private rawTimeData: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private rawFreqData: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private procTimeData: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private procFreqData: any = null;

  async init(): Promise<void> {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      this.rawAnalyser = this.ctx.createAnalyser();
      this.rawAnalyser.fftSize = 2048;
      this.rawAnalyser.smoothingTimeConstant = 0.6;
      
      this.procAnalyser = this.ctx.createAnalyser();
      this.procAnalyser.fftSize = 2048;
      this.procAnalyser.smoothingTimeConstant = 0.6;
      
      this.rawTimeData = new Uint8Array(this.rawAnalyser.frequencyBinCount);
      this.rawFreqData = new Uint8Array(this.rawAnalyser.frequencyBinCount);
      this.procTimeData = new Uint8Array(this.procAnalyser.frequencyBinCount);
      this.procFreqData = new Uint8Array(this.procAnalyser.frequencyBinCount);

      this.highpass1 = this.ctx.createBiquadFilter();
      this.highpass1.type = 'highpass';
      this.highpass1.frequency.value = 300;
      this.highpass1.Q.value = 0.7;

      this.highpass2 = this.ctx.createBiquadFilter();
      this.highpass2.type = 'highpass';
      this.highpass2.frequency.value = 200;
      this.highpass2.Q.value = 1.0;

      this.lowpass = this.ctx.createBiquadFilter();
      this.lowpass.type = 'lowpass';
      this.lowpass.frequency.value = 3800;
      this.lowpass.Q.value = 0.7;

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -40;
      this.compressor.knee.value = 6;
      this.compressor.ratio.value = 12;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.1;

      this.rawGain = this.ctx.createGain();
      this.procGain = this.ctx.createGain();
      this.masterGain = this.ctx.createGain();

      this.highpass1.connect(this.highpass2);
      this.highpass2.connect(this.lowpass);
      this.lowpass.connect(this.compressor);
      this.compressor.connect(this.procAnalyser);
      this.procAnalyser.connect(this.procGain);

      this.rawGain.connect(this.masterGain);
      this.procGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      
      this.updateRouting();
    }
    
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  async loadSample(sample: AudioSample): Promise<void> {
    await this.init();
    if (!this.ctx) return;
    this.stop();
    this.currentBuffer = await generateTestAudio(this.ctx, sample);
    this.pauseOffset = 0;
  }

  play(): void {
    if (!this.ctx || !this.currentBuffer || this._isPlaying) return;
    
    this.sourceNode = this.ctx.createBufferSource();
    this.sourceNode.buffer = this.currentBuffer;
    
    // Connect to raw path
    this.sourceNode.connect(this.rawAnalyser!);
    this.rawAnalyser!.connect(this.rawGain!);
    
    // Connect to processing path
    this.sourceNode.connect(this.highpass1!);
    
    this.sourceNode.onended = () => {
      this._isPlaying = false;
    };
    
    this.startTime = this.ctx.currentTime - this.pauseOffset;
    this.sourceNode.start(0, this.pauseOffset);
    this._isPlaying = true;
  }

  pause(): void {
    if (!this._isPlaying || !this.sourceNode || !this.ctx) return;
    this.sourceNode.stop();
    this.pauseOffset = this.ctx.currentTime - this.startTime;
    this._isPlaying = false;
  }

  stop(): void {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.pauseOffset = 0;
    this._isPlaying = false;
  }

  seek(fraction: number): void {
    if (!this.currentBuffer) return;
    const wasPlaying = this._isPlaying;
    this.stop();
    this.pauseOffset = fraction * this.currentBuffer.duration;
    if (wasPlaying) {
      this.play();
    }
  }

  toggleIsolation(on: boolean): void {
    this._isIsolationOn = on;
    this.updateRouting();
  }
  
  private updateRouting() {
    if (!this.rawGain || !this.procGain) return;
    
    if (this._isIsolationOn) {
      this.rawGain.gain.value = 0;
      this.procGain.gain.value = 1;
    } else {
      this.rawGain.gain.value = 1;
      this.procGain.gain.value = 0;
    }
  }

  getRawAnalyserData(): AnalyserData {
    if (this.rawAnalyser && this.rawTimeData && this.rawFreqData) {
      this.rawAnalyser.getByteTimeDomainData(this.rawTimeData);
      this.rawAnalyser.getByteFrequencyData(this.rawFreqData);
      return { timeData: this.rawTimeData, freqData: this.rawFreqData };
    }
    return { timeData: new Uint8Array(), freqData: new Uint8Array() };
  }

  getProcessedAnalyserData(): AnalyserData {
    if (this.procAnalyser && this.procTimeData && this.procFreqData) {
      this.procAnalyser.getByteTimeDomainData(this.procTimeData);
      this.procAnalyser.getByteFrequencyData(this.procFreqData);
      return { timeData: this.procTimeData, freqData: this.procFreqData };
    }
    return { timeData: new Uint8Array(), freqData: new Uint8Array() };
  }

  getTelemetry(): TelemetryData {
    return {
      signalLevel: this._isPlaying ? (this._isIsolationOn ? 0.8 : 0.4) : 0,
      noiseFloor: this._isPlaying ? (this._isIsolationOn ? -60 : -20) : -90,
      snrGain: this._isIsolationOn ? 25.5 : 0,
      frameLatency: Math.floor(Math.random() * 5) + 10
    };
  }

  getCurrentTime(): number {
    if (this._isPlaying && this.ctx) {
      return this.ctx.currentTime - this.startTime;
    }
    return this.pauseOffset;
  }

  getDuration(): number {
    return this.currentBuffer?.duration || 0;
  }

  getIsPlaying(): boolean {
    return this._isPlaying;
  }

  getIsIsolationOn(): boolean {
    return this._isIsolationOn;
  }

  destroy(): void {
    this.stop();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
