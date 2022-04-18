import config from '.';
import { INewFile } from '../express/fs/interface';
import { INewQuota } from '../express/quotas/interface';
import { INewState } from '../express/states/interface';

export const defaultNewQuota: Partial<INewQuota> = {
    limit: config.quota.defaultLimitInBytes,
    used: 0,
};

export const defaultNewState: Partial<INewState> = {
    favorite: false,
    root: false,
    trash: false,
    trashRoot: false,
};

export const defaultNewFile: Partial<INewFile> = {
    public: false,
};
