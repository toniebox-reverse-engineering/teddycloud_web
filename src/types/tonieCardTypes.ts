export type ValidateStatus = "" | "success" | "warning" | "error" | "validating" | undefined;

export type ValidationState = {
    validateStatus: ValidateStatus;
    help: string;
};

export type TooltipInfo = {
    model?: string;
    series?: string;
    episode?: string;
    no?: string;
    title?: string;
    release?: string;
    language?: string;
    category?: string;
};
