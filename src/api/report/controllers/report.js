'use strict';

/**
 * report controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::report.report', ({ strapi }) => ({
    async create(ctx) {
        const response = await super.create(ctx);

        // Notify Admin about new report
        try {
            await strapi.plugins['email'].services.email.send({
                to: 'danishsaleem909@gmail.com', // Admin email
                subject: 'New Abuse Report Received',
                html: `<h2>New Abuse Report</h2>
               <p><strong>Reason:</strong> ${ctx.request.body.data.reason}</p>
               <p><strong>Reported Item ID:</strong> ${ctx.request.body.data.reported_item_id}</p>
               <p><strong>Type:</strong> ${ctx.request.body.data.reported_item_type}</p>`,
            });
        } catch (err) {
            strapi.log.error('Failed to send admin report notification:', err);
        }

        return response;
    },
}));
