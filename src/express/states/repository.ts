import { StatusCodes } from 'http-status-codes';
import { ClientSession } from 'mongoose';
import { defaultNewState } from '../../config/defaults';
import { ObjectId } from '../../utils/mongoose';
import { ServerError } from '../error';
import { INewState, IState, IStateFilters, IUpdateState } from './interface';
import StateModel from './model';

/**
 * Create a State.
 * @param state - The new State object.
 * @param session - Optional mongoose session.
 * @returns {Promise<IState>} Promise object containing the created State.
 */
export const createState = async (state: INewState, session?: ClientSession): Promise<IState> => {
    return (await StateModel.create([{ ...defaultNewState, ...state }], { session }))[0] as IState;
};

/**
 * Create States.
 * @param states - The new State object.
 * @param session - Optional mongoose session.
 * @returns {Promise<IState[]>} Promise object containing the created States.
 */
export const createStates = async (states: INewState[], session?: ClientSession): Promise<IState[]> => {
    const formattedStates = states.map((state) => ({ ...defaultNewState, ...state }));
    return StateModel.create(formattedStates, { session }) as Promise<IState[]>;
};

/**
 * Get State.
 * @param filters - The State filters.
 * @returns {Promise<IState>} Promise object containing the State.
 */
export const getState = async (filters: IStateFilters): Promise<IState | null> => {
    return StateModel.findOne(filters).exec();
};

/**
 * Get States.
 * @param filters - The State filters.
 * @returns {Promise<IState[]>} Promise object containing the States.
 */
export const getStates = async (filters: IStateFilters): Promise<IState[]> => {
    return StateModel.find(filters).exec();
};

/**
 * Get fsObject ids of States.
 * @param filters - The State filters.
 * @returns {Promise<ObjectId[]>} Promise object containing the FsObject ids.
 */
export const getStateFsObjectIds = async (filters: IStateFilters): Promise<ObjectId[]> => {
    return (await StateModel.find(filters).exec()).map((state) => state.fsObjectId);
};

/**
 * Update State.
 * @param filters - The State filters.
 * @param update - The update object.
 * @param session - Optional mongoose session.
 * @returns {Promise<IState>} Promise object containing the updated State.
 * @throws {ServerError} If State not found.
 */
export const updateState = async (
    filters: IStateFilters,
    update: IUpdateState,
    session?: ClientSession,
): Promise<IState> => {
    const result = await StateModel.findOneAndUpdate(filters, { $set: update }, { new: true, session }).exec();
    if (result === null) throw new ServerError(StatusCodes.NOT_FOUND, 'State not found');
    return result;
};

/**
 * Update States.
 * @param filters - The State filters.
 * @param update - The update object.
 * @param session - Optional mongoose session.
 * @returns {Promise<number>} Promise object containing the amount of updated States.
 */
export const updateStates = async (
    filters: IStateFilters,
    update: IUpdateState,
    session?: ClientSession,
): Promise<number> => {
    const result = await StateModel.updateMany(filters, { $set: update }, { session }).exec();
    if (!result.acknowledged) throw new ServerError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update states');
    return result.modifiedCount;
};

/**
 * Delete State.
 * @param filters - The State filters.
 * @param session - Optional mongoose session.
 * @returns {Promise<IState>} Promise object containing the deleted State.
 * @throws {ServerError} If State not found.
 */
export const deleteState = async (filters: IStateFilters, session?: ClientSession): Promise<IState> => {
    const result = await StateModel.findOneAndDelete(filters, { session }).exec();
    if (result === null) throw new ServerError(StatusCodes.NOT_FOUND, 'State not found');
    return result;
};

/**
 * Delete States.
 * @param filters - The State filters.
 * @param session - Optional mongoose session.
 * @returns {Promise<number>} Promise object containing the amount of deleted States.
 */
export const deleteStates = async (filters: IStateFilters, session?: ClientSession): Promise<number> => {
    const result = await StateModel.deleteMany(filters, { session }).exec();
    if (!result.acknowledged) throw new ServerError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete states');
    return result.deletedCount;
};
