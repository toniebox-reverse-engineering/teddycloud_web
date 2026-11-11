import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

import {
    TEDDYBOX_PIN_IDLE_MS,
    TEDDYBOX_PIN_LENGTH,
    TEDDYBOX_PIN_LOCK_MS,
    TEDDYBOX_PIN_MAX_TRIES,
    TEDDYBOX_UNLOCK_HOLD_MS,
    TEDDYBOX_UNLOCK_SLIDE_MS,
} from "../../../constants/teddybox";
import { TeddyBoxPin } from "../../../types/teddyboxTypes";
import { verifyPin } from "../../../utils/teddybox/pin";

const RING = 125.6;
const KNOB = 56;
const HIT_RADIUS = 34;

/** Possible target positions (fractions of the screen); one is picked at random. */
const TARGETS: [number, number][] = [
    [0.2, 0.3],
    [0.8, 0.32],
    [0.18, 0.56],
    [0.82, 0.58],
    [0.25, 0.82],
    [0.72, 0.84],
];

/** Each target has its own color, so parents tell them apart at a glance. */
const TARGET_COLORS: Record<"settings" | "exit", string> = {
    settings: "#4fb3ff",
    exit: "#ff6b6b",
};

const LockButton = styled.button`
    position: absolute;
    top: calc(10px + env(safe-area-inset-top, 0px));
    right: 10px;
    z-index: 20;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 0;
    background: #ffffff66;
    display: grid;
    place-items: center;
    touch-action: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;

    svg.ring {
        position: absolute;
        inset: -4px;
        width: 52px;
        height: 52px;
        transform: rotate(-90deg);
        pointer-events: none;
    }
`;

const Overlay = styled.div`
    position: fixed;
    inset: 0;
    z-index: 30;
    background: #121a24a6;
    touch-action: none;
`;

const Target = styled.div<{ $color: string }>`
    position: absolute;
    width: 76px;
    height: 76px;
    margin: -38px 0 0 -38px;
    border-radius: 50%;
    border: 4px dashed ${({ $color }) => $color};
    background: ${({ $color }) => `${$color}59`};
    display: grid;
    place-items: center;
    pointer-events: none;
    animation: pulse 1.2s ease-in-out infinite;

    span {
        position: absolute;
        top: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
        white-space: nowrap;
        color: #ffffff;
        font-size: 15px;
        font-weight: 600;
        text-shadow: 0 1px 3px #000000a6;
    }

    @keyframes pulse {
        50% {
            transform: scale(1.08);
        }
    }
`;

const Knob = styled.div`
    position: absolute;
    width: ${KNOB}px;
    height: ${KNOB}px;
    margin: -${KNOB / 2}px 0 0 -${KNOB / 2}px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 4px 14px #00000059;
    display: grid;
    place-items: center;
    touch-action: none;
    cursor: grab;
`;

const PinPanel = styled.div`
    position: fixed;
    inset: 0;
    z-index: 31;
    background: #f4f6f8;
    color: #1d2733;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 18px;
    padding: 24px;
    font-family: inherit;

    h2 {
        margin: 0;
        font-size: 22px;
    }
`;

const PinDots = styled.div`
    display: flex;
    gap: 14px;
    min-height: 22px;

    i {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 2px solid #1d2733;
    }
    i.on {
        background: #1d2733;
    }
`;

const Keypad = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 72px);
    gap: 14px;

    button {
        height: 72px;
        border-radius: 50%;
        border: 1px solid #c6cfd8;
        background: #ffffff;
        color: #1d2733;
        font-size: 26px;
        cursor: pointer;
    }
`;

const TextButton = styled.button`
    border: 0;
    background: none;
    color: #1d2733;
    font-size: 16px;
    text-decoration: underline;
    cursor: pointer;
