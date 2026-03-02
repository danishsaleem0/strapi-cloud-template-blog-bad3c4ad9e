'use strict';

/**
 * skill router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::skill.skill', {
    config: {
        update: {
            middlewares: [],
        },
    },
    routes: [
        {
            method: 'POST',
            path: '/skills/:id/moderate',
            handler: 'skill.moderate',
            config: {
                policies: [],
            },
        },
    ],
});
