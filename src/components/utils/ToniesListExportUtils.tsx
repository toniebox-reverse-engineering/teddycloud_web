export async function exportMarkedToniesHTML(tonieCards: any[], markedTonies: string[], t: (key: string) => string) {
    const items = await Promise.all(
        markedTonies.map(async (ruid) => {
            const card = tonieCards.find((c) => c.ruid === ruid);
            if (!card) return null;

            const cardEl = document.getElementById(ruid);
            const imgEl = cardEl?.querySelector("img") as HTMLImageElement | null;

            let imgSrc = imgEl?.src || "";

            return {
                ruid,
                series: card.tonieInfo.series || t("tonies.unsetTonie"),
                episode: card.tonieInfo.episode || "",
                model: card.tonieInfo.model,
                img: imgSrc,
            };
        })
    );

    const filtered = items.filter(Boolean) as {
        ruid: string;
        series: string;
        episode: string;
        model: string;
        img: string;
    }[];

    const css = `
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 24px; }
    h1 { font-size: 20px; margin: 0 0 16px; }
    ul { list-style: none; padding: 0; margin: 0; }
    li { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
    img.thumb { width: 150px; height: 150px; object-fit: contain; }
    .info { font-size: 14px; }
    .model { color: #666; font-size: 12px; font-family: ui-monospace, monospace; margin-left: 6px; }
    .footer { margin-top: 24px; color: #666; font-size: 12px; }
  `;

    const listHtml = filtered
        .map(
            (item) => `
        <li id="export-${item.ruid}">
          <img class="thumb" src="${escapeHtml(item.img)}" alt="${escapeHtml(item.series)}" />
          <div class="info">
            ${escapeHtml(item.series)} – ${escapeHtml(item.episode)}
            <span class="uid">(${escapeHtml(item.model)})</span>
          </div>
        </li>
      `
        )
        .join("");

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${t("tonies.toniesExportList")}</title>
<style>${css}</style>
</head>
<body>
  <h1>${t("tonies.toniesExportList")}</h1>
  <ul>
    ${listHtml || "<p>No items.</p>"}
  </ul>
  <div class="footer">
    ${t("tonies.toniesExportListCreateDate")} ${new Date().toLocaleString()}
  </div>
</body></html>`;

    downloadBlob(html, "marked_tonies.html", "text/html");
}

export function exportToJSON(tonieCards: any[], markedTonies: string[], t: (key: string) => string) {
    const rows = tonieCards
        .filter((card) => markedTonies.includes(card.ruid))
        .map((card) => ({
            series: card.tonieInfo.series || t("tonies.unsetTonie"),
            episode: card.tonieInfo.episode || "",
            model: card.tonieInfo.model,
        }));

    downloadBlob(JSON.stringify(rows, null, 2), "marked_tonies.json", "application/json");
}

export function exportCompleteInfoToJSON(tonieCards: any[], markedTonies: string[]) {
    const rows = tonieCards.filter((card) => markedTonies.includes(card.ruid));
    downloadBlob(JSON.stringify(rows, null, 2), "marked_tonies.json", "application/json");
}

export function exportToCSV(tonieCards: any[], markedTonies: string[], t: (key: string) => string) {
    const header = "Series,Episode,Model-No\n";

    const rows = tonieCards
        .filter((card) => markedTonies.includes(card.ruid))
        .map((card) => {
            const series = card.tonieInfo.series ? card.tonieInfo.series : t("tonies.unsetTonie");
            const episode = card.tonieInfo.episode || "";
            const model = card.tonieInfo.model || "";

            const escape = (str: string) => `"${String(str).replace(/"/g, '""')}"`;

            return `${escape(series)},${escape(episode)},${escape(model)}`;
        });

    const csvContent = header + rows.join("\n");
    downloadBlob(csvContent, "marked_tonies.csv", "text/csv");
}

// --- helpers ---
function escapeHtml(s: string) {
    return String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function downloadBlob(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type: `${type};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
