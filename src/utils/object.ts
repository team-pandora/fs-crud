/**
 * Get a new object containing the fields that exist in the first object but not in the second.
 * @param {Object} obj1 - The first object.
 * @param {Object} obj2 - The second object.
 * @returns {Object} - The difference between the two objects.
 */
export const substractObjectFields = (obj1: object, obj2: object): object => {
    return Object.fromEntries(Object.entries(obj1).filter(([key]) => !(key in obj2)));
};

export default { substractObjectFields };
