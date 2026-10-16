// Same patch as sd-bootloader-ng/tools/altport.py of hackiebox_cfw_ng.

type PatchByte = number | null;

interface AltPortEntry {
    desc: string;
    search: PatchByte[];
    offset: number;
    replace: number[];
}

const thumbMovw = (rd: number, value: number): number[] => {
    const imm4 = value >> 12;
    const i = (value >> 11) & 1;
    const imm3 = (value >> 8) & 7;
    const imm8 = value & 0xff;
    const hw1 = 0xf240 | (i << 10) | imm4;
    const hw2 = (imm3 << 12) | (rd << 8) | imm8;
    return [hw1 & 0xff, hw1 >> 8, hw2 & 0xff, hw2 >> 8];
};

const htons = (port: number) => ((port & 0xff) << 8) | (port >> 8);

const bytes = (pattern: string): PatchByte[] =>
    pattern.split(" ").map((b) => (b === "??" ? null : parseInt(b, 16)));

const altPortEntries = (port: number): AltPortEntry[] => [
    {
        desc: "connect 3.1.0 BF2: movw r3, #htons(port)",
        search: bytes("02 23 ad f8 10 30 ?? ?? 4b f6 01 33 ad f8 0c 30 ad f8 12 30"),
        offset: 8,
        replace: thumbMovw(3, htons(port)),
    },
    {
        desc: "connect 3.3.0/3.4.0: sockaddr literal AF_INET:port",
        search: bytes("02 00 01 bb"),
        offset: 2,
        replace: [port >> 8, port & 0xff],
    },
    {
        desc: "log BF2/3.3.0/3.4.0: connect failed, movw r3, #port",
        search: bytes("8b 48 87 4a 40 f2 bb 13 ?? ?? ?? ?? 89 49 b4 f9 00 00"),
        offset: 4,
        replace: thumbMovw(3, port),
    },
    {
        desc: "log BF2/3.3.0/3.4.0: cloud request, movw sl, #port",
        search: bytes(
            "40 f2 bb 1a 02 46 cd f8 04 a0 40 f2 11 30 cd f8 00 80 ?? ?? ?? ?? " +
                "1c 22 00 21 11 a8 ?? ?? ?? ?? ?? 4a 4e f6 60 23",
        ),
        offset: 0,
        replace: thumbMovw(10, port),
    },
];

const hexList = (list: PatchByte[]) =>
    list.map((b) => (b === null ? '"??"' : `"${b.toString(16).padStart(2, "0")}"`)).join(", ");

export const isValidAltPort = (port: number) =>
    Number.isInteger(port) && port >= 1 && port <= 65535;

export const createAltPortPatch = (port: number): string => {
    const items = altPortEntries(port).map((entry) => {
        const replace: PatchByte[] = entry.search.map(() => null);
        entry.replace.forEach((b, i) => (replace[entry.offset + i] = b));
        return `    {
        "_desc": "${entry.desc}",
        "search":  [${hexList(entry.search)}],
        "replace": [${hexList(replace)}]
    }`;
    });
    return `{
    "general": {
        "_desc": "Changes the port the box connects to (API and RTNL) from 443 to ${port}.",
        "_memPos": "",
        "_fwVer": "3.1.0+"
    },
    "searchAndReplace": [
${items.join(",\n")}
    ]
}
`;
};
