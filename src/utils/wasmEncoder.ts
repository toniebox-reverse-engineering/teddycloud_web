/**
 * @file wasmEncoder.ts
 * @brief TypeScript wrapper for the WASM toniefile encoder
 * 
 * This module provides a high-level TypeScript interface to the WebAssembly
 * encoder, handling memory management and providing a clean API.
 */

import type { MyUploadFile } from './encoder';

// Emscripten module base type
interface EmscriptenModule {
    HEAP16: Int16Array;
    HEAPU8: Uint8Array;
    _malloc(size: number): number;
    _free(ptr: number): void;
}

// Type definitions for the WASM module
interface TafEncoderModule extends EmscriptenModule {
    _taf_encoder_create(audioId: number, bitrate: number): number;
    _taf_encoder_encode(ctx: number, pcmDataPtr: number, numSamples: number): number;
    _taf_encoder_new_chapter(ctx: number): number;
    _taf_encoder_finalize(ctx: number): number;
    _taf_encoder_get_buffer(ctx: number): number;
    _taf_encoder_get_size(ctx: number): number;
    _taf_encoder_free(ctx: number): void;
    _malloc(size: number): number;
    _free(ptr: number): void;
    HEAP16: Int16Array;
    HEAPU8: Uint8Array;
}

let wasmModule: TafEncoderModule | null = null;
let isLoading = false;

/**
 * Load the WASM module
 */
export async function loadWasmEncoder(): Promise<void> {
    if (wasmModule) {
        return; // Already loaded
    }

    if (isLoading) {
        // Wait for existing load to complete
        while (isLoading) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return;
    }

    try {
        isLoading = true;

        // Load the WASM module via script tag (Emscripten UMD format)
        // The module will be available as a global 'createTafEncoder' function
        await new Promise<void>((resolve, reject) => {
            // Check if already loaded
            if (typeof (window as any).createTafEncoder === 'function') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = '/web/wasm/taf_encoder.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load WASM script'));
            document.head.appendChild(script);
        });

        const createModule = (window as any).createTafEncoder;

        if (typeof createModule !== 'function') {
            throw new Error('WASM module did not export createTafEncoder function');
        }

        wasmModule = await createModule();

        console.log('WASM TAF encoder loaded successfully');
    } catch (error) {
        console.error('Failed to load WASM TAF encoder:', error);
        throw new Error('Failed to load WASM TAF encoder: ' + error);
    } finally {
        isLoading = false;
    }
}

/**
 * Check if WASM encoder is available
 */
export function isWasmEncoderAvailable(): boolean {
    return wasmModule !== null;
}

/**
 * TAF Encoder class
 */
export class WasmTafEncoder {
    private audioId: number;
    private bitrate: number;
    private ctx: number = 0;
    private initialized: boolean = false;

    constructor(audioId: number, bitrate: number = 96) {
        this.audioId = audioId;
        this.bitrate = bitrate;
    }

    /**
     * Initialize the encoder
     */
    async initialize(): Promise<void> {
        if (!wasmModule) {
            await loadWasmEncoder();
        }

        if (!wasmModule) {
            throw new Error('WASM module not loaded');
        }

        this.ctx = wasmModule._taf_encoder_create(this.audioId, this.bitrate);
        if (this.ctx === 0) {
            throw new Error('Failed to initialize WASM TAF encoder');
        }

        this.initialized = true;
    }

    /**
     * Add PCM samples (int16, stereo interleaved)
     */
    addSamples(pcmData: Int16Array): void {
        if (!this.initialized || !wasmModule) {
            throw new Error('Encoder not initialized');
        }

        // Process in chunks to avoid memory issues and match native test behavior
        // 48000 frames * 2 channels = 96000 samples
        const CHUNK_FRAMES = 48000;
        const CHUNK_SIZE = CHUNK_FRAMES * 2;

        for (let offset = 0; offset < pcmData.length; offset += CHUNK_SIZE) {
            const end = Math.min(offset + CHUNK_SIZE, pcmData.length);
            const chunk = pcmData.subarray(offset, end);

            // Allocate memory in WASM
            const numBytes = chunk.length * 2; // int16 = 2 bytes
            const ptr = wasmModule._malloc(numBytes);

            try {
                // Copy data to WASM memory
                wasmModule.HEAP16.set(chunk, ptr / 2);

                // Call encoder (numSamples = number of sample frames, not total samples)
                const numSamples = chunk.length / 2; // Stereo, so divide by 2
                const result = wasmModule._taf_encoder_encode(this.ctx, ptr, numSamples);

                if (result !== 0) {
                    throw new Error('Failed to encode samples');
                }
            } finally {
                // Free WASM memory
                wasmModule._free(ptr);
            }
        }
    }

    /**
     * Start a new chapter
     */
    newChapter(): void {
        if (!this.initialized || !wasmModule) {
            throw new Error('Encoder not initialized');
        }

        const result = wasmModule._taf_encoder_new_chapter(this.ctx);
        if (result !== 0) {
            throw new Error('Failed to create new chapter');
        }
    }

