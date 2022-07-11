import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
    },
    mongo: {
        uri: env.get('MONGO_URI').required().asString(),
        quotasCollectionName: env.get('MONGO_QUOTAS_COLLECTION_NAME').required().asString(),
        statesCollectionName: env.get('MONGO_STATES_COLLECTION_NAME').required().asString(),
        fsObjectsCollectionName: env.get('MONGO_FS_OBJECTS_COLLECTION_NAME').required().asString(),
    },
    quota: {
        defaultLimitInBytes: env.get('QUOTA_DEFAULT_LIMIT_IN_BYTES').default('10737418240').asInt(),
        maxLimitAllowedInBytes: env.get('QUOTA_MAX_LIMIT_ALLOWED_IN_BYTES').default('107374182400').asInt(),
        minLimitAllowedInBytes: env.get('QUOTA_MIN_LIMIT_ALLOWED_IN_BYTES').default('0').asInt(),
    },
    fs: {
        maxFileSizeInBytes: env.get('FS_MAX_FILE_SIZE_IN_BYTES').default('107374182400').asInt(),
        minFileSizeInBytes: env.get('FS_MIN_FILE_SIZE_IN_BYTES').default('0').asInt(),
        nameRegex: env
            .get('FS_OBJECT_NAME_REGEX')
            .default(
                "^(?!.{256,})(?!(aux|clock\\$|con|nul|prn|com[1-9]|lpt[1-9])(?:$|\\.))[^ ][ \\.א-ת\\w-$()+=[\\];#@~,&amp;']+[^\\. ]$",
            )
            .asRegExp(),
        fileBucketRegex: env.get('FS_FILE_BUCKET_REGEX').default('^[a-zA-Z0-9s._@-]{1,100}$').asRegExp(),
    },
    user: {
        idRegex: env.get('USER_ID_REGEX').default('^[a-zA-Z0-9s._@-]{1,100}$').asRegExp(),
    },
    constants: {
        fsObjectTypes: ['file', 'folder', 'shortcut'] as const,
        permissions: ['read', 'write', 'owner'] as const,
        permissionPriority: {
            read: 0,
            write: 1,
            owner: 2,
        } as const,
        statesSortFields: ['stateCreatedAt', 'stateUpdatedAt'] as const,
        fsObjectsSortFields: ['size', 'public', 'name', 'type', 'fsObjectCreatedAt', 'fsObjectUpdatedAt'] as const,
        sortOrders: ['asc', 'desc'] as const,
    },
};

export default config;
