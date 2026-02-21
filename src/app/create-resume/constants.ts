export const TEMPLATES = [
    {
        id: "professional",
        name: "Professional",
        description: "Clean and professional design with a dark header.",
        image: "/templates/professional.png"
    },
    {
        id: "modern",
        name: "Modern",
        description: "Contemporary design with a sidebar layout.",
        image: "/templates/modern.png"
    },
    {
        id: "classic",
        name: "Classic",
        description: "Traditional layout perfect for any industry.",
        image: "/templates/classic.png"
    },
];

export interface Resume {
    id: string;
    title: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ResumeLimit {
    canCreate: boolean;
    count: number;
    limit: string | number;
    isPro: boolean;
}
