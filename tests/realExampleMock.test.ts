/* eslint-disable no-underscore-dangle */
import * as mongoose from 'mongoose';
import * as request from 'supertest';
import config from '../src/config';
import Server from '../src/express/server';
import { GB } from '../src/utils/fs';

jest.setTimeout(30000);

const removeAllCollections = async () =>
    Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})));

describe('example unit tests', () => {
    let app: Express.Application;

    beforeAll(async () => {
        await mongoose.connect(config.mongo.uri);
        await removeAllCollections();
        app = Server.createExpressApp();
    });

    afterEach(async () => {
        await removeAllCollections();
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    describe('/isAlive', () => {
        it('should return alive', async () => {
            const response = await request(app).get('/isAlive').expect(200);
            expect(response.text).toBe('alive');
        });
    });

    describe('/unknownRoute', () => {
        it('should return status code 404', () => {
            return request(app).get('/unknownRoute').expect(404);
        });
    });

    describe('/api/quota', () => {
        describe('POST', () => {
            it('should fail validation, userId not match mongo objectId', () => {
                return request(app).post('/api/quota').send({ userId: 'abc' }).expect(400);
            });

            it('should fail validation, limit field is greater than max limit', () => {
                return request(app)
                    .post('/api/quota')
                    .send({
                        userId: '5d7e4d4e4f7c8e8d4f7c8e8d',
                        limit: config.quota.maxLimitAllowed * GB + 1,
                    })
                    .expect(400);
            });

            it('should fail validation, the used field should be zero', () => {
                return request(app)
                    .post('/api/quota')
                    .send({
                        userId: '5d7e4d4e4f7c8e8d4f7c8e8d',
                        used: 1,
                    })
                    .expect(400);
            });

            it('should pass validation, create the limit and used field automatic', async () => {
                const { body: createdQuota } = await request(app)
                    .post('/api/quota')
                    .send({ userId: '5d7e4d4e4f7c8e8d4f7c8e8d' })
                    .expect(200);

                expect(mongoose.Types.ObjectId.isValid(createdQuota._id)).toBe(true);
                expect(createdQuota.userId).toBe('5d7e4d4e4f7c8e8d4f7c8e8d');
                expect(createdQuota.limit).toBe(config.quota.defaultLimit * GB);
                expect(createdQuota.used).toBe(0);
            });
        });

        describe('GET', () => {
            it('should fail validation, userId not match mongo objectId', () => {
                return request(app).get('/api/quota/abc').expect(400);
            });

            it('should return the quota', async () => {
                await request(app).post('/api/quota').send({ userId: '5d7e4d4e4f7c8e8d4f7c8e8d' }).expect(200);

                const { body: getQuotaByUserId } = await request(app)
                    .get('/api/quota/5d7e4d4e4f7c8e8d4f7c8e8d')
                    .expect(200);
                expect(mongoose.Types.ObjectId.isValid(getQuotaByUserId.userId)).toBe(true);
                expect(getQuotaByUserId.limit).toBe(config.quota.defaultLimit * GB);
                expect(getQuotaByUserId.used).toBe(0);
            });

            it('should create new qouta in case that the user is missing a quota', async () => {
                const { body: getQuotaByUserId } = await request(app)
                    .get('/api/quota/5d7e4d4e4f7c8e8d4f7c8e8d')
                    .expect(200);
                expect(mongoose.Types.ObjectId.isValid(getQuotaByUserId.userId)).toBe(true);
                expect(getQuotaByUserId.limit).toBe(config.quota.defaultLimit * GB);
                expect(getQuotaByUserId.used).toBe(0);
            });
        });

        describe('PATCH', () => {
            it('should fail validation, userId not match mongo objectId', () => {
                return request(app).patch('/api/quota/!34ffdg/limit').expect(400);
            });
        });

        it('should fail validation, limit field is greater than the max', () => {
            return request(app)
                .patch('/api/quota/5d7e4d4e4f7c8e8d4f7c8e8d/limit')
                .send({ limit: config.quota.maxLimitAllowed * GB + 1 })
                .expect(400);
        });

        it('should pass validation, update the quota limit', async () => {
            await request(app).post('/api/quota').send({ userId: '5d7e4d4e4f7c8e8d4f7c8e8d' }).expect(200);

            const { body: updatedQuota } = await request(app)
                .patch('/api/quota/5d7e4d4e4f7c8e8d4f7c8e8d/limit')
                .send({ limit: config.quota.defaultLimit * GB + 1 })
                .expect(200);
            expect(updatedQuota.userId).toBe('5d7e4d4e4f7c8e8d4f7c8e8d');
            expect(updatedQuota.limit).toBe(config.quota.defaultLimit * GB + 1);
        });

        it('should pass validation , raiseUp the used field', async () => {
            await request(app).post('/api/quota').send({ userId: '5d7e4d4e4f7c8e8d4f7c8e8d' }).expect(200);

            const { body: quotaBeforeUpdate } = await request(app)
                .get('/api/quota/5d7e4d4e4f7c8e8d4f7c8e8d')
                .expect(200);

            const { body: updatedQuota } = await request(app)
                .patch('/api/quota/5d7e4d4e4f7c8e8d4f7c8e8d/used')
                .send({ raiseBy: 12 })
                .expect(200);
            expect(updatedQuota.userId).toBe('5d7e4d4e4f7c8e8d4f7c8e8d');
            expect(updatedQuota.used).toBe(quotaBeforeUpdate.used + 12);
        });

        it('should pass validation, create new quota if the userId not found', async () => {
            const { body: updatedQuota } = await request(app)
                .patch('/api/quota/5d7e4d4e4f7c8e8d4f7c8e8d/limit')
                .send({ limit: config.quota.defaultLimit * GB + 5 * GB })
                .expect(200);
            expect(updatedQuota.userId).toBe('5d7e4d4e4f7c8e8d4f7c8e8d');
            expect(updatedQuota.limit).toBe(config.quota.defaultLimit * GB + 5 * GB);
        });

        it('should create a new quota and then create another quota with the same id and fail it because its duplicte', async () => {
            await request(app).post('/api/quota').send({ userId: '5d7e4d4e4f7c8e8d4f7c8e8d' }).expect(200);
            await request(app).post('/api/quota').send({ userId: '5d7e4d4e4f7c8e8d4f7c8e8d' }).expect(400);
        });
    });
});
