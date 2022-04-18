import { StatusCodes } from 'http-status-codes';
import * as mongoose from 'mongoose';
import config from '../../../config';
import { makeTransaction } from '../../../utils/mongoose';
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
import { INewState, IState, IUpdateState, permission } from '../../states/interface';
import * as statesRepository from '../../states/repository';
import { FsObjectAndState, IAggregateStatesAndFsObjectsQuery } from '../interface';
import * as apiRepository from '../repository';

const { permissionPriority } = config.constants;

export const createFile = async (userId: string, file: INewFile): Promise<FsObjectAndState> => {
    return makeTransaction(async (session) => {
        const operations: Promise<any>[] = [];

        operations.push(quotasRepository.changeQuotaUsed(userId, file.size, session));

        const createdFile = await fsRepository.createFile(file, session);

        operations.push(
            statesRepository.createState(
                {
                    userId,
                    fsObjectId: createdFile._id,
                    permission: 'owner',
                    root: !createdFile.parent,
                },
                session,
            ),
        );

        const results = await Promise.all(operations);

        return new FsObjectAndState(createdFile, results[1]);
    });
};

export const createFolder = async (userId: string, folder: INewFolder): Promise<FsObjectAndState> => {
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

        return new FsObjectAndState(createdFolder, createdState);
    });
};

export const createShortcut = async (userId: string, shortcut: INewShortcut): Promise<FsObjectAndState> => {
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

    return statesRepository.createState(newState);
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

// TODO translate to aggregation
export const getFsObjectHierarchy = async (
    userId: string,
    fsObjectId: mongoose.Types.ObjectId,
): Promise<FsObjectAndState[]> => {
    const [fileAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId });
    if (!fileAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Provided file does not exist.');

    const hierarchy: FsObjectAndState[] = [fileAndState];

    for (let depth = 0; !hierarchy[0]?.root && depth < config.fs.maxHierarchySearchDepth; depth++) {
        if (!hierarchy[0]?.parent) throw new ServerError(StatusCodes.INTERNAL_SERVER_ERROR, 'Broken hierarchy.');
        hierarchy.unshift(
            // eslint-disable-next-line no-await-in-loop -- It's OK to await here.
            (await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId: hierarchy[0].parent }))[0],
        );
    }

    return hierarchy;
};

export const updateState = async (
    userId: string,
    stateId: mongoose.Types.ObjectId,
    update: IUpdateState,
): Promise<IState> => {
    return statesRepository.updateState({ userId, _id: stateId }, update);
};

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

    return makeTransaction(async (session) => {
        const operations: Promise<any>[] = [];

        if (sizeDiff) operations.push(quotasRepository.changeQuotaUsed(userId, sizeDiff, session));

        operations.push(fsRepository.updateFileById(fsObjectId, update, session));

        return (await Promise.all(operations)).pop();
    });
};

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

export const unshareFsObject = async (
    userId: string,
    fsObjectId: mongoose.Types.ObjectId,
    sharedUserId: string,
): Promise<IState> => {
    const [state] = await statesRepository.getStates({ userId, fsObjectId });
    if (!state) throw new ServerError(StatusCodes.NOT_FOUND, 'Object not found');

    const [sharedState] = await statesRepository.getStates({ userId: sharedUserId, fsObjectId });
    if (!sharedState) throw new ServerError(StatusCodes.BAD_REQUEST, 'Object is not shared with provided user');

    if (permissionPriority[state.permission] <= permissionPriority[sharedState.permission])
        throw new ServerError(
            StatusCodes.BAD_REQUEST,
            'Trying to unshare user with equal or higher permission than own.',
        );

    return statesRepository.deleteState({ userId, fsObjectId });
};

const moveFileToTrash = async (fileAndState: FsObjectAndState): Promise<void> => {
    const { userId, fsObjectId } = fileAndState;

    await makeTransaction(async (session) => {
        const operations: Promise<any>[] = [];

        if (fileAndState.permission === 'owner') {
            operations.push(
                statesRepository.updateStates(
                    { fsObjectId, userId: { $nin: [userId] } },
                    { trash: true, trashRoot: false },
                    session,
                ),
            );
            operations.push(
                statesRepository.updateState({ userId, fsObjectId }, { trash: true, trashRoot: true }, session),
            );
        } else {
            operations.push(statesRepository.updateState({ userId, fsObjectId }, { trash: true }, session));
        }

        await Promise.all(operations);
    });
};

