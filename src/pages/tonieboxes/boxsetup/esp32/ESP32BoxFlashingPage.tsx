import { useEffect, useState, useRef, SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import { JSX } from "react/jsx-runtime";
import { ESPLoader, Transport } from "esptool-js";
import i18n from "../../../../i18n";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Button,
    Checkbox,
    Col,
    Collapse,
    Divider,
    Form,
    Input,
    Progress,
    Row,
    Select,
    Steps,
    Tooltip,
    Typography,
} from "antd";
import {
    CodeOutlined,
    DownloadOutlined,
    EyeOutlined,
    FileAddOutlined,
    LeftOutlined,
    QuestionCircleOutlined,
    RightOutlined,
    RollbackOutlined,
    SafetyCertificateOutlined,
    SyncOutlined,
    UploadOutlined,
} from "@ant-design/icons";

import { BoxVersionsEnum } from "../../../../types/tonieboxTypes";

import { TeddyCloudApi } from "../../../../api";
import { defaultAPIConfig } from "../../../../config/defaultApiConfig";

import BreadcrumbWrapper, { StyledContent, StyledLayout, StyledSider } from "../../../../components/StyledComponents";
import { TonieboxesSubNav } from "../../../../components/tonieboxes/TonieboxesSubNav";
import ConfirmationDialog from "../../../../components/utils/ConfirmationDialog";
import AvailableBoxesModal, { connectESP32Explanation } from "../../../../components/tonieboxes/boxSetup/CommonContent";
import DotAnimation from "../../../../components/utils/DotAnimation";
import { isWebSerialSupported } from "../../../../utils/checkWebSerialSupport";
import { useTeddyCloud } from "../../../../TeddyCloudContext";
import { NotificationTypeEnum } from "../../../../types/teddyCloudNotificationTypes";

const api = new TeddyCloudApi(defaultAPIConfig());

