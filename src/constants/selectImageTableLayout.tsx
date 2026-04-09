import React from "react";

/** Width of the thumbnail-only column (matches pre-refactor Columns picture width). */
export const SELECT_IMAGE_THUMB_COL_WIDTH = 56;

/** Ant Design selection column width for multi-select in image pickers. */
export const SELECT_IMAGE_CHECKBOX_COL_WIDTH = 44;

/**
 * Target horizontal gap between checkbox↔thumbnail and thumbnail↔text.
 * Adjacent cells use half each so the sum equals this value.
 */
export const SELECT_IMAGE_CELL_GAP = 8;

export const SELECT_IMAGE_CELL_GAP_HALF = SELECT_IMAGE_CELL_GAP / 2;

/** Multi-select: selection cell padding + thumb cell padding = SELECT_IMAGE_CELL_GAP. */
export function renderSelectImageSelectionCell(originNode: React.ReactNode): React.ReactNode {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                minHeight: 40,
                boxSizing: "border-box",
                paddingLeft: SELECT_IMAGE_CELL_GAP_HALF,
                paddingRight: SELECT_IMAGE_CELL_GAP_HALF,
            }}
        >
            {originNode}
        </div>
    );
}
