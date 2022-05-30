import { StatusCodes } from 'http-status-codes';
import { ClientSession } from 'mongoose';
import { defaultNewFile } from '../../config/defaults';
import { ObjectId } from '../../utils/mongoose';
import { ServerError } from '../error';
import {
    IFile,
    IFolder,
    IFsObjectFilters,
    INewFile,
    INewFolder,
    INewShortcut,
    IShortcut,
    IUpdateFile,
    IUpdateFolder,
    IUpdateShortcut,
} from './interface';
import { FileModel, FolderModel, FsObjectModel, ShortcutModel } from './model';

/**
 * Get fsObject. Throws error if not found.
 * @param filters - The fsObject filters.
 * @returns {Promise<IFile | IFolder | IShortcut>} Promise object containing the fsObject.
 */
const getFsObject = async (filters: IFsObjectFilters): Promise<IFile | IFolder | IShortcut> => {
    const result = await FsObjectModel.findOne(filters).exec();
    if (result === null) throw new ServerError(StatusCodes.NOT_FOUND, 'Object not found');
    return result;
};

/**
 * Check if fsObject parent exists.
 * @param parent - The fsObject parent id.
 * @returns {Promise<void>} Empty Promise.
 */
const fsObjectParentCheck = async (parent: ObjectId | null): Promise<void> => {
    if (parent && !(await FolderModel.exists({ _id: parent })))
        throw new ServerError(StatusCodes.BAD_REQUEST, 'Provided parent does not exist');
};

/**
 * Check if fsObject name does not conflict with other fsObjects.
 * @param parent - The folder id.
 * @param name - The fsObject name.
 * @returns {Promise<void>} Empty Promise.
 */
const fsObjectNameCheck = async (parent: ObjectId | null, name: string): Promise<void> => {
    if (parent && (await FsObjectModel.exists({ parent, name })))
        throw new ServerError(StatusCodes.CONFLICT, 'Object with this name already exists in folder');
};

/**
 * Create File. Throws if file fails parent or name validations.
 * @param file - The new file object.
 * @param session - Optional mongoose session.
 * @returns {Promise<IFile>} Promise object containing the created file.
 */
const createFile = async (file: INewFile, session?: ClientSession): Promise<IFile> => {
    await fsObjectParentCheck(file.parent);
    await fsObjectNameCheck(file.parent, file.name);

    return (await FileModel.create([{ ...defaultNewFile, ...file }], { session }))[0];
};

/**
 * Create Folder. Throws if folder fails parent or name validations.
 * @param folder - The new folder object.
 * @param session - Optional mongoose session.
 * @returns {Promise<IFolder>} Promise object containing the created folder.
 */
const createFolder = async (folder: INewFolder, session?: ClientSession): Promise<IFolder> => {
    await fsObjectParentCheck(folder.parent);
    await fsObjectNameCheck(folder.parent, folder.name);

    return (await FolderModel.create([folder], { session }))[0];
};

/**
 * Create Shortcut. Throws if shortcut fails parent or name validations. If parent is shortcut it's ref is used.
 * @param shortcut - The new shortcut object.
 * @param session - Optional mongoose session.
 * @returns {Promise<IShortcut>} Promise object containing the created shortcut.
 */
const createShortcut = async (shortcut: INewShortcut, session?: ClientSession): Promise<IShortcut> => {
    await fsObjectParentCheck(shortcut.parent);
    await fsObjectNameCheck(shortcut.parent, shortcut.name);

    const refFsObject = await getFsObject({ _id: shortcut.ref });

    const newShortcut = { ...shortcut };
    if (refFsObject.type === 'shortcut') {
        newShortcut.ref = (refFsObject as IShortcut).ref;
    }

    return (await ShortcutModel.create([shortcut], { session }))[0];
};

/**
 * Check fsObject update. Throws if validations fail.
 * @param fsObjectId - The fsObject id.
 * @param update - The update object.
 * @returns {Promise<void>} Empty Promise.
 */
