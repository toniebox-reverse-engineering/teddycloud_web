export const ESP32_CHIPNAME = "ESP32-S3";
export const ESP32_FLASHSIZE = 8192;

export enum ESP32_FLASH_STEPS {
    PREP = 0,
    READ = 1,
    PATCH = 2,
    WRITE = 3,
    FINISH = 4,
}
