import { ClientSession } from 'mongoose';
import { defaultNewUpload } from '../../config/defaults';
import { ServerError } from '../error';
import { IUpdatedUpload, IUpload, IUploadFilters } from './interface';
import UploadModel from './model';

/**
 * Create new Upload document.
 * @param {IUpload} upload - The new Upload object.
 * @param {ClientSession | undefined} session - Optional mongoose session.
 * @returns {Promise<IUpload>} - Promise object containing the new Upload.
 */
const createUpload = async (upload: IUpload, session?: ClientSession): Promise<IUpload> => {
    if (await UploadModel.exists({ name: upload.name }))
        throw new ServerError(409, 'Object with this name already exists.');

    return (await UploadModel.create([{ ...defaultNewUpload, ...upload }], { session }))[0];
};

/**
 * Get filtered Uploads.
 * @param {IUploadFilters} filters - The filters object.
 * @returns {Promise<IUpload[]>} - Promise object containing the Uploads.
 */
const getUploads = (filters: IUploadFilters): Promise<IUpload[]> => {
    return UploadModel.find(filters).exec();
};

/**
 * Update Upload document.
 * @param id - The id of the Upload object.
 * @returns {Promise<IUpload>} - Promise object containing the updated Upload.
 */
const updateUpload = async (id: string, upload: IUpdatedUpload): Promise<IUpload> => {
    const result = await UploadModel.findByIdAndUpdate(id, upload, { new: true }).exec();
    if (result === null) throw new ServerError(404, 'Upload not found');
    return result;
};

/**
 * delete Upload document.
 * @param id - The id of the Upload object.
 * @returns {Promise<IUpload>} - Promise object containing the Upload.
 */
const deleteUpload = async (id: string): Promise<IUpload> => {
    const result = await UploadModel.findByIdAndDelete(id).exec();
    if (result === null) throw new ServerError(404, 'Upload not found');
    return result;
};

export { createUpload, getUploads, updateUpload, deleteUpload };
