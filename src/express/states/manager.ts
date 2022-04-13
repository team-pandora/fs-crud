import { StatusCodes } from 'http-status-codes';
import { ClientSession } from 'mongoose';
import { defaultNewState } from '../../config/defaults';
import { ServerError } from '../error';
import { IGetStatesQuery, INewState, IState, IUpdateState } from './interface';
import StateModel from './model';

const getStateById = async (stateId: string): Promise<IState> => {
    const result = await StateModel.findById(stateId).exec();

    if (result === null) throw new ServerError(404, 'State not found.');

    return result;
};

const getStates = (query: IGetStatesQuery): Promise<IState[]> => {
    return StateModel.find(query).exec();
};

/**
 * Create new State document.
 * @param {INewState} state - The new State object.
 * @param {ClientSession | undefined} session - Optional mongoose session.
 * @returns {Promise<IState>} - Promise object containing the created State.
 */
const createState = async (state: INewState, session?: ClientSession): Promise<IState> => {
    return StateModel.findOneAndUpdate(
        { userId: state.userId, fsObjectId: state.fsObjectId },
        { $setOnInsert: { ...defaultNewState, ...state } },
        { upsert: true, new: true, session },
    ).exec();
};

const updateState = async (filters: any, update: IUpdateState, session?: ClientSession): Promise<IState> => {
    const result = await StateModel.findOneAndUpdate(filters, { $set: update }, { new: true, session }).exec();
    if (result === null) throw new ServerError(StatusCodes.NOT_FOUND, 'State not found.');
    return result;
};

export { getStateById, getStates, createState, updateState };
