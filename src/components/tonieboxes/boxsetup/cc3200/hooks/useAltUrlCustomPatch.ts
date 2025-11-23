import { useCallback } from "react";

interface General {
    _desc: string;
    _memPos: string;
    _fwVer: string;
}

interface SearchAndReplace {
    _desc: string;
    search: string[];
    replace: string[];
}

interface AltUrlCustom305 {
    general: General;
    searchAndReplace: SearchAndReplace[];
}

const altUrlcustom305Base: AltUrlCustom305 = {
    general: {
        _desc: "Changes Boxine URLs to custom ones.",
        _memPos: "",
        _fwVer: "3.0.5+",
    },
    searchAndReplace: [
        {
            _desc: "prod.de.tbs.toys to ",
            search: [
                "70",
                "72",
                "6f",
                "64",
                "2e",
                "64",
                "65",
                "2e",
                "74",
                "62",
                "73",
                "2e",
                "74",
                "6f",
                "79",
                "73",
                "00",
            ],
            replace: [
                "70",
                "72",
                "6f",
                "64",
                "2e",
                "72",
                "65",
                "76",
                "76",
                "6f",
                "78",
                "00",
                "??",
                "??",
                "??",
                "??",
                "??",
            ],
        },
        {
            _desc: "rtnl.bxcl.de to ",
            search: ["72", "74", "6e", "6c", "2e", "62", "78", "63", "6c", "2e", "64", "65", "00"],
            replace: ["72", "74", "6e", "6c", "2e", "72", "65", "76", "76", "6f", "78", "00", "??"],
        },
    ],
};

const stringToHex = (str: string, totalLength: number): string[] => {
    const hexArray = str.split("").map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"));
    hexArray.push("00");
    const paddingNeeded = totalLength - hexArray.length;
    const paddedHex = paddingNeeded > 0 ? hexArray.concat(Array.from({ length: paddingNeeded }, () => "??")) : hexArray;
    return paddedHex;
};

const getUpdatedAltUrlCustom305 = (hostname: string): AltUrlCustom305 => {
    const updateReplaceWithHostname = (urlChanges: SearchAndReplace[]): SearchAndReplace[] =>
        urlChanges.map((urlChange) => {
            const newReplaceArray = stringToHex(hostname, urlChange.replace.length);
            return {
                ...urlChange,
                _desc: `${urlChange._desc}${hostname}`,
                replace: newReplaceArray,
            };
        });

    return {
        ...altUrlcustom305Base,
        searchAndReplace: updateReplaceWithHostname(altUrlcustom305Base.searchAndReplace),
    };
};

// nicht neu formatieren, um Dateiformat stabil zu halten
const formatConfig = (config: AltUrlCustom305): string => {
    return `{
    "general": {
        "_desc": "${config.general._desc}",
        "_memPos": "${config.general._memPos}",
        "_fwVer": "${config.general._fwVer}"
    },
    "searchAndReplace": [${config.searchAndReplace
        .map(
            (item) => `{
        "_desc": "${item._desc}",
        "search":  ["${item.search.join('", "')}"],
        "replace": ["${item.replace.join('", "')}"]
    }`
        )
        .join(", ")}]
}`;
};

export const useAltUrlCustomPatch = (hostname: string) => {
    const createPatch = useCallback(() => {
        if (!hostname) return;

        const jsonData = getUpdatedAltUrlCustom305(hostname);
        const jsonString = formatConfig(jsonData);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "altUrl.custom.305.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }, [hostname]);

    return { createPatch };
};
