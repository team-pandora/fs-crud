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

/**
 * Get a State document.
 * @param stateId - The id of the State.
 * @returns {Promise<IState>} Promise object containing the State.
 */
const getStateById = async (stateId: mongoose.Types.ObjectId): Promise<IState> => {
    const result = await StateModel.findById(stateId).exec();
    if (result === null) throw new ServerError(StatusCodes.NOT_FOUND, 'State not found.');

    return result;
};

/**
 * Get State document.
 * @param filters - The State filters.
 * @returns {Promise<IState>} Promise object containing the State.
 */
const getState = async (filters: IStateFilters): Promise<IState> => {
    const result = await StateModel.findOne(filters).exec();
    if (result === null) throw new ServerError(StatusCodes.NOT_FOUND, 'State not found.');

    return result;
};

/**
 * Update State document.
 * @param filters - The State filters.
 * @param update - The update object.
 * @returns {Promise<IState>} Promise object containing the updated State.
 */
const updateState = async (filters: IStateFilters, update: IUpdateState, session?: ClientSession): Promise<IState> => {
    const result = await StateModel.findOneAndUpdate(filters, { $set: update }, { new: true, session }).exec();
    if (result === null) throw new ServerError(StatusCodes.NOT_FOUND, 'State not found.');

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
    if (!result.acknowledged) throw new ServerError(StatusCodes.INTERNAL_SERVER_ERROR, 'Could not delete states.');

    return result.modifiedCount;
};

/**
 * Delete State document.
 * @param filters - The State filters.
 * @returns {Promise<IState>} Promise object containing the State.
 */
const deleteState = async (filters: IStateFilters, session?: ClientSession): Promise<IState> => {
    const result = await StateModel.findOneAndDelete(filters, { session }).exec();
    if (result === null) throw new ServerError(StatusCodes.NOT_FOUND, 'State not found.');

    return result;
};

/**
 * Delete State documents.
 * @param filters - The State filters.
 * @returns {Promise<IState>} Promise object containing the amount of deleted States.
 */
const deleteStates = async (filters: IStateFilters, session?: ClientSession): Promise<number> => {
    const result = await StateModel.deleteMany(filters, { session }).exec();
    if (!result.acknowledged) throw new ServerError(StatusCodes.INTERNAL_SERVER_ERROR, 'Could not delete states.');

    return result.deletedCount;
};

export { createState, getStateById, getState, updateState, updateStates, deleteState, deleteStates };
