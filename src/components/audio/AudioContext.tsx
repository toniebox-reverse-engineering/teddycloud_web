import React, { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "antd";

import logoImg from "../../assets/logo.png";

import { supportsOggOpus } from "../../utils/browserUtils";
import { TonieCardProps } from "../../types/tonieTypes";
import { Record } from "../../types/fileBrowserTypes";

type TonieCardTAFRecord = TonieCardProps | Record;

interface AudioContextType {
    playAudio: (url: string, meta?: any, tonieCardOrTAFRecord?: TonieCardTAFRecord, startTime?: number) => void;
    songImage: string;
    songArtist: string;
    songTitle: string;
    songTracks: number[];
    tonieCardOrTAFRecord: TonieCardTAFRecord | undefined;
}

interface AudioProviderProps {
    children: React.ReactNode; // Define the children prop
}

const AudioContext = React.createContext<AudioContextType | undefined>(undefined);

export const useAudioContext = () => {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error("useAudioContext must be used within an AudioProvider");
    }
    return context;
};

const extractFilename = (url: string) => {
    // Remove query parameters if any
    const urlWithoutParams = url.split("?")[0];
    // Extract the filename from the URL
    const parts = urlWithoutParams.split("/");
    return parts[parts.length - 1];
};

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
    const { t } = useTranslation();
    const [songImage, setSongImage] = useState<string>("");
    const [songArtist, setSongArtist] = useState<string>("");
    const [songTitle, setSongTitle] = useState<string>("");
    const [songTracks, setSongTracks] = useState<number[]>([]);
    const [tonieCardOrTAFRecord, setTonieCardOrTAFRecord] = useState<TonieCardTAFRecord | undefined>();

    const playAudio = (url: string, meta?: any, tonieCardOrTAFRecord?: TonieCardTAFRecord, startTime?: number) => {
        console.log("Play audio: " + url);

        const pattern = /\/....04E0\?|(\?ogg)/;
        const matches = pattern.test(url);

        if (matches && !supportsOggOpus()) {
            Modal.error({
                title: t("audio.errorNoOggOpusSupport"),
                content: t("audio.errorNoOggOpusSupportByApple"),
                okText: t("audio.errorConfirm"),
            });
        } else {
            const globalAudio = document.getElementById("globalAudioPlayer") as HTMLAudioElement;
            globalAudio.src = url;
            if (meta) {
                setSongImage(meta.picture);
                setSongArtist(
                    meta.series || meta.episode
                        ? meta.series
                        : extractFilename(decodeURI(url).replace("500304E0", t("audio.unknownSource")))
                );
                setSongTitle(meta.episode);
            } else {
                setSongImage(decodeURI(url).includes(".taf?") ? "/img_unknown.png" : logoImg);
                setSongArtist("");
                setSongTitle(extractFilename(decodeURI(url)));
            }
            if (tonieCardOrTAFRecord) {
                setTonieCardOrTAFRecord(tonieCardOrTAFRecord);

                // Assign trackSeconds array or default to [0] if not present
                const trackSeconds =
                    "trackSeconds" in tonieCardOrTAFRecord
                        ? tonieCardOrTAFRecord.trackSeconds || [0]
                        : "tafHeader" in tonieCardOrTAFRecord && tonieCardOrTAFRecord.tafHeader?.trackSeconds
                        ? tonieCardOrTAFRecord.tafHeader.trackSeconds
                        : [0];
                setSongTracks(trackSeconds);
            } else {
                setSongTracks([0]);
                setTonieCardOrTAFRecord(undefined);
            }

            if (startTime) {
                globalAudio.currentTime = startTime;
            }
            globalAudio.play();
        }
    };

    return (
        <AudioContext.Provider
            value={{
                playAudio,
                songImage,
                songArtist,
                songTitle,
                songTracks,
                tonieCardOrTAFRecord: tonieCardOrTAFRecord,
            }}
        >
            {children}
        </AudioContext.Provider>
    );
};