const fsObjectUpdateCheck = async (
    fsObjectId: ObjectId,
    update: IUpdateFile | IUpdateFolder | IUpdateShortcut,
): Promise<void> => {
    const originalFsObject = await FsObjectModel.findOne({ _id: fsObjectId }).exec();
    if (originalFsObject === null) throw new ServerError(StatusCodes.NOT_FOUND, 'Object not found');

    const newParent = update.parent !== undefined ? update.parent : originalFsObject.parent;
    if (newParent !== originalFsObject.parent) await fsObjectParentCheck(newParent);

    const newName = update.name ? update.name : originalFsObject.name;
    if (newName !== originalFsObject.name) await fsObjectNameCheck(newParent, newName);
};

/**
 * Update File. Throws if validations fail.
 * @param fileId - The File id.
 * @param update - The update object.
 * @param session - Optional mongoose session.
 * @returns {Promise<IFile>} Promise object containing the updated File.
 */
const updateFileById = async (fileId: ObjectId, update: IUpdateFile, session?: ClientSession): Promise<IFile> => {
    await fsObjectUpdateCheck(fileId, update);

    const result = await FileModel.findOneAndUpdate({ _id: fileId }, { $set: update }, { new: true, session }).exec();
    if (!result) throw new ServerError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update file');

    return result;
};

/**
 * Update Folder.
 * @param folderId - The Folder id.
 * @param update - The update object.
 * @returns {Promise<IFolder>} Promise object containing the updated Folder.
 */
const updateFolderById = async (
    folderId: ObjectId,
    update: IUpdateFolder,
    session?: ClientSession,
): Promise<IFolder> => {
    await fsObjectUpdateCheck(folderId, update);

    const result = await FolderModel.findOneAndUpdate(
        { _id: folderId },
        { $set: update },
        { new: true, session },
    ).exec();
    if (!result) throw new ServerError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update folder');

    return result;
};

/**
 * Update Shortcut.
 * @param shortcutId - The Shortcut id.
 * @param update - The update object.
 * @param session - Optional mongoose session.
 * @returns {Promise<IShortcut>} Promise object containing the updated Shortcut.
 */
const updateShortcutById = async (
    shortcutId: ObjectId,
    update: IUpdateShortcut,
    session?: ClientSession,
): Promise<IShortcut> => {
    await fsObjectUpdateCheck(shortcutId, update);

    const result = await ShortcutModel.findOneAndUpdate(
        { _id: shortcutId },
        { $set: update },
        { new: true, session },
    ).exec();
    if (!result) throw new ServerError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update shortcut');

    return result;
};

/**
 * Delete FsObjects.
 * @param filters - The FsObjects filters.
 * @param session - Optional mongoose session.
 * @returns {Promise<number>} Promise object containing the amount of FsObjects deleted.
 */
const deleteFsObjects = async (filters: IFsObjectFilters, session?: ClientSession): Promise<number> => {
    const result = await FsObjectModel.deleteMany(filters, { session }).exec();
    if (!result.acknowledged) throw new ServerError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete fsObjects');
    return result.deletedCount;
};

/**
 * Delete File.
 * @param fileId - The File id.
 * @param session - Optional mongoose session.
 * @returns {Promise<IFile>} Promise object containing the deleted File.
 */
const deleteFileById = async (fileId: ObjectId, session?: ClientSession): Promise<IFile> => {
    const result = await FileModel.findByIdAndDelete(fileId, { session }).exec();
    if (!result) throw new ServerError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete file');
    return result;
};

/**
 * Delete Shortcut.
 * @param shortcutId - The Shortcut id.
 * @param session - Optional mongoose session.
 * @returns {Promise<IShortcut>} Promise object containing the deleted Shortcut.
 */
const deleteShortcutById = async (shortcutId: ObjectId, session?: ClientSession): Promise<IShortcut> => {
    const result = await ShortcutModel.findByIdAndDelete(shortcutId, { session }).exec();
    if (!result) throw new ServerError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete shortcut');
    return result;
};

export {
    createFile,
    createFolder,
    createShortcut,
    getFsObject,
    updateFileById,
    updateFolderById,
    updateShortcutById,
    deleteFileById,
    deleteShortcutById,
    deleteFsObjects,
};
