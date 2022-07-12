import { StatusCodes } from 'http-status-codes';
import * as mongoose from 'mongoose';
import config from '../../../config';
import { makeTransaction, ObjectId } from '../../../utils/mongoose';
import { docBfs, objectIdBfs } from '../../../utils/object';
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
import { FsObjectAndState, IAggregateStatesAndFsObjectsQuery } from '../interface';
import * as apiRepository from '../repository';

const { permissionPriority } = config.constants;

/**
 * Check if user is allowed to create a new FsObject under a parent.
 * @param userId - The user id.
 * @param parentFsObjectId - The parent FsObject id.
 * @returns {Promise<void>} Empty Promise.
 * @throws {ServerError} If parent does not exist.
 * @throws {ServerError} If parent is in trash.
 * @throws {ServerError} If user does not have permission to modify Folder.
 */
const parentStateCheck = async (userId: string, parentFsObjectId: ObjectId): Promise<void> => {
    const parent = await statesRepository.getState({ userId, fsObjectId: parentFsObjectId });

    if (!parent) throw new ServerError(StatusCodes.BAD_REQUEST, 'Parent does not exist');

    if (parent.trash) throw new ServerError(StatusCodes.FORBIDDEN, `Cannot create object under a folder in trash`);

    if (permissionPriority[parent.permission] < permissionPriority.write)
        throw new ServerError(StatusCodes.FORBIDDEN, `User doesn't have permission to modify this folder`);
};

/**
 * Inherit (Find and Copy) States for FsObject from another FsObject.
 *  1) Inherit all States from parent apart from user's and owner's States.
 *  2) If parent exists and owner is not the user then inherit owner's State with 'write' permission.
 * @param userId - The user id.
 * @param sourceFsObjectId - The source FsObject id.
 * @param destFsObjectId - The destination FsObject id.
 * @param session - Optional mongoose session.
 * @returns {Promise<IState[]>} Promise object containing the created States.
 */
const inheritUserStates = async (
    userId: string,
    sourceFsObjectId: ObjectId,
    destFsObjectId: ObjectId,
    session?: mongoose.ClientSession,
): Promise<IState[]> => {
    // Inherit all States from parent apart from user's and owner's States.
    const result = await apiRepository.inheritStates(
        { fsObjectId: sourceFsObjectId, userId: { $nin: [userId] }, permission: { $nin: ['owner'] } },
        destFsObjectId,
        session,
    );

    const ownerState = await statesRepository.getState({
        fsObjectId: sourceFsObjectId,
        permission: 'owner',
    });

    // If parent owner is not the user then inherit owner's State with 'write' permission.
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
 * Get ids of all FsObjects under Folder that user has permissions to and their root ancestor is the Folder itself.
 *  1) Get all FsObject ids under Folder.
 *  2) Get all the FsObject that user has permissions to and are not root.
 *  3) Perform bfs from the Folder to find all the FsObjects whose root ancestor is the Folder.
 * @param folderId - The Folder id.
 * @returns {Promise<ObjectId[]>} Promise object containing filtered objects ids.
 */
const getNonRootFsObjectIdsUnderFolder = async (userId: string, folderId: ObjectId): Promise<ObjectId[]> => {
    const fsObjectIdsUnderFolder = await apiRepository.getAllFsObjectIdsUnderFolder(folderId, {
        type: { $nin: ['shortcut'] },
    });
    const nonRootFsObjectsUnderFolder = await apiRepository.aggregateStatesFsObjects({
        userId,
        fsObjectId: { $in: fsObjectIdsUnderFolder },
        root: false,
    });
    return objectIdBfs(nonRootFsObjectsUnderFolder, folderId, 'fsObjectId', 'parent');
};

/**
 * Get Shortcut ids of given FsObjects.
 * @param userId - The user id.
 * @param fsObjectIds - The FsObject ids.
 * @returns {Promise<ObjectId[]>} Promise object containing Shortcut ids.
 */
const getFsObjectsShortcutIds = async (userId: string, fsObjectIds: ObjectId[]): Promise<ObjectId[]> => {
    const shortcutIds = await apiRepository.getFsObjectsShortcutIds(fsObjectIds);
    return statesRepository.getStateFsObjectIds({
        fsObjectId: { $in: shortcutIds },
        userId,
    });
};

/**
 * Get Shortcut ids of given FsObjects.
 * @param userId - The user id.
 * @param fsObjectId - The FsObject id.
 * @param sharedUserId - The shared user id.
 * @returns {Promise<ObjectId[]>} Promise object containing Array of user State, shared user State, and FsObject.
 * @throws {ServerError} If object is not found for user.
 * @throws {ServerError} If object is not found for shared user.
 * @throws {ServerError} If object is Shortcut.
 */
