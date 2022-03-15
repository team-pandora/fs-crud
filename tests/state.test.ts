/* eslint-disable no-underscore-dangle */
import * as mongoose from 'mongoose';
import * as request from 'supertest';
import config from '../src/config';
import Server from '../src/express/server';

jest.setTimeout(30000);

const removeAllCollections = async () =>
    Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})));

describe('state tests', () => {
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

    describe('/api/state', () => {
        describe('POST', () => {
            it('should fail validation, the fields gets values they are not supposed to accept', () => {
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
                permission: 'read' || 'write',
            };

            const state2 = {
                userId: '5d7e4d4e4f7c8e8d4f7c8e8d',
                favorite: false,
                trash: false,
                root: false,
                permission: 'owner',
            };

            it('should pass validation, get all the stats', () => {
                return request(app).get('/api/state').expect(200);
            });
            it('should pass validation, get all the types of stats', async () => {
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
                        _id: expect.any(String),
                        userId: '5d7e4d4e4f7c8e8d4f7c8e8d',
                        fsObjectId: '5d7e4d4e4f7c8e8d4f7c8e8a',
                        favorite: true,
                        trash: true,
                        root: true,
                        permission: 'read',
                        createdAt: expect.any(String),
                        updatedAt: expect.any(String),
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
                        _id: expect.any(String),
                        userId: '5d7e4d4e4f7c8e8d4f7c8e8d',
                        fsObjectId: '5d7e4d4e4f7c8e8d4f7c8e8c',
                        favorite: false,
                        trash: false,
                        root: false,
                        permission: 'owner',
                        createdAt: expect.any(String),
                        updatedAt: expect.any(String),
                    },
                ]);
            });
        });
    });
});
