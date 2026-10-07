import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

export default defineConfig(({ command, mode }) => {
    const env = loadEnv(mode, process.cwd(), "");

    const portHttp = parseInt(env.VITE_APP_TEDDYCLOUD_PORT_HTTP || "3000", 10);
    const portHttps = parseInt(env.VITE_APP_TEDDYCLOUD_PORT_HTTPS || "3443", 10);
    const useHttps = env.HTTPS === "true";

    const httpsOptions = useHttps
        ? {
              key: fs.readFileSync(path.resolve(import.meta.dirname, "./localhost-key.pem")),
              cert: fs.readFileSync(path.resolve(import.meta.dirname, "./localhost.pem")),
          }
        : undefined;

    const proxyUrl = env.VITE_APP_TEDDYCLOUD_API_URL
        ? env.VITE_APP_TEDDYCLOUD_API_URL.replace(/^https:/, "http:")
        : "http://teddycloud.local";

    // The dev server serves the app below this path; everything else is proxied to teddyCloud
    const devBase = "/web";

    return {
        // Production builds use a relative base so the bundle works under any URL prefix
        // (index.html injects a matching <base href> at runtime). The dev server keeps /web.
        base: command === "build" ? "./" : devBase,
        // In dev, API URLs must be relative so that they hit the proxy below.
        // VITE_APP_TEDDYCLOUD_API_URL is only used as proxy target there.
        define:
            command === "serve"
                ? { "import.meta.env.VITE_APP_TEDDYCLOUD_API_URL": JSON.stringify("") }
                : {},
        plugins: [
            react(),

            {
                name: "virtual-languages",

                resolveId(id) {
                    if (id === "virtual:languages") {
                        return "\0virtual:languages";
                    }
                },

                load(id) {
                    if (id !== "\0virtual:languages") {
                        return;
                    }

                    const translationsDir = path.resolve(
                        import.meta.dirname,
                        "public/translations",
                    );

                    const languages = fs
                        .readdirSync(translationsDir)
                        .filter((file) => file.endsWith(".json"))
                        .map((file) => path.basename(file, ".json"))
                        .sort((a, b) => {
                            if (a === "en") return -1;
                            if (b === "en") return 1;
                            return a.localeCompare(b);
                        });

                    return `
                        export const LANGUAGES = ${JSON.stringify(languages)};
                        export default LANGUAGES;
                    `;
                },
            },
        ],
        resolve: {
            tsconfigPaths: true,
        },
        server: {
            open: true,
            port: useHttps ? portHttps : portHttp,
            host: true,
            https: httpsOptions,
            // Same-origin setup: API calls send credentials, which do not work cross-origin with CORS "*".
            proxy: {
                [`^(?!${devBase}(/|$)).*`]: {
                    target: proxyUrl,
                    changeOrigin: true,
                    secure: false,
                },
            },
        },
    };
});
