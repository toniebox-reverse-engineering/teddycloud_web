import { useEffect, useState } from "react";

import { TeddyCloudApi } from "../api";
import { defaultAPIConfig } from "../config/defaultApiConfig";

const api = new TeddyCloudApi(defaultAPIConfig());

interface TonieboxImage {
    id: string;
    name: string;
    img_src: string;
    crop?: number[];
}

export default function GetBoxModelImages() {
    const [boxModelImages, setBoxModelImages] = useState<TonieboxImage[]>([]);

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await api.apiGetTeddyCloudApiRaw(`/api/tonieboxesJson`);
                const jsonData = await response.json();
                const responseCustom = await api.apiGetTeddyCloudApiRaw(`/api/tonieboxesCustomJson`);
                const jsonDataCustom = await responseCustom.json();
                const jsonDataCombined = [...jsonDataCustom, ...jsonData];
                const dataArray: TonieboxImage[] = jsonDataCombined.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    img_src: item.img_src,
                    crop: item.crop || null,
                }));
                setBoxModelImages(dataArray);
            } catch (error) {
                console.error("Error fetching and transforming data:", error);
                setBoxModelImages([]);
            }
        }

        fetchData();
    }, []);

    return boxModelImages;
}
