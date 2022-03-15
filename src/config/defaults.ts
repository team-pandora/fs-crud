import config from '.';

export const defaultNewQuota = {
    limit: config.quota.defaultLimitInGb,
    used: 0,
};

export const defaultNewState = {
    trash: false,
    favorite: false,
};

export default { defaultNewQuota };
