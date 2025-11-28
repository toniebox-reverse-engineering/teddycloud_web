/**
 * Type declarations for WASM modules
 */

declare module '/web/wasm/taf_encoder.js' {
    interface TafEncoderModule {
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

    export default function createTafEncoder(): Promise<TafEncoderModule>;
}
