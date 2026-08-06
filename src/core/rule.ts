export interface Rule {
    name: string;
    description: string;
    condition: (metrics: Metrics) => boolean;
    action: (metrics: Metrics) => void;
}
