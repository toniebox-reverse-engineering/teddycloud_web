/**
 * WL-aware FAT CERT detector
 * - supports plain FAT (boot sector at 0)
 * - supports ESP-IDF Wear Leveling FAT (boot sector at translated sector 0)
 */

type Part = {
    type: number;
    subtype: number;
    offset: number;
    size: number;
    label: string;
    flags: number;
};

type AssetCertCheckResult = {
    ok: boolean;
    reason?: string;

    partitionsFound: number;
    assetsPartition?: Part;

    fsType?: "fat" | "spiffs_or_littlefs_or_unknown" | "unknownFS";
    cert?: {
        foundCertDir: boolean;
        found: {
            "CERT/CA.DER": boolean;
            "CERT/CLIENT.DER": boolean;
            "CERT/PRIVATE.DER": boolean;
        };
    };
};

const CERT_FILES = ["CERT/CA.DER", "CERT/CLIENT.DER", "CERT/PRIVATE.DER"] as const;

function u32le(buf: Uint8Array, off: number) {
    return (buf[off] | (buf[off + 1] << 8) | (buf[off + 2] << 16) | (buf[off + 3] << 24)) >>> 0;
}

function parsePartitionTable(buf: Uint8Array, tableOffset = 0x9000): Part[] {
    const parts: Part[] = [];
    const maxLen = 0xc00;

    for (let i = 0; i < maxLen; i += 32) {
        const o = tableOffset + i;
        if (o + 32 > buf.length) break;

        const entry = buf.subarray(o, o + 32);
        if (entry.every((b) => b === 0xff)) break;

        const magic = entry[0] | (entry[1] << 8);
        if (magic !== 0x50aa) continue;

        const type = entry[2];
        const subtype = entry[3];
        const offset = u32le(entry, 4);
        const size = u32le(entry, 8);

        const labelBytes = entry.subarray(12, 28);
        const zero = labelBytes.indexOf(0);
        const label = new TextDecoder().decode(zero >= 0 ? labelBytes.subarray(0, zero) : labelBytes);

        const flags = u32le(entry, 28);

        parts.push({ type, subtype, offset, size, label, flags });
    }

    return parts;
}

/** FAT boot sector heuristic */
function looksLikeFATBootSector(bs: Uint8Array): boolean {
    if (bs.length < 512) return false;
    if (bs[510] !== 0x55 || bs[511] !== 0xaa) return false;

    const bps = bs[11] | (bs[12] << 8);
    // include 4096 because WL-FAT commonly uses 4K sectors
    if (![512, 1024, 2048, 4096].includes(bps)) return false;

    const spc = bs[13];
    if (spc === 0 || (spc & (spc - 1)) !== 0) return false;

    return true;
}

/** Minimal FAT BPB parsing (works for FAT16/32 enough for a directory scan). */
function parseFATBPB(bs: Uint8Array) {
    const bytesPerSector = bs[11] | (bs[12] << 8);
    const sectorsPerCluster = bs[13];
    const reservedSectors = bs[14] | (bs[15] << 8);
    const numFATs = bs[16];
    const rootEntryCount = bs[17] | (bs[18] << 8);
    const totalSectors16 = bs[19] | (bs[20] << 8);
    const fatSize16 = bs[22] | (bs[23] << 8);
    const totalSectors32 = u32le(bs, 32);
    const fatSize32 = u32le(bs, 36);
    const rootCluster = u32le(bs, 44);

    const totalSectors = totalSectors16 !== 0 ? totalSectors16 : totalSectors32;
    const fatSize = fatSize16 !== 0 ? fatSize16 : fatSize32;

    return {
        bytesPerSector,
        sectorsPerCluster,
        reservedSectors,
        numFATs,
        rootEntryCount,
        totalSectors,
        fatSize,
        isFAT32: rootEntryCount === 0,
        rootCluster,
    };
}

function readAsciiTrim(buf: Uint8Array) {
    let s = "";
    for (const b of buf) s += b >= 32 && b <= 126 ? String.fromCharCode(b) : "\0";
    return s.replace(/\0+$/, "");
}

/* -------------------- Wear Leveling detection + reader -------------------- */

type WLInfo = {
    sectorSize: number; // 0x1000
    totalSectors: number;
    wlStateSectors: number;
    wlSectorsSize: number;
    fatSectors: number;
    totalRecords: number;
    moveCount: number;
};

