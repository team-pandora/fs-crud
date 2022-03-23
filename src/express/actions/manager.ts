import * as mongoose from 'mongoose';
import config from '../../config';
import { removeUndefinedFields } from '../../utils/object';
import StateModel from '../state/model';
import { IAggregateStatesFsObjectsReq } from './interface';

const aggregateStatesFsObjects = async (query: IAggregateStatesFsObjectsReq): Promise<object[]> => {
    const stateFilters = removeUndefinedFields({
        stateId: query.stateId,
        userId: query.userId,
        fsObjectId: query.fsObjectId,
        favorite: query.favorite,
        trash: query.trash,
        root: query.root,
        permission: query.permission,
    });
    const fsObjectFilters = removeUndefinedFields({
        'fsObject.parent': query.parent ? new mongoose.Types.ObjectId(query.parent) : null,
        'fsObject.key': query.key,
        'fsObject.bucket': query.bucket,
        'fsObject.source': query.source,
        'fsObject.size': query.size,
        'fsObject.public': query.public,
        'fsObject.name': query.name,
        'fsObject.type': query.type,
        'fsObject.ref': query.ref,
    });

    return StateModel.aggregate([
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
    ]).exec();
};

export { aggregateStatesFsObjects };
export default { aggregateStatesFsObjects };