`;

const GearIcon: React.FC<{ color?: string; size?: number }> = ({
    color = "#ffffff",
    size = 28,
}) => (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
        <path
            fill={color}
            d="M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.3 7.3 0 0 0-1.7-1L15 3.3h-4L10.7 6a7.3 7.3 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.3 7.3 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7.3 7.3 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"
            transform="translate(-1 0)"
        />
    </svg>
);

const ExitIcon: React.FC = () => (
    <svg viewBox="0 0 24 24" width={28} height={28} aria-hidden>
        <g
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H14" />
            <path d="M10 12h10M16.5 8.5 20 12l-3.5 3.5" />
        </g>
    </svg>
);

export const LockIcon: React.FC<{ color?: string; size?: number }> = ({
    color = "#33414f",
    size = 20,
}) => (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
        <rect x="5" y="10" width="14" height="10" rx="2.5" fill={color} />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke={color} strokeWidth="2.2" />
    </svg>
);

export type TeddyBoxUnlockTarget = "settings" | "exit";

interface UnlockGateProps {
    pin: TeddyBoxPin | null;
    onUnlock: (target: TeddyBoxUnlockTarget) => void;
    onSlideDone?: () => void;
}

type Slide = { targets: Record<TeddyBoxUnlockTarget, [number, number]> };

/**
 * Parent lock: hold the lock until the ring is full, then drag it into one of two targets at
 * random positions: the TeddyBox settings or leaving the TeddyBox. The finger may keep moving right
 * after holding, or lift and grab the knob again. With a PIN configured, the PIN follows.
 */
export const UnlockGate: React.FC<UnlockGateProps> = ({ pin, onUnlock, onSlideDone }) => {
    const { t } = useTranslation();
    const [holding, setHolding] = useState(false);
    const [slide, setSlide] = useState<Slide | null>(null);
    const [chosen, setChosen] = useState<TeddyBoxUnlockTarget>("settings");
    const [knob, setKnob] = useState<[number, number]>([0, 0]);
    const [pinOpen, setPinOpen] = useState(false);
    const [entered, setEntered] = useState("");
    const [message, setMessage] = useState<"" | "wrong" | "locked">("");
    const tries = useRef(0);
    const lockedUntil = useRef(0);
    const holdTimer = useRef<number | undefined>(undefined);
    const slideTimer = useRef<number | undefined>(undefined);
    const pinTimer = useRef<number | undefined>(undefined);
    const dragging = useRef(false);
    const pointer = useRef<[number, number]>([0, 0]);
    const slideRef = useRef<Slide | null>(null);
    slideRef.current = slide;

    useEffect(
        () => () => {
            window.clearTimeout(holdTimer.current);
            window.clearTimeout(slideTimer.current);
            window.clearTimeout(pinTimer.current);
        },
        [],
    );

    const openSlide = () => {
        const [first, second] = [...TARGETS].sort(() => Math.random() - 0.5);
        const at = ([x, y]: [number, number]): [number, number] => [
            x * window.innerWidth,
            y * window.innerHeight,
        ];
        setKnob(pointer.current);
        setSlide({ targets: { settings: at(first), exit: at(second) } });
        window.clearTimeout(slideTimer.current);
        slideTimer.current = window.setTimeout(() => setSlide(null), TEDDYBOX_UNLOCK_SLIDE_MS);
    };

    const startHold = (e: React.PointerEvent<HTMLButtonElement>) => {
        e.preventDefault();
        // Keep receiving the moves of this finger, so it can slide on right after holding.
        try {
            e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
            /* without capture the knob can still be grabbed after lifting the finger */
        }
        pointer.current = [e.clientX, e.clientY];
        dragging.current = true;
        setHolding(true);
        holdTimer.current = window.setTimeout(() => {
            setHolding(false);
            openSlide();
        }, TEDDYBOX_UNLOCK_HOLD_MS);
    };

    const stopHold = () => {
        window.clearTimeout(holdTimer.current);
        setHolding(false);
        // After the hold the overlay stays open: the knob can be grabbed again.
        dragging.current = false;
    };

    const closePinLater = () => {
        window.clearTimeout(pinTimer.current);
        pinTimer.current = window.setTimeout(() => setPinOpen(false), TEDDYBOX_PIN_IDLE_MS);
    };

    const slideDone = (target: TeddyBoxUnlockTarget) => {
        window.clearTimeout(slideTimer.current);
        dragging.current = false;
        setSlide(null);
        setChosen(target);
        onSlideDone?.();
        if (pin) {
            setEntered("");
            setMessage(Date.now() < lockedUntil.current ? "locked" : "");
            setPinOpen(true);
            closePinLater();
        } else {
            onUnlock(target);
        }
    };

    const moveKnob = (x: number, y: number) => {
        pointer.current = [x, y];
        const current = slideRef.current;
        if (!dragging.current || !current) return;
        setKnob([x, y]);
        (Object.keys(current.targets) as TeddyBoxUnlockTarget[]).forEach((target) => {
            const [tx, ty] = current.targets[target];
            if (dragging.current && Math.hypot(x - tx, y - ty) < HIT_RADIUS) slideDone(target);
        });
    };

    const onKnobMove = (e: React.PointerEvent) => moveKnob(e.clientX, e.clientY);

    const pressKey = (key: string) => {
        closePinLater();
        if (Date.now() < lockedUntil.current) {
            setMessage("locked");
            return;
        }
        const next =
            key === "back" ? entered.slice(0, -1) : (entered + key).slice(0, TEDDYBOX_PIN_LENGTH);
        setEntered(next);
        setMessage("");
        if (next.length < TEDDYBOX_PIN_LENGTH || !pin) return;
        if (verifyPin(next, pin)) {
            tries.current = 0;
            window.clearTimeout(pinTimer.current);
            setPinOpen(false);
            onUnlock(chosen);
            return;
        }
        tries.current += 1;
        setEntered("");
        if (tries.current >= TEDDYBOX_PIN_MAX_TRIES) {
            tries.current = 0;
            lockedUntil.current = Date.now() + TEDDYBOX_PIN_LOCK_MS;
            setMessage("locked");
        } else {
            setMessage("wrong");
        }
    };

    return (
        <>
            <LockButton
                type="button"
                aria-label={t("teddybox.kids.parentLock")}
                onPointerDown={startHold}
                onPointerMove={(e) => moveKnob(e.clientX, e.clientY)}
                onPointerUp={stopHold}
                onPointerCancel={stopHold}
            >
                <LockIcon />
                <svg className="ring" viewBox="0 0 52 52" aria-hidden>
                    <circle
                        cx="26"
                        cy="26"
                        r="20"
                        fill="none"
                        stroke="#1f6f8b"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={RING}
                        strokeDashoffset={holding ? 0 : RING}
                        style={{
                            transition: holding
                                ? `stroke-dashoffset ${TEDDYBOX_UNLOCK_HOLD_MS}ms linear`
                                : "none",
                        }}
                    />
                </svg>
            </LockButton>

            {slide && (
                <Overlay
                    onPointerDown={(e) => {
                        if (e.target === e.currentTarget) setSlide(null);
                    }}
                >
                    <svg
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                        aria-hidden
                    >
                        {(Object.keys(slide.targets) as TeddyBoxUnlockTarget[]).map((key) => (
                            <line
                                key={key}
                                x1={knob[0]}
                                y1={knob[1]}
                                x2={slide.targets[key][0]}
                                y2={slide.targets[key][1]}
                                stroke={TARGET_COLORS[key]}
                                strokeWidth="3"
                                strokeDasharray="8 8"
                                opacity="0.7"
                            />
                        ))}
                    </svg>
                    <Target
                        $color={TARGET_COLORS.settings}
                        style={{ left: slide.targets.settings[0], top: slide.targets.settings[1] }}
                    >
                        <GearIcon />
                        <span>{t("teddybox.parent.targetSettings")}</span>
                    </Target>
                    <Target
                        $color={TARGET_COLORS.exit}
                        style={{ left: slide.targets.exit[0], top: slide.targets.exit[1] }}
                    >
                        <ExitIcon />
                        <span>{t("teddybox.parent.targetExit")}</span>
                    </Target>
                    <Knob
                        style={{ left: knob[0], top: knob[1] }}
                        onPointerDown={(e) => {
                            dragging.current = true;
                            try {
                                e.currentTarget.setPointerCapture(e.pointerId);
                            } catch {
                                /* moves still arrive while the finger stays on the knob */
                            }
                        }}
                        onPointerMove={onKnobMove}
                        onPointerUp={() => {
                            if (dragging.current) {
                                dragging.current = false;
                                setSlide(null);
                            }
                        }}
                    >
                        <LockIcon size={24} />
                    </Knob>
                </Overlay>
            )}

            {pinOpen && (
                <PinPanel>
                    <h2>{t("teddybox.parent.enterPin")}</h2>
                    <PinDots>
                        {Array.from({ length: TEDDYBOX_PIN_LENGTH }, (_, i) => (
                            <i key={i} className={i < entered.length ? "on" : ""} />
                        ))}
                    </PinDots>
                    <div style={{ minHeight: 22 }}>
                        {message === "wrong" && t("teddybox.parent.pinWrong")}
                        {message === "locked" &&
                            t("teddybox.parent.pinLocked", {
                                seconds: Math.round(TEDDYBOX_PIN_LOCK_MS / 1000),
                            })}
                    </div>
                    <Keypad>
                        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((key) => (
                            <button key={key} type="button" onClick={() => pressKey(key)}>
                                {key}
                            </button>
                        ))}
                        <span />
                        <button type="button" onClick={() => pressKey("0")}>
                            0
                        </button>
                        <button
                            type="button"
                            aria-label={t("teddybox.parent.pinDelete")}
                            onClick={() => pressKey("back")}
                        >
                            ⌫
                        </button>
                    </Keypad>
                    <TextButton type="button" onClick={() => setPinOpen(false)}>
                        {t("teddybox.parent.cancel")}
                    </TextButton>
                </PinPanel>
            )}
        </>
    );
};
