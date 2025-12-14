/*
 * revvox_flasher.ts
 * based on flasher.js by g3gg0
 * https://github.com/g3gg0/esp32_flasher
 * commit: d203da41a36e63c3f0f2bd7ad93e4843120b344e
 */

/* Command defines */
const FLASH_BEGIN = 0x02;
const FLASH_DATA = 0x03;
const FLASH_END = 0x04;
const MEM_BEGIN = 0x05;
const MEM_END = 0x06;
const MEM_DATA = 0x07;
const SYNC = 0x08;
const WRITE_REG = 0x09;
const READ_REG = 0x0a;
const SPI_SET_PARAMS = 0x0b;
const SPI_ATTACH = 0x0d;
const CHANGE_BAUDRATE = 0x0f;
const FLASH_DEFL_BEGIN = 0x10;
const FLASH_DEFL_DATA = 0x11;
const FLASH_DEFL_END = 0x12;
const SPI_FLASH_MD5 = 0x13;
const GET_SECURITY_INFO = 0x14;
const ERASE_FLASH = 0xd0;
const ERASE_REGION = 0xd1;
const READ_FLASH = 0xd2;
const RUN_USER_CODE = 0xd3;

class SlipLayer {
    buffer: number[];
    escaping: boolean;

    logDebug: (...args: unknown[]) => void;
    logError: (...args: unknown[]) => void;

    /** Enable/disable verbose SLIP logging (formatting work still gated by logPackets) */
    verbose: boolean;
    /** Enable/disable packet hexdumps */
    logPackets: boolean;

    constructor() {
        this.buffer = [];
        this.escaping = false;
        this.verbose = true;
        this.logPackets = false;

        this.logDebug = () => {};
        this.logError = () => {};
    }

    /**
     * Log SLIP layer data as a small hex/ascii dump.
     * `type` is 'ENCODE' or 'DECODE'.
     */
    logSlipData(data: Uint8Array, type: "ENCODE" | "DECODE", label: string, maxBytes = 128) {
        if (!this.verbose || !this.logPackets) return;

        const isEncode = type === "ENCODE";
        const symbol = isEncode ? "▶" : "◀";

        const bytesToShow = Math.min(data.length, maxBytes);
        const truncated = data.length > maxBytes;

        let hexStr = "";
        let asciiStr = "";
        const lines: string[] = [];

        for (let i = 0; i < bytesToShow; i++) {
            const b = data[i];
            hexStr += b.toString(16).padStart(2, "0").toUpperCase() + " ";
            asciiStr += b >= 32 && b <= 126 ? String.fromCharCode(b) : ".";
            if ((i + 1) % 16 === 0 || i === bytesToShow - 1) {
                const hexPadding = " ".repeat(Math.max(0, (16 - ((i % 16) + 1)) * 3));
                lines.push(`    ${hexStr}${hexPadding} | ${asciiStr}`);
                hexStr = "";
                asciiStr = "";
            }
        }

        const truncMsg = truncated ? ` (showing ${bytesToShow}/${data.length} bytes)` : "";
        this.logDebug(`${symbol} SLIP ${type} ${label} [${data.length} bytes]${truncMsg}`);
        for (const line of lines) this.logDebug(line);
    }

    encode(packet: Uint8Array): Uint8Array {
        const SLIP_END = 0xc0;
        const SLIP_ESC = 0xdb;
        const SLIP_ESC_END = 0xdc;
        const SLIP_ESC_ESC = 0xdd;

        if (this.logPackets) {
            this.logSlipData(packet, "ENCODE", "Payload before framing");
        }

        const slipFrame: number[] = [SLIP_END];

        for (const byte of packet) {
            if (byte === SLIP_END) {
                slipFrame.push(SLIP_ESC, SLIP_ESC_END);
            } else if (byte === SLIP_ESC) {
                slipFrame.push(SLIP_ESC, SLIP_ESC_ESC);
            } else {
                slipFrame.push(byte);
            }
        }

        slipFrame.push(SLIP_END);
        return new Uint8Array(slipFrame);
    }

    decode(value: Uint8Array): Uint8Array[] {
        const SLIP_END = 0xc0;
        const SLIP_ESC = 0xdb;
        const SLIP_ESC_END = 0xdc;
        const SLIP_ESC_ESC = 0xdd;

        const outputPackets: Uint8Array[] = [];

        for (const byte of value) {
            if (byte === SLIP_END) {
                if (this.buffer.length > 0) {
                    outputPackets.push(new Uint8Array(this.buffer));
                    this.buffer = [];
                }
            } else if (this.escaping) {
                if (byte === SLIP_ESC_END) {
                    this.buffer.push(SLIP_END);
                } else if (byte === SLIP_ESC_ESC) {
                    this.buffer.push(SLIP_ESC);
                }
                this.escaping = false;
            } else if (byte === SLIP_ESC) {
                this.escaping = true;
            } else {
                this.buffer.push(byte);
            }
        }

        if (this.logPackets) {
            for (let i = 0; i < outputPackets.length; i++) {
                const label =
                    outputPackets.length > 1 ? `Decoded packet ${i + 1}/${outputPackets.length}` : "Decoded packet";
                this.logSlipData(outputPackets[i], "DECODE", label);
            }
        }

        return outputPackets;
    }
}

export class RevvoxFlasher {
    port: SerialPort | null;
    currentAddress: number;

    current_chip: string;
    devMode: boolean;
    stubLoaded: boolean;
    responseHandlers: Map<number, (response: any) => Promise<void> | void>;
    chip_magic_addr: number;
    chip_descriptions: any;

    buffer: number[];
    escaping: boolean;
    slipLayer: SlipLayer;

    logDebug: (...args: unknown[]) => void;
    logError: (...args: unknown[]) => void;
    reader: ReadableStreamDefaultReader<Uint8Array> | null;

    /** Prevent concurrent command execution (ROM loader is not re-entrant) */
    private _commandLock: Promise<any>;

    /** Enable/disable verbose serial (RX/TX) hexdumps */
    verboseSerial: boolean;

    disconnected?: () => void;

    constructor() {
        this.port = null;
        this.currentAddress = 0x0000;

        this.current_chip = "none";
        this.devMode = false;
        this.stubLoaded = false;
        this.responseHandlers = new Map();
        this.chip_magic_addr = 0x40001000;
        this.chip_descriptions = new ChipDescriptions().chip_descriptions;

        this.buffer = [];
        this.escaping = false;
        this.slipLayer = new SlipLayer();

        this.logDebug = () => {};
        this.logError = () => {};
        this.reader = null;
        /* Command execution lock to prevent concurrent command execution */
        this._commandLock = Promise.resolve();

        /* Verbose serial logging */
        this.verboseSerial = false;
    }
    /**
     * Log serial RX/TX data as hex/ascii dump (for debugging).
     */
    logSerialData(data: Uint8Array, direction: "TX" | "RX", maxBytes = 256) {
        if (!this.verboseSerial) return;

        const bytesToShow = Math.min(data.length, maxBytes);
        const truncated = data.length > maxBytes;

        let hexStr = "";
        let asciiStr = "";
        const lines: string[] = [];

        for (let i = 0; i < bytesToShow; i++) {
            const b = data[i];
            hexStr += b.toString(16).padStart(2, "0").toUpperCase() + " ";
            asciiStr += b >= 32 && b <= 126 ? String.fromCharCode(b) : ".";
            if ((i + 1) % 16 === 0 || i === bytesToShow - 1) {
                const hexPadding = " ".repeat(Math.max(0, (16 - ((i % 16) + 1)) * 3));
                lines.push(`  ${hexStr}${hexPadding} | ${asciiStr}`);
                hexStr = "";
                asciiStr = "";
            }
        }

        const truncMsg = truncated ? ` (showing ${bytesToShow}/${data.length} bytes)` : "";
        this.logDebug(`[${direction}] [${data.length} bytes]${truncMsg}`);
        for (const line of lines) this.logDebug(line);
    }

