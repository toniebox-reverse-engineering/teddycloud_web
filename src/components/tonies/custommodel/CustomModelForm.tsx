import React from "react";
import { Alert, AutoComplete, Button, Col, Collapse, Form, Input, Row, Space, Tooltip } from "antd";
import { EyeOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { FormInstance } from "antd/es/form";

import { toPreviewableImageUrl } from "../common/utils/imagePathUtils";
import { languageOptions, toLanguageCode } from "../../common/icons/LanguageFlagIcon";
import type { CustomEntry, FormValues } from "./types/customModelEditorTypes";

type AudioLibraryPathInputProps = {
    audioId: string;
    hash: string;
    storedPath: string;
    overlay?: string;
    placeholder: string;
    disabled?: boolean;
    changedInputStyle: (changed: boolean) => React.CSSProperties | undefined;
    areAudioPairsChanged: boolean;
    isUnchanged: boolean;
    onClear: () => void;
    onUndo: () => void;
    onBrowse: () => void;
};

type DisablePerFieldMap = {
    no: boolean;
    model: boolean;
    title: boolean;
    episodes: boolean;
    series: boolean;
    release: boolean;
    language: boolean;
    category: boolean;
    pic: boolean;
    audioPairs: boolean;
    tracks: boolean;
};

interface CustomModelFormProps {
    form: FormInstance<FormValues>;
    selectedIsDeleted: boolean;
    disablePerFieldInMultiSelect: DisablePerFieldMap;
    changedInputStyle: (changed: boolean) => React.CSSProperties | undefined;
    isFieldChanged: (field: PropertyKey) => boolean;
    runCollectImagePathsWhenNeeded: () => void;
    imagePathOptions: string[];
    categoryOptions: string[];
    selectedPic?: string;
    setImageManagerOpen: (open: boolean) => void;
    setPreviewUrl: (url: string) => void;
    setPreviewOpen: (open: boolean) => void;
    areAudioPairsChanged: boolean;
    areTracksChanged: boolean;
    warningBorderColor: string;
    currentBaselineEntry: CustomEntry | null;
    overlay: string;
    setTargetAudioPairIndex: (idx: number | null) => void;
    setKeySelectAudioFileBrowser: React.Dispatch<React.SetStateAction<number>>;
    setSelectAudioModalOpen: (open: boolean) => void;
    AudioLibraryPathInputComponent: React.ComponentType<AudioLibraryPathInputProps>;
}

export const CustomModelForm: React.FC<CustomModelFormProps> = ({
    form,
    selectedIsDeleted,
    disablePerFieldInMultiSelect,
    changedInputStyle,
    isFieldChanged,
    runCollectImagePathsWhenNeeded,
    imagePathOptions,
    categoryOptions,
    selectedPic,
    setImageManagerOpen,
    setPreviewUrl,
    setPreviewOpen,
    areAudioPairsChanged,
    areTracksChanged,
    warningBorderColor,
    currentBaselineEntry,
    overlay,
    setTargetAudioPairIndex,
    setKeySelectAudioFileBrowser,
    setSelectAudioModalOpen,
    AudioLibraryPathInputComponent,
}) => {
    const { t } = useTranslation();

    return (
        <Form<FormValues> form={form} layout="vertical" style={{ marginTop: 12 }} disabled={selectedIsDeleted}>
            <Row gutter={12}>
                <Col span={8}>
                    <Form.Item label={t("tonies.addNewCustomTonieModal.model")} name="model" rules={[{ required: true, message: t("tonies.addNewCustomTonieModal.modelRequired") }]}>
                        <Input disabled={disablePerFieldInMultiSelect.model} style={changedInputStyle(isFieldChanged("model"))} />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item label={t("tonies.addNewCustomTonieModal.series")} name="series" rules={[{ required: true, message: t("tonies.addNewCustomTonieModal.seriesRequired") }]}>
                        <Input disabled={disablePerFieldInMultiSelect.series} style={changedInputStyle(isFieldChanged("series"))} />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item label={t("tonies.addNewCustomTonieModal.episode")} name="episodes">
                        <Input disabled={disablePerFieldInMultiSelect.episodes} style={changedInputStyle(isFieldChanged("episodes"))} />
                    </Form.Item>
                </Col>
            </Row>
            <Collapse defaultActiveKey={["media"]} size="small" style={{ marginBottom: 8 }}>
                <Collapse.Panel key="media" header={t("tonies.customEditor.sections.media")}>
                    <Row gutter={12}>
                        <Col span={24}>
                            <Form.Item label={<>{t("tonies.addNewCustomTonieModal.pic")}<Tooltip title={t("tonies.customEditor.picHint")}><InfoCircleOutlined style={{ marginLeft: 6 }} /></Tooltip></>} name="pic">
                                <Input disabled={disablePerFieldInMultiSelect.pic} list="custom-image-options" style={changedInputStyle(isFieldChanged("pic"))} onFocus={runCollectImagePathsWhenNeeded} />
                            </Form.Item>
                            <datalist id="custom-image-options">{imagePathOptions.map((path) => <option key={path} value={path} />)}</datalist>
                            <Space style={{ marginBottom: 12 }}>
                                <Button disabled={disablePerFieldInMultiSelect.pic} onClick={() => setImageManagerOpen(true)}>{t("tonies.imageManager.titleSelect")}</Button>
                                <Tooltip title={t("tonies.customEditor.actions.preview")}>
                                    <Button icon={<EyeOutlined />} onClick={() => { const pic = form.getFieldValue("pic"); if (!pic) return; setPreviewUrl(toPreviewableImageUrl(pic)); setPreviewOpen(true); }} disabled={!selectedPic} />
                                </Tooltip>
                            </Space>
                        </Col>
                    </Row>
                </Collapse.Panel>
                <Collapse.Panel key="metadata" header={t("tonies.customEditor.sections.metadata")}>
                    <Row gutter={12}>
                        <Col span={8}><Form.Item label={t("tonies.addNewCustomTonieModal.no")} name="no"><Input disabled={disablePerFieldInMultiSelect.no} style={changedInputStyle(isFieldChanged("no"))} /></Form.Item></Col>
                        <Col span={16}><Form.Item label={t("tonies.addNewCustomTonieModal.formfieldTitle")} name="title"><Input disabled={disablePerFieldInMultiSelect.title} style={changedInputStyle(isFieldChanged("title"))} /></Form.Item></Col>
                    </Row>
                    <Row gutter={12}>
                        <Col span={8}>
                            <Form.Item label={t("tonies.addNewCustomTonieModal.release")} name="release" rules={[{ validator: (_, value) => { const asString = value === undefined || value === null ? "" : String(value).trim(); if (asString.length === 0 || /^[0-9]+$/.test(asString)) return Promise.resolve(); return Promise.reject(new Error(t("tonies.customEditor.errors.releaseNumeric"))); } }]}>
                                <Input disabled={disablePerFieldInMultiSelect.release} style={changedInputStyle(isFieldChanged("release"))} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label={t("tonies.addNewCustomTonieModal.language")} name="language" rules={[{ validator: (_, value) => { const candidate = String(value ?? "").trim(); if (candidate.length === 0 || toLanguageCode(candidate)) return Promise.resolve(); return Promise.reject(new Error(t("tonies.customEditor.errors.invalidLanguageCode", { example: "de-de, en-us" }))); } }]}>
                                <AutoComplete disabled={disablePerFieldInMultiSelect.language} style={changedInputStyle(isFieldChanged("language"))} options={languageOptions.map((code) => ({ value: code }))} filterOption={(inputValue, option) => (option?.value ?? "").toLowerCase().includes(inputValue.toLowerCase())} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label={t("tonies.addNewCustomTonieModal.category")} name="category">
                                <AutoComplete disabled={disablePerFieldInMultiSelect.category} style={changedInputStyle(isFieldChanged("category"))} options={categoryOptions.map((value) => ({ value }))} filterOption={(inputValue, option) => (option?.value ?? "").toLowerCase().includes(inputValue.toLowerCase())} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Collapse.Panel>
                <Collapse.Panel key="audio" header={t("tonies.customEditor.sections.audio")}>
                    <Form.List name="audioPairs">
                        {(fields, { remove }) => (
                            <div style={{ border: areAudioPairsChanged ? `1px solid ${warningBorderColor}` : "1px solid transparent", borderRadius: 8, padding: areAudioPairsChanged ? 8 : 0, marginBottom: 8 }}>
                                <Alert type="info" showIcon style={{ marginBottom: 12 }} message={t("tonies.customEditor.coinHint.title")} description={t("tonies.customEditor.coinHint.description")} />
                                {fields.map(({ key, name, ...restField }, idx) => {
                                    const baselineAudioId = currentBaselineEntry?.audio_id?.[idx] ?? "";
                                    const baselineHash = currentBaselineEntry?.hash?.[idx] ?? "";
                                    return (
                                        <Row key={key} gutter={12} style={{ marginTop: 8 }}>
                                            <Col span={10}>
                                                <Form.Item label={idx === 0 ? t("tonies.customEditor.audio.libraryLabel", { library: t("tonies.library.title") }) : ""} shouldUpdate={(prev, next) => prev?.audioPairs?.[name] !== next?.audioPairs?.[name]}>
                                                    {() => {
                                                        const audioId = (form.getFieldValue(["audioPairs", name, "audio_id"]) || "").trim();
                                                        const hashValue = (form.getFieldValue(["audioPairs", name, "hash"]) || "").trim();
                                                        const pathValue = form.getFieldValue(["audioPairs", name, "path"]) || "";
                                                        const isUnchanged = audioId === baselineAudioId && hashValue === baselineHash;
                                                        return (
                                                            <AudioLibraryPathInputComponent
                                                                audioId={audioId}
                                                                hash={hashValue}
                                                                storedPath={pathValue}
                                                                overlay={overlay}
                                                                placeholder={t("tonies.customEditor.audio.placeholder", { library: t("tonies.library.title") })}
                                                                disabled={disablePerFieldInMultiSelect.audioPairs}
                                                                changedInputStyle={changedInputStyle}
                                                                areAudioPairsChanged={areAudioPairsChanged}
                                                                isUnchanged={isUnchanged}
                                                                onClear={() => { form.setFieldValue(["audioPairs", name, "audio_id"], ""); form.setFieldValue(["audioPairs", name, "hash"], ""); form.setFieldValue(["audioPairs", name, "path"], ""); }}
                                                                onUndo={() => { form.setFieldValue(["audioPairs", name, "audio_id"], baselineAudioId); form.setFieldValue(["audioPairs", name, "hash"], baselineHash); form.setFieldValue(["audioPairs", name, "path"], ""); }}
                                                                onBrowse={() => { setTargetAudioPairIndex(name); setKeySelectAudioFileBrowser((k) => k + 1); setSelectAudioModalOpen(true); }}
                                                            />
                                                        );
                                                    }}
                                                </Form.Item>
                                            </Col>
                                            <Col span={6}><Form.Item {...restField} name={[name, "audio_id"]} label={idx === 0 ? t("tonies.addNewCustomTonieModal.audioId") : ""}><Input disabled={disablePerFieldInMultiSelect.audioPairs} placeholder="audio_id" style={changedInputStyle(areAudioPairsChanged)} /></Form.Item></Col>
                                            <Col span={fields.length > 1 ? 6 : 8}><Form.Item {...restField} name={[name, "hash"]} label={idx === 0 ? t("tonies.addNewCustomTonieModal.hash") : ""}><Input disabled={disablePerFieldInMultiSelect.audioPairs} placeholder="hash" style={changedInputStyle(areAudioPairsChanged)} /></Form.Item></Col>
                                            {fields.length > 1 && <Col span={2}><Form.Item label={idx === 0 ? " " : ""}><Button disabled={disablePerFieldInMultiSelect.audioPairs} onClick={() => remove(name)}>-</Button></Form.Item></Col>}
                                        </Row>
                                    );
                                })}
                            </div>
                        )}
                    </Form.List>
                </Collapse.Panel>
                <Collapse.Panel key="tracks" header={t("tonies.customEditor.sections.tracks")}>
                    <Form.List name="tracks">
                        {(fields, { add, remove }) => (
                            <div style={{ border: areTracksChanged ? `1px solid ${warningBorderColor}` : "1px solid transparent", borderRadius: 8, padding: areTracksChanged ? 8 : 0, marginBottom: 8 }}>
                                {fields.map(({ key, name, ...restField }, idx) => (
                                    <Row key={key} gutter={12} style={{ marginTop: 8 }}>
                                        <Col span={22}><Form.Item {...restField} name={[name, "track"]} label={idx === 0 ? t("tonies.addNewCustomTonieModal.track") : ""}><Input disabled={disablePerFieldInMultiSelect.tracks} style={changedInputStyle(areTracksChanged)} /></Form.Item></Col>
                                        <Col span={2}><Button disabled={disablePerFieldInMultiSelect.tracks} style={{ marginTop: idx === 0 ? 30 : 0 }} onClick={() => remove(name)}>-</Button></Col>
                                    </Row>
                                ))}
                                <Button disabled={disablePerFieldInMultiSelect.tracks} type="dashed" onClick={() => add({ track: "" })} block>{t("tonies.addNewCustomTonieModal.addTrack")}</Button>
                            </div>
                        )}
                    </Form.List>
                </Collapse.Panel>
            </Collapse>
        </Form>
    );
};
