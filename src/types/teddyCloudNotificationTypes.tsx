export type NotificationType = "success" | "info" | "warning" | "error";

export type NotificationRecord = {
    date: Date;
    type: NotificationType;
    message: string;
    description: string;
    flagConfirmed: boolean;
};
