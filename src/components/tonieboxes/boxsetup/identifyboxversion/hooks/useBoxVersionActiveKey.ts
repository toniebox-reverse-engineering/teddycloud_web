import { useEffect, useState } from "react";

export const useBoxVersionActiveKey = (vendor: string | null) => {
    const [activeKey, setActiveKey] = useState<string>(
        vendor?.toLowerCase().includes("espressif") ? "esp32" : "cc3200"
    );

    useEffect(() => {
        if (vendor?.toLowerCase().includes("espressif")) {
            setActiveKey("esp32");
        } else {
            setActiveKey("cc3200");
        }
    }, [vendor]);

    return { activeKey, setActiveKey };
};
