import { defaultNewState } from '../../config/defaults';
import { INewState, IState, IStateFilters } from './interface';
import StateModel from './model';

/**
 * Create new State document.
 * @param {INewState} state - The new State object.
 * @returns {Promise<IState>} - Promise object containing the created State.
 */
const createState = (state: INewState): Promise<IState> => {
    return StateModel.create({ ...defaultNewState, ...state });
};

/**
 * Get filtered states.
 * @param {IStateFilters} filters - The filters object.
 * @returns {Promise<IState[]>} - Promise object containing the States.
 */
const getStates = (filters: IStateFilters): Promise<IState[]> => {
    return StateModel.find(filters).exec();
};

export { createState, getStates };
