import * as mongoose from 'mongoose';
import { makeTransaction } from '../../utils/mongoose';
import { bfs } from '../../utils/object';
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
} from '../fs/interface';
import * as fsRepository from '../fs/repository';
import * as quotasRepository from '../quotas/repository';
import { INewState, IState, IUpdateState, permission } from '../states/interface';
import * as statesRepository from '../states/repository';
import { FsObjectAndState, IAggregateStatesAndFsObjectsQuery } from './interface';
import * as apiRepository from './repository';

/**
 * Create a File document.
 * @param file - The new file object.
 * @returns {Promise<IFile>} Promise object containing the file.
 */
export const createFile = async (file: INewFile): Promise<IFile> => {
    return fsRepository.createFile(file);
};

/**
 * Create a Folder document.
 * @param folder - The new Folder object.
 * @returns {Promise<IFolder>} Promise object containing the Folder.
 */
export const createFolder = async (folder: INewFolder): Promise<IFolder> => {
    return fsRepository.createFolder(folder);
};

/**
 * Create a Shortcut document.
 * @param shortcut - The new Shortcut object.
 * @returns {Promise<IShortcut>} Promise object containing the Shortcut.
 */
export const createShortcut = async (shortcut: INewShortcut): Promise<IShortcut> => {
    return fsRepository.createShortcut(shortcut);
};

/**
 * Share a FsObject.
 * @param fsObjectId - The FsObject id.
 * @param sharedUserId - The user to be shared.
 * @param sharedPermission - The share permission.
 * @returns {Promise<IFile>} Promise object containing the FsObject.
 */
export const shareFsObjectById = async (
    fsObjectId: mongoose.Types.ObjectId,
    sharedUserId: string,
    sharedPermission: permission,
): Promise<IState> => {
    const state: INewState = {
        userId: sharedUserId,
        permission: sharedPermission,
        fsObjectId,
        root: true,
    };

    const fsObject = await fsRepository.getFsObject({ _id: fsObjectId });

    if (fsObject.type === 'shortcut') {
        state.fsObjectId = (fsObject as IShortcut).ref;
    }

    return makeTransaction(async (session) => {
        const createdState = await statesRepository.createState(state, session);

        if (fsObject.type === 'folder') {
            await apiRepository.shareWithAllFsObjectsInFolder(fsObjectId, sharedUserId, sharedPermission, session);
        }

        return createdState;
    });
};

/**
 * Get State and FsObjects objects by filters.
 * @param query - states and fsObjects filters.
 * @returns {Promise<FsObjectAndState[]>} Promise object containing filtered objects.
 */
export const aggregateStatesFsObjects = async (
    query: IAggregateStatesAndFsObjectsQuery,
): Promise<FsObjectAndState[]> => {
    return apiRepository.aggregateStatesFsObjects(query);
};

/**
 * Get FsObject and State objects by filters.
 * @param query - fsObjects and states filters.
 * @returns {Promise<FsObjectAndState[]>} Promise object containing filtered objects.
 */
export const aggregateFsObjectsStates = async (
    query: IAggregateStatesAndFsObjectsQuery,
): Promise<FsObjectAndState[]> => {
    return apiRepository.aggregateFsObjectsStates(query);
};

/**
 * Get FsObject Hierarchy.
 * @param fsObjectId - The FsObject id.
 * @returns {Promise<FsObjectAndState[]>} Promise object containing the Hierarchy of FsObjects.
 */
export const getFsObjectHierarchyById = async (fsObjectId: mongoose.Types.ObjectId): Promise<IFolder[]> => {
    const fsObject = await fsRepository.getFsObject({ _id: fsObjectId });
    const hierarchy = apiRepository.getFsObjectHierarchy(fsObject._id);

    return hierarchy;
};

/**
 * Delete State documents.
 * @param stateId - The State id.
 * @returns {Promise<IState>} Promise object containing the amount of deleted States.
 */
export const updateStateById = async (stateId: mongoose.Types.ObjectId, update: IUpdateState): Promise<IState> => {
    return statesRepository.updateState({ _id: stateId }, update);
};

/**
 * Update a File.
 * @param fsObjectId - The File id.
 * @param update - The update object.
 * @returns {Promise<IFile>} Promise object containing the updated File.
 */
export const updateFileById = async (fsObjectId: mongoose.Types.ObjectId, update: IUpdateFile): Promise<IFile> => {
    return fsRepository.updateFileById(fsObjectId, update);
};

