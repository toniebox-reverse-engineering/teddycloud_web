import { describe, expect, it, vi } from "vitest";
import { TFunction } from "i18next";

import SettingsDataHandler, { Setting } from "./SettingsDataHandler";

const setting = (iD: string, value: number): Setting => ({
    iD,
    value,
    label: iD,
    description: "",
    overlayed: undefined,
    shortname: iD,
    type: "uint",
});

const handler = () => {
    const instance = SettingsDataHandler.initialize(vi.fn(), ((key: string) => key) as TFunction);
    instance.initializeSettings([setting("a.one", 1), setting("a.two", 2)], undefined);
    return instance;
};

describe("SettingsDataHandler id listeners", () => {
    it("calls an id listener only for its own setting", () => {
        const instance = handler();
        const listener = vi.fn();
        instance.addIdListener(listener, "a.one");

        instance.changeSetting("a.two", 3, undefined);
        expect(listener).not.toHaveBeenCalled();

        instance.changeSetting("a.one", 4, undefined);
        expect(listener).toHaveBeenCalledTimes(1);
        instance.removeIdListener(listener);
    });

    it("no longer calls a removed id listener", () => {
        const instance = handler();
        const listener = vi.fn();
        instance.addIdListener(listener, "a.one");
        instance.removeIdListener(listener);

        instance.changeSetting("a.one", 5, undefined);
        expect(listener).not.toHaveBeenCalled();
    });

    it("no longer calls a removed listener", () => {
        const instance = handler();
        const listener = vi.fn();
        instance.addListener(listener);
        instance.removeListener(listener);

        instance.changeSetting("a.one", 6, undefined);
        expect(listener).not.toHaveBeenCalled();
    });
});
