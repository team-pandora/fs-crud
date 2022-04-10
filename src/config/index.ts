import * as env from 'env-var';
import './dotenv';

const config = {
    service: {
        port: env.get('PORT').required().asPortNumber(),
        useCors: env.get('USE_CORS').default('false').asBool(),
    },
    mongo: {
        uri: env.get('MONGO_URI').required().asString(),
        quotasCollectionName: env.get('MONGO_QUOTAS_COLLECTION_NAME').required().asString(),
        statesCollectionName: env.get('MONGO_STATES_COLLECTION_NAME').required().asString(),
        fsObjectsCollectionName: env.get('MONGO_FS_OBJECTS_COLLECTION_NAME').required().asString(),
        uploadsCollectionName: env.get('MONGO_UPLOADS_COLLECTION_NAME').required().asString(),
    },
    quota: {
        defaultLimitInBytes: env.get('QUOTA_DEFAULT_LIMIT_IN_BYTES').default('10737418240').asInt(),
        maxLimitAllowedInBytes: env.get('QUOTA_MAX_LIMIT_ALLOWED_IN_BYTES').default('107374182400').asInt(),
        minLimitAllowedInBytes: env.get('QUOTA_MIN_LIMIT_ALLOWED_IN_BYTES').default('0').asInt(),
    },
    fs: {
        maxHierarchySearchDepth: env.get('FS_MAX_HIERARCHY_SEARCH_DEPTH').default('5').asInt(),
        maxFileSizeInBytes: env.get('FS_MAX_FILE_SIZE_IN_BYTES').default('107374182400').asInt(),
        minFileSizeInBytes: env.get('FS_MIN_FILE_SIZE_IN_BYTES').default('1').asInt(),
        nameRegex: env
            .get('FS_OBJECT_NAME_REGEX')
            .default('^[a-zA-Z0-9-_.!@#$%^&*()[\\]{}<>"\':\\\\\\/\t ]{1,100}$')
            .asRegExp(),
        fileKeyRegex: env
            .get('FS_FILE_KEY_REGEX')
            .default('^[a-zA-Z0-9-_.!@#$%^&*()[\\]{}<>"\':\\\\\\/\t ]{1,100}$')
            .asRegExp(),
        fileBucketRegex: env
            .get('FS_FILE_BUCKET_REGEX')
            .default('^[a-zA-Z0-9-_.!@#$%^&*()[\\]{}<>"\':\\\\\\/\t ]{1,100}$')
            .asRegExp(),
    },
};

export default config;
