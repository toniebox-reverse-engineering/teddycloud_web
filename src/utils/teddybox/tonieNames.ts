import { TonieCardProps, TonieInfo } from "../../types/tonieTypes";

/** Names that are only an id: hex ids, audio ids, ruids. */
const looksLikeId = (name: string) => /^[0-9a-f\s_-]{8,}$/i.test(name) || /^\d+$/.test(name);

const infoName = (info?: TonieInfo) =>
    [info?.series, info?.episode]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(" – ");

/** Title of the linked audio file, e.g. "lib://Hoerspiele/Raeuber Hotzenplotz.taf". */
const fileTitle = (source?: string) => {
    const path = (source || "").replace(/^lib:\/\//, "");
    if (!path || path === source) return "";
    const file = path.split("/").pop() || "";
    try {
        return decodeURIComponent(file)
            .replace(/\.taf$/i, "")
            .trim();
    } catch {
        return file.replace(/\.taf$/i, "").trim();
    }
};

/**
 * How well a tonie is named: 0 an official figure, 1 a custom model with a real name, 2 only the
 * title of its audio file, 3 nothing but an id. Used to list the named ones first.
 */
export const tonieRank = (tonie: TonieCardProps): number => {
    const name = infoName(tonie.tonieInfo);
    if (name && !looksLikeId(name)) return /^custom/i.test(tonie.tonieInfo?.model || "") ? 1 : 0;
    const source = infoName(tonie.sourceInfo);
    if (source && !looksLikeId(source)) return 1;
    return fileTitle(tonie.source) ? 2 : 3;
};

/** Readable name: the figure, else the content, else the audio file, else the id. */
export const tonieLabel = (tonie: TonieCardProps | undefined, fallback = ""): string => {
    if (!tonie) return fallback;
    return (
        [infoName(tonie.tonieInfo), infoName(tonie.sourceInfo), fileTitle(tonie.source)].find(
            (name) => name && !looksLikeId(name),
        ) || tonie.ruid
    );
};

/** Named tonies first, each group in alphabetical order ("Coin 2" before "Coin 10"). */
export const compareTonies = (a: TonieCardProps, b: TonieCardProps) =>
    tonieRank(a) - tonieRank(b) ||
    tonieLabel(a).localeCompare(tonieLabel(b), undefined, { numeric: true, sensitivity: "base" });
