'use strict';

/**
 * report router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::report.report', {
    routes: [
        {
            method: 'POST',
            path: '/reports/users/:id',
            handler: 'report.reportUser',
            config: {
                policies: [],
                middlewares: [],
            },
        },
    ],
});
