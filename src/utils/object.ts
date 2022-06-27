import { ObjectId } from './mongoose';

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
export const removeUndefinedFields = <Type>(obj: Type): Partial<Type> => {
    const newObject: Partial<Type> = {};
    const objectEntries = Object.entries(obj);
    for (let index = 0; index < objectEntries.length; index += 1) {
        const [key, value] = objectEntries[index];
        if (value !== undefined) {
            newObject[key] = value;
        }
    }
    return newObject;
};

export const objectIdBfs = (array: any[], startValue: ObjectId, fromField: string, toField: string): ObjectId[] => {
    const queue = [startValue];
    const visited: Set<ObjectId> = new Set();

    while (queue.length) {
        const current = queue.shift()!;
        visited.add(current);
        for (let i = 0; i < array.length; i++) {
            if (array[i][toField].equals(current) && !visited.has(array[i][fromField])) {
                queue.push(array[i][fromField]);
            }
        }
    }

    visited.delete(startValue);

    return Array.from(visited);
};

export const docBfs = <Type>(array: Type[], startValue: ObjectId, fromField: string, toField: string): Type[] => {
    const queue: Type[] = [];
    const visited: Set<Type> = new Set();

    for (let i = 0; i < array.length; i++) {
        if (array[i][toField].equals(startValue) && !visited.has(array[i][fromField])) {
            queue.push(array[i]);
        }
    }

    while (queue.length) {
        const current = queue.shift()!;
        visited.add(current);
        for (let i = 0; i < array.length; i++) {
            if (array[i][toField].equals(current[fromField]) && !visited.has(array[i][fromField])) {
                queue.push(array[i]);
            }
        }
    }

    return Array.from(visited);
};

const objectIdsArrayIncludes = (array: ObjectId[], value: ObjectId): boolean => {
    for (let i = 0; i < array.length; i++) {
        if (array[i].equals(value)) {
            return true;
        }
    }
    return false;
};

export const subtractObjectIdArrays = (array1: ObjectId[], array2: ObjectId[]): ObjectId[] => {
    const newArray: ObjectId[] = [];
    for (let i = 0; i < array1.length; i++) {
        if (!objectIdsArrayIncludes(array2, array1[i])) {
            newArray.push(array1[i]);
        }
    }
    return newArray;
};
