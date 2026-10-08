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

    // Use the configured URL as is: the proxy must talk to exactly the host and port that was set.
    const proxyUrl = env.VITE_APP_TEDDYCLOUD_API_URL || "http://teddycloud.local";

    // All teddyCloud paths the app requests ("/reverse" also covers "/reverseGeneric")
    const teddyCloudPaths = [
        "/api",
        "/img_unknown.png",
        "/cache",
        "/img",
        "/custom_img",
        "/plugins",
        "/content",
        "/library",
        "/v1",
        "/reverse",
    ];
    const proxyOptions = { target: proxyUrl, changeOrigin: true, secure: false };
    const teddyCloudProxy = Object.fromEntries(teddyCloudPaths.map((p) => [p, proxyOptions]));

    const devBase = "/web";

    // Opt-in: the dev server proxies everything except the app itself to teddyCloud, so the
    // browser only sees one origin. Needed for images and audio with web login enabled,
    // as those requests carry no bearer token and the session cookie is not set cross-origin.
    const useDevProxy = command === "serve" && env.VITE_APP_TEDDYCLOUD_DEV_PROXY === "true";

    return {
        // Production builds use a relative base so the bundle works under any URL prefix
        // (index.html injects a matching <base href> at runtime). The dev server keeps /web.
        base: command === "build" ? "./" : devBase,
        // With the dev proxy, API URLs must be relative so that they hit the proxy below.
        // VITE_APP_TEDDYCLOUD_API_URL is only used as proxy target then.
        define: useDevProxy
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
            proxy: useDevProxy ? { [`^(?!${devBase}(/|$)).*`]: proxyOptions } : teddyCloudProxy,
        },
        // `vite preview` inherits server.proxy by default; keep it limited to the teddyCloud paths.
        preview: {
            proxy: teddyCloudProxy,
        },
    };
});
