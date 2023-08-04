import { useEffect, useState } from "react";
import { defaultAPIConfig } from "../../config/defaultApiConfig";
import { BoxineApi, BoxineForcedApi } from "../../api";
import { Badge, Space } from "antd";

const api = new BoxineApi(defaultAPIConfig());
const api2 = new BoxineForcedApi(defaultAPIConfig());

export const ServerStatus = () => {
  const [boxineStatus, setBoxineStatus] = useState<boolean>(false);
  const [teddyStatus, setTeddyStatus] = useState<boolean>(false);

  useEffect(() => {
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

    const interval = setInterval(() => {
      fetchTime();
    }, 1000 * 10);
    return () => clearInterval(interval);
  }, []);

  return (
    <Space>
      <div>
        Boxine
        <Badge dot status={boxineStatus ? "success" : "error"} />
      </div>
      <div>
        TeddyCloud
        <Badge dot status={teddyStatus ? "success" : "error"} />
      </div>
    </Space>
  );
};
