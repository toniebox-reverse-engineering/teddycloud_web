import { JSX } from "react";
import { Typography } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import CodeSnippet from "../../../../common/elements/CodeSnippet";
import { ExportOutlined } from "@ant-design/icons";

const { Paragraph } = Typography;

export function installCC3200Tool(): JSX.Element {
    const { t } = useTranslation();

    return (
        <>
            <h4>{t("tonieboxes.boxFlashingCommon.installCC3200Tool.title")}</h4>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.installCC3200Tool.intro")}</Paragraph>
            <ul>
                <li>
                    {t("tonieboxes.boxFlashingCommon.installCC3200Tool.pythonText1")}
                    <Link to="https://www.python.org/downloads/" target="_blank">
                        {t("tonieboxes.boxFlashingCommon.installCC3200Tool.pythonTextLink")} {<ExportOutlined />}
                    </Link>
                    {t("tonieboxes.boxFlashingCommon.installCC3200Tool.pythonText2")}
                </li>
                <li>
                    {t("tonieboxes.boxFlashingCommon.installCC3200Tool.gitText1")}
                    <Link to="https://git-scm.com/book/en/v2/Getting-Started-Installing-Git" target="_blank">
                        {t("tonieboxes.boxFlashingCommon.installCC3200Tool.gitTextLink")} {<ExportOutlined />}
                    </Link>
                    {t("tonieboxes.boxFlashingCommon.installCC3200Tool.gitText2")}
                </li>
                <li>
                    {t("tonieboxes.boxFlashingCommon.installCC3200Tool.pipText1")}
                    <Link to="https://pip.pypa.io/en/stable/installation/" target="_blank">
                        {t("tonieboxes.boxFlashingCommon.installCC3200Tool.pipTextLink")} {<ExportOutlined />}
                    </Link>
                    {t("tonieboxes.boxFlashingCommon.installCC3200Tool.pipText2")}
                </li>
            </ul>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.installCC3200Tool.text")}</Paragraph>

            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`pip install git+git://github.com/toniebox-reverse-engineering/cc3200tool.git`}
                />
            </Paragraph>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.installCC3200Tool.textAlternatively")}</Paragraph>
            <Paragraph>
                <CodeSnippet
                    language="shell"
                    code={`pip install git+https://github.com/toniebox-reverse-engineering/cc3200tool.git`}
                />
            </Paragraph>
            <Paragraph>{t("tonieboxes.boxFlashingCommon.installCC3200Tool.moreInformation")}</Paragraph>
            <Link to="https://github.com/toniebox-reverse-engineering/cc3200tool" target="_blank">
                {t("tonieboxes.boxFlashingCommon.installCC3200Tool.link")} {<ExportOutlined />}
            </Link>
        </>
    );
}
