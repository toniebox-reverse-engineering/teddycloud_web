import { UploadFile } from "antd";

export interface MyUploadFile<T = any> extends UploadFile<T> {
    file?: File;
}

const TARGET_SAMPLE_RATE = 48000;

/**
 * Creates an AudioContext with a fallback for Safari (webkitAudioContext).
 */
function createAudioContext(): AudioContext {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) {
        throw new Error("Web Audio API is not supported in this browser.");
    }
    return new AudioCtx() as AudioContext;
}

/**
 * Creates an OfflineAudioContext with support for both the modern
 * options-object signature and the legacy constructor used by older Safari versions.
 */
function createOfflineAudioContext(channels: number, length: number, sampleRate: number): OfflineAudioContext {
    const OfflineCtx = (window as any).OfflineAudioContext || (window as any).webkitOfflineAudioContext;

    if (!OfflineCtx) {
        throw new Error("OfflineAudioContext is not supported in this browser.");
    }

    try {
        // Modern signature
        return new OfflineCtx({
            numberOfChannels: channels,
            length,
            sampleRate,
        }) as OfflineAudioContext;
    } catch {
        // Legacy Safari signature
        return new OfflineCtx(channels, length, sampleRate) as OfflineAudioContext;
    }
}

/**
 * Converts any audio ArrayBuffer to 48 kHz stereo 16-bit PCM (interleaved).
 */
async function encodeToStereoPcm16(
    arrayBuffer: ArrayBuffer,
    debugPCMObjects: boolean | undefined,
    debugFileIndex: number
): Promise<Int16Array> {
    const audioContext = createAudioContext();

    try {
        // Decode audio file into a standardized AudioBuffer
        const originalAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Compute resampled length
        const targetLength = Math.round(
            (originalAudioBuffer.length * TARGET_SAMPLE_RATE) / originalAudioBuffer.sampleRate
        );

        // Create OfflineAudioContext for resampling
        const offlineAudioContext = createOfflineAudioContext(
            originalAudioBuffer.numberOfChannels,
            targetLength,
            TARGET_SAMPLE_RATE
        );

        const offlineSource = offlineAudioContext.createBufferSource();
        offlineSource.buffer = originalAudioBuffer;
        offlineSource.connect(offlineAudioContext.destination);
        offlineSource.start();

        // Perform rendering (resampling)
        const upsampledAudioBuffer = await offlineAudioContext.startRendering();

        const numberOfChannels = upsampledAudioBuffer.numberOfChannels;

        // Left channel always exists
        const leftChannelData = upsampledAudioBuffer.getChannelData(0);

        // If mono, duplicate channel 0 → stereo
        const rightChannelData =
            numberOfChannels > 1 ? upsampledAudioBuffer.getChannelData(1) : upsampledAudioBuffer.getChannelData(0);

        const frameCount = leftChannelData.length;
        const interleavedData = new Int16Array(frameCount * 2);

        // Convert floats (-1..1) to 16-bit PCM
        for (let i = 0; i < frameCount; i++) {
            const l = Math.max(-1, Math.min(1, leftChannelData[i]));
            const r = Math.max(-1, Math.min(1, rightChannelData[i]));

            interleavedData[i * 2] = l < 0 ? l * 0x8000 : l * 0x7fff;
            interleavedData[i * 2 + 1] = r < 0 ? r * 0x8000 : r * 0x7fff;
        }

        // Optional debugging output
        if (debugPCMObjects) {
            const blob = new Blob([interleavedData.buffer as unknown as ArrayBuffer], { type: "audio/pcm" });
            const url = URL.createObjectURL(blob);
            const filename = `pcmData.${debugFileIndex}.pcm`;

            const snippet = `(function() {
    const link = document.createElement('a');
    link.href = '${url}';
    link.download = '${filename}';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
})();`;

            console.log("Paste this code into the console to download the PCM debug file:\n\n" + snippet + "\n");
        }

        return interleavedData;
    } finally {
        // Clean up AudioContext to avoid hitting context limits in browsers
        try {
            await audioContext.close();
        } catch {
            // Ignored; some browsers throw here.
        }
    }
}

/**
 * Upload handler used by the AntD Upload component.
 * Converts the input audio file into 48 kHz stereo 16-bit PCM
 * and appends it to the provided FormData.
 */
export function upload(
    resolve: (value: unknown) => void,
    reject: (reason?: any) => void,
    formData: FormData,
    fileList: MyUploadFile<any>[],
    file: MyUploadFile<any>,
    debugPCMObjects?: boolean
) {
    if (!file.file) {
        resolve(undefined);
        return;
    }

    (async () => {
        try {
            if (file.file) {
                const arrayBuffer = await file.file.arrayBuffer();
                const fileIndex = fileList.indexOf(file);

                const pcmData = await encodeToStereoPcm16(arrayBuffer, debugPCMObjects, fileIndex);

                const filename = `pcmData.${fileIndex}.pcm`;

                // Cast ensures compatibility: BlobPart expects ArrayBuffer, not ArrayBufferLike
                const blob = new Blob([pcmData.buffer as unknown as ArrayBuffer], { type: "audio/pcm" });

                formData.append(file.name, blob, filename);
            }
            resolve(undefined);
        } catch (error) {
            reject(error);
        }
    })().catch((error) => {
        reject(error);
    });
}
