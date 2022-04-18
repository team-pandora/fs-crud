import { StatusCodes } from 'http-status-codes';
import * as mongoose from 'mongoose';
import { ClientSession } from 'mongoose';
import { defaultNewState } from '../../config/defaults';
import { ServerError } from '../error';
import { INewState, IState, IStateFilters, IUpdateState } from './interface';
import StateModel from './model';

/**
 * Create new State document.
 * @param {INewState} state - The new State object.
 * @param {ClientSession | undefined} session - Optional mongoose session.
 * @returns {Promise<IState>} - Promise object containing the created State.
 */
const createState = async (state: INewState, session?: ClientSession): Promise<IState> => {
    return (await StateModel.create([{ ...defaultNewState, ...state }], { session }))[0];
};

const getStateById = async (stateId: mongoose.Types.ObjectId): Promise<IState> => {
    const result = await StateModel.findById(stateId).exec();
    if (result === null) throw new ServerError(StatusCodes.NOT_FOUND, 'State not found.');

    return result;
};

const getStates = (filters: IStateFilters): Promise<IState[]> => {
    return StateModel.find(filters).exec();
};

const updateState = async (filters: IStateFilters, update: IUpdateState, session?: ClientSession): Promise<IState> => {
    const result = await StateModel.findOneAndUpdate(filters, { $set: update }, { new: true, session }).exec();
    if (result === null) throw new ServerError(StatusCodes.NOT_FOUND, 'State not found.');

    return result;
};

const updateStates = async (filters: IStateFilters, update: IUpdateState, session?: ClientSession): Promise<number> => {
    const result = await StateModel.updateMany(filters, { $set: update }, { new: true, session }).exec();
    if (!result.acknowledged) throw new ServerError(StatusCodes.INTERNAL_SERVER_ERROR, 'Could not delete states.');

    return result.modifiedCount;
};

const deleteState = async (filters: IStateFilters, session?: ClientSession): Promise<IState> => {
    const result = await StateModel.findOneAndDelete(filters, { session }).exec();
    if (result === null) throw new ServerError(StatusCodes.NOT_FOUND, 'State not found.');

    return result;
};

const deleteStates = async (filters: IStateFilters, session?: ClientSession): Promise<number> => {
    const result = await StateModel.deleteMany(filters, { session }).exec();
    if (!result.acknowledged) throw new ServerError(StatusCodes.INTERNAL_SERVER_ERROR, 'Could not delete states.');

    return result.deletedCount;
};

export { createState, getStateById, getStates, updateState, updateStates, deleteState, deleteStates };
