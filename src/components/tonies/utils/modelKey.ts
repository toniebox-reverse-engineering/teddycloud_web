export const toModelKey = (model?: unknown) => {
    if (model === null || model === undefined) return "";
    return String(model).trim().toLowerCase();
};
