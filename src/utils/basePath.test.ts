// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    backendUrl,
    basePathFromBaseUri,
    getBasePath,
    resetBasePathCache,
    withBase,
} from "./basePath";

const setBaseHref = (href: string | null) => {
    document.head.querySelectorAll("base").forEach((el) => el.remove());
    if (href !== null) {
        const base = document.createElement("base");
        base.href = href;
        document.head.appendChild(base);
    }
    resetBasePathCache();
};

describe("basePathFromBaseUri", () => {
    it.each([
        ["http://host/web/", ""],
        ["http://host/api/hassio_ingress/abc123/web/", "/api/hassio_ingress/abc123"],
        ["https://proxy/teddycloud/web/", "/teddycloud"],
        ["http://host/web/tonies/xyz", ""],
        ["http://host/", ""],
    ])("%s -> %j", (uri, expected) => {
        expect(basePathFromBaseUri(uri)).toBe(expected);
    });
});

describe("without prefix", () => {
    beforeEach(() => setBaseHref("http://host/web/"));
    afterEach(() => vi.unstubAllEnvs());

    it("detects an empty prefix", () => {
        expect(getBasePath()).toBe("");
    });

    it("leaves paths unchanged", () => {
        expect(withBase("/api/toniesJson")).toBe("/api/toniesJson");
        expect(withBase("/web")).toBe("/web");
    });

    it("builds backend URLs relative to the origin", () => {
        vi.stubEnv("VITE_APP_TEDDYCLOUD_API_URL", "");
        expect(backendUrl("/content/a.taf")).toBe("/content/a.taf");
    });

    it("prepends the build-time API URL", () => {
        vi.stubEnv("VITE_APP_TEDDYCLOUD_API_URL", "http://teddycloud.local/");
        expect(backendUrl("/api/sse")).toBe("http://teddycloud.local/api/sse");
    });
});

describe("with prefix", () => {
    const prefix = "/api/hassio_ingress/abc123";
    beforeEach(() => setBaseHref(`http://host${prefix}/web/`));
    afterEach(() => vi.unstubAllEnvs());

    it("detects the prefix from the <base> element", () => {
        expect(getBasePath()).toBe(prefix);
    });

    it("prefixes root-absolute paths", () => {
        expect(withBase("/api/toniesJson")).toBe(`${prefix}/api/toniesJson`);
        expect(withBase("/web")).toBe(`${prefix}/web`);
    });

    it("is idempotent", () => {
        expect(withBase(withBase("/content/a.taf"))).toBe(`${prefix}/content/a.taf`);
    });

    it.each([
        "https://example.com/pic.png",
        "http://example.com/pic.png",
        "//cdn.example.com/pic.png",
        "data:image/png;base64,AAAA",
        "blob:http://host/1234",
        "relative/path.png",
        "",
    ])("leaves %j unchanged", (url) => {
        expect(withBase(url)).toBe(url);
        expect(backendUrl(url)).toBe(url);
    });

    it("combines the build-time API URL with the prefix", () => {
        vi.stubEnv("VITE_APP_TEDDYCLOUD_API_URL", "");
        expect(backendUrl("/api/sse")).toBe(`${prefix}/api/sse`);
        vi.stubEnv("VITE_APP_TEDDYCLOUD_API_URL", "http://teddycloud.local");
        expect(backendUrl("/api/sse")).toBe(`http://teddycloud.local${prefix}/api/sse`);
    });
});

describe("without a <base> element", () => {
    beforeEach(() => setBaseHref(null));

    it("falls back to an empty prefix", () => {
        expect(getBasePath()).toBe("");
    });
});
