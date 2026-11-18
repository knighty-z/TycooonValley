import type { WorldThemeId } from '@tycoonvale/shared';

export type SoundEventId =
  | 'dice_roll'
  | 'token_step'
  | 'landing'
  | 'buy_property'
  | 'pay_rent'
  | 'receive_money'
  | 'card_draw'
  | 'auction_start'
  | 'auction_bid'
  | 'auction_won'
  | 'trade_received'
  | 'trade_accepted'
  | 'turn_start'
  | 'jail'
  | 'bankrupt'
  | 'win'
  | 'ui_click'
  | 'error';

export type SoundCategory = 'ui' | 'movement' | 'economy' | 'events' | 'auction' | 'trade';

export interface SoundCatalogEntry {
  id: SoundEventId;
  label: string;
  category: SoundCategory;
  description: string;
}

export const SOUND_CATALOG: SoundCatalogEntry[] = [
  { id: 'dice_roll', label: 'Dice Roll', category: 'movement', description: 'Procedural dice rattle' },
  { id: 'token_step', label: 'Token Step', category: 'movement', description: 'Soft step tick' },
  { id: 'landing', label: 'Landing', category: 'movement', description: 'Tile settle cue' },
  { id: 'turn_start', label: 'Turn Start', category: 'ui', description: 'Your turn ready signal' },
  { id: 'ui_click', label: 'UI Click', category: 'ui', description: 'Crisp button feedback' },
  { id: 'error', label: 'Error', category: 'ui', description: 'Invalid action buzz' },
  { id: 'buy_property', label: 'Buy Property', category: 'economy', description: 'Deed acquisition chord' },
  { id: 'pay_rent', label: 'Pay Rent', category: 'economy', description: 'Outgoing rent debit' },
  { id: 'receive_money', label: 'Receive Money', category: 'economy', description: 'Incoming cash chime' },
  { id: 'card_draw', label: 'Card Draw', category: 'events', description: 'Deck draw reveal' },
  { id: 'jail', label: 'Jail', category: 'events', description: 'Detention lock cue' },
  { id: 'bankrupt', label: 'Bankrupt', category: 'events', description: 'Elimination cadence' },
  { id: 'win', label: 'Victory', category: 'events', description: 'Match winner fanfare' },
  { id: 'auction_start', label: 'Auction Start', category: 'auction', description: 'Double gavel open' },
  { id: 'auction_bid', label: 'Auction Bid', category: 'auction', description: 'New high bid ping' },
  { id: 'auction_won', label: 'Auction Won', category: 'auction', description: 'Gavel sold fanfare' },
  { id: 'trade_received', label: 'Trade Received', category: 'trade', description: 'Incoming offer chime' },
  { id: 'trade_accepted', label: 'Trade Accepted', category: 'trade', description: 'Deal sealed cadence' }
];

const CATEGORY_GAIN: Record<SoundCategory, number> = {
  ui: 0.55,
  movement: 0.65,
  economy: 0.8,
  events: 0.85,
  auction: 0.85,
  trade: 0.82
};

const EVENT_CATEGORY: Record<SoundEventId, SoundCategory> = SOUND_CATALOG.reduce(
  (acc, item) => {
    acc[item.id] = item.category;
    return acc;
  },
  {} as Record<SoundEventId, SoundCategory>
);

interface WorldVoiceProfile {
  primaryWave: OscillatorType;
  accentWave: OscillatorType;
  subWave: OscillatorType;
  rootMult: number;
  decayMult: number;
  filterHz: number;
  detuneCents: number;
}

const WORLD_PROFILES: Record<WorldThemeId, WorldVoiceProfile> = {
  // Soft chimes and warm wood taps
  original: {
    primaryWave: 'sine',
    accentWave: 'triangle',
    subWave: 'sine',
    rootMult: 1.0,
    decayMult: 1.12,
    filterHz: 2600,
    detuneCents: 0
  },
  // Sharp tactical clicks, low sub-hits, short metallic tones
  valorant: {
    primaryWave: 'square',
    accentWave: 'triangle',
    subWave: 'sawtooth',
    rootMult: 1.12,
    decayMult: 0.72,
    filterHz: 3400,
    detuneCents: -6
  },
  // Warm bells, woody resonant taps, soft pentatonic chimes
  india: {
    primaryWave: 'triangle',
    accentWave: 'sine',
    subWave: 'sine',
    rootMult: 0.94,
    decayMult: 1.24,
    filterHz: 2900,
    detuneCents: 4
  },
  // Synth blips, micro pitch glitches, deep low pulses
  cyberpunk: {
    primaryWave: 'sawtooth',
    accentWave: 'square',
    subWave: 'sawtooth',
    rootMult: 1.18,
    decayMult: 0.86,
    filterHz: 3900,
    detuneCents: 14
  },
  // Playful toy-marimba plucks, cheerful bubble pops & bright pastel chimes
  wompwomp: {
    primaryWave: 'triangle',
    accentWave: 'sine',
    subWave: 'sine',
    rootMult: 1.16,
    decayMult: 0.96,
    filterHz: 3400,
    detuneCents: 6
  }
};

