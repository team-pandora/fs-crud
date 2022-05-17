import { StatusCodes } from 'http-status-codes';
import * as mongoose from 'mongoose';
import config from '../../../config';
import { makeTransaction } from '../../../utils/mongoose';
import { bfs } from '../../../utils/object';
import { ServerError } from '../../error';
import {
    IFile,
    IFolder,
    INewFile,
    INewFolder,
    INewShortcut,
    IShortcut,
    IUpdateFile,
    IUpdateFolder,
    IUpdateShortcut,
} from '../../fs/interface';
import * as fsRepository from '../../fs/repository';
import { IQuota } from '../../quotas/interface';
import * as quotasRepository from '../../quotas/repository';
import { INewState, IState, permission } from '../../states/interface';
import * as statesRepository from '../../states/repository';
import { INewUpload, IUpdateUpload, IUpload, IUploadFilters } from '../../uploads/interface';
import * as uploadRepository from '../../uploads/repository';
import { FsObjectAndState, IAggregateStatesAndFsObjectsQuery } from '../interface';
import * as apiRepository from '../repository';

const { permissionPriority } = config.constants;

const inheritUserStates = async (
    userId: string,
    sourceFsObjectId: mongoose.Types.ObjectId,
    destFsObjectId: mongoose.Types.ObjectId,
    session?: mongoose.ClientSession,
): Promise<IState[]> => {
    const result = await apiRepository.inheritStates(
        { fsObjectId: sourceFsObjectId, userId: { $nin: [userId] }, permission: { $nin: ['owner'] } },
        destFsObjectId,
        session,
    );

    const ownerState = await statesRepository.getState({
        fsObjectId: sourceFsObjectId,
        permission: 'owner',
    });

    if (ownerState && ownerState.userId !== userId) {
        result.push(
            await statesRepository.createState(
                {
                    userId: ownerState.userId,
                    fsObjectId: destFsObjectId,
                    permission: 'write',
                },
                session,
            ),
        );
    }

    return result;
};

/**
 * Create user File.
 * @param userId - The user to create the file.
 * @param file - The new file object.
 * @returns {Promise<FsObjectAndState>} Promise object containing the file.
 */
export const createFile = async (userId: string, file: INewFile): Promise<FsObjectAndState> => {
    if (file.parent) await apiRepository.parentStateCheck(userId, file.parent);

    return makeTransaction(async (session) => {
        await quotasRepository.changeQuotaUsed(userId, file.size, session);

        const createdFile = await fsRepository.createFile(file, session);

        const createdState = await statesRepository.createState(
            {
                userId,
                fsObjectId: createdFile._id,
                permission: 'owner',
                root: !createdFile.parent,
            },
            session,
        );

        if (createdFile.parent) {
            await inheritUserStates(userId, createdFile.parent, createdFile._id, session);
        }

        return new FsObjectAndState(createdFile, createdState);
    });
};

/**
 * Create user Folder.
 * @param userId - The user to create the folder.
 * @param folder - The new folder object.
 * @returns {Promise<FsObjectAndState>} Promise object containing the folder.
 */
export const createFolder = async (userId: string, folder: INewFolder): Promise<FsObjectAndState> => {
    if (folder.parent) await apiRepository.parentStateCheck(userId, folder.parent);

    return makeTransaction(async (session) => {
        const createdFolder = await fsRepository.createFolder(folder, session);

        const createdState = await statesRepository.createState(
            {
                userId,
                fsObjectId: createdFolder._id,
                permission: 'owner',
                root: !createdFolder.parent,
            },
            session,
        );

        if (createdFolder.parent) {
            await inheritUserStates(userId, createdFolder.parent, createdFolder._id, session);
        }

        return new FsObjectAndState(createdFolder, createdState);
    });
};

/**
 * Create user Shortcut.
 * @param userId - The user to create the shortcut.
 * @param shortcut - The new shortcut object.
 * @returns {Promise<FsObjectAndState>} Promise object containing the shortcut.
 */
