import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Button,
    Checkbox,
    Collapse,
    ColorPicker,
    Flex,
    Form,
    Input,
    Radio,
    Segmented,
    Select,
    Switch,
    Tabs,
    Tag,
    Typography,
    theme,
} from "antd";
import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    DeleteOutlined,
    PlusOutlined,
    WarningOutlined,
} from "@ant-design/icons";

import {
    TEDDYBOX_BOX_COLORS,
    TEDDYBOX_MAX_SHELVES,
    TEDDYBOX_PIN_LENGTH,
    TEDDYBOX_SHELF_COLORS,
    TEDDYBOX_SHELF_COLUMNS_MAX,
    TEDDYBOX_SHELF_COLUMNS_MIN,
    TEDDYBOX_VOLUME_STEPS,
} from "../../../constants/teddybox";
import { TeddyBoxConfig, TeddyBoxOptions, TeddyBoxShelf } from "../../../types/teddyboxTypes";
import { TonieCardProps } from "../../../types/tonieTypes";
import { createPin } from "../../../utils/teddybox/pin";
import {
    createShelf,
    normalizeTeddyBox,
    shelfCapacity,
} from "../../../utils/teddybox/teddyboxConfig";
import { toImageSrc } from "../../tonies/common/utils/imagePathUtils";
import { ShelfButtonPreview } from "../../teddybox/kids/ShelfTabs";
import ConfirmationDialog from "../../common/modals/ConfirmationModal";
import { TonieDetailsModal } from "../modals/TonieDetailsModal";
import { ToniePickerModal } from "../modals/ToniePickerModal";
import { ScheduleEditor } from "./ScheduleEditor";
import { TeddyBoxScheduleEntry } from "../../../utils/teddybox/schedule";
import { BackgroundPicker } from "./BackgroundPicker";
import { HiddenWarning } from "./HiddenWarning";
import { TonieSortList } from "./TonieSortList";
import { compareTonies, tonieLabel } from "../../../utils/teddybox/tonieNames";

const { Text } = Typography;
const { useToken } = theme;

/** Section with all ways of switching collections, in the settings tab. */
const SWITCHING_ID = "teddybox-switching";

/** From this many collections the buttons become dots on narrow phones. */
const BUTTONS_DOTS_FROM = 5;

const COLUMN_CHOICES = Array.from(
    { length: TEDDYBOX_SHELF_COLUMNS_MAX - TEDDYBOX_SHELF_COLUMNS_MIN + 1 },
    (_, i) => TEDDYBOX_SHELF_COLUMNS_MIN + i,
);

/** Editing state of a TeddyBox, including a PIN that is only hashed on save. */
export const useTeddyBoxDraft = (initial: TeddyBoxConfig) => {
    // brings data from an older version (e.g. without a collection display) up to date
    const [box, setBox] = useState<TeddyBoxConfig>(() => normalizeTeddyBox(initial) ?? initial);
    const [pinEnabled, setPinEnabled] = useState(!!initial.options.pin);
    const [newPin, setNewPin] = useState("");
    const [pinError, setPinError] = useState(false);

    /** The configuration to store, or null when the PIN input is invalid. */
    const finalize = (): TeddyBoxConfig | null => {
        let pin = box.options.pin;
        if (!pinEnabled) {
            pin = null;
        } else if (newPin) {
            if (!new RegExp(`^\\d{${TEDDYBOX_PIN_LENGTH}}$`).test(newPin)) {
                setPinError(true);
                return null;
            }
            pin = createPin(newPin);
        } else if (!pin) {
            setPinError(true);
            return null;
        }
        return {
            ...box,
            name: box.name.trim(),
            shelves: box.shelves.map((s) => ({ ...s, name: s.name.trim() })),
            options: { ...box.options, pin },
        };
    };

    return {
        box,
        setBox,
        pinEnabled,
        setPinEnabled,
        newPin,
        setNewPin,
        pinError,
        setPinError,
        finalize,
    };
};

export type TeddyBoxDraft = ReturnType<typeof useTeddyBoxDraft>;

