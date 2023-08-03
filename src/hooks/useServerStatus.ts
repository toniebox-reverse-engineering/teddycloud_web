import { defaultAPIConfig } from "../config/defaultApiConfig";
import { BoxineApi, BoxineForcedApi } from "../api";

export enum ServerType {
  "TeddyCloud",
  "Boxine",
}
const api = new BoxineApi(defaultAPIConfig());
const api2 = new BoxineForcedApi(defaultAPIConfig());

export const useServerStatus = (server: ServerType) => {
  let serverStatus = false;
  const fetchTime = async () => {
    if (server === ServerType.Boxine) {
      try {
        const timeRequest = (await api.v1TimeGet()) as String;
        if (timeRequest && timeRequest.length === 10) {
          serverStatus = true;
        }
      } catch (e) {
        serverStatus = false;
      }
    } else if (server === ServerType.TeddyCloud) {
      try {
        const timeRequest = (await api2.reverseV1TimeGet()) as String;

        if (timeRequest && timeRequest.length === 10) {
          serverStatus = true;
        }
      } catch (e) {
        serverStatus = false;
      }
    }
  };

  fetchTime();

  return serverStatus;
};
