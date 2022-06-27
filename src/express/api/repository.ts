import { StatusCodes } from 'http-status-codes';
import * as mongoose from 'mongoose';
import config from '../../config';
import { ObjectId } from '../../utils/mongoose';
import { removeUndefinedFields, subtractObjectIdArrays } from '../../utils/object';
import { ServerError } from '../error';
import { fsObjectType, IFile, IFolder, IShortcut } from '../fs/interface';
import { FsObjectModel, ShortcutModel } from '../fs/model';
import { INewState, IState, IStateFilters, permission } from '../states/interface';
import StateModel from '../states/model';
import * as statesRepository from '../states/repository';
import { FsObjectAndState, IAggregateStatesAndFsObjectsQuery } from './interface';

const { permissionPriority } = config.constants;

/**
 * Get Objects containing FsObject and State data by filters.
 * Starts aggregation from states collection and joins with FsObjects collection.
 * @param query - FsObject and State filters.
 * @returns {Promise<FsObjectAndState[]>} Promise object containing filtered objects.
 */
export const aggregateStatesFsObjects = async (
    query: IAggregateStatesAndFsObjectsQuery,
): Promise<FsObjectAndState[]> => {
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
            }) as any,
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
                'fsObject.bucket': query.bucket,
                'fsObject.client': query.client,
                'fsObject.size': query.size,
                'fsObject.public': query.public,
                'fsObject.name': query.name,
                'fsObject.type': query.type,
                'fsObject.ref': query.ref,
            }) as any,
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
                bucket: '$fsObject.bucket',
                client: '$fsObject.client',
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
 * Get Objects containing FsObject and State data by filters.
 * Starts aggregation from FsObjects collection and joins with states collection.
 * @param query - FsObject and State filters.
 * @returns {Promise<FsObjectAndState[]>} Promise object containing filtered objects.
 */