const getSharedFsObjectDocs = async (
    userId: string,
    fsObjectId: ObjectId,
    sharedUserId: string,
): Promise<[IState, IState, IFolder | IFile]> => {
    const docPromises = [
        statesRepository.getState({ userId, fsObjectId }),
        statesRepository.getState({ userId: sharedUserId, fsObjectId }),
        fsRepository.getFsObject({ _id: fsObjectId }),
    ];

    const [userState, sharedState, fsObject] = (await Promise.all(docPromises)) as [
        IState | null,
        IState | null,
        IFile | IFolder | IShortcut,
    ];

    if (!userState || !fsObject) throw new ServerError(StatusCodes.NOT_FOUND, 'Object not found');

    if (!sharedState) throw new ServerError(StatusCodes.NOT_FOUND, 'Object is not shared with this user');

    if (fsObject.type === 'shortcut') throw new ServerError(StatusCodes.BAD_REQUEST, 'Invalid operation on shortcut');

    return [userState, sharedState, fsObject];
};

/**
 * Create File.
 *  1) Raise user's quota if File size is greater than zero.
 *  2) Create File FsObject.
 *  3) Create user's owner State.
 *  4) Inherit States from parent if exists.
 * @param userId - The user id.
 * @param file - The new File object.
 * @returns {Promise<FsObjectAndState>} Promise object containing created File and State.
 * @throws {ServerError} If parent validations fail.
 */
export const createFile = async (userId: string, file: INewFile): Promise<FsObjectAndState> => {
    if (file.parent) await parentStateCheck(userId, file.parent);

    return makeTransaction(async (session) => {
        if (file.size) {
            await quotasRepository.changeQuotaUsed(userId, file.size, session);
        }

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
 * Create Folder.
 *  1) Create Folder FsObject.
 *  2) Create user's owner State.
 *  3) Inherit States from parent if exists.
 * @param userId - The user to create the Folder.
 * @param folder - The new Folder object.
 * @returns {Promise<FsObjectAndState>} Promise object containing created Folder and State.
 * @throws {ServerError} If parent validations fail.
 */
export const createFolder = async (userId: string, folder: INewFolder): Promise<FsObjectAndState> => {
    if (folder.parent) await parentStateCheck(userId, folder.parent);

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
 * Create Shortcut.
 *  1) Create Shortcut FsObject.
 *  2) Create user's owner State.
 * @param userId - The user to create the Shortcut.
 * @param shortcut - The new Shortcut object.
 * @returns {Promise<FsObjectAndState>} Promise object containing created Shortcut and State.
 * @throws {ServerError} If parent validations fail.
 * @throws {ServerError} If object is not found for user.
 */
export const createShortcut = async (userId: string, shortcut: INewShortcut): Promise<FsObjectAndState> => {
    if (shortcut.parent) await parentStateCheck(userId, shortcut.parent);
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
 * Share FsObject.
 *  1) Create new State for shared user with given permission.
 *  2) If sharing folder: Share with all FsObjects under Folder with given permission.
 * @param userId - The sharing user id.
 * @param fsObjectId - The FsObject id.
 * @param sharedUserId - The shared user id.
 * @param sharedPermission - The shared permission.
 * @returns {Promise<FsObjectAndState>} Promise object containing created State.
 * @throws {ServerError} If object is not found for user.
 * @throws {ServerError} If shared permission is higher than user's permission.
 */
export const shareFsObject = async (
    userId: string,
    fsObjectId: ObjectId,
    sharedUserId: string,
    sharedPermission: permission,
): Promise<IState> => {
    const [fsObjectAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId });
    if (!fsObjectAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Object not found');

    if (permissionPriority[sharedPermission] > permissionPriority[fsObjectAndState.permission])
        throw new ServerError(StatusCodes.BAD_REQUEST, 'Trying to share with higher permission than own');

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
            await apiRepository.shareAllFsObjectsInFolder(fsObjectId, sharedUserId, sharedPermission, session);
        }

        return createdState;
    });
};

/**
 * Add FsObject to user's favorites.
 * @param userId - The user id.
 * @param fsObjectId - The FsObject id.
 * @returns {Promise<IState>} Promise object containing updated State.
 * @throws {ServerError} If object is not found for user.
 */
export const favoriteFsObject = async (userId: string, fsObjectId: ObjectId): Promise<IState> => {
    const [fsObjectAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId });
    if (!fsObjectAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Object not found');

    return statesRepository.updateState(fsObjectAndState.stateId, { favorite: true });
};

/**
 * Aggregate States and FsObjects of user.
 * @param userId - The user id.
 * @param query - The State and FsObject filters.
 * @returns {Promise<FsObjectAndState[]>} Promise object containing the States and FsObjects.
 */
