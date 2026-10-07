import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

export default defineConfig(({ command, mode }) => {
    const portHttp = parseInt(process.env.VITE_APP_TEDDYCLOUD_PORT_HTTP || "3000", 10);
    const portHttps = parseInt(process.env.VITE_APP_TEDDYCLOUD_PORT_HTTPS || "3443", 10);
    const useHttps = process.env.HTTPS === "true";

    const httpsOptions = useHttps
        ? {
              key: fs.readFileSync(path.resolve(import.meta.dirname, "./localhost-key.pem")),
              cert: fs.readFileSync(path.resolve(import.meta.dirname, "./localhost.pem")),
          }
        : undefined;

    // Read .env files as well (process.env only contains variables exported in the shell)
    const env = { ...loadEnv(mode, process.cwd(), "VITE_"), ...process.env };
    const apiUrl = env.VITE_APP_TEDDYCLOUD_API_URL;
    const proxyUrl = apiUrl ? apiUrl.replace(/^https:/, "http:") : "http://teddycloud.local";

    const webBase = "/web";

    return {
        base: webBase,
        // In dev, API URLs must be relative so that they hit the proxy below.
        // VITE_APP_TEDDYCLOUD_API_URL is only used as proxy target there.
        define:
            command === "serve"
                ? { "import.meta.env.VITE_APP_TEDDYCLOUD_API_URL": JSON.stringify("") }
                : {},
        plugins: [react()],
        resolve: {
            tsconfigPaths: true,
        },
        server: {
            open: true,
            port: useHttps ? portHttps : portHttp,
            host: true,
            https: httpsOptions,
            // Same-origin setup: the dev server forwards everything except the web app itself to
            // teddyCloud. This way API calls (which send credentials) need neither CORS nor an absolute URL.
            proxy: {
                [`^(?!${webBase}(/|$)).*`]: {
                    target: proxyUrl,
                    changeOrigin: true,
                    secure: false,
                },
            },
        },
    };
});
