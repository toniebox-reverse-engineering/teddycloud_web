import { FolderOpenOutlined } from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import { Location } from "@remix-run/router";
import { useTranslation } from "react-i18next";
import {
  HiddenDesktop,
  StyledBreadcrumb,
  StyledContent,
  StyledLayout,
  StyledSider,
} from "../../components/StyledComponents";
import type { DragEndEvent } from "@dnd-kit/core";
import { DndContext, PointerSensor, useSensor } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button, message, Upload, Typography, Flex, Collapse } from "antd";
import type { UploadProps } from "antd";
import { useState } from "react";
import { ToniesSubNav } from "../../components/tonies/ToniesSubNav";
import { FileBrowser } from "../../components/tonies/FileBrowser";
import { DraggableUploadListItem } from "../../components/tonies/DraggableUploadListItem";
import { MyUploadFile, upload } from "../../util/encoder";
import { createQueryString, getFilePathFromQueryParam } from "../../util/url";

const { Text, Paragraph } = Typography;

export const EncoderPage = () => {
  const { t } = useTranslation();
  const location: Location = useLocation();

  const [fileList, setFileList] = useState<MyUploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [tafFilename, setTafFilename] = useState("NewContent");

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
      setTafFilename("NewContent");
    } else {
      console.log("Upload failed:", responseData);
      message.error(t("tonies.encoder.uploadFailed"));
    }
    setUploading(false);
  };

  const updateTafFilename = (filename: string) => {
    if (filename === "") {
      setTafFilename("NewContent");
      return;
    }
    setTafFilename(filename);
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
      />
    ),
  };

  const collapseItems = [
    {
      key: 1,
      label: (
        <Paragraph
          editable={{ onChange: updateTafFilename }}
          style={{ margin: 0, marginRight: 16 }}
        >
          <Text type="secondary">
            {t("tonies.encoder.targetDirectory")} {getFilePathFromQueryParam(location)}
          </Text>
          {tafFilename}
          <Text type="secondary">
            .taf
          </Text>
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
          <div style={{ marginBottom: 16 }}>
            <Collapse bordered={true} items={collapseItems} />
          </div>
          <DndContext sensors={[sensor]} onDragEnd={onDragEnd}>
            <SortableContext
              items={fileList.map((i) => i.uid)}
              strategy={verticalListSortingStrategy}
            >
              <Upload {...props}>
                <Button icon={<FolderOpenOutlined />}>
                  {t("tonies.encoder.uploadFiles")}
                </Button>
              </Upload>
              {fileList.length > 0 ? (
                <Flex
                  justify={"flex-end"}
                  align="center"
                  style={{ marginTop: 16 }}
                >
                  <Button
                    type="primary"
                    onClick={handleUpload}
                    disabled={fileList.length === 0}
                    loading={uploading}
                  >
                    {uploading
                      ? t("tonies.encoder.uploading")
                      : t("tonies.encoder.upload")}
                  </Button>
                </Flex>
              ) : (
                <></>
              )}
            </SortableContext>
          </DndContext>
        </StyledContent>
      </StyledLayout>
    </>
  );
};
