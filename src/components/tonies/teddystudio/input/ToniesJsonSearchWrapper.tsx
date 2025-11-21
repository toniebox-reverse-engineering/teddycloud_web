import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Tag } from "antd";

import { ToniesJsonSearch, ToniesJsonSearchResult } from "../../common/search/ToniesJsonSearch";
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

    const hideTimerRef = useRef<number | null>(null);

    const handleSelectResult = (result: ToniesJsonSearchResult) => {
        const dataset = {
            custom: false,
            text: result.text,
            pic: result.picture,
            episodes: result.episodes ?? "",
            model: result.model ?? "",
            language: result.language ?? "",
        };

        onSelectDataset(dataset);

        setLastAddedTitle(result.text);
        setShowHint(true);

        if (hideTimerRef.current !== null) {
            window.clearTimeout(hideTimerRef.current);
        }

        hideTimerRef.current = window.setTimeout(() => {
            setShowHint(false);
        }, 2000) as unknown as number;
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
                    <Tag icon={<CheckCircleOutlined />} color="success">
                        {t("tonies.teddystudio.addedHint", { title: lastAddedTitle })}
                    </Tag>
                </div>
            )}
        </div>
    );
};

export default ToniesJsonSearchWrapper;
