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
                const response = await fetch('data/tonieboxes.json');
                const jsonData = await response.json();

                // Transform the JSON data into the desired array format
                const dataArray: TonieboxImage[] = jsonData.map((item: any) => ({
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
