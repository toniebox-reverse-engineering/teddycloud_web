import React, { useState } from "react";
import { Button, Checkbox, Modal } from "antd";
import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

export interface CustomModelEditModalProps {
    open: boolean;
    onCancel: () => void;
    onSave?: () => void;
    onSaveForNavigate?: () => void;
    onPrev?: () => void;
    onNext?: () => void;
    canGoPrev?: boolean;
    canGoNext?: boolean;
    currentIndex?: number;
    totalItems?: number;
    hasChanges?: () => boolean;
    title?: string;
    hideNavigationControls?: boolean;
    /** e.g. when opened from edit Tonie, stack above the parent Modal */
    zIndex?: number;
    children: React.ReactNode;
}

export const CustomModelEditModal: React.FC<CustomModelEditModalProps> = ({
    open,
    onCancel,
    onSave,
    onSaveForNavigate,
    onPrev,
    onNext,
    canGoPrev = false,
    canGoNext = false,
    currentIndex = 0,
    totalItems = 0,
    hasChanges = () => false,
    title,
    hideNavigationControls = false,
    zIndex,
    children,
}) => {
    const { t } = useTranslation();
    const [saveOnNavigate, setSaveOnNavigate] = useState<boolean>(false); // disabled save on navigate by default since it's seems to be not working
    const handleNext = () => {
        if (saveOnNavigate && hasChanges()) (onSaveForNavigate ?? onSave)?.();
        onNext?.();
    };
    const handlePrev = () => {
        if (saveOnNavigate && hasChanges()) (onSaveForNavigate ?? onSave)?.();
        onPrev?.();
    };
    const resolvedTitle =
        title ||
        (totalItems > 0
            ? t("tonies.customEditor.editModalTitle", {
                  current: currentIndex + 1,
                  total: totalItems,
              })
            : t("tonies.customEditor.actions.newModel"));
    return (
        <Modal
            open={open}
            width="90%"
            style={{ maxWidth: 1200 }}
            title={resolvedTitle}
            onCancel={onCancel}
            zIndex={zIndex}
            footer={
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 8,
                    }}
                >
                    {/* // disabled as it seems to be not working

                    !hideNavigationControls && totalItems > 1 ? (
                        <Checkbox
                            checked={saveOnNavigate}
                            onChange={(e) => setSaveOnNavigate(e.target.checked)}
                            style={{ marginRight: "auto" }}
                        >
                            {t("tonies.teddystudio.saveOnNavigate")}
                        </Checkbox>
                    ) : (
                        <div style={{ marginRight: "auto" }} />
                    )
                    
                    */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            flexWrap: "wrap",
                            gap: 8,
                        }}
                    >
                        {!hideNavigationControls && totalItems > 1 && (
                            <Button key="prev" onClick={handlePrev} disabled={!canGoPrev}>
                                <ArrowLeftOutlined />
                            </Button>
                        )}
                        <Button key="cancel" onClick={onCancel}>
                            {t("tonies.teddystudio.cancel")}
                        </Button>
                        {onSave && (
                            <Button
                                key="save"
                                type="primary"
                                onClick={onSave}
                                disabled={!hasChanges()}
                            >
                                {t("tonies.teddystudio.save")}
                            </Button>
                        )}
                        {!hideNavigationControls && totalItems > 1 && (
                            <Button key="next" onClick={handleNext} disabled={!canGoNext}>
                                <ArrowRightOutlined />
                            </Button>
                        )}
                    </div>
                </div>
            }
        >
            {children}
        </Modal>
    );
};
