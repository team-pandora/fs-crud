import { StatusCodes } from 'http-status-codes';
import { makeTransaction, ObjectId } from '../../../utils/mongoose';
import { ServerError } from '../../error';
import { IFile, IFileFilters, INewFile, IUpdateFile } from '../../fs/interface';
import * as fsRepository from '../../fs/repository';
import * as quotasRepository from '../../quotas/repository';
import { IState, permission } from '../../states/interface';
import * as statesRepository from '../../states/repository';
import { FsObjectAndState, IAggregateStatesAndFsObjectsQuery } from '../interface';
import * as apiRepository from '../repository';

/**
 * Create File.
 * @param client - The client id.
 * @param file - The new File object.
 * @returns {Promise<IFile>} Promise object containing the created File.
 */
export const createFile = async (client: string, file: INewFile): Promise<IFile> => {
    return fsRepository.createFile({ ...file, client, parent: null });
};

/**
 * Share File.
 *  1) Check if File exists.
 *  2) If shared permission is owner: Throw if owner already exists. Otherwise raise user's quota.
 *  3) Create new State.
 * @param client - The client id.
 * @param fileId - The File id.
 * @param sharedUserId - The user to share with.
 * @param sharedPermission - The shared permission.
 * @returns {Promise<IState>} Promise object containing the created state.
 */
export const shareFile = async (
    client: string,
    fileId: ObjectId,
    sharedUserId: string,
    sharedPermission: permission,
): Promise<IState> => {
    const file = await fsRepository.getFile({ _id: fileId, client });

    return makeTransaction(async (session) => {
        if (sharedPermission === 'owner') {
            const ownerState = await statesRepository.getState({
                fsObjectId: fileId,
                userId: sharedUserId,
                permission: 'owner',
            });

            if (ownerState) throw new ServerError(StatusCodes.CONFLICT, 'File already has owner');

            await quotasRepository.changeQuotaUsed(sharedUserId, file.size, session);
        }

        return statesRepository.createState(
            {
                userId: sharedUserId,
                permission: sharedPermission,
                fsObjectId: fileId,
                root: true,
            },
            session,
        );
    });
};

/**
 * Get State and FsObjects objects by filters.
 * @param client - The client id.
 * @param query - State and FsObject filters.
 * @returns {Promise<FsObjectAndState[]>} Promise object containing filtered objects.
 */
export const aggregateStatesFsObjects = async (
    client: string,
    query: IAggregateStatesAndFsObjectsQuery,
): Promise<FsObjectAndState[]> => {
    return apiRepository.aggregateStatesFsObjects({ ...query, client });
};

/**
 * Get FsObject and State objects by filters.
 * @param client - The client id.
 * @param query - FsObjects and states filters.
 * @returns {Promise<FsObjectAndState[]>} Promise object containing filtered objects.
 */
export const aggregateFsObjectsStates = async (
    client: string,
    query: IAggregateStatesAndFsObjectsQuery,
): Promise<FsObjectAndState[]> => {
    return apiRepository.aggregateFsObjectsStates({ ...query, client });
};

/**
 * Get Files by filters.
 * @param client - The client id.
 * @param query - File filters.
 * @returns {Promise<IFile[]>} Promise object containing filtered files.
 */
export const getFiles = async (client: string, query: IFileFilters): Promise<IFile[]> => {
    return fsRepository.getFiles({ ...query, client });
};

/**
 * Update a File.
 * @param client - The client id.
 * @param fileId - The File id.
 * @param update - The update object.
 * @returns {Promise<IFile>} Promise object containing the updated File.
 */
export const updateFileById = async (client: string, fileId: ObjectId, update: IUpdateFile): Promise<IFile> => {
    await fsRepository.getFile({ _id: fileId, client });
    return fsRepository.updateFileById(fileId, update);
};

/**
 * Update user File's permission
 *  1) Check if File exists.
 *  2) If shared permission is owner: Throw if owner already exists. Otherwise raise user's quota.
 *  3) If shared permission is not owner: If user is owner, lower user's quota.
 *  4) Update State.
 * @param client - The client id.
 * @param fileId - The File id.
 * @param sharedUserId - The shared user.
 * @param updatePermission - The new permission.
 * @return {Promise<IState>}
 */
export const updateFilePermission = async (
    client: string,
    fileId: ObjectId,
    sharedUserId: string,
    updatePermission: permission,
): Promise<IState> => {
    const file = await fsRepository.getFile({ _id: fileId, client });
    const ownerState = await statesRepository.getState({ fsObjectId: fileId, permission: 'owner' });

    if (ownerState && updatePermission === 'owner')
        throw new ServerError(StatusCodes.CONFLICT, 'File already has owner');

    return makeTransaction(async (session) => {
        if (updatePermission === 'owner') {
            await quotasRepository.changeQuotaUsed(sharedUserId, file.size, session);
        } else if (ownerState && ownerState.userId === sharedUserId) {
            await quotasRepository.changeQuotaUsed(sharedUserId, -file.size, session);
        }
        return statesRepository.updateState({ userId: sharedUserId }, { permission: updatePermission }, session);
    });
};

/**
 * Delete user state on File.
 *  1) Check if File exists.
 *  2) If user is owner then lower user's quota.
 *  3) Delete State.
 * @param client - The client id.
 * @param fileId - The File id.
 * @param userId - The shared user.
 * @returns {Promise<IState>} Promise object containing the deleted State.
 */
export const unshareFileById = async (client: string, fileId: ObjectId, userId: string): Promise<IState> => {
    const file = await fsRepository.getFile({ _id: fileId, client });
    const ownerState = await statesRepository.getState({ fsObjectId: fileId, permission: 'owner' });

    return makeTransaction(async (session) => {
        if (ownerState && ownerState.userId === userId) {
            await quotasRepository.changeQuotaUsed(userId, -file.size, session);
        }
        return statesRepository.deleteState({ fsObjectId: fileId, userId }, session);
    });
};

/**
 * Delete a File.
 *  1) Check if File exists.
 *  2) If File has owner then lower owners's quota.
 *  3) Delete File's States.
 *  4) Delete File.
 * @param client - The client id.
 * @param fileId - The File id.
 * @returns {Promise<IFile>} Promise object containing the deleted File.
 */
export const deleteFileById = async (client: string, fileId: ObjectId): Promise<void> => {
    const file = await fsRepository.getFile({ _id: fileId, client });
    const ownerState = await statesRepository.getState({ fsObjectId: fileId, permission: 'owner' });

    await makeTransaction(async (session) => {
        if (file?.size && ownerState) {
            await quotasRepository.changeQuotaUsed(ownerState.userId, file.size, session);
        }
        await statesRepository.deleteStates({ fsObjectId: fileId }, session);
        await fsRepository.deleteFileById(fileId, session);
    });
};
