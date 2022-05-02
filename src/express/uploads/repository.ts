import { ServerError } from '../error';
import { INewUpload, IUpdateUpload, IUpload, IUploadFilters } from './interface';
import UploadModel from './model';

/**
 * Create new Upload document.
 *   1) raise quota
 *   2) create new Upload
 * @param upload - The new Upload object.
 * @returns {Promise<IUpload>} Promise object containing the new Upload.
 */
const createUpload = async (upload: INewUpload): Promise<IUpload> => {
    return UploadModel.create({ ...upload });
};

/**
 * Get a Upload.
 * @param uploadId - The Upload id.
 * @returns {Promise<IUpload>} Promise object containing the Upload.
 */
const getUploadById = async (uploadId: string): Promise<IUpload> => {
    const result = await UploadModel.findById(uploadId).exec();
    if (result === null) throw new ServerError(404, 'Upload not found');

    return result;
};

/**
 * Get filtered Uploads.
 * @param filters - The filters object.
 * @returns {Promise<IUpload[]>} Promise object containing the Uploads.
 */
const getUploads = async (filters: IUploadFilters): Promise<IUpload[]> => {
    return UploadModel.find(filters).exec();
};

/**
 * Update Upload document.
 *   1) get upload
 *   2) calculate size
 *   3) update quota used
 *   4) update upload
 * @param uploadId - The Upload id.
 * @param update - The update object.
 * @returns {Promise<IUpload>} Promise object containing the updated Upload.
 */
const updateUploadById = async (uploadId: string, update: IUpdateUpload): Promise<IUpload> => {
    const newUpload = await UploadModel.findByIdAndUpdate(uploadId, update, { new: true }).exec();
    if (newUpload === null) throw new ServerError(404, 'Upload not found');

    return newUpload;
};

/**
 * delete a Upload.
 * @param uploadId - The id of the Upload object.
 * @returns {Promise<IUpload>} Promise object containing the Upload.
 */
const deleteUploadById = async (uploadId: string): Promise<IUpload> => {
    const result = await UploadModel.findByIdAndDelete(uploadId).exec();
    if (result === null) throw new ServerError(404, 'Upload not found');

    return result;
};

export { createUpload, getUploadById, getUploads, updateUploadById, deleteUploadById };
