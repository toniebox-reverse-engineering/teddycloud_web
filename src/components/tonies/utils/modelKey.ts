export const toModelKey = (model?: string) => {
    return (model || "").trim().toLowerCase();
};
