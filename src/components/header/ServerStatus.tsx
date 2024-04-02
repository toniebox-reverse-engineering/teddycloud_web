import { useEffect, useState } from "react";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { BoxineApi, BoxineForcedApi } from "../../api";
import { Badge, Space } from "antd";
import { HiddenDesktop, HiddenMobile } from "../StyledComponents";

const api = new BoxineApi(defaultAPIConfig());
const api2 = new BoxineForcedApi(defaultAPIConfig());

export const ServerStatus = () => {
  const [boxineStatus, setBoxineStatus] = useState<boolean>(false);
  const [teddyStatus, setTeddyStatus] = useState<boolean>(false);

  const fetchTime = async () => {
    try {
      const timeRequest = (await api.v1TimeGet()) as String;
      if (timeRequest.length === 10) {
        setTeddyStatus(true);
      }
    } catch (e) {
      setTeddyStatus(false);
    }
    try {
      const timeRequest2 = (await api2.reverseV1TimeGet()) as String;

      if (timeRequest2.length === 10) {
        setBoxineStatus(true);
      }
    } catch (e) {
      setBoxineStatus(false);
    }
  };

  useEffect(() => {
    fetchTime();
  }, []);

  return (
    <Space>
      <div>
        <HiddenDesktop>B</HiddenDesktop>
        <HiddenMobile>Boxine</HiddenMobile>
        <Badge dot status={boxineStatus ? "success" : "error"} />
      </div>
      <div>
        <HiddenDesktop>TC</HiddenDesktop>
        <HiddenMobile>TeddyCloud</HiddenMobile>
        <Badge dot status={teddyStatus ? "success" : "error"} />
      </div>
    </Space>
  );
};
