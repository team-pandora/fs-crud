import { StatusCodes } from 'http-status-codes';
import * as mongoose from 'mongoose';
import config from '../../config';
import { removeUndefinedFields, subtractObjectIdArrays } from '../../utils/object';
import { ServerError } from '../error';
import { IFolder } from '../fs/interface';
import { FsObjectModel } from '../fs/model';
import { INewState, IState, permission } from '../states/interface';
import StateModel from '../states/model';
import * as statesRepository from '../states/repository';
import { FsObjectAndState, IAggregateStatesAndFsObjectsQuery } from './interface';

const { permissionPriority } = config.constants;

/**
 * Check users state on a folder.
 *   1) Check if the user's trying to create an object under
 *      a folder that's in trash
 *   2) Check if the permission user has on the folder,
 *      throws an error if permission is lower than write
 * @param userId - The user id.
 * @param fsObject - The new created fsObject.
 * @returns {Promise<void>} Empty Promise.
 */
const parentStateCheck = async (userId: string, parentFsObjectId: mongoose.Types.ObjectId): Promise<void> => {
    const parent = await statesRepository.getState({ userId, fsObjectId: parentFsObjectId });
    if (!parent) {
        throw new ServerError(StatusCodes.BAD_REQUEST, 'Parent does not exist');
    }
    if (parent.trash) {
        throw new ServerError(StatusCodes.FORBIDDEN, `Cannot create object under a folder in trash`);
    }
    if (permissionPriority[parent.permission] < permissionPriority.write) {
        throw new ServerError(StatusCodes.FORBIDDEN, `User doesn't have permission to create fsObject`);
    }
};

/**
 * Get State and FsObjects objects by filters.
 * Start aggregation from states collection and join with fsObjects collection.
 * @param query - states and fsObjects filters.
 * @returns {Promise<FsObjectAndState[]>} Promise object containing filtered objects.
 */
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

/**
 * Get FsObject and State objects by filters.
 * Start aggregation from fsObjects collection and join with states collection.
 * @param query - fsObjects and states filters.
 * @returns {Promise<FsObjectAndState[]>} Promise object containing filtered objects.
 */
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

/**
 * Get FsObject Ids under a Folder.
 *  1) Match specific fsObjectId
 *  2) Graph lookup all fsObjects under a folder
 *  3) Map all fsObjects to an array of fsObjectIds
 * @param fsObjectId - The Folder id.
 * @returns {Promise<mongoose.Types.ObjectId[]>} Promise object containing filtered objects ids.
 */
const getAllFsObjectIdsUnderFolder = async (
    fsObjectId: mongoose.Types.ObjectId,
): Promise<mongoose.Types.ObjectId[]> => {
    const [result] = await FsObjectModel.aggregate([
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
        {
            $project: {
                _id: 0,
                fsObjectIds: {
                    $map: {
                        input: '$fsObjects',
                        as: 'fsObject',
                        in: '$$fsObject._id',
                    },
                },
            },
        },
    ]).exec();

    if (!result?.fsObjectIds) throw new ServerError(StatusCodes.NOT_FOUND, 'Folder not found');

    return result.fsObjectIds;
};

const getFsObjectHierarchy = async (fsObjectId: mongoose.Types.ObjectId): Promise<IFolder[]> => {
    return FsObjectModel.aggregate([
        {
            $match: {
                _id: fsObjectId,
            },
        },
        {
            $graphLookup: {
                from: 'fsobjects',
                startWith: '$parent',
                connectFromField: 'parent',
                connectToField: '_id',
                as: 'hierarchy',
                depthField: 'depth',
            },
        },
        { $unwind: '$hierarchy' },
        { $sort: { 'hierarchy.depth': -1 } },
        {
            $project: {
                _id: '$hierarchy._id',
                name: '$hierarchy.name',
                parent: '$hierarchy.parent',
                type: '$hierarchy.type',
                createdAt: '$hierarchy.createdAt',
                updatedAt: '$hierarchy.updatedAt',
            },
        },
    ]).exec();
};

const shareWithAllFsObjectsInFolder = async (
    fsObjectId: mongoose.Types.ObjectId,
    sharedUserId: string,
    sharedPermission: permission,
    session?: mongoose.ClientSession,
): Promise<void> => {
    const fsObjectIds = await getAllFsObjectIdsUnderFolder(fsObjectId);
    const permissionsToUpdate = Object.entries(permissionPriority)
        .filter(([_, value]) => value < permissionPriority[sharedPermission])
        .map(([key]) => key) as permission[];

    if (permissionsToUpdate.length) {
        await statesRepository.updateStates(
            {
                fsObjectId: { $in: fsObjectIds },
                permission: { $in: permissionsToUpdate },
                userId: sharedUserId,
            },
            { permission: sharedPermission },
            session,
        );
    }

    const existingStatesFsObjectIds = await statesRepository.getStateFsObjectIds({
        fsObjectId: { $in: fsObjectIds },
        userId: sharedUserId,
    });

    const statesToCreate = subtractObjectIdArrays(fsObjectIds, existingStatesFsObjectIds).map((id) => ({
        fsObjectId: id,
        permission: sharedPermission,
        userId: sharedUserId,
    }));
    await statesRepository.createStates(statesToCreate, session);
};

const inheritStates = async (
    sourceFsObjectId: mongoose.Types.ObjectId,
    destFsObjectId: mongoose.Types.ObjectId,
    session?: mongoose.ClientSession,
): Promise<IState[]> => {
    const states = await statesRepository.getStates({
        fsObjectId: sourceFsObjectId,
        permission: { $nin: ['owner'] },
    });

    const statesToCreate: INewState[] = states.map((state) => ({
        fsObjectId: destFsObjectId,
        userId: state.userId,
        permission: state.permission,
    }));

    return statesRepository.createStates(statesToCreate, session);
};

const inheritStatesSystem = async (
    sourceFsObjectId: mongoose.Types.ObjectId,
    destFsObjectId: mongoose.Types.ObjectId,
    session?: mongoose.ClientSession,
): Promise<IState[]> => {
    const states = await statesRepository.getStates({
        fsObjectId: sourceFsObjectId,
    });

    const statesToCreate: INewState[] = states.map((state) => ({
        fsObjectId: destFsObjectId,
        userId: state.userId,
        permission: state.permission,
    }));

    return statesRepository.createStates(statesToCreate, session);
};

export {
    aggregateStatesFsObjects,
    aggregateFsObjectsStates,
    getAllFsObjectIdsUnderFolder,
    getFsObjectHierarchy,
    parentStateCheck,
    shareWithAllFsObjectsInFolder,
    inheritStates,
    inheritStatesSystem,
};