/** The Teddybox on its background, as a small preview of the general settings. */
interface TeddyBoxEditorProps {
    draft: TeddyBoxDraft;
    tonies: TonieCardProps[];
    /** Called with the collection being edited (opened, clicked or focused), for a live preview. */
    onFocusShelf?: (shelfId: string) => void;
    /** Called with the active tab ("general", "shelves", "settings" or an extra tab). */
    onTabChange?: (tab: string) => void;
    /** Start collection of this device (only inside the TeddyBox, where there is a device). */
    startShelf?: { value: string; onChange: (shelfId: string) => void };
    /** Times at which this device switches the collection by itself. */
    schedule?: {
        value: TeddyBoxScheduleEntry[];
        onChange: (value: TeddyBoxScheduleEntry[]) => void;
    };
    /** Further settings of this device, at the end of the settings tab. */
    deviceSettings?: React.ReactNode;
}

export const TeddyBoxEditor: React.FC<TeddyBoxEditorProps> = ({
    draft,
    tonies,
    onFocusShelf,
    onTabChange,
    startShelf,
    schedule,
    deviceSettings,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const { box, setBox, pinEnabled, setPinEnabled, newPin, setNewPin, pinError, setPinError } =
        draft;
    const [infoTonie, setInfoTonie] = useState<TonieCardProps | null>(null);
    const [tab, setTab] = useState("general");
    const showTab = (key: string) => {
        setTab(key);
        onTabChange?.(key);
    };
    /** From the hint in the collections tab to all ways of switching in the settings. */
    const showSwitching = () => {
        showTab("settings");
        window.setTimeout(
            () => document.getElementById(SWITCHING_ID)?.scrollIntoView({ behavior: "smooth" }),
            50,
        );
    };
    // collection the tonie picker adds to
    const [picking, setPicking] = useState<string | null>(null);
    const pickingShelf = picking ? box.shelves.find((s) => s.id === picking) : undefined;
    const [truncate, setTruncate] = useState<{
        shelf: TeddyBoxShelf;
        patch: Pick<TeddyBoxShelf, "display" | "columns">;
        capacity: number;
    } | null>(null);

    const playable = useMemo(
        () => tonies.filter((tonie) => tonie.valid).sort(compareTonies),
        [tonies],
    );
    const tonieById = useMemo(() => new Map(tonies.map((tonie) => [tonie.ruid, tonie])), [tonies]);

    const setOptions = (patch: Partial<TeddyBoxOptions>) =>
        setBox((b) => ({ ...b, options: { ...b.options, ...patch } }));

    const setShelf = (id: string, patch: Partial<TeddyBoxShelf>) =>
        setBox((b) => ({
            ...b,
            shelves: b.shelves.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        }));

    const setShelfTonies = (shelf: TeddyBoxShelf, ruids: string[]) =>
        setShelf(shelf.id, {
            tonies: ruids,
            lead: shelf.lead && ruids.includes(shelf.lead) ? shelf.lead : undefined,
        });

    const moveShelf = (index: number, direction: -1 | 1) =>
        setBox((b) => {
            const shelves = [...b.shelves];
            const [shelf] = shelves.splice(index, 1);
            shelves.splice(index + direction, 0, shelf);
            return { ...b, shelves };
        });

    const shelfName = (shelf: TeddyBoxShelf, index: number) =>
        shelf.name || t("teddybox.edit.shelfDefaultName", { number: index + 1 });

    const tonieOption = (tonie: TonieCardProps) => ({
        value: tonie.ruid,
        label: tonieLabel(tonie),
        picture: tonie.tonieInfo?.picture,
    });

    const renderOption = (option: { data: { label: string; picture?: string } }) => (
        <Flex gap={8} align="center">
            {option.data.picture ? (
                <img
                    src={toImageSrc(option.data.picture)}
                    alt=""
                    style={{
                        width: token.controlHeightSM,
                        height: token.controlHeightSM,
                        objectFit: "contain",
                    }}
                />
            ) : (
                <span style={{ width: token.controlHeightSM }} />
            )}
            <span>{option.data.label}</span>
        </Flex>
    );

    const general = (
        <Form layout="vertical">
            <Form.Item label={t("teddybox.edit.name")} required>
                <Input
                    value={box.name}
                    maxLength={40}
                    placeholder={t("teddybox.edit.namePlaceholder")}
                    onChange={(e) => setBox({ ...box, name: e.target.value })}
                />
            </Form.Item>
            <Form.Item label={t("teddybox.edit.color")}>
                <ColorPicker
                    value={box.color}
                    disabledAlpha
                    presets={[{ label: t("teddybox.edit.colors"), colors: TEDDYBOX_BOX_COLORS }]}
                    onChangeComplete={(c) => setBox({ ...box, color: c.toHexString() })}
                />
            </Form.Item>
            <Form.Item label={t("teddybox.edit.background")}>
                <BackgroundPicker
                    value={box.backgroundImage ? "image" : box.background}
                    image={box.backgroundImage}
                    color={box.backgroundColor}
                    onChange={(background, image) => {
                        if (background === "image") setBox({ ...box, backgroundImage: image });
                        else if (background !== "inherit") {
                            setBox({ ...box, background, backgroundImage: undefined });
                        }
                    }}
                    onColorChange={(backgroundColor) => setBox({ ...box, backgroundColor })}
                />
            </Form.Item>
        </Form>
    );

    /**
     * Changes display or tonies per row. When fewer tonies fit than the collection holds, the
     * parent confirms first that the last ones will not be shown (they stay in the collection).
     */
    const changeLayout = (
        shelf: TeddyBoxShelf,
        patch: Pick<TeddyBoxShelf, "display" | "columns">,
    ) => {
        const capacity = shelfCapacity(patch.display, patch.columns);
        if (shelf.tonies.length <= capacity) {
            setShelf(shelf.id, patch);
            return;
        }
        setTruncate({ shelf, patch, capacity });
    };

    /** Which tonies of a collection the child does not see, as a sentence. */
    const hiddenText = (shelf: TeddyBoxShelf) => {
        const capacity = shelfCapacity(shelf.display, shelf.columns);
        return t("teddybox.edit.hiddenText", {
            max: capacity,
            from: capacity + 1,
            tonies: shelf.tonies
                .slice(capacity)
                .map((ruid) => tonieLabel(tonieById.get(ruid), ruid))
                .join(", "),
        });
    };

    const shelfPanel = (shelf: TeddyBoxShelf, index: number) => {
        const capacity = shelfCapacity(shelf.display, shelf.columns);
        const hidden = shelf.tonies.slice(capacity);
        const full = shelf.tonies.length >= capacity;
        return (
            <Form layout="vertical">
                <Flex gap={16} wrap>
                    <Form.Item label={t("teddybox.edit.shelfName")} style={{ flex: "1 1 180px" }}>
                        <Input
                            value={shelf.name}
                            maxLength={40}
                            placeholder={shelfName(shelf, index)}
                            onChange={(e) => setShelf(shelf.id, { name: e.target.value })}
                        />
                    </Form.Item>
                    <Form.Item label={t("teddybox.edit.shelfColor")}>
                        <ColorPicker
                            value={shelf.color}
                            disabledAlpha
                            presets={[
                                { label: t("teddybox.edit.colors"), colors: TEDDYBOX_SHELF_COLORS },
                            ]}
                            onChangeComplete={(c) => setShelf(shelf.id, { color: c.toHexString() })}
                        />
                    </Form.Item>
                </Flex>
                <Form.Item
                    label={t("teddybox.edit.display")}
                    extra={t(`teddybox.edit.displayHint.${shelf.display}`, {
                        count: capacity,
                    })}
                >
                    <Segmented
                        value={shelf.display}
                        onChange={(display) =>
                            changeLayout(shelf, { display, columns: shelf.columns })
                        }
                        options={(["shelf", "circle"] as const).map((value) => ({
                            value,
                            label: t(`teddybox.edit.displayOptions.${value}`),
                        }))}
                    />
                </Form.Item>
                {shelf.display === "shelf" && (
                    <Form.Item
                        label={t("teddybox.edit.columns")}
                        extra={t("teddybox.edit.columnsHint", { count: capacity })}
                    >
                        <Segmented
                            value={shelf.columns}
                            onChange={(columns) =>
                                changeLayout(shelf, { display: "shelf", columns: Number(columns) })
                            }
                            options={COLUMN_CHOICES.map((columns) => ({
                                value: columns,
                                label: String(columns),
                            }))}
                        />
                    </Form.Item>
                )}
                <Form.Item
                    label={t("teddybox.edit.toniesCount", {
                        count: shelf.tonies.length,
                        max: capacity,
                    })}
                    extra={t("teddybox.edit.toniesHint")}
                >
                    <Flex vertical gap={8}>
                        {hidden.length > 0 && (
                            <Alert
                                type="warning"
                                showIcon
                                icon={<WarningOutlined />}
                                title={t("teddybox.edit.hiddenTitle")}
                                description={hiddenText(shelf)}
                            />
                        )}
                        <TonieSortList
                            visibleCount={capacity}
                            ruids={shelf.tonies}
                            tonieById={tonieById}
                            onChange={(ruids) => setShelfTonies(shelf, ruids)}
                            onInfo={setInfoTonie}
                        />
                        <Button
                            block
                            icon={<PlusOutlined />}
                            disabled={full}
                            onClick={() => setPicking(shelf.id)}
                        >
                            {full ? t("teddybox.edit.shelfFull") : t("teddybox.edit.addTonie")}
                        </Button>
                    </Flex>
                </Form.Item>
                {box.shelves.length > 1 && (
                    <Form.Item label={t("teddybox.edit.lead")} extra={t("teddybox.edit.leadHint")}>
                        <Flex gap={16} align="center">
                            <ShelfButtonPreview shelf={shelf} tonies={tonieById} />
                            <Select
                                style={{ flex: 1, minWidth: 0 }}
                                allowClear
                                value={shelf.lead}
                                placeholder={tonieLabel(
                                    shelf.tonies[0] ? tonieById.get(shelf.tonies[0]) : undefined,
                                )}
                                onChange={(value) => setShelf(shelf.id, { lead: value })}
                                options={shelf.tonies
                                    .map((ruid) => tonieById.get(ruid))
                                    .filter((tonie): tonie is TonieCardProps => !!tonie)
                                    .map(tonieOption)}
                                optionRender={renderOption}
                            />
                        </Flex>
                    </Form.Item>
                )}
                {/* rather unimportant, so at the end */}
                <Form.Item
                    label={t("teddybox.edit.background")}
                    extra={
                        shelf.display === "shelf"
                            ? t("teddybox.edit.backgroundShelfHint")
                            : undefined
                    }
                >
                    <BackgroundPicker
                        collection
                        value={shelf.background ?? "inherit"}
                        image={shelf.backgroundImage}
                        color={shelf.backgroundColor}
                        onChange={(background, image) =>
                            setShelf(shelf.id, {
                                background: background === "inherit" ? undefined : background,
                                backgroundImage: background === "image" ? image : undefined,
                            })
                        }
                        onColorChange={(backgroundColor) => setShelf(shelf.id, { backgroundColor })}
                    />
                </Form.Item>
            </Form>
        );
    };

    const { buttons, swipe, overview } = box.options.switching;
    const noSwitching = !buttons && !swipe && !overview;

    const shelves = (
        <>
            {startShelf && box.shelves.length > 1 && (
                <Form layout="vertical">
                    <Form.Item
                        label={t("teddybox.edit.startShelf")}
                        extra={
                            noSwitching
                                ? t("teddybox.edit.startShelfHintOnly")
                                : t("teddybox.edit.startShelfHint")
                        }
                    >
                        <Select
                            value={startShelf.value}
                            onChange={startShelf.onChange}
                            options={box.shelves.map((shelf, index) => ({
                                value: shelf.id,
                                label: shelfName(shelf, index),
                            }))}
                        />
                    </Form.Item>
                </Form>
            )}
            {/* a second collection is of no use while the child cannot switch to it */}
            {box.shelves.length > 1 && noSwitching && (
                <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 12, padding: "6px 12px" }}
                    styles={{
                        icon: { fontSize: token.fontSize },
                        title: { fontSize: token.fontSize, marginBottom: 0 },
                        description: { fontSize: token.fontSizeSM },
                    }}
                    title={t("teddybox.edit.switchOffTitle")}
                    description={t("teddybox.edit.switchOffText")}
                    action={
                        <Flex vertical gap={6}>
                            <Button
                                size="small"
                                type="primary"
                                onClick={() =>
                                    setOptions({
                                        // the easiest way for small children, works right away
                                        switching: { ...box.options.switching, buttons: true },
                                    })
                                }
                            >
                                {t("teddybox.edit.switchOffAction")}
                            </Button>
                            {/* the schedule needs times and collections, so it is not a one-tap */}
                            <Button size="small" onClick={showSwitching}>
                                {t("teddybox.edit.switchOffMore")}
                            </Button>
                        </Flex>
                    }
                />
            )}
            <Text type="secondary">{t("teddybox.edit.shelvesIntro")}</Text>
            <Collapse
                style={{ marginTop: 12 }}
                defaultActiveKey={box.shelves.length === 1 ? [box.shelves[0].id] : []}
                onChange={(keys) => {
                    const opened = Array.isArray(keys) ? keys : [keys];
                    const last = opened[opened.length - 1];
                    if (last) onFocusShelf?.(String(last));
                }}
                items={box.shelves.map((shelf, index) => ({
                    key: shelf.id,
                    label: (
                        <Flex gap={8} align="center">
                            <span
                                style={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: "50%",
                                    background: shelf.color,
                                    flex: "none",
                                }}
                            />
                            <span>{shelfName(shelf, index)}</span>
                            {startShelf &&
                                box.shelves.length > 1 &&
                                startShelf.value === shelf.id && (
                                    <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                                        {t("teddybox.edit.startTag")}
                                    </Tag>
                                )}
                            <Text type="secondary">
                                {t("teddybox.edit.tonieCount", { count: shelf.tonies.length })}
                            </Text>
                            {shelf.tonies.length > shelfCapacity(shelf.display, shelf.columns) && (
                                <HiddenWarning
                                    title={t("teddybox.edit.hiddenTitle")}
                                    text={hiddenText(shelf)}
                                />
                            )}
                        </Flex>
                    ),
                    extra: (
                        <Flex gap={12} onClick={(e) => e.stopPropagation()}>
                            <ArrowUpOutlined
                                aria-label={t("teddybox.edit.moveUp")}
                                style={{ color: index === 0 ? token.colorTextDisabled : undefined }}
                                onClick={() => index > 0 && moveShelf(index, -1)}
                            />
                            <ArrowDownOutlined
                                aria-label={t("teddybox.edit.moveDown")}
                                style={{
                                    color:
                                        index === box.shelves.length - 1
                                            ? token.colorTextDisabled
                                            : undefined,
                                }}
                                onClick={() =>
                                    index < box.shelves.length - 1 && moveShelf(index, 1)
                                }
                            />
                            <DeleteOutlined
                                aria-label={t("teddybox.edit.deleteShelf")}
                                style={{
                                    color:
                                        box.shelves.length === 1
                                            ? token.colorTextDisabled
                                            : token.colorError,
                                }}
                                onClick={() =>
                                    box.shelves.length > 1 &&
                                    setBox({
                                        ...box,
                                        shelves: box.shelves.filter((s) => s.id !== shelf.id),
                                    })
                                }
                            />
                        </Flex>
                    ),
                    children: (
                        <div
                            onPointerDownCapture={() => onFocusShelf?.(shelf.id)}
                            onFocusCapture={() => onFocusShelf?.(shelf.id)}
                        >
                            {shelfPanel(shelf, index)}
                        </div>
                    ),
                }))}
            />
            <Button
                style={{ marginTop: 12 }}
                icon={<PlusOutlined />}
                disabled={box.shelves.length >= TEDDYBOX_MAX_SHELVES}
                onClick={() =>
                    setBox({
                        ...box,
                        shelves: [...box.shelves, createShelf(box.shelves.length, "")],
                    })
                }
            >
                {t("teddybox.edit.addShelf")}
            </Button>
        </>
    );

    const volumeSteps = Array.from({ length: TEDDYBOX_VOLUME_STEPS }, (_, i) => i + 1);

    const settings = (
        <Form layout="vertical">
            {/* ways to switch, from easiest: by itself at set times, then by the child */}
            <div id={SWITCHING_ID} style={{ scrollMarginTop: 8 }}>
                {schedule && box.shelves.length > 1 && (
                    <Form.Item
                        label={t("teddybox.schedule.title")}
                        extra={t("teddybox.schedule.hint")}
                    >
                        <ScheduleEditor
                            value={schedule.value}
                            shelves={box.shelves.map((shelf, index) => ({
                                id: shelf.id,
                                label: shelfName(shelf, index),
                            }))}
                            onChange={schedule.onChange}
                        />
                    </Form.Item>
                )}
            </div>
            <Form.Item
                label={t("teddybox.edit.shelfSwitching")}
                extra={
                    noSwitching
                        ? t(
                              startShelf
                                  ? "teddybox.edit.switchingHint.noneHere"
                                  : "teddybox.edit.switchingHint.none",
                          )
                        : buttons && box.shelves.length >= BUTTONS_DOTS_FROM
                          ? t("teddybox.edit.switchingHint.manyShelves")
                          : t("teddybox.edit.switchingHint.age")
                }
            >
                <Flex vertical gap={4}>
                    {/* ordered by how easy they are for small children */}
                    {(["buttons", "overview", "swipe"] as const).map((key) => (
                        <Checkbox
                            key={key}
                            checked={box.options.switching[key]}
                            onChange={(e) =>
                                setOptions({
                                    switching: {
                                        ...box.options.switching,
                                        [key]: e.target.checked,
                                    },
                                })
                            }
                        >
                            {t(`teddybox.edit.switching.${key}`)}
                        </Checkbox>
                    ))}
                </Flex>
            </Form.Item>
            {/* buttons instead of sliders: the chosen value is always visible and easy to tap */}
            <Form.Item label={t("teddybox.edit.maxVolume")}>
                <Radio.Group
                    block
                    optionType="button"
                    buttonStyle="solid"
                    value={box.options.maxVolume}
                    onChange={(e) => {
                        const maxVolume = Number(e.target.value);
                        setOptions({
                            maxVolume,
                            startVolume: Math.min(box.options.startVolume, maxVolume),
                        });
                    }}
                    options={volumeSteps.map((step) => ({ value: step, label: String(step) }))}
                />
            </Form.Item>
            <Form.Item label={t("teddybox.edit.startVolume")}>
                <Radio.Group
                    block
                    optionType="button"
                    buttonStyle="solid"
                    value={box.options.startVolume}
                    onChange={(e) => setOptions({ startVolume: Number(e.target.value) })}
                    options={volumeSteps.map((step) => ({
                        value: step,
                        label: String(step),
                        disabled: step > box.options.maxVolume,
                    }))}
                />
            </Form.Item>
            <Flex gap={24} wrap>
                <Form.Item label={t("teddybox.edit.allowTrackSkip")}>
                    <Switch
                        checked={box.options.allowTrackSkip}
                        onChange={(allowTrackSkip) => setOptions({ allowTrackSkip })}
                    />
                </Form.Item>
                <Form.Item label={t("teddybox.edit.resume")}>
                    <Switch
                        checked={box.options.resume}
                        onChange={(resume) => setOptions({ resume })}
                    />
                </Form.Item>
                <Form.Item label={t("teddybox.edit.showKnockHint")}>
                    <Switch
                        checked={box.options.showKnockHint}
                        onChange={(showKnockHint) => setOptions({ showKnockHint })}
                    />
                </Form.Item>
            </Flex>
            <Form.Item label={t("teddybox.edit.pin")} extra={t("teddybox.edit.pinHint")}>
                <Flex gap={16} align="center" wrap>
                    <Switch
                        checked={pinEnabled}
                        onChange={(checked) => {
                            setPinEnabled(checked);
                            setPinError(false);
                        }}
                    />
                    {pinEnabled && (
                        <Input.OTP
                            length={TEDDYBOX_PIN_LENGTH}
                            mask
                            value={newPin}
                            status={pinError ? "error" : undefined}
                            onChange={(value) => {
                                setNewPin(value.replace(/\D/g, ""));
                                setPinError(false);
                            }}
                        />
                    )}
                    {pinEnabled && box.options.pin && !newPin && (
                        <Text type="secondary">{t("teddybox.edit.pinKeep")}</Text>
                    )}
                </Flex>
                {pinError && <Text type="danger">{t("teddybox.edit.pinInvalid")}</Text>}
            </Form.Item>
            {deviceSettings}
        </Form>
    );

    const overfull = box.shelves
        .map((s, index) => ({ shelf: s, index }))
        .filter(({ shelf: s }) => s.tonies.length > shelfCapacity(s.display, s.columns));

    return (
        <>
            {overfull.length > 0 && (
                <Alert
                    type="warning"
                    showIcon
                    icon={<WarningOutlined />}
                    style={{ marginBottom: 12, padding: "6px 12px" }}
                    // a hint, not an error: text as small as the tab titles
                    styles={{
                        icon: { fontSize: token.fontSize },
                        title: { fontSize: token.fontSize, marginBottom: 0 },
                        description: { fontSize: token.fontSizeSM },
                    }}
                    title={t("teddybox.edit.overfull")}
                    description={overfull
                        .map(({ shelf: s, index }) =>
                            t("teddybox.edit.overfullItem", {
                                name: shelfName(s, index),
                                count: s.tonies.length,
                                max: shelfCapacity(s.display, s.columns),
                            }),
                        )
                        .join(" · ")}
                />
            )}
            <Tabs
                activeKey={tab}
                onChange={showTab}
                items={[
                    { key: "general", label: t("teddybox.edit.tabGeneral"), children: general },
                    { key: "shelves", label: t("teddybox.edit.tabShelves"), children: shelves },
                    { key: "settings", label: t("teddybox.edit.tabSettings"), children: settings },
                ]}
            />
            {truncate && (
                <ConfirmationDialog
                    open
                    title={t("teddybox.edit.truncateTitle")}
                    content={t("teddybox.edit.truncateText", {
                        count: truncate.shelf.tonies.length,
                        max: truncate.capacity,
                        from: truncate.capacity + 1,
                    })}
                    okText={t("teddybox.edit.truncateOk")}
                    cancelText={t("teddybox.edit.cancel")}
                    handleOk={() => {
                        setShelf(truncate.shelf.id, truncate.patch);
                        setTruncate(null);
                    }}
                    handleCancel={() => setTruncate(null)}
                />
            )}
            {pickingShelf && (
                <ToniePickerModal
                    tonies={playable}
                    taken={pickingShelf.tonies}
                    room={Math.max(
                        0,
                        shelfCapacity(pickingShelf.display, pickingShelf.columns) -
                            pickingShelf.tonies.length,
                    )}
                    onAdd={(ruids) => {
                        setShelfTonies(pickingShelf, [...pickingShelf.tonies, ...ruids]);
                        setPicking(null);
                    }}
                    onClose={() => setPicking(null)}
                />
            )}
            {infoTonie && (
                <TonieDetailsModal tonie={infoTonie} onClose={() => setInfoTonie(null)} />
            )}
        </>
    );
};