const MAX_POLYPHONY = 8;

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.7;
  private currentWorld: WorldThemeId = 'original';
  private hasUserGesture: boolean = false;
  private activeVoices: number = 0;
  private gestureAttached: boolean = false;
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    this.attachGestureListeners();
  }

  private attachGestureListeners(): void {
    if (typeof window === 'undefined' || this.gestureAttached) return;
    this.gestureAttached = true;

    const unlock = () => {
      this.hasUserGesture = true;
      this.ensureGraph();
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {});
      }
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
    };

    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('keydown', unlock, true);
  }

  /** Explicitly mark user gesture (e.g. from direct button click handler) */
  public unlock(): void {
    this.hasUserGesture = true;
    this.ensureGraph();
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
  }

  private ensureGraph(): AudioContext | null {
    if (!this.hasUserGesture || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      // Gentle master limiter so concurrent cues never clip or jump in loudness
      this.limiter = this.ctx.createDynamicsCompressor();
      this.limiter.threshold.setValueAtTime(-10, this.ctx.currentTime);
      this.limiter.knee.setValueAtTime(14, this.ctx.currentTime);
      this.limiter.ratio.setValueAtTime(6, this.ctx.currentTime);
      this.limiter.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.limiter.release.setValueAtTime(0.14, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);

      this.masterGain.connect(this.limiter);
      this.limiter.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer && this.noiseBuffer.sampleRate === ctx.sampleRate) {
      return this.noiseBuffer;
    }
    const len = Math.floor(ctx.sampleRate * 0.16);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  public setWorld(worldId: WorldThemeId): void {
    this.currentWorld = worldId;
  }

  public getWorld(): WorldThemeId {
    return this.currentWorld;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.015);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.015);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getActiveVoiceCount(): number {
    return this.activeVoices;
  }

  public getMaxPolyphony(): number {
    return MAX_POLYPHONY;
  }

  public getCategoryBalance(): Record<SoundCategory, number> {
    return { ...CATEGORY_GAIN };
  }

  private canAllocateVoice(): boolean {
    return this.activeVoices < MAX_POLYPHONY;
  }

  private scheduleTone(
    ctx: AudioContext,
    opts: {
      startOffset: number;
      duration: number;
      freqStart: number;
      freqEnd?: number;
      wave: OscillatorType;
      gainPeak: number;
      filterHz?: number;
      detune?: number;
    }
  ): void {
    if (!this.masterGain || !this.canAllocateVoice()) return;
    this.activeVoices += 1;

    const now = ctx.currentTime + opts.startOffset;
    const dur = Math.max(0.025, opts.duration);
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = opts.wave;
    osc.frequency.setValueAtTime(Math.max(40, opts.freqStart), now);
    if (opts.freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, opts.freqEnd), now + dur);
    }
    if (opts.detune) {
      osc.detune.setValueAtTime(opts.detune, now);
    }

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(opts.filterHz ?? 3000, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(Math.min(0.45, opts.gainPeak), now + Math.min(0.01, dur * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.onended = () => {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
      try {
        osc.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch {
        // already disconnected
      }
    };

    osc.start(now);
    osc.stop(now + dur + 0.01);
  }

  private scheduleNoiseTap(
    ctx: AudioContext,
    opts: { startOffset: number; duration: number; bandHz: number; gainPeak: number }
  ): void {
    if (!this.masterGain || !this.canAllocateVoice()) return;
    this.activeVoices += 1;

    const now = ctx.currentTime + opts.startOffset;
    const dur = Math.max(0.015, opts.duration);
    const src = ctx.createBufferSource();
    src.buffer = this.getNoiseBuffer(ctx);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(opts.bandHz, now);
    filter.Q.setValueAtTime(2.2, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(Math.min(0.35, opts.gainPeak), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    src.onended = () => {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
      try {
        src.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch {
        // ignore
      }
    };

    src.start(now);
    src.stop(now + dur + 0.01);
  }

  /**
   * Main procedural synth entry point for all 18 Phase F sound cues across all 4 worlds.
   */
  public play(event: SoundEventId, worldOverride?: WorldThemeId): void {
    if (this.isMuted || this.volume <= 0) return;
    const ctx = this.ensureGraph();
    if (!ctx) return;

    const world = worldOverride ?? this.currentWorld;
    const p = WORLD_PROFILES[world] ?? WORLD_PROFILES.original;
    const catGain = CATEGORY_GAIN[EVENT_CATEGORY[event]] ?? 0.75;
    const f = (hz: number) => hz * p.rootMult;
    const d = (sec: number) => sec * p.decayMult;

    switch (event) {
      case 'ui_click': {
        this.scheduleTone(ctx, {
          startOffset: 0,
          duration: d(0.045),
          freqStart: f(world === 'valorant' ? 880 : 620),
          freqEnd: f(world === 'cyberpunk' ? 1140 : 760),
          wave: p.primaryWave,
          gainPeak: 0.14 * catGain,
          filterHz: p.filterHz,
          detune: p.detuneCents
        });
        break;
      }

      case 'error': {
        [0, 0.09].forEach(offset => {
          this.scheduleTone(ctx, {
            startOffset: offset,
            duration: 0.075,
            freqStart: 195,
            freqEnd: 135,
            wave: 'sawtooth',
            gainPeak: 0.18 * catGain,
            filterHz: 1100
          });
        });
        break;
      }

      case 'dice_roll': {
        const hits = 5;
        for (let i = 0; i < hits; i++) {
          const t = i * 0.052;
          const jitter = 0.85 + Math.random() * 0.35;
          this.scheduleNoiseTap(ctx, {
            startOffset: t,
            duration: 0.032,
            bandHz: f(world === 'valorant' ? 1900 : 1200) * jitter,
            gainPeak: 0.16 * catGain
          });
          this.scheduleTone(ctx, {
            startOffset: t,
            duration: 0.038,
            freqStart: f(320) * jitter,
            freqEnd: f(170),
            wave: p.accentWave,
            gainPeak: 0.11 * catGain,
            filterHz: p.filterHz
          });
        }
        break;
      }

      case 'token_step': {
        this.scheduleTone(ctx, {
          startOffset: 0,
          duration: d(0.042),
          freqStart: f(world === 'india' ? 380 : 490),
          freqEnd: f(230),
          wave: p.accentWave,
          gainPeak: 0.14 * catGain,
          filterHz: p.filterHz
        });
        break;
      }

      case 'landing': {
        this.scheduleTone(ctx, {
          startOffset: 0,
          duration: d(0.11),
          freqStart: f(260),
          freqEnd: f(140),
          wave: p.subWave,
          gainPeak: 0.19 * catGain,
          filterHz: 1400
        });
        this.scheduleTone(ctx, {
          startOffset: 0.02,
          duration: d(0.09),
          freqStart: f(580),
          freqEnd: f(640),
          wave: p.primaryWave,
          gainPeak: 0.09 * catGain,
          filterHz: p.filterHz
        });
        break;
      }

      case 'turn_start': {
        [523.25, 659.25].forEach((note, idx) => {
          this.scheduleTone(ctx, {
            startOffset: idx * 0.075,
            duration: d(0.16),
            freqStart: f(note),
            wave: p.primaryWave,
            gainPeak: 0.15 * catGain,
            filterHz: p.filterHz,
            detune: p.detuneCents
          });
        });
        break;
      }

      case 'buy_property': {
        const chord = world === 'india' ? [523.25, 587.33, 783.99, 1046.5] : [523.25, 659.25, 783.99, 1046.5];
        chord.forEach((note, idx) => {
          this.scheduleTone(ctx, {
            startOffset: idx * 0.06,
            duration: d(0.22),
            freqStart: f(note),
            wave: p.primaryWave,
            gainPeak: 0.17 * catGain,
            filterHz: p.filterHz,
            detune: p.detuneCents
          });
        });
        break;
      }

      case 'pay_rent': {
        [440, 349.23, 293.66].forEach((note, idx) => {
          this.scheduleTone(ctx, {
            startOffset: idx * 0.07,
            duration: d(0.15),
            freqStart: f(note),
            wave: p.accentWave,
            gainPeak: 0.17 * catGain,
            filterHz: 1900
          });
        });
        break;
      }

      case 'receive_money': {
        [880, 1174.66, 1318.51].forEach((note, idx) => {
          this.scheduleTone(ctx, {
            startOffset: idx * 0.06,
            duration: d(0.18),
            freqStart: f(note),
            wave: p.primaryWave,
            gainPeak: 0.16 * catGain,
            filterHz: p.filterHz
          });
        });
        break;
      }

      case 'card_draw': {
        this.scheduleNoiseTap(ctx, {
          startOffset: 0,
          duration: 0.07,
          bandHz: 2400,
          gainPeak: 0.14 * catGain
        });
        this.scheduleTone(ctx, {
          startOffset: 0.03,
          duration: d(0.2),
          freqStart: f(420),
          freqEnd: f(980),
          wave: p.primaryWave,
          gainPeak: 0.16 * catGain,
          filterHz: p.filterHz
        });
        break;
      }

      case 'auction_start': {
        // Double gavel strike + metallic resonance
        [0, 0.14].forEach(offset => {
          this.scheduleNoiseTap(ctx, {
            startOffset: offset,
            duration: 0.045,
            bandHz: 900,
            gainPeak: 0.24 * catGain
          });
          this.scheduleTone(ctx, {
            startOffset: offset,
            duration: d(0.13),
            freqStart: f(210),
            freqEnd: f(115),
            wave: p.subWave,
            gainPeak: 0.22 * catGain,
            filterHz: 1500
          });
        });
        this.scheduleTone(ctx, {
          startOffset: 0.2,
          duration: d(0.25),
          freqStart: f(660),
          wave: p.primaryWave,
          gainPeak: 0.14 * catGain,
          filterHz: p.filterHz
        });
        break;
      }

      case 'auction_bid': {
        this.scheduleTone(ctx, {
          startOffset: 0,
          duration: d(0.11),
          freqStart: f(620),
          freqEnd: f(880),
          wave: p.primaryWave,
          gainPeak: 0.18 * catGain,
          filterHz: p.filterHz,
          detune: p.detuneCents
        });
        break;
      }

      case 'auction_won': {
        this.scheduleNoiseTap(ctx, {
          startOffset: 0,
          duration: 0.04,
          bandHz: 1050,
          gainPeak: 0.22 * catGain
        });
        [523.25, 659.25, 783.99, 1046.5].forEach((note, idx) => {
          this.scheduleTone(ctx, {
            startOffset: 0.05 + idx * 0.065,
            duration: d(0.26),
            freqStart: f(note),
            wave: p.primaryWave,
            gainPeak: 0.18 * catGain,
            filterHz: p.filterHz
          });
        });
        break;
      }

      case 'trade_received': {
        [587.33, 880].forEach((note, idx) => {
          this.scheduleTone(ctx, {
            startOffset: idx * 0.1,
            duration: d(0.2),
            freqStart: f(note),
            wave: p.primaryWave,
            gainPeak: 0.16 * catGain,
            filterHz: p.filterHz
          });
        });
        break;
      }

      case 'trade_accepted': {
        [440, 554.37, 659.25, 880].forEach((note, idx) => {
          this.scheduleTone(ctx, {
            startOffset: idx * 0.055,
            duration: d(0.24),
            freqStart: f(note),
            wave: p.primaryWave,
            gainPeak: 0.18 * catGain,
            filterHz: p.filterHz
          });
        });
        break;
      }

      case 'jail': {
        this.scheduleNoiseTap(ctx, {
          startOffset: 0,
          duration: 0.06,
          bandHz: 1800,
          gainPeak: 0.22 * catGain
        });
        this.scheduleTone(ctx, {
          startOffset: 0.02,
          duration: 0.32,
          freqStart: 180,
          freqEnd: 92,
          wave: 'sawtooth',
          gainPeak: 0.22 * catGain,
          filterHz: 1100
        });
        break;
      }

      case 'bankrupt': {
        [329.63, 293.66, 246.94, 196.0].forEach((note, idx) => {
          this.scheduleTone(ctx, {
            startOffset: idx * 0.12,
            duration: 0.24,
            freqStart: note,
            wave: 'triangle',
            gainPeak: 0.2 * catGain,
            filterHz: 1400
          });
        });
        break;
      }

      case 'win': {
        [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((note, idx) => {
          this.scheduleTone(ctx, {
            startOffset: idx * 0.085,
            duration: d(0.32),
            freqStart: f(note),
            wave: p.primaryWave,
            gainPeak: 0.19 * catGain,
            filterHz: p.filterHz
          });
        });
        break;
      }
    }
  }

  // Backward-compatible legacy helpers delegating cleanly to the unified synth
  public playClick(): void {
    this.play('ui_click');
  }

  public playTokenStep(): void {
    this.play('token_step');
  }

  public playDiceRoll(): void {
    this.play('dice_roll');
  }

  public playWorldDiceRoll(worldId: WorldThemeId = 'original'): void {
    this.play('dice_roll', worldId);
  }

  public playCoin(): void {
    this.play('receive_money');
  }

  public playBuy(): void {
    this.play('buy_property');
  }

  public playCardDraw(): void {
    this.play('card_draw');
  }

  public playJailBuzzer(): void {
    this.play('jail');
  }

  public playTurnNotification(): void {
    this.play('turn_start');
  }
}

export const soundEngine = new SoundEngine();
