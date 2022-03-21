import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
        useCors: env.get('USE_CORS').default('false').asBool(),
    },
    mongo: {
        uri: env.get('MONGO_URI').required().asUrlString(),
        quotaCollectionName: env.get('MONGO_QUOTA_COLLECTION_NAME').required().asString(),
        stateCollectionName: env.get('MONGO_STATE_COLLECTION_NAME').required().asString(),
        fsObjectsCollectionName: env.get('MONGO_FS_OBJECTS_COLLECTION_NAME').required().asString(),
    },
    quota: {
        defaultLimitInBytes: env.get('QUOTA_DEFAULT_LIMIT_IN_BYTES').default('10737418240').asInt(),
        maxLimitAllowedInBytes: env.get('QUOTA_MAX_LIMIT_ALLOWED_IN_BYTES').default('107374182400').asInt(),
        minLimitAllowedInBytes: env.get('QUOTA_MIN_LIMIT_ALLOWED_IN_BYTES').default('0').asInt(),
    },
    fs: {
        maxFileSizeInBytes: env.get('FS_MAX_FILE_SIZE_IN_BYTES').default('107374182400').asInt(),
        minFileSizeInBytes: env.get('FS_MIN_FILE_SIZE_IN_BYTES').default('1').asInt(),
        fsObjectNameRegex: env.get('FS_OBJECT_NAME_REGEX').default('^[a-zA-Z0-9-_]+$').asRegExp(),
        fsObjectKeyRegex: env.get('FS_OBJECT_KEY_REGEX').default('^[a-zA-Z0-9-_]+$').asRegExp(),
        fsObjectBucketNameRegex: env.get('FS_OBJECT_BUCKET_NAME_REGEX').default('^[a-zA-Z0-9-_]+$').asRegExp(),
        fsObjectSourceRegex: env.get('FS_OBJECT_SOURCE_REGEX').default('^[a-zA-Z0-9-_]+$').asRegExp(),
    },
};

export default config;
