import { useEffect, useState } from "react";

import { TonieboxImage } from "../types/tonieboxTypes";
import { TeddyCloudApi } from "../api";
import { defaultAPIConfig } from "../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

export function useBoxModelImages() {
    const [boxModelImages, setBoxModelImages] = useState<TonieboxImage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function fetchData() {
            setLoading(true);
            let result: any[] = [];

            try {
                const response = await api.apiGetTeddyCloudApiRaw(`/api/tonieboxesJson`);
                const jsonData = await response.json();
                result.push(...jsonData);
            } catch (error) {
                console.error("Error fetching toniebox data:", error);
            }

            try {
                const responseCustom = await api.apiGetTeddyCloudApiRaw(`/api/tonieboxesCustomJson`);
                const jsonDataCustom = await responseCustom.json();
                result.push(...jsonDataCustom);
            } catch (error) {
                console.error("Error fetching custom toniebox data:", error);
            }

            if (!isMounted) return;

            const images: TonieboxImage[] = result.map((item: any) => ({
                id: item.id,
                name: item.name,
                img_src: item.img_src,
                crop: item.crop || null,
            }));

            setBoxModelImages(images);
            setLoading(false);
        }

        fetchData();

        return () => {
            isMounted = false;
        };
    }, []);

    return { boxModelImages, loading };
}
