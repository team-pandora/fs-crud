import * as env from 'env-var';
import { GB } from '../utils/fs';
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
        defaultLimitInGb: env.get('QUOTA_DEFAULT_LIMIT_IN_GB').default('10').asInt() * GB,
        maxLimitAllowedInGb: env.get('QUOTA_MAX_LIMIT_ALLOWED_IN_GB').default('100').asInt() * GB,
        minLimitAllowedInGb: env.get('QUOTA_MIN_LIMIT_ALLOWED_IN_GB').default('0').asInt() * GB,
    },
};

export default config;