export const createShortcut = async (userId: string, shortcut: INewShortcut): Promise<FsObjectAndState> => {
    if (shortcut.parent) await apiRepository.parentStateCheck(userId, shortcut.parent);
    const state = await statesRepository.getState({ userId, fsObjectId: shortcut.ref });
    if (!state) throw new ServerError(StatusCodes.NOT_FOUND, 'FsObject was not found');

    return makeTransaction(async (session) => {
        const createdShortcut = await fsRepository.createShortcut(shortcut, session);

        const createdState = await statesRepository.createState(
            {
                userId,
                fsObjectId: createdShortcut._id,
                permission: 'owner',
                root: !createdShortcut.parent,
            },
            session,
        );

        return new FsObjectAndState(createdShortcut, createdState);
    });
};

/**
 * Create a Upload document.
 * @param upload - The new Upload object.
 * @returns {Promise<INewUpload>} Promise object containing the Upload.
 */
export const createUpload = async (userId: string, upload: INewUpload): Promise<any[]> => {
    return makeTransaction(async (session) => {
        const operations: Promise<any>[] = [];

        operations.push(uploadRepository.createUpload({ ...upload, userId }, session));
        operations.push(quotasRepository.changeQuotaUsed(userId, upload.uploadedBytes, session));

        const result = await Promise.all(operations);

        return result[0];
    });
};

export const shareFsObject = async (
    userId: string,
    fsObjectId: mongoose.Types.ObjectId,
    sharedUserId: string,
    sharedPermission: permission,
): Promise<IState> => {
    const [fsObjectAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId });
    if (!fsObjectAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Object not found.');
    if (permissionPriority[sharedPermission] > permissionPriority[fsObjectAndState.permission])
        throw new ServerError(StatusCodes.BAD_REQUEST, 'Trying to share with higher permission than own.');

    const newState: INewState = {
        userId: sharedUserId,
        permission: sharedPermission,
        fsObjectId,
        root: true,
    };

    if (fsObjectAndState.type === 'shortcut' && fsObjectAndState.ref) {
        newState.fsObjectId = fsObjectAndState.ref;
    }

    return makeTransaction(async (session) => {
        const createdState = await statesRepository.createState(newState, session);

        if (fsObjectAndState.type === 'folder') {
            await apiRepository.shareWithAllFsObjectsInFolder(fsObjectId, sharedUserId, sharedPermission, session);
        }

        return createdState;
    });
};

export const addToFavorite = async (userId: string, fsObjectId: mongoose.Types.ObjectId): Promise<IState> => {
    const [fsObjectAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId });
    if (!fsObjectAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Object not found.');

    return statesRepository.updateState(fsObjectAndState.stateId, { favorite: true });
};

export const aggregateStatesFsObjects = async (
    userId: string,
    query: IAggregateStatesAndFsObjectsQuery,
): Promise<FsObjectAndState[]> => {
    return apiRepository.aggregateStatesFsObjects({ ...query, userId });
};

export const aggregateFsObjectsStates = async (
    userId: string,
    query: IAggregateStatesAndFsObjectsQuery,
): Promise<FsObjectAndState[]> => {
    return apiRepository.aggregateFsObjectsStates({ ...query, userId });
};

export const getQuotaByUserId = async (userId: string): Promise<IQuota> => {
    return quotasRepository.getQuotaByUserId(userId);
};

export const getFsObjectHierarchy = async (userId: string, fsObjectId: mongoose.Types.ObjectId): Promise<IFolder[]> => {
    const [fileAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId });
    if (!fileAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Provided fsObject does not exist');

    const hierarchy = apiRepository.getFsObjectHierarchy(fileAndState.fsObjectId);

    return hierarchy;
};

/**
 * Get filtered Uploads.
 * @param filters - The filters object.
 * @returns {Promise<IUpload[]>} Promise object containing the Uploads.
 */
export const getUploads = async (userId: string, filters: IUploadFilters): Promise<IUpload[]> => {
    return uploadRepository.getUploads({ ...filters, userId });
};

/**
 * Update user File.
 *   1) validates the file
 *   2) validates the file's permissions
 *   3) update the file
 * @param userId - The user that owns the file.
 * @param fsObjectId - The file id.
 * @returns {Promise<IFile>} Promise object containing the updated File.
 */
