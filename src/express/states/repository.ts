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
const createState = async (state: INewState, session?: ClientSession): Promise<IState> => {
    return (await StateModel.create([{ ...defaultNewState, ...state }], { session }))[0];
};

/**
 * Create States.
 * @param states - The new State object.
 * @param session - Optional mongoose session.
 * @returns {Promise<IState[]>} Promise object containing the created States.
 */
const createStates = async (states: INewState[], session?: ClientSession): Promise<IState[]> => {
    const formattedStates = states.map((state) => ({ ...defaultNewState, ...state }));
    return StateModel.create(formattedStates, { session });
};

/**
 * Get State.
 * @param filters - The State filters.
 * @returns {Promise<IState>} Promise object containing the State.
 */
const getState = async (filters: IStateFilters): Promise<IState | null> => {
    return StateModel.findOne(filters).exec();
};

/**
 * Get States.
 * @param filters - The State filters.
 * @returns {Promise<IState[]>} Promise object containing the States.
 */
const getStates = async (filters: IStateFilters): Promise<IState[]> => {
    return StateModel.find(filters).exec();
};

/**
 * Get fsObject ids of States.
 * @param filters - The State filters.
 * @returns {Promise<ObjectId[]>} Promise object containing the FsObject ids.
 */
const getStateFsObjectIds = async (filters: IStateFilters): Promise<ObjectId[]> => {
    return (await StateModel.find(filters).exec()).map((state) => state.fsObjectId);
};

/**
 * Update State. Throws if no State is found.
 * @param filters - The State filters.
 * @param update - The update object.
 * @param session - Optional mongoose session.
 * @returns {Promise<IState>} Promise object containing the updated State.
 */
const updateState = async (filters: IStateFilters, update: IUpdateState, session?: ClientSession): Promise<IState> => {
    const result = await StateModel.findOneAndUpdate(filters, { $set: update }, { new: true, session }).exec();
    if (result === null) throw new ServerError(StatusCodes.NOT_FOUND, 'State not found');
    return result;
};

/**
 * Update States. Throws if failed to update.
 * @param filters - The State filters.
 * @param update - The update object.
 * @param session - Optional mongoose session.
 * @returns {Promise<number>} Promise object containing the amount of updated States.
 */
const updateStates = async (filters: IStateFilters, update: IUpdateState, session?: ClientSession): Promise<number> => {
    const result = await StateModel.updateMany(filters, { $set: update }, { session }).exec();
    if (!result.acknowledged) throw new ServerError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update states');
    return result.modifiedCount;
};

/**
 * Delete State. Throws if no State is found.
 * @param filters - The State filters.
 * @param session - Optional mongoose session.
 * @returns {Promise<IState>} Promise object containing the deleted State.
 */
const deleteState = async (filters: IStateFilters, session?: ClientSession): Promise<IState> => {
    const result = await StateModel.findOneAndDelete(filters, { session }).exec();
    if (result === null) throw new ServerError(StatusCodes.NOT_FOUND, 'State not found');
    return result;
};

/**
 * Delete States. Throws if failed to delete.
 * @param filters - The State filters.
 * @param session - Optional mongoose session.
 * @returns {Promise<number>} Promise object containing the amount of deleted States.
 */
const deleteStates = async (filters: IStateFilters, session?: ClientSession): Promise<number> => {
    const result = await StateModel.deleteMany(filters, { session }).exec();
    if (!result.acknowledged) throw new ServerError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete states');
    return result.deletedCount;
};

export {
    createState,
    createStates,
    getState,
    getStates,
    getStateFsObjectIds,
    updateState,
    updateStates,
    deleteState,
    deleteStates,
};
