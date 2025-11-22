import React, { JSX } from "react";
import type { TFunction } from "i18next";

export interface FeatureGroup {
    title: string;
    items: FeatureItems;
}

export interface FeatureItems {
    [key: string]: string | FeatureGroup;
}

export const renderFeatureList = (items: FeatureItems, prefix: string, t: TFunction): JSX.Element => {
    return (
        <ul>
            {Object.keys(items).map((key) => {
                const item = items[key];
                const itemPrefix = `${prefix}.${key}`;

                if (typeof item === "object" && (item as FeatureGroup).items) {
                    const group = item as FeatureGroup;

                    return (
                        <li key={key}>
                            {t(`${itemPrefix}.title`)}
                            {renderFeatureList(group.items, `${itemPrefix}.items`, t)}
                        </li>
                    );
                }

                return <li key={key}>{t(itemPrefix)}</li>;
            })}
        </ul>
    );
};
