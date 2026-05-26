'use client';

import type { FrequencyData } from '@/types';

/**
 * AudioAnalyser encapsulates the Web Audio API setup for
 * real-time frequency analysis. It manages AudioContext,
 * AnalyserNode lifecycle, and provides frequency band data.
 * 
 * This is the core utility used by the Edge Lighting and
 * visualization components.
 */
export class AudioAnalyser {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private streamSource: MediaStreamAudioSourceNode | null = null;
  private rafId: number = 0;
  private onData: ((data: FrequencyData) => void) | null = null;
  private sensitivity: number = 0.6;
  private isActive: boolean = false;

  constructor(sensitivity: number = 0.6) {
    this.sensitivity = sensitivity;
  }

  /**
   * Initialize the AudioContext and AnalyserNode.
   * Must be called from a user gesture due to autoplay policy.
   */
  init(): void {
    if (this.ctx) return;

    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.85;
  }

  /**
   * Connect to a HTMLMediaElement (audio/video tag).
   */
  connectToMediaElement(element: HTMLMediaElement): void {
    if (!this.ctx || !this.analyser) this.init();
    if (!this.ctx || !this.analyser) return;

    // Clean up previous source
    this.disconnect();

    this.source = this.ctx.createMediaElementSource(element);
    this.source.connect(this.analyser);
    // Note: analyser is NOT connected to destination to avoid double-routing.
    // Audio output is handled by the AudioEngine's own media element pipeline.
    // The analyser is used exclusively for frequency analysis.

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isActive = true;
    this.startLoop();
  }

  /**
   * Set callback for frequency data updates.
   */
  onFrequencyData(callback: (data: FrequencyData) => void): void {
    this.onData = callback;
  }

  /**
   * Start the requestAnimationFrame analysis loop.
   */
  private startLoop(): void {
    if (!this.analyser || !this.isActive) return;

    const analyser = this.analyser;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const sampleRate = this.ctx?.sampleRate ?? 44100;
    const binWidth = sampleRate / analyser.fftSize;

    const getEnergy = (startFreq: number, endFreq: number): number => {
      const minIndex = Math.floor(startFreq / binWidth);
      const maxIndex = Math.min(Math.floor(endFreq / binWidth), bufferLength - 1);
      let sum = 0;
      let count = 0;
      for (let i = minIndex; i <= maxIndex; i++) {
        sum += dataArray[i];
        count++;
      }
      return count > 0 ? sum / count : 0;
    };

    const loop = () => {
      if (!this.isActive) return;

      analyser.getByteFrequencyData(dataArray);

      const s = this.sensitivity;
      const data: FrequencyData = {
        bass: Math.min(255, getEnergy(20, 250) * s),
        lowMid: Math.min(255, getEnergy(250, 500) * s),
        mid: Math.min(255, getEnergy(500, 2000) * s),
        highMid: Math.min(255, getEnergy(2000, 4000) * s),
        treble: Math.min(255, getEnergy(4000, 20000) * s),
        timestamp: Date.now(),
      };

      this.onData?.(data);
      this.rafId = requestAnimationFrame(loop);
    };

    loop();
  }

  /**
   * Set sensitivity multiplier for frequency data.
   */
  setSensitivity(sensitivity: number): void {
    this.sensitivity = Math.max(0.1, Math.min(3.0, sensitivity));
  }

  /**
   * Resume the AudioContext if suspended (browser autoplay policy).
   */
  async resume(): Promise<void> {
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  /**
   * Suspend the AudioContext to save resources.
   */
  async suspend(): Promise<void> {
    if (this.ctx?.state === 'running') {
      await this.ctx.suspend();
    }
    this.isActive = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  /**
   * Disconnect all nodes and stop analysis.
   */
  disconnect(): void {
    this.isActive = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }

    try {
      if (this.source && this.analyser) {
        this.source.disconnect(this.analyser);
      }
      if (this.streamSource && this.analyser) {
        this.streamSource.disconnect(this.analyser);
      }
    } catch {}

    this.source = null;
    this.streamSource = null;
  }

  /**
   * Fully destroy the analyser and close the AudioContext.
   */
  destroy(): void {
    this.disconnect();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.analyser = null;
  }

  /**
   * Get the raw AnalyserNode (for custom use).
   */
  getAnalyserNode(): AnalyserNode | null {
    return this.analyser;
  }

  /**
   * Get the AudioContext instance.
   */
  getAudioContext(): AudioContext | null {
    return this.ctx;
  }
}
