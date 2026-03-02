'use strict';

module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/users/me',
            handler: 'user.me',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'PUT',
            path: '/users/me',
            handler: 'user.updateMe',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/users/me/skills',
            handler: 'user.mySkills',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/users/me/skills',
            handler: 'user.createMySkill',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/users/me/skills/:id',
            handler: 'user.getMySkill',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'PUT',
            path: '/users/me/skills/:id',
            handler: 'user.updateMySkill',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'DELETE',
            path: '/users/me/skills/:id',
            handler: 'user.deleteMySkill',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
};
