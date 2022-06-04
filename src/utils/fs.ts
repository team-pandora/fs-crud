import { once } from 'events';
import * as fs from 'fs';

export const KB = 1024;
export const MB = 1024 * KB;
export const GB = 1024 * MB;
export const TB = 1024 * GB;
export const PB = 1024 * TB;

interface CreateReadStreamOptions {
    flags?: string;
    encoding?: BufferEncoding;
    fd?: number;
    mode?: number;
    autoClose?: boolean;
    emitClose?: boolean;
    start?: number;
    end?: number;
    highWaterMark?: number;
}
const fsCreateReadStream = async (path: fs.PathLike, options?: CreateReadStreamOptions) => {
    const fileReadStream = fs.createReadStream(path, options);
    await once(fileReadStream, 'ready');

    return fileReadStream;
};

export default fsCreateReadStream;
