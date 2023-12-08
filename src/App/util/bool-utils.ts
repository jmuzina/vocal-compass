export const isTruthyOrZero = <T>(
    val: T
): boolean => {
    return !!val || val === 0
}