export const aggregateStatesFsObjects = async (
    userId: string,
    query: IAggregateStatesAndFsObjectsQuery,
): Promise<FsObjectAndState[]> => {
    return apiRepository.aggregateStatesFsObjects({ ...query, userId });
};

/**
 * Aggregate FsObjects and States of user.
 * @param userId - The user id.
 * @param query - The State and FsObject filters.
 * @returns {Promise<FsObjectAndState[]>} Promise object containing the States and FsObjects.
 */
export const aggregateFsObjectsStates = async (
    userId: string,
    query: IAggregateStatesAndFsObjectsQuery,
): Promise<FsObjectAndState[]> => {
    return apiRepository.aggregateFsObjectsStates({ ...query, userId });
};

/**
 * Search and aggregate FsObjects and States of user.
 * @param userId - The user id.
 * @param query - The State and FsObject filters.
 * @returns {Promise<FsObjectAndState[]>} Promise object containing the States and FsObjects.
 */
export const searchFsObjectsStates = async (userId: string, query: string): Promise<FsObjectAndState[]> => {
    return apiRepository.searchFsObjectsStates(userId, query);
};

/**
 * Get Quota.
 * @param userId - The user id.
 * @returns {Promise<IQuota>} Promise object containing the quota.
 */
export const getQuotaByUserId = async (userId: string): Promise<IQuota> => {
    return quotasRepository.getQuotaByUserId(userId);
};

/**
 * Get FsObject's hierarchy. Search ancestors until the first root.
 * @param userId - The user id.
 * @param fsObjectId - The FsObject id.
 * @returns {Promise<IFolder[]>} Promise object containing array of Folders in hierarchy.
 * @throws {ServerError} If object is not found for user.
 */
export const getFsObjectHierarchy = async (userId: string, fsObjectId: ObjectId): Promise<IFolder[]> => {
    const [fileAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId });
    if (!fileAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Object not found');

    const hierarchyWithRoots = await apiRepository.getUsersFsObjectHierarchy(userId, fsObjectId);

    const hierarchy: IFolder[] = [];
    for (let i = hierarchyWithRoots.length - 1; i >= 0; i--) {
        const { root, ...folder } = hierarchyWithRoots[i];
        hierarchy.unshift(folder);
        if (root) break;
    }
    return hierarchy;
};

/**
 * Get Folder's children. Return only Files and Folders including depth field that are accessible by user from given folder.
 * @param userId - The user id.
 * @param fsObjectId - The FsObject id.
 * @returns {Promise<IFolder[]>} Promise object containing array of all Files and Folders in Folder.
 * @throws {ServerError} If object is not found for user.
 */
export const getFolderChildren = async (userId: string, fsObjectId: ObjectId): Promise<(IFolder | IFile)[]> => {
    const [folderAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId, type: 'folder' });
    if (!folderAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Folder not found');

    const userFsObjectsUnderFolder = await apiRepository.getAllUsersFsObjectsUnderFolder(userId, fsObjectId, {
        type: { $nin: ['shortcut'] },
    });

    return docBfs(userFsObjectsUnderFolder, fsObjectId, '_id', 'parent');
};

/**
 * Get FsObject's shared States.
 * @param userId - The user id.
 * @param fsObjectId - The FsObject id.
 * @returns {Promise<IState[]>} Promise object containing array of all shared States.
 * @throws {ServerError} If object is not found for user.
 */
export const getSharedUsers = async (userId: string, fsObjectId: ObjectId): Promise<IState[]> => {
    const [fsObjectAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId });
    if (!fsObjectAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Object not found');

    return statesRepository.getStates({ fsObjectId });
};

/**
 * TODO: maybe split into: moveFile, renameFile, resizeFile, etc...
 * Update File.
 *  1) If File size is changed: Update owner's quota.
 *  2) Update File FsObject.
 * @param userId - The user id.
 * @param fsObjectId - The File id.
 * @param update - The update object.
 * @returns {Promise<IFile>} Promise object containing the updated File.
 * @throws {ServerError} If File is not found for user.
 * @throws {ServerError} If user has no permission to update File.
 * @throws {ServerError} If parent validations fail.
 */
