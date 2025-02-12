export interface ViewChild {
    id: string;
    component: string;
    slot: string;
    data?: Record<string, any>;
}

export interface ViewLayout {
    areas: string;
    rows?: string;
}

export interface View {
    id: string;
    layout: ViewLayout;
    children: ViewChild[];
    metadata?: {
        composer?: string;
    };
    customConfig?: {
        showSpacer?: boolean;
    };
} 