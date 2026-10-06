// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { TeddyCloudApi } from "./TeddyCloudApi";
import { Configuration } from "../runtime";

describe("TeddyCloudApi.apiPostTeddyCloudFormDataRaw", () => {
    it("uses the configured request path and keeps FormData as body", async () => {
        const fetchApi = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
        const api = new TeddyCloudApi(new Configuration({ basePath: "", fetchApi }));
        const formData = new FormData();
        formData.append("file", new Blob(["test"]), "test.txt");

        await api.apiPostTeddyCloudFormDataRaw("/api/fileUpload", formData);

        expect(fetchApi).toHaveBeenCalledTimes(1);
        const [url, init] = fetchApi.mock.calls[0];

        expect(url).toBe("/api/fileUpload");
        expect(init.method).toBe("POST");
        expect(init.body).toBe(formData);
        expect(new Headers(init.headers).has("Content-Type")).toBe(false);
    });

    it("appends overlay with ? when the path has no query string", async () => {
        const fetchApi = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
        const api = new TeddyCloudApi(new Configuration({ basePath: "", fetchApi }));

        await api.apiPostTeddyCloudFormDataRaw("/api/fileUpload", new FormData(), "box-1");

        expect(fetchApi.mock.calls[0][0]).toBe("/api/fileUpload?overlay=box-1");
    });

    it("appends overlay with & when the path already has query parameters", async () => {
        const fetchApi = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
        const api = new TeddyCloudApi(new Configuration({ basePath: "", fetchApi }));

        await api.apiPostTeddyCloudFormDataRaw(
            "/api/fileUpload?special=library",
            new FormData(),
            "box-1",
        );

        expect(fetchApi.mock.calls[0][0]).toBe(
            "/api/fileUpload?special=library&overlay=box-1",
        );
    });

    it("does not append overlay when it is empty", async () => {
        const fetchApi = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
        const api = new TeddyCloudApi(new Configuration({ basePath: "", fetchApi }));

        await api.apiPostTeddyCloudFormDataRaw(
            "/api/fileUpload?special=library",
            new FormData(),
            "",
        );

        expect(fetchApi.mock.calls[0][0]).toBe("/api/fileUpload?special=library");
    });

    it("forwards custom headers without adding a multipart Content-Type", async () => {
        const fetchApi = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
        const api = new TeddyCloudApi(new Configuration({ basePath: "", fetchApi }));
        const formData = new FormData();

        await api.apiPostTeddyCloudFormDataRaw(
            "/api/fileUpload",
            formData,
            undefined,
            undefined,
            { "X-Test": "yes" },
        );

        const [, init] = fetchApi.mock.calls[0];
        const headers = new Headers(init.headers);

        expect(headers.get("X-Test")).toBe("yes");
        expect(headers.has("Content-Type")).toBe(false);
    });

    it("forwards initOverrides to the normal request path", async () => {
        const fetchApi = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
        const api = new TeddyCloudApi(new Configuration({ basePath: "", fetchApi }));
        const formData = new FormData();
        const signal = new AbortController().signal;

        await api.apiPostTeddyCloudFormDataRaw("/api/fileUpload", formData, undefined, {
            signal,
        });

        const [, init] = fetchApi.mock.calls[0];
        expect(init.signal).toBe(signal);
    });

    it("returns the original error response on a non-successful HTTP response", async () => {
        const response = new Response(null, {
            status: 500,
            statusText: "Internal Server Error",
        });
        const fetchApi = vi.fn().mockResolvedValue(response);
        const api = new TeddyCloudApi(new Configuration({ basePath: "", fetchApi }));

        const result = await api.apiPostTeddyCloudFormDataRaw(
            "/api/fileUpload",
            new FormData(),
        );

        expect(result).toBe(response);
        expect(result.status).toBe(500);
        expect(result.ok).toBe(false);
    });
});
