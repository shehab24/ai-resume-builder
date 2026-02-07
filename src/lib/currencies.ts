// Common currencies for job postings
export const CURRENCIES = [
    { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
    { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
    { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
    { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
    { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
    { code: "THB", symbol: "฿", name: "Thai Baht" },
    { code: "PHP", symbol: "₱", name: "Philippine Peso" },
    { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
    { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
] as const;

export type CurrencyCode = typeof CURRENCIES[number]["code"];

export function getCurrencySymbol(code: string): string {
    const currency = CURRENCIES.find(c => c.code === code);
    return currency?.symbol || "$";
}

export function formatSalary(min: number | null, max: number | null, currency: string = "USD"): string {
    const symbol = getCurrencySymbol(currency);

    if (!min && !max) return "Negotiable";
    if (min && !max) return `${symbol}${min.toLocaleString()}+`;
    if (!min && max) return `Up to ${symbol}${max.toLocaleString()}`;
    return `${symbol}${min?.toLocaleString()} - ${symbol}${max?.toLocaleString()}`;
}
