import config from '.';

export const defaultNewQuota = {
    limit: config.quota.defaultLimitInGb,
    used: 0,
};

export default { defaultNewQuota };
