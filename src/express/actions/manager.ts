import * as mongoose from 'mongoose';
import config from '../../config';
import { removeUndefinedFields } from '../../utils/object';
import { INewFile, INewFolder, INewShortcut } from '../fs/interface';
import { createFile, createFolder, createShortcut } from '../fs/manager';
import { FsObjectModel } from '../fs/model';
import { changeQuotaUsed } from '../quota/manager';
import { createState } from '../state/manager';
import StateModel from '../state/model';
import { FsObjectAndState, IAggregateStatesFsObjectsReq } from './interface';

const aggregateStatesFsObjects = async (query: IAggregateStatesFsObjectsReq): Promise<object[]> => {
    const stateFilters = removeUndefinedFields({
        stateId: query.stateId && new mongoose.Types.ObjectId(query.stateId),
        userId: query.userId,
        fsObjectId: query.fsObjectId && new mongoose.Types.ObjectId(query.fsObjectId),
        favorite: query.favorite,
        trash: query.trash,
        root: query.root,
        permission: query.permission && { $in: query.permission },
    });
    const fsObjectFilters = removeUndefinedFields({
        'fsObject.parent': query.parent && new mongoose.Types.ObjectId(query.parent),
        'fsObject.key': query.key,
        'fsObject.bucket': query.bucket,
        'fsObject.source': query.source,
        'fsObject.size': query.size,
        'fsObject.public': query.public,
        'fsObject.name': query.name,
        'fsObject.type': query.type,
        'fsObject.ref': query.ref && new mongoose.Types.ObjectId(query.ref),
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
            pipeline.push({
                $skip: (query.page - 1) * query.pageSize,
            });
            pipeline.push({
                $limit: query.pageSize,
            });
        }
    }

    return StateModel.aggregate(pipeline).exec();
};

const aggregateFsObjectsStates = async (query: IAggregateStatesFsObjectsReq): Promise<object[]> => {
    const fsObjectFilters = removeUndefinedFields({
        parent: query.parent && new mongoose.Types.ObjectId(query.parent),
        key: query.key,
        bucket: query.bucket,
        source: query.source,
        size: query.size,
        public: query.public,
        name: query.name,
        type: query.type,
        ref: query.ref && new mongoose.Types.ObjectId(query.ref),
    });
    const stateFilters = removeUndefinedFields({
        'state.stateId': query.stateId && new mongoose.Types.ObjectId(query.stateId),
        'state.userId': query.userId,
        'state.fsObjectId': query.fsObjectId && new mongoose.Types.ObjectId(query.fsObjectId),
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
            pipeline.push({
                $skip: (query.page - 1) * query.pageSize,
            });
            pipeline.push({
                $limit: query.pageSize,
            });
        }
    }

    return FsObjectModel.aggregate(pipeline).exec();
};

// const deleteObjectTransactions = async (fsObjectId: IAggregateStatesFsObjectsReq): Promise<void> => {
//     const session = await mongoose.startSession();
//     session.startTransaction();
//     try {
//         const file = await FileModel.findOne({
//             _id: fsObjectId,
//         }).exec();
//         if (!file) {
//             throw new Error("File doesn't exist");
//         }
//         const state = await StateModel.findOne({
//             fsObjectId,
//         }).exec();
//         if (!state) {
//             throw new Error("State doesn't exist");
//         }
//         // eslint-disable-next-line no-underscore-dangle
//         await QuotaModel.findOneAndUpdate({ userId: state._id }, { $inc: { used: -file.size } }, { session });

//         await StateModel.deleteOne({ fsObjectId }, { session });
//         await FsObjectModel.deleteOne({ _id: fsObjectId }, { session });

//         await session.commitTransaction();
//     } catch (err) {
//         await session.abortTransaction();
//         throw err;
//     }
// };

const createUserFileTransaction = async (userId: string, file: INewFile): Promise<FsObjectAndState> => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        await changeQuotaUsed(userId, file.size);

        const createdFile = await createFile(file, session);

        const createdState = await createState(
            {
                userId,
                fsObjectId: createdFile._id,
                permission: 'owner',
                root: createdFile.parent === null,
            },
            session,
        );

        await session.commitTransaction();

        return new FsObjectAndState(createdFile, createdState);
    } catch (err) {
        await session.abortTransaction();
        throw err;
    }
};

const createUserFolderTransaction = async (userId: string, folder: INewFolder): Promise<FsObjectAndState> => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const createdFolder = await createFolder(folder, session);

        const createdState = await createState(
            {
                userId,
                fsObjectId: createdFolder._id,
                permission: 'owner',
                root: createdFolder.parent === null,
            },
            session,
        );

        await session.commitTransaction();
        return new FsObjectAndState(createdFolder, createdState);
    } catch (err) {
        await session.abortTransaction();
        throw err;
    }
};

const createUserShortcutTransaction = async (userId: string, shortcut: INewShortcut): Promise<FsObjectAndState> => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const createdShortcut = await createShortcut(shortcut, session);

        const createdState = await createState(
            {
                userId,
                fsObjectId: createdShortcut._id,
                permission: 'owner',
                root: createdShortcut.parent === null,
            },
            session,
        );

        await session.commitTransaction();

        return new FsObjectAndState(createdShortcut, createdState);
    } catch (err) {
        await session.abortTransaction();
        throw err;
    }
};

export {
    aggregateStatesFsObjects,
    aggregateFsObjectsStates,
    createUserFileTransaction,
    createUserFolderTransaction,
    createUserShortcutTransaction,
};