const deleteFileFromTrash = async (fileAndState: FsObjectAndState): Promise<void> => {
    if (!fileAndState.trashRoot) throw new ServerError(StatusCodes.NOT_FOUND, 'File not found.');

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

export const deleteFile = async (userId: string, fsObjectId: mongoose.Types.ObjectId): Promise<void> => {
    const [fileAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId, type: 'file' });
    if (!fileAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'File not found.');

    if (fileAndState.trash) {
        await deleteFileFromTrash(fileAndState);
    } else {
        await moveFileToTrash(fileAndState);
    }
};

export const restoreFileFromTrash = async (userId: string, fsObjectId: mongoose.Types.ObjectId): Promise<void> => {
    const [fileAndState] = await apiRepository.aggregateStatesFsObjects({
        userId,
        fsObjectId,
        type: 'file',
        trash: true,
        trashRoot: true,
    });
    if (!fileAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'File not found in trash.');

    await makeTransaction(async (session) => {
        const operations: Promise<any>[] = [];

        if (fileAndState.permission === 'owner') {
            operations.push(
                statesRepository.updateStates({ fsObjectId, userId: { $nin: [userId] } }, { trash: false }, session),
            );
            operations.push(
                statesRepository.updateState({ userId, fsObjectId }, { trash: false, trashRoot: false }, session),
            );
        } else {
            operations.push(statesRepository.updateState({ userId, fsObjectId }, { trash: false }, session));
        }

        await Promise.all(operations);
    });
};

const moveFolderToTrash = async (folderAndState: FsObjectAndState): Promise<void> => {
    const { userId, fsObjectId } = folderAndState;
    const fsObjectIds = await apiRepository.getAllFsObjectIdsUnderFolder(fsObjectId);

    await makeTransaction(async (session) => {
        const operations: Promise<any>[] = [];

        operations.push(
            statesRepository.updateState({ userId, fsObjectId }, { trash: true, trashRoot: true }, session),
        );

        if (folderAndState.permission === 'owner') {
            operations.push(
                statesRepository.updateStates(
                    { fsObjectId: { $in: fsObjectIds } },
                    { trash: true, trashRoot: false },
                    session,
                ),
            );
        } else {
            operations.push(
                statesRepository.updateStates(
                    { fsObjectId: { $in: fsObjectIds }, userId },
                    { trash: true, trashRoot: false },
                    session,
                ),
            );
        }

        await Promise.all(operations);
    });
};

const deleteFolderFromTrash = async (folderAndState: FsObjectAndState): Promise<void> => {
    if (!folderAndState.trashRoot) throw new ServerError(StatusCodes.NOT_FOUND, 'Folder not found.');

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

export const deleteFolder = async (userId: string, fsObjectId: mongoose.Types.ObjectId): Promise<void> => {
    const [folderAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId, type: 'folder' });
    if (!folderAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Folder not found.');

    if (folderAndState.trash) {
        await deleteFolderFromTrash(folderAndState);
    } else {
        await moveFolderToTrash(folderAndState);
    }
};

export const restoreFolderFromTrash = async (userId: string, fsObjectId: mongoose.Types.ObjectId): Promise<void> => {
    const [folderAndState] = await apiRepository.aggregateStatesFsObjects({
        userId,
        fsObjectId,
        type: 'folder',
        trash: true,
        trashRoot: true,
    });
    if (!folderAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Folder not found in trash.');

    await makeTransaction(async (session) => {
        const operations: Promise<any>[] = [];

        if (folderAndState.permission === 'owner') {
            const fsObjectIds = await apiRepository.getAllFsObjectIdsUnderFolder(fsObjectId);

            operations.push(
                statesRepository.updateStates({ fsObjectId: { $in: fsObjectIds } }, { trash: false }, session),
            );

            operations.push(
                statesRepository.updateState({ userId, fsObjectId }, { trash: false, trashRoot: false }, session),
            );
        } else {
            operations.push(
                statesRepository.updateState({ userId, fsObjectId }, { trashRoot: false, trash: false }, session),
            );
        }

        await Promise.all(operations);
    });
};

export const deleteShortcut = async (userId: string, fsObjectId: mongoose.Types.ObjectId): Promise<void> => {
    const [shortcutAndState] = await apiRepository.aggregateStatesFsObjects({ userId, fsObjectId, type: 'shortcut' });
    if (!shortcutAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Shortcut not found.');

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

export const restoreShortcutFromTrash = async (userId: string, fsObjectId: mongoose.Types.ObjectId): Promise<void> => {
    const [shortcutAndState] = await apiRepository.aggregateStatesFsObjects({
        userId,
        fsObjectId,
        type: 'shortcut',
        trash: true,
        trashRoot: true,
    });
    if (!shortcutAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Shortcut not found in trash.');

    await statesRepository.updateState({ userId, fsObjectId }, { trash: false, trashRoot: false });
};
