export type NotificationType = "success" | "info" | "warning" | "error";

export enum NotificationTypeEnum {
    Success = "success",
    Info = "info",
    Warning = "warning",
    Error = "error",
}

export type NotificationRecord = {
    uuid: string;
    date: Date;
    context: string;
    type: NotificationType;
    title: string;
    description: string;
    flagConfirmed: boolean;
};
