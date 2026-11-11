import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button, Empty, Flex, Spin } from "antd";
import styled from "styled-components";

import {
    TEDDYBOX_KNOCK_COOLDOWN_MS,
    TEDDYBOXES_ROUTE,
    TEDDYBOX_SETUP_DRAWER_HEIGHT,
    TEDDYBOX_SETUP_DRAWER_WIDTH,
    TEDDYBOX_VOLUME_STEPS,
} from "../../constants/teddybox";
import { TeddyBoxConfig } from "../../types/teddyboxTypes";
import { TonieCardProps } from "../../types/tonieTypes";
import { useTonies } from "../../hooks/useTonies";
import { supportsOggOpus } from "../../utils/browser/browserUtils";
import {
    getActiveTeddyBox,
    getDeviceSettings,
    markHintSeen,
    setActiveTeddyBox,
    TeddyBoxDeviceSettings,
    updateDeviceSettings,
    wasHintSeen,
} from "../../utils/teddybox/deviceStorage";
import { teddyBoxSounds } from "../../utils/teddybox/sounds";
import { scheduledShelf } from "../../utils/teddybox/schedule";
import { sceneryOf, shelfCapacity, visibleShelves } from "../../utils/teddybox/teddyboxConfig";
import { TeddyBoxEar } from "../../components/teddybox/graphics/TeddyBoxGraphic";
import {
    loadTeddyBoxFile,
    removeTeddyBox,
    storeTeddyBox,
} from "../../components/teddybox/hooks/useTeddyBoxes";
import { useTeddyBoxPlayer } from "../../components/teddybox/hooks/useTeddyBoxPlayer";
import { isStandalone, useTeddyBoxManifest } from "../../components/teddybox/hooks/useTeddyBoxPwa";
import { useTeddyBoxSession } from "../../components/teddybox/hooks/useTeddyBoxSession";
import { useViewport } from "../../components/teddybox/hooks/useViewport";
import { BoxView } from "../../components/teddybox/kids/BoxView";
import { DeviceDraft } from "../../components/teddybox/kids/DeviceSettings";
import { SetupDrawer, SetupTarget } from "../../components/teddybox/kids/SetupDrawer";
import { ShelfFrame, ShelfSlide } from "../../components/teddybox/kids/ShelfFrame";
import { ShelfView } from "../../components/teddybox/kids/ShelfView";
import { ScaledPreview } from "../../components/teddybox/kids/ScaledPreview";
import { UnlockGate } from "../../components/teddybox/kids/UnlockGate";

const ERROR_SHOW_MS = 3000;
const SCHEDULE_CHECK_MS = 30000;

const Root = styled.div`
    position: fixed;
    inset: 0;
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    touch-action: manipulation;
    overscroll-behavior: none;
    font-family: "Trebuchet MS", system-ui, sans-serif;
    background: #dfeadf;
`;

/** Fullscreen on the first tap where the browser allows it (Android, iPad), not in the app. */
const requestFullscreenOnce = () => {
    if (isStandalone() || document.fullscreenElement || !document.fullscreenEnabled) return;
    document.documentElement.requestFullscreen?.().catch(() => undefined);
};

interface KidsModeProps {
    saved: TeddyBoxConfig;
    /** Opened with the settings from the Teddyboxes overview. */
    initialSetup: boolean;
    /** A TeddyBox just created in the overview, not yet saved by the parent. */
    isNew: boolean;
    onSaved: (box: TeddyBoxConfig) => void;
    /** The TeddyBox becomes the one of this device (kids mode). */
    onActivate: () => void;
    onExit: () => void;
}

