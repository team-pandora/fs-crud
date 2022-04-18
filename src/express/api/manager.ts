import { StatusCodes } from 'http-status-codes';
import * as mongoose from 'mongoose';
import config from '../../config';
import { makeTransaction } from '../../utils/mongoose';
import { ServerError } from '../error';
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

export const createFile = async (file: INewFile): Promise<IFile> => {
    return fsRepository.createFile(file);
};

export const createFolder = async (folder: INewFolder): Promise<IFolder> => {
    return fsRepository.createFolder(folder);
};

export const createShortcut = async (shortcut: INewShortcut): Promise<IShortcut> => {
    return fsRepository.createShortcut(shortcut);
};

export const shareFsObject = async (
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

    return statesRepository.createState(state);
};

export const aggregateStatesFsObjects = async (
    query: IAggregateStatesAndFsObjectsQuery,
): Promise<FsObjectAndState[]> => {
    return apiRepository.aggregateStatesFsObjects(query);
};

export const aggregateFsObjectsStates = async (
    query: IAggregateStatesAndFsObjectsQuery,
): Promise<FsObjectAndState[]> => {
    return apiRepository.aggregateFsObjectsStates(query);
};

// TODO translate to aggregation
export const getFsObjectHierarchy = async (
    fsObjectId: mongoose.Types.ObjectId,
): Promise<(IFile | IFolder | IShortcut)[]> => {
    const fsObject = await fsRepository.getFsObject({ _id: fsObjectId });
    if (!fsObject) throw new ServerError(StatusCodes.NOT_FOUND, 'Provided object does not exist.');

    const hierarchy: (IFile | IFolder | IShortcut)[] = [fsObject];

    for (let depth = 0; hierarchy[0]?.parent && depth < config.fs.maxHierarchySearchDepth; depth++) {
        if (!hierarchy[0]) throw new ServerError(StatusCodes.INTERNAL_SERVER_ERROR, 'Broken hierarchy.');
        // eslint-disable-next-line no-await-in-loop -- It's OK to await here.
        hierarchy.unshift(await fsRepository.getFsObject({ _id: hierarchy[0].parent }));
    }

    return hierarchy;
};

export const updateState = async (stateId: mongoose.Types.ObjectId, update: IUpdateState): Promise<IState> => {
    return statesRepository.updateState({ _id: stateId }, update);
};

export const updateFile = async (fsObjectId: mongoose.Types.ObjectId, update: IUpdateFile): Promise<IFile> => {
    return fsRepository.updateFileById(fsObjectId, update);
};

export const updateFolder = async (fsObjectId: mongoose.Types.ObjectId, update: IUpdateFolder): Promise<IFolder> => {
    return fsRepository.updateFolderById(fsObjectId, update);
};

export const updateShortcut = async (
    fsObjectId: mongoose.Types.ObjectId,
    update: IUpdateShortcut,
): Promise<IShortcut> => {
    return fsRepository.updateShortcutById(fsObjectId, update);
};

export const unshareFsObject = async (
    fsObjectId: mongoose.Types.ObjectId,
    userId: string | { $in: string[] },
): Promise<IState> => {
    return statesRepository.deleteState({ fsObjectId, userId });
};

export const deleteFile = async (fsObjectId: mongoose.Types.ObjectId): Promise<void> => {
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

export const deleteFolder = async (fsObjectId: mongoose.Types.ObjectId): Promise<void> => {
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

export const deleteShortcut = async (fsObjectId: mongoose.Types.ObjectId): Promise<void> => {
    return makeTransaction(async (session) => {
        const operations: Promise<any>[] = [
            statesRepository.deleteStates({ fsObjectId }, session),
            fsRepository.deleteShortcutById(fsObjectId, session),
        ];

        await Promise.all(operations);
    });
};
