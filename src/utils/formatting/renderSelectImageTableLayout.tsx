import React from "react";
import { SELECT_IMAGE_CELL_GAP_HALF } from "../../constants/selectImageTableLayoutSizes";

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