const TeddyBoxKidsMode: React.FC<KidsModeProps> = ({
    saved,
    initialSetup,
    isNew,
    onSaved,
    onActivate,
    onExit,
}) => {
    const { tonies: tonieList } = useTonies({ includeHidden: true });
    const [device, setDevice] = useState<TeddyBoxDeviceSettings>(getDeviceSettings);
    const [setup, setSetup] = useState(initialSetup);
    // where the settings were opened from: the close button goes back there
    const [origin, setOrigin] = useState<SetupTarget>(initialSetup ? "overview" : "box");
    // While the settings are open, the kids view shows the unsaved changes.
    const [preview, setPreview] = useState<TeddyBoxConfig | null>(null);
    // the collection edited in the settings, shown even when the child could not switch to it
    const [focusShelf, setFocusShelf] = useState<string | null>(null);
    // the settings tab decides what the kids view previews: the box itself or a collection
    const [setupTab, setSetupTab] = useState("general");
    const box = setup && preview ? preview : saved;
    const { landscape } = useViewport();
    // The kids view moves next to the settings, scaled down as a whole (ScaledPreview).
    const rootStyle: React.CSSProperties | undefined = setup
        ? landscape
            ? { right: TEDDYBOX_SETUP_DRAWER_WIDTH }
            : { bottom: TEDDYBOX_SETUP_DRAWER_HEIGHT }
        : undefined;
    const [flyFrom, setFlyFrom] = useState<DOMRect | null>(null);
    const [lastPlayed, setLastPlayed] = useState<string | undefined>();
    const [hint, setHint] = useState(false);
    const lastKnock = useRef(0);

    useTeddyBoxManifest(box.name, box.color);
    useTeddyBoxSession();

    const changeDevice = useCallback((patch: Partial<TeddyBoxDeviceSettings>) => {
        updateDeviceSettings(patch);
        setDevice(getDeviceSettings());
    }, []);

    const player = useTeddyBoxPlayer({
        maxVolume: box.options.maxVolume,
        initialVolume: device.volume ?? box.options.startVolume,
        resume: box.options.resume,
        onVolumeChange: (volume) => changeDevice({ volume }),
    });

    const tonies = useMemo(() => {
        const map = new Map<string, TonieCardProps>();
        tonieList.forEach((tonie) => {
            if (tonie.valid && tonie.audioUrl) map.set(tonie.ruid, tonie);
        });
        return map;
    }, [tonieList]);

    // Schedule of this device: at set times the collection changes by itself, but never while
    // a tonie plays (then once it is taken off).
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), SCHEDULE_CHECK_MS);
        return () => window.clearInterval(timer);
    }, []);
    const wanted = scheduledShelf(
        device.schedule,
        now,
        box.shelves.map((s) => s.id),
    );
    const [scheduled, setScheduled] = useState(wanted);
    const playing = !!player.current;
    useEffect(() => {
        if (!playing) setScheduled(wanted);
    }, [wanted, playing]);
    const startShelf = scheduled ?? device.activeShelf;

    const shelves = useMemo(() => visibleShelves(box, startShelf), [box, startShelf]);
    const [shelfIndex, setShelfIndex] = useState(0);
    useEffect(() => {
        const index = shelves.findIndex((s) => s.id === startShelf);
        setShelfIndex(index >= 0 ? index : 0);
    }, [shelves, startShelf]);

    // In the settings, the collection being edited is shown, even one the child cannot reach.
    const focused = setup && focusShelf ? box.shelves.find((s) => s.id === focusShelf) : undefined;
    const focusedIndex = focused ? shelves.findIndex((s) => s.id === focused.id) : -1;
    const shownIndex = focusedIndex >= 0 ? focusedIndex : shelfIndex;
    const currentShelf = focused ?? shelves[shelfIndex] ?? shelves[0];
    const shelfTonies = useMemo(
        () =>
            (currentShelf?.tonies ?? [])
                .map((ruid) => tonies.get(ruid))
                .filter((tonie): tonie is TonieCardProps => !!tonie)
                .slice(
                    0,
                    currentShelf ? shelfCapacity(currentShelf.display, currentShelf.columns) : 0,
                ),
        [currentShelf, tonies],
    );
    const circle = currentShelf?.display === "circle";
    const scenery = sceneryOf(box, currentShelf);

    // A tonie that cannot be played shows the sleeping box for a moment and goes back.
    const failed = player.error || (!!player.current && !supportsOggOpus());
    useEffect(() => {
        if (!failed) return;
        const timer = window.setTimeout(() => player.stop(), ERROR_SHOW_MS);
        return () => window.clearTimeout(timer);
    }, [failed]); // eslint-disable-line react-hooks/exhaustive-deps

    const pick = (tonie: TonieCardProps, from: DOMRect) => {
        requestFullscreenOnce();
        teddyBoxSounds.place();
        setFlyFrom(from);
        setLastPlayed(tonie.ruid);
        if (box.options.showKnockHint && !wasHintSeen()) {
            markHintSeen();
            setHint(true);
        } else {
            setHint(false);
        }
        player.play(tonie);
    };

    const remove = () => {
        teddyBoxSounds.remove();
        setFlyFrom(null);
        player.stop();
    };

    const ear = (which: TeddyBoxEar): boolean => {
        const louder = which === "large";
        const changed = player.changeVolume(louder ? 1 : -1);
        if (changed) {
            const next = player.volume + (louder ? 1 : -1);
            teddyBoxSounds.volume(next / TEDDYBOX_VOLUME_STEPS, louder);
        } else teddyBoxSounds.limit(player.volume / TEDDYBOX_VOLUME_STEPS);
        return changed;
    };

    const knock = (direction: 1 | -1): boolean => {
        teddyBoxSounds.knock();
        if (Date.now() - lastKnock.current < TEDDYBOX_KNOCK_COOLDOWN_MS) return false;
        lastKnock.current = Date.now();
        return player.skip(direction);
    };

    const changeShelf = (index: number) => {
        teddyBoxSounds.shelf();
        setFocusShelf(null);
        setShelfIndex(index);
        // A shelf hides the box: like taking the tonie off. In a circle the box stays visible,
        // so the tonie keeps playing.
        if (player.current && shelves[index]?.display !== "circle") {
            setFlyFrom(null);
            player.stop();
        }
    };

    const boxView = (ring?: TonieCardProps[], ownScenery = scenery) => (
        <BoxView
            tonie={player.current}
            color={box.color}
            scenery={ownScenery}
            volume={player.volume}
            maxVolume={box.options.maxVolume}
            trackIndex={player.trackIndex}
            trackCount={player.trackCount}
            allowTrackSkip={box.options.allowTrackSkip}
            sleeping={failed}
            showHint={hint}
            flyFrom={flyFrom}
            onEar={ear}
            onKnock={knock}
            onRemove={remove}
            ring={ring}
            onPick={pick}
        />
    );

    const frame = (content: React.ReactNode) => (
        <ShelfFrame
            shelves={shelves}
            shelfIndex={shownIndex}
            onShelfChange={changeShelf}
            tonies={tonies}
            switching={box.options.switching}
        >
            <ShelfSlide key={currentShelf?.id}>{content}</ShelfSlide>
        </ShelfFrame>
    );

    const closeSetup = () => {
        setSetup(false);
        setSetupTab("general");
        setPreview(null);
        setFocusShelf(null);
    };

    const finishSetup = async (
        target: SetupTarget,
        changes: { box: TeddyBoxConfig; device: DeviceDraft } | null,
    ) => {
        if (changes) {
            await storeTeddyBox(changes.box);
            changeDevice(changes.device);
            onSaved(changes.box);
        }
        if (target === "overview") {
            onExit();
            return;
        }
        onActivate();
        setOrigin("box");
        closeSetup();
    };

    const discardSetup = () => {
        if (origin === "box") {
            closeSetup();
            return;
        }
        // a new TeddyBox the parent did not keep is removed again
        if (isNew) void removeTeddyBox(saved.id).catch(() => undefined);
        onExit();
    };

    const kidsView =
        setup && setupTab === "general"
            ? // general settings: the Teddybox alone on its own background
              boxView([], sceneryOf(box))
            : circle
              ? frame(boxView(shelfTonies))
              : player.current
                ? frame(boxView())
                : frame(
                      <ShelfView
                          color={currentShelf?.color ?? "#7fb77e"}
                          columns={currentShelf?.columns ?? 3}
                          tonies={shelfTonies}
                          lastPlayed={lastPlayed}
                          onPick={pick}
                      />,
                  );

    return (
        <Root style={rootStyle}>
            {setup ? <ScaledPreview>{kidsView}</ScaledPreview> : kidsView}

            {!setup && (
                <UnlockGate
                    pin={box.options.pin}
                    onSlideDone={teddyBoxSounds.unlock}
                    onUnlock={(target) => {
                        if (target === "exit") return onExit();
                        setOrigin("box");
                        setSetup(true);
                    }}
                />
            )}

            {setup && (
                <SetupDrawer
                    box={saved}
                    tonies={tonieList}
                    device={{
                        activeShelf: device.activeShelf ?? currentShelf?.id ?? "",
                        schedule: device.schedule ?? [],
                    }}
                    onPreview={setPreview}
                    onFocusShelf={setFocusShelf}
                    onTabChange={setSetupTab}
                    origin={origin}
                    onDone={finishSetup}
                    onDiscard={discardSetup}
                />
            )}
        </Root>
    );
};