export const updateFile = async (
    userId: string,
    fsObjectId: ObjectId,
    update: IUpdateFile,
): Promise<FsObjectAndState> => {
    const [fileAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId, type: 'file' });
    if (!fileAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'File not found');

    if (permissionPriority[fileAndState.permission] < permissionPriority.write)
        throw new ServerError(StatusCodes.FORBIDDEN, 'You do not have permission to edit this file');

    if (update.parent && update.parent !== fileAndState.parent) {
        await parentStateCheck(userId, update.parent);
    }

    const sizeDiff = update.size && fileAndState.size ? update.size - fileAndState.size : 0;

    const [ownerState] = await statesRepository.getStates({ fsObjectId, permission: 'owner' });

    return makeTransaction(async (session) => {
        if (sizeDiff && ownerState) {
            await quotasRepository.changeQuotaUsed(ownerState.userId, sizeDiff, session);
        }

        const { _id, createdAt, updatedAt, ...newFile } = await fsRepository.updateFileById(
            fsObjectId,
            update,
            session,
        );

        return {
            ...fileAndState,
            ...newFile,
            fsObjectId: _id,
            fsObjectCreatedAt: createdAt,
            fsObjectUpdatedAt: updatedAt,
        };
    });
};

/**
 * Update Folder.
 * @param userId - The user id.
 * @param fsObjectId - The Folder id.
 * @param update - The update object.
 * @returns {Promise<IFolder>} Promise object containing the updated Folder.
 * @throws {ServerError} If Folder is not found for user.
 * @throws {ServerError} If user has no permission to update Folder.
 * @throws {ServerError} If parent validations fail.
 */
export const updateFolder = async (userId: string, fsObjectId: ObjectId, update: IUpdateFolder): Promise<IFolder> => {
    const [folderAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId, type: 'folder' });
    if (!folderAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Folder not found');

    if (permissionPriority[folderAndState.permission] < permissionPriority.write)
        throw new ServerError(StatusCodes.FORBIDDEN, 'You do not have permission to edit this folder');

    if (update.parent && update.parent !== folderAndState.parent) {
        await parentStateCheck(userId, update.parent);
    }

    return fsRepository.updateFolderById(fsObjectId, update);
};

/**
 * Update Shortcut.
 * @param userId - The user that owns the Shortcut.
 * @param fsObjectId - The Shortcut id.
 * @param update - The update object.
 * @returns {Promise<IShortcut>} Promise object containing the updated Shortcut.
 * @throws {ServerError} If Shortcut is not found for user.
 * @throws {ServerError} If parent validations fail.
 */
export const updateShortcut = async (
    userId: string,
    fsObjectId: ObjectId,
    update: IUpdateShortcut,
): Promise<IShortcut> => {
    const [shortcutAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId, type: 'shortcut' });
    if (!shortcutAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Shortcut not found');

    if (update.parent && update.parent !== shortcutAndState.parent) {
        await parentStateCheck(userId, update.parent);
    }

    return fsRepository.updateShortcutById(fsObjectId, update);
};

/**
 * Update FsObjects's permission.
 *  1) If FsObject is folder: Update permissions of all children whose root ancestor is the Folder. (If Folder includes other shared Folders with different permissions we don't update them)
 *  2) Update shared user's permission.
 * @param userId - The user id.
 * @param fsObjectId - The FsObject id.
 * @param sharedUserId - The user id of the shared user.
 * @param newPermission - The new permission.
 * @returns {Promise<IState>}
 * @throws {ServerError} If FsObject is not found for user.
 * @throws {ServerError} If Folder is not shared with shared user.
 * @throws {ServerError} If user is trying to change permission to higher than his own.
 */
export const updateFsObjectPermission = async (
    userId: string,
    fsObjectId: ObjectId,
    sharedUserId: string,
    newPermission: permission,
): Promise<IState> => {
    const [userState, sharedState, fsObject] = await getSharedFsObjectDocs(userId, fsObjectId, sharedUserId);

    if (newPermission === sharedState.permission) return sharedState;

    if (permissionPriority[newPermission] > permissionPriority[userState.permission])
        throw new ServerError(StatusCodes.BAD_REQUEST, 'Trying to share with higher permission than own');

    return makeTransaction(async (session) => {
        if (fsObject.type === 'folder') {
            const nonRootFsObjectIdsUnderFolder = await getNonRootFsObjectIdsUnderFolder(sharedUserId, fsObjectId);
            await statesRepository.updateStates(
                { userId: sharedUserId, fsObjectId: { $in: nonRootFsObjectIdsUnderFolder } },
                { permission: newPermission },
                session,
            );
        }

        return statesRepository.updateState({ userId: sharedUserId }, { permission: newPermission }, session);
    });
};

/**
 * Unshare FsObject.
 *  1) Delete State of shared user. If FsObject is a folder, delete States of all children whose root ancestor is the Folder. (If Folder includes other shared Folders with different permissions we don't delete them)
 *  2) Delete FsObjects and States of all shared user's Shortcuts pointing to the FsObject. If FsObject is a folder, delete States of all Shortcuts pointing to the Folder's children.
 * @param fsObjectId - The Shortcut id.
 * @param sharedUserId - The shared user id.
 * @returns {Promise<IState>} Promise object containing the State.
 */
