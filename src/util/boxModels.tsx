import { useEffect, useState } from 'react';

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
                // Fetch the JSON data
                const response = await fetch(`${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/tonieboxesJson`);
                const jsonData = await response.json();
                const responseCustom = await fetch(`${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/tonieboxesCustomJson`);
                const jsonDataCustom = await responseCustom.json();
                const jsonDataCombined = [...jsonDataCustom, ...jsonData];

                // Transform the JSON data into the desired array format
                const dataArray: TonieboxImage[] = jsonDataCombined.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    img_src: item.img_src,
                    crop: item.crop || null, // Use crop if available, otherwise set to null
                }));

                // Set the transformed array to state
                setBoxModelImages(dataArray);
            } catch (error) {
                console.error('Error fetching and transforming data:', error);
                setBoxModelImages([]); // Set an empty array in case of error
            }
        }

        fetchData();
    }, []);

    return boxModelImages;
}
