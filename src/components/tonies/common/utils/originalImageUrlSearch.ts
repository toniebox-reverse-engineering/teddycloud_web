/** Whitespace-separated tokens; URL must contain every token as substring (case-insensitive). Order-independent. */
export const tokenizeOriginalImageSearch = (raw: string): string[] => raw.trim().split(/\s+/).filter(Boolean);

export const originalImageUrlMatchesTokens = (url: string, tokens: string[]): boolean => {
    if (tokens.length === 0) return true;
    const lower = url.toLowerCase();
    return tokens.every((t) => lower.includes(t.toLowerCase()));
};
