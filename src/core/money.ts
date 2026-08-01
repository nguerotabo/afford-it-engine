
export function convertToCents (amount: number): number {
    return Math.round(amount * 100);

}

export function convertToDollars (amount: number): number {
    return amount / 100.00;
}
