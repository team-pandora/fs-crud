import * as mongoose from 'mongoose';
import config from '../../config';
import { removeUndefinedFields } from '../../utils/object';
import { IFile, IFolder, IShortcut } from '../fs/interface';
import { FsObjectModel } from '../fs/model';
import StateModel from '../states/model';
import { FsObjectAndState, IAggregateStatesAndFsObjectsQuery } from './interface';

const aggregateStatesFsObjects = async (query: IAggregateStatesAndFsObjectsQuery): Promise<FsObjectAndState[]> => {
    const pipeline: mongoose.PipelineStage[] = [
        {
            $match: removeUndefinedFields({
                _id: query.stateId,
                userId: query.userId,
                fsObjectId: query.fsObjectId,
                favorite: query.favorite,
                trash: query.trash,
                trashRoot: query.trashRoot,
                root: query.root,
                permission: query.permission,
            }),
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
            $match: removeUndefinedFields({
                'fsObject.parent': query.parent,
                'fsObject.key': query.key,
                'fsObject.bucket': query.bucket,
                'fsObject.source': query.source,
                'fsObject.size': query.size,
                'fsObject.public': query.public,
                'fsObject.name': query.name,
                'fsObject.type': query.type,
                'fsObject.ref': query.ref,
            }),
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
                trashRoot: 1,
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

const aggregateFsObjectsStates = async (query: IAggregateStatesAndFsObjectsQuery): Promise<FsObjectAndState[]> => {
    const pipeline: mongoose.PipelineStage[] = [
        {
            $match: removeUndefinedFields({
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
            }),
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
            $match: removeUndefinedFields({
                'state._id': query.stateId,
                'state.userId': query.userId,
                'state.favorite': query.favorite,
                'state.trash': query.trash,
                'state.trashRoot': query.trashRoot,
                'state.root': query.root,
                'state.permission': query.permission && { $in: query.permission },
            }),
        },
        {
            $project: {
                _id: 0,
                stateId: '$state._id',
                userId: '$state.userId',
                fsObjectId: '$_id',
                favorite: '$state.favorite',
                trash: '$state.trash',
                trashRoot: '$state.trashRoot',
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

const getAllFsObjectsUnderFolder = async (
    fsObjectId: mongoose.Types.ObjectId,
): Promise<(IFile | IFolder | IShortcut)[]> => {
    const [{ fsObjects }] = await FsObjectModel.aggregate([
        {
            $match: {
                _id: fsObjectId,
            },
        },
        {
            $graphLookup: {
                from: 'fsobjects',
                startWith: '$_id',
                connectFromField: '_id',
                connectToField: 'parent',
                as: 'fsObjects',
            },
        },
    ]).exec();

    return fsObjects;
};

const getAllFsObjectIdsUnderFolder = async (
    fsObjectId: mongoose.Types.ObjectId,
): Promise<mongoose.Types.ObjectId[]> => {
    const fsObjects = await getAllFsObjectsUnderFolder(fsObjectId);

    // Faster implementation of Array.map() - NEEDED HERE
    const objectIds: mongoose.Types.ObjectId[] = Array(fsObjects.length);
    for (let index = 0; index < fsObjects.length; index++) {
        objectIds[index] = fsObjects[index]._id;
    }

    return objectIds;
};

export { aggregateStatesFsObjects, aggregateFsObjectsStates, getAllFsObjectsUnderFolder, getAllFsObjectIdsUnderFolder };