interface ESP32Flasher {
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

const { Paragraph, Text } = Typography;
const { Step } = Steps;
const { Option } = Select;

export const ESP32BoxFlashingPage = () => {
    const { t } = useTranslation();
    const { setFetchCloudStatus, addNotification, addLoadingNotification, closeLoadingNotification } = useTeddyCloud();
    const navigate = useNavigate();
    const currentLanguage = i18n.language;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [httpsActive, setHttpsActive] = useState(false);
    const [httpsUrl, setHttpsUrl] = useState<string>("");
    const [disableButtons, setDisableButtons] = useState<boolean>(false);

    const [isConfirmFlashModalOpen, setIsConfirmFlashModalOpen] = useState<boolean>(false);
    const [isOverwriteForceConfirmationModalOpen, setIsOverwriteForceConfirmationModalOpen] = useState<boolean>(false);
    const [certDir, setCertDir] = useState<string>("certs/client");

    const [extractCertificateErrorMessage, setExtractCertificateErrorMessage] = useState<string>("");

    const [currentStep, setCurrent] = useState(0);

    const [isOpenAvailableBoxesModal, setIsOpenAvailableBoxesModal] = useState(false);

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

    const handleBaurateChange = (value: SetStateAction<number>) => {
        setBaudRate(value);
    };

    function arrayBufferToBstr(arrayBuffer: any) {
        const u8Array = new Uint8Array(arrayBuffer);
        let binaryString = "";
        for (let i = 0; i < u8Array.length; i++) {
            binaryString += String.fromCharCode(u8Array[i]);
        }
        return binaryString;
    }

    useEffect(() => {
        const fetchCertsDir = async () => {
            const response = await api.apiGetTeddyCloudSettingRaw("core.certdir");
            const certDir = await response.text();
            setCertDir(certDir);
        };
        fetchCertsDir();
    }, []);

    useEffect(() => {
        setIsSupported(isWebSerialSupported());
    }, []);

    useEffect(() => {
        if (window.location.protocol !== "https:") {
            setHttpsActive(false);
            const fetchHttpsPort = async (): Promise<string | undefined> => {
                // this is for develop only as the https port is defined separatly
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
                // this is for develop only as the http port is defined separatly
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

            getHttpsUrl();
        } else {
            setHttpsActive(true);
        }
    }, []);

    useEffect(() => {
        if (state.resetBox && state.patchedFlash) {
            resetFlash();
        }
    }, [state.resetBox, state.patchedFlash]);

    useEffect(() => {
        const getContentForStep = () => {
            switch (currentStep) {
                case 0:
                    return contentStep0;
                case 1:
                    return contentStep1;
                case 2:
                    return contentStep2;
                case 3:
                    if (state.resetBox) {
                        return contentStep3resetCase;
                    }
                    return contentStep3;
                default:
                    return <div></div>;
            }
        };

        updateContent(currentStep, getContentForStep());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state, currentLanguage]);

    useEffect(() => {
        if (!state.resetBox && state.proceed) {
            next();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.proceed]);

    useEffect(() => {
        setDisableButtons(state.actionInProgress);
    }, [state.actionInProgress]);

    const openHttpsUrl = () => {
        if (httpsUrl) {
            window.location.href = httpsUrl;
        }
    };

    // flash functionality
    const getPort = async (message: string) => {
        if (state.port) {
            console.log(state.port.getInfo);
            return state.port;
        }
        setState((prevState) => ({
            ...prevState,
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
        } catch (err) {
            if (err === "NetworkError") {
                setState((prevState) => ({
                    ...prevState,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.portOpenFailedInUse"),
                    error: true,
                }));
                alert(t("tonieboxes.esp32BoxFlashing.esp32flasher.portOpenFailedInUse"));
            } else if (err === "NotFoundError") {
                setState((prevState) => ({
                    ...prevState,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.noPortAvailable"),
                    error: true,
                }));
            } else {
                setState((prevState) => ({
                    ...prevState,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.error") + err,
                    error: true,
                }));
                alert(t("tonieboxes.esp32BoxFlashing.esp32flasher.error") + ` ${err}`);
            }
            return null;
        }

        if (!port) {
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.invalidSerialPort"),
                error: true,
            }));
            return null;
        }

        console.log("port done");
        setState((prevState) => ({
            ...prevState,
            port: port,
        }));
        return port;
    };

    const loadFlashFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log("loadFlashFile");
        if (!e.target.files) {
            return;
        }
        const file = e.target.files[0];

        if (!file) {
            return;
        }

        setState((prevState) => ({
            ...prevState,
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

        if (state.resetBox) {
            console.log("Read file '" + file + "' for reset");
            reader.onload = async (e) => {
                console.log("Loading file for reset");
                const arrayBuffer = e.target?.result as ArrayBuffer;
                if (e.target) {
                    setState((prevState) => ({
                        ...prevState,
                        patchedFlash: e.target?.result,
                        showFlash: true,
                        connected: false,
                        flashName: "from file",
                    }));
                }
                console.log("Load file done");
            };
        } else {
            console.log("Read file '" + file + "'");

            reader.onload = async (e) => {
                console.log("Connecting to ESP32");
                const port = await getPort(t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingReadMac"));

                if (port === null || state.connected) {
                    setState((prevState) => ({
                        ...prevState,
                        actionInProgress: false,
                    }));
                    return;
                }

                setState((prevState) => ({
                    ...prevState,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingTo") + ` ${state.port}`,
                    showFlash: false,
                    connected: true,
                }));

                let esploader: ESPLoader | null = null;

                try {
                    const transport = new Transport(port);
                    esploader = new ESPLoader({
                        transport: transport,
                        baudrate: baudRate,
                        romBaudrate: romBaudRate,
                    });
                } catch (err) {
                    setState((prevState) => ({
                        ...prevState,
                        state: t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToConnect") + ` ${err}`,
                        connected: false,
                        actionInProgress: false,
                        error: true,
                    }));

                    alert(err);
                    await port.close();
                    return;
                }

                try {
                    setState((prevState) => ({
                        ...prevState,
                        state: t("tonieboxes.esp32BoxFlashing.esp32flasher.retrievingMac"),
                        actionInProgress: true,
                    }));

                    await esploader.main();

                    let mac = await esploader.chip.readMac(esploader);
                    setState((prevState) => ({
                        ...prevState,
                        chipMac: mac,
                    }));

                    console.log("Chip MAC: " + mac);
                    await port.close();

                    const arrayBuffer = e.target?.result as ArrayBuffer;
                    const flashData = new Uint8Array(arrayBuffer);
                    const sanitizedName = `ESP32_${mac.replace(/:/g, "")}`;
                    const blob = new Blob([flashData], { type: "application/octet-stream" });
                    const url = URL.createObjectURL(blob);

                    await uploadFlashData(flashData, sanitizedName);

                    if (e.target) {
                        setState((prevState) => ({
                            ...prevState,
                            patchedFlash: e.target?.result,
                            showFlash: true,
                            connected: false,
                            flashName: "from file",
                            downloadLink: url,
                        }));
                    }
                    console.log("Done");
                } catch (err) {
                    setState((prevState) => ({
                        ...prevState,
                        state: t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToCommunicate") + ` ${err}`,
                        connected: false,
                        actionInProgress: false,
                        error: true,
                    }));
                    console.error(err);
                    alert(err);
                    await port.close();
                    return;
                }
            };
        }
        reader.readAsArrayBuffer(file);
        setState((prevState) => ({
            ...prevState,
            actionInProgress: false,
        }));

        e.target.value = "";
    };

    const readFlash = async () => {
        let esploader: ESPLoader | null = null;
        let flashData: Uint8Array | null = null;
        let mac = "";

        flashData = new Uint8Array(1024);

        const port = await getPort(t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingReadFlash"));

        if (port === null || state.connected) {
            return;
        }

        setState((prevState) => ({
            ...prevState,
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
                transport: transport,
                baudrate: baudRate,
                romBaudrate: romBaudRate,
            });
        } catch (err) {
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToConnect") + ` ${err}`,
                connected: false,
                actionInProgress: false,
                error: true,
            }));
            alert(err);
            await port.close();
            return;
        }

        try {
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingToESP"),
            }));
            await esploader.main();
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connected"),
            }));

            mac = await esploader.chip.readMac(esploader);
            setState((prevState) => ({
                ...prevState,
                chipMac: mac,
            }));

            console.log("Chip MAC: " + mac);

            const type = await esploader.chip.getChipDescription(esploader);
            setState((prevState) => ({
                ...prevState,
                chipType: type,
            }));

            let flash_id = await esploader.readFlashId();
            /* maybe parse from https://github.com/jhcloos/flashrom/blob/master/flashchips.h */
            setState((prevState) => ({
                ...prevState,
                flashId: "" + flash_id,
                flashManuf: "" + (flash_id & 0xff),
                flashDevice: "" + ((flash_id >> 8) & 0xff),
            }));

            let flash_size = await esploader.getFlashSize();
            setState((prevState) => ({
                ...prevState,
                flashSize: "" + flash_size,
            }));

            if (flash_size < 0 || flash_size > 16384) {
                setState((prevState) => ({
                    ...prevState,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.flashSizeError"),
                    connected: false,
                    actionInProgress: false,
                    error: true,
                }));
                await port.close();
                return;
            }
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.readingFlash"),
                showProgress: true,
                progress: 0,
            }));

            flashData = await esploader.readFlash(0, flash_size * 1024, (packet, progress, totalSize) => {
                const prog = (100 * progress) / totalSize;
                setState((prevState) => ({
                    ...prevState,
                    progress: prog,
                }));
            });

            await port.close();
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.readingFinished"),
                progress: 100,
                originalFlash: flashData,
                connected: false,
            }));
        } catch (err) {
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToCommunicate") + ` ${err}`,
                connected: false,
                actionInProgress: false,
                error: true,
            }));
            console.error(err);
            alert(err);
            await port.close();
            return;
        }

        const sanitizedName = `ESP32_${mac.replace(/:/g, "")}`;

        const blob = new Blob([flashData], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);

        setState((prevState) => ({
            ...prevState,
            downloadLink: url,
            showProgress: false,
        }));

        await uploadFlashData(flashData, sanitizedName);
        console.log("Done");
    };

    const uploadFlashData = async (flashData: Uint8Array, sanitizedName: string) => {
        try {
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.uploading"),
                error: false,
            }));

            const formData = new FormData();
            formData.append(sanitizedName, new Blob([flashData]), sanitizedName);

            const response = await api.apiPostTeddyCloudFormDataRaw(`/api/esp32/uploadFirmware`, formData);

            if (response.ok && response.status === 200) {
                const filename = await response.text();
                setState((prevState) => ({
                    ...prevState,
                    showDownload: true,
                    filename: filename,
                    state:
                        t("tonieboxes.esp32BoxFlashing.esp32flasher.uploadSuccessful") +
                        ` ${filename}` +
                        t("tonieboxes.esp32BoxFlashing.esp32flasher.readyToProceed"),
                    proceed: true,
                    actionInProgress: false,
                }));
            } else {
                setState((prevState) => ({
                    ...prevState,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.uploadFailed"),
                    actionInProgress: false,
                    error: true,
                }));
            }
        } catch (err) {
            console.error("There was an error when uploading!", err);
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.uploadFailed"),
                actionInProgress: false,
                error: true,
            }));
        }
    };

    const patchFlash = async () => {
        if ((state.wifi_ssid && !state.wifi_pass) || (!state.wifi_ssid && state.wifi_pass)) {
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.wifiCredentialsIncomplete"),
                showStatus: true,
                warningTextWifi: t("tonieboxes.esp32BoxFlashing.esp32flasher.wifiCredentialsIncomplete"),
                error: true,
            }));
            return;
        }

        setState((prevState) => ({
            ...prevState,
            actionInProgress: true,
        }));

        setState((prevState) => ({
            ...prevState,
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

        setState((prevState) => ({
            ...prevState,
            showProgress: false,
            showFlash: false,
            state: t("tonieboxes.esp32BoxFlashing.esp32flasher.patchingFlashImage"),
        }));

        if (response.ok && response.status === 200) {
            const arrayBuffer = await response.arrayBuffer();
            setState((prevState) => ({
                ...prevState,
                patchedFlash: arrayBuffer,
                showFlash: true,
                flashName: "patched",
            }));

            const blob2 = new Blob([arrayBuffer], { type: "application/octet-stream" });
            const url2 = URL.createObjectURL(blob2);

            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.patchingSuccessful", {
                    size: (arrayBuffer.byteLength / 1024 / 1024).toFixed(0),
                }),
                downloadLinkPatched: url2,
            }));
            next();
        } else {
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.patchingFailed"),
                error: true,
            }));
        }
        setState((prevState) => ({
            ...prevState,
            actionInProgress: false,
        }));
    };

    const resetFlash = async () => {
        setCurrent(2);

        const port = await getPort(t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingWriteFlash"));

        if (port === null || state.connected) {
            return;
        }

        setState((prevState) => ({
            ...prevState,
            actionInProgress: true,
            error: false,
        }));

        setState((prevState) => ({
            ...prevState,
            state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingTo") + ` ${port.getInfo()}`,
            connected: true,
        }));

        let esploader: ESPLoader | null = null;

        try {
            const transport = new Transport(port);
            esploader = new ESPLoader({
                transport: transport,
                baudrate: baudRate,
                romBaudrate: romBaudRate,
            });
        } catch (err) {
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToConnect") + ` ${err}`,
                connected: false,
                actionInProgress: false,
                error: true,
            }));
            alert(err);
            await port.close();
            return;
        }

        try {
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingToESP"),
            }));
            await esploader.main();
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connected"),
                progress: 0,
                showProgress: true,
            }));

            let mac = await esploader.chip.readMac(esploader);
            setState((prevState) => ({
                ...prevState,
                chipMac: mac,
            }));
            console.log("Chip MAC: " + mac);

            const type = await esploader.chip.getChipDescription(esploader);
            setState((prevState) => ({
                ...prevState,
                chipType: type,
            }));

            let flash_id = await esploader.readFlashId();
            /* maybe parse from https://github.com/jhcloos/flashrom/blob/master/flashchips.h */
            setState((prevState) => ({
                ...prevState,
                flashId: "" + flash_id,
                flashManuf: "" + (flash_id & 0xff),
                flashDevice: "" + ((flash_id >> 8) & 0xff),
            }));

            let flash_size = await esploader.getFlashSize();
            setState((prevState) => ({
                ...prevState,
                flashSize: "" + flash_size,
            }));

            if (flash_size < 0 || flash_size > 16384) {
                setState((prevState) => ({
                    ...prevState,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.flashSizeError"),
                    connected: false,
                    actionInProgress: false,
                    error: true,
                }));
                await port.close();
                return;
            }
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.preparingFlash", {
                    size: (state.patchedFlash.byteLength / 1024 / 1024).toFixed(0),
                }),
            }));

            let fileArray = [];
            fileArray.push({ data: arrayBufferToBstr(state.patchedFlash), address: 0 });
            let opts = {
                fileArray: fileArray,
                flashSize: "keep",
                flashMode: "keep",
                flashFreq: "keep",
                eraseAll: false,
                compress: true,
                reportProgress: (fileIndex: any, written: number, total: number) => {
                    const prog = (100 * written) / total;
                    setState((prevState) => ({
                        ...prevState,
                        progress: prog,
                    }));
                },
            };

            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.writingFlash", {
                    size: (state.patchedFlash.byteLength / 1024 / 1024).toFixed(0),
                }),
            }));

            await esploader.writeFlash(opts);

            await port.close();
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.writingFinished"),
                connected: false,
                actionInProgress: false,
            }));

            setCurrent(3);
        } catch (err) {
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToCommunicate") + ` ${err}`,
                connected: false,
                actionInProgress: false,
                error: true,
            }));
            console.error(err);
            alert(err);
            await port.close();
            return;
        }
    };

    const writeFlash = async () => {
        const port = await getPort(t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingWriteFlash"));

        if (port === null || state.connected) {
            return;
        }

        setState((prevState) => ({
            ...prevState,
            actionInProgress: true,
            error: false,
        }));

        setState((prevState) => ({
            ...prevState,
            state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingTo") + ` ${port.getInfo()}`,
            connected: true,
        }));

        let esploader: ESPLoader | null = null;

        try {
            const transport = new Transport(port);
            esploader = new ESPLoader({
                transport: transport,
                baudrate: baudRate,
                romBaudrate: romBaudRate,
            });
        } catch (err) {
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToConnect") + ` ${err}`,
                connected: false,
                actionInProgress: false,
                error: true,
            }));
            alert(err);
            await port.close();
            return;
        }

        try {
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingToESP"),
            }));
            await esploader.main();
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.connected"),
                progress: 0,
                showProgress: true,
            }));

            let mac = await esploader.chip.readMac(esploader);
            setState((prevState) => ({
                ...prevState,
                chipMac: mac,
            }));
            console.log("Chip MAC: " + mac);

            const type = await esploader.chip.getChipDescription(esploader);
            setState((prevState) => ({
                ...prevState,
                chipType: type,
            }));

            let flash_id = await esploader.readFlashId();
            /* maybe parse from https://github.com/jhcloos/flashrom/blob/master/flashchips.h */
            setState((prevState) => ({
                ...prevState,
                flashId: "" + flash_id,
                flashManuf: "" + (flash_id & 0xff),
                flashDevice: "" + ((flash_id >> 8) & 0xff),
            }));

            let flash_size = await esploader.getFlashSize();
            setState((prevState) => ({
                ...prevState,
                flashSize: "" + flash_size,
            }));

            if (flash_size < 0 || flash_size > 16384) {
                setState((prevState) => ({
                    ...prevState,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.flashSizeError"),
                    connected: false,
                    actionInProgress: false,
                    error: true,
                }));
                await port.close();
                return;
            }
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.preparingFlash", {
                    size: (state.patchedFlash.byteLength / 1024 / 1024).toFixed(0),
                }),
            }));

            let fileArray = [];
            fileArray.push({ data: arrayBufferToBstr(state.patchedFlash), address: 0 });
            let opts = {
                fileArray: fileArray,
                flashSize: "keep",
                flashMode: "keep",
                flashFreq: "keep",
                eraseAll: false,
                compress: true,
                reportProgress: (fileIndex: any, written: number, total: number) => {
                    const prog = (100 * written) / total;
                    setState((prevState) => ({
                        ...prevState,
                        progress: prog,
                    }));
                },
            };

            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.writingFlash", {
                    size: (state.patchedFlash.byteLength / 1024 / 1024).toFixed(0),
                }),
            }));

            await esploader.writeFlash(opts);

            await port.close();
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.writingFinished"),
                connected: false,
                actionInProgress: false,
                proceed: true,
            }));
        } catch (err) {
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToCommunicate") + ` ${err}`,
                connected: false,
                actionInProgress: false,
                error: true,
            }));
            console.error(err);
            alert(err);
            await port.close();
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

    // step content functionality
    const steps = [
        {
            title: t("tonieboxes.esp32BoxFlashing.esp32flasher.titleReadESP32ImportFlash"),
        },
        {
            title: t("tonieboxes.esp32BoxFlashing.esp32flasher.titlePatchFlash"),
        },
        {
            title: t("tonieboxes.esp32BoxFlashing.esp32flasher.titleFlashESP32"),
        },
        {
            title: t("tonieboxes.esp32BoxFlashing.esp32flasher.titleESP32FirmwareFlashed"),
        },
    ];

    const contentProgress = (
        <>
            {state.showProgress && (
                <div>
                    <div>
                        <Progress percent={state.progress || 0} format={(percent) => `${(percent ?? 0).toFixed(2)}%`} />
                    </div>
                </div>
            )}
        </>
    );

    const contentRaw = (
        <>
            {(state.chipType || state.chipMac) && (
                <div>
                    <Divider>{t("tonieboxes.esp32BoxFlashing.esp32flasher.infoTable")}</Divider>
                    <table className="info-table">
                        <tbody>
                            {state.chipType && (
                                <tr>
                                    <td>{t("tonieboxes.esp32BoxFlashing.esp32flasher.chipType")}</td>
                                    <td>{state.chipType}</td>
                                </tr>
                            )}
                            {state.chipMac && (
                                <tr>
                                    <td>{t("tonieboxes.esp32BoxFlashing.esp32flasher.chipMAC")}</td>
                                    <td>{state.chipMac}</td>
                                </tr>
                            )}
                            {state.flashId && (
                                <tr>
                                    <td>{t("tonieboxes.esp32BoxFlashing.esp32flasher.flashId")}</td>
                                    <td>0x{state.flashId.toString()}</td>
                                </tr>
                            )}
                            {state.flashManuf && (
                                <tr>
                                    <td>{t("tonieboxes.esp32BoxFlashing.esp32flasher.flashManuf")}</td>
                                    <td>0x{state.flashManuf.toString()}</td>
                                </tr>
                            )}
                            {state.flashDevice && (
                                <tr>
                                    <td>{t("tonieboxes.esp32BoxFlashing.esp32flasher.flashDevice")}</td>
                                    <td>0x{state.flashDevice.toString()}</td>
                                </tr>
                            )}
                            {state.flashSize && (
                                <tr>
                                    <td>{t("tonieboxes.esp32BoxFlashing.esp32flasher.flashSize")}</td>
                                    <td>{state.flashSize} KiB</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );

    const sanitizeHostname = (input: string) => {
        return input.replace(/[^a-zA-Z0-9-.]/g, "").trim();
    };

    const renderStateWithAnimation = (text: string) => {
        if (text.endsWith("...")) {
            const baseText = text.slice(0, -3);
            return (
                <div style={{ display: "flex" }}>
                    {baseText}
                    <DotAnimation />
                </div>
            );
        }
        return text;
    };

    const stepStatusText = state.showStatus && (
        <div className="status" style={{ marginBottom: 16, color: state.error ? "#CC3010" : "unset" }}>
            <i>{renderStateWithAnimation(state.state)}</i>
        </div>
    );

    const conESP32Explanation = connectESP32Explanation();

    // step 0 - start the process, select between read flash and load file
    const contentStep0 = (
        <>
            <h3>{t("tonieboxes.esp32BoxFlashing.esp32flasher.titleReadESP32ImportFlash")}</h3>
            {!state.actionInProgress && (
                <>
                    <Paragraph>
                        <Alert
                            type="warning"
                            closeIcon
                            showIcon
                            message={t("tonieboxes.hintLatestFirmwareTitle")}
                            description={t("tonieboxes.hintLatestFirmware")}
                        ></Alert>
                    </Paragraph>
                    <Paragraph>
                        <Alert
                            type="info"
                            closeIcon
                            showIcon
                            message={t("tonieboxes.esp32BoxFlashing.adaptBaudrateOnProblems")}
                            description={t("tonieboxes.esp32BoxFlashing.adaptBaudrateOnProblemsText")}
                        ></Alert>
                    </Paragraph>
                    <Paragraph style={{ marginTop: 16 }}>
                        <Alert
                            type="info"
                            description={t("tonieboxes.esp32BoxFlashing.esp32flasher.hintReadESP32ImportFlash")}
                        />
                    </Paragraph>

                    <Collapse
                        size="small"
                        style={{ marginBottom: 16 }}
                        items={[
                            {
                                key: "1",
                                label: t("tonieboxes.esp32BoxFlashing.esp32flasher.connectESPCollapseTitle"),
                                children: conESP32Explanation,
                            },
                        ]}
                    />
                </>
            )}
            {stepStatusText}
            <input type="file" style={{ display: "none" }} ref={fileInputRef} onChange={loadFlashFile} />
            {contentProgress}
        </>
    );

    // step 1 - the flash is read, now set the hostname and provide patch functionality
    const contentStep1 = (
        <>
            <h3>{t("tonieboxes.esp32BoxFlashing.esp32flasher.titlePatchFlash")}</h3>
            <div>
                {!state.actionInProgress && (
                    <Paragraph>
                        <Alert type="info" description={t("tonieboxes.esp32BoxFlashing.esp32flasher.hintPatchFlash")} />
                    </Paragraph>
                )}
                {stepStatusText}
                {!state.actionInProgress && state.downloadLink ? (
                    <div style={{ marginBottom: 16 }}>
                        {" "}
                        <a href={state.downloadLink} download={state.filename} title={state.filename}>
                            {t("tonieboxes.esp32BoxFlashing.esp32flasher.downloadLink")}
                        </a>
                    </div>
                ) : (
                    ""
                )}
                <Form>
                    <Divider>{t("tonieboxes.esp32BoxFlashing.esp32flasher.hostnameSettings")}</Divider>
                    <Paragraph>{t("tonieboxes.esp32BoxFlashing.esp32flasher.hintPatchHost")}</Paragraph>
                    <Form.Item>
                        <Row align="middle" style={{ display: "flex", alignItems: "center" }}>
                            <Col>
                                <Checkbox
                                    checked={state.flagPreviousHostname}
                                    onChange={(e) => {
                                        setState((prevState) => ({
                                            ...prevState,
                                            flagPreviousHostname: e.target.checked,
                                        }));
                                    }}
                                >
                                    {t("tonieboxes.esp32BoxFlashing.esp32flasher.flagPreviousHostname")}
                                </Checkbox>
                            </Col>
                        </Row>
                    </Form.Item>
                    {state.flagPreviousHostname && (
                        <Form.Item>
                            <Row align="middle" style={{ display: "flex", alignItems: "center" }}>
                                <Col style={{ flex: "0 0 200px" }}>
                                    <label>{t("tonieboxes.esp32BoxFlashing.esp32flasher.previousHostname")}</label>
                                </Col>
                                <Col style={{ flex: "1 1 auto" }}>
                                    <Input
                                        type="text"
                                        value={state.previousHostname}
                                        onChange={(e) => {
                                            let value = sanitizeHostname(e.target.value);
                                            setState((prevState) => ({
                                                ...prevState,
                                                previousHostname: value,
                                            }));
                                        }}
                                    />
                                </Col>
                            </Row>
                            {state.warningTextHostname && (
                                <p style={{ color: "#CC3010" }}>
                                    {t("tonieboxes.esp32BoxFlashing.esp32flasher.hostnameTooLong")}
                                </p>
                            )}
                        </Form.Item>
                    )}

                    <Form.Item>
                        <Row align="middle" style={{ display: "flex", alignItems: "center" }}>
                            <Col style={{ flex: "0 0 200px", color: state.warningTextHostname ? "#CC3010" : "unset" }}>
                                <label>{t("tonieboxes.esp32BoxFlashing.esp32flasher.hostname")}</label>
                            </Col>
                            <Col style={{ flex: "1 1 auto" }}>
                                <Input
                                    type="text"
                                    value={state.hostname}
                                    onChange={(e) => {
                                        let value = sanitizeHostname(e.target.value);
                                        let warningText = "";
                                        if (value.length > 12) {
                                            warningText = t("tonieboxes.esp32BoxFlashing.esp32flasher.hostnameTooLong");
                                        } else {
                                            warningText = "";
                                        }
                                        setState((prevState) => ({
                                            ...prevState,
                                            hostname: value,
                                            warningTextHostname: warningText,
                                        }));
                                    }}
                                />
                            </Col>
                        </Row>
                        {state.warningTextHostname && (
                            <p style={{ color: "#CC3010" }}>
                                {t("tonieboxes.esp32BoxFlashing.esp32flasher.hostnameTooLong")}
                            </p>
                        )}
                    </Form.Item>

                    <Divider>{t("tonieboxes.esp32BoxFlashing.esp32flasher.wifiSettings")}</Divider>
                    <Paragraph>{t("tonieboxes.esp32BoxFlashing.esp32flasher.hintPatchWifi")}</Paragraph>
                    <Form.Item>
                        <Row align="middle" style={{ display: "flex", alignItems: "center" }}>
                            <Col style={{ flex: "0 0 200px", color: state.warningTextWifi ? "#CC3010" : "unset" }}>
                                <label>{t("tonieboxes.esp32BoxFlashing.esp32flasher.wifiSSID")}</label>
                            </Col>
                            <Col style={{ flex: "1 1 auto" }}>
                                <Input
                                    type="text"
                                    defaultValue={state.wifi_ssid}
                                    onChange={(e) => {
                                        let value = e.target.value;
                                        setState((prevState) => ({
                                            ...prevState,
                                            wifi_ssid: value,
                                            warningTextWifi:
                                                (e.target.value && state.wifi_pass) ||
                                                (!e.target.value && !state.wifi_pass)
                                                    ? ""
                                                    : t(
                                                          "tonieboxes.esp32BoxFlashing.esp32flasher.wifiCredentialsIncomplete"
                                                      ),
                                        }));
                                    }}
                                />
                            </Col>
                        </Row>
                    </Form.Item>
                    <Form.Item>
                        <Row align="middle" style={{ display: "flex", alignItems: "center" }}>
                            <Col style={{ flex: "0 0 200px", color: state.warningTextWifi ? "#CC3010" : "unset" }}>
                                <label>{t("tonieboxes.esp32BoxFlashing.esp32flasher.wifiPassword")}</label>
                            </Col>
                            <Col style={{ flex: "1 1 auto" }}>
                                <Input.Password
                                    defaultValue={state.wifi_pass}
                                    onChange={(e) => {
                                        let value = e.target.value;
                                        setState((prevState) => ({
                                            ...prevState,
                                            wifi_pass: value,
                                            warningTextWifi:
                                                (e.target.value && state.wifi_ssid) ||
                                                (!e.target.value && !state.wifi_ssid)
                                                    ? ""
                                                    : t(
                                                          "tonieboxes.esp32BoxFlashing.esp32flasher.wifiCredentialsIncomplete"
                                                      ),
                                        }));
                                    }}
                                />
                            </Col>
                        </Row>
                        {state.warningTextWifi && (
                            <p style={{ color: "#CC3010" }}>
                                {t("tonieboxes.esp32BoxFlashing.esp32flasher.wifiCredentialsIncomplete")}
                            </p>
                        )}
                    </Form.Item>
                </Form>
            </div>
            {contentProgress}
        </>
    );

    // step 2 - the firmware is now prepared, now flash the box
    const contentStep2 = (
        <>
            <h3>{t("tonieboxes.esp32BoxFlashing.esp32flasher.titleFlashESP32")}</h3>
            {!state.actionInProgress && (
                <Paragraph>
                    {" "}
                    <Alert type="info" description={t("tonieboxes.esp32BoxFlashing.esp32flasher.hintFlashESP32")} />
                </Paragraph>
            )}
            {stepStatusText}
            {!state.actionInProgress && state.downloadLinkPatched ? (
                <div style={{ marginBottom: 16 }}>
                    {" "}
                    <a
                        href={state.downloadLinkPatched}
                        download={"patched_" + state.filename}
                        title={"patched_" + state.filename}
                    >
                        {t("tonieboxes.esp32BoxFlashing.esp32flasher.downloadLinkPatched")}
                    </a>
                </div>
            ) : (
                ""
            )}
            {contentProgress}
        </>
    );

    // step 3 - the flashing was successful!
    const certDirWithMac = `${certDir}/${state.chipMac ? state.chipMac.replaceAll(":", "").toLowerCase() : "<mac>"}`;
    const contentStep3 = (
        <>
            <h3>{t("tonieboxes.esp32BoxFlashing.esp32flasher.titleESP32FirmwareFlashed")}</h3>
            <Paragraph>
                <Alert
                    type="success"
                    description={t("tonieboxes.esp32BoxFlashing.esp32flasher.hintESP32FirmwareFlashed")}
                />
            </Paragraph>
            {stepStatusText}
            {contentProgress}
            {(state.downloadLink || state.downloadLinkPatched) && (
                <>
                    <Alert
                        type="info"
                        style={{ marginTop: 16 }}
                        showIcon={true}
                        message={t("tonieboxes.esp32BoxFlashing.esp32flasher.extractCertificates")}
                        description={
                            <div>
                                <Typography>
                                    <Divider>{t("tonieboxes.esp32BoxFlashing.esp32flasher.automatically")}</Divider>
                                    <Paragraph>
                                        {t(
                                            "tonieboxes.esp32BoxFlashing.esp32flasher.extractCertificatesAutomaticallyHint"
                                        )}
                                    </Paragraph>
                                    <Button
                                        icon={<SafetyCertificateOutlined />}
                                        disabled={disableButtons}
                                        type="primary"
                                        onClick={() => extractCertsFromFlash()}
                                        style={{ marginBottom: 8 }}
                                    >
                                        {t("tonieboxes.esp32BoxFlashing.esp32flasher.extractCertificates")}
                                    </Button>
                                    <Paragraph>
                                        {t(
                                            "tonieboxes.esp32BoxFlashing.esp32flasher.extractCertificatesAutomaticallyHint2",
                                            {
                                                certDir: certDir,
                                                mac: state.chipMac.replaceAll(":", "").toLocaleLowerCase(),
                                            }
                                        )}
                                    </Paragraph>
                                </Typography>
                                <Divider>{t("tonieboxes.esp32BoxFlashing.esp32flasher.manually")}</Divider>
                                <Typography style={{ marginBottom: 8 }}>
                                    {t("tonieboxes.esp32BoxFlashing.esp32flasher.extractCertificatesManuallyHint")}
                                </Typography>
                                <Typography>
                                    <Collapse
                                        size="small"
                                        items={[
                                            {
                                                key: "1",
                                                label: t(
                                                    "tonieboxes.esp32BoxFlashing.esp32flasher.extractCertificatesManually"
                                                ),
                                                children: (
                                                    <Typography>
                                                        <Paragraph>
                                                            {t(
                                                                "tonieboxes.esp32BoxFlashing.esp32flasher.extractCertificatesManuallyHintP1"
                                                            )}{" "}
                                                            <Text code>
                                                                docker exec -it &lt;container-name&gt; bash
                                                            </Text>
                                                            .
                                                        </Paragraph>

                                                        <Paragraph>
                                                            <pre style={{ fontSize: 12 }}>
                                                                {`# Please check the filename of your backup
# Be sure you are in the TeddyCloud directory
# cd /teddycloud/ # just for docker
mkdir ${certDirWithMac}
teddycloud --esp32-extract data/firmware/` +
                                                                    (state.filename
                                                                        ? state.filename
                                                                        : "ESP32_<mac>.bin") +
                                                                    ` --destination ${certDirWithMac}`}
                                                            </pre>
                                                        </Paragraph>
                                                        <Paragraph>
                                                            {t(
                                                                "tonieboxes.esp32BoxFlashing.esp32flasher.extractCertificatesManuallyHintP2"
                                                            )}
                                                        </Paragraph>
                                                        <Paragraph>
                                                            <pre style={{ fontSize: 12 }}>
                                                                {`mv ${certDirWithMac}/CLIENT.DER ${certDirWithMac}/client.der
mv ${certDirWithMac}/PRIVATE.DER ${certDirWithMac}/private.der
mv ${certDirWithMac}/CA.DER ${certDirWithMac}/ca.der`}
                                                            </pre>
                                                        </Paragraph>

                                                        <Paragraph>
                                                            {t(
                                                                "tonieboxes.esp32BoxFlashing.esp32flasher.extractCertificatesManuallyHintP3"
                                                            )}
                                                        </Paragraph>
                                                        <Paragraph>
                                                            <pre style={{ fontSize: 12 }}>
                                                                {`cp ${certDirWithMac}/client.der ${certDir}/client.der
cp ${certDirWithMac}/private.der ${certDir}/private.der
cp ${certDirWithMac}/ca.der ${certDir}/ca.der`}
                                                            </pre>
                                                        </Paragraph>
                                                    </Typography>
                                                ),
                                            },
                                        ]}
                                    />
                                </Typography>
                            </div>
                        }
                    ></Alert>
                    <Paragraph style={{ marginTop: 16 }}>
                        {t("tonieboxes.esp32BoxFlashing.esp32flasher.downloadFlashFilesHint")}
                        <ul style={{ marginTop: 8 }}>
                            {state.downloadLink && (
                                <li>
                                    <a href={state.downloadLink} download={state.filename} title={state.filename}>
                                        {t("tonieboxes.esp32BoxFlashing.esp32flasher.downloadLink")}
                                    </a>
                                </li>
                            )}
                            {state.downloadLinkPatched && (
                                <li>
                                    <a
                                        href={state.downloadLinkPatched}
                                        download={"patched_" + state.filename}
                                        title={"patched_" + state.filename}
                                    >
                                        {t("tonieboxes.esp32BoxFlashing.esp32flasher.downloadLinkPatched")}
                                    </a>
                                </li>
                            )}
                        </ul>
                    </Paragraph>
                </>
            )}
        </>
    );

    // step 3 - the flashing was successful in case of reset!
    const contentStep3resetCase = (
        <>
            <h3>{t("tonieboxes.esp32BoxFlashing.esp32flasher.titleESP32FirmwareFlashed")}</h3>
            <Paragraph>
                <Alert
                    type="success"
                    description={t("tonieboxes.esp32BoxFlashing.esp32flasher.hintESP32FirmwareReseted")}
                />
            </Paragraph>
            {stepStatusText}
            {contentProgress}
        </>
    );

    const [content, setContent] = useState([contentStep0, contentStep1, contentStep2, contentStep3]);

    const updateContent = (index: number, newContent: JSX.Element) => {
        setContent((prevContent) => {
            const updatedContent = [...prevContent];
            updatedContent[index] = newContent;
            return updatedContent;
        });
    };

    // button functions
    const readFirmware = () => {
        setState((prevState) => ({
            ...prevState,
            resetBox: false,
        }));
        readFlash();
    };

    const loadFile = () => {
        setState((prevState) => ({
            ...prevState,
            resetBox: false,
        }));
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const doResetBox = () => {
        setState((prevState) => ({
            ...prevState,
            resetBox: true,
        }));
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const patchImage = () => {
        patchFlash();
    };

    const flashESP32 = () => {
        writeFlash();
    };

    const extractCertsFromFlash = () => {
        extractAndStoreCertsFromFlash();
    };

    const next = () => {
        setState((prevState) => ({
            ...prevState,
            proceed: false,
        }));
        setCurrent(currentStep + 1);
    };

    const prev = () => {
        setState((prevState) => ({
            ...prevState,
            state: "",
            showProgress: false,
            error: false,
        }));
        setCurrent(currentStep - 1);
    };

    // confirm flashing
    const handleConfirmFlash = () => {
        setIsConfirmFlashModalOpen(false);
        flashESP32();
    };

    const handleCancelFlash = () => {
        setIsConfirmFlashModalOpen(false);
    };

    // the flashing step form itself
    const previousButton = (
        <Button icon={<LeftOutlined />} disabled={disableButtons} onClick={() => prev()}>
            {t("tonieboxes.esp32BoxFlashing.esp32flasher.previous")}
        </Button>
    );

    const checkBoxes = () => {
        showAvailableBoxesModal();
    };

    const showAvailableBoxesModal = () => {
        setIsOpenAvailableBoxesModal(true);
    };

    const handleAvailableBoxesModalClose = () => {
        setIsOpenAvailableBoxesModal(false);
    };

    const availableBoxesModal = (
        <AvailableBoxesModal
            boxVersion={BoxVersionsEnum.esp32}
            isOpen={isOpenAvailableBoxesModal}
            onClose={handleAvailableBoxesModalClose}
        />
    );

    const ESP32BoxFlashingForm = isSupported ? (
        <>
            <Divider>{t("tonieboxes.esp32BoxFlashing.title")}</Divider>
            <ConfirmationDialog
                title={t("tonieboxes.esp32BoxFlashing.esp32flasher.confirmFlashModal")}
                open={isConfirmFlashModalOpen}
                okText={t("tonieboxes.esp32BoxFlashing.esp32flasher.flash")}
                cancelText={t("tonieboxes.esp32BoxFlashing.esp32flasher.cancel")}
                content={t("tonieboxes.esp32BoxFlashing.esp32flasher.confirmFlashDialog")}
                contentHint={t("tonieboxes.esp32BoxFlashing.esp32flasher.confirmFlashDialogHint")}
                handleOk={handleConfirmFlash}
                handleCancel={handleCancelFlash}
            />
            <Steps current={currentStep}>
                {steps.map((step, index) => (
                    <Step
                        key={index}
                        title={step.title}
                        status={
                            index === currentStep && index === steps.length - 1
                                ? "finish"
                                : index === currentStep
                                ? state.error
                                    ? "error"
                                    : "process"
                                : index < currentStep
                                ? "finish"
                                : "wait"
                        }
                        className={index === currentStep && state.actionInProgress ? "ant-steps-item-in-progress" : ""}
                    />
                ))}
            </Steps>
            <div style={{ marginTop: 24 }}>{content[currentStep]}</div>
            <div style={{ marginTop: 24, marginBottom: 24 }}>
                {currentStep === 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <div>
                            <Paragraph>
                                <Button onClick={() => navigate("/tonieboxes/boxsetup/esp32/legacy")}>
                                    {t("tonieboxes.esp32BoxFlashing.legacy.navigationTitle")}
                                </Button>
                            </Paragraph>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            <Tooltip title={t("tonieboxes.esp32BoxFlashing.esp32flasher.resetBoxineTooltip")}>
                                <Button
                                    icon={<RollbackOutlined />}
                                    disabled={disableButtons}
                                    onClick={() => doResetBox()}
                                >
                                    {t("tonieboxes.esp32BoxFlashing.esp32flasher.resetBoxine")}
                                </Button>
                            </Tooltip>
                            <Button icon={<FileAddOutlined />} disabled={disableButtons} onClick={() => loadFile()}>
                                {t("tonieboxes.esp32BoxFlashing.esp32flasher.loadFile")}
                            </Button>
                            <Button
                                icon={<DownloadOutlined />}
                                disabled={disableButtons}
                                type="primary"
                                onClick={() => readFirmware()}
                            >
                                {t("tonieboxes.esp32BoxFlashing.esp32flasher.readFlash")}
                            </Button>
                        </div>
                        <Button
                            icon={<RightOutlined />}
                            iconPosition="end"
                            disabled={(!state.proceed && !state.filename) || disableButtons}
                            onClick={() => next()}
                        >
                            {t("tonieboxes.esp32BoxFlashing.esp32flasher.next")}
                        </Button>
                    </div>
                )}
                {currentStep === 1 && (
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        {previousButton}
                        <div style={{ display: "flex", gap: 8 }}>
                            <Button
                                icon={<CodeOutlined />}
                                disabled={
                                    disableButtons ||
                                    state.hostname === "" ||
                                    (state.flagPreviousHostname && state.previousHostname === "")
                                }
                                type="primary"
                                onClick={() => patchImage()}
                            >
                                {t("tonieboxes.esp32BoxFlashing.esp32flasher.patchImage")}
                            </Button>
                        </div>
                        <Button
                            icon={<RightOutlined />}
                            iconPosition="end"
                            disabled={disableButtons || !state.showFlash}
                            onClick={() => next()}
                        >
                            {t("tonieboxes.esp32BoxFlashing.esp32flasher.next")}
                        </Button>
                    </div>
                )}
                {currentStep === 2 && (
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        {previousButton}
                        <div style={{ display: "flex", gap: 8 }}>
                            <Button
                                icon={<UploadOutlined />}
                                disabled={disableButtons}
                                type="primary"
                                onClick={state.resetBox ? resetFlash : () => setIsConfirmFlashModalOpen(true)}
                            >
                                {t("tonieboxes.esp32BoxFlashing.esp32flasher.flashEsp32")}
                            </Button>
                        </div>
                        <div></div>
                    </div>
                )}
                {currentStep === 3 && (
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        {previousButton}
                        <div>
                            {state.resetBox ? (
                                ""
                            ) : (
                                <Button icon={<EyeOutlined />} type="primary" onClick={checkBoxes}>
                                    {t("tonieboxes.esp32BoxFlashing.legacy.checkBoxes")}
                                </Button>
                            )}
                        </div>
                        <div></div>
                    </div>
                )}
                {contentRaw}
            </div>
        </>
    ) : (
        <>
            <Paragraph>
                <Alert
                    message={t("tonieboxes.esp32BoxFlashing.attention")}
                    description={t("tonieboxes.esp32BoxFlashing.browserNotSupported")}
                    type="warning"
                    showIcon
                />
            </Paragraph>
            <Paragraph style={{ marginTop: 16 }}>
                <Paragraph> {t("tonieboxes.esp32BoxFlashing.hintLegacyApproach")}</Paragraph>
                <Paragraph>
                    <Button onClick={() => navigate("/tonieboxes/boxsetup/esp32/legacy")}>
                        {t("tonieboxes.esp32BoxFlashing.legacy.navigationTitle")}
                    </Button>
                </Paragraph>
            </Paragraph>
        </>
    );

    return (
        <>
            <StyledSider>
                <TonieboxesSubNav />
            </StyledSider>
            <StyledLayout>
                <BreadcrumbWrapper
                    items={[
                        { title: t("home.navigationTitle") },
                        { title: t("tonieboxes.navigationTitle") },
                        { title: t("tonieboxes.esp32BoxFlashing.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <Paragraph
                        style={{
                            display: "flex",
                            gap: 8,
                            flexWrap: "wrap",
                            justifyContent: "space-between",
                            alignItems: "flex-end",
                        }}
                    >
                        <h1>{t(`tonieboxes.esp32BoxFlashing.title`)}</h1>
                        {httpsActive && (
                            <Paragraph
                                style={{
                                    fontSize: "small",
                                    display: "flex",
                                    gap: 8,
                                    width: 210,
                                    alignItems: "center",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <div style={{ textAlign: "end", textWrap: "nowrap" }}>
                                    {t("tonieboxes.esp32BoxFlashing.baudRate")}
                                </div>
                                <Select defaultValue={baudRate} onChange={handleBaurateChange}>
                                    {baudRates.map((rate) => (
                                        <Option key={rate} value={rate}>
                                            {rate}
                                        </Option>
                                    ))}
                                </Select>{" "}
                                <Tooltip title={t("tonieboxes.esp32BoxFlashing.baudRateInfo")} placement="top">
                                    <QuestionCircleOutlined style={{ fontSize: "18px", cursor: "pointer" }} />
                                </Tooltip>
                            </Paragraph>
                        )}
                    </Paragraph>
                    {!httpsActive ? (
                        <>
                            <Alert
                                message={t("tonieboxes.esp32BoxFlashing.attention")}
                                description={
                                    <>
                                        <Paragraph>{t("tonieboxes.esp32BoxFlashing.hint")}</Paragraph>
                                        <Paragraph>
                                            <Button icon={<SyncOutlined />} onClick={openHttpsUrl}>
                                                {t("tonieboxes.esp32BoxFlashing.redirect")}
                                            </Button>
                                        </Paragraph>
                                    </>
                                }
                                type="warning"
                                showIcon
                            />
                            <Paragraph style={{ marginTop: 16 }}>
                                <Paragraph> {t("tonieboxes.esp32BoxFlashing.legacy.followLegacyApproach")}</Paragraph>
                                <Paragraph>
                                    <Button onClick={() => navigate("/tonieboxes/boxsetup/esp32/legacy")}>
                                        {t("tonieboxes.esp32BoxFlashing.legacy.navigationTitle")}
                                    </Button>
                                </Paragraph>
                            </Paragraph>
                        </>
                    ) : (
                        ESP32BoxFlashingForm
                    )}
                    <ConfirmationDialog
                        title={t(
                            "tonieboxes.esp32BoxFlashing.esp32flasher.extractingCertificates409ResponseForceOverwrite"
                        )}
                        okText={t(
                            "tonieboxes.esp32BoxFlashing.esp32flasher.extractingCertificates409ResponseForceOverwriteConfirmButton"
                        )}
                        cancelText={t("tonieboxes.esp32BoxFlashing.esp32flasher.cancel")}
                        content={t(
                            "tonieboxes.esp32BoxFlashing.esp32flasher.extractingCertificates409ResponseForceOverwriteContent",
                            { error: extractCertificateErrorMessage }
                        )}
                        open={isOverwriteForceConfirmationModalOpen}
                        handleOk={() => extractAndStoreCertsFromFlash(true)}
                        handleCancel={() => setIsOverwriteForceConfirmationModalOpen(false)}
                    ></ConfirmationDialog>
                    {availableBoxesModal}
                </StyledContent>
            </StyledLayout>
        </>
    );
};
