import { TonieInfo } from "./tonieTypes";

export interface RecordTafHeader {
    audioId?: any;
    sha1Hash?: any;
    size?: number;
    trackSeconds?: number[];
    valid?: boolean;
}

export interface FileObject {
    uid: string;
    name: string;
    path: string;
}

export type Record = {
    date: number;
    isDir: boolean;
    name: string;
    tafHeader: RecordTafHeader;
    tonieInfo: TonieInfo;
};
