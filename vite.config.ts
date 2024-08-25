import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import fs from "fs";
import path from "path";

export default defineConfig(({ command, mode }) => {
    const portHttp = parseInt(process.env.VITE_APP_TEDDYCLOUD_PORT_HTTP || "3000", 10);
    const portHttps = parseInt(process.env.VITE_APP_TEDDYCLOUD_PORT_HTTPS || "3443", 10);
    const baseApiUrl = process.env.VITE_APP_TEDDYCLOUD_API_URL || "http://localhost";
    const useHttps = process.env.HTTPS === "true";

    const httpsOptions = useHttps
        ? {
              key: fs.readFileSync(path.resolve(__dirname, "./localhost-key.pem")),
              cert: fs.readFileSync(path.resolve(__dirname, "./localhost.pem")),
          }
        : undefined;

    const targetUrl = useHttps ? `https://localhost:${portHttps}` : `http://localhost:${portHttp}`;

    return {
        base: "/web",
        plugins: [react(), viteTsconfigPaths()],
        server: {
            open: true,
            port: useHttps ? portHttps : portHttp,
            host: true,
            https: httpsOptions,
            proxy: {
                "/img_unknown.png": {
                    target: targetUrl,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/img_unknown\.png/, `${baseApiUrl}/web/img_unknown.png`),
                    secure: false,
                },
            },
        },
    };
});
