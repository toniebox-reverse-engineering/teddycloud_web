import { UploadFile } from "antd";

export interface MyUploadFile<T = any> extends UploadFile<T> {
    file?: File;
}

export function upload(
    resolve: (value: unknown) => void,
    reject: (reason?: any) => void,
    formData: FormData,
    fileList: MyUploadFile<any>[],
    file: MyUploadFile<any>,
    debugPCMObjects?: boolean
) {
    const reader = new FileReader();

    reader.onload = async (event) => {
        try {
            if (event.target == null) return;
            const arrayBuffer = event.target.result as ArrayBuffer;
            const audioContext = new AudioContext();
            const targetSampleRate = 48000;

            const originalAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const offlineAudioContext = new OfflineAudioContext({
                numberOfChannels: originalAudioBuffer.numberOfChannels,
                length: Math.round((originalAudioBuffer.length * targetSampleRate) / originalAudioBuffer.sampleRate),
                sampleRate: targetSampleRate,
            });

            const offlineSource = offlineAudioContext.createBufferSource();
            offlineSource.buffer = originalAudioBuffer;

            offlineSource.connect(offlineAudioContext.destination);
            offlineSource.start();

            const upsampledAudioBuffer = await offlineAudioContext.startRendering();

            const leftChannelData = new Float32Array(upsampledAudioBuffer.getChannelData(0));
            const rightChannelData = new Float32Array(upsampledAudioBuffer.getChannelData(1));

            const interleavedData = new Int16Array(leftChannelData.length + rightChannelData.length);
            for (let i = 0, j = 0; i < leftChannelData.length; i++, j += 2) {
                interleavedData[j] = Math.max(-32767, Math.min(32767, leftChannelData[i] * 32767));
                interleavedData[j + 1] = Math.max(-32767, Math.min(32767, rightChannelData[i] * 32767));
            }

            // Debug and save PCM data if needed
            if (debugPCMObjects) {
                console.log(`To download the file for debugging, copy and paste the following code into your browser's console:

(function() {
    const link = document.createElement('a');
    link.href = '${URL.createObjectURL(new Blob([interleavedData.buffer], { type: "audio/pcm" }))}';
    link.download = '${`pcmData.${fileList.indexOf(file)}.pcm`}';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
})(); 

                `);
            }

            formData.append(file.name, new Blob([interleavedData.buffer]), `pcmData.${fileList.indexOf(file)}.pcm`);
            resolve(undefined);
        } catch (error) {
            reject(error);
        }
    };

    reader.onerror = reject;

    if (file.file) {
        reader.readAsArrayBuffer(file.file);
    }
}
