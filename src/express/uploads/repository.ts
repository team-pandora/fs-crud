import { StatusCodes } from 'http-status-codes';
import * as mongoose from 'mongoose';
import { ObjectId } from '../../utils/mongoose';
import { ServerError } from '../error';
import { INewUpload, IUpdateUpload, IUpload, IUploadFilters } from './interface';
import UploadModel from './model';

/**
 * Create Upload.
 * @param upload - The new Upload object.
 * @returns {Promise<IUpload>} Promise object containing the created Upload.
 */
const createUpload = async (upload: INewUpload, session: mongoose.ClientSession): Promise<IUpload> => {
    return (await UploadModel.create([upload], { session }))[0];
};

/**
 * Get Upload. Throws an error if not found.
 * @param filters - The filters object.
 * @returns {Promise<IUpload>} Promise object containing the Upload.
 */
const getUpload = async (filters: IUploadFilters): Promise<IUpload> => {
    const result = await UploadModel.findOne(filters).exec();
    if (!result) throw new ServerError(StatusCodes.NOT_FOUND, 'Upload not found');
    return result;
};

/**
 * Get Uploads.
 * @param filters - The filters object.
 * @returns {Promise<IUpload[]>} Promise object containing the Uploads.
 */
const getUploads = async (filters: IUploadFilters): Promise<IUpload[]> => {
    return UploadModel.find(filters).exec();
};

/**
 * Update Upload by id. Throws an error if not found.
 * @param uploadId - The Upload id.
 * @param update - The update object.
 * @returns {Promise<IUpload>} Promise object containing the updated Upload.
 */
const updateUploadById = async (
    uploadId: ObjectId,
    update: IUpdateUpload,
    session: mongoose.ClientSession,
): Promise<IUpload> => {
    const result = await UploadModel.findByIdAndUpdate(uploadId, update, { new: true, session }).exec();
    if (!result) throw new ServerError(StatusCodes.NOT_FOUND, 'Upload not found');
    return result;
};

/**
 * Delete Upload. Throws an error if not found.
 * @param filters - The filters object.
 * @returns {Promise<IUpload>} Promise object containing the deleted Upload.
 */
const deleteUpload = async (filters: IUploadFilters): Promise<IUpload> => {
    const result = await UploadModel.findOneAndDelete(filters).exec();
    if (!result) throw new ServerError(StatusCodes.NOT_FOUND, 'Upload not found');
    return result;
};

export { createUpload, getUpload, getUploads, updateUploadById, deleteUpload };
