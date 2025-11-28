// List of supported audio file extensions used in the application.
export const ffmpegSupportedExtensions = [
    ".mp3",
    ".aac",
    ".m4a",
    ".wav",
    ".flac",
    ".ogg",
    ".opus",
    ".aiff",
    ".aif",
    ".wma",
    ".ac3",
    ".dts",
    ".taf",
    ".mp4",
];

export type FfmpegSupportedExtension = (typeof ffmpegSupportedExtensions)[number];
