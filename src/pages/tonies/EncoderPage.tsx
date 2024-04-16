import { FolderOpenOutlined } from "@ant-design/icons";
import type { DragEndEvent } from "@dnd-kit/core";
import { DndContext, PointerSensor, useSensor } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Location } from "@remix-run/router";
import type { UploadProps } from "antd";
import {
  Button,
  Collapse,
  Divider,
  Input,
  Space,
  Typography,
  Upload,
  message,
} from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import {
  HiddenDesktop,
  StyledBreadcrumb,
  StyledContent,
  StyledLayout,
  StyledSider,
} from "../../components/StyledComponents";
import { DraggableUploadListItem } from "../../components/tonies/DraggableUploadListItem";
import { FileBrowser } from "../../components/tonies/FileBrowser";
import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import { MyUploadFile, upload } from "../../util/encoder";
import { createQueryString, getFilePathFromQueryParam } from "../../util/url";

const { Paragraph } = Typography;

export const EncoderPage = () => {
  const { t } = useTranslation();
  const location: Location = useLocation();

  const [fileList, setFileList] = useState<MyUploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [tafFilename, setTafFilename] = useState("");

  const sensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 10 },
  });

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      setFileList((prev) => {
        const activeIndex = prev.findIndex((i) => i.uid === active.id);
        const overIndex = prev.findIndex((i) => i.uid === over?.id);
        return arrayMove(prev, activeIndex, overIndex);
      });
    }
  };

  const onChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    setFileList(newFileList as MyUploadFile[]);
  };

  const onRemove = (file: MyUploadFile) => {
    const index = fileList.indexOf(file);
    const newFileList = fileList.slice();
    newFileList.splice(index, 1);
    setFileList(newFileList);
  };

  const handleUpload = async () => {
    setUploading(true);
    const formData = new FormData();

    for (const file of fileList) {
      await new Promise((resolve, reject) =>
        upload(resolve, reject, formData, fileList, file)
      );
    }

    const currentUnixTime = Math.floor(Date.now() / 1000);
    const queryParams = {
      name: tafFilename + ".taf",
      audioId: currentUnixTime - 0x50000000,
      path: getFilePathFromQueryParam(location),
      special: "library",
    };

    const queryString = createQueryString(queryParams);
    const response = await fetch(
      `${process.env.REACT_APP_TEDDYCLOUD_API_URL}/api/pcmUpload?${queryString}`,
      {
        method: "POST",
        body: formData,
      }
    );

    const responseData = await response.text();
    if (response.ok) {
      message.success(t("tonies.encoder.uploadSuccessful"));
      setFileList([]);
      setTafFilename("");
    } else {
      console.log("Upload failed:", responseData);
      message.error(t("tonies.encoder.uploadFailed"));
    }
    setUploading(false);
  };

  const props: UploadProps = {
    listType: "picture",
    multiple: true,
    beforeUpload: (file) => {
      const myFile: MyUploadFile = file;
      myFile.file = file;
      fileList.push(myFile);
      setFileList(fileList);

      return false;
    },
    fileList,
    onChange: onChange,
    itemRender: (originNode, file) => (
      <DraggableUploadListItem
        originNode={originNode}
        fileList={fileList}
        file={file}
        onRemove={onRemove}
        disabled={uploading}
      />
    ),
  };

  const collapseItems = [
    {
      key: 1,
      label: (
        <Paragraph style={{ margin: 0, marginRight: 16 }}>
          {t("tonies.encoder.targetDirectory")}
        </Paragraph>
      ),
      children: (
        <FileBrowser special="library" trackUrl={true} showDirOnly={true} />
      ),
    },
  ];

  return (
    <>
      <StyledSider>
        <ToniesSubNav />
      </StyledSider>
      <StyledLayout>
        <HiddenDesktop>
          <ToniesSubNav />
        </HiddenDesktop>
        <StyledBreadcrumb
          items={[
            { title: t("home.navigationTitle") },
            { title: t("tonies.navigationTitle") },
            { title: t("tonies.encoder.navigationTitle") },
          ]}
        />
        <StyledContent>
          <h1>{t("tonies.encoder.title")}</h1>
          <Space direction="vertical" style={{ display: "flex" }}>
            <DndContext sensors={[sensor]} onDragEnd={onDragEnd}>
              <SortableContext
                items={fileList.map((i) => i.uid)}
                strategy={verticalListSortingStrategy}
              >
                <Upload {...props}>
                  <Button icon={<FolderOpenOutlined />} disabled={uploading}>
                    {t("tonies.encoder.uploadFiles")}
                  </Button>
                </Upload>
              </SortableContext>
            </DndContext>
            {fileList.length > 0 ? (
              <>
                <Divider />
                <Collapse bordered={true} items={collapseItems} />
                <Space direction="vertical" style={{display: "flex", alignItems: "flex-end"}}>
                  <Input
                    addonAfter=".taf"
                    addonBefore={
                      t("tonies.encoder.saveAs") +
                      ": " +
                      getFilePathFromQueryParam(location)
                    }
                    required
                    status={
                      fileList.length > 0 && tafFilename === "" ? "error" : ""
                    }
                    onChange={(event) => setTafFilename(event.target.value)}
                    disabled={uploading}
                    itemRef="inputRef"
                  />
                  <Button
                    type="primary"
                    onClick={handleUpload}
                    disabled={fileList.length === 0 || tafFilename === ""}
                    loading={uploading}
                  >
                    {uploading
                      ? t("tonies.encoder.uploading")
                      : t("tonies.encoder.upload")}
                  </Button>
                </Space>
              </>
            ) : (
              <></>
            )}
          </Space>
        </StyledContent>
      </StyledLayout>
    </>
  );
};
