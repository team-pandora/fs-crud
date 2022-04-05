import { ClientSession } from 'mongoose';
import { defaultNewState } from '../../config/defaults';
import { ServerError } from '../error';
import { IGetStatesQuery, INewState, IState, IUpdatedState } from './interface';
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
    return (await StateModel.create([{ ...defaultNewState, ...state }], { session }))[0];
};

const updateState = async (id: string, state: IUpdatedState, session?: ClientSession): Promise<IState> => {
    const result = await StateModel.findByIdAndUpdate(id, state, { session, new: true }).exec();
    if (result === null) throw new ServerError(404, 'State not found');
    return result;
};

export { getStateById, getStates, createState, updateState };
