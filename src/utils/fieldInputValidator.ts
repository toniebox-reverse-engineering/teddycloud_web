export const invalidCharacters = /[<>:"/\\|?*]/;

export const invalidCharactersAsString = invalidCharacters.source.slice(1, -1).split("").join(" ");

export function isInputValid(inputValue: string) {
    return !invalidCharacters.test(inputValue);
}
