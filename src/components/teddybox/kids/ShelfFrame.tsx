import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

import { TeddyBoxShelf, TeddyBoxSwitching } from "../../../types/teddyboxTypes";
import { TonieCardProps } from "../../../types/tonieTypes";
import { shade } from "../graphics/colors";
import { TonieFigure } from "../graphics/TonieFigure";
import { ShelfTabs } from "./ShelfTabs";

const SWIPE_MIN_PX = 70;
/** Sideways scrolling (two fingers on a touchpad) that counts as a swipe. */
const WHEEL_SWIPE_PX = 120;
/** A touchpad keeps scrolling for a while after the fingers left: one swipe, one shelf. */
const WHEEL_PAUSE_MS = 700;

const Screen = styled.div`
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
`;

const Area = styled.div`
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
`;

/** Slides the content of a newly chosen shelf in. */
export const ShelfSlide = styled.div`
    position: absolute;
    inset: 0;
    animation: shelfIn 260ms ease-out;

    @keyframes shelfIn {
        from {
            opacity: 0.2;
            transform: translateX(var(--shelf-from, 0));
        }
        to {
            opacity: 1;
            transform: none;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        animation: none;
    }
`;

const WallButton = styled.button`
    position: absolute;
    top: calc(10px + env(safe-area-inset-top, 0px));
    left: 10px;
    z-index: 3;
    width: 52px;
    height: 52px;
    border-radius: 14px;
    border: 0;
    background: #ffffffb3;
    display: grid;
    place-items: center;
    cursor: pointer;
`;

const Overview = styled.div`
    position: absolute;
    inset: 0;
    z-index: 4;
    background: #00000059;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    align-content: center;
    gap: 16px;
    padding: 70px 16px 16px;
    overflow: auto;
`;

const OverviewShelf = styled.button<{ $color: string }>`
    border: 0;
    border-radius: 18px;
    padding: 10px;
    aspect-ratio: 1;
    background: ${({ $color }) => shade($color, 0.7)};
    box-shadow: inset 0 0 0 6px ${({ $color }) => $color};
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-content: center;
    gap: 2px;
    cursor: pointer;
`;

const GridIcon = () => (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <g fill="#24313d">
            <rect x="3" y="3" width="8" height="8" rx="2" />
            <rect x="13" y="3" width="8" height="8" rx="2" />
            <rect x="3" y="13" width="8" height="8" rx="2" />
            <rect x="13" y="13" width="8" height="8" rx="2" />
        </g>
    </svg>
);

interface ShelfFrameProps {
    shelves: TeddyBoxShelf[];
    shelfIndex: number;
    onShelfChange: (index: number) => void;
    tonies: Map<string, TonieCardProps>;
    switching: TeddyBoxSwitching;
    children: React.ReactNode;
}

/**
 * Everything around the content of a shelf that lets the child change shelves, each switched on
 * separately: shelf buttons below (dots when they do not fit), swiping and an overview of all
 * shelves behind the button at the top left.
 */
export const ShelfFrame: React.FC<ShelfFrameProps> = ({
    shelves,
    shelfIndex,
    onShelfChange,
    tonies,
    switching,
    children,
}) => {
    const { t } = useTranslation();
    const [overview, setOverview] = useState(false);
    const [slideFrom, setSlideFrom] = useState("0px");
    const swipeStart = useRef<number | null>(null);
    const wheel = useRef({ sum: 0, last: 0, blockedUntil: 0 });

    const multiple = shelves.length > 1;
    const showTabs = multiple && switching.buttons;
    const swipe = multiple && switching.swipe;
    const overviewButton = multiple && switching.overview;

    const goShelf = (index: number) => {
        setSlideFrom(index > shelfIndex ? "80px" : index < shelfIndex ? "-80px" : "0px");
        setOverview(false);
        onShelfChange(index);
    };

    const swipeHandlers = swipe
        ? {
              onPointerDown: (e: React.PointerEvent) => {
                  swipeStart.current = e.clientX;
              },
              onPointerUp: (e: React.PointerEvent) => {
                  if (swipeStart.current === null || overview) return;
                  const dx = e.clientX - swipeStart.current;
                  swipeStart.current = null;
                  if (Math.abs(dx) < SWIPE_MIN_PX) return;
                  goShelf((shelfIndex + (dx < 0 ? 1 : -1) + shelves.length) % shelves.length);
              },
              onPointerCancel: () => {
                  swipeStart.current = null;
              },
              onWheel: (e: React.WheelEvent) => {
                  if (overview || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
                  const now = Date.now();
                  const state = wheel.current;
                  if (now - state.last > WHEEL_PAUSE_MS / 2) state.sum = 0;
                  state.last = now;
                  if (now < state.blockedUntil) {
                      // still the same swipe: wait until the touchpad comes to rest
                      state.blockedUntil = now + WHEEL_PAUSE_MS / 2;
                      return;
                  }
                  state.sum += e.deltaX;
                  if (Math.abs(state.sum) < WHEEL_SWIPE_PX) return;
                  const direction = state.sum > 0 ? 1 : -1;
                  state.sum = 0;
                  state.blockedUntil = now + WHEEL_PAUSE_MS;
                  goShelf((shelfIndex + direction + shelves.length) % shelves.length);
              },
          }
        : {};

    return (
        <Screen>
            <Area
                {...swipeHandlers}
                style={{
                    ["--shelf-from" as string]: slideFrom,
                    // swiping with a finger must not be taken over by the browser
                    touchAction: swipe ? "none" : undefined,
                }}
            >
                {children}

                {overviewButton && (
                    <WallButton
                        type="button"
                        aria-label={t("teddybox.kids.allShelves")}
                        onClick={() => setOverview((o) => !o)}
                    >
                        <GridIcon />
                    </WallButton>
                )}

                {overview && (
                    <Overview onClick={() => setOverview(false)}>
                        {shelves.map((s, index) => (
                            <OverviewShelf
                                key={s.id}
                                type="button"
                                $color={s.color}
                                aria-label={t("teddybox.kids.shelf", { number: index + 1 })}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    goShelf(index);
                                }}
                            >
                                {s.tonies.slice(0, 9).map((ruid) => {
                                    const tonie = tonies.get(ruid);
                                    return tonie ? <TonieFigure key={ruid} tonie={tonie} /> : null;
                                })}
                            </OverviewShelf>
                        ))}
                    </Overview>
                )}
            </Area>

            {showTabs && (
                <ShelfTabs
                    shelves={shelves}
                    activeIndex={shelfIndex}
                    tonies={tonies}
                    onSelect={goShelf}
                />
            )}
        </Screen>
    );
};