export const updateFile = async (
    userId: string,
    fsObjectId: mongoose.Types.ObjectId,
    update: IUpdateFile,
): Promise<IFile> => {
    const [fileAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId, type: 'file' });
    if (!fileAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'File not found.');

    if (permissionPriority[fileAndState.permission] < permissionPriority.write)
        throw new ServerError(StatusCodes.FORBIDDEN, 'You do not have permission to edit this file.');

    const sizeDiff = update.size && fileAndState.size ? update.size - fileAndState.size : 0;

    const [ownerState] = await statesRepository.getStates({ fsObjectId, permission: 'owner' });

    return makeTransaction(async (session) => {
        const operations: Promise<any>[] = [];

        if (sizeDiff && ownerState)
            operations.push(quotasRepository.changeQuotaUsed(ownerState.userId, sizeDiff, session));

        operations.push(fsRepository.updateFileById(fsObjectId, update, session));

        return (await Promise.all(operations)).pop();
    });
};

/**
 * Update user Folder.
 *   1) validates the folder
 *   2) validates the folder's permissions
 *   3) update the folder
 * @param userId - The user that owns the folder.
 * @param fsObjectId - The folder id.
 * @returns {Promise<IFolder>} Promise object containing the updated Folder.
 */
export const updateFolder = async (
    userId: string,
    fsObjectId: mongoose.Types.ObjectId,
    update: IUpdateFolder,
): Promise<IFolder> => {
    const [folderAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId, type: 'folder' });
    if (!folderAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Folder not found.');

    if (permissionPriority[folderAndState.permission] < permissionPriority.write)
        throw new ServerError(StatusCodes.FORBIDDEN, 'You do not have permission to edit this folder.');

    return fsRepository.updateFolderById(fsObjectId, update);
};

/**
 * Update user Shortcut.
 *   1) validates the shortcut
 *   2) validates the shortcut's permissions
 *   3) update the shortcut
 * @param userId - The user that owns the shortcut.
 * @param fsObjectId - The shortcut id.
 * @returns {Promise<IShortcut>} Promise object containing the updated Shortcut.
 */
export const updateShortcut = async (
    userId: string,
    fsObjectId: mongoose.Types.ObjectId,
    update: IUpdateShortcut,
): Promise<IShortcut> => {
    const shortcutAndState = (
        await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId, type: 'shortcut' })
    )[0];
    if (!shortcutAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Shortcut not found');

    return fsRepository.updateShortcutById(fsObjectId, update);
};

/**
 * Update a Upload.
 * @param userId - The user id.
 * @param uploadId - The Upload id.
 * @param update - The update object.
 * @returns {Promise<IUpload>} Promise object containing the updated Upload.
 */
export const updateUploadById = async (
    userId: string,
    uploadId: mongoose.Types.ObjectId,
    update: IUpdateUpload,
): Promise<void> => {
    const upload = await uploadRepository.getUpload({ userId, _id: uploadId });

    const sizeDifference = update.uploadedBytes - upload.uploadedBytes;

    return makeTransaction(async (session) => {
        const operations: Promise<any>[] = [];

        if (sizeDifference) operations.push(quotasRepository.changeQuotaUsed(userId, sizeDifference, session));
        operations.push(uploadRepository.updateUploadById(uploadId, update, session));

        const result = await Promise.all(operations);

        return result[1];
    });
};

/**
 * Delete shared user state for FsObject.
 *   1) check if fsObject exists.
 *   2) check if file shared with provided user that do the unshare.
 *   3) checks if permission of shared user is not equal or higher than own user that do the unshare.
 *   * if fsObject is a folder:
 *   1) delete shared user states for shared folder and folder's fsObjects under it.
 *   2) delete all user shortcuts and their state/s, that was made from shared folder and all fsObjects under it.
 *   * if fsObject is a file (after the if statement):
 *   1) delete shared user state for file.
 *   2) delete all user shortcuts and their state/s, that was made from shared file.
 * @param userId - The user that owns the shortcut.
 * @param fsObjectId - The shortcut id.
 * @param sharedUserId - The shared user id.
 * @returns {Promise<IState>} Promise object containing the State.
 */
