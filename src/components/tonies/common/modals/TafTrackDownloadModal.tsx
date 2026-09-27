import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Checkbox, Flex, Modal, Table, theme } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DownloadOutlined, PlayCircleOutlined } from "@ant-design/icons";
import styled from "styled-components";

import {
    buildTafDownloadUrl,
    triggerBrowserDownload,
} from "../../../../utils/downloads/tafDownload";
import { padTrackNumber, sanitizeDownloadName } from "../../../../utils/files/sanitizeDownloadName";

const { useToken } = theme;

const TrackTableWrap = styled.div`
    .ant-table-selection-column {
        width: 52px;
        min-width: 52px;
    }
    .ant-table-selection-column .ant-checkbox-wrapper {
        padding: 10px;
        margin-inline: 0;
    }
    .ant-checkbox .ant-checkbox-inner {
        width: 20px;
        height: 20px;
    }
    .ant-table-tbody > tr > td {
        vertical-align: middle;
    }
`;

export type TafDownloadTrack = {
    number: number;
    title: string;
    startSeconds?: number;
    durationSeconds?: number;
};

type TafDownloadPanelProps = {
    tracks: TafDownloadTrack[];
    contentUrl: string;
    baseFilename: string;
    onPlayTrack?: (startSeconds?: number) => void;
    compact?: boolean;
};

const formatClock = (seconds?: number): string => {
    if (seconds === undefined || Number.isNaN(seconds)) {
        return "";
    }
    const total = Math.max(0, Math.round(seconds));
    const minutes = Math.floor(total / 60);
    const rest = total % 60;
    return `${minutes}:${rest.toString().padStart(2, "0")}`;
};

export const buildTafDownloadTracks = (
    titles: string[] | undefined,
    trackSeconds: number[] | undefined,
): TafDownloadTrack[] => {
    const count = Math.max(titles?.length || 0, trackSeconds?.length || 0);
    const tracks: TafDownloadTrack[] = [];
    for (let i = 0; i < count; i++) {
        const start = trackSeconds?.[i];
        const next = trackSeconds?.[i + 1];
        tracks.push({
            number: i + 1,
            title: titles?.[i]?.trim() || "",
            startSeconds: start,
            durationSeconds: start !== undefined && next !== undefined ? next - start : undefined,
        });
    }
    return tracks;
};

