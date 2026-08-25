import React, { useEffect, useState } from "react";
import { Divider, Input, theme } from "antd";
import { CloseOutlined, FolderOpenOutlined, RollbackOutlined } from "@ant-design/icons";

import { resolveAudioIdHashToLibraryPath } from "../../../../utils/teddycloud/modelAudioResolution";

/** Input that shows library path, resolving from audio_id+hash when not stored. */
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
    const { token } = theme.useToken();
    const [resolvedPath, setResolvedPath] = useState<string | null>(null);

    useEffect(() => {
        if (storedPath || !audioId || !hash) {
            setResolvedPath(null);
            return;
        }
        let cancelled = false;
        resolveAudioIdHashToLibraryPath(audioId, hash, overlay).then((p) => {
            if (!cancelled && p) setResolvedPath(p);
        });
        return () => {
            cancelled = true;
        };
    }, [audioId, hash, storedPath, overlay]);

    const displayValue =
        storedPath ||
        resolvedPath ||
        (audioId && hash ? `${audioId} / ${hash.slice(0, 8)}...` : "");

    return (
        <Input
            value={displayValue}
            disabled={disabled}
            placeholder={placeholder}
            readOnly
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
                <FolderOpenOutlined
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={onBrowse}
                    style={{ cursor: "pointer" }}
                />
            }
        />
    );
};