export const unshareFsObject = async (
    userId: string,
    fsObjectId: mongoose.Types.ObjectId,
    sharedUserId: string,
): Promise<IState> => {
    const [fsObjectAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId });
    if (!fsObjectAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Object not found');

    const sharedUserState = await statesRepository.getState({ userId: sharedUserId, fsObjectId });
    if (!sharedUserState) throw new ServerError(StatusCodes.BAD_REQUEST, 'Object is not shared with provided user');

    if (permissionPriority[fsObjectAndState.permission] <= permissionPriority[sharedUserState.permission])
        throw new ServerError(
            StatusCodes.BAD_REQUEST,
            'Trying to unshare user with equal or higher permission than own.',
        );

    let shortcutIds: mongoose.Types.ObjectId[];

    if (fsObjectAndState.type === 'folder') {
        const childrenIds = await apiRepository.getAllFsObjectIdsUnderFolder(fsObjectId);
        const children = await apiRepository.aggregateStatesFsObjects({
            userId: sharedUserId,
            fsObjectId: { $in: childrenIds },
            root: false,
        });
        const filteredChildrenIds = bfs(children, fsObjectId, 'fsObjectId', 'parent');
        await statesRepository.deleteStates({ userId: sharedUserId, fsObjectId: { $in: filteredChildrenIds } });

        shortcutIds = await apiRepository.getFsObjectsShortcutIds([fsObjectId, ...filteredChildrenIds]);
        shortcutIds = await statesRepository.getStateFsObjectIds({
            fsObjectId: { $in: shortcutIds },
            userId: sharedUserId,
        });
    } else {
        shortcutIds = await apiRepository.getFsObjectShortcutIds(fsObjectId);
    }

    await statesRepository.deleteStates({ fsObjectId: { $in: shortcutIds } });
    await fsRepository.deleteFsObjects({ _id: { $in: shortcutIds } });

    return statesRepository.deleteState({ userId: sharedUserId, fsObjectId });
};

export const removeFromFavorite = async (userId: string, fsObjectId: mongoose.Types.ObjectId): Promise<IState> => {
    const [fsObjectAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId });
    if (!fsObjectAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Object not found.');

    return statesRepository.updateState(fsObjectAndState.stateId, { favorite: false });
};

/**
 * Move File to trash.
 *   * If user is owner:
 *   1) Update file state and move it to trash for all users.
 *   2) Update all file states for all users.
 *   3) Delete file shortcuts and their states for all users.
 *  * If user is not owner:
 *   1) Update file state and move it to trash only for user.
 *   2) Update all file states for all users.
 *   3) Delete file shortcuts and their states only for user.
 * @param fileAndState - The File and its state object.
 * @returns {Promise<void>} Empty Promise.
 */
const moveFileToTrash = async (fileAndState: FsObjectAndState): Promise<void> => {
    const { userId, fsObjectId } = fileAndState;

    let fileShortcutIds = await apiRepository.getFsObjectShortcutIds(fsObjectId);

    await makeTransaction(async (session) => {
        if (fileAndState.permission === 'owner') {
            await statesRepository.updateStates(
                { fsObjectId, userId: { $nin: [userId] } },
                { trash: true, trashRoot: false },
                session,
            );
        } else {
            fileShortcutIds = await statesRepository.getStateFsObjectIds({
                fsObjectId: { $in: fileShortcutIds },
                userId,
            });
        }
        await statesRepository.updateState({ userId, fsObjectId }, { trash: true, trashRoot: true }, session);

        await statesRepository.deleteStates({ fsObjectId: { $in: fileShortcutIds } }, session);
        await fsRepository.deleteFsObjects({ _id: { $in: fileShortcutIds } }, session);
    });
};

/**
 * Delete File from trash.
 * @param fileAndState - The File and its State object.
 * @returns {Promise<void>} Empty Promise.
 */
const deleteFileFromTrash = async (fileAndState: FsObjectAndState): Promise<void> => {
    const { userId, fsObjectId } = fileAndState;

    await makeTransaction(async (session) => {
        const operations: Promise<any>[] = [];

        if (fileAndState.permission === 'owner') {
            operations.push(statesRepository.deleteStates({ fsObjectId }, session));
            operations.push(fsRepository.deleteFileById(fsObjectId, session));
            if (fileAndState.size) {
                operations.push(quotasRepository.changeQuotaUsed(userId, -fileAndState.size, session));
            }
        } else {
            operations.push(statesRepository.deleteState({ userId, fsObjectId }, session));
        }

        await Promise.all(operations);
    });
};

/**
 * Delete user File.
 * @param userId - The user id.
 * @param fsObjectId - The File id.
 * @returns {Promise<void>} Empty Promise.
 */
export const deleteFile = async (userId: string, fsObjectId: mongoose.Types.ObjectId): Promise<void> => {
    const [fileAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId, type: 'file' });
    if (!fileAndState || (fileAndState.trash && !fileAndState.trashRoot))
        throw new ServerError(StatusCodes.NOT_FOUND, 'File not found');

    if (fileAndState.trash) {
        await deleteFileFromTrash(fileAndState);
    } else {
        await moveFileToTrash(fileAndState);
    }
};

