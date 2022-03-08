import * as Joi from 'joi';

// GET /api/quota?userId=1234
const getQuotaByUserIdRequestSchema = Joi.object({
    query: {
        userId: Joi.string().uuid().required(),
    },
    body: {},
    params: {},
});

export { getQuotaByUserIdRequestSchema };
export default { getQuotaByUserIdRequestSchema }; // TODO: remove when you have more than one function
