import { StatusCodes } from 'http-status-codes';
import * as mongoose from 'mongoose';
import { ClientSession } from 'mongoose';
import { defaultNewState } from '../../config/defaults';
import { ServerError } from '../error';
import { INewState, IState, IStateFilters, IUpdateState } from './interface';
import StateModel from './model';

/**
 * Create a State document.
 * @param state - The new State object.
 * @returns {Promise<IState>} Promise object containing the new State.
 */
const createState = async (state: INewState, session?: ClientSession): Promise<IState> => {
    return (await StateModel.create([{ ...defaultNewState, ...state }], { session }))[0];
};

const createStates = async (states: INewState[], session?: ClientSession): Promise<IState[]> => {
    const formattedStates = states.map((state) => ({ ...defaultNewState, ...state }));
    return StateModel.create(formattedStates, { session });
};

/**
 * Get State document.
 * @param filters - The State filters.
 * @returns {Promise<IState>} Promise object containing the State.
 */
const getState = async (filters: IStateFilters): Promise<IState | null> => {
    return StateModel.findOne(filters).exec();
};

const getStateFsObjectIds = async (filters: IStateFilters): Promise<mongoose.Types.ObjectId[]> => {
    return (await StateModel.find(filters).exec()).map((state) => state.fsObjectId);
};

/**
 * Update State document.
 * @param filters - The State filters.
 * @param update - The update object.
 * @returns {Promise<IState>} Promise object containing the updated State.
 */
const updateState = async (filters: IStateFilters, update: IUpdateState, session?: ClientSession): Promise<IState> => {
    const result = await StateModel.findOneAndUpdate(filters, { $set: update }, { new: true, session }).exec();
    if (result === null) throw new ServerError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update state');

    return result;
};

/**
 * Update State documents.
 * @param filters - The State filters.
 * @param update - The update object.
 * @returns {Promise<IState>} Promise object containing the amount of updated States.
 */
const updateStates = async (filters: IStateFilters, update: IUpdateState, session?: ClientSession): Promise<number> => {
    const result = await StateModel.updateMany(filters, { $set: update }, { new: true, session }).exec();
    if (!result.acknowledged) throw new ServerError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update states');

    return result.modifiedCount;
};

/**
 * Delete State document.
 * @param filters - The State filters.
 * @returns {Promise<IState>} Promise object containing the State.
 */
const deleteState = async (filters: IStateFilters, session?: ClientSession): Promise<IState> => {
    const result = await StateModel.findOneAndDelete(filters, { session }).exec();
    if (result === null) throw new ServerError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete state');

    return result;
};

/**
 * Delete State documents.
 * @param filters - The State filters.
 * @returns {Promise<IState>} Promise object containing the amount of deleted States.
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
    getStateFsObjectIds,
    updateState,
    updateStates,
    deleteState,
    deleteStates,
};