/**
 * Restore File from trash.
 * @param userId - The user id.
 * @param fsObjectId - The File id.
 * @returns {Promise<void>} Empty Promise.
 */
export const restoreFileFromTrash = async (userId: string, fsObjectId: mongoose.Types.ObjectId): Promise<void> => {
    const [fileAndState] = await apiRepository.aggregateStatesFsObjects({
        userId,
        fsObjectId,
        type: 'file',
        trash: true,
        trashRoot: true,
    });
    if (!fileAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'File not found in trash');

    await makeTransaction(async (session) => {
        const operations: Promise<any>[] = [];

        if (fileAndState.permission === 'owner') {
            operations.push(
                statesRepository.updateStates(
                    { fsObjectId, userId: { $nin: [userId] } },
                    { trash: false, trashRoot: false },
                    session,
                ),
            );
        }

        operations.push(
            statesRepository.updateState({ userId, fsObjectId }, { trash: false, trashRoot: false }, session),
        );

        await Promise.all(operations);
    });
};

/**
 * Move Folder to trash.
 *   * If user is owner:
 *   1) Update folder state and move it to trash for all users.
 *   2) Update all folder fsObjects states for all users.
 *   3) Delete folder shortcuts and all folder fsObjects(that's under folder) shortcuts and their states for all users.
 *  * If user is not owner:
 *   1) Update folder state and move it to trash only for user.
 *   2) Update all folder fsObjects states.
 *   3) Delete folder shortcuts and all folder fsObjects(that's under folder) shortcuts and their states only for user.
 * @param folderAndState - The Folder and its state object.
 * @returns {Promise<void>} Empty Promise.
 */
const moveFolderToTrash = async (folderAndState: FsObjectAndState): Promise<void> => {
    const { userId, fsObjectId } = folderAndState;
    const fsObjectIdsUnderFolder = await apiRepository.getAllFsObjectIdsUnderFolder(fsObjectId);
    const fsObjectIdsWithFolder = [fsObjectId, ...fsObjectIdsUnderFolder];
    let shortcutIds = await apiRepository.getFsObjectsShortcutIds(fsObjectIdsWithFolder);

    await makeTransaction(async (session) => {
        if (folderAndState.permission === 'owner') {
            await statesRepository.updateStates(
                { fsObjectId: { $in: fsObjectIdsWithFolder } },
                { trash: true, trashRoot: false },
                session,
            );
        } else {
            await statesRepository.updateStates(
                { fsObjectId: { $in: fsObjectIdsUnderFolder }, userId },
                { trash: true, trashRoot: false },
                session,
            );

            shortcutIds = await statesRepository.getStateFsObjectIds({
                fsObjectId: { $in: shortcutIds },
                userId,
            });
        }

        await statesRepository.updateState({ userId, fsObjectId }, { trash: true, trashRoot: true }, session);

        await statesRepository.deleteStates({ fsObjectId: { $in: shortcutIds } }, session);
        await fsRepository.deleteFsObjects({ _id: { $in: shortcutIds } }, session);
    });
};

/**
 * Delete Folder from trash.
 * @param folderAndState - The Folder and its state object.
 * @returns {Promise<void>} Empty Promise.
 */
const deleteFolderFromTrash = async (folderAndState: FsObjectAndState): Promise<void> => {
    if (!folderAndState.trashRoot) throw new ServerError(StatusCodes.NOT_FOUND, 'Folder not found');

    const { userId, fsObjectId } = folderAndState;

    await makeTransaction(async (session) => {
        const operations: Promise<any>[] = [];

        if (folderAndState.permission === 'owner') {
            const fsObjectIds = await apiRepository.getAllFsObjectIdsUnderFolder(fsObjectId);
            const ownerFilesAndStates = await apiRepository.aggregateStatesFsObjects({
                fsObjectId: { $in: fsObjectIds },
                permission: 'owner',
                type: 'file',
            });

            for (let i = 0; i < ownerFilesAndStates.length; i++) {
                const ownerFolderAndState = ownerFilesAndStates[i];
                if (ownerFolderAndState.size) {
                    operations.push(
                        quotasRepository.changeQuotaUsed(
                            ownerFolderAndState.userId,
                            -ownerFolderAndState.size,
                            session,
                        ),
                    );
                }
            }

            fsObjectIds.push(fsObjectId);

            operations.push(statesRepository.deleteStates({ fsObjectId: { $in: fsObjectIds } }, session));

            operations.push(fsRepository.deleteFsObjects({ _id: { $in: fsObjectIds } }, session));
        } else {
            operations.push(statesRepository.deleteState({ userId, fsObjectId }, session));
        }

        await Promise.all(operations);
    });
};

