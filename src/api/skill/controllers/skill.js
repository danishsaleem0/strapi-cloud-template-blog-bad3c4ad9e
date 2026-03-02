'use strict';

/**
 * skill controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::skill.skill', ({ strapi }) => ({
    async moderate(ctx) {
        const { id } = ctx.params;
        const { status } = ctx.request.body;

        if (!['approved', 'rejected'].includes(status)) {
            return ctx.badRequest('Invalid status. Use "approved" or "rejected".');
        }

        const entry = await strapi.documents('api::skill.skill').update({
            documentId: id,
            data: { approval_status: status },
        });

        return entry;
    },
}));
