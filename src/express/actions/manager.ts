import { StatusCodes } from 'http-status-codes';
import * as mongoose from 'mongoose';
import config from '../../config';
import { removeUndefinedFields } from '../../utils/object';
import { ServerError } from '../error';
import { IFile, IFolder, INewFile, INewFolder, INewShortcut, IShortcut, IUpdateFile } from '../fs/interface';
import { createFile, createFolder, createShortcut, updateFile, updateFolder, updateShortcut } from '../fs/manager';
import { FsObjectModel } from '../fs/model';
import { changeQuotaUsed } from '../quotas/manager';
import { IState, IUpdateState, permission as permissionType, permissionRanking } from '../states/interface';
import { createState, updateState } from '../states/manager';
import StateModel from '../states/model';
import { FsObjectAndState, IAggregateStatesFsObjectsReq, IUserAndPermission } from './interface';

const aggregateStatesFsObjects = async (query: IAggregateStatesFsObjectsReq): Promise<FsObjectAndState[]> => {
    const stateFilters = removeUndefinedFields({
        _id: query.stateId,
        userId: query.userId,
        fsObjectId: query.fsObjectId,
        favorite: query.favorite,
        trash: query.trash,
        root: query.root,
        permission: query.permission && { $in: query.permission },
    });
    const fsObjectFilters = removeUndefinedFields({
        'fsObject.parent': query.parent,
        'fsObject.key': query.key,
        'fsObject.bucket': query.bucket,
        'fsObject.source': query.source,
        'fsObject.size': query.size,
        'fsObject.public': query.public,
        'fsObject.name': query.name,
        'fsObject.type': query.type,
        'fsObject.ref': query.ref,
    });

    const pipeline: mongoose.PipelineStage[] = [
        {
            $match: stateFilters,
        },
        {
            $lookup: {
                from: config.mongo.fsObjectsCollectionName,
                localField: 'fsObjectId',
                foreignField: '_id',
                as: 'fsObject',
            },
        },
        {
            $match: fsObjectFilters,
        },
        {
            $unwind: '$fsObject',
        },
        {
            $project: {
                _id: 0,
                stateId: '$_id',
                userId: 1,
                fsObjectId: 1,
                favorite: 1,
                trash: 1,
                root: 1,
                permission: 1,
                stateCreatedAt: '$createdAt',
                stateUpdatedAt: '$updatedAt',
                key: '$fsObject.key',
                bucket: '$fsObject.bucket',
                source: '$fsObject.source',
                size: '$fsObject.size',
                public: '$fsObject.public',
                name: '$fsObject.name',
                parent: '$fsObject.parent',
                type: '$fsObject.type',
                fsObjectCreatedAt: '$fsObject.createdAt',
                fsObjectUpdatedAt: '$fsObject.updatedAt',
                ref: '$fsObject.ref',
            },
        },
    ];

    // Add sort pipeline stage
    if (query.sortBy && query.sortOrder) {
        pipeline.push({
            $sort: {
                [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1,
            },
        });

        // Add pagination pipeline stage, added only if sort exists
        if (query.page && query.pageSize) {
            pipeline.push(
                {
                    $skip: (query.page - 1) * query.pageSize,
                },
                {
                    $limit: query.pageSize,
                },
            );
        }
    }

    return StateModel.aggregate(pipeline).exec();
};

const aggregateFsObjectsStates = async (query: IAggregateStatesFsObjectsReq): Promise<FsObjectAndState[]> => {
    const fsObjectFilters = removeUndefinedFields({
        _id: query.fsObjectId,
        parent: query.parent,
        key: query.key,
        bucket: query.bucket,
        source: query.source,
        size: query.size,
        public: query.public,
        name: query.name,
        type: query.type,
        ref: query.ref,
    });

    const stateFilters = removeUndefinedFields({
        'state._id': query.stateId,
        'state.userId': query.userId,
        'state.favorite': query.favorite,
        'state.trash': query.trash,
        'state.root': query.root,
        'state.permission': query.permission && { $in: query.permission },
    });

    const pipeline: mongoose.PipelineStage[] = [
        {
            $match: fsObjectFilters,
        },
        {
            $lookup: {
                from: config.mongo.statesCollectionName,
                localField: '_id',
                foreignField: 'fsObjectId',
                as: 'state',
            },
        },
        {
            $unwind: '$state',
        },
        {
            $match: stateFilters,
        },
        {
            $project: {
                _id: 0,
                stateId: '$state._id',
                userId: '$state.userId',
                fsObjectId: '$_id',
                favorite: '$state.favorite',
                trash: '$state.trash',
                root: '$state.root',
                permission: '$state.permission',
                stateCreatedAt: '$state.createdAt',
                stateUpdatedAt: '$state.updatedAt',
                key: '$key',
                bucket: '$bucket',
                source: '$source',
                size: '$size',
                public: '$public',
                name: '$name',
                parent: '$parent',
                type: '$type',
                fsObjectCreatedAt: '$createdAt',
                fsObjectUpdatedAt: '$updatedAt',
                ref: '$ref',
            },
        },
    ];

    // Add sort pipeline stage
    if (query.sortBy && query.sortOrder) {
        pipeline.push({
            $sort: {
                [query.sortBy]: query.sortOrder === 'asc' ? 1 : -1,
            },
        });

        // Add pagination pipeline stage, added only if sort exists
        if (query.page && query.pageSize) {
            pipeline.push(
                {
                    $skip: (query.page - 1) * query.pageSize,
                },
                {
                    $limit: query.pageSize,
                },
            );
        }
    }

    return FsObjectModel.aggregate(pipeline).exec();
};

const createUserFile = async (userId: string, file: INewFile): Promise<FsObjectAndState> => {
    if (
        !file.parent &&
        (await aggregateStatesFsObjects({ userId, root: true, name: file.name, source: file.source })).length > 0
    ) {
        throw new Error('Object with the same name already exists');
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const createdFile = await createFile(file, session);

        const createdState = await createState(
            {
                userId,
                fsObjectId: createdFile._id,
                permission: 'owner',
                root: !createdFile.parent,
            },
            session,
        );

        await changeQuotaUsed(userId, file.size, session);

        await session.commitTransaction();

        return new FsObjectAndState(createdFile, createdState);
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

const createUserFolder = async (userId: string, folder: INewFolder): Promise<FsObjectAndState> => {
    if (!folder.parent && (await aggregateStatesFsObjects({ userId, root: true, name: folder.name })).length > 0) {
        throw new Error('Object with the same name already exists');
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const createdFolder = await createFolder(folder, session);

        const createdState = await createState(
            {
                userId,
                fsObjectId: createdFolder._id,
                permission: 'owner',
                root: !createdFolder.parent,
            },
            session,
        );

        await session.commitTransaction();

        return new FsObjectAndState(createdFolder, createdState);
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

const createUserShortcut = async (userId: string, shortcut: INewShortcut): Promise<FsObjectAndState> => {
    if (!shortcut.parent && (await aggregateStatesFsObjects({ userId, root: true, name: shortcut.name })).length > 0) {
        throw new Error('Object with the same name already exists');
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const createdShortcut = await createShortcut(shortcut, session);

        const createdState = await createState(
            {
                userId,
                fsObjectId: createdShortcut._id,
                permission: 'owner',
                root: !createdShortcut.parent,
            },
            session,
        );

        await session.commitTransaction();

        return new FsObjectAndState(createdShortcut, createdState);
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

const updateUserState = async (
    userId: string,
    stateId: mongoose.Types.ObjectId,
    update: IUpdateState,
): Promise<IState> => {
    return updateState({ _id: stateId, userId }, update);
};

const getSharedUsers = async (userId: string, fsObjectId: mongoose.Types.ObjectId): Promise<IUserAndPermission[]> => {
    if (!(await StateModel.exists({ userId, fsObjectId }))) {
        throw new ServerError(StatusCodes.NOT_FOUND, 'Object not found.');
    }

    return StateModel.find({ fsObjectId }, { _id: 0, userId: 1, permission: 1 }).exec();
};

const shareFsObject = async (
    userId: string,
    fsObjectId: mongoose.Types.ObjectId,
    sharedUserId: string,
    permission: permissionType,
): Promise<IState> => {
    const state = await StateModel.findOne({ userId, fsObjectId }).exec();
    if (!state) throw new ServerError(StatusCodes.NOT_FOUND, 'Object not found.');
    if (permissionRanking[permission] > permissionRanking[state.permission])
        throw new ServerError(StatusCodes.BAD_REQUEST, 'Trying to share with higher permission than own.');

    return createState({
        userId: sharedUserId,
        permission,
        fsObjectId,
        root: true,
    });
};

const getFsObjectHierarchy = async (
    userId: string,
    fsObjectId: mongoose.Types.ObjectId,
): Promise<FsObjectAndState[]> => {
    const [fileAndState] = await aggregateStatesFsObjects({ userId, fsObjectId });
    if (!fileAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Provided file does not exist.');

    const hierarchy: FsObjectAndState[] = [fileAndState];

    for (let depth = 0; !hierarchy[0]?.root && depth < config.fs.maxHierarchySearchDepth; depth++) {
        if (!hierarchy[0]?.parent) throw new ServerError(StatusCodes.INTERNAL_SERVER_ERROR, 'Broken hierarchy.');
        // eslint-disable-next-line no-await-in-loop -- It's OK to await here.
        hierarchy.unshift((await aggregateStatesFsObjects({ userId, fsObjectId: hierarchy[0].parent }))[0]);
    }

    return hierarchy;
};

const updateUserFile = async (userId: string, fileId: mongoose.Types.ObjectId, update: IUpdateFile): Promise<IFile> => {
    const fileAndState = (await aggregateStatesFsObjects({ userId, fsObjectId: fileId, type: 'file' }))[0];
    if (!fileAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'File not found.');

    if (permissionRanking[fileAndState.permission] < permissionRanking.write)
        throw new ServerError(StatusCodes.FORBIDDEN, 'You do not have permission to edit this file.');

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const sizeDiff = update.size && fileAndState.size ? update.size - fileAndState.size : 0;
        if (sizeDiff !== 0) {
            await changeQuotaUsed(userId, sizeDiff, session);
        }

        const updatedFile = await updateFile(fileId, update, session);

        await session.commitTransaction();

        return updatedFile;
    } catch (err) {
        await session.abortTransaction();
        throw err;
    } finally {
        session.endSession();
    }
};

const updateUserFolder = async (
    userId: string,
    folderId: mongoose.Types.ObjectId,
    update: IUpdateFile,
): Promise<IFolder> => {
    const folderAndState = (await aggregateStatesFsObjects({ userId, fsObjectId: folderId, type: 'folder' }))[0];
    if (!folderAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Folder not found.');

    if (permissionRanking[folderAndState.permission] < permissionRanking.write)
        throw new ServerError(StatusCodes.FORBIDDEN, 'You do not have permission to edit this folder.');

    return updateFolder(folderId, update);
};

const updateUserShortcut = async (
    userId: string,
    shortcutId: mongoose.Types.ObjectId,
    update: IUpdateFile,
): Promise<IShortcut> => {
    const shortcutAndState = (
        await aggregateStatesFsObjects({ userId, fsObjectId: shortcutId, type: 'shortcut', permission: ['owner'] })
    )[0];
    if (!shortcutAndState) throw new ServerError(StatusCodes.NOT_FOUND, 'Shortcut not found.');

    return updateShortcut(shortcutId, update);
};

export {
    aggregateStatesFsObjects,
    aggregateFsObjectsStates,
    createUserFile,
    createUserFolder,
    createUserShortcut,
    updateUserState,
    getSharedUsers,
    shareFsObject,
    getFsObjectHierarchy,
    updateUserFile,
    updateUserFolder,
    updateUserShortcut,
};
