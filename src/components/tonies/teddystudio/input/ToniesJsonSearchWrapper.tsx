import React from "react";
import { useTranslation } from "react-i18next";

import { ToniesJsonSearch, ToniesJsonSearchResult } from "../../common/search/ToniesJsonSearch";

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
    };

    return (
        <ToniesJsonSearch
            placeholder={t("tonies.teddystudio.placeholder")}
            onChange={() => {}}
            onSelectResult={handleSelectResult}
        />
    );
};

export default ToniesJsonSearchWrapper;
