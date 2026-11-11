import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { css, keyframes } from "styled-components";

import { TEDDYBOX_VOLUME_STEPS } from "../../../constants/teddybox";
import { TeddyBoxScenery } from "../../../types/teddyboxTypes";
import { TonieCardProps } from "../../../types/tonieTypes";
import { KnockHand, SceneryBackground } from "../graphics/Scenery";
import { TEDDYBOX_VIEWBOX, TeddyBoxEar, TeddyBoxGraphic } from "../graphics/TeddyBoxGraphic";
import { TonieFigure } from "../graphics/TonieFigure";
import { ringLayout } from "../../../utils/teddybox/ringLayout";
import { useViewport } from "../hooks/useViewport";

/** How long the volume stays on the grille after an ear was pressed. */
const VOLUME_SHOW_MS = 1600;
/** A figure moved further than this is dragged, not tapped. */
const DRAG_MIN_PX = 8;
/** Where the box touches the floor, in the units of its drawing (its shadow). */
const BOX_FLOOR_Y = 338;

const knockLeft = keyframes`
    30% { transform: rotate(-4deg) translateX(-6px); }
    60% { transform: rotate(2deg); }
`;
const knockRight = keyframes`
    30% { transform: rotate(4deg) translateX(6px); }
    60% { transform: rotate(-2deg); }
`;
const bump = keyframes`
    40% { transform: translateY(-6px) scale(1.02, 0.98); }
`;
const hint = keyframes`
    0% { opacity: 0; transform: translateX(40px); }
    15% { opacity: 1; transform: translateX(0); }
    25% { transform: translateX(-14px); }
    32% { transform: translateX(0); }
    40% { transform: translateX(-14px); }
    48% { transform: translateX(0); }
    85% { opacity: 1; }
    100% { opacity: 0; }
`;

const Screen = styled.div`
    position: absolute;
    inset: 0;
    overflow: hidden;
    /* sizes below follow this area, which shrinks next to the settings drawer */
    container-type: size;
`;

const Stage = styled.div<{ $landscape: boolean }>`
    position: absolute;
    left: 50%;
    top: ${({ $landscape }) => ($landscape ? "57%" : "55%")};
    width: ${({ $landscape }) => ($landscape ? "min(60cqh, 60cqw)" : "min(78cqw, 46cqh)")};
    transform: translate(-50%, -50%);
`;

const RingFigure = styled.button<{ $playing: boolean }>`
    position: absolute;
    transform: translate(-50%, -50%);
    border: 0;
    background: none;
    padding: 0;
    cursor: grab;
    z-index: 2;
    /* the figure follows the finger, so the browser must not scroll or swipe */
    touch-action: none;
    -webkit-tap-highlight-color: transparent;
    transition:
        opacity 200ms,
        transform 120ms ease-out;

    &:active {
        transform: translate(-50%, -50%) scale(0.9);
    }
`;

/**
 * Knocking: a tap on the left or right half of the box, or just beside it, below the ears.
 * In the circle view the tonies around the box lie above these areas and stay tappable.
 */
const BodyKnock = styled.button<{ $side: "left" | "right" }>`
    position: absolute;
    top: 36%;
    bottom: -4%;
    ${({ $side }) => ($side === "left" ? "left: -30%;" : "right: -30%;")}
    width: 66%;
    border: 0;
    border-radius: 32px;
    background: transparent;
    cursor: pointer;
    z-index: 1;
    -webkit-tap-highlight-color: transparent;

    &:active {
        background: #ffffff2e;
    }
`;

const BoxWrap = styled.div<{ $knock: "left" | "right" | "bump" | null; $target: boolean }>`
    position: relative;
    transform-origin: 50% 90%;
    transition: transform 150ms ease-out;
    ${({ $target }) => ($target ? "transform: scale(1.06);" : "")}
    ${({ $knock }) =>
        $knock === "left"
            ? css`
                  animation: ${knockLeft} 380ms ease-out;
              `
            : $knock === "right"
              ? css`
                    animation: ${knockRight} 380ms ease-out;
                `
              : $knock === "bump"
                ? css`
                      animation: ${bump} 300ms ease-out;
                  `
                : ""}

    @media (prefers-reduced-motion: reduce) {
        animation: none;
    }

    svg {
        width: 100%;
        height: auto;
        display: block;
        overflow: visible;
    }
`;

const OnTop = styled.button`
    position: absolute;
    left: ${(TEDDYBOX_VIEWBOX.platformX / TEDDYBOX_VIEWBOX.width) * 100}%;
    bottom: ${(1 - TEDDYBOX_VIEWBOX.platformY / TEDDYBOX_VIEWBOX.height) * 100 - 3}%;
    width: 38%;
    transform: translateX(-50%);
    border: 0;
    background: none;
    padding: 0;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    z-index: 2;
`;

/** Next to the right side of the box, where knocking works. */
const Hand = styled.div`
    position: absolute;
    left: 88%;
    top: 42%;
    width: min(22vw, 120px);
    pointer-events: none;
    z-index: 3;
    opacity: 0;
    animation: ${hint} 2.2s ease-in-out 600ms 2;

    @media (prefers-reduced-motion: reduce) {
        display: none;
    }
`;

