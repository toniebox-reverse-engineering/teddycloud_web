import { useEffect, useRef, useState } from "react";
import { ESPLoader, Transport } from "esptool-js";
import { RevvoxFlasher } from "../../../../../../tools/esp32/revvox_flasher";
import { useTranslation } from "react-i18next";
import { TeddyCloudApi } from "../../../../../../api";
import { defaultAPIConfig } from "../../../../../../config/defaultApiConfig";
import { useTeddyCloud } from "../../../../../../contexts/TeddyCloudContext";
import { NotificationTypeEnum } from "../../../../../../types/teddyCloudNotificationTypes";
import { isWebSerialSupported } from "../../../../../../utils/browser/webSerial";
import { ESP32_CHIPNAME, ESP32_FLASHSIZE } from "../../../../../../constants/esp32";
import { scrollToTop } from "../../../../../../utils/browser/browserUtils";
import { useGetSettingLogLevel } from "../../../../../../hooks/getsettings/useGetSettingLogLevel";
import { checkAssetsCertPartition } from "../helper/checkAssetsCertPartition";
import { TFunction } from "i18next";
import { installConsoleLogCapture, uninstallConsoleLogCapture } from "../../../../../../utils/logging/log";

const api = new TeddyCloudApi(defaultAPIConfig());

export interface ESP32Flasher {
    progress: number;
    chipMac: string;
    chipType: string;
    flashId: string;
    flashManuf: string;
    flashDevice: string;
    flashSize: string;
    state: string;
    stage: string;
    filename: string;
    flashName: string;
    port: SerialPort | null;
    originalFlash: any | null;
    patchedFlash: any | null;
    showStatus: boolean;
    showProgress: boolean;
    showDownload: boolean;
    showFlash: boolean;
    connected: boolean;
    flagPreviousHostname: boolean;
    previousHostname: string;
    hostname: string;
    wifi_ssid: string;
    wifi_pass: string;
    proceed: boolean;
    actionInProgress: boolean;
    warningTextHostname: string;
    warningTextWifi: string;
    downloadLink: string;
    downloadLinkPatched: string;
    error: boolean;
    resetBox: boolean;
}

export interface UseESP32FlasherResult {
    state: ESP32Flasher;
    setState: React.Dispatch<React.SetStateAction<ESP32Flasher>>;
    currentStep: number;
    setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
    isSupported: boolean;
    httpsActive: boolean;
    httpsUrl: string;
    baudRate: number;
    baudRates: number[];
    disableButtons: boolean;
    certDir: string;
    isConfirmFlashModalOpen: boolean;
    setIsConfirmFlashModalOpen: (open: boolean) => void;
    isOverwriteForceConfirmationModalOpen: boolean;
    setIsOverwriteForceConfirmationModalOpen: (open: boolean) => void;
    extractCertificateErrorMessage: string;
    isOpenAvailableBoxesModal: boolean;
    setIsOpenAvailableBoxesModal: (open: boolean) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;

    handleBaudrateChange: (value: number) => void;
    openHttpsUrl: () => void;

    loadFlashFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    readFlash: () => Promise<void>;
    patchFlash: () => Promise<void>;
    resetFlash: () => Promise<void>;
    writeFlash: () => Promise<void>;
    extractAndStoreCertsFromFlash: (force?: boolean) => Promise<void>;

    next: () => void;
    prev: () => void;

    hasAnyLog: boolean;
    getAllLogLines: () => string[];
    clearLog: () => void;
}

