import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Drawer, Flex, Typography } from "antd";
import { AppstoreOutlined, PlayCircleOutlined } from "@ant-design/icons";

import {
    TEDDYBOX_SETUP_DRAWER_HEIGHT,
    TEDDYBOX_SETUP_DRAWER_WIDTH,
} from "../../../constants/teddybox";
import { TeddyBoxConfig } from "../../../types/teddyboxTypes";
import { TonieCardProps } from "../../../types/tonieTypes";
import { TeddyBoxEditor, useTeddyBoxDraft } from "../../teddyboxes/elements/TeddyBoxEditor";
import ConfirmationDialog from "../../common/modals/ConfirmationModal";
import { useViewport } from "../hooks/useViewport";
import { DeviceDraft, DeviceSettings } from "./DeviceSettings";
import { normalizeSchedule } from "../../../utils/teddybox/schedule";

const { Text } = Typography;

/** Where the parent goes after the settings: the Teddyboxes overview or the running TeddyBox. */
export type SetupTarget = "overview" | "box";

interface SetupDrawerProps {
    box: TeddyBoxConfig;
    tonies: TonieCardProps[];
    /** Settings of this device, stored on the device together with the TeddyBox. */
    device: DeviceDraft;
    /** Where the settings were opened from; the close button goes back there. */
    origin: SetupTarget;
    onPreview: (box: TeddyBoxConfig) => void;
    /** The collection being edited, shown in the kids view next to the drawer. */
    onFocusShelf: (shelfId: string) => void;
    onTabChange: (tab: string) => void;
    /** Stores the changes (only when there are any) and goes on to the target. */
    onDone: (
        target: SetupTarget,
        changes: { box: TeddyBoxConfig; device: DeviceDraft } | null,
    ) => Promise<void>;
    /** Throws the changes away and goes back to where the settings were opened from. */
    onDiscard: () => void;
}

/**
 * Settings of the TeddyBox inside the TeddyBox: every change shows up right away in the kids
 * view next to it, which stays usable to try things out. Both ways out store the changes first,
 * the overview and the TeddyBox, whichever way the settings were opened (the parent has already
 * unlocked). Closing with the cross throws the changes away.
 */
export const SetupDrawer: React.FC<SetupDrawerProps> = ({
    box,
    tonies,
    device: initialDevice,
    origin,
    onPreview,
    onFocusShelf,
    onTabChange,
    onDone,
    onDiscard,
}) => {
    const { t } = useTranslation();
    const { landscape } = useViewport();
    const draft = useTeddyBoxDraft(box);
    const [busy, setBusy] = useState<SetupTarget | null>(null);
    const [failed, setFailed] = useState(false);
    const [device, setDevice] = useState(initialDevice);
    const [initial] = useState(() => JSON.stringify([draft.box, initialDevice]));
    const [confirmDiscard, setConfirmDiscard] = useState(false);
    // the start collection must still exist when collections were removed meanwhile
    const shelves = draft.box.shelves;
    const activeShelf = shelves.some((s) => s.id === device.activeShelf)
        ? device.activeShelf
        : (shelves[0]?.id ?? "");
    // only entries for collections that still exist, sorted by time
    const currentDevice = {
        ...device,
        activeShelf,
        schedule: normalizeSchedule(device.schedule).filter((entry) =>
            shelves.some((s) => s.id === entry.shelf),
        ),
    };
    const dirty =
        JSON.stringify([draft.box, currentDevice]) !== initial ||
        draft.pinEnabled !== !!box.options.pin ||
        !!draft.newPin;

    useEffect(() => {
        onPreview(draft.box);
    }, [draft.box]); // eslint-disable-line react-hooks/exhaustive-deps

    const done = async (target: SetupTarget) => {
        let changes = null;
        if (dirty) {
            const result = draft.finalize();
            if (!result) return;
            changes = { box: result, device: currentDevice };
        }
        setBusy(target);
        setFailed(false);
        try {
            await onDone(target, changes);
        } catch (err) {
            console.error("TeddyBox: saving failed", err);
            setFailed(true);
            setBusy(null);
        }
    };

    const disabled = !draft.box.name.trim() || busy !== null;
    // the way back to where the parent came from is the main button
    const button = (target: SetupTarget) => (
        <Button
            key={target}
            type={target === origin ? "primary" : "default"}
            icon={target === "overview" ? <AppstoreOutlined /> : <PlayCircleOutlined />}
            loading={busy === target}
            disabled={disabled && busy !== target}
            onClick={() => void done(target)}
        >
            {t(
                dirty
                    ? target === "overview"
                        ? "teddybox.setup.saveToOverview"
                        : "teddybox.setup.saveToBox"
                    : target === "overview"
                      ? "teddybox.setup.toOverview"
                      : "teddybox.setup.toBox",
            )}
        </Button>
    );

    return (
        <Drawer
            open
            mask={false}
            keyboard={false}
            // the TeddyBox next to the drawer stays usable, so focus must not be trapped
            focusable={{ trap: false }}
            placement={landscape ? "right" : "bottom"}
            size={landscape ? TEDDYBOX_SETUP_DRAWER_WIDTH : TEDDYBOX_SETUP_DRAWER_HEIGHT}
            title={t("teddybox.setup.title")}
            closable={{ "aria-label": t("teddybox.setup.discard") }}
            onClose={() => (dirty ? setConfirmDiscard(true) : onDiscard())}
            styles={{ body: { paddingTop: 8 } }}
            footer={
                <Flex vertical gap={8}>
                    <Text type={failed ? "danger" : "secondary"}>
                        {failed ? t("teddybox.saveFailed") : t("teddybox.setup.liveHint")}
                    </Text>
                    {/* fixed order: overview on the left, the TeddyBox (forward) on the right */}
                    <Flex justify="flex-end" gap={8} wrap>
                        {button("overview")}
                        {button("box")}
                    </Flex>
                </Flex>
            }
        >
            <TeddyBoxEditor
                draft={draft}
                tonies={tonies}
                onFocusShelf={onFocusShelf}
                onTabChange={onTabChange}
                startShelf={{
                    value: activeShelf,
                    onChange: (shelfId) => {
                        setDevice({ ...device, activeShelf: shelfId });
                        // the kids view shows the collection it starts with
                        onFocusShelf(shelfId);
                    },
                }}
                schedule={{
                    value: device.schedule,
                    onChange: (schedule) => setDevice({ ...device, schedule }),
                }}
                deviceSettings={<DeviceSettings />}
            />
            {confirmDiscard && (
                <ConfirmationDialog
                    open
                    title={t("teddybox.setup.discardTitle")}
                    content={t("teddybox.setup.discardText")}
                    okText={t("teddybox.setup.discardOk")}
                    cancelText={t("teddybox.edit.cancel")}
                    handleOk={onDiscard}
                    handleCancel={() => setConfirmDiscard(false)}
                />
            )}
        </Drawer>
    );
};
