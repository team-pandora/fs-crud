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
    },
    quota: {
        maxLimitAllowed: env.get('QUOTA_MAX_LIMIT_ALLOWED').default('100').asInt(),
        defaultLimit: env.get('QUOTA_DEFAULT_LIMIT').default('10').asInt(),
        minLimitAllowed: env.get('QUOTA_MIN_LIMIT_ALLOWED').default('0').asInt(),
    },
};

export default config;