interface BoxViewProps {
    tonie: TonieCardProps | null;
    color: string;
    scenery: TeddyBoxScenery;
    volume: number;
    maxVolume: number;
    trackIndex: number;
    trackCount: number;
    allowTrackSkip: boolean;
    sleeping: boolean;
    showHint: boolean;
    flyFrom: DOMRect | null;
    onEar: (ear: TeddyBoxEar) => boolean;
    onKnock: (direction: 1 | -1) => boolean;
    onRemove: () => void;
    /** Circle view: the tonies of the shelf around the box, playable without leaving the box. */
    ring?: TonieCardProps[];
    onPick?: (tonie: TonieCardProps, from: DOMRect) => void;
}

export const BoxView: React.FC<BoxViewProps> = ({
    tonie,
    color,
    scenery,
    volume,
    maxVolume,
    trackIndex,
    trackCount,
    allowTrackSkip,
    sleeping,
    showHint,
    flyFrom,
    onEar,
    onKnock,
    onRemove,
    ring,
    onPick,
}) => {
    const { t } = useTranslation();
    const { landscape } = useViewport();
    const screenRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });

    useLayoutEffect(() => {
        const el = screenRef.current;
        if (!el) return;
        const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // Circle view: the tonies fill the long sides of the screen first, away from ears and
    // knock areas.
    const layout = useMemo(
        () => (ring?.length ? ringLayout(size.width, size.height, ring.length) : null),
        [ring?.length, size.width, size.height],
    );
    // without tonies around it (e.g. the preview of the general settings) the box fills the space
    const boxWidth =
        layout?.box ?? Math.min(size.width * 0.7, size.height * 0.62 * (400 / 360), 460);
    // The box stands on the floor of the background (same sizes as the Stage below).
    const stageWidth = ring
        ? Math.max(120, boxWidth)
        : landscape
          ? Math.min(size.height, size.width) * 0.6
          : Math.min(size.width * 0.78, size.height * 0.46);
    const stageCenter = size.height * (ring ? 0.5 : landscape ? 0.57 : 0.55);
    const floorY =
        stageCenter +
        stageWidth * ((BOX_FLOOR_Y - TEDDYBOX_VIEWBOX.height / 2) / TEDDYBOX_VIEWBOX.width);

    const [pressedEar, setPressedEar] = useState<TeddyBoxEar | null>(null);
    const [showVolume, setShowVolume] = useState(false);
    const volumeTimer = useRef<number | undefined>(undefined);
    useEffect(() => () => window.clearTimeout(volumeTimer.current), []);
    const [knock, setKnock] = useState<"left" | "right" | "bump" | null>(null);
    const figureRef = useRef<HTMLButtonElement>(null);
    const boxRef = useRef<HTMLDivElement>(null);

    // Circle view: a figure can also be dragged onto the box (finger, pen or mouse).
    const dragStart = useRef<{ x: number; y: number; ruid: string; moved: boolean } | null>(null);
    const suppressClick = useRef(false);
    const [drag, setDrag] = useState<{ ruid: string; dx: number; dy: number } | null>(null);
    const [overBox, setOverBox] = useState(false);

    const isOverBox = (x: number, y: number) => {
        const rect = boxRef.current?.getBoundingClientRect();
        if (!rect) return false;
        const margin = rect.width * 0.1;
        return (
            x > rect.left - margin &&
            x < rect.right + margin &&
            y > rect.top - margin &&
            y < rect.bottom + margin
        );
    };

    const dragHandlers = (item: TonieCardProps) => ({
        onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
            // not a swipe to the next collection
            e.stopPropagation();
            if (e.button !== 0) return;
            suppressClick.current = false;
            dragStart.current = { x: e.clientX, y: e.clientY, ruid: item.ruid, moved: false };
            try {
                e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
                // the pointer may already be gone
            }
        },
        onPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => {
            const start = dragStart.current;
            if (!start || start.ruid !== item.ruid) return;
            const dx = e.clientX - start.x;
            const dy = e.clientY - start.y;
            if (!start.moved && Math.hypot(dx, dy) < DRAG_MIN_PX) return;
            start.moved = true;
            const k = screenScale();
            setDrag({ ruid: item.ruid, dx: dx / k, dy: dy / k });
            setOverBox(isOverBox(e.clientX, e.clientY));
        },
        onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
            const start = dragStart.current;
            dragStart.current = null;
            if (!start?.moved) return;
            suppressClick.current = true;
            // the figure flies on from where it was let go, not from its place in the circle
            const rect = (
                e.currentTarget.querySelector("[data-figure]") ?? e.currentTarget
            ).getBoundingClientRect();
            setDrag(null);
            setOverBox(false);
            if (isOverBox(e.clientX, e.clientY)) onPick?.(item, rect);
        },
        onPointerCancel: () => {
            dragStart.current = null;
            setDrag(null);
            setOverBox(false);
        },
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
            if (suppressClick.current) {
                suppressClick.current = false;
                return;
            }
            onPick?.(item, e.currentTarget.getBoundingClientRect());
        },
    });

    // Fly the figure from its place on the shelf onto the box (FLIP animation).
    useLayoutEffect(() => {
        const el = figureRef.current;
        if (!el || !flyFrom || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }
        const to = el.getBoundingClientRect();
        if (!to.width) return;
        const k = screenScale();
        const dx = (flyFrom.left + flyFrom.width / 2 - (to.left + to.width / 2)) / k;
        const dy = (flyFrom.top + flyFrom.height / 2 - (to.top + to.height / 2)) / k;
        const scale = flyFrom.width / to.width;
        el.animate(
            [
                { transform: `translate(calc(-50% + ${dx}px), ${dy}px) scale(${scale})` },
                {
                    transform: `translate(calc(-50% + ${dx * 0.4}px), ${dy * 0.4 - 80}px) scale(1.1)`,
                    offset: 0.6,
                },
                { transform: "translate(-50%, 0) scale(1)" },
            ],
            { duration: 650, easing: "cubic-bezier(.3,.7,.4,1)" },
        );
    }, [flyFrom, tonie?.ruid]);

    /** Screen px per layout px: below 1 in the scaled preview next to the settings. */
    const screenScale = () => {
        const el = screenRef.current;
        return el && el.clientWidth ? el.getBoundingClientRect().width / el.clientWidth : 1;
    };

    const restart = (value: "left" | "right" | "bump") => {
        setKnock(null);
        requestAnimationFrame(() => setKnock(value));
    };

    const ear = (which: TeddyBoxEar) => {
        setPressedEar(which);
        window.setTimeout(() => setPressedEar(null), 170);
        setShowVolume(true);
        window.clearTimeout(volumeTimer.current);
        volumeTimer.current = window.setTimeout(() => setShowVolume(false), VOLUME_SHOW_MS);
        if (!onEar(which)) restart("bump");
    };

    const knockSide = (direction: 1 | -1) => {
        restart(direction < 0 ? "left" : "right");
        onKnock(direction);
    };

    return (
        <Screen ref={screenRef}>
            <SceneryBackground
                background={scenery.background}
                image={scenery.image}
                color={scenery.color}
                ground={{ y: floorY, ...size }}
            />

            {ring &&
                layout &&
                ring.map((item, index) => {
                    const position = layout.positions[index];
                    if (!position) return null;
                    const dragged = drag?.ruid === item.ruid ? drag : null;
                    return (
                        <RingFigure
                            key={item.ruid}
                            type="button"
                            aria-label={item.tonieInfo?.series}
                            $playing={item.ruid === tonie?.ruid}
                            style={{
                                left: position[0],
                                top: position[1],
                                width: layout.figure,
                                // while dragging only the figure moves (see TonieFigure offset)
                                ...(dragged && {
                                    transform: "translate(-50%, -50%)",
                                    zIndex: 5,
                                    cursor: "grabbing",
                                }),
                            }}
                            {...dragHandlers(item)}
                        >
                            {/* always on a milky disc, so it does not get lost in the scene; while
                                the tonie is on the box only its figure fades, the disc stays */}
                            <TonieFigure
                                tonie={item}
                                backdrop
                                faded={item.ruid === tonie?.ruid}
                                offset={dragged ? { x: dragged.dx, y: dragged.dy } : undefined}
                            />
                        </RingFigure>
                    );
                })}

            <Stage
                $landscape={landscape}
                style={ring ? { top: "50%", width: Math.max(120, boxWidth) } : undefined}
            >
                <BoxWrap
                    ref={boxRef}
                    $knock={knock}
                    $target={overBox}
                    onAnimationEnd={() => setKnock(null)}
                >
                    <TeddyBoxGraphic
                        color={color}
                        pressedEar={pressedEar}
                        sleeping={sleeping}
                        onEar={ear}
                        tracks={tonie ? { index: trackIndex, count: trackCount } : undefined}
                        volume={
                            showVolume
                                ? { value: volume, max: maxVolume, steps: TEDDYBOX_VOLUME_STEPS }
                                : null
                        }
                        earLabels={{
                            small: t("teddybox.kids.quieter"),
                            large: t("teddybox.kids.louder"),
                        }}
                    />
                    {allowTrackSkip && tonie && (
                        <>
                            <BodyKnock
                                type="button"
                                $side="left"
                                aria-label={t("teddybox.kids.previousTrack")}
                                onClick={() => knockSide(-1)}
                            />
                            <BodyKnock
                                type="button"
                                $side="right"
                                aria-label={t("teddybox.kids.nextTrack")}
                                onClick={() => knockSide(1)}
                            />
                        </>
                    )}
                    {tonie && (
                        <OnTop
                            ref={figureRef}
                            type="button"
                            aria-label={t("teddybox.kids.takeOff")}
                            onClick={onRemove}
                        >
                            <TonieFigure tonie={tonie} />
                        </OnTop>
                    )}
                </BoxWrap>
                {allowTrackSkip && showHint && trackCount > 1 && (
                    <Hand>
                        <KnockHand />
                    </Hand>
                )}
            </Stage>
        </Screen>
    );
};
