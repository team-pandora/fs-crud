// filter fields that the user used to update in obj2 and delete the from obj1
export const substractObjectFields = (obj1: any, obj2: any) => {
    console.log('obj1', obj1);
    return Object.fromEntries(Object.entries(obj1).filter(([key]) => !(key in obj2)));
};

export default { substractObjectFields };