/**
 * Delete user Folder.
 * @param userId - The user id.
 * @param fsObjectId - The Folder id.
 * @returns {Promise<void>} Empty Promise.
 */
export const deleteFolder = async (userId: string, fsObjectId: mongoose.Types.ObjectId): Promise<void> => {
    const [folderAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId, type: 'folder' });
    if (!folderAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Folder not found');

    if (folderAndState.trash) {
        await deleteFolderFromTrash(folderAndState);
    } else {
        await moveFolderToTrash(folderAndState);
    }
};

/**
 * Restore Folder from trash.
 * @param userId - The user id.
 * @param fsObjectId - The Folder id.
 * @returns {Promise<void>} Empty Promise.
 */
export const restoreFolderFromTrash = async (userId: string, fsObjectId: mongoose.Types.ObjectId): Promise<void> => {
    const [folderAndState] = await apiRepository.aggregateStatesFsObjects({
        userId,
        fsObjectId,
        type: 'folder',
        trash: true,
        trashRoot: true,
    });
    if (!folderAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Folder not found in trash');

    await makeTransaction(async (session) => {
        const operations: Promise<any>[] = [];

        const fsObjectIdsUnderFolder = await apiRepository.getAllFsObjectIdsUnderFolder(fsObjectId);
        const fsObjectIds = [fsObjectId, ...fsObjectIdsUnderFolder];

        if (folderAndState.permission === 'owner') {
            operations.push(
                statesRepository.updateStates(
                    { fsObjectId: { $in: fsObjectIds }, userId: { $nin: [userId] } },
                    { trash: false, trashRoot: false },
                    session,
                ),
            );
        }

        operations.push(
            statesRepository.updateState(
                { userId, fsObjectId: { $in: fsObjectIds } },
                { trashRoot: false, trash: false },
                session,
            ),
        );

        await Promise.all(operations);
    });
};

/**
 * Delete user Shortcut.
 * @param userId - The user id.
 * @param fsObjectId - The Shortcut id.
 * @returns {Promise<void>} Empty Promise.
 */
export const deleteShortcut = async (userId: string, fsObjectId: mongoose.Types.ObjectId): Promise<void> => {
    const [shortcutAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId, type: 'shortcut' });
    if (!shortcutAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Shortcut not found');

    await makeTransaction(async (session) => {
        const operations: Promise<any>[] = [];

        if (shortcutAndState.trash) {
            operations.push(statesRepository.deleteStates({ fsObjectId }, session));
            operations.push(fsRepository.deleteShortcutById(fsObjectId, session));
        } else {
            operations.push(
                statesRepository.updateState({ userId, fsObjectId }, { trash: true, trashRoot: true }, session),
            );
        }

        await Promise.all(operations);
    });
};

/**
 * delete a Upload.
 * @param userId - The user id.
 * @param uploadId - The id of the Upload object.
 * @returns {Promise<IUpload>} Promise object containing the Upload.
 */
export const deleteUploadById = async (userId: string, uploadId: mongoose.Types.ObjectId): Promise<IUpload> => {
    await uploadRepository.getUpload({ userId, _id: uploadId });

    return uploadRepository.deleteUpload({ _id: uploadId, userId });
};

/**
 * Restore Shortcut from trash.
 * @param userId - The user id.
 * @param fsObjectId - The Shortcut id.
 * @returns {Promise<void>} Empty Promise.
 */
export const restoreShortcutFromTrash = async (userId: string, fsObjectId: mongoose.Types.ObjectId): Promise<void> => {
    const [shortcutAndState] = await apiRepository.aggregateStatesFsObjects({
        userId,
        fsObjectId,
        type: 'shortcut',
        trash: true,
        trashRoot: true,
    });
    if (!shortcutAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Shortcut not found in trash');

    await statesRepository.updateState({ userId, fsObjectId }, { trash: false, trashRoot: false });
};
