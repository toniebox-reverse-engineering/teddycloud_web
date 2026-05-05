import React from "react";
import { theme as antdTheme } from "antd";
import { ThemeProvider } from "styled-components";

export const StyledThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { token } = antdTheme.useToken();

    return <ThemeProvider theme={{ antdToken: token }}>{children}</ThemeProvider>;
};
