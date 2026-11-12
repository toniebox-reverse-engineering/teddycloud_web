import { useCallback, useEffect, useState } from "react";

import { ResponseError, TeddyCloudApi } from "../../../api";
import { defaultAPIConfig } from "../../../config/defaultApiConfig";
import {
    TEDDYBOX_FILE_NAME,
    TEDDYBOX_FILE_VERSION,
    TEDDYBOX_LIBRARY_DIR,
} from "../../../constants/teddybox";
import { TeddyBoxConfig, TeddyBoxFile } from "../../../types/teddyboxTypes";
import { normalizeTeddyBoxFile } from "../../../utils/teddybox/teddyboxConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

const FILE_URL = `/library/${TEDDYBOX_LIBRARY_DIR}/${TEDDYBOX_FILE_NAME}`;

export const loadTeddyBoxFile = async (): Promise<TeddyBoxFile> => {
    let response: Response;
    try {
        response = await api.apiGetTeddyCloudApiRaw(`${FILE_URL}?t=${Date.now()}`);
    } catch (err) {
        // No file yet: nobody has created a TeddyBox so far.
        if (err instanceof ResponseError && err.response.status === 404) {
            return { version: TEDDYBOX_FILE_VERSION, teddyboxes: [] };
        }
        throw err;
    }
    return normalizeTeddyBoxFile(await response.json());
};

const saveTeddyBoxFile = async (file: TeddyBoxFile) => {
    // The upload needs an existing directory; an error for an existing one is expected.
    await api
        .apiPostTeddyCloudRaw("/api/dirCreate?special=library", `/${TEDDYBOX_LIBRARY_DIR}`)
        .catch(() => undefined);

    const json = JSON.stringify(file, null, 2);
    const formData = new FormData();
    formData.append(
        TEDDYBOX_FILE_NAME,
        new File([json], TEDDYBOX_FILE_NAME, { type: "application/json" }),
    );
    const response = await api.apiPostTeddyCloudFormDataRaw(
        `/api/fileUpload?path=${encodeURIComponent(TEDDYBOX_LIBRARY_DIR)}&special=library`,
        formData,
    );
    if (!response.ok) {
        const message = await response.text().catch(() => "");
        throw new Error(`Saving TeddyBoxes failed (${response.status}): ${message}`);
    }
};

/** Reads the current file before writing, so changes made on another device are kept. */
const updateTeddyBoxFile = async (
    change: (list: TeddyBoxConfig[]) => TeddyBoxConfig[],
): Promise<TeddyBoxConfig[]> => {
    const current = await loadTeddyBoxFile();
    const next = change(current.teddyboxes);
    await saveTeddyBoxFile({ version: TEDDYBOX_FILE_VERSION, teddyboxes: next });
    return next;
};

/** Adds or replaces one TeddyBox in the library file. */
export const storeTeddyBox = (box: TeddyBoxConfig) =>
    updateTeddyBoxFile((list) =>
        list.some((b) => b.id === box.id)
            ? list.map((b) => (b.id === box.id ? box : b))
            : [...list, box],
    );

/** Removes one TeddyBox from the library file. */
export const removeTeddyBox = (id: string) =>
    updateTeddyBoxFile((list) => list.filter((b) => b.id !== id));

/** All TeddyBoxes, stored in the library so that every device sees the same configuration. */
export const useTeddyBoxes = () => {
    const [teddyboxes, setTeddyboxes] = useState<TeddyBoxConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        setLoading(true);
        try {
            const file = await loadTeddyBoxFile();
            setTeddyboxes(file.teddyboxes);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void reload();
    }, [reload]);

    const saveTeddyBox = useCallback(async (box: TeddyBoxConfig) => {
        setTeddyboxes(await storeTeddyBox(box));
    }, []);

    const deleteTeddyBox = useCallback(async (id: string) => {
        setTeddyboxes(await removeTeddyBox(id));
    }, []);

    return { teddyboxes, loading, error, reload, saveTeddyBox, deleteTeddyBox };
};
