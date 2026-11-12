import { useCallback, useEffect, useRef, useState } from "react";

import { TEDDYBOX_SAVE_POSITION_MS, TEDDYBOX_VOLUME_STEPS } from "../../../constants/teddybox";
import { TonieCardProps } from "../../../types/tonieTypes";
import { backendUrl } from "../../../utils/basePath";
import { getPosition, setPosition } from "../../../utils/teddybox/deviceStorage";
import { neighbourTrackStart, trackIndexAt } from "../../../utils/teddybox/tracks";

type AudioGraph = { context: AudioContext; gain: GainNode };

/** Perceived loudness grows roughly with the square of the gain. */
const gainFor = (volume: number) => Math.pow(volume / TEDDYBOX_VOLUME_STEPS, 2);

const isOggUrl = (url: string) => /\/....04E0\?|(\?ogg)/.test(url);

interface UseTeddyBoxPlayerOptions {
    maxVolume: number;
    initialVolume: number;
    resume: boolean;
    onVolumeChange?: (volume: number) => void;
}

/**
 * Own audio element for the TeddyBox, independent of the global player of the admin UI.
 * Volume goes through a Web Audio gain node, because iOS ignores HTMLAudioElement.volume.
 */
export const useTeddyBoxPlayer = ({
    maxVolume,
    initialVolume,
    resume,
    onVolumeChange,
}: UseTeddyBoxPlayerOptions) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const graphRef = useRef<AudioGraph | null>(null);
    const currentRef = useRef<TonieCardProps | null>(null);
    const lastSaveRef = useRef(0);

    const [current, setCurrent] = useState<TonieCardProps | null>(null);
    const [trackIndex, setTrackIndex] = useState(0);
    const [volume, setVolume] = useState(() => Math.min(initialVolume, maxVolume));
    const [error, setError] = useState(false);

    const trackSeconds = useCallback(
        (tonie: TonieCardProps | null) => (tonie?.trackSeconds?.length ? tonie.trackSeconds : [0]),
        [],
    );

    const savePosition = useCallback(() => {
        const audio = audioRef.current;
        const tonie = currentRef.current;
        if (audio && tonie && resume) setPosition(tonie.ruid, audio.currentTime);
    }, [resume]);

    const applyVolume = useCallback((value: number) => {
        const graph = graphRef.current;
        if (graph) {
            graph.gain.gain.value = gainFor(value);
        } else if (audioRef.current) {
            audioRef.current.volume = Math.min(1, gainFor(value));
        }
    }, []);

    if (!audioRef.current && typeof Audio !== "undefined") {
        audioRef.current = new Audio();
        audioRef.current.preload = "none";
    }

    // The gain node can only be created after a user gesture on some browsers.
    const ensureGraph = useCallback(() => {
        const audio = audioRef.current;
        if (graphRef.current || !audio) return;
        const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;
        try {
            const context = new AudioContextClass();
            const source = context.createMediaElementSource(audio);
            const gain = context.createGain();
            source.connect(gain);
            gain.connect(context.destination);
            graphRef.current = { context, gain };
            audio.volume = 1;
        } catch (err) {
            console.warn("TeddyBox: Web Audio not available, using element volume", err);
        }
    }, []);

    useEffect(() => {
        applyVolume(volume);
    }, [volume, applyVolume]);

    useEffect(() => {
        if (volume > maxVolume) setVolume(maxVolume);
    }, [maxVolume, volume]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onTime = () => {
            setTrackIndex(trackIndexAt(trackSeconds(currentRef.current), audio.currentTime));
            if (Date.now() - lastSaveRef.current > TEDDYBOX_SAVE_POSITION_MS) {
                lastSaveRef.current = Date.now();
                savePosition();
            }
        };
        const onEnded = () => {
            const tonie = currentRef.current;
            if (tonie) setPosition(tonie.ruid, 0);
            currentRef.current = null;
            setCurrent(null);
        };
        const onError = () => {
            if (currentRef.current) setError(true);
        };
        const onPageHide = () => savePosition();

        audio.addEventListener("timeupdate", onTime);
        audio.addEventListener("ended", onEnded);
        audio.addEventListener("error", onError);
        window.addEventListener("pagehide", onPageHide);
        return () => {
            audio.removeEventListener("timeupdate", onTime);
            audio.removeEventListener("ended", onEnded);
            audio.removeEventListener("error", onError);
            window.removeEventListener("pagehide", onPageHide);
        };
    }, [savePosition, trackSeconds]);

    // Stop playback when the TeddyBox closes. The audio graph stays: an element can only be
    // connected to Web Audio once, and React may run this cleanup before mounting again.
    useEffect(
        () => () => {
            savePosition();
            audioRef.current?.pause();
            void graphRef.current?.context.suspend().catch(() => undefined);
        },
        [savePosition],
    );

    const play = useCallback(
        (tonie: TonieCardProps) => {
            const audio = audioRef.current;
            if (!audio) return;
            savePosition();
            ensureGraph();
            void graphRef.current?.context.resume().catch(() => undefined);
            applyVolume(volume);

            const url = backendUrl(tonie.audioUrl);
            audio.pause();
            audio.innerHTML = "";
            const source = document.createElement("source");
            source.src = url.replace("+", "%2B").replace("#", "%23");
            if (isOggUrl(url)) source.type = "audio/ogg";
            audio.appendChild(source);
            audio.load();

            const start = resume ? getPosition(tonie.ruid) : 0;
            if (start > 0) {
                const seek = () => {
                    audio.currentTime = start;
                    audio.removeEventListener("loadedmetadata", seek);
                };
                audio.addEventListener("loadedmetadata", seek);
            }

            currentRef.current = tonie;
            lastSaveRef.current = Date.now();
            setCurrent(tonie);
            setTrackIndex(trackIndexAt(trackSeconds(tonie), start));
            setError(false);
            audio.play().catch((err) => {
                console.warn("TeddyBox: playback failed", err);
                setError(true);
            });

            if ("mediaSession" in navigator && typeof MediaMetadata !== "undefined") {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: tonie.tonieInfo?.episode || tonie.tonieInfo?.series || "",
                    artist: tonie.tonieInfo?.series || "",
                    artwork: tonie.tonieInfo?.picture
                        ? [{ src: backendUrl(tonie.tonieInfo.picture) }]
                        : [],
                });
            }
        },
        [applyVolume, ensureGraph, resume, savePosition, trackSeconds, volume],
    );

    const stop = useCallback(() => {
        savePosition();
        audioRef.current?.pause();
        currentRef.current = null;
        setCurrent(null);
        setError(false);
    }, [savePosition]);

    /** Returns false when there is no track in that direction. */
    const skip = useCallback(
        (direction: 1 | -1): boolean => {
            const audio = audioRef.current;
            const tonie = currentRef.current;
            if (!audio || !tonie) return false;
            const target = neighbourTrackStart(trackSeconds(tonie), audio.currentTime, direction);
            if (target === null) return false;
            audio.currentTime = target;
            setTrackIndex(trackIndexAt(trackSeconds(tonie), target));
            return true;
        },
        [trackSeconds],
    );

    const changeVolume = useCallback(
        (delta: 1 | -1): boolean => {
            const next = Math.min(maxVolume, Math.max(1, volume + delta));
            if (next === volume) return false;
            setVolume(next);
            onVolumeChange?.(next);
            return true;
        },
        [maxVolume, onVolumeChange, volume],
    );

    return {
        current,
        trackIndex,
        trackCount: trackSeconds(current).length,
        volume,
        error,
        play,
        stop,
        skip,
        changeVolume,
    };
};