    async openPort(baudRate = 921600): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                this.port = await navigator.serial.requestPort();
                await this.port.open({ baudRate: baudRate });
            } catch (error) {
                reject(error);
                return;
            }

            // Register for device lost
            navigator.serial.addEventListener("disconnect", (event: any) => {
                if (event.target === this.port) {
                    this.logError("The device was disconnected");
                    void this.disconnect();
                }
            });

            this.port!.addEventListener("close" as any, () => {
                this.logError("Serial port closed");
                void this.disconnect();
            });

            resolve();

            this.reader = this.port!.readable!.getReader();

            try {
                while (true) {
                    const { value, done } = await this.reader.read();
                    if (done) {
                        break;
                    }
                    if (value) {
                        this.logSerialData(value, "RX");
                        const packets = this.slipLayer.decode(value);
                        for (const packet of packets) {
                            await this.processPacket(packet);
                        }
                    }
                }
            } catch {
            } finally {
                if (this.reader) {
                    this.reader.releaseLock();
                    this.reader = null;
                }
            }
        });
    }

    async readReg(addr: number): Promise<number> {
        return this.executeCommand(
            this.buildCommandPacketU32(READ_REG, addr),
            async (resolve, reject, responsePacket) => {
                if (responsePacket) {
                    resolve(responsePacket.value);
                } else {
                    reject("Failed to read register");
                }
            }
        );
    }

    async isStubLoader(): Promise<boolean> {
        return this.executeCommand(
            this.buildCommandPacketU32(READ_REG, this.chip_magic_addr),
            async (resolve, reject, responsePacket) => {
                if (responsePacket && responsePacket.data) {
                    if (responsePacket.data.length === 2) {
                        resolve(true);
                    }
                    if (responsePacket.data.length === 4) {
                        resolve(false);
                    }
                    reject("Unexpected length");
                } else {
                    reject("Failed to read register");
                }
            }
        );
    }

    async executeCommand(
        packet: { command: number; payload: Uint8Array },
        callback?: (resolve: (value: any) => void, reject: (reason?: any) => void, responsePacket: any) => void,
        default_callback?: (resolve: (value: any) => void, reject: (reason?: any) => void, rawData: Uint8Array) => void,
        timeout = 500,
        hasTimeoutCbr: (() => boolean) | null = null
    ): Promise<any> {
        /* Create command promise first */
        const commandPromise = this._executeCommandUnlocked(packet, callback, default_callback, timeout, hasTimeoutCbr);

        /* Chain it to the lock, ensuring lock always continues even on error */
        this._commandLock = this._commandLock.then(
            () => commandPromise,
            () => commandPromise /* On previous error, still execute our command */
        );

        /* Return our command directly to propagate result/error to caller */
        return commandPromise;
    }

    /**
     * Internal command execution
     */
    private async _executeCommandUnlocked(
        packet: { command: number; payload: Uint8Array },
        callback?: (resolve: (value: any) => void, reject: (reason?: any) => void, responsePacket: any) => void,
        default_callback?: (resolve: (value: any) => void, reject: (reason?: any) => void, rawData: Uint8Array) => void,
        timeout = 500,
        hasTimeoutCbr: (() => boolean) | null = null
    ): Promise<any> {
        if (!this.port || !this.port.writable) {
            throw new Error("Port is not writable.");
        }

        const pkt = this.parsePacket(packet.payload);

        /* Log command execution with parameters */
        const commandNames: Record<number, string> = {
            0x02: "FLASH_BEGIN",
            0x03: "FLASH_DATA",
            0x04: "FLASH_END",
            0x05: "MEM_BEGIN",
            0x06: "MEM_END",
            0x07: "MEM_DATA",
            0x08: "SYNC",
            0x09: "WRITE_REG",
            0x0a: "READ_REG",
            0x0b: "SPI_SET_PARAMS",
            0x0d: "SPI_ATTACH",
            0x0f: "CHANGE_BAUDRATE",
            0x10: "FLASH_DEFL_BEGIN",
            0x11: "FLASH_DEFL_DATA",
            0x12: "FLASH_DEFL_END",
            0x14: "GET_SECURITY_INFO",
            0xd0: "ERASE_FLASH",
            0xd1: "ERASE_REGION",
            0xd2: "READ_FLASH",
            0xd3: "RUN_USER_CODE",
        };
        const cmdName = commandNames[packet.command] ?? `0x${packet.command.toString(16)}`;
        this.logDebug(`[CMD] ${cmdName} (0x${packet.command.toString(16).padStart(2, "0")})`, "params:", pkt);

        this.dumpPacket(pkt);

        return new Promise(async (resolve, reject) => {
            /* Register response handlers */
            this.responseHandlers.clear();

            let settled = false;
            const settleResolve = (value: any) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeoutHandle);
                resolve(value);
            };
            const settleReject = (reason?: any) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeoutHandle);
                reject(reason);
            };

            this.responseHandlers.set(packet.command, async (response) => {
                if (settled) return;
                if (callback) {
                    return callback(settleResolve, settleReject, response);
                }
            });

            if (default_callback) {
                this.responseHandlers.set(-1, async (response) => {
                    if (settled) return;
                    return default_callback(settleResolve, settleReject, response);
                });
            }

            /* Set timeout handler */
            const timeoutHandle = setTimeout(() => {
                if (settled) return;

                if (hasTimeoutCbr) {
                    if (hasTimeoutCbr()) {
                        settleReject(new Error(`Timeout in command ${packet.command}`));
                    }
                } else {
                    settleReject(
                        new Error(`Timeout after ${timeout} ms waiting for response to command ${packet.command}`)
                    );
                }
            }, timeout);

            /* Send the packet with proper error handling */
            let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
            try {
                writer = this.port!.writable!.getWriter();
                const slipFrame = this.slipLayer.encode(packet.payload);
                this.logSerialData(slipFrame, "TX");
                await writer.write(slipFrame);
            } catch (error) {
                clearTimeout(timeoutHandle);
                settleReject(error);
            } finally {
                if (writer) {
                    try {
                        writer.releaseLock();
                    } catch {
                        /* ignore */
                    }
                }
            }
        });
    }

    async disconnect(): Promise<void> {
        navigator.serial.removeEventListener("disconnect", this.disconnect as any);

        if (this.reader) {
            try {
                await this.reader.cancel();
            } catch (error) {
                this.logError("Error cancelling reader:", error);
            }
        }

        if (this.port) {
            try {
                this.port.removeEventListener("close" as any, this.disconnect as any);
                await this.port.close();
            } catch (error) {
                this.logError("Error during disconnect:", error);
            }
            this.port = null;
        }

        this.disconnected && this.disconnected();
    }

    /**
     * Attempts to put the ESP device into bootloader mode using RTS/DTR signals.
     * Relies on the common DTR=EN, RTS=GPIO0 circuit. May not work on all boards.
     * @returns {Promise<boolean>} True if the sequence was sent, false if an error occurred (e.g., signals not supported).
     */
    async hardReset(bootloader = true): Promise<boolean> {
        if (!this.port) {
            this.logError("Port is not open. Cannot set signals.");
            return false;
        }

        this.logDebug("Automatic bootloader reset sequence...");

        try {
            await this.port.setSignals({
                dataTerminalReady: false,
                requestToSend: false,
            } as any);
            await this.port.setSignals({
                dataTerminalReady: bootloader,
                requestToSend: true,
            } as any);
            await this.port.setSignals({
                dataTerminalReady: false,
                requestToSend: bootloader,
            } as any);
            await new Promise((resolve) => setTimeout(resolve, 100));

            return true;
        } catch (error) {
            this.logError(
                `Could not set signals for automatic reset: ${error}. Please ensure device is in bootloader mode manually.`
            );
            return false;
        }
    }

    base64ToByteArray(base64: string): Uint8Array {
        const binaryString = atob(base64);
        const byteArray = new Uint8Array(binaryString.length);
        for (let index = 0; index < binaryString.length; index++) {
            byteArray[index] = binaryString.charCodeAt(index);
        }
        return byteArray;
    }

    async downloadMem(address: number, payload: string): Promise<void> {
        const binary = this.base64ToByteArray(payload);

        await this.executeCommand(
            this.buildCommandPacketU32(MEM_BEGIN, binary.length, 1, binary.length, address),
            async (resolve) => {
                resolve(undefined);
            }
        );
        await this.executeCommand(
            this.buildCommandPacketU32(MEM_DATA, binary.length, 0, 0, 0, binary),
            async (resolve) => {
                resolve(undefined);
            }
        );
    }

    async sync(): Promise<void> {
        const maxRetries = 10;
        const retryDelayMs = 100; // Delay between retries
        const syncTimeoutMs = 250; // Timeout for each individual sync attempt
        let synchronized = false;

        this.logDebug(`Attempting to synchronize (${maxRetries} attempts)...`);

        const syncData = new Uint8Array([0x07, 0x07, 0x12, 0x20, ...Array(32).fill(0x55)]);
        const syncPacket = this.buildCommandPacket(SYNC, syncData);

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            this.logDebug(`Sync attempt ${attempt}...`);
            try {
                await this.executeCommand(
                    syncPacket,
                    async (resolve) => {
                        resolve(undefined);
                    },
                    undefined,
                    syncTimeoutMs
                );

                this.logDebug(`Synchronized successfully on attempt ${attempt}.`);
                synchronized = true;
                break;
            } catch (error: any) {
                this.logDebug(`Sync attempt ${attempt} failed: ${error.message}`);
                if (attempt === maxRetries) {
                    this.logError(`Failed to synchronize after ${maxRetries} attempts.`);
                    throw new Error(`Failed to synchronize with device after ${maxRetries} attempts.`);
                }
                await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
            }
        }

        if (!synchronized) {
            throw new Error("Synchronization failed (unexpected state).");
        }

        this.logDebug("Reading chip magic value...");
        let currentValue: number;
        try {
            currentValue = await this.readReg(this.chip_magic_addr);
        } catch (readError: any) {
            this.logError(`Failed to read magic value after sync: ${readError}`);
            throw new Error(`Successfully synced, but failed to read chip magic value: ${readError.message}`);
        }

        const isMagicValue = (stub: any, value: number): boolean => {
            if (Array.isArray(stub.magic_value)) {
                return stub.magic_value.includes(value);
            } else {
                return stub.magic_value === value;
            }
        };

        let chipDetected = false;

        for (const desc in this.chip_descriptions) {
            if (Object.prototype.hasOwnProperty.call(this.chip_descriptions, desc)) {
                const checkStub = this.chip_descriptions[desc];
                if (isMagicValue(checkStub, currentValue)) {
                    this.logDebug(`Detected Chip: ${desc} (Magic: 0x${currentValue.toString(16)})`);
                    this.current_chip = desc;
                    chipDetected = true;
                    break;
                }
            }
        }

        if (!chipDetected) {
            this.logError(`Synced, but chip magic value 0x${currentValue.toString(16)} is unknown.`);
            this.current_chip = "unknown";
        }
    }

    async readMac(): Promise<string | undefined> {
        const chip = this.chip_descriptions[this.current_chip];
        const register1 = await this.readReg(chip.mac_efuse_reg);
        const register2 = await this.readReg(chip.mac_efuse_reg + 4);

        if (!register1 || !register2) {
            return;
        }

        const lower = register1 >>> 0;
        const higher = (register2 >>> 0) & 0xffff;

        const macBytes = new Uint8Array(6);
        macBytes[0] = (higher >> 8) & 0xff;
        macBytes[1] = higher & 0xff;
        macBytes[2] = (lower >> 24) & 0xff;
        macBytes[3] = (lower >> 16) & 0xff;
        macBytes[4] = (lower >> 8) & 0xff;
        macBytes[5] = lower & 0xff;

        function toHex(byte: number): string {
            const hexString = byte.toString(16);
            return hexString.length === 1 ? `0${hexString}` : hexString;
        }

        const mac = Array.from(macBytes)
            .map((byte) => toHex(byte))
            .join(":");

        return mac;
    }

    async testReliability(cbr?: (progressPercentage: number) => void): Promise<boolean> {
        const chip = this.chip_descriptions[this.current_chip];
        let reference = 0;

        try {
            reference = await this.executeCommand(
                this.buildCommandPacketU32(READ_REG, chip.mac_efuse_reg),
                async (resolve, reject, responsePacket) => {
                    if (responsePacket) {
                        resolve(responsePacket.value);
                    } else {
                        this.logError("Test read failed");
                        reject("Test read failed");
                    }
                }
            );
        } catch (error: any) {
            this.logError("Test read failed due to an error", `${error.message}`);
            return false;
        }

        const duration = 1000;
        const endTime = Date.now() + duration;

        let totalReads = 0;
        let totalTime = 0;

        while (Date.now() < endTime) {
            try {
                const startTime = Date.now();

                const testread = await this.executeCommand(
                    this.buildCommandPacketU32(READ_REG, chip.mac_efuse_reg),
                    async (resolve, reject, responsePacket) => {
                        if (responsePacket) {
                            resolve(responsePacket.value);
                        } else {
                            reject("Test read failed");
                        }
                    }
                );

                const endTimeRead = Date.now();
                const readDuration = endTimeRead - startTime;

                totalTime += readDuration;
                totalReads++;

                const elapsed = Date.now() - (endTime - duration);
                const progressPercentage = Math.min(100, (elapsed / duration) * 100);
                cbr && cbr(progressPercentage);

                if (testread !== reference) {
                    this.logError(
                        `Test read failed! Expected: 0x${reference.toString(16).padStart(8, "0")}, but got: 0x${testread
                            .toString(16)
                            .padStart(8, "0")}`
                    );
                    break;
                }
            } catch (error: any) {
                this.logError("Test read failed due to an error", `${error.message}`);
                return false;
            }
        }

        if (totalReads > 0) {
            const averageTime = totalTime / totalReads;
            this.logDebug(`Average read time: ${averageTime.toFixed(2)} ms over ${totalReads} reads.`);
        }

        return true;
    }

    async downloadStub(): Promise<boolean> {
        const stub = this.chip_descriptions[this.current_chip].stub;

        await this.downloadMem(stub.data_start, stub.data);
        await this.downloadMem(stub.text_start, stub.text);

        try {
            await this.executeCommand(
                this.buildCommandPacketU32(MEM_END, 0, stub.entry),
                async () => {
                    this.logDebug("Final MEM_END ACK");
                },
                async (resolve, reject, rawData: Uint8Array) => {
                    const decoder = new TextDecoder("utf-8");
                    const responseData = decoder.decode(rawData);

                    if (responseData === "OHAI") {
                        this.logDebug(`Stub loader executed successfully (received ${responseData})`);
                        this.stubLoaded = true;
                        resolve(undefined);
                    } else {
                        this.logError(`Unexpected stub response: ${responseData}`);
                        reject(`Unexpected response from stub: ${responseData}`);
                    }
                },
                3000
            );
        } catch (error: any) {
            this.logError("Failed to execute stub", "Is the device locked?");
            return false;
        }

        try {
            await this.executeCommand(
                this.buildCommandPacketU32(SPI_SET_PARAMS, 0, 0x800000, 64 * 1024, 4 * 1024, 256, 0xffff),
                async (resolve) => {
                    this.logDebug("SPI_SET_PARAMS configured");
                    resolve(undefined);
                }
            );
        } catch (error: any) {
            this.logError("Failed to configure SPI parameters", error.message);
            return false;
        }

        return true;
    }

    /**
     * Write data to flash memory (plain, no verification)
     */
    async writeFlashPlain(
        address: number,
        data: Uint8Array,
        progressCallback?: (bytesWritten: number, totalBytes: number) => void
    ): Promise<void> {
        const MAX_PACKET_SIZE = 0x1000;
        const packets = Math.ceil(data.length / MAX_PACKET_SIZE);

        await this.executeCommand(
            this.buildCommandPacketU32(
                FLASH_BEGIN,
                data.length,
                packets,
                Math.min(MAX_PACKET_SIZE, data.length),
                address
            ),
            async (resolve) => resolve(undefined)
        );

        let seq = 0;
        for (let offset = 0; offset < data.length; offset += MAX_PACKET_SIZE) {
            const chunk = data.slice(offset, offset + MAX_PACKET_SIZE);

            await this.executeCommand(
                this.buildCommandPacketU32(FLASH_DATA, chunk.length, seq++, 0, 0, chunk),
                async (resolve) => resolve(undefined),
                undefined,
                5000
            );

            progressCallback && progressCallback(offset + chunk.length, data.length);
        }
    }

    /**
     * Read data from flash memory (plain, but MD5 verified by stub after transfer)
     * Returns the read data if the on-wire MD5 matches.
     */
    async readFlashPlain(
        address: number,
        length = 0x1000,
        progressCallback?: (bytesRead: number, totalBytes: number) => void
    ): Promise<Uint8Array> {
        const performRead = async (cbr?: (bytesRead: number, totalBytes: number) => void): Promise<Uint8Array> => {
            let sectorSize = 0x1000;
            if (sectorSize > length) sectorSize = length;

            const packets = length / sectorSize;
            let packet = 0;
            const ackMax = 64;

            let data = new Uint8Array(0);
            let lastDataTime = Date.now();

            // Timing measurements
            const readStartTime = Date.now();
            const packetLatencies: number[] = [];
            let lastPacketTime = readStartTime;
            let totalBytesReceived = 0;

            return this.executeCommand(
                this.buildCommandPacketU32(READ_FLASH, address, length, sectorSize, ackMax),
                async (resolve) => {
                    packet = 0;
                },
                async (resolve, reject, rawData: Uint8Array) => {
                    const currentTime = Date.now();
                    lastDataTime = currentTime;

                    if (data.length === length) {
                        // Expect MD5 (16 bytes) at the end
                        if (rawData.length === 16) {
                            const calculatedMD5 = this.calculateMD5(data);
                            const receivedMD5 = Array.from(rawData)
                                .map((b) => b.toString(16).padStart(2, "0"))
                                .join("");

                            if (calculatedMD5.toLowerCase() === receivedMD5.toLowerCase()) {
                                const totalTime = currentTime - readStartTime;
                                const dataRate = totalBytesReceived / (totalTime / 1000);
                                const avgLatency =
                                    packetLatencies.length > 0
                                        ? packetLatencies.reduce((a, b) => a + b, 0) / packetLatencies.length
                                        : 0;
                                const minLatency = packetLatencies.length > 0 ? Math.min(...packetLatencies) : 0;
                                const maxLatency = packetLatencies.length > 0 ? Math.max(...packetLatencies) : 0;

                                this.logDebug(`ReadFlash timing: ${totalBytesReceived} bytes in ${totalTime}ms`);
                                this.logDebug(
                                    `  Data rate: ${(dataRate / 1024 / 1024).toFixed(2)} MB/s (${dataRate.toFixed(
                                        0
                                    )} B/s)`
                                );
                                this.logDebug(
                                    `  Packet latency: min=${minLatency}ms, max=${maxLatency}ms, avg=${avgLatency.toFixed(
                                        1
                                    )}ms`
                                );
                                this.logDebug(`  Packets received: ${packetLatencies.length}`);

                                resolve(data);
                            } else {
                                const err = `MD5 mismatch! Expected: ${receivedMD5}, Got: ${calculatedMD5}`;
                                reject(new Error(err));
                            }
                        } else {
                            reject(new Error(`Unknown response length for MD5! Expected: 16, Got: ${rawData.length}`));
                        }
                        return;
                    }

                    // Track packet latency
                    const packetLatency = currentTime - lastPacketTime;
                    packetLatencies.push(packetLatency);
                    lastPacketTime = currentTime;
                    totalBytesReceived += rawData.length;

                    // Append rawData
                    const newData = new Uint8Array(data.length + rawData.length);
                    newData.set(data);
                    newData.set(rawData, data.length);
                    data = newData;

                    cbr && cbr(data.length, length);

                    // Send ACK containing current received length (uint32 LE)
                    const resp = new Uint8Array(4);
                    resp[0] = (data.length >> 0) & 0xff;
                    resp[1] = (data.length >> 8) & 0xff;
                    resp[2] = (data.length >> 16) & 0xff;
                    resp[3] = (data.length >> 24) & 0xff;

                    const slipFrame = this.slipLayer.encode(resp);
                    this.logSerialData(slipFrame, "TX");
                    const writer = this.port!.writable!.getWriter();
                    try {
                        await writer.write(slipFrame);
                    } finally {
                        writer.releaseLock();
                    }

                    packet++;
                },
                1000 * packets,
                () => Date.now() - lastDataTime > 1000
            );
        };

        return performRead(progressCallback);
    }

    /**
     * Calculate MD5 checksum of flash region on device
     */
    async checksumFlash(address: number, length: number): Promise<string> {
        return this.executeCommand(
            this.buildCommandPacketU32(SPI_FLASH_MD5, address, length, 0, 0),
            async (resolve, reject, responsePacket) => {
                if (responsePacket && responsePacket.data) {
                    const md5 = Array.from((responsePacket.data as Uint8Array).slice(0, 16))
                        .map((b) => b.toString(16).padStart(2, "0"))
                        .join("");
                    resolve(md5);
                } else {
                    reject("No MD5 data received");
                }
            },
            async (resolve, _reject, rawData: Uint8Array) => {
                const decoder = new TextDecoder("utf-8");
                resolve(decoder.decode(rawData).trim());
            },
            Math.max(500, Math.floor(length / 500))
        );
    }

    /**
     * Calculate local MD5 hash (hex)
     */
    calculateMD5(data: Uint8Array | string): string {
        const md5 = new Md5();
        md5.update(data);
        return md5.hex();
    }

    /**
     * Read flash with MD5 verification (device MD5 vs local MD5)
     */
    async readFlash(
        address: number,
        size: number,
        progressCallback?: (read: number, total: number, stage: string) => void
    ): Promise<Uint8Array> {
        const BLOCK_SIZE = 64 * 0x1000;

        // Step 1: Read data in blocks
        this.logDebug(`ReadFlashSafe: Reading ${size} bytes in ${BLOCK_SIZE}-byte blocks...`);
        const allData = new Uint8Array(size);
        let offset = 0;

        while (offset < size) {
            const readSize = Math.min(BLOCK_SIZE, size - offset);
            const blockData = await this.readFlashPlain(address + offset, readSize, (read, _total) => {
                progressCallback && progressCallback(offset + read, size, "Reading");
            });

            allData.set(blockData.slice(0, readSize), offset);
            offset += readSize;

            progressCallback && progressCallback(offset, size, "Reading");
            this.logDebug(`ReadFlashSafe: Read ${offset}/${size} bytes (${Math.round((offset / size) * 100)}%)`);
        }

        this.logDebug(`ReadFlashSafe: Read complete`);

        // Step 2: Local MD5
        progressCallback && progressCallback(size, size, "Calculate MD5 of input");
        this.logDebug(`ReadFlashSafe: Calculating MD5 of read data...`);
        const actualMD5 = this.calculateMD5(allData);
        this.logDebug(`Actual MD5: ${actualMD5}`);

        // Step 3: Device MD5
        progressCallback && progressCallback(size, size, "Calculate MD5 onchip");
        this.logDebug(
            `ReadFlashSafe: Calculating expected MD5 for ${size} bytes at 0x${address.toString(16).padStart(8, "0")}...`
        );
        const expectedMD5 = await this.checksumFlash(address, size);
        this.logDebug(`Expected MD5: ${expectedMD5}`);

        // Step 4: Compare
        if (expectedMD5.toLowerCase() !== actualMD5.toLowerCase()) {
            this.logError(`ReadFlashSafe FAILED: MD5 mismatch!`);
            this.logError(`  Expected: ${expectedMD5}`);
            this.logError(`  Actual:   ${actualMD5}`);
            throw new Error(`MD5 verification failed: expected ${expectedMD5}, got ${actualMD5}`);
        }

        this.logDebug(`ReadFlashSafe: MD5 verification passed ✓`);
        return allData;
    }

    /**
     * Write flash with MD5 verification (device MD5 vs local MD5)
     */
    async writeFlash(
        address: number,
        data: Uint8Array,
        progressCallback?: (written: number, total: number, stage: string) => void
    ): Promise<{ success: boolean; md5: string }> {
        this.logDebug(`WriteFlashSafe: Writing ${data.length} bytes to 0x${address.toString(16).padStart(8, "0")}...`);

        // Step 1: Write
        await this.writeFlashPlain(address, data, (written, total) => {
            progressCallback && progressCallback(written, total, "Writing");
        });
        this.logDebug(`WriteFlashSafe: Write complete`);

        // Step 2: Local MD5
        progressCallback && progressCallback(data.length, data.length, "Calculate MD5 of input");
        this.logDebug(`WriteFlashSafe: Calculating MD5 of ${data.length} bytes to write...`);
        const expectedMD5 = this.calculateMD5(data);
        this.logDebug(`Input data MD5: ${expectedMD5}`);

        // Step 3: Device MD5
        progressCallback && progressCallback(data.length, data.length, "Calculate MD5 onchip");
        this.logDebug(`WriteFlashSafe: Calculating MD5 on device for verification...`);
        const deviceMD5 = await this.checksumFlash(address, data.length);
        this.logDebug(`Device MD5: ${deviceMD5}`);

        // Step 4: Compare
        if (expectedMD5.toLowerCase() !== deviceMD5.toLowerCase()) {
            this.logError(`WriteFlashSafe FAILED: MD5 mismatch!`);
            this.logError(`  Expected: ${expectedMD5}`);
            this.logError(`  Device:   ${deviceMD5}`);
            throw new Error(`MD5 verification failed after write: expected ${expectedMD5}, got ${deviceMD5}`);
        }

        this.logDebug(`WriteFlashSafe: MD5 verification passed ✓`);
        progressCallback && progressCallback(data.length, data.length, "Verified");

        return { success: true, md5: expectedMD5 };
    }

    /**
     * Check if flash memory is erased (FF)
     */
    async blankCheck(
        startAddress = 0x000000,
        endAddress = 0x800000,
        cbr?: (
            currentAddress: number,
            startAddress: number,
            endAddress: number,
            blockSize: number,
            erasedBytes: number,
            erasedBytesTotal: number
        ) => void
    ): Promise<void> {
        const blockSize = 0x1000;

        let totalReads = 0;
        let totalTime = 0;
        let erasedBytesTotal = 0;
        let currentAddress = startAddress;

        while (currentAddress < endAddress) {
            try {
                const startTime = Date.now();
                const rawData = await this.readFlashPlain(currentAddress, blockSize);
                const endTimeRead = Date.now();
                const readDuration = endTimeRead - startTime;

                let erasedBytes = 0;
                for (let pos = 0; pos < rawData.length; pos++) {
                    if (rawData[pos] === 0xff) erasedBytes++;
                }

                currentAddress += rawData.length;
                erasedBytesTotal += erasedBytes;
                totalTime += readDuration;
                totalReads++;

                cbr && cbr(currentAddress, startAddress, endAddress, blockSize, erasedBytes, erasedBytesTotal);
            } catch (error: any) {
                this.logError("Read failed due to an error", `${error.message}`);
                await this.disconnect();
                break;
            }
        }

        if (totalReads > 0) {
            const averageTime = totalTime / totalReads;
            this.logDebug(`Average read time: ${averageTime.toFixed(2)} ms over ${totalReads} reads.`);
        }
    }

    /**
     * Write/Read stress test
     */
    async writeReadTest(
        address: number,
        size: number,
        cbr?: (stage: string, step: number, totalSteps: number, percent?: number, result?: any) => void
    ): Promise<any> {
        try {
            this.logDebug(`Test: Reading original ${size} bytes from 0x${address.toString(16).padStart(8, "0")}...`);
            cbr && cbr("reading_original", 0, 3);
            const originalData = await this.readFlashPlain(address, size);
            this.logDebug(`Original data read complete`);

            const dumpSize = Math.min(64, size);

            this.logDebug(`Original data hexdump (first ${dumpSize} bytes):`);
            for (let i = 0; i < dumpSize; i += 16) {
                const chunk = originalData.slice(i, i + 16);
                const hex = Array.from(chunk)
                    .map((b) => b.toString(16).padStart(2, "0"))
                    .join(" ");
                const ascii = Array.from(chunk)
                    .map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : "."))
                    .join("");
                this.logDebug(`  ${(address + i).toString(16).padStart(8, "0")}: ${hex.padEnd(47, " ")} |${ascii}|`);
            }

            this.logDebug(`Test: Generating ${size} bytes of random data...`);
            cbr && cbr("generating_random", 1, 3);
            const randomData = new Uint8Array(size);
            for (let i = 0; i < size; i++) randomData[i] = Math.floor(Math.random() * 256);
            this.logDebug(`Random data generated`);

            this.logDebug(`Random data hexdump (first ${dumpSize} bytes):`);
            for (let i = 0; i < dumpSize; i += 16) {
                const chunk = randomData.slice(i, i + 16);
                const hex = Array.from(chunk)
                    .map((b) => b.toString(16).padStart(2, "0"))
                    .join(" ");
                const ascii = Array.from(chunk)
                    .map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : "."))
                    .join("");
                this.logDebug(`  ${(address + i).toString(16).padStart(8, "0")}: ${hex.padEnd(47, " ")} |${ascii}|`);
            }

            this.logDebug(`Test: Writing ${size} bytes to flash at 0x${address.toString(16).padStart(8, "0")}...`);
            cbr && cbr("writing", 2, 3);
            await this.writeFlashPlain(address, randomData, (written, total) => {
                const percent = Math.round((written / total) * 100);
                cbr && cbr("writing", 2, 3, percent);
            });
            this.logDebug(`Write complete`);

            this.logDebug(`Test: Reading back ${size} bytes from 0x${address.toString(16).padStart(8, "0")}...`);
            cbr && cbr("reading_back", 3, 3);
            const readbackData = await this.readFlashPlain(address, size);
            this.logDebug(`Readback complete`);

            this.logDebug(`Readback data hexdump (first ${dumpSize} bytes):`);
            for (let i = 0; i < dumpSize; i += 16) {
                const chunk = readbackData.slice(i, i + 16);
                const hex = Array.from(chunk)
                    .map((b) => b.toString(16).padStart(2, "0"))
                    .join(" ");
                const ascii = Array.from(chunk)
                    .map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : "."))
                    .join("");
                this.logDebug(`  ${(address + i).toString(16).padStart(8, "0")}: ${hex.padEnd(47, " ")} |${ascii}|`);
            }

            let errors = 0;
            let firstError = -1;
            for (let i = 0; i < size; i++) {
                if (randomData[i] !== readbackData[i]) {
                    if (firstError === -1) firstError = i;
                    errors++;
                }
            }

            const result = {
                success: errors === 0,
                errors,
                firstError,
                address,
                size,
                originalData,
                randomData,
                readbackData,
            };

            if (errors === 0) {
                this.logDebug(`✓ Test PASSED: All ${size} bytes match!`);
            } else {
                this.logError(`✗ Test FAILED: ${errors} byte(s) mismatch!`);
                this.logError(
                    `  First error at offset 0x${firstError.toString(16).padStart(4, "0")} (byte ${firstError})`
                );
                this.logError(
                    `  Expected: 0x${randomData[firstError].toString(16).padStart(2, "0")}, Got: 0x${readbackData[
                        firstError
                    ]
                        .toString(16)
                        .padStart(2, "0")}`
                );
            }

            cbr && cbr("complete", 3, 3, 100, result);
            return result;
        } catch (error: any) {
            this.logError(`Write/Read test failed: ${error.message}`);
            cbr && cbr("error", 0, 3, 0, { success: false, error: error.message });
            throw error;
        }
    }
    buildCommandPacketU32(
        command: number,
        ...values: (number | Uint8Array | undefined)[]
    ): {
        command: number;
        payload: Uint8Array;
    } {
        let totalLength = 0;
        values.forEach((value) => {
            if (typeof value === "number") {
                totalLength += 4;
            } else if (value instanceof Uint8Array) {
                totalLength += value.length;
            }
        });

        const data = new Uint8Array(totalLength);
        let offset = 0;
        values.forEach((value) => {
            if (typeof value === "number") {
                data[offset] = (value >> 0) & 0xff;
                data[offset + 1] = (value >> 8) & 0xff;
                data[offset + 2] = (value >> 16) & 0xff;
                data[offset + 3] = (value >> 24) & 0xff;
                offset += 4;
            } else if (value instanceof Uint8Array) {
                data.set(value, offset);
                offset += value.length;
            }
        });

        return this.buildCommandPacket(command, data);
    }

    buildCommandPacket(command: number, data: Uint8Array): { command: number; payload: Uint8Array } {
        const direction = 0x00;
        const size = data.length;
        let checksum = 0;

        if (size > 32) {
            checksum = 0xef;
            for (let index = 16; index < size; index++) {
                checksum ^= data[index];
            }
        }

        const packet = new Uint8Array(8 + size);
        packet[0] = direction;
        packet[1] = command;
        packet[2] = size & 0xff;
        packet[3] = (size >> 8) & 0xff;
        packet[4] = checksum & 0xff;
        packet[5] = (checksum >> 8) & 0xff;
        packet[6] = (checksum >> 16) & 0xff;
        packet[7] = (checksum >> 24) & 0xff;
        packet.set(data, 8);

        return {
            command,
            payload: packet,
        };
    }

    dumpPacket(pkt: any): void {
        if (!this.devMode) {
            return;
        }
        if (pkt && pkt.dir === 0) {
            this.logDebug("Command: ", pkt);
            this.logDebug(
                `Command raw: ${Array.from(pkt.raw as Uint8Array)
                    .map((byte) => (byte as number).toString(16).padStart(2, "0"))
                    .join(" ")}`
            );
        }
        if (pkt && pkt.dir === 1) {
            this.logDebug("Response: ", pkt);
            this.logDebug(
                `Response raw: ${Array.from(pkt.raw as Uint8Array)
                    .map((byte) => (byte as number).toString(16).padStart(2, "0"))
                    .join(" ")}`
            );
        }
    }

    parsePacket(packet: Uint8Array): any {
        const pkt: any = {};

        pkt.dir = packet[0];
        pkt.command = packet[1];
        pkt.size = packet[2] | (packet[3] << 8);
        pkt.value = (packet[4] | (packet[5] << 8) | (packet[6] << 16) | (packet[7] << 24)) >>> 0;

        if (pkt.dir > 2 || packet.length !== 8 + pkt.size) {
            return null;
        }
        pkt.data = packet.slice(8, 8 + pkt.size);
        pkt.raw = packet;

        return pkt;
    }

    async processPacket(packet: Uint8Array): Promise<void> {
        const pkt = this.parsePacket(packet);

        if (pkt && pkt.dir === 0x01) {
            this.dumpPacket(pkt);
            if (this.responseHandlers.has(pkt.command)) {
                const handler = this.responseHandlers.get(pkt.command);
                if (handler) {
                    await handler(pkt);
                }
            }
        } else {
            if (this.responseHandlers.has(-1)) {
                const handler = this.responseHandlers.get(-1);
                if (handler) {
                    await handler(packet);
                }
            }
        }
    }
}

