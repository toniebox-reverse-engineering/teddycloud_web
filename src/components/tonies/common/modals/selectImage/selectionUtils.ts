export const toggleSelection = (current: string[], value: string): string[] =>
    current.includes(value) ? current.filter((item) => item !== value) : [...current, value];

export const nextSelectionForMode = (
    current: string[],
    value: string,
    allowMultiple: boolean,
): string[] => (allowMultiple ? toggleSelection(current, value) : [value]);
