// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TonieCardProps } from "../../../../types/tonieTypes";

const { storageMock } = vi.hoisted(() => ({
    storageMock: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
    },
}));

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, params?: Record<string, unknown>) =>
            params ? `${key}:${JSON.stringify(params)}` : key,
    }),
}));

vi.mock("../../../common/icons/LanguageFlagIcon", () => ({
    languageOptions: ["de-de", "en-us", "fr-fr"],
}));

vi.mock("../../../../utils/storage/userStorage", () => ({
    userStorage: storageMock,
}));

import { useToniesFilter } from "./useToniesFilter";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
    true;

type HookResult = ReturnType<typeof useToniesFilter>;
type UniquenessMaps = {
    episode: Record<string, boolean>;
    series: Record<string, boolean>;
    model: Record<string, boolean>;
};

const makeTonie = (overrides: Partial<TonieCardProps> = {}): TonieCardProps => ({
    uid: "uid-1",
    ruid: "ruid-1",
    type: "custom",
    valid: true,
    exists: true,
    claimed: true,
    hide: false,
    live: false,
    nocloud: false,
    hasCloudAuth: true,
    source: "lib://Series/01.taf",
    audioUrl: "",
    downloadTriggerUrl: "",
    tonieInfo: {
        series: "Series",
        episode: "Episode 1",
        language: "de-de",
        model: "custom-1",
        picture: "/img/1.png",
        tracks: ["Intro", "Story"],
    },
    sourceInfo: {
        series: "",
        episode: "",
        language: "",
        model: "",
        picture: "",
        tracks: [],
    },
    trackSeconds: [0, 10],
    ...overrides,
});

function mountFilterHook(
    tonieCards: TonieCardProps[],
    uniquenessMaps: UniquenessMaps = {
        episode: {},
        series: {},
        model: {},
    },
) {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    let current: HookResult | undefined;

    function Harness() {
        current = useToniesFilter({
            tonieCards,
            lastTonieboxRUIDs: [],
            uniquenessMaps,
        });
        return null;
    }

    act(() => {
        root.render(React.createElement(Harness));
    });

    return {
        get current(): HookResult {
            if (!current) throw new Error("Hook not rendered");
            return current;
        },
        unmount() {
            act(() => root.unmount());
            container.remove();
        },
    };
}

describe("useToniesFilter custom filter", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const applyCustomFilter = (
        query: string,
        tonies: TonieCardProps[],
        uniquenessMaps?: UniquenessMaps,
    ): TonieCardProps[] => {
        const hook = mountFilterHook(tonies, uniquenessMaps);

        try {
            act(() => {
                hook.current.filterActions.setCustomFilter(query);
            });
            act(() => {
                hook.current.filterActions.applyFilters();
            });

            return hook.current.filteredTonies;
        } finally {
            hook.unmount();
        }
    };

    it("combines boolean fields with AND and negation", () => {
        const matching = makeTonie({ ruid: "match", live: true, nocloud: false });
        const noMatch = makeTonie({ ruid: "no-match", live: true, nocloud: true });

        const result = applyCustomFilter("live && !nocloud", [matching, noMatch]);

        expect(result.map((t) => t.ruid)).toEqual(["match"]);
    });

    it("supports case-insensitive startswith, endswith and in operators", () => {
        const a = makeTonie({ ruid: "a" });
        const b = makeTonie({
            ruid: "b",
            tonieInfo: { ...makeTonie().tonieInfo, series: "Other", language: "fr-fr" },
        });

        expect(applyCustomFilter('series startswith "ser"', [a, b]).map((t) => t.ruid)).toEqual([
            "a",
        ]);
        expect(applyCustomFilter('series endswith "IES"', [a, b]).map((t) => t.ruid)).toEqual([
            "a",
        ]);
        expect(applyCustomFilter("language in (de-de,en-us)", [a, b]).map((t) => t.ruid)).toEqual([
            "a",
        ]);
    });

    it("supports track matching and track count comparisons", () => {
        const twoTracks = makeTonie({ ruid: "two" });
        const oneTrack = makeTonie({
            ruid: "one",
            tonieInfo: { ...makeTonie().tonieInfo, tracks: ["Music"] },
            trackSeconds: [0],
        });

        expect(applyCustomFilter('track="story" && trackcount>=2', [twoTracks, oneTrack])).toEqual([
            twoTracks,
        ]);
        expect(applyCustomFilter('tracks~"sto"', [twoTracks, oneTrack])).toEqual([twoTracks]);
    });

    it("supports unique(series) using the supplied uniqueness map", () => {
        const unique = makeTonie({ ruid: "unique" });
        const duplicate = makeTonie({
            ruid: "duplicate",
            tonieInfo: { ...makeTonie().tonieInfo, series: "Duplicate" },
        });

        const result = applyCustomFilter("unique(series)", [unique, duplicate], {
            episode: {},
            model: {},
            series: { Series: true, Duplicate: false },
        });

        expect(result.map((t) => t.ruid)).toEqual(["unique"]);
    });

    it("validates unknown fields and invalid unique fields", () => {
        const hook = mountFilterHook([makeTonie()]);

        try {
            act(() => {
                hook.current.filterActions.validateCustomFilter("unknown=value");
            });
            expect(hook.current.filterState.customFilterValid).toBe(false);
            expect(hook.current.filterState.customFilterError).toContain("unknownFieldComparison");

            act(() => {
                hook.current.filterActions.validateCustomFilter("unique(language)");
            });
            expect(hook.current.filterState.customFilterValid).toBe(false);
            expect(hook.current.filterState.customFilterError).toContain("invalidFieldUnique");
        } finally {
            hook.unmount();
        }
    });
});
