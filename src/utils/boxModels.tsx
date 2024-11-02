import { useEffect, useState } from "react";

import { TonieboxImage } from "../types/tonieboxTypes";

import { TeddyCloudApi } from "../api";
import { defaultAPIConfig } from "../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

export default function GetBoxModelImages() {
    const [boxModelImages, setBoxModelImages] = useState<TonieboxImage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            var jsonResult: any = [];
            setLoading(true);
            try {
                const response = await api.apiGetTeddyCloudApiRaw(`/api/tonieboxesJson`);
                const jsonData = await response.json();
                jsonResult = [...jsonResult, ...jsonData];
            } catch (error) {
                console.error("Error fetching and transforming toniebox data:", error);
            }
            try {
                const responseCustom = await api.apiGetTeddyCloudApiRaw(`/api/tonieboxesCustomJson`);
                const jsonDataCustom = await responseCustom.json();
                jsonResult = [...jsonResult, ...jsonDataCustom];
            } catch (error) {
                console.error("Error fetching and transforming custom toniebox data:", error);
            }
            const images: TonieboxImage[] = jsonResult.map((item: any) => ({
                id: item.id,
                name: item.name,
                img_src: item.img_src,
                crop: item.crop || null,
            }));
            setBoxModelImages(images);
            setLoading(false);
        }

        fetchData();
    }, []);

    return { boxModelImages, loading };
}
