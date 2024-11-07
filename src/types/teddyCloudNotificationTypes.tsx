export type NotificationType = "success" | "info" | "warning" | "error";

export type NotificationRecord = {
    uuid: string;
    date: Date;
    context: string;
    type: NotificationType;
    title: string;
    description: string;
    flagConfirmed: boolean;
};
