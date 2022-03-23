import { fsObjectType } from '../fs/interface';
import { permission } from '../state/interface';

export interface IAggregateStatesFsObjectsReq {
    // State filters
    stateId?: string;
    userId?: string;
    fsObjectId?: string;
    favorite?: boolean;
    trash?: boolean;
    root?: boolean;
    permission?: permission;

    // FsObject filters
    key?: string;
    bucket?: string;
    source?: string;
    size?: number;
    public?: boolean;
    name?: string;
    parent?: string;
    type?: fsObjectType;
    ref?: string;
}
