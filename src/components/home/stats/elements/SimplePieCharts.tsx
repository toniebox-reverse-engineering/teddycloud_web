import { theme } from "antd";
import { Key } from "react";
import { PieChart } from "react-minimal-pie-chart";

const { useToken } = theme;

export interface PieEntry {
    title: string;
    value: number;
    color: string;
}

interface PieChartWithLegendProps {
    data: PieEntry[];
    title?: string;
}

export const PieChartWithLegend: React.FC<PieChartWithLegendProps> = ({ data, title }) => {
    const { token } = useToken();
    const total = data.reduce((sum, entry) => sum + entry.value, 0);
    const percent = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

    return (
        <div style={{ width: "100%", textAlign: "center" }}>
            {title && <div style={{ marginBottom: 12, fontSize: 14, opacity: 0.7 }}>{title}</div>}

            <PieChart
                data={data}
                animate
                label={({ dataEntry }) => dataEntry.value}
                labelStyle={{
                    fontSize: 8,
                    alignItems: "flex-start",
                    fill: token.colorText,
                }}
                style={{ maxWidth: 150 }}
                labelPosition={70}
            />

            <div style={{ marginTop: 12 }}>
                {data.map(
                    (
                        entry: {
                            color: any;
                            title: string;
                            value: string | number;
                        },
                        idx: Key | null | undefined
                    ) => (
                        <div
                            key={idx}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-start",
                                marginBottom: 4,
                                gap: 8,
                            }}
                        >
                            <div
                                style={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: 4,
                                    background: entry.color,
                                }}
                            />
                            <span style={{ fontSize: 12 }}>
                                {entry.title}: {entry.value} ({percent(Number(entry.value), Number(total))}%)
                            </span>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};
