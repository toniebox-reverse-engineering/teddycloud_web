import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Tag } from "antd";

import { ToniesJsonSearch, ToniesJsonSearchResult } from "../../common/searchs/ToniesJsonSearch";
import { CheckCircleOutlined } from "@ant-design/icons";

export interface ToniesJsonSearchWrapperProps {
    onSelectDataset: (dataset: {
        custom: boolean;
        text: string;
        pic?: string;
        episodes: string;
        model: string;
        language: string;
    }) => void;
}

export const ToniesJsonSearchWrapper: React.FC<ToniesJsonSearchWrapperProps> = ({ onSelectDataset }) => {
    const { t } = useTranslation();

    const [lastAddedTitle, setLastAddedTitle] = useState<string | null>(null);
    const [showHint, setShowHint] = useState(false);
    const [isFading, setIsFading] = useState(false);

    const hideTimerRef = useRef<number | null>(null);

    const handleSelectResult = (result: ToniesJsonSearchResult) => {
        const dataset = {
            custom: false,
            text: result.contentText,
            pic: result.picture,
            episodes: result.episodes ?? "",
            model: result.model ?? "",
            language: result.language ?? "",
            trackTitles: result.trackTitles ?? [],
        };

        onSelectDataset(dataset);

        setLastAddedTitle(result.selectionText);
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
