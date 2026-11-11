import React from "react";
import styled from "styled-components";

import { TEDDYBOX_SHELF_ROWS } from "../../../constants/teddybox";
import { TonieCardProps } from "../../../types/tonieTypes";
import { shade } from "../graphics/colors";
import { TonieFigure } from "../graphics/TonieFigure";

/** Narrow figures on the shelf get at most this many compartment widths tall. */
const SHELF_FIGURE_MAX_HEIGHT = 1.6;

const Wall = styled.div<{ $color: string }>`
    position: absolute;
    inset: 0;
    background: ${({ $color }) =>
        `repeating-linear-gradient(90deg, ${shade($color, 0.78)} 0 22px, ${shade($color, 0.84)} 22px 44px)`};
    transition: background 300ms;
`;

const Boards = styled.div`
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-rows: repeat(${TEDDYBOX_SHELF_ROWS}, minmax(0, 1fr));
    padding: calc(64px + env(safe-area-inset-top, 0px)) 16px 8px;
`;

const Row = styled.div<{ $cols: number }>`
    position: relative;
    display: grid;
    grid-template-columns: repeat(${({ $cols }) => $cols}, minmax(0, 1fr));
    align-items: end;
    justify-items: center;
    gap: 8px;
    padding: 0 6px 18px;
    min-height: 0;

    &::after {
        content: "";
        position: absolute;
        left: -16px;
        right: -16px;
        bottom: 0;
        height: 18px;
        border-radius: 5px;
        background: linear-gradient(#ecd0a6, #cfa16b 60%, #b8884f);
        box-shadow: 0 10px 12px -8px #0000004d;
    }
`;

const Figure = styled.button<{ $highlight: boolean }>`
    position: relative;
    z-index: 1;
    /* the whole compartment: narrow figures can grow up to the next board */
    width: 100%;
    height: 100%;
    min-height: 0;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    border: 0;
    background: none;
    padding: 0;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: transform 120ms ease-out;
    filter: ${({ $highlight }) => ($highlight ? "drop-shadow(0 0 10px #fff6b0)" : "none")};

    &:active {
        transform: scale(0.9);
    }
`;

interface ShelfViewProps {
    color: string;
    columns: number;
    tonies: TonieCardProps[];
    lastPlayed?: string;
    onPick: (tonie: TonieCardProps, from: DOMRect) => void;
}

/**
 * A wooden shelf with three boards; the number of tonies per board is set per shelf. Always on
 * the calm striped wall in the color of the collection: a scene behind the figures would be too
 * busy. The background of the collection shows once a tonie is on the box.
 */
export const ShelfView: React.FC<ShelfViewProps> = ({
    color,
    columns,
    tonies,
    lastPlayed,
    onPick,
}) => (
    <Wall $color={color}>
        <Boards>
            {Array.from({ length: TEDDYBOX_SHELF_ROWS }, (_, r) => (
                <Row key={r} $cols={columns}>
                    {tonies.slice(r * columns, r * columns + columns).map((tonie) => (
                        <Figure
                            key={tonie.ruid}
                            type="button"
                            aria-label={tonie.tonieInfo?.series}
                            $highlight={tonie.ruid === lastPlayed}
                            onClick={(e) => onPick(tonie, e.currentTarget.getBoundingClientRect())}
                        >
                            <TonieFigure tonie={tonie} fill={SHELF_FIGURE_MAX_HEIGHT} />
                        </Figure>
                    ))}
                </Row>
            ))}
        </Boards>
    </Wall>
);