export const useESP32Flasher = (
    useRevvoxFlasher = false,
    scrollToTopAnchor: HTMLElement | null,
    logEntries: string[],
    setLogEntries: React.Dispatch<React.SetStateAction<string[]>>
): UseESP32FlasherResult => {
    const { t } = useTranslation();
    const { setFetchCloudStatus, addNotification, addLoadingNotification, closeLoadingNotification } = useTeddyCloud();

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [httpsActive, setHttpsActive] = useState(false);
    const [httpsUrl, setHttpsUrl] = useState<string>("");

    const [isConfirmFlashModalOpen, setIsConfirmFlashModalOpen] = useState(false);
    const [isOverwriteForceConfirmationModalOpen, setIsOverwriteForceConfirmationModalOpen] = useState(false);
    const [extractCertificateErrorMessage, setExtractCertificateErrorMessage] = useState("");
    const [certDir, setCertDir] = useState<string>("certs/client");
    const [isOpenAvailableBoxesModal, setIsOpenAvailableBoxesModal] = useState(false);

    const [currentStep, setCurrentStep] = useState(0);

    const [state, setState] = useState<ESP32Flasher>({
        progress: 0,
        chipMac: "",
        chipType: "",
        flashId: "",
        flashManuf: "",
        flashDevice: "",
        flashSize: "",
        state: "",
        stage: "",
        filename: "",
        flashName: "",
        port: null,
        originalFlash: null,
        patchedFlash: null,
        showStatus: false,
        showProgress: false,
        showDownload: false,
        showFlash: false,
        connected: false,
        flagPreviousHostname: false,
        previousHostname: "",
        hostname:
            window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
                ? window.location.hostname
                : "",
        wifi_ssid: "",
        wifi_pass: "",
        proceed: false,
        actionInProgress: false,
        warningTextHostname: "",
        warningTextWifi: "",
        downloadLink: "",
        downloadLinkPatched: "",
        error: false,
        resetBox: false,
    });

    const [isSupported, setIsSupported] = useState(false);
    const [baudRate, setBaudRate] = useState(921600);
    const baudRates = [300, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200, 230400, 460800, 921600];
    const romBaudRate = 115200;

    const logLevel = useGetSettingLogLevel();

    const logCtx = () => ({
        step: currentStep,
        useRevvoxFlasher,
        baudRate,
        romBaudRate,
        resetBox: state.resetBox,
    });

    const MAX_UI_LINES = 250;
    const fullLogRef = useRef<string[]>([]);
    const pendingRef = useRef<string[]>([]);
    const flushTimerRef = useRef<number | null>(null);
    const unmountedRef = useRef(false);

    const flushPendingToUi = () => {
        if (unmountedRef.current) return;

        const batch = pendingRef.current;
        if (!batch.length) return;
        pendingRef.current = [];
        setLogEntries((prev) => {
            const merged = prev.concat(batch);
            if (merged.length <= MAX_UI_LINES) return merged;
            return merged.slice(merged.length - MAX_UI_LINES);
        });
    };

    useEffect(() => {
        unmountedRef.current = false;

        installConsoleLogCapture((line) => {
            fullLogRef.current.push(line);
            pendingRef.current.push(line);
            if (flushTimerRef.current !== null) return;
            flushTimerRef.current = window.setTimeout(() => {
                flushTimerRef.current = null;
                flushPendingToUi();
            }, 150);
        });

        return () => {
            unmountedRef.current = true;

            if (flushTimerRef.current !== null) {
                clearTimeout(flushTimerRef.current);
                flushTimerRef.current = null;
            }

            pendingRef.current = [];
            uninstallConsoleLogCapture();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const hasAnyLog = fullLogRef.current.length > 0 || pendingRef.current.length > 0 || (logEntries?.length ?? 0) > 0;

    const getAllLogLines = () => {
        return fullLogRef.current.slice();
    };

    const clearLog = () => {
        fullLogRef.current = [];
        pendingRef.current = [];
        if (flushTimerRef.current !== null) {
            clearTimeout(flushTimerRef.current);
            flushTimerRef.current = null;
        }
        setLogEntries([]);
    };

    const handleBaudrateChange = (value: number) => {
        console.info("[ESP32] Baudrate changed", { value });
        setBaudRate(value);
    };

    const arrayBufferToBstr = (arrayBuffer: any) => {
        const u8Array = new Uint8Array(arrayBuffer);
        let binaryString = "";
        for (let i = 0; i < u8Array.length; i++) binaryString += String.fromCharCode(u8Array[i]);
        return binaryString;
    };

    // RevvoxFlasher management
    const revvoxFlasherRef = useRef<RevvoxFlasher | null>(null);

    const getRevvoxFlasher = () => {
        if (!revvoxFlasherRef.current) {
            console.info("[ESP32][Revvox] Creating RevvoxFlasher instance", logCtx());
            const flasher = new RevvoxFlasher();

            flasher.verboseSerial = logLevel >= 5;

            flasher.logDebug = (...args: unknown[]) => {
                if (logLevel >= 4) console.debug("[RevvoxFlasher]", ...args);
            };
            flasher.logError = (...args: unknown[]) => {
                console.error("[RevvoxFlasher]", ...args);
            };

            revvoxFlasherRef.current = flasher;
        }
        return revvoxFlasherRef.current;
    };

    const disconnectRevvoxFlasher = async () => {
        if (!revvoxFlasherRef.current) return;
        console.info("[ESP32][Revvox] Disconnect requested");
        try {
            await revvoxFlasherRef.current.disconnect();
            console.info("[ESP32][Revvox] Disconnected OK");
        } catch (err) {
            console.error("[ESP32][Revvox] Error while disconnecting", err);
        } finally {
            revvoxFlasherRef.current = null;
        }
    };

    const prepareRevvoxFlasher = async () => {
        console.info("[ESP32][Revvox] prepare: start", logCtx());
        const flasher = getRevvoxFlasher();

        setState((prev) => ({
            ...prev,
            state: t("tonieboxes.esp32BoxFlashing.esp32flasher.openPort"),
            showFlash: false,
            connected: true,
            actionInProgress: true,
            error: false,
        }));

        console.info("[ESP32][Revvox] prepare: openPort...");
        await flasher.openPort();

        console.info("[ESP32][Revvox] prepare: sync...");
        await flasher.sync();
        console.info("[ESP32][Revvox] prepare: port open + sync OK");

        setState((prev) => ({
            ...prev,
            state: t("tonieboxes.esp32BoxFlashing.esp32flasher.executingReliabilityCheck"),
            showFlash: false,
            connected: true,
            actionInProgress: true,
            showProgress: true,
            error: false,
        }));

        console.info("[ESP32][Revvox] prepare: reliability check start");
        const reliableConnection = await flasher.testReliability((progress) => {
            setState((prev) => ({ ...prev, progress }));
        });

        if (!reliableConnection) {
            console.error("[ESP32][Revvox] prepare: reliability check FAILED");
            throw Error(t("tonieboxes.esp32BoxFlashing.esp32flasher.reliabilityCheckFailed"));
        }

        console.info("[ESP32][Revvox] prepare: reliability check OK, downloading stub...");
        const stubSet = await flasher.downloadStub();

        if (!stubSet) {
            console.error("[ESP32][Revvox] prepare: stub upload FAILED");
            throw Error(t("tonieboxes.esp32BoxFlashing.esp32flasher.downloadStubFailed"));
        }

        console.info("[ESP32][Revvox] prepare: stub uploaded OK");
        return flasher;
    };

    // fetch cert dir
    useEffect(() => {
        const fetchCertsDir = async () => {
            const response = await api.apiGetTeddyCloudSettingRaw("core.certdir");
            const certDirText = await response.text();
            setCertDir(certDirText);
        };
        fetchCertsDir().catch((e) => console.error("[ESP32] fetchCertsDir failed", e));
    }, []);

    // web serial support
    useEffect(() => {
        const supported = isWebSerialSupported();
        console.info("[ESP32] WebSerial supported?", { supported });
        setIsSupported(supported);
    }, []);

    // https / redirect handling
    useEffect(() => {
        if (window.location.protocol === "https:") {
            console.info("[ESP32] HTTPS active");
            setHttpsActive(true);
            return;
        }

        const fetchHttpsPort = async (): Promise<string | undefined> => {
            if (import.meta.env.VITE_APP_TEDDYCLOUD_PORT_HTTPS) return import.meta.env.VITE_APP_TEDDYCLOUD_PORT_HTTPS;
            try {
                const response = await api.apiGetTeddyCloudSettingRaw("core.server.https_web_port");
                return await response.text();
            } catch (error) {
                console.error("[ESP32] Error fetching https port", error);
            }
        };

        const fetchHttpPort = async (): Promise<string | undefined> => {
            if (import.meta.env.VITE_APP_TEDDYCLOUD_PORT_HTTP) return import.meta.env.VITE_APP_TEDDYCLOUD_PORT_HTTP;
            try {
                const response = await api.apiGetTeddyCloudSettingRaw("core.server.http_port");
                return await response.text();
            } catch (error) {
                console.error("[ESP32] Error fetching http port", error);
            }
        };

        const getHttpsUrl = async () => {
            const httpsPort = (await fetchHttpsPort()) || "";
            const httpPort = (await fetchHttpPort()) || "";

            const currentURL = new URL(window.location.href);
            currentURL.protocol = "https:";
            if (currentURL.port) {
                currentURL.port = currentURL.port === httpPort ? httpsPort : currentURL.port;
            } else {
                currentURL.port = httpsPort;
            }

            console.info("[ESP32] Computed httpsUrl", { httpsUrl: currentURL.toString() });
            setHttpsUrl(currentURL.toString());
        };

        setHttpsActive(false);
        getHttpsUrl().catch((e) => console.error("[ESP32] getHttpsUrl failed", e));
    }, []);

    // auto-reset path
    useEffect(() => {
        if (state.resetBox && state.patchedFlash) {
            console.info("[ESP32] auto resetFlash triggered", logCtx());
            resetFlash();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.resetBox, state.patchedFlash]);

    // auto-next when proceed
    useEffect(() => {
        if (!state.resetBox && state.proceed) {
            next();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.proceed]);

    // disable buttons while action in progress
    const [disableButtons, setDisableButtons] = useState(false);
    useEffect(() => {
        setDisableButtons(state.actionInProgress);
    }, [state.actionInProgress]);

    const openHttpsUrl = () => {
        if (httpsUrl) window.location.href = httpsUrl;
    };

    function checkFirmwareIntegrity(
        flashData: Uint8Array<ArrayBuffer> | Uint8Array<ArrayBufferLike>,
        t: TFunction
    ): boolean {
        console.info("[ESP32] integrity: start", { bytes: flashData.length });

        const onlyFFor00 = flashData.every((b) => b === 0xff || b === 0x00);
        if (onlyFFor00) {
            console.error("[ESP32] integrity: flash is only 0xFF/0x00 -> invalid");
            throw new Error(t("tonieboxes.esp32BoxFlashing.esp32flasher.invalidFlashData"));
        } else {
            console.info("[ESP32] integrity: flash not all 0xFF/0x00");
        }

        console.info("[ESP32] integrity: checking assets/certs partition...");
        const result = checkAssetsCertPartition(flashData);

        if (!result.ok) {
            console.error("[ESP32] integrity: certificates missing", result);
            throw new Error(
                t("tonieboxes.esp32BoxFlashing.esp32flasher.invalidFlashDataCertificatesMissing") + result.reason
            );
        } else {
            console.info("[ESP32] integrity: certs found", result);
        }

        console.info("[ESP32] integrity: OK");
        return true;
    }

    // --- low-level flashing logic ---
    const disconnectESPLoader = async (esploader: ESPLoader | null, port: SerialPort | null) => {
        if (!port) return;

        console.info("[ESP32][ESPLoader] disconnect requested");
        try {
            const transport = (esploader as any)?.transport;
            if (transport && typeof transport.disconnect === "function") {
                await transport.disconnect();
            } else {
                await port.close();
            }
            console.info("[ESP32][ESPLoader] disconnect OK");
        } catch (err) {
            console.error("[ESP32][ESPLoader] Error while closing serial connection", err);
        }
    };

    const getPort = async (message: string): Promise<SerialPort | null> => {
        console.info("[ESP32] getPort: start", { message, ...logCtx() });

        if (state.port) {
            try {
                console.info("[ESP32] getPort: reusing existing port", state.port.getInfo?.());
            } catch (e) {
                console.warn("[ESP32] getPort: existing port getInfo failed", e);
            }
            return state.port;
        }

        setState((prev) => ({
            ...prev,
            showStatus: true,
            showProgress: false,
            progress: 0,
            state: message || "Open serial port",
        }));

        let port: SerialPort | null = null;
        try {
            console.info("[ESP32] getPort: opening chooser...");
            port = await navigator.serial.requestPort();

            console.info("[ESP32] getPort: port selected", port?.getInfo?.());
            console.info("[ESP32] getPort: open/close test start...");
            await port.open({ baudRate: 115200 });
            await port.close();
            console.info("[ESP32] getPort: open/close test OK");
        } catch (err: any) {
            console.error("[ESP32] getPort failed", { name: err?.name, message: err?.message, err });

            if (err === "NetworkError") {
                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.portOpenFailedInUse"),
                    error: true,
                }));
                alert(t("tonieboxes.esp32BoxFlashing.esp32flasher.portOpenFailedInUse"));
            } else if (err === "NotFoundError") {
                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.noPortAvailable"),
                    error: true,
                }));
            } else {
                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.error") + err,
                    error: true,
                }));
                alert(t("tonieboxes.esp32BoxFlashing.esp32flasher.error") + ` ${err}`);
            }
            return null;
        }

        if (!port) {
            console.error("[ESP32] getPort: navigator.serial returned null port");
            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.invalidSerialPort"),
                error: true,
            }));
            return null;
        }

        setState((prev) => ({ ...prev, port }));
        console.info("[ESP32] getPort: stored port in state", port.getInfo?.());
        return port;
    };

    const loadFlashFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        console.info("[ESP32] loadFlashFile: start", logCtx());

        if (!e.target.files) return;
        const file = e.target.files[0];
        if (!file) return;

        console.info("[ESP32] loadFlashFile: selected", { name: file.name, size: file.size });

        setState((prev) => ({
            ...prev,
            showStatus: true,
            state: "",
            chipMac: "",
            chipType: "",
            flashId: "",
            flashManuf: "",
            flashDevice: "",
            flashSize: "",
            error: false,
            actionInProgress: true,
        }));

        const reader = new FileReader();

        reader.onload = async (ev) => {
            const target = ev.target as FileReader | null;
            if (!target) {
                console.error("[ESP32] loadFlashFile: FileReader target null");
                setState((prev) => ({ ...prev, actionInProgress: false }));
                return;
            }

            const arrayBuffer = target.result as ArrayBuffer;
            const flashData = new Uint8Array(arrayBuffer);

            console.info("[ESP32] loadFlashFile: read buffer", { bytes: flashData.length });

            if (flashData.length != ESP32_FLASHSIZE * 1024) {
                console.error("[ESP32] loadFlashFile: invalid size", {
                    actualKb: Math.round(flashData.length / 1024),
                    expectedKb: ESP32_FLASHSIZE,
                });

                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.flashSizeErrorLoadedFile", {
                        actualsize: "" + Math.round(flashData.length / 1024),
                        expectedsize: ESP32_FLASHSIZE,
                    }),
                    connected: false,
                    actionInProgress: false,
                    error: true,
                }));
                return;
            }

            try {
                console.info("[ESP32] loadFlashFile: integrity check start");
                checkFirmwareIntegrity(flashData, t);
                console.info("[ESP32] loadFlashFile: integrity OK");
            } catch (err: any) {
                console.error("[ESP32] loadFlashFile: integrity FAILED", err);
                setState((prev) => ({
                    ...prev,
                    state: err.message,
                    connected: false,
                    actionInProgress: false,
                    error: true,
                }));
                return;
            }

            console.info("[ESP32] loadFlashFile: branching", {
                resetBox: state.resetBox,
                useRevvoxFlasher,
            });

            // --- resetBox: only load patchedFlash from file, no serial needed ---
            if (state.resetBox) {
                console.info("[ESP32] loadFlashFile: resetBox -> load patchedFlash only");
                setState((prev) => ({
                    ...prev,
                    patchedFlash: arrayBuffer,
                    showFlash: true,
                    connected: false,
                    flashName: "from file",
                }));
            }
            // --- RevvoxFlasher branch ---
            else if (useRevvoxFlasher) {
                const flasher = getRevvoxFlasher();
                let mac = "";

                try {
                    setState((prev) => ({
                        ...prev,
                        state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingReadMac"),
                        showFlash: false,
                        connected: true,
                    }));

                    console.info("[ESP32][Revvox] loadFlashFile: openPort");
                    await flasher.openPort();

                    console.info("[ESP32][Revvox] loadFlashFile: sync");
                    setState((prev) => ({
                        ...prev,
                        state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingToESP"),
                    }));
                    await flasher.sync();

                    console.info("[ESP32][Revvox] loadFlashFile: readMac");
                    mac = (await flasher.readMac()) || "";
                    console.info("[ESP32][Revvox] loadFlashFile: MAC read", { mac, chip: flasher.current_chip });

                    setState((prev) => ({
                        ...prev,
                        chipMac: mac,
                        chipType: flasher.current_chip,
                    }));
                } catch (err: any) {
                    console.error("[ESP32][Revvox] loadFlashFile failed", err);
                    alert(err);

                    setState((prev) => ({
                        ...prev,
                        state:
                            t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToCommunicate") +
                            ` ${String(err?.message ?? err)}`,
                        connected: false,
                        actionInProgress: false,
                        error: true,
                    }));
                    await disconnectRevvoxFlasher();
                    return;
                } finally {
                    await disconnectRevvoxFlasher();
                }

                const sanitizedName = mac ? `ESP32_${mac.replace(/:/g, "")}` : "ESP32_from_file";
                const blob = new Blob([flashData], { type: "application/octet-stream" });
                const url = URL.createObjectURL(blob);

                console.info("[ESP32] loadFlashFile: uploading file to server", { name: sanitizedName });
                await uploadFlashData(flashData, sanitizedName);

                console.info("[ESP32] loadFlashFile: done (revvox)", { downloadLinkCreated: true });
                setState((prev) => ({
                    ...prev,
                    patchedFlash: arrayBuffer,
                    showFlash: true,
                    connected: false,
                    flashName: "from file",
                    downloadLink: url,
                }));
            }
            // --- original ESPLoader branch ---
            else {
                const port = await getPort(t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingReadMac"));
                if (port === null || state.connected) {
                    console.warn("[ESP32][ESPLoader] loadFlashFile: port null or already connected", {
                        portNull: port === null,
                        connected: state.connected,
                    });
                    setState((prev) => ({ ...prev, actionInProgress: false }));
                    return;
                }

                console.info("[ESP32][ESPLoader] loadFlashFile: init", {
                    baudRate,
                    romBaudRate,
                    port: port.getInfo?.(),
                });

                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingTo") + ` ${String(port.getInfo?.())}`,
                    showFlash: false,
                    connected: true,
                }));

                let esploader: ESPLoader | null = null;

                try {
                    const transport = new Transport(port);
                    esploader = new ESPLoader({ transport, baudrate: baudRate, romBaudrate: romBaudRate });
                } catch (err) {
                    console.error("[ESP32][ESPLoader] loadFlashFile: ESPLoader init failed", err);
                    setState((prev) => ({
                        ...prev,
                        state: t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToConnect") + ` ${err}`,
                        connected: false,
                        actionInProgress: false,
                        error: true,
                    }));
                    alert(err);
                    await disconnectESPLoader(esploader, port);
                    return;
                }

                try {
                    setState((prev) => ({
                        ...prev,
                        state: t("tonieboxes.esp32BoxFlashing.esp32flasher.retrievingMac"),
                        actionInProgress: true,
                    }));

                    console.info("[ESP32][ESPLoader] loadFlashFile: main()");
                    await esploader.main();
                    console.info("[ESP32][ESPLoader] loadFlashFile: connected");

                    const mac = await esploader.chip.readMac(esploader);
                    console.info("[ESP32][ESPLoader] loadFlashFile: MAC read", { mac });

                    setState((prev) => ({ ...prev, chipMac: mac }));

                    await disconnectESPLoader(esploader, port);

                    const sanitizedName = `ESP32_${mac.replace(/:/g, "")}`;
                    const blob = new Blob([flashData], { type: "application/octet-stream" });
                    const url = URL.createObjectURL(blob);

                    console.info("[ESP32] loadFlashFile: uploading file to server", { name: sanitizedName });
                    await uploadFlashData(flashData, sanitizedName);

                    setState((prev) => ({
                        ...prev,
                        patchedFlash: arrayBuffer,
                        showFlash: true,
                        connected: false,
                        flashName: "from file",
                        downloadLink: url,
                    }));

                    console.info("[ESP32] loadFlashFile: done (esploader)", { downloadLinkCreated: true });
                } catch (err) {
                    console.error("[ESP32][ESPLoader] loadFlashFile failed", err);
                    setState((prev) => ({
                        ...prev,
                        state: t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToCommunicate") + ` ${err}`,
                        connected: false,
                        actionInProgress: false,
                        error: true,
                    }));
                    alert(err);
                    await disconnectESPLoader(esploader, port);
                    return;
                }
            }
        };

        reader.readAsArrayBuffer(file);

        setState((prev) => ({ ...prev, actionInProgress: false }));
        e.target.value = "";
    };

    const readFlash = async () => {
        console.info("[ESP32] readFlash: start", logCtx());

        if (useRevvoxFlasher) {
            const flashSizeKb = ESP32_FLASHSIZE;
            const totalBytes = flashSizeKb * 1024;

            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingToESP"),
                showStatus: true,
                showFlash: true,
                connected: true,
                actionInProgress: true,
                error: false,
            }));

            let mac = "";
            let flashData: Uint8Array;

            try {
                const flasher = await prepareRevvoxFlasher();

                mac = (await flasher.readMac()) || "";
                console.info("[ESP32][Revvox] readFlash: chip identified", {
                    mac,
                    chip: flasher.current_chip,
                    flashSizeKb,
                });

                setState((prev) => ({
                    ...prev,
                    chipMac: mac,
                    chipType: flasher.current_chip,
                    flashSize: "" + flashSizeKb,
                }));

                if (!flasher.current_chip.toUpperCase().startsWith(ESP32_CHIPNAME.toUpperCase().replace("-", ""))) {
                    console.error("[ESP32][Revvox] readFlash: chip type mismatch", {
                        actual: flasher.current_chip,
                        expected: ESP32_CHIPNAME,
                    });
                    throw new Error(
                        t("tonieboxes.esp32BoxFlashing.esp32flasher.chipTypeError", {
                            actualtype: "" + flasher.current_chip,
                            expectedtype: ESP32_CHIPNAME,
                        })
                    );
                }

                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.readingFlash"),
                    progress: 0,
                }));

                console.info("[ESP32][Revvox] readFlash: reading flash", { totalBytes });

                flashData = await flasher.readFlash(0x00000000, totalBytes, (read, total, stage) => {
                    const prog = (100 * read) / total;
                    setState((prev) => ({
                        ...prev,
                        progress: prog,
                        state:
                            stage === "Reading"
                                ? t("tonieboxes.esp32BoxFlashing.esp32flasher.readingFlash")
                                : t("tonieboxes.esp32BoxFlashing.esp32flasher.verifyingReadFlash"),
                    }));
                });

                console.info("[ESP32][Revvox] readFlash: done", { bytes: flashData.length });

                console.info("[ESP32][Revvox] readFlash: integrity check...");
                checkFirmwareIntegrity(flashData, t);
                console.info("[ESP32][Revvox] readFlash: integrity OK");

                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.readingFinished"),
                    progress: 100,
                    originalFlash: flashData,
                    connected: false,
                    showProgress: false,
                }));

                // FIX: url must be created BEFORE setState using it
                const sanitizedName = `ESP32_${mac.replace(/:/g, "")}`;
                const blob = new Blob([flashData.buffer as ArrayBuffer], { type: "application/octet-stream" });
                const url = URL.createObjectURL(blob);

                console.info("[ESP32][Revvox] readFlash: download link created");

                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.uploadingFlashData"),
                    downloadLink: url,
                }));

                console.info("[ESP32][Revvox] readFlash: uploading to server...", { name: sanitizedName });
                await uploadFlashData(flashData, sanitizedName);
                console.info("[ESP32][Revvox] readFlash: upload finished");
            } catch (err: any) {
                console.error("[ESP32][Revvox] readFlash failed", err);

                setState((prev) => ({
                    ...prev,
                    state:
                        t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToCommunicate") +
                        ` ${String(err?.message ?? err)}`,
                    connected: false,
                    actionInProgress: false,
                    error: true,
                }));
                alert(err);
            } finally {
                await disconnectRevvoxFlasher();
            }

            return;
        }

        // --- original ESPLoader branch ---
        let esploader: ESPLoader | null = null;
        let flashData: Uint8Array | null = null;
        let mac = "";

        const port = await getPort(t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingReadFlash"));
        if (port === null || state.connected) {
            console.warn("[ESP32][ESPLoader] readFlash: port null or already connected", {
                portNull: port === null,
                connected: state.connected,
            });
            return;
        }

        setState((prev) => ({
            ...prev,
            state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingTo") + ` ${String(port.getInfo?.())}`,
            chipMac: "",
            chipType: "",
            flashId: "",
            flashManuf: "",
            flashDevice: "",
            flashSize: "",
            showFlash: false,
            connected: true,
            actionInProgress: true,
            error: false,
        }));

        console.info("[ESP32][ESPLoader] readFlash: init", { baudRate, romBaudRate, port: port.getInfo?.() });

        try {
            const transport = new Transport(port);
            esploader = new ESPLoader({ transport, baudrate: baudRate, romBaudrate: romBaudRate });
        } catch (err) {
            console.error("[ESP32][ESPLoader] readFlash: ESPLoader init failed", err);
            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToConnect") + ` ${err}`,
                connected: false,
                actionInProgress: false,
                error: true,
            }));
            alert(err);
            await disconnectESPLoader(esploader, port);
            return;
        }

        try {
            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingToESP"),
            }));

            console.info("[ESP32][ESPLoader] readFlash: main()");
            await esploader.main();
            console.info("[ESP32][ESPLoader] readFlash: connected");

            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connected"),
            }));

            mac = await esploader.chip.readMac(esploader);
            console.info("[ESP32][ESPLoader] readFlash: MAC read", { mac });

            setState((prev) => ({ ...prev, chipMac: mac }));

            const type = await esploader.chip.getChipDescription(esploader);
            console.info("[ESP32][ESPLoader] readFlash: chip type", { type });

            setState((prev) => ({ ...prev, chipType: type }));

            const flash_id = await esploader.readFlashId();
            console.info("[ESP32][ESPLoader] readFlash: flashId", { flash_id });

            setState((prev) => ({
                ...prev,
                flashId: "" + flash_id,
                flashManuf: "" + (flash_id & 0xff),
                flashDevice: "" + ((flash_id >> 8) & 0xff),
            }));

            const flash_size = await esploader.getFlashSize();
            console.info("[ESP32][ESPLoader] readFlash: flashSize", { flash_size });

            setState((prev) => ({ ...prev, flashSize: "" + flash_size }));

            if (flash_size != ESP32_FLASHSIZE) {
                console.error("[ESP32][ESPLoader] readFlash: flash size mismatch", {
                    actual: flash_size,
                    expected: ESP32_FLASHSIZE,
                });

                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.flashSizeError", {
                        actualsize: "" + flash_size,
                        expectedsize: ESP32_FLASHSIZE,
                    }),
                    connected: false,
                    actionInProgress: false,
                    error: true,
                }));
                await disconnectESPLoader(esploader, port);
                return;
            }

            if (!type.toUpperCase().startsWith(ESP32_CHIPNAME.toUpperCase())) {
                console.error("[ESP32][ESPLoader] readFlash: chip type mismatch", {
                    actual: type,
                    expected: ESP32_CHIPNAME,
                });

                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.chipTypeError", {
                        actualtype: "" + type,
                        expectedtype: ESP32_CHIPNAME,
                    }),
                    connected: false,
                    actionInProgress: false,
                    error: true,
                }));
                await disconnectESPLoader(esploader, port);
                return;
            }

            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.readingFlash"),
                showProgress: true,
                progress: 0,
            }));

            console.info("[ESP32][ESPLoader] readFlash: reading flash", { totalBytes: flash_size * 1024 });

            flashData = await esploader.readFlash(0, flash_size * 1024, (packet, progress, totalSize) => {
                const prog = (100 * progress) / totalSize;
                setState((prev) => ({
                    ...prev,
                    progress: prog,
                }));
            });

            console.info("[ESP32][ESPLoader] readFlash: done", { bytes: flashData.length });

            await disconnectESPLoader(esploader, port);

            try {
                console.info("[ESP32][ESPLoader] readFlash: integrity check...");
                checkFirmwareIntegrity(flashData, t);
                console.info("[ESP32][ESPLoader] readFlash: integrity OK");
            } catch (err: any) {
                console.error("[ESP32][ESPLoader] readFlash: integrity FAILED", err);
                setState((prev) => ({
                    ...prev,
                    state: err.message,
                    connected: false,
                    actionInProgress: false,
                    error: true,
                }));
                return;
            }

            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.readingFinished"),
                progress: 100,
                originalFlash: flashData,
                connected: false,
            }));
        } catch (err) {
            console.error("[ESP32][ESPLoader] readFlash failed", err);

            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToCommunicate") + ` ${err}`,
                connected: false,
                actionInProgress: false,
                error: true,
            }));
            alert(err);
            await disconnectESPLoader(esploader, port);
            return;
        }

        const sanitizedName = `ESP32_${mac.replace(/:/g, "")}`;
        const blob = new Blob([(flashData as Uint8Array).buffer as ArrayBuffer], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);

        console.info("[ESP32] readFlash: download link created", { name: sanitizedName });

        setState((prev) => ({
            ...prev,
            downloadLink: url,
            showProgress: false,
        }));

        console.info("[ESP32] readFlash: uploading to server...", { name: sanitizedName });
        await uploadFlashData(flashData as Uint8Array, sanitizedName);
        console.info("[ESP32] readFlash: upload finished");
    };

    const uploadFlashData = async (flashData: Uint8Array, sanitizedName: string) => {
        console.info("[ESP32] uploadFlashData: start", { name: sanitizedName, bytes: flashData.length });

        try {
            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.uploading"),
                error: false,
            }));

            const formData = new FormData();
            formData.append(sanitizedName, new Blob([(flashData as Uint8Array).buffer as ArrayBuffer]), sanitizedName);

            console.info("[ESP32] uploadFlashData: POST /api/esp32/uploadFirmware", { name: sanitizedName });

            const response = await api.apiPostTeddyCloudFormDataRaw(`/api/esp32/uploadFirmware`, formData);

            if (response.ok && response.status === 200) {
                const filename = await response.text();
                console.info("[ESP32] uploadFlashData: success", { filename });

                setState((prev) => ({
                    ...prev,
                    showDownload: true,
                    filename,
                    state:
                        t("tonieboxes.esp32BoxFlashing.esp32flasher.uploadSuccessful") +
                        ` ${filename}` +
                        t("tonieboxes.esp32BoxFlashing.esp32flasher.readyToProceed"),
                    proceed: true,
                    actionInProgress: false,
                }));
            } else {
                const body = await response.text().catch(() => "");
                console.error("[ESP32] uploadFlashData: server error", { status: response.status, body });

                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.uploadFailed"),
                    actionInProgress: false,
                    error: true,
                }));
            }
        } catch (err) {
            console.error("[ESP32] uploadFlashData: exception", err);
            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.uploadFailed"),
                actionInProgress: false,
                error: true,
            }));
        }
    };

    const next = () => {
        setState((prev) => ({ ...prev, state: "", proceed: false }));
        setCurrentStep((prev) => prev + 1);
        scrollToTop(scrollToTopAnchor && scrollToTopAnchor);
    };

    const prev = () => {
        setState((prevState) => ({ ...prevState, state: "", showProgress: false, error: false }));
        setCurrentStep((prev) => prev - 1);
        scrollToTop(scrollToTopAnchor && scrollToTopAnchor);
    };

    const patchFlash = async () => {
        console.info("[ESP32] patchFlash: start", {
            filename: state.filename,
            hostname: state.hostname,
            previousHostname: state.previousHostname,
            flagPreviousHostname: state.flagPreviousHostname,
            wifi: {
                ssid: state.wifi_ssid ? "***" : "",
                pass: state.wifi_pass ? "***" : "",
            },
        });

        if ((state.wifi_ssid && !state.wifi_pass) || (!state.wifi_ssid && state.wifi_pass)) {
            console.error("[ESP32] patchFlash: wifi credentials incomplete", {
                ssidProvided: !!state.wifi_ssid,
                passProvided: !!state.wifi_pass,
            });

            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.wifiCredentialsIncomplete"),
                showStatus: true,
                warningTextWifi: t("tonieboxes.esp32BoxFlashing.esp32flasher.wifiCredentialsIncomplete"),
                error: true,
            }));
            return;
        }

        setState((prev) => ({
            ...prev,
            actionInProgress: true,
        }));

        setState((prev) => ({
            ...prev,
            showProgress: false,
            showFlash: false,
            state: t("tonieboxes.esp32BoxFlashing.esp32flasher.patchingFlashImage"),
            error: false,
        }));

        try {
            const url =
                `/api/esp32/patchFirmware?filename=${encodeURIComponent(state.filename)}` +
                (state.previousHostname && state.flagPreviousHostname
                    ? `&hostname_old=${encodeURIComponent(state.previousHostname)}`
                    : "") +
                `&hostname=${encodeURIComponent(state.hostname)}` +
                (state.wifi_ssid && state.wifi_pass
                    ? `&wifi_ssid=${encodeURIComponent(state.wifi_ssid)}&wifi_pass=${encodeURIComponent(
                          state.wifi_pass
                      )}`
                    : "");

            console.info("[ESP32] patchFlash: request", { url });

            const response = await api.apiGetTeddyCloudApiRaw(url);

            setState((prev) => ({
                ...prev,
                showProgress: false,
                showFlash: false,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.patchingFlashImage"),
            }));

            if (response.ok && response.status === 200) {
                console.info("[ESP32] patchFlash: patching successful, downloading patched image...");

                const arrayBuffer = await response.arrayBuffer();
                const sizeMb = arrayBuffer.byteLength / 1024 / 1024;

                console.info("[ESP32] patchFlash: patched image received", { bytes: arrayBuffer.byteLength, sizeMb });

                setState((prev) => ({
                    ...prev,
                    patchedFlash: arrayBuffer,
                    showFlash: true,
                    flashName: "patched",
                }));

                const blob2 = new Blob([arrayBuffer], { type: "application/octet-stream" });
                const url2 = URL.createObjectURL(blob2);

                console.info("[ESP32] patchFlash: download link created");

                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.patchingSuccessful", {
                        size: sizeMb.toFixed(0),
                    }),
                    downloadLinkPatched: url2,
                }));

                console.info("[ESP32] patchFlash: done");
                next();
            } else {
                const body = await response.text().catch(() => "");
                console.error("[ESP32] patchFlash: patching failed", { status: response.status, body });

                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.patchingFailed"),
                    error: true,
                }));
            }
        } catch (err) {
            console.error("[ESP32] patchFlash: exception", err);

            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.patchingFailed"),
                error: true,
            }));
        } finally {
            setState((prev) => ({
                ...prev,
                actionInProgress: false,
            }));
            console.info("[ESP32] patchFlash: finished");
        }
    };

    const resetFlash = async () => {
        console.info("[ESP32] resetFlash: start", { useRevvoxFlasher });

        // --- RevvoxFlasher branch ---
        if (useRevvoxFlasher) {
            if (!state.patchedFlash) {
                console.error("[ESP32][Revvox] resetFlash: no patchedFlash loaded");
                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.patchingFlashImage"),
                    error: true,
                }));
                return;
            }

            setState((prev) => ({
                ...prev,
                actionInProgress: true,
                error: false,
                showProgress: true,
                showStatus: true,
                progress: 0,
            }));

            try {
                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingWriteFlash"),
                }));

                console.info("[ESP32][Revvox] resetFlash: prepare flasher");
                const flasher = await prepareRevvoxFlasher();

                console.info("[ESP32][Revvox] resetFlash: setCurrentStep(2)");
                setCurrentStep(2);

                const mac = await flasher.readMac();
                console.info("[ESP32][Revvox] resetFlash: MAC read", { mac, chip: flasher.current_chip });

                if (mac) {
                    setState((prev) => ({
                        ...prev,
                        chipMac: mac,
                        chipType: flasher.current_chip,
                    }));
                }

                if (!flasher.current_chip.toUpperCase().startsWith(ESP32_CHIPNAME.toUpperCase().replace("-", ""))) {
                    console.error("[ESP32][Revvox] resetFlash: chip type mismatch", {
                        actual: flasher.current_chip,
                        expected: ESP32_CHIPNAME,
                    });
                    throw new Error(
                        t("tonieboxes.esp32BoxFlashing.esp32flasher.chipTypeError", {
                            actualtype: "" + flasher.current_chip,
                            expectedtype: ESP32_CHIPNAME,
                        })
                    );
                }

                const data = new Uint8Array(state.patchedFlash as ArrayBuffer);
                const totalSize = data.length;
                const sizeMb = totalSize / 1024 / 1024;

                console.info("[ESP32][Revvox] resetFlash: writing start", { bytes: totalSize, sizeMb });

                const statusWriting = t("tonieboxes.esp32BoxFlashing.esp32flasher.writingFlash", {
                    size: sizeMb.toFixed(0),
                });

                setState((prev) => ({
                    ...prev,
                    state: statusWriting,
                    progress: 0,
                }));

                await flasher.writeFlash(0, data, (offset, total, stage) => {
                    const progress = (offset / total) * 100;

                    setState((prev) => ({
                        ...prev,
                        state:
                            stage === "Writing"
                                ? statusWriting
                                : t("tonieboxes.esp32BoxFlashing.esp32flasher.verifyingWrittenFlash"),
                        progress,
                    }));
                });

                console.info("[ESP32][Revvox] resetFlash: writing finished");

                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.writingFinished"),
                    connected: false,
                    actionInProgress: false,
                    progress: 100,
                }));

                console.info("[ESP32][Revvox] resetFlash: setCurrentStep(3)");
                setCurrentStep(3);
            } catch (err: any) {
                console.error("[ESP32][Revvox] resetFlash: failed", err);
                alert(err);

                setState((prev) => ({
                    ...prev,
                    state:
                        t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToCommunicate") +
                        ` ${String(err?.message ?? err)}`,
                    connected: false,
                    actionInProgress: false,
                    error: true,
                }));
            } finally {
                console.info("[ESP32][Revvox] resetFlash: disconnect flasher");
                await disconnectRevvoxFlasher();
            }

            return;
        }

        // --- original ESPLoader branch ---
        const port = await getPort(t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingWriteFlash"));
        if (port === null || state.connected) {
            console.warn("[ESP32][ESPLoader] resetFlash: port null or already connected", {
                portNull: port === null,
                connected: state.connected,
            });
            return;
        }

        console.info("[ESP32][ESPLoader] resetFlash: setCurrentStep(2)");
        setCurrentStep(2);

        setState((prev) => ({
            ...prev,
            actionInProgress: true,
            error: false,
        }));

        setState((prev) => ({
            ...prev,
            state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingTo") + ` ${port.getInfo()}`,
            connected: true,
        }));

        let esploader: ESPLoader | null = null;

        try {
            console.info("[ESP32][ESPLoader] resetFlash: init ESPLoader", { baudRate, romBaudRate });

            const transport = new Transport(port);
            esploader = new ESPLoader({
                transport,
                baudrate: baudRate,
                romBaudrate: romBaudRate,
            });
        } catch (err) {
            console.error("[ESP32][ESPLoader] resetFlash: init failed", err);

            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToConnect") + ` ${err}`,
                connected: false,
                actionInProgress: false,
                error: true,
            }));
            alert(err);
            await disconnectESPLoader(esploader, port);
            return;
        }

        try {
            console.info("[ESP32][ESPLoader] resetFlash: connect (main)");
            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingToESP"),
            }));

            await esploader.main();

            console.info("[ESP32][ESPLoader] resetFlash: connected");
            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connected"),
                progress: 0,
                showProgress: true,
            }));

            const mac = await esploader.chip.readMac(esploader);
            const type = await esploader.chip.getChipDescription(esploader);
            const flash_id = await esploader.readFlashId();
            const flash_size = await esploader.getFlashSize();

            console.info("[ESP32][ESPLoader] resetFlash: chip info", {
                mac,
                type,
                flash_id,
                flash_size,
            });

            setState((prev) => ({
                ...prev,
                chipMac: mac,
                chipType: type,
                flashId: "" + flash_id,
                flashManuf: "" + (flash_id & 0xff),
                flashDevice: "" + ((flash_id >> 8) & 0xff),
                flashSize: "" + flash_size,
            }));

            if (flash_size != ESP32_FLASHSIZE) {
                console.error("[ESP32][ESPLoader] resetFlash: flash size mismatch", {
                    actual: flash_size,
                    expected: ESP32_FLASHSIZE,
                });

                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.flashSizeError", {
                        actualsize: "" + flash_size,
                        expectedsize: ESP32_FLASHSIZE,
                    }),
                    connected: false,
                    actionInProgress: false,
                    error: true,
                }));
                await disconnectESPLoader(esploader, port);
                return;
            }

            if (!type.toUpperCase().startsWith(ESP32_CHIPNAME.toUpperCase())) {
                console.error("[ESP32][ESPLoader] resetFlash: chip type mismatch", {
                    actual: type,
                    expected: ESP32_CHIPNAME,
                });

                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.chipTypeError", {
                        actualtype: "" + type,
                        expectedtype: ESP32_CHIPNAME,
                    }),
                    connected: false,
                    actionInProgress: false,
                    error: true,
                }));
                await disconnectESPLoader(esploader, port);
                return;
            }

            if (!state.patchedFlash) {
                console.error("[ESP32][ESPLoader] resetFlash: patchedFlash is missing in state");
                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.patchingFlashImage"),
                    error: true,
                    connected: false,
                    actionInProgress: false,
                }));
                await disconnectESPLoader(esploader, port);
                return;
            }

            const sizeMb = state.patchedFlash.byteLength / 1024 / 1024;

            console.info("[ESP32][ESPLoader] resetFlash: preparing flash", {
                bytes: state.patchedFlash.byteLength,
                sizeMb,
            });

            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.preparingFlash", {
                    size: sizeMb.toFixed(0),
                }),
            }));

            const fileArray: { data: string; address: number }[] = [
                { data: arrayBufferToBstr(state.patchedFlash), address: 0 },
            ];

            const opts = {
                fileArray,
                flashSize: "keep",
                flashMode: "keep",
                flashFreq: "keep",
                eraseAll: false,
                compress: true,
                reportProgress: (fileIndex: any, written: number, total: number) => {
                    const prog = (100 * written) / total;
                    setState((prev) => ({ ...prev, progress: prog }));
                },
            };

            console.info("[ESP32][ESPLoader] resetFlash: writing start");

            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.writingFlash", {
                    size: sizeMb.toFixed(0),
                }),
            }));

            await esploader.writeFlash(opts);

            console.info("[ESP32][ESPLoader] resetFlash: writing finished, disconnecting");
            await disconnectESPLoader(esploader, port);

            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.writingFinished"),
                connected: false,
                actionInProgress: false,
            }));

            console.info("[ESP32][ESPLoader] resetFlash: setCurrentStep(3)");
            setCurrentStep(3);
        } catch (err) {
            console.error("[ESP32][ESPLoader] resetFlash failed", err);

            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToCommunicate") + ` ${err}`,
                connected: false,
                actionInProgress: false,
                error: true,
            }));
            alert(err);
            await disconnectESPLoader(esploader, port);
            return;
        }
    };

    const writeFlash = async () => {
        console.info("[ESP32] writeFlash: start", { useRevvoxFlasher });

        // --- RevvoxFlasher branch ---
        if (useRevvoxFlasher) {
            if (!state.patchedFlash) {
                console.error("[ESP32][Revvox] writeFlash: no patchedFlash loaded");
                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.patchingFlashImage"),
                    error: true,
                }));
                return;
            }

            setState((prev) => ({
                ...prev,
                actionInProgress: true,
                error: false,
                showProgress: true,
                showStatus: true,
                state: "",
                progress: 0,
            }));

            try {
                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingWriteFlash"),
                }));

                console.info("[ESP32][Revvox] writeFlash: prepare flasher");
                const flasher = await prepareRevvoxFlasher();

                const mac = await flasher.readMac();
                console.info("[ESP32][Revvox] writeFlash: MAC read", { mac, chip: flasher.current_chip });

                if (mac) {
                    setState((prev) => ({
                        ...prev,
                        chipMac: mac,
                        chipType: flasher.current_chip,
                    }));
                }

                if (!flasher.current_chip.toUpperCase().startsWith(ESP32_CHIPNAME.toUpperCase().replace("-", ""))) {
                    console.error("[ESP32][Revvox] writeFlash: chip type mismatch", {
                        actual: flasher.current_chip,
                        expected: ESP32_CHIPNAME,
                    });

                    throw new Error(
                        t("tonieboxes.esp32BoxFlashing.esp32flasher.chipTypeError", {
                            actualtype: "" + flasher.current_chip,
                            expectedtype: ESP32_CHIPNAME,
                        })
                    );
                }

                const data = new Uint8Array(state.patchedFlash as ArrayBuffer);
                const totalSize = data.length;
                const sizeMb = totalSize / 1024 / 1024;

                console.info("[ESP32][Revvox] writeFlash: writing start", { bytes: totalSize, sizeMb });

                const statusWriting = t("tonieboxes.esp32BoxFlashing.esp32flasher.writingFlash", {
                    size: sizeMb.toFixed(0),
                });

                setState((prev) => ({
                    ...prev,
                    state: statusWriting,
                    progress: 0,
                }));

                let lastLogged = -1;

                await flasher.writeFlash(0, data, (offset, total, stage) => {
                    const progress = (offset / total) * 100;

                    setState((prev) => ({
                        ...prev,
                        state:
                            stage === "Writing"
                                ? statusWriting
                                : t("tonieboxes.esp32BoxFlashing.esp32flasher.verifyingWrittenFlash"),
                        progress,
                    }));
                });

                console.info("[ESP32][Revvox] writeFlash: writing finished");

                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.writingFinished"),
                    connected: false,
                    actionInProgress: false,
                    proceed: true,
                    progress: 100,
                }));

                console.info("[ESP32][Revvox] writeFlash: done (proceed=true)");
            } catch (err: any) {
                console.error("[ESP32][Revvox] writeFlash failed", err);
                alert(err);

                setState((prev) => ({
                    ...prev,
                    state:
                        t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToCommunicate") +
                        ` ${String(err?.message ?? err)}`,
                    connected: false,
                    actionInProgress: false,
                    error: true,
                }));
            } finally {
                console.info("[ESP32][Revvox] writeFlash: disconnect flasher");
                await disconnectRevvoxFlasher();
            }

            return;
        }

        // --- original ESPLoader branch ---
        const port = await getPort(t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingWriteFlash"));
        if (port === null || state.connected) {
            console.warn("[ESP32][ESPLoader] writeFlash: port null or already connected", {
                portNull: port === null,
                connected: state.connected,
            });
            return;
        }

        setState((prev) => ({
            ...prev,
            actionInProgress: true,
            error: false,
        }));

        setState((prev) => ({
            ...prev,
            state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingTo") + ` ${port.getInfo()}`,
            connected: true,
        }));

        let esploader: ESPLoader | null = null;

        try {
            console.info("[ESP32][ESPLoader] writeFlash: init ESPLoader", { baudRate, romBaudRate });

            const transport = new Transport(port);
            esploader = new ESPLoader({
                transport,
                baudrate: baudRate,
                romBaudrate: romBaudRate,
            });
        } catch (err) {
            console.error("[ESP32][ESPLoader] writeFlash: init failed", err);

            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToConnect") + ` ${err}`,
                connected: false,
                actionInProgress: false,
                error: true,
            }));
            alert(err);
            await disconnectESPLoader(esploader, port);
            return;
        }

        try {
            console.info("[ESP32][ESPLoader] writeFlash: connect (main)");
            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingToESP"),
            }));

            await esploader.main();

            console.info("[ESP32][ESPLoader] writeFlash: connected");
            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connected"),
                progress: 0,
                showProgress: true,
            }));

            const mac = await esploader.chip.readMac(esploader);
            const type = await esploader.chip.getChipDescription(esploader);
            const flash_id = await esploader.readFlashId();
            const flash_size = await esploader.getFlashSize();

            console.info("[ESP32][ESPLoader] writeFlash: chip info", {
                mac,
                type,
                flash_id,
                flash_size,
            });

            setState((prev) => ({
                ...prev,
                chipMac: mac,
                chipType: type,
                flashId: "" + flash_id,
                flashManuf: "" + (flash_id & 0xff),
                flashDevice: "" + ((flash_id >> 8) & 0xff),
                flashSize: "" + flash_size,
            }));

            if (flash_size != ESP32_FLASHSIZE) {
                console.error("[ESP32][ESPLoader] writeFlash: flash size mismatch", {
                    actual: flash_size,
                    expected: ESP32_FLASHSIZE,
                });

                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.flashSizeError", {
                        actualsize: "" + flash_size,
                        expectedsize: ESP32_FLASHSIZE,
                    }),
                    connected: false,
                    actionInProgress: false,
                    error: true,
                }));
                await disconnectESPLoader(esploader, port);
                return;
            }

            if (!type.toUpperCase().startsWith(ESP32_CHIPNAME.toUpperCase())) {
                console.error("[ESP32][ESPLoader] writeFlash: chip type mismatch", {
                    actual: type,
                    expected: ESP32_CHIPNAME,
                });

                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.chipTypeError", {
                        actualtype: "" + type,
                        expectedtype: ESP32_CHIPNAME,
                    }),
                    connected: false,
                    actionInProgress: false,
                    error: true,
                }));
                await disconnectESPLoader(esploader, port);
                return;
            }

            if (!state.patchedFlash) {
                console.error("[ESP32][ESPLoader] writeFlash: patchedFlash is missing in state");
                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.patchingFlashImage"),
                    error: true,
                    connected: false,
                    actionInProgress: false,
                }));
                await disconnectESPLoader(esploader, port);
                return;
            }

            const sizeMb = state.patchedFlash.byteLength / 1024 / 1024;

            console.info("[ESP32][ESPLoader] writeFlash: preparing flash", {
                bytes: state.patchedFlash.byteLength,
                sizeMb,
            });

            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.preparingFlash", {
                    size: sizeMb.toFixed(0),
                }),
            }));

            const fileArray: { data: string; address: number }[] = [
                { data: arrayBufferToBstr(state.patchedFlash), address: 0 },
            ];

            const opts = {
                fileArray,
                flashSize: "keep",
                flashMode: "keep",
                flashFreq: "keep",
                eraseAll: false,
                compress: true,
                reportProgress: (fileIndex: any, written: number, total: number) => {
                    const prog = (100 * written) / total;
                    setState((prev) => ({ ...prev, progress: prog }));

                    const p = Math.floor(prog);
                    if (p % 10 === 0) console.debug("[ESP32][ESPLoader] writeFlash: progress", { p, written, total });
                },
            };

            console.info("[ESP32][ESPLoader] writeFlash: writing start");

            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.writingFlash", {
                    size: sizeMb.toFixed(0),
                }),
            }));

            await esploader.writeFlash(opts);

            console.info("[ESP32][ESPLoader] writeFlash: writing finished, disconnecting");
            await disconnectESPLoader(esploader, port);

            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.writingFinished"),
                connected: false,
                actionInProgress: false,
                proceed: true,
            }));

            console.info("[ESP32][ESPLoader] writeFlash: done (proceed=true)");
        } catch (err) {
            console.error("[ESP32][ESPLoader] writeFlash failed", err);

            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToCommunicate") + ` ${err}`,
                connected: false,
                actionInProgress: false,
                error: true,
            }));
            alert(err);
            await disconnectESPLoader(esploader, port);
            return;
        }
    };

    const extractAndStoreCertsFromFlash = async (force?: boolean) => {
        console.info("[ESP32] extractAndStoreCertsFromFlash: start", { force, filename: state.filename });

        const key = "extractStoreCerts";
        addLoadingNotification(
            key,
            t("tonieboxes.esp32BoxFlashing.processing"),
            t("tonieboxes.esp32BoxFlashing.esp32flasher.extractingCertificates")
        );
        if (force) setIsOverwriteForceConfirmationModalOpen(false);

        try {
            const url =
                `/api/esp32/extractCerts?filename=${encodeURIComponent(state.filename)}` +
                (force ? "&overwrite=true" : "");
            console.info("[ESP32] extractAndStoreCertsFromFlash: request", { url });

            const response = await api.apiPostTeddyCloudRaw(url);

            closeLoadingNotification(key);

            if (response.ok && response.status === 200) {
                console.info("[ESP32] extractAndStoreCertsFromFlash: success");

                addNotification(
                    NotificationTypeEnum.Success,
                    t("tonieboxes.esp32BoxFlashing.esp32flasher.extractingCertificatesSuccessful"),
                    t("tonieboxes.esp32BoxFlashing.esp32flasher.extractingCertificatesSuccessfulDetails", {
                        file: state.filename,
                    }),
                    t("tonieboxes.esp32BoxFlashing.title")
                );
                setFetchCloudStatus((prev) => !prev);
            } else if (!response.ok && response.status === 409) {
                const errorMessage = await response.text();
                console.error("[ESP32] extractAndStoreCertsFromFlash: conflict (409)", { errorMessage });

                addNotification(
                    NotificationTypeEnum.Error,
                    t("tonieboxes.esp32BoxFlashing.esp32flasher.extractingCertificatesFailed"),
                    t("tonieboxes.esp32BoxFlashing.esp32flasher.extractingCertificatesFailedDetails", {
                        file: state.filename,
                    }) +
                        ": " +
                        errorMessage,
                    t("tonieboxes.esp32BoxFlashing.title")
                );
                setExtractCertificateErrorMessage(errorMessage);
                setIsOverwriteForceConfirmationModalOpen(true);
            } else {
                const body = await response.text().catch(() => "");
                console.error("[ESP32] extractAndStoreCertsFromFlash: failed", { status: response.status, body });

                addNotification(
                    NotificationTypeEnum.Error,
                    t("tonieboxes.esp32BoxFlashing.esp32flasher.extractingCertificatesFailed"),
                    t("tonieboxes.esp32BoxFlashing.esp32flasher.extractingCertificatesFailedDetails", {
                        file: state.filename,
                    }) +
                        ": " +
                        body,
                    t("tonieboxes.esp32BoxFlashing.title")
                );
            }
        } catch (err: any) {
            console.error("[ESP32] extractAndStoreCertsFromFlash: exception", err);

            addNotification(
                NotificationTypeEnum.Error,
                t("tonieboxes.esp32BoxFlashing.esp32flasher.extractingCertificatesFailed"),
                t("tonieboxes.esp32BoxFlashing.esp32flasher.extractingCertificatesFailedDetails", {
                    file: state.filename,
                }) +
                    ": " +
                    String(err?.message ?? err),
                t("tonieboxes.esp32BoxFlashing.title")
            );
        } finally {
            console.info("[ESP32] extractAndStoreCertsFromFlash: finished");
        }
    };

    return {
        state,
        setState,
        currentStep,
        setCurrentStep,
        isSupported,
        httpsActive,
        httpsUrl,
        baudRate,
        baudRates,
        disableButtons,
        certDir,
        isConfirmFlashModalOpen,
        setIsConfirmFlashModalOpen,
        isOverwriteForceConfirmationModalOpen,
        setIsOverwriteForceConfirmationModalOpen,
        extractCertificateErrorMessage,
        isOpenAvailableBoxesModal,
        setIsOpenAvailableBoxesModal,
        fileInputRef,
        handleBaudrateChange,
        openHttpsUrl,
        loadFlashFile,
        readFlash,
        patchFlash,
        resetFlash,
        writeFlash,
        extractAndStoreCertsFromFlash,
        next,
        prev,
        hasAnyLog,
        getAllLogLines,
        clearLog,
    };
};
