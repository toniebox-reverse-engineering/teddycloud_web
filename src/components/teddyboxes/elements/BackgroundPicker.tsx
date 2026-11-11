import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ColorPicker, Flex, Typography, theme } from "antd";
import { CheckCircleFilled, PictureOutlined, RollbackOutlined } from "@ant-design/icons";

import { TEDDYBOX_BACKGROUNDS, TeddyBoxBackground } from "../../../types/teddyboxTypes";
import SelectImageModal from "../../tonies/common/modals/SelectImageModal";
import { TEDDYBOX_PLAIN_COLORS, TEDDYBOX_PLAIN_DEFAULT_COLOR } from "../../../constants/teddybox";
import { SceneryBackground } from "../../teddybox/graphics/Scenery";

const { Text } = Typography;
const { useToken } = theme;

/**
 * Tiles in the proportions of a phone in portrait, cut like the kids view: the box stands on the
 * floor at about two thirds of the height (see BoxView).
 */
const TILE_WIDTH = 60;
const TILE_HEIGHT = 104;
const TILE_GROUND = { y: TILE_HEIGHT * 0.64, width: TILE_WIDTH, height: TILE_HEIGHT };

/** "inherit": a collection uses the background of the box. */
export type BackgroundChoice = TeddyBoxBackground | "image" | "inherit";

interface TileProps {
    selected: boolean;
    label: string;
    onClick: () => void;
    children: React.ReactNode;
}

const Tile: React.FC<TileProps> = ({ selected, label, onClick, children }) => {
    const { token } = useToken();
    return (
        <Flex vertical align="center" gap={4} style={{ width: TILE_WIDTH * 1.5 }}>
            <button
                type="button"
                aria-label={label}
                aria-pressed={selected}
                onClick={onClick}
                style={{
                    position: "relative",
                    width: TILE_WIDTH,
                    height: TILE_HEIGHT,
                    padding: 0,
                    overflow: "hidden",
                    cursor: "pointer",
                    borderRadius: token.borderRadius,
                    border: `2px solid ${selected ? token.colorPrimary : token.colorBorder}`,
                    background: token.colorFillTertiary,
                    display: "grid",
                    placeItems: "center",
                }}
            >
                {children}
                {selected && (
                    <CheckCircleFilled
                        style={{
                            position: "absolute",
                            right: 4,
                            bottom: 4,
                            color: token.colorPrimary,
                            background: token.colorBgContainer,
                            borderRadius: "50%",
                        }}
                    />
                )}
            </button>
            <Text style={{ fontSize: token.fontSizeSM, textAlign: "center" }}>{label}</Text>
        </Flex>
    );
};

interface BackgroundPickerProps {
    value: BackgroundChoice;
    image?: string;
    /** Color of the plain background. */
    color?: string;
    /** Offer "default" (the background of the Teddybox), for collections. */
    collection?: boolean;
    onChange: (value: BackgroundChoice, image?: string) => void;
    onColorChange: (color: string) => void;
}

/** Backgrounds as small previews, so parents see what the child will see. */
export const BackgroundPicker: React.FC<BackgroundPickerProps> = ({
    value,
    image,
    color,
    collection = false,
    onChange,
    onColorChange,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const [picking, setPicking] = useState(false);

    return (
        <>
            <Flex wrap gap={8}>
                {collection && (
                    <Tile
                        selected={value === "inherit"}
                        label={t("teddybox.edit.backgrounds.inherit")}
                        onClick={() => onChange("inherit")}
                    >
                        <RollbackOutlined style={{ fontSize: token.fontSizeHeading3 }} />
                    </Tile>
                )}
                {TEDDYBOX_BACKGROUNDS.map((background) => (
                    <Tile
                        key={background}
                        selected={value === background}
                        label={t(`teddybox.edit.backgrounds.${background}`)}
                        onClick={() => onChange(background)}
                    >
                        <SceneryBackground
                            background={background}
                            color={color}
                            ground={TILE_GROUND}
                        />
                    </Tile>
                ))}
                <Tile
                    selected={value === "image"}
                    label={t("teddybox.edit.backgrounds.image")}
                    onClick={() => setPicking(true)}
                >
                    {value === "image" && image ? (
                        <SceneryBackground background="plain" image={image} />
                    ) : (
                        <PictureOutlined style={{ fontSize: token.fontSizeHeading3 }} />
                    )}
                </Tile>
            </Flex>
            {value === "plain" && (
                <Flex align="center" gap={8} style={{ marginTop: token.marginSM }}>
                    <ColorPicker
                        value={color ?? TEDDYBOX_PLAIN_DEFAULT_COLOR}
                        disabledAlpha
                        presets={[
                            { label: t("teddybox.edit.colors"), colors: TEDDYBOX_PLAIN_COLORS },
                        ]}
                        onChangeComplete={(c) => onColorChange(c.toHexString())}
                    />
                    <Text>{t("teddybox.edit.backgroundColor")}</Text>
                </Flex>
            )}
            {picking && (
                <SelectImageModal
                    open
                    zIndex={1300}
                    title={t("teddybox.edit.pickImage")}
                    initialSelection={image || ""}
                    onClose={() => setPicking(false)}
                    onSelectImage={(path) => {
                        setPicking(false);
                        if (path) onChange("image", path);
                    }}
                />
            )}
        </>
    );
};
