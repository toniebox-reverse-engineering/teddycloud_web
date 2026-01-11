import React from "react";
import JSZip from "jszip";
import { useTranslation } from "react-i18next";
import { Button } from "antd";

const createPluginJson = (): string =>
    `{
  "pluginName": "PlugIn Template",
  "author": "b1u3n4z9u1 + ChatGPT",
  "version": "0.1.0",
  "description": "Minimal starter for TeddyCloud plugins with theme compatibility and version display. The index.html contains a sample section as a placeholder. Extend the logic in script.js and adjust the markup/style as needed.",
  "standalone": false,
  "pluginHomepage": "Homepage of the plugin (optionally)",
  "teddyCloudSection": "one of: home|tonies|tonieboxes|settings|community (optionally)",
  "icon": "name of an icon from Ant Design icons (optional)"
}`;

const createScriptJs = (): string =>
    `// PlugIn Template - Minimal Script
(function () {
  "use strict";

  const PLUGIN_NAME = "PlugIn Template";
  const PLUGIN_VERSION = "1.0.0";

  function el(id) {
    return document.getElementById(id);
  }

  function applyVersion() {
    const verEl = el("scriptVersion");
    if (verEl) verEl.textContent = "(v" + PLUGIN_VERSION + ")";
    try {
      document.title = PLUGIN_NAME + " (v" + PLUGIN_VERSION + ")";
    } catch (_) {}
  }

  function init() {
    applyVersion();
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();`;

