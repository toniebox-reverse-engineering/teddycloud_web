export type TonieInfo = {
    series: string;
    episode: string;
    language: string;
    model: string;
    picture: string;
    tracks: string[];
};

export type TonieCardProps = {
    uid: string;
    ruid: string;
    type: string;
    valid: boolean;
    exists: boolean;
    claimed: boolean;
    hide: boolean;
    live: boolean;
    nocloud: boolean;
    hasCloudAuth: boolean;
    source: string;
    audioUrl: string;
    downloadTriggerUrl: string;
    tonieInfo: TonieInfo;
    sourceInfo: TonieInfo;
    trackSeconds: number[];
};

export type TagTonieCard = {
    tagInfo: TonieCardProps;
};

export type TagTonieCardsList = {
    tags: TonieCardProps[];
};
