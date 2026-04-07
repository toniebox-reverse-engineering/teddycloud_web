import { useEffect, useState } from "react";

export const useBoxVersionActiveKey = (vendor: string | null) => {
    const [activeKey, setActiveKey] = useState<string>(
        vendor?.toLowerCase().includes("espressif")
            ? "esp32"
            : vendor?.toLowerCase().includes("tonies gmbh")
              ? "tb2"
              : "cc3200",
    );

    useEffect(() => {
        if (vendor?.toLowerCase().includes("espressif")) {
            setActiveKey("esp32");
        } else if (vendor?.toLowerCase().includes("tonies gmbh")) {
            setActiveKey("tb2");
        } else {
            setActiveKey("cc3200");
        }
    }, [vendor]);

    return { activeKey, setActiveKey };
};