export const aggregateFsObjectsStates = async (
    query: IAggregateStatesAndFsObjectsQuery,
): Promise<FsObjectAndState[]> => {
    const pipeline: mongoose.PipelineStage[] = [
        {
            $match: removeUndefinedFields({
                _id: query.fsObjectId,
                parent: query.parent,
                bucket: query.bucket,
                client: query.client,
                size: query.size,
                public: query.public,
                name: query.name,
                type: query.type,
                ref: query.ref,
            }) as any,
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
            }) as any,
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
                bucket: '$bucket',
                client: '$client',
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
 * Get Objects containing FsObject and State data by name search.
 * Starts aggregation from FsObjects collection and joins with states collection.
 * @param query - FsObject and State filters.
 * @returns {Promise<FsObjectAndState[]>} Promise object containing filtered objects.
 */
export const searchFsObjectsStates = async (userId: string, query: string): Promise<FsObjectAndState[]> => {
    const pipeline: mongoose.PipelineStage[] = [
        {
            $match: {
                $or: [{ $text: { $search: query } }, { name: { $regex: query, $options: 'i' } }],
            } as any,
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
            $match: { 'state.userId': userId },
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
                bucket: '$bucket',
                client: '$client',
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

    return FsObjectModel.aggregate(pipeline).exec();
};

/**
 * Get all FsObjects under Folder.
 *  1) Match specific fsObjectId.
 *  2) Graph lookup all FsObjects under a Folder.
 * @param folderId - The Folder id.
 * @param filters - Restrict search with match filters.
 * @returns {Promise<ObjectId[]>} Promise object containing filtered objects.
 */
export const getAllFsObjectsUnderFolder = async (
    folderId: ObjectId,
    filters?: { type?: { $in: fsObjectType[] } | { $nin: fsObjectType[] } },
): Promise<((IFile | IFolder | IShortcut) & { depth: number })[]> => {
    const [result] = await FsObjectModel.aggregate([
        {
            $match: {
                _id: folderId,
            } as any,
        },
        {
            $graphLookup: {
                from: 'fsobjects',
                startWith: '$_id',
                connectFromField: '_id',
                connectToField: 'parent',
                as: 'fsObjects',
                depthField: 'depth',
                restrictSearchWithMatch: filters || {},
            },
        },
    ]).exec();

    if (!result?.fsObjects) throw new ServerError(StatusCodes.NOT_FOUND, 'Folder not found');

    return result.fsObjects;
};

/**
 * Get ids of all FsObjects under Folder.
 *  1) Match specific FsObjectId.
 *  2) Graph lookup all FsObjects under a Folder.
 *  3) Map all FsObjects to an array of fsObjectIds.
 * @param folderId - The Folder id.
 * @param filters - Restrict search with match filters.
 * @returns {Promise<ObjectId[]>} Promise object containing filtered objects ids.
 */
export const getAllFsObjectIdsUnderFolder = async (
    folderId: ObjectId,
    filters?: { type?: { $in: fsObjectType[] } | { $nin: fsObjectType[] } },
): Promise<ObjectId[]> => {
    const [result] = await FsObjectModel.aggregate([
        {
            $match: {
                _id: folderId,
            } as any,
        },
        {
            $graphLookup: {
                from: 'fsobjects',
                startWith: '$_id',
                connectFromField: '_id',
                connectToField: 'parent',
                as: 'fsObjects',
                restrictSearchWithMatch: filters || {},
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

/**
 * Get all user's FsObjects under Folder. Returns all FsObjects Including ones without full hierarchy path from folder.
 *  1) Match specific FsObjectId.
 *  2) Graph lookup all FsObjects under a Folder.
 *  3) Lookup all users's states on FsObjects.
 *  4) Filter users's FsObjects and sort.
 * @param folderId - The Folder id.
 * @param filters - Restrict search with match filters.
 * @returns {Promise<ObjectId[]>} Promise object containing filtered objects.
 */
export const getAllUsersFsObjectsUnderFolder = async (
    userId: string,
    folderId: ObjectId,
    filters?: { type?: { $in: fsObjectType[] } | { $nin: fsObjectType[] } },
): Promise<(IFile | IFolder | IShortcut)[]> => {
    return FsObjectModel.aggregate([
        {
            $match: {
                _id: folderId,
            } as any,
        },
        {
            $graphLookup: {
                from: 'fsobjects',
                startWith: '$_id',
                connectFromField: '_id',
                connectToField: 'parent',
                as: 'fsObject',
                depthField: 'depth',
                restrictSearchWithMatch: filters || {},
            },
        },
        {
            $unwind: {
                path: '$fsObject',
            },
        },
        {
            $replaceRoot: {
                newRoot: '$fsObject',
            },
        },
        {
            $lookup: {
                from: 'states',
                localField: '_id',
                foreignField: 'fsObjectId',
                pipeline: [{ $match: { userId } }],
                as: 'state',
            },
        },
        {
            $unwind: {
                path: '$state',
            },
        },
        { $sort: { depth: 1 } },
        {
            $project: {
                _id: 1,
                name: 1,
                parent: 1,
                createdAt: 1,
                updatedAt: 1,
                type: 1,
                bucket: 1,
                size: 1,
                public: 1,
                client: 1,
                ref: 1,
            },
        },
    ]).exec();
};

/**
 * Get array of Folders representing an FsObjects hierarchy (all ancestors).
 *  1) Match specific fsObjectId.
 *  2) Graph lookup all ancestors.
 *  3) Sort by depth.
 * @param fsObjectId - The FsObject id.
 * @returns {Promise<IFolder[]>} Promise object containing hierarchy of Folders.
 */
export const getFsObjectHierarchy = async (fsObjectId: ObjectId): Promise<IFolder[]> => {
    return FsObjectModel.aggregate([
        {
            $match: {
                _id: fsObjectId,
            } as any,
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

/**
 * Get array of user's Folders representing an FsObjects hierarchy (all ancestors).
 * Return only folders accessible by user including ones without full hierarchy path to folder.
 * Include root field.
 *  1) Match specific fsObjectId.
 *  2) Graph lookup all ancestors.
 *  3) Lookup all users's states on FsObjects.
 *  4) Filter users's FsObjects and sort.
 * @param fsObjectId - The FsObject id.
 * @returns {Promise<IFolder[]>} Promise object containing hierarchy of Folders.
 */
export const getUsersFsObjectHierarchy = async (
    userId: string,
    fsObjectId: ObjectId,
): Promise<(IFolder & { root: boolean })[]> => {
    return FsObjectModel.aggregate([
        {
            $match: {
                _id: fsObjectId,
            } as any,
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
        { $replaceRoot: { newRoot: '$hierarchy' } },
        {
            $lookup: {
                from: 'states',
                localField: '_id',
                foreignField: 'fsObjectId',
                pipeline: [{ $match: { userId } }],
                as: 'state',
            },
        },
        { $unwind: '$state' },
        { $sort: { depth: -1 } },
        {
            $project: {
                _id: 1,
                name: 1,
                parent: 1,
                type: 1,
                createdAt: 1,
                updatedAt: 1,
                root: '$state.root',
            },
        },
    ]).exec();
};

/**
 * Share all FsObjects under a Folder with a given user and permission.
 *  1) Update permission of all FsObjects that already have lower permission.
 *  2) Create new states with sharedPermission for all FsObjects that don't have a state yet.
 * @param fsObjectId - The FsObject id.
 * @param sharedUserId - The User id to share with.
 * @param sharedPermission - The shared permission.
 * @param session - Optional mongoose session.
 * @returns {Promise<void>} Void Promise.
 */
export const shareAllFsObjectsInFolder = async (
    fsObjectId: ObjectId,
    sharedUserId: string,
    sharedPermission: permission,
    session?: mongoose.ClientSession,
): Promise<void> => {
    const fsObjectIds = await getAllFsObjectIdsUnderFolder(fsObjectId, { type: { $nin: ['shortcut'] } });

    // Ids of all FsObjects that are already shared with the user.
    const alreadySharedFsObjectIds = await statesRepository.getStateFsObjectIds({
        fsObjectId: { $in: fsObjectIds },
        userId: sharedUserId,
    });

    // Update only permissions that have lower priority than the shared permission.
    const permissionsToUpdate = Object.entries(permissionPriority)
        .filter(([_, value]) => value < permissionPriority[sharedPermission])
        .map(([key]) => key) as permission[];

    // Update permissions of all FsObjects that are already shared but with lower permissions.
    if (permissionsToUpdate.length) {
        await statesRepository.updateStates(
            {
                fsObjectId: { $in: alreadySharedFsObjectIds },
                permission: { $in: permissionsToUpdate },
                userId: sharedUserId,
            },
            { permission: sharedPermission },
            session,
        );
    }

    // Create new states for all FsObjects that don't have a state yet.
    const statesToCreate = subtractObjectIdArrays(fsObjectIds, alreadySharedFsObjectIds).map((id) => ({
        fsObjectId: id,
        permission: sharedPermission,
        userId: sharedUserId,
    }));

    await statesRepository.createStates(statesToCreate, session);
};

/**
 * Inherit (Find and Copy) states for FsObject from filtered existing states.
 * @param filters - The state filters object.
 * @param fsObjectId - The FsObject id.
 * @param session - Optional mongoose session.
 * @returns {Promise<IState[]>} Promise containing created states.
 */
export const inheritStates = async (
    filters: IStateFilters,
    fsObjectId: ObjectId,
    session?: mongoose.ClientSession,
): Promise<IState[]> => {
    const states = await statesRepository.getStates(filters);

    const statesToCreate: INewState[] = states.map((state) => ({
        fsObjectId,
        userId: state.userId,
        permission: state.permission,
        trash: state.trash,
    }));

    return statesRepository.createStates(statesToCreate, session);
};

/**
 * Get all Shortcut ids to a given FsObject.
 * @param fsObjectId - The FsObject id.
 * @returns {Promise<ObjectId[]>} Promise object containing Shortcut ids.
 */
export const getFsObjectShortcutIds = async (fsObjectId: ObjectId): Promise<ObjectId[]> => {
    const [result] = await FsObjectModel.aggregate([
        {
            $match: {
                _id: fsObjectId,
            } as any,
        },
        {
            $lookup: {
                from: 'fsobjects',
                localField: '_id',
                foreignField: 'ref',
                as: 'shortcuts',
            },
        },
        {
            $project: {
                _id: 0,
                shortcutIds: {
                    $map: {
                        input: '$shortcuts',
                        as: 'shortcut',
                        in: '$$shortcut._id',
                    },
                },
            },
        },
    ]).exec();

    return result.shortcutIds;
};

/**
 * Get all Shortcut ids to a all FsObjects in array.
 * @param fsObjectsIds - Array of FsObjects ids.
 * @returns {Promise<ObjectId[]>} Promise object containing Shortcut ids.
 */
export const getFsObjectsShortcutIds = async (fsObjectsIds: ObjectId[]): Promise<ObjectId[]> => {
    const result = await ShortcutModel.find({ ref: { $in: fsObjectsIds } }).exec();
    return result.map((item) => item._id);
};