export const unshareFsObject = async (userId: string, fsObjectId: ObjectId, sharedUserId: string): Promise<IState> => {
    const [userState, sharedState, fsObject] = await getSharedFsObjectDocs(userId, fsObjectId, sharedUserId);

    if (permissionPriority[userState.permission] <= permissionPriority[sharedState.permission])
        throw new ServerError(
            StatusCodes.BAD_REQUEST,
            'Trying to unshare user with equal or higher permission than own',
        );

    let shortcutIds: ObjectId[] = [];
    let nonRootFsObjectIdsUnderFolder: ObjectId[] = [];

    if (fsObject.type === 'folder') {
        shortcutIds = await getFsObjectsShortcutIds(sharedUserId, [fsObjectId, ...nonRootFsObjectIdsUnderFolder]);
        nonRootFsObjectIdsUnderFolder = await getNonRootFsObjectIdsUnderFolder(sharedUserId, fsObjectId);
    } else {
        shortcutIds = await getFsObjectsShortcutIds(sharedUserId, [fsObjectId]);
    }

    return makeTransaction(async (session) => {
        await statesRepository.deleteStates(
            { userId: sharedUserId, fsObjectId: { $in: [...shortcutIds, ...nonRootFsObjectIdsUnderFolder] } },
            session,
        );
        await fsRepository.deleteFsObjects({ _id: { $in: shortcutIds } }, session);
        return statesRepository.deleteState({ userId: sharedUserId, fsObjectId }, session);
    });
};

/**
 * Remove FsObject to user's favorites.
 * @param userId - The user id.
 * @param fsObjectId - The FsObject id.
 * @returns {Promise<IState>} Promise object containing updated State.
 * @throws {ServerError} If object is not found for user.
 */
export const unfavoriteFsObject = async (userId: string, fsObjectId: ObjectId): Promise<IState> => {
    const [fsObjectAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId });
    if (!fsObjectAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Object not found');

    return statesRepository.updateState(fsObjectAndState.stateId, { favorite: false });
};

/**
 * Move File to trash.
 *  1) Update user's State on File to trash and trash root. If user is owner of File, update all States of all users on File to trash.
 *  2) Delete FsObjects and States of user's Shortcuts pointing to the File. If user is owner of File, delete all States and FsObjects of all Shortcuts pointing to the File.
 * @param userId - The user id.
 * @param fsObjectId - The File id.
 * @returns {Promise<IState>} Promise object containing updated State.
 * @throws {ServerError} If File is not found for user.
 */
export const moveFileToTrash = async (userId: string, fsObjectId: ObjectId): Promise<IState> => {
    const [fileAndState] = await apiRepository.aggregateStatesFsObjects({
        userId,
        fsObjectId,
        type: 'file',
        trash: false,
    });
    if (!fileAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'File not found');

    let fileShortcutIds = await apiRepository.getFsObjectShortcutIds(fsObjectId);

    return makeTransaction(async (session) => {
        if (fileAndState.permission === 'owner') {
            await statesRepository.updateStates(
                { fsObjectId, userId: { $nin: [userId] } },
                { trash: true, trashRoot: false },
                session,
            );
        } else {
            fileShortcutIds = await statesRepository.getStateFsObjectIds({
                userId,
                fsObjectId: { $in: fileShortcutIds },
            });
        }

        await statesRepository.deleteStates({ fsObjectId: { $in: fileShortcutIds } }, session);
        await fsRepository.deleteFsObjects({ _id: { $in: fileShortcutIds } }, session);

        return statesRepository.updateState({ userId, fsObjectId }, { trash: true, trashRoot: true }, session);
    });
};

/**
 * Delete File from trash.
 *  1) If user is owner of File, delete all users' States on File, delete fsObject, and lower quota.
 *  2) Delete user's State on File.
 * @param userId - The user id.
 * @param fsObjectId - The File id.
 * @returns {Promise<IState>} Promise object containing deleted State.
 * @throws {ServerError} If object is not found for user or if file is not in trash.
 */
export const deleteFileFromTrash = async (userId: string, fsObjectId: ObjectId): Promise<FsObjectAndState> => {
    const [fileAndState] = await apiRepository.aggregateStatesFsObjects({
        userId,
        fsObjectId,
        type: 'file',
        trash: true,
        trashRoot: true,
    });
    if (!fileAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'File not found in trash');

    return makeTransaction(async (session) => {
        if (fileAndState.permission === 'owner') {
            await statesRepository.deleteStates({ userId: { $nin: [userId] }, fsObjectId }, session);
            await fsRepository.deleteFileById(fsObjectId, session);
            if (fileAndState.size) {
                await quotasRepository.changeQuotaUsed(userId, -fileAndState.size, session);
            }
        }

        await statesRepository.deleteState({ userId, fsObjectId }, session);

        return fileAndState;
    });
};

