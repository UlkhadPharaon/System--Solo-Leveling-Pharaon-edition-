// Web Audio API Ambient Sound Generator & Timer Chime

class AmbientSynthesizer {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private isPlaying: boolean = false;
  private activeSoundType: string = 'none';

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playSound(type: 'rain' | 'focus_noise' | 'waves' | 'binaural') {
    this.stopSound();
    this.initCtx();
    if (!this.ctx) return;

    this.activeSoundType = type;
    this.isPlaying = true;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(0.15, this.ctx.currentTime);

    this.filterNode = this.ctx.createBiquadFilter();

    if (type === 'rain') {
      // Pink / Brown noise filtered like rain
      this.noiseNode = this.createNoiseBufferNode('pink');
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(800, this.ctx.currentTime);
      this.noiseNode.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
    } else if (type === 'focus_noise') {
      // Soft Brown noise for deep focus
      this.noiseNode = this.createNoiseBufferNode('brown');
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(400, this.ctx.currentTime);
      this.noiseNode.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
    } else if (type === 'waves') {
      // Oscillating filter waves
      this.noiseNode = this.createNoiseBufferNode('brown');
      this.filterNode.type = 'bandpass';
      this.filterNode.frequency.setValueAtTime(300, this.ctx.currentTime);
      
      // LFO for ocean wave modulation
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.1, this.ctx.currentTime); // slow wave
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(200, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(this.filterNode.frequency);
      lfo.start();

      this.noiseNode.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
    } else if (type === 'binaural') {
      // Alpha wave binaural pulse (432Hz & 442Hz -> 10Hz Alpha state)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.frequency.setValueAtTime(216, this.ctx.currentTime);
      osc2.frequency.setValueAtTime(226, this.ctx.currentTime);
      
      const merger = this.ctx.createChannelMerger(2);
      osc1.connect(merger, 0, 0); // left ear
      osc2.connect(merger, 0, 1); // right ear

      merger.connect(this.gainNode);
      osc1.start();
      osc2.start();
      this.noiseNode = osc1 as unknown as AudioNode;
    }

    this.gainNode.connect(this.ctx.destination);
  }

  public stopSound() {
    if (this.gainNode && this.ctx) {
      try {
        this.gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
      } catch {
        // ignore
      }
    }
    setTimeout(() => {
      if (this.noiseNode) {
        try {
          (this.noiseNode as unknown as { stop?: () => void }).stop?.();
        } catch {
          // ignore
        }
        this.noiseNode = null;
      }
      this.isPlaying = false;
      this.activeSoundType = 'none';
    }, 500);
  }

  public playGongChime() {
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now); // A4
    osc.frequency.exponentialRampToValueAtTime(220, now + 3); // drop to A3

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 3.5);
  }

  private createNoiseBufferNode(type: 'pink' | 'brown'): AudioBufferSourceNode {
    if (!this.ctx) throw new Error('AudioContext not initialized');
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; // scale down
        b6 = white * 0.115926;
      } else {
        // Brown noise
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    whiteNoise.start();
    return whiteNoise;
  }

  public getStatus() {
    return {
      isPlaying: this.isPlaying,
      soundType: this.activeSoundType,
    };
  }
}

export const audioSynth = new AmbientSynthesizer();
