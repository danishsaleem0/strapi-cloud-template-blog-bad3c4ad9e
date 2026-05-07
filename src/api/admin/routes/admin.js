'use strict';

module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/admin/users',
            handler: 'admin.users',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/admin/users/:id',
            handler: 'admin.getUser',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'PUT',
            path: '/admin/users/:id',
            handler: 'admin.updateUser',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'DELETE',
            path: '/admin/users/:id',
            handler: 'admin.deleteUser',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'PUT',
            path: '/admin/users/:id/activate',
            handler: 'admin.activateUser',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'PUT',
            path: '/admin/users/:id/deactivate',
            handler: 'admin.deactivateUser',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/admin/abusers',
            handler: 'admin.abusers',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
};
