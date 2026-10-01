import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Divider, Input, theme } from "antd";
import {
    CloseOutlined,
    FileSearchOutlined,
    FolderOpenOutlined,
    LoadingOutlined,
    RollbackOutlined,
} from "@ant-design/icons";

import { resolveAudioIdHashToLibraryPath } from "../../../../utils/teddycloud/modelAudioResolution";

/**
 * Input that shows the library path. When no path is stored, audio_id+hash is shown and the
 * library path can be looked up on demand ("locate in library"), as this traverses the library.
 */
export const AudioLibraryPathInput: React.FC<{
    audioId: string;
    hash: string;
    storedPath: string;
    overlay?: string;
    placeholder: string;
    disabled?: boolean;
    changedInputStyle: (changed: boolean) => React.CSSProperties | undefined;
    areAudioPairsChanged: boolean;
    isUnchanged: boolean;
    onClear: () => void;
    onUndo: () => void;
    onBrowse: () => void;
}> = ({
    audioId,
    hash,
    storedPath,
    overlay,
    placeholder,
    disabled,
    changedInputStyle,
    areAudioPairsChanged,
    isUnchanged,
    onClear,
    onUndo,
    onBrowse,
}) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const pairKey = audioId && hash ? `${audioId}/${hash}` : "";
    // Lookup result for a specific audio pair; ignored once the pair changes.
    const [lookup, setLookup] = useState<{ key: string; path: string | null } | null>(null);
    const [locatingKey, setLocatingKey] = useState<string | null>(null);

    const resolvedPath = lookup && lookup.key === pairKey ? lookup.path : null;
    const notFound = Boolean(lookup && lookup.key === pairKey && !lookup.path);
    const isLocating = Boolean(pairKey) && locatingKey === pairKey;
    const canLocate = !storedPath && Boolean(pairKey) && !resolvedPath;

    const handleLocate = async () => {
        if (!canLocate || isLocating) return;
        const key = pairKey;
        setLocatingKey(key);
        try {
            const path = await resolveAudioIdHashToLibraryPath(audioId, hash, overlay);
            setLookup({ key, path });
        } finally {
            setLocatingKey((current) => (current === key ? null : current));
        }
    };

    const displayValue =
        storedPath ||
        resolvedPath ||
        (notFound ? t("tonies.customEditor.audio.notFoundInLibrary") : "") ||
        (audioId && hash ? `${audioId} / ${hash.slice(0, 8)}...` : "");

    return (
        <Input
            value={displayValue}
            disabled={disabled}
            placeholder={placeholder}
            readOnly
            status={notFound ? "warning" : undefined}
            style={changedInputStyle(areAudioPairsChanged)}
            prefix={[
                <CloseOutlined
                    key="clear"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={onClear}
                />,
                <Divider key="d1" orientation="vertical" style={{ marginLeft: 2 }} />,
                <RollbackOutlined
                    key="undo"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={onUndo}
                    style={{
                        color: isUnchanged ? token.colorTextDisabled : token.colorText,
                        cursor: isUnchanged ? "default" : "pointer",
                    }}
                />,
                <Divider key="d2" orientation="vertical" style={{ marginLeft: 2 }} />,
            ]}
            suffix={
                <>
                    {canLocate ? (
                        <>
                            {isLocating ? (
                                <LoadingOutlined />
                            ) : (
                                <FileSearchOutlined
                                    aria-label={t("tonies.customEditor.audio.locateInLibrary")}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={handleLocate}
                                    style={{
                                        cursor: "pointer",
                                        color: notFound ? token.colorWarning : undefined,
                                    }}
                                />
                            )}
                            <Divider orientation="vertical" style={{ marginLeft: 2 }} />
                        </>
                    ) : null}
                    <FolderOpenOutlined
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={onBrowse}
                        style={{ cursor: "pointer" }}
                    />
                </>
            }
        />
    );
};