function tryParseWearLeveling(part: Uint8Array): WLInfo | null {
    const WL_SECTOR_SIZE = 0x1000;
    if (part.length < WL_SECTOR_SIZE * 8) return null; // cheap sanity

    const totalSectors = Math.floor(part.length / WL_SECTOR_SIZE);
    const WL_STATE_RECORD_SIZE = 16;
    const WL_STATE_COPY_COUNT = 2;

    const wlStateSize = 64 + WL_STATE_RECORD_SIZE * totalSectors;
    const wlStateSectors = Math.ceil(wlStateSize / WL_SECTOR_SIZE);
    const wlSectorsSize = wlStateSectors * WL_SECTOR_SIZE * WL_STATE_COPY_COUNT + WL_SECTOR_SIZE;

    const fatSectors = totalSectors - 1 - WL_STATE_COPY_COUNT * wlStateSectors;
    if (fatSectors <= 0) return null;

    const stateOffset = part.length - wlSectorsSize;
    if (stateOffset < 0 || stateOffset + 64 > part.length) return null;

    const moveCount = u32le(part, stateOffset + 8);

    // count records until first all-0xFF record
    let totalRecords = 0;
    let recordOffset = stateOffset + 64;
    for (;;) {
        if (recordOffset + WL_STATE_RECORD_SIZE > part.length) break;
        let empty = true;
        for (let i = 0; i < WL_STATE_RECORD_SIZE; i++) {
            if (part[recordOffset + i] !== 0xff) {
                empty = false;
                break;
            }
        }
        if (empty) break;
        totalRecords++;
        recordOffset += WL_STATE_RECORD_SIZE;
        // hard stop safety
        if (totalRecords > totalSectors) break;
    }

    return {
        sectorSize: WL_SECTOR_SIZE,
        totalSectors,
        wlStateSectors,
        wlSectorsSize,
        fatSectors,
        totalRecords,
        moveCount,
    };
}

function u16le(buf: Uint8Array, off: number) {
    return buf[off] | (buf[off + 1] << 8);
}

function parseWearLeveling(part: Uint8Array) {
    const WL_SECTOR_SIZE = 0x1000;
    const WL_STATE_RECORD_SIZE = 16;
    const WL_STATE_COPY_COUNT = 2;

    const length = part.length;
    const totalSectors = Math.floor(length / WL_SECTOR_SIZE);

    const wlStateSize = 64 + WL_STATE_RECORD_SIZE * totalSectors;
    const wlStateSectors = Math.ceil(wlStateSize / WL_SECTOR_SIZE);
    const wlSectorsSize = wlStateSectors * WL_SECTOR_SIZE * WL_STATE_COPY_COUNT + WL_SECTOR_SIZE;

    const fatSectors = totalSectors - 1 - WL_STATE_COPY_COUNT * wlStateSectors;
    const stateOffset = length - wlSectorsSize;

    if (stateOffset < 0 || stateOffset + 64 > length) return null;

    const moveCount = u32le(part, stateOffset + 8);
    const blockSize = u32le(part, stateOffset + 20);
    const version = u32le(part, stateOffset + 24);

    // Heuristik: WL block size muss 0x1000 sein, Version nicht 0, fatSectors plausibel
    if (blockSize !== 0x1000 || version === 0 || fatSectors <= 0) return null;

    // totalRecords = Anzahl nicht-leerer Records hinter Header (wie in deinem Parser)
    let totalRecords = 0;
    let recordOffset = stateOffset + 64;
    for (let i = 0; i < wlStateSize && recordOffset + WL_STATE_RECORD_SIZE <= length; i += WL_STATE_RECORD_SIZE) {
        let empty = true;
        for (let j = 0; j < WL_STATE_RECORD_SIZE; j++) {
            if (part[recordOffset + j] !== 0xff) {
                empty = false;
                break;
            }
        }
        if (empty) break;
        totalRecords++;
        recordOffset += WL_STATE_RECORD_SIZE;
    }

    return {
        WL_SECTOR_SIZE,
        totalSectors,
        wlStateSectors,
        wlSectorsSize,
        fatSectors,
        totalRecords,
        moveCount,
    };
}

