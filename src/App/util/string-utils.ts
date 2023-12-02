export const strToHyphenatedLowerCase = (str: string): string => {
    return str.toLowerCase().replace(/\s+/g, '-');
}