/**
 * Restore File from trash. If user is owner of File, restore all users' States on File.
 * @param userId - The user id.
 * @param fsObjectId - The File id.
 * @returns {Promise<IState>} Promise object containing updated State.
 * @throws {ServerError} If File is not found for user or File is not in trash.
 */
export const restoreFileFromTrash = async (userId: string, fsObjectId: ObjectId): Promise<IState> => {
    const [fileAndState] = await apiRepository.aggregateStatesFsObjects({
        userId,
        fsObjectId,
        type: 'file',
        trash: true,
        trashRoot: true,
    });
    if (!fileAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'File not found in trash');

    return makeTransaction(async (session) => {
        if (fileAndState.permission === 'owner') {
            await statesRepository.updateStates(
                { fsObjectId, userId: { $nin: [userId] } },
                { trash: false, trashRoot: false },
                session,
            );
        }

        return statesRepository.updateState({ userId, fsObjectId }, { trash: false, trashRoot: false }, session);
    });
};

/**
 * Delete File.
 *  1) If user is owner of File, delete all users' States on File, delete fsObject, and lower quota.
 *  2) Delete user's State on File.
 *  3) Delete FsObjects and States of user's Shortcuts pointing to the File. If user is owner of File, delete all States and FsObjects of all Shortcuts pointing to the File.
 * @param userId - The user id.
 * @param fsObjectId - The File id.
 * @returns {Promise<IState>} Promise object containing deleted State.
 * @throws {ServerError} If object is not found for user.
 */
export const deleteFile = async (userId: string, fsObjectId: ObjectId): Promise<FsObjectAndState> => {
    const [fileAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId, type: 'file' });
    if (!fileAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'File not found');

    let fileShortcutIds = await apiRepository.getFsObjectShortcutIds(fsObjectId);

    return makeTransaction(async (session) => {
        if (fileAndState.permission === 'owner') {
            await statesRepository.deleteStates({ userId: { $nin: [userId] }, fsObjectId }, session);
            await fsRepository.deleteFileById(fsObjectId, session);
            if (fileAndState.size) {
                await quotasRepository.changeQuotaUsed(userId, -fileAndState.size, session);
            }
        } else {
            fileShortcutIds = await statesRepository.getStateFsObjectIds({
                userId,
                fsObjectId: { $in: fileShortcutIds },
            });
        }

        await statesRepository.deleteStates({ fsObjectId: { $in: fileShortcutIds } }, session);
        await fsRepository.deleteFsObjects({ _id: { $in: fileShortcutIds } }, session);

        await statesRepository.deleteState({ userId, fsObjectId }, session);

        return fileAndState;
    });
};

/**
 * Move Folder to trash.
 *  1) Update user's State on all Folder's children to trash. If user is owner of Folder, update all users' States on Folder and its children to trash.
 *  2) Update user's State on Folder to trash and trash root.
 *  3) Delete FsObjects and States of user's Shortcuts pointing to the Folder. If user is owner of Folder, delete all States and FsObjects of all Shortcuts pointing to the Folder.
 * @param userId - The user id.
 * @param fsObjectId - The Folder id.
 * @returns {Promise<IState>} Promise object containing updated State.
 * @throws {ServerError} If Folder is not found for user.
 */