const createIndexHtml = (): string =>
    `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <title>PlugIn Template <span id="scriptVersion"></title>

    <style>
      :root {
        --tc-bg: #fff;
        --tc-fg: #1f2328;
        --tc-muted: #667085;
        --tc-border: #d0d7de;
        --tc-primary: #1677ff;
        --tc-bg-soft: #f6f8fa;
        --tc-radius: 10px;
        --tc-gap: 8px;
        --tc-gap-md: 16px;
      }
      :root[data-tc-theme="dark"] {
        --tc-bg: #0f1419;
        --tc-fg: #e6e7ea;
        --tc-muted: #9aa0a6;
        --tc-border: #2b3138;
        --tc-primary: #3b82f6;
        --tc-bg-soft: #141b22;
      }
      html,
      body {
        background: var(--tc-bg);
        color: var(--tc-fg);
        font: inherit;
        font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
          Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
      }
      body {
        margin: 16px;
        max-width: 1050px;
      }
      .row {
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
        margin: 8px 0;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      @media (max-width: 900px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
      .w-100 {
        width: 100%;
      }
      .w-80 {
        width: 80px;
      }
      .minw-100 {
        min-width: 100px;
      }
      .minw-140 {
        min-width: 140px;
      }
      .minw-220 {
        min-width: 220px;
      }
      .minw-260 {
        min-width: 260px;
      }
      .minw-280 {
        min-width: 280px;
      }
      .muted {
        color: var(--tc-muted);
      }
      .ant-card {
        background: var(--tc-bg);
        border: 1px solid var(--tc-border);
        border-radius: var(--tc-radius);
        padding: var(--tc-gap-md);
        margin-bottom: var(--tc-gap-md);
      }
      .ant-space {
        gap: 10px;
      }
      .ant-tag {
        display: inline-block;
        padding: 2px 8px;
        border: 1px solid var(--tc-border);
        border-radius: 6px;
        background: var(--tc-bg-soft);
      }
      input[type="text"],
      input[type="number"],
      select,
      textarea {
        font: inherit;
        color: inherit;
        background: var(--tc-bg-soft);
        border: 1px solid var(--tc-border);
        border-radius: 8px;
        padding: 8px 10px;
      }
      textarea {
        width: 100%;
        min-height: 160px;
        resize: vertical;
        box-sizing: border-box;
      }
      .ant-input,
      .ant-input-number,
      .ant-select,
      textarea.ant-input {
        background: var(--tc-bg-soft);
        border: 1px solid var(--tc-border);
        color: inherit;
      }
      .ant-btn {
        border: 1px solid var(--tc-border);
        border-radius: 8px;
        padding: 8px 12px;
        background: transparent;
        color: inherit;
        cursor: pointer;
      }
      .ant-btn[disabled] {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .ant-btn-primary {
        background: var(--tc-primary);
        color: #fff;
        border-color: transparent;
      }
      .ok {
        color: #10b981;
      }
      .warn {
        color: #f59e0b;
      }
      .err {
        color: #ef4444;
      }
      :focus-visible {
        outline: 2px solid var(--tc-primary);
        outline-offset: 2px;
      }
      .visually-hidden {
        position: absolute !important;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      #TemplateRaw {
        max-height: 260px;
      }
      section[aria-label="Upload & Template"] {
        margin-top: var(--tc-gap-md);
      }
    </style>

    <!-- THEME ADAPTER -->
    <script>
      (function () {
        const root = document.documentElement;
        const setVars = (bg, fg, fontFamily, fontSize) => {
          if (!bg || !fg) return;
          root.style.setProperty("--tc-bg", String(bg).trim());
          root.style.setProperty("--tc-fg", String(fg).trim());
          root.style.setProperty(
            "--tc-border",
            "color-mix(in srgb, " + fg + " 20%, transparent)"
          );
          root.style.setProperty(
            "--tc-bg-soft",
            "color-mix(in srgb, " + bg + " 92%, " + fg + " 8%)"
          );
          if (!root.style.getPropertyValue("--tc-primary"))
            root.style.setProperty("--tc-primary", "#1677ff");
          if (fontFamily) {
            document.documentElement.style.fontFamily = fontFamily;
            document.body.style.fontFamily = fontFamily;
          }
          if (fontSize) {
            document.documentElement.style.fontSize = fontSize;
            document.body.style.fontSize = fontSize;
          }
        };
        const rgbToL = (rgb) => {
          const m = rgb && rgb.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/i);
          if (!m) return null;
          const [r, g, b] = [+m[1], +m[2], +m[3]];
          return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        };
        const applyThemeFlag = (bg) => {
          const L = rgbToL(bg);
          if (L != null)
            root.setAttribute("data-tc-theme", L < 0.5 ? "dark" : "light");
        };
        const applyExplicit = (t) => {
          if (t === "dark" || t === "light") {
            root.setAttribute("data-tc-theme", t);
            return true;
          }
          return false;
        };
        const urlTheme = (
          new URLSearchParams(location.search).get("tcTheme") || ""
        ).toLowerCase();
        const sysQuery =
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)");
        const followSystem = () =>
          applyExplicit(sysQuery.matches ? "dark" : "light");
        const readFromParent = () => {
          try {
            const pdoc = window.parent && window.parent.document;
            if (!pdoc) return false;
            const hostEl =
              pdoc.querySelector(".ant-layout-content") ||
              pdoc.querySelector("main.ant-layout-content") ||
              pdoc.body;
            if (!hostEl) return false;
            const cs = window.parent.getComputedStyle(hostEl);
            const bg =
              cs.backgroundColor || cs.background || "rgb(255,255,255)";
            const fg = cs.color || "rgb(31,35,40)";
            const font =
              cs.fontFamily ||
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            const fontSize = cs.fontSize || "14px";
            setVars(bg, fg, font, fontSize);
            if (!root.hasAttribute("data-tc-theme")) applyThemeFlag(bg);
            return true;
          } catch (e) {
            return false;
          }
        };
        if (urlTheme && urlTheme !== "auto") applyExplicit(urlTheme);
        readFromParent();
        if (!root.hasAttribute("data-tc-theme") || urlTheme === "auto") {
          if (sysQuery) {
            followSystem();
            try {
              sysQuery.addEventListener("change", followSystem);
            } catch (_) {
              sysQuery.addListener && sysQuery.addListener(followSystem);
            }
          }
        }
        window.addEventListener(
          "message",
          (ev) => {
            const d = ev && ev.data;
            if (
              d &&
              d.type === "tc-theme" &&
              (d.theme === "dark" || d.theme === "light")
            )
              applyExplicit(d.theme);
            if (d && d.type === "tc-theme-vars" && d.bg && d.fg) {
              setVars(d.bg, d.fg);
              applyThemeFlag(d.bg);
            }
          },
          false
        );
        (function () {
          try {
            const pdoc = window.parent && window.parent.document;
            if (!pdoc) return;
            const hostEl =
              pdoc.querySelector(".ant-layout-content") ||
              pdoc.querySelector("main.ant-layout-content") ||
              pdoc.body;
            const update = () => {
              readFromParent();
            };
            const mo = new MutationObserver(update);
            mo.observe(pdoc.documentElement, {
              attributes: true,
              attributeFilter: ["class", "data-theme"],
            });
            mo.observe(pdoc.body, {
              attributes: true,
              attributeFilter: ["class", "data-theme", "style"],
            });
            if (hostEl && hostEl !== pdoc.body)
              mo.observe(hostEl, {
                attributes: true,
                attributeFilter: ["class", "data-theme", "style"],
              });
            window.parent.addEventListener &&
              window.parent.addEventListener("transitionend", update, true);
            window.parent.addEventListener &&
              window.parent.addEventListener("resize", update);
            let i = 0;
            const t = setInterval(() => {
              update();
              if (++i > 5) clearInterval(t);
            }, 2000);
          } catch (_) {}
        })();
      })();
    </script>  
  </head>

  <body class="ant-typography">
    <header class="ant-space">
      <h1 class="ant-typography">
        PlugIn Template <span id="scriptVersion" class="muted"></span>
      </h1>
    </header>

    <!-- PlugIn Template - Example Section
      ==================================
      Place your own content here.
      - You can rename this section or add additional sections.
      - Use existing classes (ant-card, ant-typography) to keep the theme consistent.
      - Logic for buttons/inputs should go into script.js within the init() area.
    -->

    <!-- PlugIn Template - Example Section -->
    <section class="ant-card" aria-labelledby="custom-section-heading">
      <h3 id="custom-section-heading" class="ant-typography">Section</h3>
      <div class="muted">Hier platzierst du deinen eigenen Inhalt.</div>
    </section>

    <!-- Notes:
      - You can extend this section as you like or add more sections.
      - Interactions/logic belong in the script.js file (function init()). 
    -->

    <!-- End of Example Section -->

    <script src="./script.js"></script>
  </body>
</html>`;

