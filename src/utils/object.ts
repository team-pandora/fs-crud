/**
 * Get a new object containing the fields that exist in the first object but not in the second.
 * @param {Object} obj1 - The first object.
 * @param {Object} obj2 - The second object.
 * @returns {Object} The difference between the two objects.
 */
export const subtractObjectFields = (obj1: object, obj2: object): object => {
    return Object.fromEntries(Object.entries(obj1).filter(([key]) => !(key in obj2)));
};

/**
 * Remove undefined fields from object.
 * @param {Object} obj - The object.
 * @returns {Object} The object without undefined fields.
 */
export const removeUndefinedFields = (obj: object): object => {
    const newObject = {};
    const objectEntries = Object.entries(obj);
    for (let index = 0; index < objectEntries.length; index += 1) {
        const [key, value] = objectEntries[index];
        if (value !== undefined) {
            newObject[key] = value;
        }
    }
    return newObject;
};

export const bfs = <fieldType>(
    array: any[],
    startValue: fieldType,
    fromField: string,
    toField: string,
): fieldType[] => {
    const queue = [startValue];
    const visited: Set<fieldType> = new Set();

    while (queue.length) {
        const current = queue.shift()!;
        visited.add(current);
        for (let i = 0; i < array.length; i++) {
            if (array[i][toField] === current && !visited.has(array[i][fromField])) {
                queue.push(array[i][fromField]);
            }
        }
    }

    visited.delete(startValue);

    return Array.from(visited);
};
