import "styled-components";
import type { GlobalToken } from "antd/es/theme/interface";

declare module "styled-components" {
    export interface DefaultTheme {
        antdToken: GlobalToken;
    }
}
