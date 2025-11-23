// Characters that are not allowed in file or directory names (Windows-style rules).
export const INVALID_NAME_CHARS = /[<>:"/\\|?*]/;

// Space-separated string representation, useful for tooltips or error messages.
export const INVALID_NAME_CHARS_DISPLAY = INVALID_NAME_CHARS.source.slice(1, -1).split("").join(" ");

/**
 * Returns true if the given input contains at least one invalid character.
 */
export function hasInvalidCharacters(inputValue: string): boolean {
    return INVALID_NAME_CHARS.test(inputValue);
}

/**
 * Returns true if the input does not contain any invalid characters.
 */
export function isInputValid(inputValue: string): boolean {
    return !hasInvalidCharacters(inputValue);
}