    /**
     * Finalize encoding and get TAF file as Blob
     */
    finalize(): Blob {
        if (!this.initialized || !wasmModule) {
            throw new Error('Encoder not initialized');
        }

        // Finalize encoding
        const finalizeResult = wasmModule._taf_encoder_finalize(this.ctx);
        if (finalizeResult !== 0) {
            throw new Error('Failed to finalize encoding');
        }

        // Get buffer pointer and size
        const bufferPtr = wasmModule._taf_encoder_get_buffer(this.ctx);
        const size = wasmModule._taf_encoder_get_size(this.ctx);

        if (bufferPtr === 0 || size === 0) {
            throw new Error('No encoded data available');
        }

        // Copy data from WASM memory to JavaScript
        const tafData = new Uint8Array(size);
        tafData.set(wasmModule.HEAPU8.subarray(bufferPtr, bufferPtr + size));

        // Free WASM resources
        wasmModule._taf_encoder_free(this.ctx);
        this.initialized = false;
        this.ctx = 0;

        // Return as Blob
        return new Blob([tafData], { type: 'application/octet-stream' });
    }

    /**
     * Convert audio file to PCM data
     */
    private static async audioFileToPcm(file: File): Promise<Int16Array> {
        const arrayBuffer = await file.arrayBuffer();
        const audioContext = new AudioContext();

        // Decode audio
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Resample to 48kHz if needed
        const targetSampleRate = 48000;
        let resampledBuffer = audioBuffer;

        if (audioBuffer.sampleRate !== targetSampleRate) {
            const offlineContext = new OfflineAudioContext({
                numberOfChannels: 2,
                length: Math.round((audioBuffer.length * targetSampleRate) / audioBuffer.sampleRate),
                sampleRate: targetSampleRate,
            });

            const source = offlineContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(offlineContext.destination);
            source.start();

            resampledBuffer = await offlineContext.startRendering();
        }

        // Convert to interleaved int16 PCM (stereo)
        const leftChannel = resampledBuffer.getChannelData(0);
        const rightChannel = resampledBuffer.numberOfChannels > 1
            ? resampledBuffer.getChannelData(1)
            : leftChannel; // Duplicate mono to stereo

        const pcmData = new Int16Array(leftChannel.length * 2);
        for (let i = 0; i < leftChannel.length; i++) {
            // Clamp to int16 range
            pcmData[i * 2] = Math.max(-32768, Math.min(32767, Math.round(leftChannel[i] * 32767)));
            pcmData[i * 2 + 1] = Math.max(-32768, Math.min(32767, Math.round(rightChannel[i] * 32767)));
        }

        return pcmData;
    }

    /**
     * Encode multiple audio files into a single TAF
     * 
     * @param files Array of audio files to encode
     * @param audioId Audio ID for the TAF file
     * @param onProgress Optional progress callback (current, total, currentFile)
     * @returns TAF file as Blob
     */
    static async encodeMultipleFiles(
        files: MyUploadFile[],
        audioId: number,
        onProgress?: (current: number, total: number, currentFile: string) => void
    ): Promise<Blob> {
        // Ensure WASM is loaded
        await loadWasmEncoder();

        const encoder = new WasmTafEncoder(audioId);
        await encoder.initialize();

        let finalized = false;
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if (!file.file) {
                    throw new Error(`File ${i} has no file data`);
                }

                // Start new chapter for each file (except the first)
                if (i > 0) {
                    encoder.newChapter();
                }

                // Report progress
                if (onProgress) {
                    onProgress(i, files.length, file.name);
                }

                // Convert audio file to PCM
                const pcmData = await WasmTafEncoder.audioFileToPcm(file.file);

                // Add to encoder
                encoder.addSamples(pcmData);
            }

            // Report completion
            if (onProgress) {
                onProgress(files.length, files.length, 'Finalizing...');
            }

            // Finalize and return (this frees the encoder)
            const result = encoder.finalize();
            finalized = true;
            return result;
        } catch (error) {
            // Clean up on error ONLY if not finalized
            if (!finalized && encoder.initialized && wasmModule && encoder.ctx !== 0) {
                try {
                    wasmModule._taf_encoder_free(encoder.ctx);
                    encoder.initialized = false;
                    encoder.ctx = 0;
                } catch (e) {
                    console.error('Error during cleanup:', e);
                }
            }
            throw error;
        }
    }

    /**
     * Encode a single audio file to TAF
     * 
     * @param file Audio file to encode
     * @param audioId Audio ID for the TAF file
     * @returns TAF file as Blob
     */
    static async encodeSingleFile(file: File, audioId: number): Promise<Blob> {
        const myFile: MyUploadFile = {
            uid: '1',
            name: file.name,
            file: file,
        };

        return WasmTafEncoder.encodeMultipleFiles([myFile], audioId);
    }
}
