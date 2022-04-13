import * as mongoose from 'mongoose';
import * as request from 'supertest';
import config from '../src/config';
import Server from '../src/express/server';

jest.setTimeout(30000);

const removeStateCollection = async () =>
    mongoose.connection.collections[config.mongo.statesCollectionName].deleteMany({});

describe('state tests', () => {
    let app: Express.Application;

    beforeAll(async () => {
        await mongoose.connect(config.mongo.uri);
        await removeStateCollection();
        app = Server.createExpressApp();
    });

    afterEach(async () => {
        await removeStateCollection();
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    describe('/api/states', () => {
        const state1 = {
            userId: '5d7e4d4e4f7c8e8d4f7c8e8d',
            fsObjectId: '5d7e4d4e4f7c8e8d4f7c8e84',
            favorite: true,
            trash: true,
            permission: 'read',
        };

        const state2 = {
            userId: '5d7e4d4e4f7c8e8d4f7c8e8c',
            fsObjectId: '5d7e4d4e4f7c8e8d4f7c8e84',
            favorite: false,
            trash: false,
            permission: 'owner',
        };

        describe('POST', () => {
            it('should create a state,', () => {
                return request(app)
                    .post('/api/states')
                    .send({ ...state1 })
                    .expect(200);
            });

            it('should fail creating a state,', () => {
                return request(app)
                    .post('/api/states')
                    .send({
                        ...state1,
                        permission: 123,
                    })
                    .expect(400);
            });

            it('should fail with duplicate key error', async () => {
                await request(app)
                    .post('/api/states')
                    .send({ ...state2 })
                    .expect(200);

                await request(app)
                    .post('/api/states')
                    .send({ ...state2 })
                    .expect(200);

                const { body: result } = await request(app).get('/api/states');
                expect(result).toHaveLength(1);
            });
        });

        describe('GET', () => {
            it('should get a state', async () => {
                const { body: stateFile } = await request(app)
                    .post('/api/states')
                    .send({ ...state1 })
                    .expect(200);

                await request(app).get(`/api/states/${stateFile._id}`).expect(200);
            });

            it('should fail to get a state', async () => {
                await request(app)
                    .post('/api/states')
                    .send({ ...state1 })
                    .expect(200);

                await request(app).get('/api/states/5d7e4d4e4f7c8e8d4f7c8e8d').expect(404);
            });

            it('should get filtered states', async () => {
                await request(app)
                    .post('/api/states')
                    .send({ ...state1, fsObjectId: '5d7e4d4e4f7c8e8d4f7c8e8a' });

                await request(app)
                    .post('/api/states')
                    .send({ ...state1, fsObjectId: '5d7e4d4e4f7c8e8d4f7c8e8b', permission: 'write' });

                await request(app)
                    .post('/api/states')
                    .send({ ...state2, fsObjectId: '5d7e4d4e4f7c8e8d4f7c8e87' });

                const { body: getState1 } = await request(app)
                    .get(
                        '/api/states?userId=5d7e4d4e4f7c8e8d4f7c8e8d&fsObjectId=5d7e4d4e4f7c8e8d4f7c8e8a&favorite=true&trash=true&permission=read',
                    )
                    .expect(200);

                expect(getState1).toHaveLength(1);
                expect(getState1).toEqual([
                    {
                        ...state1,
                        _id: expect.any(String),
                        fsObjectId: '5d7e4d4e4f7c8e8d4f7c8e8a',
                        createdAt: expect.anything(),
                        updatedAt: expect.anything(),
                    },
                ]);

                const { body: getPermissionWrite } = await request(app)
                    .get(
                        '/api/states?userId=5d7e4d4e4f7c8e8d4f7c8e8d&fsObjectId=5d7e4d4e4f7c8e8d4f7c8e8b&favorite=true&trash=true&permission=write',
                    )
                    .expect(200);
                expect(getPermissionWrite).toHaveLength(1);
                expect(getPermissionWrite[0].permission).toEqual('write');

                const { body: getState2 } = await request(app)
                    .get(
                        '/api/states?userId=5d7e4d4e4f7c8e8d4f7c8e8c&fsObjectId=5d7e4d4e4f7c8e8d4f7c8e87&favorite=false&trash=false&permission=owner',
                    )
                    .expect(200);

                expect(getState2).toHaveLength(1);
                expect(getState2).toEqual([
                    {
                        ...state2,
                        _id: expect.any(String),
                        fsObjectId: '5d7e4d4e4f7c8e8d4f7c8e87',
                        createdAt: expect.anything(),
                        updatedAt: expect.anything(),
                    },
                ]);
            });

            it('should get all states', async () => {
                await request(app)
                    .post('/api/states')
                    .send({ ...state1 })
                    .expect(200);

                await request(app)
                    .post('/api/states')
                    .send({ ...state2 })
                    .expect(200);

                const { body: result } = await request(app).get('/api/states').expect(200);

                expect(result).toHaveLength(2);
                expect(result).toEqual([
                    {
                        ...state1,
                        _id: expect.any(String),
                        createdAt: expect.anything(),
                        updatedAt: expect.anything(),
                    },
                    {
                        ...state2,
                        _id: expect.any(String),
                        createdAt: expect.anything(),
                        updatedAt: expect.anything(),
                    },
                ]);
            });

            it('should get an empty array, when there are no states', () => {
                return request(app).get('/api/states').expect(200);
            });

            it('should get an empty array, when state/s were not found', async () => {
                await request(app)
                    .post('/api/states')
                    .send({ ...state2 })
                    .expect(200);

                const { body: result } = await request(app).get(`/api/states?userId=5d7e4d4e4f7c8e8d4f7c8e8d`);
                expect(result).toHaveLength(0);
            });
        });

        describe('PATCH', () => {
            it('should update a state', async () => {
                await request(app)
                    .post('/api/states')
                    .send({ ...state1 })
                    .expect(200);

                const { body: result } = await request(app).get('/api/states').expect(200);
                expect(result).toHaveLength(1);
                const stateId = result[0]._id;
                await request(app).patch(`/api/states/${stateId}`).send({ favorite: false }).expect(200);

                const { body: result2 } = await request(app).get(`/api/states/${stateId}`).expect(200);
                expect(result2.favorite).toEqual(false);
            });

            it('should fail updating a state', async () => {
                await request(app)
                    .post('/api/states')
                    .send({ ...state1 })
                    .expect(200);

                const { body: result } = await request(app).get('/api/states').expect(200);
                expect(result).toHaveLength(1);
                const stateId = result[0]._id;

                await request(app).patch(`/api/states/${stateId}`).send({ favorite: 12414 }).expect(400);
            });
        });
    });
});
