import { useEffect, useState, useRef } from "react";
import { JSX } from "react/jsx-runtime";
import { ESPLoader, Transport } from "esptool-js";
import i18n from "../../i18n";
import { useTranslation } from "react-i18next";
import { Alert, Button, Divider, Input, Progress, Steps, Switch, Typography, message } from "antd";
import FormItem from "antd/es/form/FormItem";
import { TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import {
    HiddenDesktop,
    StyledBreadcrumb,
    StyledContent,
    StyledLayout,
    StyledSider,
} from "../../components/StyledComponents";
import { TonieboxesSubNav } from "../../components/tonieboxes/TonieboxesSubNav";
import ConfirmationDialog from "../../components/utils/ConfirmationDialog";

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
    hostname: string;
    proceed: boolean;
    disableButtons: boolean;
    warningText: string;
    downloadLink: string;
    downloadLinkPatched: string;
}

const { Paragraph, Text } = Typography;
const { Step } = Steps;

export const ESP32BoxFlashing = () => {
    const { t } = useTranslation();
    const currentLanguage = i18n.language;

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [webHttpOnly, setWebHttpOnly] = useState(false);
    const [httpsClientCertAuth, setHttpsClientCertAuth] = useState(false);
    const [newWebHttpOnly, setNewWebHttpOnly] = useState(false);
    const [newHttpsClientCertAuth, setNewHttpsClientCertAuth] = useState(false);
    const [httpsActive, setHttpsActive] = useState(false);

    const [content, setContent] = useState([<></>, <></>, <></>, <></>]);
    const [currentStep, setCurrent] = useState(0);
    const [disableButtons, setDisableButtons] = useState<boolean>(false);

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
        hostname: window.location.hostname,
        proceed: false,
        disableButtons: false,
        warningText: "",
        downloadLink: "",
        downloadLinkPatched: "",
    });

    const [isConfirmFlashModalOpen, setIsConfirmFlashModalOpen] = useState<boolean>(false);

    const baudRate = 921600;
    const romBaudRate = 115200;

    function arrayBufferToBstr(arrayBuffer: any) {
        const u8Array = new Uint8Array(arrayBuffer);
        let binaryString = "";
        for (let i = 0; i < u8Array.length; i++) {
            binaryString += String.fromCharCode(u8Array[i]);
        }
        return binaryString;
    }

    useEffect(() => {
        if (window.location.protocol === "https:") {
            setHttpsActive(true);
        } else {
            setHttpsActive(false);
        }
    }, []);

    useEffect(() => {
        const fetchWebHttpOnly = async () => {
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/settings/get/core.webHttpOnly`,
                    {
                        method: "GET",
                    }
                );
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setWebHttpOnly(data.toString() === "true");
                setNewWebHttpOnly(data.toString() === "true");
            } catch (error) {
                console.error("Error fetching web Http only: ", error);
            }
        };

        fetchWebHttpOnly();

        const fetchHttpsClientCertAuth = async () => {
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/settings/get/core.webHttpsCertAuth`,
                    {
                        method: "GET",
                    }
                );
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setHttpsClientCertAuth(data.toString() === "true");
                setNewHttpsClientCertAuth(data.toString() === "true");
            } catch (error) {
                console.error("Error fetching  Https Client Cert Auth: ", error);
            }
        };

        fetchHttpsClientCertAuth();
    }, []);

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
                    return contentStep3;
                default:
                    return <div></div>;
            }
        };

        updateContent(currentStep, getContentForStep());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state, currentLanguage]);

    useEffect(() => {
        if (state.proceed) {
            next();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.proceed]);

    useEffect(() => {
        setDisableButtons(state.disableButtons);
    }, [state.disableButtons]);

    // http / https stuff
    const triggerWriteConfig = async () => {
        try {
            await api.apiTriggerWriteConfigGet();
        } catch (error) {
            message.error("Error while saving config to file.");
        }
    };

    const handleHttpOnlyChange = (value: any) => {
        setNewWebHttpOnly(value);
    };

    const handleHttpsClientCertAuthChange = (value: any) => {
        setNewHttpsClientCertAuth(value);
    };

    const handleSaveHttpsSettings = async () => {
        try {
            if (newHttpsClientCertAuth !== httpsClientCertAuth) {
                await fetch(`${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/settings/set/core.webHttpsCertAuth`, {
                    method: "POST",
                    body: newHttpsClientCertAuth?.toString(),
                    headers: {
                        "Content-Type": "text/plain",
                    },
                });
            }
            if (newWebHttpOnly !== webHttpOnly) {
                await fetch(`${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/settings/set/core.webHttpOnly`, {
                    method: "POST",
                    body: newWebHttpOnly?.toString(),
                    headers: {
                        "Content-Type": "text/plain",
                    },
                });
            }

            if (newWebHttpOnly !== webHttpOnly || newHttpsClientCertAuth !== httpsClientCertAuth) {
                triggerWriteConfig();

                setHttpsClientCertAuth(newHttpsClientCertAuth);
                setWebHttpOnly(newWebHttpOnly);
            }

            const httpsPort = process.env.REACT_APP_TEDDYCLOUD_PORT_HTTPS || "";
            const httpPort = process.env.REACT_APP_TEDDYCLOUD_PORT_HTTP || "";

            if (!newWebHttpOnly && !newHttpsClientCertAuth && !httpsActive) {
                // Redirect to the HTTPS URL
                const httpsURL = `https://${window.location.host.replace(httpPort, httpsPort)}${
                    window.location.pathname
                }${window.location.search}`;
                window.location.replace(httpsURL);
            } else if (newWebHttpOnly && httpsActive) {
                // Redirect to the HTTP URL
                const httpURL = `http://${window.location.host.replace(httpsPort, httpPort)}${
                    window.location.pathname
                }${window.location.search}`;
                window.location.replace(httpURL);
            }
        } catch (e) {
            message.error("Error while sending data to server.");
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
                }));
                alert(t("tonieboxes.esp32BoxFlashing.esp32flasher.portOpenFailedInUse"));
            } else if (err === "NotFoundError") {
                setState((prevState) => ({
                    ...prevState,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.noPortAvailable"),
                }));
            } else {
                setState((prevState) => ({
                    ...prevState,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.error") + err,
                }));
                alert(t("tonieboxes.esp32BoxFlashing.esp32flasher.error") + ` ${err}`);
            }
            return null;
        }

        if (!port) {
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.invalidSerialPort"),
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
            disableButtons: true,
        }));

        console.log("Read file '" + file + "'");
        const reader = new FileReader();
        reader.onload = async (e) => {
            console.log("Connecting to ESP32");
            const port = await getPort(t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingReadMac"));

            if (port === null || state.connected) {
                setState((prevState) => ({
                    ...prevState,
                    disableButtons: false,
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
                    disableButtons: false,
                }));

                alert(err);
                await port.close();
                return;
            }

            try {
                setState((prevState) => ({
                    ...prevState,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.retrievingMac"),
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
                    disableButtons: false,
                }));
                console.error(err);
                alert(err);
                await port.close();
                return;
            }
        };

        reader.readAsArrayBuffer(file);
        setState((prevState) => ({
            ...prevState,
            disableButtons: false,
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
            showFlash: false,
            connected: true,
            disableButtons: true,
        }));

        try {
            const transport = new Transport(port);

            esploader = new ESPLoader({
                transport: transport,
                baudrate: baudRate,
                romBaudrate: romBaudRate, // Ensure this matches documentation
            });
        } catch (err) {
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToConnect") + ` ${err}`,
                connected: false,
                disableButtons: false,
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
                    disableButtons: false,
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
                disableButtons: false,
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
        }));

        await uploadFlashData(flashData, sanitizedName);
        console.log("Done");
    };

    const uploadFlashData = async (flashData: Uint8Array, sanitizedName: string) => {
        try {
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.uploading"),
            }));

            const formData = new FormData();
            formData.append(sanitizedName, new Blob([flashData.buffer]), sanitizedName);

            const response = await fetch(`${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/uploadFirmware`, {
                method: "POST",
                body: formData,
            });

            if (response.ok && response.status === 200) {
                const filename = await response.text();
                setState((prevState) => ({
                    ...prevState,
                    showDownload: true,
                    filename: filename,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.uploadSuccessful") + ` ${filename}`,
                    proceed: true,
                    disableButtons: false,
                }));
            } else {
                setState((prevState) => ({
                    ...prevState,
                    state: t("tonieboxes.esp32BoxFlashing.esp32flasher.uploadFailed"),
                    disableButtons: false,
                }));
            }
        } catch (err) {
            console.error("There was an error when uploading!", err);
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.uploadFailed"),
                disableButtons: false,
            }));
        }
    };

    const patchFlash = async () => {
        setState((prevState) => ({
            ...prevState,
            disableButtons: true,
        }));

        setState((prevState) => ({
            ...prevState,
            showProgress: false,
            showFlash: false,
            state: t("tonieboxes.esp32BoxFlashing.esp32flasher.patchingFlashImage"),
        }));

        const response = await fetch(
            `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/patchFirmware?filename=${state.filename}&hostname=${state.hostname}`,
            {
                method: "GET",
            }
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
            }));
        }
        setState((prevState) => ({
            ...prevState,
            disableButtons: false,
        }));
    };

    const writeFlash = async () => {
        const port = await getPort(t("tonieboxes.esp32BoxFlashing.esp32flasher.connectingWriteFlash"));

        if (port == null || state.connected) {
            return;
        }

        setState((prevState) => ({
            ...prevState,
            disableButtons: true,
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
                romBaudrate: romBaudRate, // Ensure this matches documentation
            });
        } catch (err) {
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToConnect") + ` ${err}`,
                connected: false,
                disableButtons: false,
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
                    disableButtons: false,
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
                disableButtons: false,
                proceed: true,
            }));
        } catch (err) {
            setState((prevState) => ({
                ...prevState,
                state: t("tonieboxes.esp32BoxFlashing.esp32flasher.failedToCommunicate") + ` ${err}`,
                connected: false,
                disableButtons: false,
            }));
            console.error(err);
            alert(err);
            await port.close();
            return;
        }
    };

    // step content functionality
    const updateContent = (index: number, newContent: JSX.Element) => {
        setContent((prevContent) => {
            const updatedContent = [...prevContent];
            updatedContent[index] = newContent;
            return updatedContent;
        });
    };

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

    const contentRaw = (
        <>
            {state.showProgress && (
                <div>
                    <table className="info-table">
                        <tbody>
                            <tr>
                                <td>{t("tonieboxes.esp32BoxFlashing.esp32flasher.chipType")}</td>
                                <td>{state.chipType}</td>
                            </tr>
                            <tr>
                                <td>{t("tonieboxes.esp32BoxFlashing.esp32flasher.chipMAC")}</td>
                                <td>{state.chipMac}</td>
                            </tr>
                            <tr>
                                <td>{t("tonieboxes.esp32BoxFlashing.esp32flasher.flashId")}</td>
                                <td>0x{state.flashId.toString()}</td>
                            </tr>
                            <tr>
                                <td>{t("tonieboxes.esp32BoxFlashing.esp32flasher.flashManuf")}</td>
                                <td>0x{state.flashManuf.toString()}</td>
                            </tr>
                            <tr>
                                <td>{t("tonieboxes.esp32BoxFlashing.esp32flasher.flashDevice")}</td>
                                <td>0x{state.flashDevice.toString()}</td>
                            </tr>
                            <tr>
                                <td>{t("tonieboxes.esp32BoxFlashing.esp32flasher.flashSize")}</td>
                                <td>{state.flashSize} KiB</td>
                            </tr>
                        </tbody>
                    </table>
                    <div>
                        <Progress percent={state.progress || 0} format={(percent) => `${(percent ?? 0).toFixed(2)}%`} />
                    </div>
                </div>
            )}
        </>
    );

    const sanitizeHostname = (input: string) => {
        return input.replace(/[^a-zA-Z0-9-.]/g, "").trim();
    };

    const stepStatusText = state.showStatus && (
        <div className="status">
            <p>
                <i>{state.state}</i>
            </p>
        </div>
    );

    // step 0 - start the process, select between read flash and load file
    const contentStep0 = (
        <>
            <h3>{t("tonieboxes.esp32BoxFlashing.esp32flasher.titleReadESP32ImportFlash")}</h3>
            {stepStatusText}
            <Paragraph>{t("tonieboxes.esp32BoxFlashing.esp32flasher.hintReadESP32ImportFlash")}</Paragraph>
            <input type="file" style={{ display: "none" }} ref={fileInputRef} onChange={loadFlashFile} />
            {contentRaw}
        </>
    );

    // step 1 - the flash is read, now set the hostname and provide patch functionality
    const contentStep1 = (
        <>
            <h3>{t("tonieboxes.esp32BoxFlashing.esp32flasher.titlePatchFlash")}</h3>
            {stepStatusText}
            {state.downloadLink ? (
                <div style={{ marginBottom: 16 }}>
                    {" "}
                    <a href={state.downloadLink} download={state.filename} title={state.filename}>
                        {t("tonieboxes.esp32BoxFlashing.esp32flasher.downloadLink")}
                    </a>
                </div>
            ) : (
                ""
            )}
            <Paragraph>{t("tonieboxes.esp32BoxFlashing.esp32flasher.hintPatchFlash")}</Paragraph>
            <div>
                <FormItem label={t("tonieboxes.esp32BoxFlashing.esp32flasher.hostname")}>
                    <Input
                        type="text"
                        defaultValue={state.hostname}
                        onChange={(e) => {
                            let value = sanitizeHostname(e.target.value);
                            let warningText = "";

                            if (value.length > 12) {
                                warningText = t("tonieboxes.esp32BoxFlashing.esp32flasher.hostnameToLong");
                            } else {
                                warningText = "";
                            }

                            setState((prevState) => ({
                                ...prevState,
                                hostname: value,
                                warningText: warningText,
                            }));
                        }}
                    />
                    {state.warningText && <p style={{ color: "#CC3010" }}>{state.warningText}</p>}
                </FormItem>
            </div>
            {contentRaw}
        </>
    );

    // step 2 - the firmware is now prepared, now flash the box
    const contentStep2 = (
        <>
            <h3>{t("tonieboxes.esp32BoxFlashing.esp32flasher.titleFlashESP32")}</h3>
            {stepStatusText}
            {state.downloadLinkPatched ? (
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
            <Paragraph>{t("tonieboxes.esp32BoxFlashing.esp32flasher.hintFlashESP32")}</Paragraph>
            {contentRaw}
        </>
    );

    // step 3 - the flashing was successful!
    const contentStep3 = (
        <>
            <h3>{t("tonieboxes.esp32BoxFlashing.esp32flasher.titleESP32FirmwareFlashed")}</h3>
            {stepStatusText}
            <Paragraph>{t("tonieboxes.esp32BoxFlashing.esp32flasher.hintESP32FirmwareFlashed")}</Paragraph>
            {contentRaw}
        </>
    );

    // button functions
    const readFirmware = () => {
        readFlash();
    };

    const loadFile = () => {
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
        <Button disabled={disableButtons} onClick={() => prev()}>
            {t("tonieboxes.esp32BoxFlashing.esp32flasher.previous")}
        </Button>
    );

    const ESP32BoxFlashingForm = httpsActive ? (
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
                                ? "process"
                                : index < currentStep
                                ? "finish"
                                : "wait"
                        }
                    />
                ))}
            </Steps>
            <div style={{ marginTop: 24 }}>{content[currentStep]}</div>
            <div style={{ marginTop: 24 }}>
                {currentStep === 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div></div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <Button disabled={disableButtons} onClick={() => loadFile()}>
                                {t("tonieboxes.esp32BoxFlashing.esp32flasher.loadFile")}
                            </Button>
                            <Button disabled={disableButtons} type="primary" onClick={() => readFirmware()}>
                                {t("tonieboxes.esp32BoxFlashing.esp32flasher.readFlash")}
                            </Button>
                        </div>
                        <Button disabled={(!state.proceed && !state.filename) || disableButtons} onClick={() => next()}>
                            {t("tonieboxes.esp32BoxFlashing.esp32flasher.next")}
                        </Button>
                    </div>
                )}
                {currentStep === 1 && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        {previousButton}
                        <div style={{ display: "flex", gap: 8 }}>
                            <Button disabled={disableButtons} type="primary" onClick={() => patchImage()}>
                                {t("tonieboxes.esp32BoxFlashing.esp32flasher.patchImage")}
                            </Button>
                        </div>
                        <Button disabled={disableButtons || !state.showFlash} onClick={() => next()}>
                            {t("tonieboxes.esp32BoxFlashing.esp32flasher.next")}
                        </Button>
                    </div>
                )}
                {currentStep === 2 && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        {previousButton}
                        <div style={{ display: "flex", gap: 8 }}>
                            <Button
                                disabled={disableButtons}
                                type="primary"
                                onClick={() => setIsConfirmFlashModalOpen(true)}
                            >
                                {t("tonieboxes.esp32BoxFlashing.esp32flasher.flashEsp32")}
                            </Button>
                        </div>
                        <div></div>
                    </div>
                )}
                {currentStep === 3 && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        {previousButton}
                        <div></div>
                        <div></div>
                    </div>
                )}
            </div>
        </>
    ) : (
        ""
    );

    return (
        <>
            <StyledSider>
                <TonieboxesSubNav />
            </StyledSider>
            <StyledLayout>
                <HiddenDesktop>
                    <TonieboxesSubNav />
                </HiddenDesktop>
                <StyledBreadcrumb
                    items={[
                        { title: t("home.navigationTitle") },
                        { title: t("tonieboxes.esp32BoxFlashing.navigationTitle") },
                    ]}
                />
                <StyledContent>
                    <h1>{t(`tonieboxes.esp32BoxFlashing.title`)}</h1>
                    <Paragraph>
                        {!httpsActive ? (
                            <Alert
                                message={t("tonieboxes.esp32BoxFlashing.attention")}
                                description={t("tonieboxes.esp32BoxFlashing.hint")}
                                type="warning"
                                showIcon
                            />
                        ) : (
                            ""
                        )}
                    </Paragraph>
                    {ESP32BoxFlashingForm}
                    <Divider>{t("tonieboxes.esp32BoxFlashing.httpsSettings")}</Divider>
                    <Paragraph style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <Paragraph>
                            <Switch
                                checked={newWebHttpOnly}
                                onChange={handleHttpOnlyChange}
                                style={{ marginRight: 8 }}
                            />
                            <Text>
                                {t("tonieboxes.esp32BoxFlashing.enabledWebHttpOnly")}
                                {". "}
                            </Text>
                        </Paragraph>
                        <Paragraph>
                            <Switch
                                checked={newHttpsClientCertAuth}
                                onChange={handleHttpsClientCertAuthChange}
                                style={{ marginRight: 8 }}
                            />
                            <Text>
                                {t("tonieboxes.esp32BoxFlashing.enabledWebHttpsClientCertAuth")}
                                {". "}
                            </Text>
                        </Paragraph>

                        <Text>
                            {webHttpOnly || httpsClientCertAuth
                                ? t("tonieboxes.esp32BoxFlashing.redirectToHttpsAfterDeactivation")
                                : t("tonieboxes.esp32BoxFlashing.redirectToHttpAfterActivation")}
                        </Text>
                        <Button
                            onClick={handleSaveHttpsSettings}
                            style={{ margin: 8 }}
                            disabled={webHttpOnly === newWebHttpOnly && httpsClientCertAuth === newHttpsClientCertAuth}
                        >
                            {t("tonieboxes.esp32BoxFlashing.save")}
                        </Button>
                    </Paragraph>
                </StyledContent>
            </StyledLayout>
        </>
    );
};
