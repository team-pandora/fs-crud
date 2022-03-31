import { ClientSession } from 'mongoose';
import { defaultNewState } from '../../config/defaults';
import { ServerError } from '../error';
import { INewState, IState, IStateFilters, IUpdatedState } from './interface';
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

/**
 * Get filtered states.
 * @param {IStateFilters} filters - The filters object.
 * @returns {Promise<IState[]>} - Promise object containing the States.
 */
const getStates = (filters: IStateFilters): Promise<IState[]> => {
    return StateModel.find(filters).exec();
};

const updateState = async (id: string, state: IUpdatedState): Promise<IState> => {
    const result = await StateModel.findByIdAndUpdate(id, state, { new: true }).exec();
    if (result === null) throw new ServerError(404, 'State not found');
    return result;
};

export { createState, getStates, updateState };