export class ChipDescriptions {
    chip_descriptions: Record<
        string,
        {
            magic_value: number | number[];
            mac_efuse_reg: number;
            stub: {
                text_start: number;
                bss_start: number;
                text: string;
                data_start: number;
                data: string;
                entry: number;
            };
        }
    >;

    constructor() {
        this.chip_descriptions = {
            esp32s2: {
                mac_efuse_reg: 0x3f41a044,
                magic_value: 0x000007c6,
                stub: {
                    entry: 1077381760,
                    text: "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",
                    text_start: 1077379072,
                    data: "XADKP16ON0AzjzdAR5Q3QL2PN0BTjzdAvY83QB2QN0A6kTdArJE3QFWRN0DpjTdA0JA3QCyRN0BAkDdA0JE3QGiQN0DQkTdAIY83QH6PN0C9jzdAHZA3QDmPN0AqjjdAkJI3QA2UN0AAjTdALZQ3QACNN0AAjTdAAI03QACNN0AAjTdAAI03QACNN0AAjTdAKpI3QACNN0AlkzdADZQ3QAQInwAAAAAAAAAYAQQIBQAAAAAAAAAIAQQIBgAAAAAAAAAAAQQIIQAAAAAAIAAAEQQI3AAAAAAAIAAAEQQIDAAAAAAAIAAAAQQIEgAAAAAAIAAAESAoDAAQAQAA",
                    data_start: 1070279676,
                    bss_start: 1070202880,
                },
            },
            esp32s3: {
                mac_efuse_reg: 0x60007044,
                magic_value: 0x00000009,
                stub: {
                    entry: 1077381760,
                    text: "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",
                    text_start: 1077379072,
                    data: "XADKP16ON0AzjzdAR5Q3QL2PN0BTjzdAvY83QB2QN0A6kTdArJE3QFWRN0DpjTdA0JA3QCyRN0BAkDdA0JE3QGiQN0DQkTdAIY83QH6PN0C9jzdAHZA3QDmPN0AqjjdAkJI3QA2UN0AAjTdALZQ3QACNN0AAjTdAAI03QACNN0AAjTdAAI03QACNN0AAjTdAKpI3QACNN0AlkzdADZQ3QAQInwAAAAAAAAAYAQQIBQAAAAAAAAAIAQQIBgAAAAAAAAAAAQQIIQAAAAAAIAAAEQQI3AAAAAAAIAAAEQQIDAAAAAAAIAAAAQQIEgAAAAAAIAAAESAoDAAQAQAA",
                    data_start: 1070279676,
                    bss_start: 1070202880,
                },
            },
            esp32c3: {
                mac_efuse_reg: 0x60008844,
                magic_value: [0x6921506f, 0x1b31506f, 0x4881606f, 0x4361606f],
                stub: {
                    entry: 1077413584,
                    text: "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",
                    text_start: 1077411840,
                    data: "GEDIP8AKOEAQCzhAaAs4QDYMOECiDDhAUAw4QHIJOEDyCzhAMgw4QHwLOEAiCThAsAs4QCIJOECaCjhA4Ao4QBALOEBoCzhArAo4QNYJOEAgCjhAqAo4QPoOOEAQCzhAug04QLIOOEBiCDhA2g44QGIIOEBiCDhAYgg4QGIIOEBiCDhAYgg4QGIIOEBiCDhAVg04QGIIOEDYDThAsg44QA==",
                    data_start: 1070164916,
                    bss_start: 1070088192,
                },
            },
            esp32c6: {
                mac_efuse_reg: 0x600b0844,
                magic_value: 0x2ce0806f,
                stub: {
                    entry: 1082132164,
                    text: "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",
                    text_start: 1082130432,
                    data: "FACEQHIKgEDCCoBAGguAQOgLgEBUDIBAAgyAQD4JgECkC4BA5AuAQC4LgEDuCIBAYguAQO4IgEBMCoBAkgqAQMIKgEAaC4BAXgqAQKIJgEDSCYBAWgqAQKwOgEDCCoBAbA2AQGQOgEAuCIBAjA6AQC4IgEAuCIBALgiAQC4IgEAuCIBALgiAQC4IgEAuCIBACA2AQC4IgECKDYBAZA6AQA==",
                    data_start: 1082469296,
                    bss_start: 1082392576,
                },
            },
        };
    }
}

