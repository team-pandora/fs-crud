import * as mongoose from 'mongoose';
import * as request from 'supertest';
import config from '../src/config';
import Server from '../src/express/server';

const { defaultLimitInBytes, maxLimitAllowedInBytes } = config.quota;

jest.setTimeout(30000);

const removeQuotaCollection = async () =>
    mongoose.connection.collections[config.mongo.quotasCollectionName].deleteMany({});

describe('quota tests', () => {
    let app: Express.Application;

    beforeAll(async () => {
        await mongoose.connect(config.mongo.uri);
        await removeQuotaCollection();
        app = Server.createExpressApp();
    });

    afterEach(async () => {
        await removeQuotaCollection();
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    describe('/api/quotas', () => {
        describe('POST', () => {
            it('should create a quota', () => {
                return request(app).post('/api/quotas').send({ userId: '123456' }).expect(200);
            });

            it('should fail, userId is not valid', () => {
                return request(app).post('/api/quotas').send({ userId: '123456~' }).expect(400);
            });

            it('should fail, limit field is greater than max limit', () => {
                return request(app)
                    .post('/api/quotas')
                    .send({
                        userId: '5d7e4d4e4f7c8e8d4f7c8e8d',
                        limit: maxLimitAllowedInBytes + 1,
                    })
                    .expect(400);
            });

            it('should create quota, and create limit and used fields automatically', async () => {
                const { body: createdQuota } = await request(app)
                    .post('/api/quotas')
                    .send({ userId: '5d7e4d4e4f7c8e8d4f7c8e8d' })
                    .expect(200);

                expect(mongoose.Types.ObjectId.isValid(createdQuota._id)).toBe(true);
                expect(createdQuota.userId).toBe('5d7e4d4e4f7c8e8d4f7c8e8d');
                expect(createdQuota.limit).toBe(defaultLimitInBytes);
                expect(createdQuota.used).toBe(0);
            });

            it('should fail with duplicate key error', async () => {
                await request(app).post('/api/quotas').send({ userId: '5d7e4d4e4f7c8e8d4f7c8e8d' }).expect(200);
                await request(app).post('/api/quotas').send({ userId: '5d7e4d4e4f7c8e8d4f7c8e8d' }).expect(400);
            });
        });

        describe('GET', () => {
            it('should fail, userId is not valid ', () => {
                return request(app).get('/api/quotas/abc~').expect(400);
            });

            it('should return the quota', async () => {
                await request(app).post('/api/quotas').send({ userId: '5d7e4d4e4f7c8e8d4f7c8e8d' }).expect(200);
                const { body: getQuotaByUserId } = await request(app)
                    .get('/api/quotas/5d7e4d4e4f7c8e8d4f7c8e8d')
                    .expect(200);

                expect(mongoose.Types.ObjectId.isValid(getQuotaByUserId.userId)).toBe(true);
                expect(getQuotaByUserId.limit).toBe(defaultLimitInBytes);
                expect(getQuotaByUserId.used).toBe(0);
            });

            it('should create a new quota', async () => {
                const { body: getQuotaByUserId } = await request(app)
                    .get('/api/quotas/5d7e4d4e4f7c8e8d4f7c8e8d')
                    .expect(200);

                expect(mongoose.Types.ObjectId.isValid(getQuotaByUserId.userId)).toBe(true);
                expect(getQuotaByUserId.limit).toBe(defaultLimitInBytes);
                expect(getQuotaByUserId.used).toBe(0);
            });
        });

        describe('PATCH', () => {
            it('should fail, userId is not valid', () => {
                return request(app).patch('/api/quotas/!34ffdg/limit').expect(400);
            });

            it('should fail, limit field is greater than the max', () => {
                return request(app)
                    .patch('/api/quotas/5d7e4d4e4f7c8e8d4f7c8e8d/limit')
                    .send({ limit: maxLimitAllowedInBytes + 1 })
                    .expect(400);
            });

            it('should update the quota limit field', async () => {
                await request(app).post('/api/quotas').send({ userId: '5d7e4d4e4f7c8e8d4f7c8e8d' }).expect(200);
                const { body: updatedQuota } = await request(app)
                    .patch('/api/quotas/5d7e4d4e4f7c8e8d4f7c8e8d/limit')
                    .send({ limit: defaultLimitInBytes + 1 })
                    .expect(200);

                expect(updatedQuota.userId).toBe('5d7e4d4e4f7c8e8d4f7c8e8d');
                expect(updatedQuota.limit).toBe(defaultLimitInBytes + 1);
            });

            it('should update the quota used field', async () => {
                await request(app).post('/api/quotas').send({ userId: '5d7e4d4e4f7c8e8d4f7c8e8d' }).expect(200);
                const { body: quotaBeforeUpdate } = await request(app)
                    .get('/api/quotas/5d7e4d4e4f7c8e8d4f7c8e8d')
                    .expect(200);
                const { body: updatedQuota } = await request(app)
                    .patch('/api/quotas/5d7e4d4e4f7c8e8d4f7c8e8d/used')
                    .send({ difference: 12 })
                    .expect(200);

                expect(updatedQuota.userId).toBe('5d7e4d4e4f7c8e8d4f7c8e8d');
                expect(updatedQuota.used).toBe(quotaBeforeUpdate.used + 12);
            });

            it('should create a new quota', async () => {
                const { body: updatedQuota } = await request(app)
                    .patch('/api/quotas/5d7e4d4e4f7c8e8d4f7c8e8d/limit')
                    .send({ limit: defaultLimitInBytes + 5 })
                    .expect(200);

                expect(updatedQuota.userId).toBe('5d7e4d4e4f7c8e8d4f7c8e8d');
                expect(updatedQuota.limit).toBe(defaultLimitInBytes + 5);
            });
        });
    });
});
