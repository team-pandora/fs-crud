/* eslint-disable no-underscore-dangle */
import * as mongoose from 'mongoose';
import * as request from 'supertest';
import config from '../src/config';
import Server from '../src/express/server';

jest.setTimeout(30000);

const removeStateCollection = async () =>
    mongoose.connection.collections[config.mongo.stateCollectionName].deleteMany({});

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

    describe('/api/state', () => {
        describe('POST', () => {
            it('should fail validation,', () => {
                return request(app)
                    .post('/api/state')
                    .send({
                        userId: 'abc',
                        fsObjectId: 'abc',
                        favorite: 'abc',
                        trash: 'abc',
                        root: 'abc',
                        permission: 123,
                    })
                    .expect(400);
            });

            it('should fail with duplicate key error', async () => {
                await request(app)
                    .post('/api/state')
                    .send({
                        userId: '5d7e4d4e4f7c8e8d4f7c8e8d',
                        fsObjectId: '5d7e4d4e4f7c8e8d4f7c8e8d',
                        favorite: true,
                        trash: true,
                        root: true,
                        permission: 'read',
                    })
                    .expect(200);

                await request(app)
                    .post('/api/state')
                    .send({
                        userId: '5d7e4d4e4f7c8e8d4f7c8e8d',
                        fsObjectId: '5d7e4d4e4f7c8e8d4f7c8e8d',
                        favorite: true,
                        trash: true,
                        root: true,
                        permission: 'read',
                    })
                    .expect(400);
            });

            it('should pass validation, create new state', () => {
                return request(app)
                    .post('/api/state')
                    .send({
                        userId: '5d7e4d4e4f7c8e8d4f7c8e8d',
                        fsObjectId: '5d7e4d4e4f7c8e8d4f7c8e8d',
                        favorite: true,
                        trash: true,
                        root: true,
                        permission: 'owner',
                    })
                    .expect(200);
            });
        });

        describe('GET', () => {
            const state1 = {
                userId: '5d7e4d4e4f7c8e8d4f7c8e8d',
                favorite: true,
                trash: true,
                root: true,
                permission: 'read',
            };

            const state2 = {
                userId: '5d7e4d4e4f7c8e8d4f7c8e8d',
                favorite: false,
                trash: false,
                root: false,
                permission: 'owner',
            };

            it('should pass validation, get all the states', () => {
                return request(app).get('/api/state').expect(200);
            });

            it('should pass validation, get all the types of states', async () => {
                await request(app)
                    .post('/api/state')
                    .send({ ...state1, fsObjectId: '5d7e4d4e4f7c8e8d4f7c8e8a' });

                await request(app)
                    .post('/api/state')
                    .send({ ...state1, fsObjectId: '5d7e4d4e4f7c8e8d4f7c8e8b', permission: 'write' });

                await request(app)
                    .post('/api/state')
                    .send({ ...state2, fsObjectId: '5d7e4d4e4f7c8e8d4f7c8e8c' });

                const { body: getState1 } = await request(app)
                    .get(
                        '/api/state?userId=5d7e4d4e4f7c8e8d4f7c8e8d&favorite=true&trash=true&root=true&permission=read',
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
                        '/api/state?userId=5d7e4d4e4f7c8e8d4f7c8e8d&favorite=true&trash=true&root=true&permission=write',
                    )
                    .expect(200);
                expect(getPermissionWrite).toHaveLength(1);
                expect(getPermissionWrite[0].permission).toEqual('write');

                const { body: getState2 } = await request(app)
                    .get(
                        '/api/state?userId=5d7e4d4e4f7c8e8d4f7c8e8d&favorite=false&trash=false&root=false&permission=owner',
                    )
                    .expect(200);
                expect(getState2).toHaveLength(1);
                expect(getState2).toEqual([
                    {
                        ...state2,
                        _id: expect.any(String),
                        fsObjectId: '5d7e4d4e4f7c8e8d4f7c8e8c',
                        createdAt: expect.anything(),
                        updatedAt: expect.anything(),
                    },
                ]);
            });
        });
    });
});