export const TafDownloadPanel: React.FC<TafDownloadPanelProps> = ({
    tracks,
    contentUrl,
    baseFilename,
    onPlayTrack,
    compact = false,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const canSplit = tracks.length > 1;
    const allKeys = useMemo(() => tracks.map((track) => track.number), [tracks]);
    const [selectedKeys, setSelectedKeys] = useState<number[]>(allKeys);

    useEffect(() => {
        setSelectedKeys(allKeys);
    }, [allKeys]);

    const downloadBase = sanitizeDownloadName(baseFilename || "download");

    const downloadWholeFile = () => {
        triggerBrowserDownload(buildTafDownloadUrl(contentUrl), `${downloadBase}.ogg`);
    };

    const downloadSelected = () => {
        const selected = tracks.filter((track) => selectedKeys.includes(track.number));
        if (selected.length === 0) {
            return;
        }
        const entries = selected.map((track) => {
            const title =
                track.title || t("tonies.tafDownload.unnamedTrack", { number: track.number });
            return `${padTrackNumber(track.number)} ${sanitizeDownloadName(title)}.ogg`;
        });
        const filename = selected.length === 1 ? entries[0] : `${downloadBase}.zip`;
        triggerBrowserDownload(
            buildTafDownloadUrl(contentUrl, {
                tracks: selected.map((track) => track.number),
            }),
            filename,
        );
    };

    if (!canSplit) {
        return (
            <Button
                type="default"
                icon={<DownloadOutlined />}
                onClick={downloadWholeFile}
                block
                style={{ minHeight: 44 }}
            >
                {t("tonies.tafDownload.asOneFile")}
            </Button>
        );
    }

    const allSelected = selectedKeys.length === tracks.length && tracks.length > 0;
    const someSelected = selectedKeys.length > 0 && !allSelected;

    const columns: ColumnsType<TafDownloadTrack> = [
        ...(onPlayTrack
            ? [
                  {
                      title: "",
                      key: "play",
                      width: 44,
                      render: (_: unknown, record: TafDownloadTrack) => (
                          <PlayCircleOutlined
                              onClick={(event) => {
                                  event.stopPropagation();
                                  onPlayTrack(record.startSeconds);
                              }}
                              style={{ fontSize: 18, padding: 8 }}
                          />
                      ),
                  },
              ]
            : []),
        {
            title: t("tonies.tafDownload.selectedCount", {
                selected: selectedKeys.length,
                total: tracks.length,
            }),
            key: "track",
            render: (_: unknown, record: TafDownloadTrack) =>
                `${padTrackNumber(record.number)}  ${
                    record.title || t("tonies.tafDownload.unnamedTrack", { number: record.number })
                }`,
        },
        {
            title: t("tonies.tafDownload.duration"),
            dataIndex: "durationSeconds",
            width: 72,
            render: (value?: number) => formatClock(value),
        },
    ];

    return (
        <Flex vertical gap={12}>
            <TrackTableWrap>
                <Table<TafDownloadTrack>
                    size={compact ? "small" : "middle"}
                    pagination={false}
                    rowKey="number"
                    dataSource={tracks}
                    columns={columns}
                    sticky
                    scroll={{ x: true }}
                    rowSelection={{
                        selectedRowKeys: selectedKeys,
                        hideSelectAll: true,
                        columnWidth: 52,
                        columnTitle: (
                            <Checkbox
                                checked={allSelected}
                                indeterminate={someSelected}
                                onChange={(event) =>
                                    setSelectedKeys(event.target.checked ? allKeys : [])
                                }
                                aria-label={t("tonies.tafDownload.selectAll")}
                            />
                        ),
                        onChange: (keys) => setSelectedKeys(keys.map((key) => Number(key))),
                    }}
                    onRow={(record) => ({
                        onClick: (event) => {
                            const target = event.target as HTMLElement;
                            if (
                                target.closest(".ant-checkbox-wrapper") ||
                                target.closest(".anticon-play-circle")
                            ) {
                                return;
                            }
                            setSelectedKeys((current) =>
                                current.includes(record.number)
                                    ? current.filter((key) => key !== record.number)
                                    : [...current, record.number],
                            );
                        },
                        style: { cursor: "pointer" },
                    })}
                    style={{
                        border: `1px solid ${token.colorBorderSecondary}`,
                        borderRadius: token.borderRadius,
                    }}
                />
            </TrackTableWrap>
            <Flex
                gap={8}
                wrap="wrap"
                justify="flex-end"
                style={{
                    position: "sticky",
                    bottom: 0,
                    background: token.colorBgContainer,
                    paddingTop: 8,
                }}
            >
                <Button onClick={downloadWholeFile} style={{ minHeight: 44 }}>
                    {t("tonies.tafDownload.asOneFile")}
                </Button>
                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    disabled={selectedKeys.length === 0}
                    onClick={downloadSelected}
                    style={{ minHeight: 44 }}
                >
                    {selectedKeys.length === 1
                        ? t("tonies.tafDownload.downloadOne")
                        : t("tonies.tafDownload.downloadCount", { count: selectedKeys.length })}
                </Button>
            </Flex>
        </Flex>
    );
};

type TafTrackDownloadModalProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    tracks: TafDownloadTrack[];
    contentUrl: string;
    baseFilename: string;
};

export const TafTrackDownloadModal: React.FC<TafTrackDownloadModalProps> = ({
    open,
    onClose,
    title,
    tracks,
    contentUrl,
    baseFilename,
}) => {
    const { t } = useTranslation();
    return (
        <Modal
            title={title || t("tonies.tafDownload.modalTitle")}
            open={open}
            onCancel={onClose}
            footer={null}
            destroyOnHidden
            styles={{ body: { paddingTop: 12 } }}
        >
            <TafDownloadPanel tracks={tracks} contentUrl={contentUrl} baseFilename={baseFilename} />
        </Modal>
    );
};
