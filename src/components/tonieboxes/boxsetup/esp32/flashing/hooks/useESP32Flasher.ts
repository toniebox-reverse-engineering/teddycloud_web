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
    // state
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

    // logic
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
}

export const useESP32Flasher = (useRevvoxFlasher = false): UseESP32FlasherResult => {
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

    const handleBaudrateChange = (value: number) => {
        setBaudRate(value);
    };

    const arrayBufferToBstr = (arrayBuffer: any) => {
        const u8Array = new Uint8Array(arrayBuffer);
        let binaryString = "";
        for (let i = 0; i < u8Array.length; i++) {
            binaryString += String.fromCharCode(u8Array[i]);
        }
        return binaryString;
    };

    // RevvoxFlasher management
    const revvoxFlasherRef = useRef<RevvoxFlasher | null>(null);

    const getRevvoxFlasher = () => {
        if (!revvoxFlasherRef.current) {
            const flasher = new RevvoxFlasher();

            flasher.logDebug = (...args: unknown[]) => {
                console.debug("[RevvoxFlasher]", ...args);
            };
            flasher.logError = (...args: unknown[]) => {
                console.error("[RevvoxFlasher]", ...args);
            };

            revvoxFlasherRef.current = flasher;
        }
        return revvoxFlasherRef.current;
    };

    const disconnectRevvoxFlasher = async () => {
        if (!revvoxFlasherRef.current) {
            return;
        }
        try {
            await revvoxFlasherRef.current.disconnect();
        } catch (err) {
            console.error("Error while disconnecting RevvoxFlasher", err);
        } finally {
            revvoxFlasherRef.current = null;
        }
    };

    const prepareRevvoxFlasher = async () => {
        const flasher = getRevvoxFlasher();
        setState((prev) => ({
            ...prev,
            state: t("tonieboxes.esp32BoxFlashing.esp32flasher.openPort"),
            showFlash: false,
            connected: true,
            actionInProgress: true,
            error: false,
        }));

        await flasher.openPort();
        await flasher.sync();

        setState((prev) => ({
            ...prev,
            state: t("tonieboxes.esp32BoxFlashing.esp32flasher.executingReliabilityCheck"),
            showFlash: false,
            connected: true,
            actionInProgress: true,
            showProgress: true,
            error: false,
        }));

        const reliableConnection = await flasher.testReliability((progress) => {
            setState((prev) => ({
                ...prev,
                progress: progress,
            }));
        });
        if (!reliableConnection) {
            console.log("Error on reliability check");
            throw Error(t("tonieboxes.esp32BoxFlashing.esp32flasher.reliabilityCheckFailed"));
        }

        const stubSet = await flasher.downloadStub();

        if (!stubSet) {
            console.log("Error on uploading stub");
            throw Error(t("tonieboxes.esp32BoxFlashing.esp32flasher.downloadStubFailed"));
        }
        return flasher;
    };

    // fetch cert dir
    useEffect(() => {
        const fetchCertsDir = async () => {
            const response = await api.apiGetTeddyCloudSettingRaw("core.certdir");
            const certDirText = await response.text();
            setCertDir(certDirText);
        };
        fetchCertsDir();
    }, []);

    // web serial support
    useEffect(() => {
        setIsSupported(isWebSerialSupported());
    }, []);

    // https / redirect handling
    useEffect(() => {
        if (window.location.protocol === "https:") {
            setHttpsActive(true);
            return;
        }

        const fetchHttpsPort = async (): Promise<string | undefined> => {
            if (import.meta.env.VITE_APP_TEDDYCLOUD_PORT_HTTPS) {
                return import.meta.env.VITE_APP_TEDDYCLOUD_PORT_HTTPS;
            }
            try {
                const response = await api.apiGetTeddyCloudSettingRaw("core.server.https_web_port");
                return await response.text();
            } catch (error) {
                console.error("Error fetching https port: ", error);
            }
        };

        const fetchHttpPort = async (): Promise<string | undefined> => {
            if (import.meta.env.VITE_APP_TEDDYCLOUD_PORT_HTTP) {
                return import.meta.env.VITE_APP_TEDDYCLOUD_PORT_HTTP;
            }
            try {
                const response = await api.apiGetTeddyCloudSettingRaw("core.server.http_port");
                return await response.text();
            } catch (error) {
                console.error("Error fetching http port: ", error);
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

            setHttpsUrl(currentURL.toString());
        };

        setHttpsActive(false);
        getHttpsUrl();
    }, []);

    // auto-reset path
    useEffect(() => {
        if (state.resetBox && state.patchedFlash) {
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
        if (httpsUrl) {
            window.location.href = httpsUrl;
        }
    };

    // --- low-level flashing logic ---

    const disconnectESPLoader = async (esploader: ESPLoader | null, port: SerialPort | null) => {
        if (!port) {
            return;
        }

        try {
            const transport = (esploader as any)?.transport;
            if (transport && typeof transport.disconnect === "function") {
                await transport.disconnect();
            } else {
                await port.close();
            }
        } catch (err) {
            console.error("Error while closing ESP32 serial connection", err);
        }
    };

    const getPort = async (message: string): Promise<SerialPort | null> => {
        if (state.port) {
            console.log(state.port.getInfo);
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
            port = await navigator.serial.requestPort();
            await port.open({ baudRate: 115200 });
            await port.close();
        } catch (err: any) {
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
            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.invalidSerialPort"),
                error: true,
            }));
            return null;
        }

        console.log("port done");
        setState((prev) => ({
            ...prev,
            port,
        }));
        return port;
    };

    const loadFlashFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) {
            return;
        }
        const file = e.target.files[0];
        if (!file) {
            return;
        }

        setState((prev) => ({
            ...prev,
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

        // --- resetBox: only load patchedFlash from file, no serial needed ---
        if (state.resetBox) {
            reader.onload = async (ev) => {
                const target = ev.target as FileReader | null;
                if (!target) return;

                const arrayBuffer = target.result as ArrayBuffer;

                setState((prev) => ({
                    ...prev,
                    patchedFlash: arrayBuffer,
                    showFlash: true,
                    connected: false,
                    flashName: "from file",
                }));
            };
        }
        // --- RevvoxFlasher branch ---
        else if (useRevvoxFlasher) {
            reader.onload = async (ev) => {
                const target = ev.target as FileReader | null;
                if (!target) {
                    setState((prev) => ({
                        ...prev,
                        actionInProgress: false,
                    }));
                    return;
                }

                const flasher = getRevvoxFlasher();
                let mac = "";

                try {
                    setState((prev) => ({
                        ...prev,
                        state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingReadMac"),
                        showFlash: false,
                        connected: true,
                    }));

                    await flasher.openPort();
                    setState((prev) => ({
                        ...prev,
                        state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingToESP"),
                    }));

                    await flasher.sync();

                    mac = (await flasher.readMac()) || "";
                    setState((prev) => ({
                        ...prev,
                        chipMac: mac,
                        chipType: flasher.current_chip,
                    }));
                } catch (err: any) {
                    console.error(err);
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

                const arrayBuffer = target.result as ArrayBuffer;
                const flashData = new Uint8Array(arrayBuffer);
                const sanitizedName = mac ? `ESP32_${mac.replace(/:/g, "")}` : "ESP32_from_file";
                const blob = new Blob([flashData], { type: "application/octet-stream" });
                const url = URL.createObjectURL(blob);

                await uploadFlashData(flashData, sanitizedName);

                setState((prev) => ({
                    ...prev,
                    patchedFlash: arrayBuffer,
                    showFlash: true,
                    connected: false,
                    flashName: "from file",
                    downloadLink: url,
                }));
            };
        }
        // --- original ESPLoader branch ---
        else {
            reader.onload = async (ev) => {
                const port = await getPort(t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingReadMac"));

                if (port === null || state.connected) {
                    setState((prev) => ({
                        ...prev,
                        actionInProgress: false,
                    }));
                    return;
                }

                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingTo") + ` ${state.port}`,
                    showFlash: false,
                    connected: true,
                }));

                let esploader: ESPLoader | null = null;

                try {
                    const transport = new Transport(port);
                    esploader = new ESPLoader({
                        transport,
                        baudrate: baudRate,
                        romBaudrate: romBaudRate,
                    });
                } catch (err) {
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

                    await esploader.main();

                    const mac = await esploader.chip.readMac(esploader);
                    setState((prev) => ({
                        ...prev,
                        chipMac: mac,
                    }));

                    await disconnectESPLoader(esploader, port);

                    const target = ev.target as FileReader | null;
                    if (!target) {
                        setState((prev) => ({
                            ...prev,
                            actionInProgress: false,
                        }));
                        return;
                    }

                    const arrayBuffer = target.result as ArrayBuffer;
                    const flashData = new Uint8Array(arrayBuffer);
                    const sanitizedName = `ESP32_${mac.replace(/:/g, "")}`;
                    const blob = new Blob([flashData], { type: "application/octet-stream" });
                    const url = URL.createObjectURL(blob);

                    await uploadFlashData(flashData, sanitizedName);

                    setState((prev) => ({
                        ...prev,
                        patchedFlash: arrayBuffer,
                        showFlash: true,
                        connected: false,
                        flashName: "from file",
                        downloadLink: url,
                    }));
                } catch (err) {
                    setState((prev) => ({
                        ...prev,
                        state: t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToCommunicate") + ` ${err}`,
                        connected: false,
                        actionInProgress: false,
                        error: true,
                    }));
                    console.error(err);
                    alert(err);
                    await disconnectESPLoader(esploader, port);
                    return;
                }
            };
        }

        reader.readAsArrayBuffer(file);
        setState((prev) => ({
            ...prev,
            actionInProgress: false,
        }));

        e.target.value = "";
    };

    const readFlash = async () => {
        if (useRevvoxFlasher) {
            const flashSizeKb = ESP32_FLASHSIZE;
            const totalBytes = flashSizeKb * 1024;
            const blockSize = 0x1000;

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
            let flashData = new Uint8Array(totalBytes);

            try {
                const flasher = await prepareRevvoxFlasher();

                mac = (await flasher.readMac()) || "";
                setState((prev) => ({
                    ...prev,
                    chipMac: mac,
                    chipType: flasher.current_chip,
                    flashSize: "" + flashSizeKb,
                }));

                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.readingFlash"),
                    progress: 0,
                }));

                let offset = 0;
                while (offset < totalBytes) {
                    const remaining = totalBytes - offset;
                    const address = 0x00000000;
                    const size = Math.min(blockSize, remaining);
                    const chunk = (await flasher.readFlash(address + offset, size)) as Uint8Array;

                    if (!chunk || chunk.length === 0) {
                        break;
                    }
                    flashData.set(chunk, offset);
                    offset += chunk.length;

                    const prog = (100 * offset) / totalBytes;
                    setState((prev) => ({
                        ...prev,
                        progress: prog,
                    }));
                }

                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.readingFinished"),
                    progress: 100,
                    originalFlash: flashData,
                    connected: false,
                    showProgress: false,
                }));

                const allZero = flashData.every((b) => b === 0x00);
                const allFF = flashData.every((b) => b === 0xff);
                if (allZero || allFF) {
                    throw new Error(t("tonieboxes.esp32BoxFlashing.esp32flasher.invalidFlashData"));
                }

                const sanitizedName = `ESP32_${mac.replace(/:/g, "")}`;
                const blob = new Blob([flashData.buffer as ArrayBuffer], { type: "application/octet-stream" });
                const url = URL.createObjectURL(blob);

                setState((prev) => ({
                    ...prev,
                    downloadLink: url,
                }));

                await uploadFlashData(flashData, sanitizedName);
            } catch (err: any) {
                console.error(err);
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

        flashData = new Uint8Array(1024);

        const port = await getPort(t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingReadFlash"));
        if (port === null || state.connected) {
            return;
        }

        setState((prev) => ({
            ...prev,
            state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingTo") + ` ${port.getInfo()}`,
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

        try {
            const transport = new Transport(port);
            esploader = new ESPLoader({
                transport,
                baudrate: baudRate,
                romBaudrate: romBaudRate,
            });
        } catch (err) {
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
            await esploader.main();
            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connected"),
            }));

            mac = await esploader.chip.readMac(esploader);
            setState((prev) => ({
                ...prev,
                chipMac: mac,
            }));

            const type = await esploader.chip.getChipDescription(esploader);
            setState((prev) => ({
                ...prev,
                chipType: type,
            }));

            const flash_id = await esploader.readFlashId();
            setState((prev) => ({
                ...prev,
                flashId: "" + flash_id,
                flashManuf: "" + (flash_id & 0xff),
                flashDevice: "" + ((flash_id >> 8) & 0xff),
            }));

            const flash_size = await esploader.getFlashSize();
            setState((prev) => ({
                ...prev,
                flashSize: "" + flash_size,
            }));

            if (flash_size != ESP32_FLASHSIZE) {
                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.flashSizeError", {
                        actual_size: "" + flash_size,
                        expected_size: ESP32_FLASHSIZE,
                    }),
                    connected: false,
                    actionInProgress: false,
                    error: true,
                }));
                await disconnectESPLoader(esploader, port);
                return;
            }

            if (!type.toUpperCase().startsWith(ESP32_CHIPNAME.toUpperCase())) {
                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.chipTypeError", {
                        actual_type: "" + type,
                        expected_type: ESP32_CHIPNAME,
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

            flashData = await esploader.readFlash(0, flash_size * 1024, (packet, progress, totalSize) => {
                const prog = (100 * progress) / totalSize;
                setState((prev) => ({
                    ...prev,
                    progress: prog,
                }));
            });

            await disconnectESPLoader(esploader, port);

            const allZero = flashData.every((b) => b === 0x00);
            const allFF = flashData.every((b) => b === 0xff);
            if (allZero || allFF) {
                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.invalidFlashData"),
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
            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToCommunicate") + ` ${err}`,
                connected: false,
                actionInProgress: false,
                error: true,
            }));
            console.error(err);
            alert(err);
            await disconnectESPLoader(esploader, port);
            return;
        }

        const sanitizedName = `ESP32_${mac.replace(/:/g, "")}`;
        const blob = new Blob([(flashData as Uint8Array).buffer as ArrayBuffer], {
            type: "application/octet-stream",
        });
        const url = URL.createObjectURL(blob);

        setState((prev) => ({
            ...prev,
            downloadLink: url,
            showProgress: false,
        }));

        await uploadFlashData(flashData, sanitizedName);
    };

    const uploadFlashData = async (flashData: Uint8Array, sanitizedName: string) => {
        try {
            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.uploading"),
                error: false,
            }));

            const formData = new FormData();
            formData.append(sanitizedName, new Blob([(flashData as Uint8Array).buffer as ArrayBuffer]), sanitizedName);

            const response = await api.apiPostTeddyCloudFormDataRaw(`/api/esp32/uploadFirmware`, formData);

            if (response.ok && response.status === 200) {
                const filename = await response.text();
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
                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.uploadFailed"),
                    actionInProgress: false,
                    error: true,
                }));
            }
        } catch (err) {
            console.error("There was an error when uploading!", err);
            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.uploadFailed"),
                actionInProgress: false,
                error: true,
            }));
        }
    };

    const patchFlash = async () => {
        if ((state.wifi_ssid && !state.wifi_pass) || (!state.wifi_ssid && state.wifi_pass)) {
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

        const response = await api.apiGetTeddyCloudApiRaw(
            `/api/esp32/patchFirmware?filename=${state.filename}` +
                (state.previousHostname && state.flagPreviousHostname
                    ? `&hostname_old=${encodeURIComponent(state.previousHostname)}`
                    : "") +
                `&hostname=${encodeURIComponent(state.hostname)}` +
                (state.wifi_ssid && state.wifi_pass
                    ? `&wifi_ssid=${encodeURIComponent(state.wifi_ssid)}&wifi_pass=${encodeURIComponent(
                          state.wifi_pass
                      )}`
                    : "")
        );

        setState((prev) => ({
            ...prev,
            showProgress: false,
            showFlash: false,
            state: t("tonieboxes.esp32BoxFlashing.esp32flasher.patchingFlashImage"),
        }));

        if (response.ok && response.status === 200) {
            const arrayBuffer = await response.arrayBuffer();
            setState((prev) => ({
                ...prev,
                patchedFlash: arrayBuffer,
                showFlash: true,
                flashName: "patched",
            }));

            const blob2 = new Blob([arrayBuffer], { type: "application/octet-stream" });
            const url2 = URL.createObjectURL(blob2);

            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.patchingSuccessful", {
                    size: (arrayBuffer.byteLength / 1024 / 1024).toFixed(0),
                }),
                downloadLinkPatched: url2,
            }));
            next();
        } else {
            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.patchingFailed"),
                error: true,
            }));
        }
        setState((prev) => ({
            ...prev,
            actionInProgress: false,
        }));
    };

    const resetFlash = async () => {
        setCurrentStep(2);

        // --- RevvoxFlasher branch ---
        if (useRevvoxFlasher) {
            if (!state.patchedFlash) {
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
                progress: 0,
            }));

            try {
                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingWriteFlash"),
                }));

                const flasher = await prepareRevvoxFlasher();

                const mac = await flasher.readMac();
                if (mac) {
                    setState((prev) => ({
                        ...prev,
                        chipMac: mac,
                        chipType: flasher.current_chip,
                    }));
                }

                const data = new Uint8Array(state.patchedFlash as ArrayBuffer);
                const totalSize = data.length;

                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.writingFlash", {
                        size: (totalSize / 1024 / 1024).toFixed(0),
                    }),
                    progress: 0,
                }));

                await flasher.writeFlash(0, data, (offset, total) => {
                    const progress = (offset / total) * 100;
                    setState((prev) => ({
                        ...prev,
                        progress: progress,
                    }));
                });

                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.writingFinished"),
                    connected: false,
                    actionInProgress: false,
                    progress: 100,
                }));

                setCurrentStep(3);
            } catch (err: any) {
                console.error(err);
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
                await disconnectRevvoxFlasher();
            }

            return;
        }

        // --- original ESPLoader branch ---
        const port = await getPort(t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingWriteFlash"));
        if (port === null || state.connected) {
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
            const transport = new Transport(port);
            esploader = new ESPLoader({
                transport,
                baudrate: baudRate,
                romBaudrate: romBaudRate,
            });
        } catch (err) {
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
            await esploader.main();
            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connected"),
                progress: 0,
                showProgress: true,
            }));

            const mac = await esploader.chip.readMac(esploader);
            setState((prev) => ({
                ...prev,
                chipMac: mac,
            }));

            const type = await esploader.chip.getChipDescription(esploader);
            setState((prev) => ({
                ...prev,
                chipType: type,
            }));

            const flash_id = await esploader.readFlashId();
            setState((prev) => ({
                ...prev,
                flashId: "" + flash_id,
                flashManuf: "" + (flash_id & 0xff),
                flashDevice: "" + ((flash_id >> 8) & 0xff),
            }));

            const flash_size = await esploader.getFlashSize();
            setState((prev) => ({
                ...prev,
                flashSize: "" + flash_size,
            }));

            if (flash_size != ESP32_FLASHSIZE) {
                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.flashSizeError", {
                        actual_size: "" + flash_size,
                        expected_size: ESP32_FLASHSIZE,
                    }),
                    connected: false,
                    actionInProgress: false,
                    error: true,
                }));
                await disconnectESPLoader(esploader, port);
                return;
            }

            if (!type.toUpperCase().startsWith(ESP32_CHIPNAME.toUpperCase())) {
                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.chipTypeError", {
                        actual_type: "" + type,
                        expected_type: ESP32_CHIPNAME,
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
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.preparingFlash", {
                    size: (state.patchedFlash.byteLength / 1024 / 1024).toFixed(0),
                }),
            }));

            const fileArray: { data: string; address: number }[] = [];
            fileArray.push({ data: arrayBufferToBstr(state.patchedFlash), address: 0 });
            const opts = {
                fileArray,
                flashSize: "keep",
                flashMode: "keep",
                flashFreq: "keep",
                eraseAll: false,
                compress: true,
                reportProgress: (fileIndex: any, written: number, total: number) => {
                    const prog = (100 * written) / total;
                    setState((prev) => ({
                        ...prev,
                        progress: prog,
                    }));
                },
            };

            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.writingFlash", {
                    size: (state.patchedFlash.byteLength / 1024 / 1024).toFixed(0),
                }),
            }));

            await esploader.writeFlash(opts);

            await disconnectESPLoader(esploader, port);
            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.writingFinished"),
                connected: false,
                actionInProgress: false,
            }));

            setCurrentStep(3);
        } catch (err) {
            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToCommunicate") + ` ${err}`,
                connected: false,
                actionInProgress: false,
                error: true,
            }));
            console.error(err);
            alert(err);
            await disconnectESPLoader(esploader, port);
            return;
        }
    };

    const writeFlash = async () => {
        // --- RevvoxFlasher branch ---
        if (useRevvoxFlasher) {
            if (!state.patchedFlash) {
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
                progress: 0,
            }));

            try {
                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingWriteFlash"),
                }));

                const flasher = await prepareRevvoxFlasher();

                const mac = await flasher.readMac();
                if (mac) {
                    setState((prev) => ({
                        ...prev,
                        chipMac: mac,
                        chipType: flasher.current_chip,
                    }));
                }

                const data = new Uint8Array(state.patchedFlash as ArrayBuffer);
                const totalSize = data.length;

                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.writingFlash", {
                        size: (totalSize / 1024 / 1024).toFixed(0),
                    }),
                    progress: 0,
                }));

                await flasher.writeFlash(0, data, (offset, total) => {
                    const progress = (offset / total) * 100;
                    setState((prev) => ({
                        ...prev,
                        progress: progress,
                    }));
                });

                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.writingFinished"),
                    connected: false,
                    actionInProgress: false,
                    proceed: true,
                    progress: 100,
                }));
            } catch (err: any) {
                console.error(err);
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
                await disconnectRevvoxFlasher();
            }

            return;
        }

        // --- original ESPLoader branch ---
        const port = await getPort(t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingWriteFlash"));
        if (port === null || state.connected) {
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
            const transport = new Transport(port);
            esploader = new ESPLoader({
                transport,
                baudrate: baudRate,
                romBaudrate: romBaudRate,
            });
        } catch (err) {
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
            await esploader.main();
            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connected"),
                progress: 0,
                showProgress: true,
            }));

            const mac = await esploader.chip.readMac(esploader);
            setState((prev) => ({
                ...prev,
                chipMac: mac,
            }));

            const type = await esploader.chip.getChipDescription(esploader);
            setState((prev) => ({
                ...prev,
                chipType: type,
            }));

            const flash_id = await esploader.readFlashId();
            setState((prev) => ({
                ...prev,
                flashId: "" + flash_id,
                flashManuf: "" + (flash_id & 0xff),
                flashDevice: "" + ((flash_id >> 8) & 0xff),
            }));

            const flash_size = await esploader.getFlashSize();
            setState((prev) => ({
                ...prev,
                flashSize: "" + flash_size,
            }));

            if (flash_size != ESP32_FLASHSIZE) {
                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.flashSizeError", {
                        actual_size: "" + flash_size,
                        expected_size: ESP32_FLASHSIZE,
                    }),
                    connected: false,
                    actionInProgress: false,
                    error: true,
                }));
                await disconnectESPLoader(esploader, port);
                return;
            }

            if (!type.toUpperCase().startsWith(ESP32_CHIPNAME.toUpperCase())) {
                setState((prev) => ({
                    ...prev,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.chipTypeError", {
                        actual_type: "" + type,
                        expected_type: ESP32_CHIPNAME,
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
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.preparingFlash", {
                    size: (state.patchedFlash.byteLength / 1024 / 1024).toFixed(0),
                }),
            }));

            const fileArray: { data: string; address: number }[] = [];
            fileArray.push({ data: arrayBufferToBstr(state.patchedFlash), address: 0 });
            const opts = {
                fileArray,
                flashSize: "keep",
                flashMode: "keep",
                flashFreq: "keep",
                eraseAll: false,
                compress: true,
                reportProgress: (fileIndex: any, written: number, total: number) => {
                    const prog = (100 * written) / total;
                    setState((prev) => ({
                        ...prev,
                        progress: prog,
                    }));
                },
            };

            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.writingFlash", {
                    size: (state.patchedFlash.byteLength / 1024 / 1024).toFixed(0),
                }),
            }));

            await esploader.writeFlash(opts);

            await disconnectESPLoader(esploader, port);
            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.writingFinished"),
                connected: false,
                actionInProgress: false,
                proceed: true,
            }));
        } catch (err) {
            setState((prev) => ({
                ...prev,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToCommunicate") + ` ${err}`,
                connected: false,
                actionInProgress: false,
                error: true,
            }));
            console.error(err);
            alert(err);
            await disconnectESPLoader(esploader, port);
            return;
        }
    };

    const extractAndStoreCertsFromFlash = async (force?: boolean) => {
        const key = "extractStoreCerts";
        addLoadingNotification(
            key,
            t("tonieboxes.esp32BoxFlashing.processing"),
            t("tonieboxes.esp32BoxFlashing.esp32flasher.extractingCertificates")
        );
        if (force) {
            setIsOverwriteForceConfirmationModalOpen(false);
        }
        try {
            const response = await api.apiPostTeddyCloudRaw(
                `/api/esp32/extractCerts?filename=${state.filename}` + (force ? "&overwrite=true" : "")
            );
            closeLoadingNotification(key);
            if (response.ok && response.status === 200) {
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
                addNotification(
                    NotificationTypeEnum.Error,
                    t("tonieboxes.esp32BoxFlashing.esp32flasher.extractingCertificatesFailed"),
                    t("tonieboxes.esp32BoxFlashing.esp32flasher.extractingCertificatesFailedDetails", {
                        file: state.filename,
                    }) +
                        ": " +
                        (await response.text()),
                    t("tonieboxes.esp32BoxFlashing.title")
                );
            }
        } catch (err: any) {
            addNotification(
                NotificationTypeEnum.Error,
                t("tonieboxes.esp32BoxFlashing.esp32flasher.extractingCertificatesFailed"),
                t("tonieboxes.esp32BoxFlashing.esp32flasher.extractingCertificatesFailedDetails", {
                    file: state.filename,
                }) +
                    ": " +
                    err,
                t("tonieboxes.esp32BoxFlashing.title")
            );
        }
    };

    const next = () => {
        setState((prev) => ({
            ...prev,
            proceed: false,
        }));
        setCurrentStep((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const prev = () => {
        setState((prevState) => ({
            ...prevState,
            state: "",
            showProgress: false,
            error: false,
        }));
        setCurrentStep((prev) => prev - 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
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
    };
};