const createReadme = (): string =>
    `# TeddyCloud Plugin Template

This is a minimal starter for creating TeddyCloud plugins.
It includes:
- basic theme compatibility
- a simple version display
- a minimal HTML layout with one example section

---

## Folder Structure

pluginTemplate/
├── plugin.json
├── index.html
├── script.js
└── README.md

You can add more files as needed, for example:
- \`preview.png\` to provide a preview image for your plugin
- additional JavaScript or CSS files
- assets such as images or icons

---

## plugin.json

- \`pluginName\`: Display name of your plugin
- \`author\`: Your name or nickname
- \`version\`: Plugin version (semantic versioning is recommended)
- \`description\`: Short description of what the plugin does
- \`standalone\`: true (as boolean, no quotes!) if plugin shall be run in standalone mode without header, sidebar and footer. It will be opened in a new tab.
- \`pluginHomepage\`: Optional project or documentation URL
- \`teddyCloudSection\`: Optional section of the TeddyCloud UI (home|tonies|tonieboxes|settings|community)
- \`icon\`: Optional Ant Design icon name

---

## index.html

The \`index.html\` file is the main entrypoint of your plugin when rendered
inside TeddyCloud. Adapt the markup and styling to your use case. You can
add more sections, forms, tables, or any other HTML elements that fit your plugin.

---

## script.js

The \`script.js\` file is loaded after the DOM is ready and can be used to:
- add dynamic behavior
- handle user interaction
- perform API calls
- update the DOM based on data

Extend the template script as needed. The current version only sets the title
and plugin version marker.

---

## Getting Started

1. Download this ZIP file.
2. Extract it into the TeddyCloud plugin directory (or the expected location).
3. Rename the folder from \`pluginTemplate\` to your desired plugin ID.
4. Adjust \`plugin.json\`, \`index.html\` and \`script.js\` to fit your plugin.
5. Reload TeddyCloud and activate or open your plugin.

Have fun building your TeddyCloud plugin!`;

const downloadPluginTemplate = (): void => {
    const zip = new JSZip();
    const folder = zip.folder("pluginTemplate");
    if (!folder) return;

    // Do not change these lines (file names and contents must stay as-is)
    folder.file("plugin.json", createPluginJson());
    folder.file("script.js", createScriptJs());
    folder.file("index.html", createIndexHtml());
    folder.file("README.md", createReadme());

    zip.generateAsync({ type: "blob" }).then((blob) => {
        const blobUrl = URL.createObjectURL(blob);

        const anchor = document.createElement("a");
        anchor.href = blobUrl;
        anchor.download = "pluginTemplate.zip";
        anchor.style.display = "none";

        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        URL.revokeObjectURL(blobUrl);
    });
};

const PluginTemplateDownloadButton: React.FC = () => {
    const { t } = useTranslation();

    return <Button onClick={downloadPluginTemplate}>{t("community.plugins.downloadPluginTemplate")}</Button>;
};

export default PluginTemplateDownloadButton;