/**
 * MD5 Hash Implementation (from js-md5 library)
 * Standalone client-side hashing for data verification
 *
 * Usage:
 *   const hasher = new Md5();
 *   hasher.update(data);
 *   const hex = hasher.hex();
 */
const Md5 = (() => {
    const ARRAY_BUFFER = typeof ArrayBuffer !== "undefined";
    const HEX_CHARS = "0123456789abcdef".split("");
    const EXTRA = [128, 32768, 8388608, -2147483648];
    const SHIFT = [0, 8, 16, 24];
    const FINALIZE_ERROR = "finalize already called";

    // Shared memory (optional)
    let sharedBlocks: Uint32Array | number[];
    let sharedBuffer8: Uint8Array | undefined;

    if (ARRAY_BUFFER) {
        const buffer = new ArrayBuffer(68);
        sharedBuffer8 = new Uint8Array(buffer);
        sharedBlocks = new Uint32Array(buffer);
    } else {
        sharedBlocks = Array(17).fill(0);
    }

    type Message = string | ArrayBuffer | Uint8Array | number[];
    type FormattedMessage = [string | Uint8Array | number[], boolean];

    function formatMessage(message: Message): FormattedMessage {
        if (typeof message === "string") return [message, true];
        if (message instanceof ArrayBuffer) return [new Uint8Array(message), false];
        if (message instanceof Uint8Array) return [message, false];
        if (Array.isArray(message)) return [message, false];
        // Should be unreachable due to Message union, but keep a fallback.
        return [message as unknown as Uint8Array, false];
    }

    class Md5 {
        blocks: Uint32Array | number[];
        buffer8?: Uint8Array;

        h0 = 0;
        h1 = 0;
        h2 = 0;
        h3 = 0;
        start = 0;
        bytes = 0;
        hBytes = 0;

        finalized = false;
        hashed = false;
        first = true;

        lastByteIndex = 0;

        constructor(sharedMemory?: boolean) {
            if (sharedMemory) {
                const b = sharedBlocks as any;
                b[0] =
                    b[16] =
                    b[1] =
                    b[2] =
                    b[3] =
                    b[4] =
                    b[5] =
                    b[6] =
                    b[7] =
                    b[8] =
                    b[9] =
                    b[10] =
                    b[11] =
                    b[12] =
                    b[13] =
                    b[14] =
                    b[15] =
                        0;

                this.blocks = sharedBlocks;
                this.buffer8 = sharedBuffer8;
            } else if (ARRAY_BUFFER) {
                const buffer = new ArrayBuffer(68);
                this.buffer8 = new Uint8Array(buffer);
                this.blocks = new Uint32Array(buffer);
            } else {
                this.blocks = Array(17).fill(0);
            }
        }

        update(message: Message): this {
            if (this.finalized) throw new Error(FINALIZE_ERROR);

            const [msg, isString] = formatMessage(message);
            const blocks = this.blocks as any;
            const buffer8 = this.buffer8;

            let index = 0;
            let i = 0;
            let code = 0;

            const length = isString ? (msg as string).length : (msg as Uint8Array | number[]).length;

            while (index < length) {
                if (this.hashed) {
                    this.hashed = false;
                    blocks[0] = blocks[16];
                    blocks[16] =
                        blocks[1] =
                        blocks[2] =
                        blocks[3] =
                        blocks[4] =
                        blocks[5] =
                        blocks[6] =
                        blocks[7] =
                        blocks[8] =
                        blocks[9] =
                        blocks[10] =
                        blocks[11] =
                        blocks[12] =
                        blocks[13] =
                        blocks[14] =
                        blocks[15] =
                            0;
                }

                if (isString) {
                    const s = msg as string;

                    if (ARRAY_BUFFER) {
                        if (!buffer8) throw new Error("Missing buffer8");
                        for (i = this.start; index < length && i < 64; ++index) {
                            code = s.charCodeAt(index);
                            if (code < 0x80) {
                                buffer8[i++] = code;
                            } else if (code < 0x800) {
                                buffer8[i++] = 0xc0 | (code >>> 6);
                                buffer8[i++] = 0x80 | (code & 0x3f);
                            } else if (code < 0xd800 || code >= 0xe000) {
                                buffer8[i++] = 0xe0 | (code >>> 12);
                                buffer8[i++] = 0x80 | ((code >>> 6) & 0x3f);
                                buffer8[i++] = 0x80 | (code & 0x3f);
                            } else {
                                code = 0x10000 + (((code & 0x3ff) << 10) | (s.charCodeAt(++index) & 0x3ff));
                                buffer8[i++] = 0xf0 | (code >>> 18);
                                buffer8[i++] = 0x80 | ((code >>> 12) & 0x3f);
                                buffer8[i++] = 0x80 | ((code >>> 6) & 0x3f);
                                buffer8[i++] = 0x80 | (code & 0x3f);
                            }
                        }
                    } else {
                        for (i = this.start; index < length && i < 64; ++index) {
                            code = s.charCodeAt(index);
                            if (code < 0x80) {
                                blocks[i >>> 2] |= code << SHIFT[i++ & 3];
                            } else if (code < 0x800) {
                                blocks[i >>> 2] |= (0xc0 | (code >>> 6)) << SHIFT[i++ & 3];
                                blocks[i >>> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                            } else if (code < 0xd800 || code >= 0xe000) {
                                blocks[i >>> 2] |= (0xe0 | (code >>> 12)) << SHIFT[i++ & 3];
                                blocks[i >>> 2] |= (0x80 | ((code >>> 6) & 0x3f)) << SHIFT[i++ & 3];
                                blocks[i >>> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                            } else {
                                code = 0x10000 + (((code & 0x3ff) << 10) | (s.charCodeAt(++index) & 0x3ff));
                                blocks[i >>> 2] |= (0xf0 | (code >>> 18)) << SHIFT[i++ & 3];
                                blocks[i >>> 2] |= (0x80 | ((code >>> 12) & 0x3f)) << SHIFT[i++ & 3];
                                blocks[i >>> 2] |= (0x80 | ((code >>> 6) & 0x3f)) << SHIFT[i++ & 3];
                                blocks[i >>> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
                            }
                        }
                    }
                } else {
                    const a = msg as Uint8Array | number[];

                    if (ARRAY_BUFFER) {
                        if (!buffer8) throw new Error("Missing buffer8");
                        for (i = this.start; index < length && i < 64; ++index) {
                            buffer8[i++] = a[index] as number;
                        }
                    } else {
                        for (i = this.start; index < length && i < 64; ++index) {
                            blocks[i >>> 2] |= (a[index] as number) << SHIFT[i++ & 3];
                        }
                    }
                }

                this.lastByteIndex = i;
                this.bytes += i - this.start;

                if (i >= 64) {
                    this.start = i - 64;
                    this.hash();
                    this.hashed = true;
                } else {
                    this.start = i;
                }
            }

            if (this.bytes > 4294967295) {
                this.hBytes += ((this.bytes / 4294967296) << 0) as number;
                this.bytes = this.bytes % 4294967296;
            }

            return this;
        }

        finalize(): void {
            if (this.finalized) return;

            this.finalized = true;

            const blocks = this.blocks as any;
            let i = this.lastByteIndex;

            blocks[i >>> 2] |= EXTRA[i & 3];

            if (i >= 56) {
                if (!this.hashed) {
                    this.hash();
                }

                blocks[0] = blocks[16];
                blocks[16] =
                    blocks[1] =
                    blocks[2] =
                    blocks[3] =
                    blocks[4] =
                    blocks[5] =
                    blocks[6] =
                    blocks[7] =
                    blocks[8] =
                    blocks[9] =
                    blocks[10] =
                    blocks[11] =
                    blocks[12] =
                    blocks[13] =
                    blocks[14] =
                    blocks[15] =
                        0;
            }

            blocks[14] = this.bytes << 3;
            blocks[15] = (this.hBytes << 3) | (this.bytes >>> 29);

            this.hash();
        }

        hash(): void {
            let a: number;
            let b: number;
            let c: number;
            let d: number;
            let bc: number;
            let da: number;
            const blocks = this.blocks as any;

            if (this.first) {
                a = blocks[0] - 680876937;
                a = (((a << 7) | (a >>> 25)) - 271733879) << 0;
                d = (-1732584194 ^ (a & 2004318071)) + blocks[1] - 117830708;
                d = (((d << 12) | (d >>> 20)) + a) << 0;
                c = (-271733879 ^ (d & (a ^ -271733879))) + blocks[2] - 1126478375;
                c = (((c << 17) | (c >>> 15)) + d) << 0;
                b = (a ^ (c & (d ^ a))) + blocks[3] - 1316259209;
                b = (((b << 22) | (b >>> 10)) + c) << 0;
            } else {
                a = this.h0;
                b = this.h1;
                c = this.h2;
                d = this.h3;
                a += (d ^ (b & (c ^ d))) + blocks[0] - 680876936;
                a = (((a << 7) | (a >>> 25)) + b) << 0;
                d += (c ^ (a & (b ^ c))) + blocks[1] - 389564586;
                d = (((d << 12) | (d >>> 20)) + a) << 0;
                c += (b ^ (d & (a ^ b))) + blocks[2] + 606105819;
                c = (((c << 17) | (c >>> 15)) + d) << 0;
                b += (a ^ (c & (d ^ a))) + blocks[3] - 1044525330;
                b = (((b << 22) | (b >>> 10)) + c) << 0;
            }

            a += (d ^ (b & (c ^ d))) + blocks[4] - 176418897;
            a = (((a << 7) | (a >>> 25)) + b) << 0;
            d += (c ^ (a & (b ^ c))) + blocks[5] + 1200080426;
            d = (((d << 12) | (d >>> 20)) + a) << 0;
            c += (b ^ (d & (a ^ b))) + blocks[6] - 1473231341;
            c = (((c << 17) | (c >>> 15)) + d) << 0;
            b += (a ^ (c & (d ^ a))) + blocks[7] - 45705983;
            b = (((b << 22) | (b >>> 10)) + c) << 0;
            a += (d ^ (b & (c ^ d))) + blocks[8] + 1770035416;
            a = (((a << 7) | (a >>> 25)) + b) << 0;
            d += (c ^ (a & (b ^ c))) + blocks[9] - 1958414417;
            d = (((d << 12) | (d >>> 20)) + a) << 0;
            c += (b ^ (d & (a ^ b))) + blocks[10] - 42063;
            c = (((c << 17) | (c >>> 15)) + d) << 0;
            b += (a ^ (c & (d ^ a))) + blocks[11] - 1990404162;
            b = (((b << 22) | (b >>> 10)) + c) << 0;
            a += (d ^ (b & (c ^ d))) + blocks[12] + 1804603682;
            a = (((a << 7) | (a >>> 25)) + b) << 0;
            d += (c ^ (a & (b ^ c))) + blocks[13] - 40341101;
            d = (((d << 12) | (d >>> 20)) + a) << 0;
            c += (b ^ (d & (a ^ b))) + blocks[14] - 1502002290;
            c = (((c << 17) | (c >>> 15)) + d) << 0;
            b += (a ^ (c & (d ^ a))) + blocks[15] + 1236535329;
            b = (((b << 22) | (b >>> 10)) + c) << 0;
            a += (c ^ (d & (b ^ c))) + blocks[1] - 165796510;
            a = (((a << 5) | (a >>> 27)) + b) << 0;
            d += (b ^ (c & (a ^ b))) + blocks[6] - 1069501632;
            d = (((d << 9) | (d >>> 23)) + a) << 0;
            c += (a ^ (b & (d ^ a))) + blocks[11] + 643717713;
            c = (((c << 14) | (c >>> 18)) + d) << 0;
            b += (d ^ (a & (c ^ d))) + blocks[0] - 373897302;
            b = (((b << 20) | (b >>> 12)) + c) << 0;
            a += (c ^ (d & (b ^ c))) + blocks[5] - 701558691;
            a = (((a << 5) | (a >>> 27)) + b) << 0;
            d += (b ^ (c & (a ^ b))) + blocks[10] + 38016083;
            d = (((d << 9) | (d >>> 23)) + a) << 0;
            c += (a ^ (b & (d ^ a))) + blocks[15] - 660478335;
            c = (((c << 14) | (c >>> 18)) + d) << 0;
            b += (d ^ (a & (c ^ d))) + blocks[4] - 405537848;
            b = (((b << 20) | (b >>> 12)) + c) << 0;
            a += (c ^ (d & (b ^ c))) + blocks[9] + 568446438;
            a = (((a << 5) | (a >>> 27)) + b) << 0;
            d += (b ^ (c & (a ^ b))) + blocks[14] - 1019803690;
            d = (((d << 9) | (d >>> 23)) + a) << 0;
            c += (a ^ (b & (d ^ a))) + blocks[3] - 187363961;
            c = (((c << 14) | (c >>> 18)) + d) << 0;
            b += (d ^ (a & (c ^ d))) + blocks[8] + 1163531501;
            b = (((b << 20) | (b >>> 12)) + c) << 0;
            a += (c ^ (d & (b ^ c))) + blocks[13] - 1444681467;
            a = (((a << 5) | (a >>> 27)) + b) << 0;
            d += (b ^ (c & (a ^ b))) + blocks[2] - 51403784;
            d = (((d << 9) | (d >>> 23)) + a) << 0;
            c += (a ^ (b & (d ^ a))) + blocks[7] + 1735328473;
            c = (((c << 14) | (c >>> 18)) + d) << 0;
            b += (d ^ (a & (c ^ d))) + blocks[12] - 1926607734;
            b = (((b << 20) | (b >>> 12)) + c) << 0;
            bc = b ^ c;
            a += (bc ^ d) + blocks[5] - 378558;
            a = (((a << 4) | (a >>> 28)) + b) << 0;
            d += (bc ^ a) + blocks[8] - 2022574463;
            d = (((d << 11) | (d >>> 21)) + a) << 0;
            da = d ^ a;
            c += (da ^ b) + blocks[11] + 1839030562;
            c = (((c << 16) | (c >>> 16)) + d) << 0;
            b += (da ^ c) + blocks[14] - 35309556;
            b = (((b << 23) | (b >>> 9)) + c) << 0;
            bc = b ^ c;
            a += (bc ^ d) + blocks[1] - 1530992060;
            a = (((a << 4) | (a >>> 28)) + b) << 0;
            d += (bc ^ a) + blocks[4] + 1272893353;
            d = (((d << 11) | (d >>> 21)) + a) << 0;
            da = d ^ a;
            c += (da ^ b) + blocks[7] - 155497632;
            c = (((c << 16) | (c >>> 16)) + d) << 0;
            b += (da ^ c) + blocks[10] - 1094730640;
            b = (((b << 23) | (b >>> 9)) + c) << 0;
            bc = b ^ c;
            a += (bc ^ d) + blocks[13] + 681279174;
            a = (((a << 4) | (a >>> 28)) + b) << 0;
            d += (bc ^ a) + blocks[0] - 358537222;
            d = (((d << 11) | (d >>> 21)) + a) << 0;
            da = d ^ a;
            c += (da ^ b) + blocks[3] - 722521979;
            c = (((c << 16) | (c >>> 16)) + d) << 0;
            b += (da ^ c) + blocks[6] + 76029189;
            b = (((b << 23) | (b >>> 9)) + c) << 0;
            bc = b ^ c;
            a += (bc ^ d) + blocks[9] - 640364487;
            a = (((a << 4) | (a >>> 28)) + b) << 0;
            d += (bc ^ a) + blocks[12] - 421815835;
            d = (((d << 11) | (d >>> 21)) + a) << 0;
            da = d ^ a;
            c += (da ^ b) + blocks[15] + 530742520;
            c = (((c << 16) | (c >>> 16)) + d) << 0;
            b += (da ^ c) + blocks[2] - 995338651;
            b = (((b << 23) | (b >>> 9)) + c) << 0;
            a += (c ^ (b | ~d)) + blocks[0] - 198630844;
            a = (((a << 6) | (a >>> 26)) + b) << 0;
            d += (b ^ (a | ~c)) + blocks[7] + 1126891415;
            d = (((d << 10) | (d >>> 22)) + a) << 0;
            c += (a ^ (d | ~b)) + blocks[14] - 1416354905;
            c = (((c << 15) | (c >>> 17)) + d) << 0;
            b += (d ^ (c | ~a)) + blocks[5] - 57434055;
            b = (((b << 21) | (b >>> 11)) + c) << 0;
            a += (c ^ (b | ~d)) + blocks[12] + 1700485571;
            a = (((a << 6) | (a >>> 26)) + b) << 0;
            d += (b ^ (a | ~c)) + blocks[3] - 1894986606;
            d = (((d << 10) | (d >>> 22)) + a) << 0;
            c += (a ^ (d | ~b)) + blocks[10] - 1051523;
            c = (((c << 15) | (c >>> 17)) + d) << 0;
            b += (d ^ (c | ~a)) + blocks[1] - 2054922799;
            b = (((b << 21) | (b >>> 11)) + c) << 0;
            a += (c ^ (b | ~d)) + blocks[8] + 1873313359;
            a = (((a << 6) | (a >>> 26)) + b) << 0;
            d += (b ^ (a | ~c)) + blocks[15] - 30611744;
            d = (((d << 10) | (d >>> 22)) + a) << 0;
            c += (a ^ (d | ~b)) + blocks[6] - 1560198380;
            c = (((c << 15) | (c >>> 17)) + d) << 0;
            b += (d ^ (c | ~a)) + blocks[13] + 1309151649;
            b = (((b << 21) | (b >>> 11)) + c) << 0;
            a += (c ^ (b | ~d)) + blocks[4] - 145523070;
            a = (((a << 6) | (a >>> 26)) + b) << 0;
            d += (b ^ (a | ~c)) + blocks[11] - 1120210379;
            d = (((d << 10) | (d >>> 22)) + a) << 0;
            c += (a ^ (d | ~b)) + blocks[2] + 718787259;
            c = (((c << 15) | (c >>> 17)) + d) << 0;
            b += (d ^ (c | ~a)) + blocks[9] - 343485551;
            b = (((b << 21) | (b >>> 11)) + c) << 0;

            if (this.first) {
                this.h0 = (a + 1732584193) << 0;
                this.h1 = (b - 271733879) << 0;
                this.h2 = (c - 1732584194) << 0;
                this.h3 = (d + 271733878) << 0;
                this.first = false;
            } else {
                this.h0 = (this.h0 + a) << 0;
                this.h1 = (this.h1 + b) << 0;
                this.h2 = (this.h2 + c) << 0;
                this.h3 = (this.h3 + d) << 0;
            }
        }

        hex(): string {
            this.finalize();

            const h0 = this.h0;
            const h1 = this.h1;
            const h2 = this.h2;
            const h3 = this.h3;

            return (
                HEX_CHARS[(h0 >>> 4) & 0x0f] +
                HEX_CHARS[h0 & 0x0f] +
                HEX_CHARS[(h0 >>> 12) & 0x0f] +
                HEX_CHARS[(h0 >>> 8) & 0x0f] +
                HEX_CHARS[(h0 >>> 20) & 0x0f] +
                HEX_CHARS[(h0 >>> 16) & 0x0f] +
                HEX_CHARS[(h0 >>> 28) & 0x0f] +
                HEX_CHARS[(h0 >>> 24) & 0x0f] +
                HEX_CHARS[(h1 >>> 4) & 0x0f] +
                HEX_CHARS[h1 & 0x0f] +
                HEX_CHARS[(h1 >>> 12) & 0x0f] +
                HEX_CHARS[(h1 >>> 8) & 0x0f] +
                HEX_CHARS[(h1 >>> 20) & 0x0f] +
                HEX_CHARS[(h1 >>> 16) & 0x0f] +
                HEX_CHARS[(h1 >>> 28) & 0x0f] +
                HEX_CHARS[(h1 >>> 24) & 0x0f] +
                HEX_CHARS[(h2 >>> 4) & 0x0f] +
                HEX_CHARS[h2 & 0x0f] +
                HEX_CHARS[(h2 >>> 12) & 0x0f] +
                HEX_CHARS[(h2 >>> 8) & 0x0f] +
                HEX_CHARS[(h2 >>> 20) & 0x0f] +
                HEX_CHARS[(h2 >>> 16) & 0x0f] +
                HEX_CHARS[(h2 >>> 28) & 0x0f] +
                HEX_CHARS[(h2 >>> 24) & 0x0f] +
                HEX_CHARS[(h3 >>> 4) & 0x0f] +
                HEX_CHARS[h3 & 0x0f] +
                HEX_CHARS[(h3 >>> 12) & 0x0f] +
                HEX_CHARS[(h3 >>> 8) & 0x0f] +
                HEX_CHARS[(h3 >>> 20) & 0x0f] +
                HEX_CHARS[(h3 >>> 16) & 0x0f] +
                HEX_CHARS[(h3 >>> 28) & 0x0f] +
                HEX_CHARS[(h3 >>> 24) & 0x0f]
            );
        }
    }

    return Md5;
})();
