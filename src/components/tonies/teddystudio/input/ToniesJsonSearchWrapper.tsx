import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Tag } from "antd";

import { ToniesJsonSearch, ToniesJsonSearchResult } from "../../common/searches/ToniesJsonSearch";
import { CheckCircleOutlined } from "@ant-design/icons";

export interface TeddyStudioDataset {
    custom: boolean;
    text: string;
    pic?: string;
    episodes: string;
    model: string;
    language: string;
    trackTitles: string[];
}

export interface ToniesJsonSearchWrapperProps {
    onSelectDataset: (dataset: TeddyStudioDataset) => void;
    /** Optional batch sibling of `onSelectDataset`. When the wrapper is used in
     * `multiSelect` mode and this is provided, a single multi-select confirmation will
     * fire one batch callback instead of N individual ones (avoids re-render thrash on
     * 20+ row adds). */
    onSelectDatasets?: (datasets: TeddyStudioDataset[]) => void;
    /** Threads `multiSelect` into the underlying primitive. Default false (single-add
     * behavior preserved). */
    multiSelect?: boolean;
}

const resultToDataset = (result: ToniesJsonSearchResult): TeddyStudioDataset => ({
    custom: false,
    text: result.contentText,
    pic: result.picture,
    episodes: result.episodes ?? "",
    model: result.model ?? "",
    language: result.language ?? "",
    trackTitles: result.trackTitles ?? [],
});

export const ToniesJsonSearchWrapper: React.FC<ToniesJsonSearchWrapperProps> = ({
    onSelectDataset,
    onSelectDatasets,
    multiSelect = false,
}) => {
    const { t } = useTranslation();

    const [lastAddedTitle, setLastAddedTitle] = useState<string | null>(null);
    const [showHint, setShowHint] = useState(false);
    const [isFading, setIsFading] = useState(false);

    const hideTimerRef = useRef<number | null>(null);

    const flashHint = (title: string) => {
        setLastAddedTitle(title);
        setShowHint(true);
        setIsFading(false);

        if (hideTimerRef.current !== null) {
            window.clearTimeout(hideTimerRef.current);
        }

        hideTimerRef.current = window.setTimeout(() => {
            setIsFading(true);
            window.setTimeout(() => setShowHint(false), 300);
        }, 2000);
    };

    const handleSelectResult = (result: ToniesJsonSearchResult) => {
        onSelectDataset(resultToDataset(result));
        flashHint(result.selectionText);
    };

    const handleSelectResults = (results: ToniesJsonSearchResult[]) => {
        if (results.length === 0) return;
        const datasets = results.map(resultToDataset);

        if (onSelectDatasets) {
            onSelectDatasets(datasets);
        } else {
            datasets.forEach(onSelectDataset);
        }

        // Surface a single combined hint for the batch — title shows the count plus the
        // first item so the user gets visual confirmation without spamming the panel.
        const headline =
            results.length === 1
                ? results[0].selectionText
                : `${results[0].selectionText} (+${results.length - 1})`;
        flashHint(headline);
    };

    useEffect(() => {
        return () => {
            if (hideTimerRef.current !== null) {
                window.clearTimeout(hideTimerRef.current);
            }
        };
    }, []);

    return (
        <div>
            <ToniesJsonSearch
                placeholder={t("tonies.teddystudio.placeholder")}
                showAddCustomTonieButton={false}
                clearInputAfterSelection
                onChange={() => {}}
                onSelectResult={handleSelectResult}
                multiSelect={multiSelect}
                onSelectResults={handleSelectResults}
            />
            {showHint && lastAddedTitle && (
                <div style={{ marginTop: 4 }}>
                    <Tag
                        icon={<CheckCircleOutlined />}
                        color="success"
                        style={{
                            textWrap: "wrap",
                            opacity: isFading ? 0 : 1,
                            transition: "opacity 0.3s ease-in-out",
                        }}
                    >
                        {t("tonies.teddystudio.addedHint", { title: lastAddedTitle })}
                    </Tag>
                </div>
            )}
        </div>
    );
};

export default ToniesJsonSearchWrapper;
