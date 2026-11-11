import React, { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

import { TeddyBoxShelf } from "../../../types/teddyboxTypes";
import { TonieCardProps } from "../../../types/tonieTypes";
import { leadOf } from "../../../utils/teddybox/teddyboxConfig";
import { shade } from "../graphics/colors";
import { PlaceholderFigure, TonieFigure } from "../graphics/TonieFigure";

/** Button sizes in px: smaller buttons are hard to hit for small fingers, so dots take over. */
const TAB_MIN = 56;
const TAB_MAX = 96;
const TAB_GAP = 14;
const BAR_PADDING = 12;

const Bar = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: ${TAB_GAP}px;
    padding: 10px ${BAR_PADDING}px calc(12px + env(safe-area-inset-bottom, 0px));
    background: #00000014;
`;

const Dot = styled.button<{ $color: string; $active: boolean }>`
    width: 44px;
    height: 44px;
    margin: 0 -${TAB_GAP / 2 - 2}px;
    border: 0;
    padding: 0;
    background: none;
    display: grid;
    place-items: center;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;

    i {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: ${({ $color }) => $color};
        opacity: ${({ $active }) => ($active ? 1 : 0.6)};
        box-shadow: ${({ $active }) => ($active ? "0 0 0 4px #ffffff" : "none")};
        transform: scale(${({ $active }) => ($active ? 1.2 : 1)});
        transition: transform 160ms;
    }
`;

const Tab = styled.button<{ $color: string; $active: boolean }>`
    flex: none;
    width: var(--tab-size, ${TAB_MAX}px);
    height: var(--tab-size, ${TAB_MAX}px);
    position: relative;
    /* square, so it is never mistaken for a round tonie */
    border-radius: 22%;
    border: 4px solid ${({ $active }) => ($active ? "#ffffff" : "transparent")};
    background: ${({ $color }) => `linear-gradient(${shade($color, 0.18)}, ${$color})`};
    box-shadow: ${({ $active }) => ($active ? "0 4px 14px #00000040" : "inset 0 -4px 0 #00000022")};
    transform: scale(${({ $active }) => ($active ? 1.1 : 1)});
    transition: transform 160ms ease-out;
    padding: 0;
    overflow: hidden;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;

    &:active {
        transform: scale(0.94);
    }
`;

/** Most mini figures on a button. */
const SHELF_FIGURES = 5;
const CIRCLE_FIGURES = 6;

const at = (left: number, top: number, size: number): React.CSSProperties => ({
    position: "absolute",
    left: `${(left - size / 2) * 100}%`,
    top: `${(top - size / 2) * 100}%`,
    width: `${size * 100}%`,
    height: `${size * 100}%`,
});

/** Figures of a collection for its button: the lead figure first, then the next ones. */
const figuresOf = (shelf: TeddyBoxShelf, tonies: Map<string, TonieCardProps>) => {
    const lead = leadOf(shelf);
    const ruids = lead ? [lead, ...shelf.tonies.filter((r) => r !== lead)] : shelf.tonies;
    return ruids
        .map((ruid) => tonies.get(ruid))
        .filter((tonie): tonie is TonieCardProps => !!tonie);
};

/**
 * Inside of a collection button: a mini shelf with two boards for the shelf display, a ring of
 * figures for the circle display, so the child can tell what comes.
 */
const ButtonContent: React.FC<{ shelf: TeddyBoxShelf; figures: TonieCardProps[] }> = ({
    shelf,
    figures,
}) => {
    if (!figures.length) {
        return (
            <div style={at(0.5, 0.52, 0.62)}>
                <PlaceholderFigure color={shade(shelf.color, -0.3)} />
            </div>
        );
    }
    if (shelf.display === "circle") {
        const shown = figures.slice(0, CIRCLE_FIGURES);
        // fewer figures can be larger; they always keep a gap in the middle
        const size = shown.length > 4 ? 0.29 : shown.length > 2 ? 0.34 : 0.38;
        const radius = shown.length === 1 ? 0 : shown.length > 4 ? 0.3 : 0.27;
        return (
            <>
                {shown.map((tonie, i) => {
                    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / shown.length;
                    return (
                        <div
                            key={tonie.ruid}
                            style={at(
                                0.5 + radius * Math.cos(angle),
                                0.5 + radius * Math.sin(angle),
                                shown.length === 1 ? 0.5 : size,
                            )}
                        >
                            <TonieFigure tonie={tonie} centered />
                        </div>
                    );
                })}
            </>
        );
    }
    const shown = figures.slice(0, SHELF_FIGURES);
    const rows = [shown.slice(0, 3), shown.slice(3)];
    const size = 0.3;
    const boards = [0.46, 0.84];
    return (
        <>
            {boards.map((top) => (
                <div
                    key={top}
                    style={{
                        position: "absolute",
                        left: "10%",
                        right: "10%",
                        top: `${top * 100}%`,
                        height: "5%",
                        borderRadius: 2,
                        background: "#f3e6d2",
                    }}
                />
            ))}
            {rows.map((row, r) =>
                row.map((tonie, i) => (
                    <div
                        key={tonie.ruid}
                        style={at(
                            0.5 + (i - (row.length - 1) / 2) * 0.28,
                            boards[r] - size / 2,
                            size,
                        )}
                    >
                        <TonieFigure tonie={tonie} />
                    </div>
                )),
            )}
        </>
    );
};

interface ShelfTabsProps {
    shelves: TeddyBoxShelf[];
    activeIndex: number;
    tonies: Map<string, TonieCardProps>;
    onSelect: (index: number) => void;
}

/**
 * Round shelf buttons below the shelf, each showing the lead figure of its shelf. They get as
 * large as the width allows; when they no longer fit in one row, colored dots take their place.
 */
export const ShelfTabs: React.FC<ShelfTabsProps> = ({ shelves, activeIndex, tonies, onSelect }) => {
    const { t } = useTranslation();
    const barRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    useLayoutEffect(() => {
        const el = barRef.current;
        if (!el) return;
        const update = () => setWidth(el.clientWidth);
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const count = shelves.length;
    const available = width - 2 * BAR_PADDING - (count - 1) * TAB_GAP;
    // room for the active button, which is drawn a bit larger
    const size = Math.min(TAB_MAX, Math.floor(available / (count + 0.1)));
    const dots = width > 0 && size < TAB_MIN;

    return (
        <Bar ref={barRef} style={{ ["--tab-size" as string]: `${Math.max(TAB_MIN, size)}px` }}>
            {shelves.map((shelf, index) => {
                if (dots) {
                    return (
                        <Dot
                            key={shelf.id}
                            type="button"
                            $color={shelf.color}
                            $active={index === activeIndex}
                            aria-label={t("teddybox.kids.shelf", { number: index + 1 })}
                            aria-pressed={index === activeIndex}
                            onClick={() => onSelect(index)}
                        >
                            <i />
                        </Dot>
                    );
                }
                return (
                    <Tab
                        key={shelf.id}
                        type="button"
                        $color={shelf.color}
                        $active={index === activeIndex}
                        aria-label={t("teddybox.kids.shelf", { number: index + 1 })}
                        aria-pressed={index === activeIndex}
                        onClick={() => onSelect(index)}
                    >
                        <ButtonContent shelf={shelf} figures={figuresOf(shelf, tonies)} />
                    </Tab>
                );
            })}
        </Bar>
    );
};

/** The collection button as the child sees it, for the preview in the editor. */
export const ShelfButtonPreview: React.FC<{
    shelf: TeddyBoxShelf;
    tonies: Map<string, TonieCardProps>;
}> = ({ shelf, tonies }) => (
    <Tab as="div" $color={shelf.color} $active aria-hidden style={{ cursor: "default" }}>
        <ButtonContent shelf={shelf} figures={figuresOf(shelf, tonies)} />
    </Tab>
);
