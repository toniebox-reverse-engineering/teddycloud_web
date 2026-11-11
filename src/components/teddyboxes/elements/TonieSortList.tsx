import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Typography, theme } from "antd";
import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    CloseOutlined,
    HolderOutlined,
    InfoCircleOutlined,
} from "@ant-design/icons";
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { TonieCardProps } from "../../../types/tonieTypes";
import { tonieLabel } from "../../../utils/teddybox/tonieNames";
import { toImageSrc } from "../../tonies/common/utils/imagePathUtils";
import { HiddenWarning } from "./HiddenWarning";

const { Text } = Typography;
const { useToken } = theme;

interface ItemProps {
    ruid: string;
    index: number;
    count: number;
    tonie?: TonieCardProps;
    /** The child does not see this tonie, because it does not fit the display. */
    hidden: boolean;
    visibleCount: number;
    onMove: (from: number, to: number) => void;
    onRemove: () => void;
    onInfo: (tonie: TonieCardProps) => void;
}

const SortItem: React.FC<ItemProps> = ({
    ruid,
    index,
    count,
    tonie,
    hidden,
    visibleCount,
    onMove,
    onRemove,
    onInfo,
}) => {
    const { t } = useTranslation();
    const { token } = useToken();
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: ruid });

    const disabled = { color: token.colorTextDisabled, cursor: "default" };

    return (
        <Flex
            ref={setNodeRef}
            align="center"
            gap={10}
            style={{
                transform: CSS.Transform.toString(transform),
                transition: isDragging ? undefined : transition,
                padding: `${token.paddingXXS}px ${token.paddingXS}px`,
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: token.borderRadius,
                background: isDragging
                    ? token.colorFillSecondary
                    : hidden
                      ? token.colorWarningBg
                      : token.colorBgContainer,
                borderColor: hidden ? token.colorWarningBorder : undefined,
                position: "relative",
                zIndex: isDragging ? 1 : undefined,
            }}
        >
            {/* only the handle starts a drag, so the list still scrolls on touch devices */}
            <HolderOutlined
                ref={setActivatorNodeRef}
                aria-label={t("teddybox.edit.dragToSort")}
                style={{ cursor: "grab", touchAction: "none", padding: token.paddingXXS }}
                {...attributes}
                {...listeners}
            />
            {hidden ? (
                <HiddenWarning
                    style={{ minWidth: 18 }}
                    title={t("teddybox.edit.hiddenShort")}
                    text={t("teddybox.edit.hiddenItem", { position: index + 1, max: visibleCount })}
                />
            ) : (
                <Text type="secondary" style={{ minWidth: 18, textAlign: "right" }}>
                    {index + 1}
                </Text>
            )}
            {tonie?.tonieInfo?.picture ? (
                <img
                    src={toImageSrc(tonie.tonieInfo.picture)}
                    alt=""
                    style={{
                        width: token.controlHeight,
                        height: token.controlHeight,
                        objectFit: "contain",
                        flex: "none",
                    }}
                />
            ) : (
                <span style={{ width: token.controlHeight, flex: "none" }} />
            )}
            <Text ellipsis style={{ flex: 1, minWidth: 0 }} type={tonie ? undefined : "secondary"}>
                {tonieLabel(tonie, t("teddybox.edit.tonieMissing"))}
            </Text>
            <Flex gap={12} style={{ flex: "none" }}>
                {tonie && (
                    <InfoCircleOutlined
                        aria-label={t("teddybox.edit.tonieInfo")}
                        onClick={() => onInfo(tonie)}
                    />
                )}
                <ArrowUpOutlined
                    aria-label={t("teddybox.edit.moveUp")}
                    style={index === 0 ? disabled : undefined}
                    onClick={() => index > 0 && onMove(index, index - 1)}
                />
                <ArrowDownOutlined
                    aria-label={t("teddybox.edit.moveDown")}
                    style={index === count - 1 ? disabled : undefined}
                    onClick={() => index < count - 1 && onMove(index, index + 1)}
                />
                <CloseOutlined
                    aria-label={t("teddybox.edit.removeTonie")}
                    style={{ color: token.colorError }}
                    onClick={onRemove}
                />
            </Flex>
        </Flex>
    );
};

interface TonieSortListProps {
    ruids: string[];
    tonieById: Map<string, TonieCardProps>;
    onChange: (ruids: string[]) => void;
    onInfo: (tonie: TonieCardProps) => void;
    /** Tonies after this position are marked as not shown to the child. */
    visibleCount?: number;
}

/** Selected tonies of a shelf, sortable by dragging the handle or with the arrow icons. */
export const TonieSortList: React.FC<TonieSortListProps> = ({
    ruids,
    tonieById,
    onChange,
    onInfo,
    visibleCount = Infinity,
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const move = (from: number, to: number) => onChange(arrayMove(ruids, from, to));

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={({ active, over }) => {
                if (!over || active.id === over.id) return;
                const from = ruids.indexOf(String(active.id));
                const to = ruids.indexOf(String(over.id));
                if (from >= 0 && to >= 0) move(from, to);
            }}
        >
            <SortableContext items={ruids} strategy={verticalListSortingStrategy}>
                <Flex vertical gap={6}>
                    {ruids.map((ruid, index) => (
                        <SortItem
                            key={ruid}
                            ruid={ruid}
                            index={index}
                            count={ruids.length}
                            tonie={tonieById.get(ruid)}
                            hidden={index >= visibleCount}
                            visibleCount={visibleCount}
                            onMove={move}
                            onRemove={() => onChange(ruids.filter((r) => r !== ruid))}
                            onInfo={onInfo}
                        />
                    ))}
                </Flex>
            </SortableContext>
        </DndContext>
    );
};
