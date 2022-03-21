import config from '.';
import { INewFile, INewFolder, INewShortcut } from '../express/fs/interface';
import { INewQuota } from '../express/quota/interface';

export const defaultNewQuota: Partial<INewQuota> = {
    limit: config.quota.defaultLimitInBytes,
    used: 0,
};

export const defaultNewState = {
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