/** Full-screen kids mode. Route: /teddybox/:id (or /teddybox for the box active on this device). */
export const TeddyBoxPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    // ?setup=1 opens the settings once (from the Teddyboxes overview); a reload by the child
    // must not. ?new=1: the TeddyBox was just created there.
    const [initialSetup] = useState(() => searchParams.get("setup") === "1");
    const [isNew] = useState(() => searchParams.get("new") === "1");
    useEffect(() => {
        if (searchParams.has("setup") || searchParams.has("new")) {
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams]);
    const [boxes, setBoxes] = useState<TeddyBoxConfig[] | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        loadTeddyBoxFile()
            .then((file) => setBoxes(file.teddyboxes))
            .catch((err) => {
                console.error("TeddyBox: loading failed", err);
                setError(true);
            });
    }, []);

    const box = useMemo(() => {
        if (!boxes) return null;
        const wanted = id || getActiveTeddyBox();
        return boxes.find((b) => b.id === wanted) ?? (boxes.length === 1 ? boxes[0] : null);
    }, [boxes, id]);

    // Settings opened from the overview do not turn this device into the TeddyBox; only
    // "To the Teddybox" does.
    useEffect(() => {
        if (box && !initialSetup) setActiveTeddyBox(box.id);
    }, [box, initialSetup]);

    const exit = useCallback(() => {
        setActiveTeddyBox(null);
        if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
        navigate(TEDDYBOXES_ROUTE, { replace: true });
    }, [navigate]);

    if (!boxes && !error) {
        return (
            <Flex align="center" justify="center" style={{ minHeight: "100vh" }}>
                <Spin size="large" />
            </Flex>
        );
    }

    if (!box) {
        return (
            <Flex align="center" justify="center" style={{ minHeight: "100vh", padding: 16 }}>
                <Empty description={error ? t("teddybox.loadError") : t("teddybox.notFound")}>
                    <Button
                        type="primary"
                        onClick={() => {
                            setActiveTeddyBox(null);
                            navigate(TEDDYBOXES_ROUTE, { replace: true });
                        }}
                    >
                        {t("teddybox.toTeddyBoxes")}
                    </Button>
                </Empty>
            </Flex>
        );
    }

    return (
        <TeddyBoxKidsMode
            key={box.id}
            saved={box}
            initialSetup={initialSetup}
            isNew={isNew}
            onActivate={() => setActiveTeddyBox(box.id)}
            onSaved={(next) =>
                setBoxes((list) => (list ?? []).map((b) => (b.id === next.id ? next : b)))
            }
            onExit={exit}
        />
    );
};