function wlTranslateSector(
    wl: ReturnType<typeof parseWearLeveling> extends infer T ? (T extends null ? never : T) : never,
    sector: number
) {
    // exakt wie in deinem Parser
    let translated = (sector + wl.moveCount) % wl.fatSectors;
    if (translated >= wl.totalRecords) translated += 1; // dummy sector skip
    return translated;
}

function fatFindCertFiles(fatPartRaw: Uint8Array) {
    const wl = parseWearLeveling(fatPartRaw);

    // Reader: liefert logische FAT-Sektoren (4096) -> physisch via WL
    const readLogicalSector = (logicalSector: number) => {
        const WL_SECTOR_SIZE = 0x1000;

        const physicalSector = wl ? wlTranslateSector(wl as any, logicalSector) : logicalSector;
        const off = physicalSector * WL_SECTOR_SIZE;
        if (off + WL_SECTOR_SIZE > fatPartRaw.length) return null;
        return fatPartRaw.subarray(off, off + WL_SECTOR_SIZE);
    };

    // Boot sector ist logischer Sektor 0
    const bs = readLogicalSector(0);
    if (!bs) {
        return {
            foundCertDir: false,
            found: { "CERT/CA.DER": false, "CERT/CLIENT.DER": false, "CERT/PRIVATE.DER": false },
        };
    }

    const bpb = parseFATBPB(bs);
    const {
        bytesPerSector,
        sectorsPerCluster,
        reservedSectors,
        numFATs,
        fatSize,
        rootEntryCount,
        isFAT32,
        rootCluster,
    } = bpb;

    // Wichtig: wir unterstützen hier nur den Fall bytesPerSector == 4096 (wie bei dir)
    // (sonst müsste man innerhalb eines 4k WL-Sektors noch “Sub-Sektoren” mappen)
    if (bytesPerSector !== 4096) {
        return {
            foundCertDir: false,
            found: { "CERT/CA.DER": false, "CERT/CLIENT.DER": false, "CERT/PRIVATE.DER": false },
        };
    }

    const rootDirSectors = isFAT32 ? 0 : Math.ceil((rootEntryCount * 32) / bytesPerSector);
    const firstDataSector = reservedSectors + numFATs * fatSize + rootDirSectors;

    const fatStartSector = reservedSectors; // in logischen Sektoren
    const rootDirStartSector = reservedSectors + numFATs * fatSize;

    const readDirEntriesFromSectors = (startSector: number, sectorCount: number) => {
        const entries: Uint8Array[] = [];
        for (let s = 0; s < sectorCount; s++) {
            const sec = readLogicalSector(startSector + s);
            if (!sec) break;
            for (let off = 0; off + 32 <= sec.length; off += 32) {
                entries.push(sec.subarray(off, off + 32));
            }
        }
        return entries;
    };

    const clusterToSector = (cluster: number) => firstDataSector + (cluster - 2) * sectorsPerCluster;

    const readFAT12Entry = (cluster: number) => {
        // FAT12: 12-bit, Offset = floor(cluster*1.5)
        const byteOffset = Math.floor(cluster * 1.5);
        const sector = fatStartSector + Math.floor(byteOffset / 4096);
        const offInSector = byteOffset % 4096;

        const s0 = readLogicalSector(sector);
        if (!s0) return 0;

        // wir brauchen 2 Bytes, evtl. über Sektorgrenze
        let b0 = s0[offInSector];
        let b1: number;
        if (offInSector + 1 < 4096) {
            b1 = s0[offInSector + 1];
        } else {
            const s1 = readLogicalSector(sector + 1);
            if (!s1) return 0;
            b1 = s1[0];
        }

        const val = b0 | (b1 << 8);
        return cluster & 1 ? (val >> 4) & 0x0fff : val & 0x0fff;
    };

    const readDirEntriesFromClusterChain = (startCluster: number) => {
        const entries: Uint8Array[] = [];
        let c = startCluster;
        const seen = new Set<number>();
        while (c >= 2 && !seen.has(c)) {
            seen.add(c);
            const startSec = clusterToSector(c);
            entries.push(...readDirEntriesFromSectors(startSec, sectorsPerCluster));

            const next = isFAT32 ? 0 : readFAT12Entry(c); // für deinen Fall FAT12
            if (next === 0) break;
            if (next >= 0x0ff8) break; // FAT12 EOC
            c = next;
        }
        return entries;
    };

    const readAsciiTrim = (buf: Uint8Array) => {
        let s = "";
        for (const b of buf) s += b >= 32 && b <= 126 ? String.fromCharCode(b) : "\0";
        return s.replace(/\0+$/, "");
    };

    const parse83Name = (e: Uint8Array) => {
        const name = readAsciiTrim(e.subarray(0, 8)).trim();
        const ext = readAsciiTrim(e.subarray(8, 11)).trim();
        return ext ? `${name}.${ext}` : name;
    };

    const isEnd = (e: Uint8Array) => e[0] === 0x00;
    const isDeleted = (e: Uint8Array) => e[0] === 0xe5;
    const isLFN = (e: Uint8Array) => e[11] === 0x0f;

    const getFirstCluster = (e: Uint8Array) => {
        const hi = u16le(e, 20) & 0xffff;
        const lo = u16le(e, 26) & 0xffff;
        return (hi << 16) | lo;
    };

    const findEntryInDir = (entries: Uint8Array[], targetUpper83: string) => {
        for (const e of entries) {
            if (isEnd(e)) break;
            if (isDeleted(e) || isLFN(e)) continue;
            const name = parse83Name(e).toUpperCase();
            if (name === targetUpper83) return e;
        }
        return null;
    };

    // Root directory (FAT12/16): festes Sektor-Window
    const rootEntries = isFAT32
        ? readDirEntriesFromClusterChain(rootCluster)
        : readDirEntriesFromSectors(rootDirStartSector, rootDirSectors);

    const certDirEntry = findEntryInDir(rootEntries, "CERT");
    if (!certDirEntry) {
        return {
            foundCertDir: false,
            found: { "CERT/CA.DER": false, "CERT/CLIENT.DER": false, "CERT/PRIVATE.DER": false },
        };
    }

    const certCluster = getFirstCluster(certDirEntry);
    const certEntries = readDirEntriesFromClusterChain(certCluster);

    const found: Record<(typeof CERT_FILES)[number], boolean> = {
        "CERT/CA.DER": false,
        "CERT/CLIENT.DER": false,
        "CERT/PRIVATE.DER": false,
    };

    for (const f of CERT_FILES) {
        const base = f.split("/")[1]!.toUpperCase();
        found[f] = !!findEntryInDir(certEntries, base);
    }

    return { foundCertDir: true, found };
}

