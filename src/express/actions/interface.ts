import { fsObjectType } from '../fs/interface';
import { permission } from '../state/interface';

export const AggregateStatesFsObjectsSortByFields = [
    'size',
    'public',
    'name',
    'type',
    'fsObjectCreatedAt',
    'fsObjectUpdatedAt',
    'stateCreatedAt',
    'stateUpdatedAt',
    'stateUpdatedAt',
] as const;
export type AggregateStatesFsObjectsSortBy = typeof AggregateStatesFsObjectsSortByFields[number];

export const AggregateStatesFsObjectsSortOrders = ['asc', 'desc'] as const;
export type AggregateStatesFsObjectsSortOrder = typeof AggregateStatesFsObjectsSortOrders[number];
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

    // Sort
    sortBy?: AggregateStatesFsObjectsSortBy;
    sortOrder?: AggregateStatesFsObjectsSortOrder;

    // Pagination
    page?: number;
    pageSize?: number;
}
