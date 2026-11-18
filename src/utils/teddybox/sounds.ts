/*
 * Short TeddyBox feedback sounds, synthesized with Web Audio so no sound files (and no licenses)
 * are needed. Every call is best effort: without Web Audio the UI simply stays silent.
 */

let context: AudioContext | null = null;

const getContext = (): AudioContext | null => {
    if (context) return context;
    const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    try {
        context = new AudioContextClass();
    } catch {
        context = null;
    }
    return context;
};

type Note = { freq: number; at: number; length: number; type?: OscillatorType; slideTo?: number };

const playNotes = (notes: Note[], level = 0.2) => {
    const ctx = getContext();
    if (!ctx) return;
    void ctx.resume().catch(() => undefined);
    const now = ctx.currentTime;
    notes.forEach(({ freq, at, length, type = "sine", slideTo }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now + at);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + at + length);
        gain.gain.setValueAtTime(0.0001, now + at);
        gain.gain.exponentialRampToValueAtTime(level, now + at + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + at + length);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + at);
        osc.stop(now + at + length + 0.02);
    });
};

const playKnock = () => {
    const ctx = getContext();
    if (!ctx) return;
    void ctx.resume().catch(() => undefined);
    [0, 0.13].forEach((at) => {
        const length = 0.09;
        const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * length), ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 600;
        const gain = ctx.createGain();
        gain.gain.value = 0.9;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        source.start(ctx.currentTime + at);
    });
};

export const teddyBoxSounds = {
    place: () =>
        playNotes([
            { freq: 300, at: 0, length: 0.12, slideTo: 620 },
            { freq: 784, at: 0.12, length: 0.18, type: "triangle" },
        ]),
    remove: () => playNotes([{ freq: 620, at: 0, length: 0.16, slideTo: 280 }]),
    knock: playKnock,
    /**
     * Ear pressed: a short "plopp" that is as loud as the new volume (0..1) and higher the louder
     * it is, so the child hears what changed, also over a playing story.
     */
    volume: (level: number, louder: boolean) => {
        const freq = 420 + level * 480;
        playNotes(
            [
                {
                    freq: louder ? freq * 0.8 : freq * 1.2,
                    at: 0,
                    length: 0.16,
                    type: "triangle",
                    slideTo: freq,
                },
                { freq, at: 0.14, length: 0.14, type: "sine" },
            ],
            Math.max(0.04, Math.min(0.9, level * level * 0.9)),
        );
    },
    /** Ear pressed, but the volume is already at its limit (level: the current volume, 0..1). */
    limit: (level: number) =>
        playNotes(
            [{ freq: 180, at: 0, length: 0.14, type: "triangle" }],
            Math.max(0.08, Math.min(0.9, level * level * 0.9)),
        ),
    shelf: () =>
        playNotes([{ freq: 440, at: 0, length: 0.14, type: "triangle", slideTo: 560 }], 0.12),
    unlock: () =>
        playNotes(
            [
                { freq: 660, at: 0, length: 0.12 },
                { freq: 990, at: 0.1, length: 0.2 },
            ],
            0.15,
        ),
};
