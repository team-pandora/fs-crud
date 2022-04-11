import config from '.';
import { INewFile, INewFolder, INewShortcut } from '../express/fs/interface';
import { INewQuota } from '../express/quotas/interface';
import { INewState } from '../express/states/interface';
import { INewUpload } from '../express/uploads/interface';

export const defaultNewQuota: Partial<INewQuota> = {
    limit: config.quota.defaultLimitInBytes,
    used: 0,
};

export const defaultNewState: Partial<INewState> = {
    trash: false,
    favorite: false,
};

export const defaultNewFile: Partial<INewFile> = {
    parent: null,
    public: false,
    source: 'drive',
};

export const defaultNewFolder: Partial<INewFolder> = {
    parent: null,
};

export const defaultNewShortcut: Partial<INewShortcut> = {
    parent: null,
};

export const defaultNewUpload: Partial<INewUpload> = {
    parent: null,
};