export function checkAssetsCertPartition(
    flash: Uint8Array,
    opts?: { partitionTableOffset?: number; assetsLabel?: string }
): AssetCertCheckResult {
    const ptOff = opts?.partitionTableOffset ?? 0x9000;
    const assetsLabel = opts?.assetsLabel ?? "assets";

    const parts = parsePartitionTable(flash, ptOff);
    const assets = parts.find((p) => p.label === assetsLabel);

    if (!assets) {
        return {
            ok: false,
            reason: `No partition labeled "${assetsLabel}" found (partition table offset 0x${ptOff.toString(16)}).`,
            partitionsFound: parts.length,
        };
    }

    const start = assets.offset;
    const end = assets.offset + assets.size;
    if (end > flash.length) {
        return {
            ok: false,
            reason: `Assets partition (${assets.label}) exceeds dump size (needs 0x${end.toString(
                16
            )}, have 0x${flash.length.toString(16)}).`,
            partitionsFound: parts.length,
            assetsPartition: assets,
        };
    }

    const partData = flash.subarray(start, end);

    // FAT (plain or WL)
    const cert = fatFindCertFiles(partData);
    if (cert) {
        const ok =
            cert.foundCertDir &&
            cert.found["CERT/CA.DER"] &&
            cert.found["CERT/CLIENT.DER"] &&
            cert.found["CERT/PRIVATE.DER"];

        return {
            ok,
            reason: ok ? undefined : "FAT detected (plain or WL), but CERT directory/files not all present.",
            partitionsFound: parts.length,
            assetsPartition: assets,
            fsType: "fat",
            cert,
        };
    }

    return {
        ok: false,
        reason: "Assets partition found, but filesystem is not recognized as FAT (plain or WL). For SPIFFS/LittleFS you need a dedicated parser/extractor.",
        partitionsFound: parts.length,
        assetsPartition: assets,
        fsType: "unknownFS",
    };
}
