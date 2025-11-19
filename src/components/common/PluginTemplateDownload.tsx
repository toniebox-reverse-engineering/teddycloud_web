import React from "react";
import JSZip from "jszip";
import { useTranslation } from "react-i18next";
import { Button } from "antd";

const PluginTemplateDownloadButton: React.FC = () => {
    const { t } = useTranslation();
    const downloadPluginTemplate = () => {
        const zip = new JSZip();
        const folder = zip.folder("pluginTemplate");
        if (!folder) return;

        folder.file(
            "plugin.json",
            `{
  "pluginName": "PlugIn Template",
  "author": "b1u3n4z9u1 + ChatGPT",
  "version": "0.1.0",
  "description": "Minimal starter for TeddyCloud plugins with theme compatibility and version display. The index.html contains a sample section as a placeholder. Extend the logic in script.js and adjust the markup/style as needed.",
  "pluginHomepage": "Homepage of the plugin (optionally)",
  "teddyCloudSection": "one of: home|tonies|tonieboxes|settings|community (optionally)",
  "icon": "name of an icon fromt Ant Design icon component here https://ant.design/components/icon (optionally)"
  }`
        );

        folder.file(
            "script.js",
            `// PlugIn Template – Minimal Script
// This script shows the version and serves as the entry point for your own logic.
// Theme/styles are defined in index.html.

(function () {
  "use strict";

  const PLUGIN_NAME = "PlugIn Template";
  const PLUGIN_VERSION = "1.0.0";

  function el(id) {
    return document.getElementById(id);
  }

  function applyVersion() {
    const verEl = el("scriptVersion");
    if (verEl) {
      verEl.textContent = "(v" + PLUGIN_VERSION + ")";
    }
    try {
      document.title = PLUGIN_NAME + " (v" + PLUGIN_VERSION + ")";
    } catch (_) {}
  }

  function init() {
    applyVersion();
    // YOUR CODE STARTS HERE:
    // Example:
    // const btn = el('myButton');
    // if (btn) btn.addEventListener('click', () => { /* ... */ });
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();`
        );

        folder.file(
            "index.html",
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

    <!-- PlugIn Template – Example Section
      ==================================
      Place your own content here.
      - You can rename this section or add additional sections.
      - Use existing classes (ant-card, ant-typography) to keep the theme consistent.
      - Logic for buttons/inputs should go into script.js within the init() area.
    -->

    <!-- PlugIn Template – Example Section -->
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
</html>
`
        );

        folder.file(
            "README.md",
            `# TeddyCloud Plugin Template

This is a minimal starter for creating TeddyCloud plugins.  
It includes theme compatibility, a version display, and a simple \`index.html\` placeholder section.

---

## Plugin Folder Structure & Requirements

To make your plugin **discoverable** and listed in the **Community navigation**, it must follow this structure and include a valid \`index.html\` and \`plugin.json\` file.  
An optional \`preview.png\` will be shown as an image in the plugin card.

### Folder Structure

\`\`\`
your-plugin-name/
├── plugin.json
├── index.html
├── script.js (optional)
├── preview.png (optional)
└── (other plugin files)
\`\`\`

---

## \`plugin.json\` - Required Metadata

Every plugin must include a **\`plugin.json\`** file in its root.  
This file describes the plugin and allows it to be displayed properly in the TeddyCloud UI.

### Example

\`\`\`json
{
  "pluginName": "Awesome Plugin",
  "description": "A short summary of what this plugin does.",
  "author": "Author's name",
  "version": "1.0.0",
  "pluginHomepage": "https://example.com",
  "teddyCloudSection": "tonies",
  "icon": "TrophyOutlined"
}
\`\`\`

### Fields

- **\`pluginName\`** *(required)*  
  The title shown in menus.

- **\`description\`**  
  Short summary of the plugin's purpose.

- **\`author\`**  
  Name of the author or maintainer.

- **\`version\`**  
  Version string of the plugin (e.g. \`1.0.0\`).

- **\`pluginHomepage\`**  
  Optional link to the plugin's homepage or repository.

- **\`teddyCloudSection\`**  
  The section in TeddyCloud where the plugin will appear.  
  **Valid values:**  
  - \`home\`  
  - \`tonies\`  
  - \`tonieboxes\`  
  - \`settings\`  
  - \`community\`  

- **\`icon\`**  
  The icon used for the plugin. Must be a valid Ant Design icon component from https://ant.design/components/icon.  
  **Examples:**  
  - \`TrophyOutlined\`  
  - \`TagsOutlined\` 

---

## Requirements Summary

- \`plugin.json\` → **mandatory**  
- \`index.html\` → **mandatory**  
- \`script.js\` → optional  
- \`preview.png\` → optional (displayed in plugin card)  
- Other files → optional (JS, CSS, assets, etc.)  

---

**Tip:** Keep your plugin self-contained. Avoid relying on external CDNs if possible, so your plugin works offline in TeddyCloud.`
        );

        zip.generateAsync({ type: "blob" }).then((content: Blob) => {
            const url = URL.createObjectURL(content);
            const a = document.createElement("a");
            a.href = url;
            a.download = "pluginTemplate.zip";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    };

    return <Button onClick={downloadPluginTemplate}>{t("community.plugins.downloadPluginTemplate")}</Button>;
};

export default PluginTemplateDownloadButton;