export const moveFolderToTrash = async (userId: string, fsObjectId: ObjectId): Promise<IState> => {
    const [folderAndState] = await apiRepository.aggregateStatesFsObjects({
        userId,
        fsObjectId,
        type: 'folder',
        trash: false,
    });
    if (!folderAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Folder not found');

    const fsObjectIdsUnderFolder = await apiRepository.getAllFsObjectIdsUnderFolder(fsObjectId);
    const fsObjectIds = [fsObjectId, ...fsObjectIdsUnderFolder];
    let shortcutIds = await apiRepository.getFsObjectsShortcutIds(fsObjectIds);

    return makeTransaction(async (session) => {
        if (folderAndState.permission === 'owner') {
            await statesRepository.updateStates(
                { fsObjectId: { $in: fsObjectIds } },
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

        await statesRepository.deleteStates({ fsObjectId: { $in: shortcutIds } }, session);
        await fsRepository.deleteFsObjects({ _id: { $in: shortcutIds } }, session);

        return statesRepository.updateState({ userId, fsObjectId }, { trash: true, trashRoot: true }, session);
    });
};

/**
 * Delete Folder from trash.
 *  1) Delete user's State on Folder.
 *  2) If user is owner of Folder, delete all users' States on Folder and its children, delete FsObjects, and lower quotas.
 *  3) If user is not owner of Folder, delete all user's States under Folder apart from 'owner' States.
 * @param userId - The user id.
 * @param fsObjectId - The Folder id.
 * @returns {Promise<IState>} Promise object containing deleted State.
 * @throws {ServerError} If Folder is not found for user or Folder is not in trash.
 */
export const deleteFolderFromTrash = async (
    userId: string,
    fsObjectId: ObjectId,
): Promise<{ deletedFolder: IState; deletedFiles: IFile[] }> => {
    const [folderAndState] = await apiRepository.aggregateStatesFsObjects({
        userId,
        fsObjectId,
        type: 'folder',
        trash: true,
        trashRoot: true,
    });
    if (!folderAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Folder not found');

    const fsObjectIdsUnderFolder = await apiRepository.getAllFsObjectIdsUnderFolder(fsObjectId);
    const fsObjectIds = [fsObjectId, ...fsObjectIdsUnderFolder];

    return makeTransaction(async (session) => {
        const deletedFolder = await statesRepository.deleteState({ userId, fsObjectId }, session);
        const deletedFiles: IFile[] = [];

        if (folderAndState.permission === 'owner') {
            deletedFiles.push(...(await fsRepository.getFiles({ _id: { $in: fsObjectIdsUnderFolder } })));

            const ownerFilesAndStates = await apiRepository.aggregateStatesFsObjects({
                fsObjectId: { $in: fsObjectIdsUnderFolder },
                permission: 'owner',
                type: 'file',
                size: { $gt: 0 },
            });
            await Promise.all(
                ownerFilesAndStates.map((fileAndState) =>
                    quotasRepository.changeQuotaUsed(fileAndState.userId, -fileAndState.size!, session),
                ),
            );

            await fsRepository.deleteFsObjects({ _id: { $in: fsObjectIds } }, session);
            await statesRepository.deleteStates({ fsObjectId: { $in: fsObjectIds } }, session);
        } else {
            await statesRepository.deleteStates(
                { fsObjectId: { $in: fsObjectIdsUnderFolder }, userId, permission: { $nin: ['owner'] } },
                session,
            );
        }

        return { deletedFolder, deletedFiles };
    });
};

/**
 * Restore Folder from trash. If user is owner of Folder, restore all users' States on Folder and its children.
 * @param userId - The user id.
 * @param fsObjectId - The Folder id.
 * @returns {Promise<IState>} Promise object containing updated State.
 * @throws {ServerError} If Folder is not found for user or Folder is not in trash.W
 */
export const restoreFolderFromTrash = async (userId: string, fsObjectId: ObjectId): Promise<IState> => {
    const [folderAndState] = await apiRepository.aggregateStatesFsObjects({
        userId,
        fsObjectId,
        type: 'folder',
        trash: true,
        trashRoot: true,
    });
    if (!folderAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Folder not found in trash');

    return makeTransaction(async (session) => {
        const fsObjectIdsUnderFolder = await apiRepository.getAllFsObjectIdsUnderFolder(fsObjectId);

        if (folderAndState.permission === 'owner') {
            await statesRepository.updateStates(
                { fsObjectId: { $in: [fsObjectId, ...fsObjectIdsUnderFolder] }, userId: { $nin: [userId] } },
                { trash: false, trashRoot: false },
                session,
            );
        }

        return statesRepository.updateState({ userId, fsObjectId }, { trashRoot: false, trash: false }, session);
    });
};

/**
 * Delete Folder.
 *  1) Delete user's State on Folder.
 *  2) If user is owner of Folder, delete all users' States on Folder and its children, delete FsObjects, and lower quotas.
 *  3) If user is not owner of Folder, delete all user's States under Folder apart from 'owner' States.
 *  4) Delete FsObjects and States of user's Shortcuts pointing to the Folder. If user is owner of Folder, delete all States and FsObjects of all Shortcuts pointing to the Folder.
 * @param userId - The user id.
 * @param fsObjectId - The Folder id.
 * @returns {Promise<IState>} Promise object containing deleted State.
 * @throws {ServerError} If Folder is not found for user or Folder is not in trash.
 */
export const deleteFolder = async (
    userId: string,
    fsObjectId: ObjectId,
): Promise<{ deletedFolder: IState; deletedFiles: IFile[] }> => {
    const [folderAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId, type: 'folder' });
    if (!folderAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Folder not found');

    const fsObjectIdsUnderFolder = await apiRepository.getAllFsObjectIdsUnderFolder(fsObjectId);
    const fsObjectIds = [fsObjectId, ...fsObjectIdsUnderFolder];
    let shortcutIds = await apiRepository.getFsObjectsShortcutIds(fsObjectIds);

    return makeTransaction(async (session) => {
        const deletedFolder = await statesRepository.deleteState({ userId, fsObjectId }, session);
        const deletedFiles: IFile[] = [];

        if (folderAndState.permission === 'owner') {
            deletedFiles.push(...(await fsRepository.getFiles({ _id: { $in: fsObjectIdsUnderFolder } })));

            const ownerFilesAndStates = await apiRepository.aggregateStatesFsObjects({
                fsObjectId: { $in: fsObjectIdsUnderFolder },
                permission: 'owner',
                type: 'file',
                size: { $gt: 0 },
            });
            await Promise.all(
                ownerFilesAndStates.map((fileAndState) =>
                    quotasRepository.changeQuotaUsed(fileAndState.userId, -fileAndState.size!, session),
                ),
            );

            await fsRepository.deleteFsObjects({ _id: { $in: fsObjectIds } }, session);
            await statesRepository.deleteStates({ fsObjectId: { $in: fsObjectIds } }, session);
        } else {
            await statesRepository.deleteStates(
                { fsObjectId: { $in: fsObjectIdsUnderFolder }, userId, permission: { $nin: ['owner'] } },
                session,
            );

            shortcutIds = await statesRepository.getStateFsObjectIds({
                fsObjectId: { $in: shortcutIds },
                userId,
            });
        }

        await statesRepository.deleteStates({ fsObjectId: { $in: shortcutIds } }, session);
        await fsRepository.deleteFsObjects({ _id: { $in: shortcutIds } }, session);

        return { deletedFolder, deletedFiles };
    });
};

/**
 * Move Shortcut to trash.
 * @param userId - The user id.
 * @param fsObjectId - The Shortcut id.
 * @returns {Promise<IState>} Promise object containing State.
 * @throws {ServerError} If Shortcut is not found for user.
 */
export const moveShortcutToTrash = async (userId: string, fsObjectId: ObjectId): Promise<IState> => {
    const [shortcutAndState] = await apiRepository.aggregateStatesFsObjects({
        userId,
        fsObjectId,
        type: 'shortcut',
        trash: false,
    });
    if (!shortcutAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Shortcut not found');

    return statesRepository.updateState({ userId, fsObjectId }, { trash: true, trashRoot: true });
};

/**
 * Delete Shortcut from trash.
 * @param userId - The user id.
 * @param fsObjectId - The Shortcut id.
 * @returns {Promise<IState>} Promise object containing deleted State.
 * @throws {ServerError} If object is not found for user or object is not in trash.
 */
export const deleteShortcutFromTrash = async (userId: string, fsObjectId: ObjectId): Promise<IState> => {
    const [shortcutAndState] = await apiRepository.aggregateStatesFsObjects({
        userId,
        fsObjectId,
        type: 'shortcut',
        trash: true,
        trashRoot: true,
    });
    if (!shortcutAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Shortcut not found');

    return makeTransaction(async (session) => {
        await fsRepository.deleteShortcutById(fsObjectId, session);
        return statesRepository.deleteState({ userId, fsObjectId }, session);
    });
};

/**
 * Restore Shortcut from trash.
 * @param userId - The user id.
 * @param fsObjectId - The Shortcut id.
 * @returns {Promise<IState>} Promise object containing updated State.
 * @throws {ServerError} If Shortcut is not found for user or Shortcut is not in trash.
 */
export const restoreShortcutFromTrash = async (userId: string, fsObjectId: ObjectId): Promise<IState> => {
    const [shortcutAndState] = await apiRepository.aggregateStatesFsObjects({
        userId,
        fsObjectId,
        type: 'shortcut',
        trash: true,
        trashRoot: true,
    });
    if (!shortcutAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Shortcut not found in trash');

    return statesRepository.updateState({ userId, fsObjectId }, { trash: false, trashRoot: false });
};

/**
 * Delete Shortcut.
 * @param userId - The user id.
 * @param fsObjectId - The Shortcut id.
 * @returns {Promise<IState>} Promise object containing deleted State.
 * @throws {ServerError} If object is not found for user or object is not in trash.
 */
export const deleteShortcut = async (userId: string, fsObjectId: ObjectId): Promise<IState> => {
    const [shortcutAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId, type: 'shortcut' });
    if (!shortcutAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Shortcut not found');

    return makeTransaction(async (session) => {
        await fsRepository.deleteShortcutById(fsObjectId, session);
        return statesRepository.deleteState({ userId, fsObjectId }, session);
    });
};
