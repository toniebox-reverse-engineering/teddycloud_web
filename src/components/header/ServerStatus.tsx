import { ServerType, useServerStatus } from "../../hooks/useServerStatus";
import { Badge, Space } from "antd";

export const ServerStatus = () => {
  const boxineStatus = useServerStatus(ServerType.Boxine);
  const teddyStatus = useServerStatus(ServerType.TeddyCloud);
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