/**
 * Update a Folder.
 * @param fsObjectId - The Folder id.
 * @param update - The update object.
 * @returns {Promise<IFolder>} Promise object containing the updated Folder.
 */
export const updateFolderById = async (
    fsObjectId: mongoose.Types.ObjectId,
    update: IUpdateFolder,
): Promise<IFolder> => {
    return fsRepository.updateFolderById(fsObjectId, update);
};

/**
 * Update a Shortcut.
 * @param fsObjectId - The Shortcut id.
 * @param update - The update object.
 * @returns {Promise<IShortcut>} Promise object containing the updated Shortcut.
 */
export const updateShortcutById = async (
    fsObjectId: mongoose.Types.ObjectId,
    update: IUpdateShortcut,
): Promise<IShortcut> => {
    return fsRepository.updateShortcutById(fsObjectId, update);
};

/**
 * Delete user's shared FsObject's state.
 * @param userId - The user that owns the FsObject.
 * @param fsObjectId - The FsObject id.
 * @returns {Promise<IState>} Promise object containing the State.
 */
export const unshareFsObjectById = async (fsObjectId: mongoose.Types.ObjectId, userId: string): Promise<IState> => {
    const fsObject = await fsRepository.getFsObject({ _id: fsObjectId });

    if (fsObject.type === 'folder') {
        const childrenIds = await apiRepository.getAllFsObjectIdsUnderFolder(fsObjectId);
        const children = await apiRepository.aggregateStatesFsObjects({
            userId,
            fsObjectId: { $in: childrenIds },
            root: false,
            permission: { $nin: ['owner'] },
        });
        const filteredChildrenIds = bfs(children, fsObjectId, 'fsObjectId', 'parent');
        await statesRepository.deleteStates({ userId, fsObjectId: { $in: filteredChildrenIds } });
    }

    return statesRepository.deleteState({ fsObjectId, userId });
};

/**
 * Delete a File.
 * @param fsObjectId - The File id.
 * @returns {Promise<void>} Empty Promise.
 */
export const deleteFileById = async (fsObjectId: mongoose.Types.ObjectId): Promise<void> => {
    const [ownerFsObjectAndState] = await apiRepository.aggregateStatesFsObjects({
        fsObjectId,
        permission: 'owner',
        type: 'file',
    });

    await makeTransaction(async (session) => {
        const operations: Promise<any>[] = [];

        if (ownerFsObjectAndState?.size) {
            operations.push(
                quotasRepository.changeQuotaUsed(ownerFsObjectAndState.userId, ownerFsObjectAndState.size, session),
            );
        }
        operations.push(statesRepository.deleteStates({ fsObjectId }, session));
        operations.push(fsRepository.deleteFileById(fsObjectId, session));

        await Promise.all(operations);
    });
};

/**
 * Delete a Folder.
 * @param fsObjectId - The Folder id.
 * @returns {Promise<void>} Empty Promise.
 */
export const deleteFolderById = async (fsObjectId: mongoose.Types.ObjectId): Promise<void> => {
    const fsObjectIds = await apiRepository.getAllFsObjectIdsUnderFolder(fsObjectId);
    const ownerFilesAndStates = await apiRepository.aggregateStatesFsObjects({
        fsObjectId: { $in: fsObjectIds },
        permission: 'owner',
        type: 'file',
    });

    await makeTransaction(async (session) => {
        const operations: Promise<any>[] = [];

        for (let i = 0; i < ownerFilesAndStates.length; i++) {
            const ownerFileAndState = ownerFilesAndStates[i];
            if (ownerFileAndState.size) {
                operations.push(
                    quotasRepository.changeQuotaUsed(ownerFileAndState.userId, -ownerFileAndState.size, session),
                );
            }
        }

        fsObjectIds.push(fsObjectId);

        operations.push(statesRepository.deleteStates({ fsObjectId: { $in: fsObjectIds } }, session));

        operations.push(fsRepository.deleteFsObjects({ _id: { $in: fsObjectIds } }, session));

        await Promise.all(operations);
    });
};

/**
 * Delete a Shortcut.
 * @param fsObjectId - The Shortcut id.
 * @returns {Promise<void>} Empty Promise.
 */
export const deleteShortcutById = async (fsObjectId: mongoose.Types.ObjectId): Promise<void> => {
    return makeTransaction(async (session) => {
        const operations: Promise<any>[] = [
            statesRepository.deleteStates({ fsObjectId }, session),
            fsRepository.deleteShortcutById(fsObjectId, session),
        ];

        await Promise.all(operations);
    });
};
