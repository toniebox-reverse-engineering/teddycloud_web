import { Form } from "antd";

import Item from "antd/es/list/Item";
import { useTranslation } from "react-i18next";
import {
  HiddenDesktop,
  StyledBreadcrumb,
  StyledBreadcrumbItem,
  StyledContent,
  StyledLayout,
  StyledSider,
} from "../../components/StyledComponents";
import { SettingsSubNav } from "../../components/settings/SettingsSubNav";
import { OptionsList, TeddyCloudApi } from "../../api";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { useEffect, useState } from "react";
import OptionItem from "../../components/settings/OptionItem";
import { Formik } from "formik";

const api = new TeddyCloudApi(defaultAPIConfig());

export const TonieboxSettingsPage : React.FC<{ overlay: string }> = ({ overlay }) =>  {
  const { t } = useTranslation();
  const [options, setOptions] = useState<OptionsList | undefined>();

  useEffect(() => {
    const fetchOptions = async () => {
      const optionsRequest = (await api.apiGetIndexGet(overlay)) as OptionsList;
      if (
        optionsRequest?.options?.length &&
        optionsRequest?.options?.length > 0
      ) {
        setOptions(optionsRequest);
      }
    };

    fetchOptions();
  }, []);

  return (
    <>
          <Formik
            // validationSchema={settingsValidationSchema}
            initialValues={{
              test: "test",
            }}
            onSubmit={(values: any) => {
              // nothing to submit because of field onchange
            }}
          >
            <Form
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 14 }}
              layout="horizontal"
            >

              { // to do change that to upcoming flag which indicates if overlaying make sense
                options?.options?.map((option, index, array) => {
                if(
                    !option.iD.includes("core.client_cert.") && 
                    !option.iD.includes("core.flex_") && 
                    !option.iD.includes("toniebox.")  && 
                    !option.iD.includes("cloud.enabled") && 
                    !option.iD.includes("cloud.enableV1Claim") && 
                    !option.iD.includes("cloud.enableV1CloudReset") && 
                    !option.iD.includes("cloud.enableV1FreshnessCheck")  && 
                    !option.iD.includes("cloud.enableV1Log")  && 
                    !option.iD.includes("cloud.enableV1Time")  && 
                    !option.iD.includes("cloud.enableV1Ota")  && 
                    !option.iD.includes("cloud.enableV2Content")  && 
                    !option.iD.includes("cloud.cacheOta")  && 
                    !option.iD.includes("cloud.localOta")  && 
                    !option.iD.includes("cloud.cacheContent")  && 
                    !option.iD.includes("cloud.cacheToLibrary")  && 
                    !option.iD.includes("cloud.markCustomTagByPass")  && 
                    !option.iD.includes("cloud.prioCustomContent")  && 
                    !option.iD.includes("cloud.updateOnLowerAudioId")  && 
                    !option.iD.includes("cloud.dumpRuidAuthContentJson") 
                ) { 
                    return ""; 
                };

                const parts = option.iD.split(".");
                const lastParts = array[index - 1]
                  ? array[index - 1].iD.split(".")
                  : [];
                return (
                  <>
                    {parts.slice(0, -1).map((part, index) => {
                      if (lastParts[index] !== part) {
                        if (index === 0) {
                          return (
                            <h3
                              style={{
                                marginLeft: `${index * 20}px`,
                                marginBottom: "10px",
                              }}
                              key={index}
                            >
                              Category {part}
                            </h3>
                          );
                        } else {
                          return (
                            <h4
                              style={{
                                marginLeft: `${index * 10}px`,
                                marginTop: "10px",
                                marginBottom: "10px",
                              }}
                              key={index}
                            >
                              .{part}
                            </h4>
                          );
                        }
                      }
                      return null;
                    })}

                    <OptionItem option={option} overlayId={overlay}/>
                  </>
                );
              })}
            </Form>
          </Formik>
          </>
  );
};
