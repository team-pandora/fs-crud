import { StatusCodes } from 'http-status-codes';
import * as mongoose from 'mongoose';
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
const createUpload = async (upload: INewUpload, session: mongoose.ClientSession): Promise<IUpload> => {
    return (await UploadModel.create([upload], { session }))[0];
};

/**
 * Get a Upload.
 * @param uploadId - The Upload id.
 * @returns {Promise<IUpload>} Promise object containing the Upload.
 */
const getUpload = async (filters: IUploadFilters): Promise<IUpload> => {
    const result = await UploadModel.findOne(filters).exec();
    if (!result) throw new ServerError(404, 'Upload not found');

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
 * @param userId - The user id.
 * @param uploadId - The Upload id.
 * @param update - The update object.
 * @returns {Promise<IUpload>} Promise object containing the updated Upload.
 */
const updateUploadById = async (
    uploadId: mongoose.Types.ObjectId,
    update: IUpdateUpload,
    session: mongoose.ClientSession,
): Promise<IUpload> => {
    const newUpload = await UploadModel.findByIdAndUpdate(uploadId, update, { new: true, session }).exec();
    if (!newUpload) throw new ServerError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update upload');

    return newUpload;
};

const deleteUpload = async (filters: IUploadFilters): Promise<IUpload> => {
    const result = await UploadModel.findOneAndDelete(filters).exec();
    if (!result) throw new ServerError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete upload');

    return result;
};

export { createUpload, getUpload, getUploads, updateUploadById, deleteUpload };
