'use strict';

module.exports = {
    '0 * * * *': async ({ strapi }) => {
        // Find bookings happening in the next 24 hours that haven't received a reminder
        const tomorrow = new Date();
        tomorrow.setHours(tomorrow.getHours() + 24);

        const bookings = await strapi.entityService.findMany('api::booking.booking', {
            filters: {
                scheduled_date: {
                    $lte: tomorrow.toISOString(),
                    $gte: new Date().toISOString(),
                },
                reminder_sent: false,
                booking_status: {
                    $ne: 'cancelled',
                },
            },
            populate: ['requester', 'provider', 'requested_skill', 'offered_skill'],
        });

        for (const booking of bookings) {
            if (booking.requester?.email && booking.provider?.email) {
                try {
                    await strapi.plugins['email'].services.email.send({
                        to: [booking.requester.email, booking.provider.email],
                        subject: 'Reminder: Upcoming Skill Swap Booking',
                        text: `This is a reminder for your upcoming booking for the skill: ${booking.requested_skill?.title || booking.offered_skill?.title} scheduled at ${booking.scheduled_date}.`,
                        html: `<h1>Booking Reminder</h1>
                   <p>Don't forget your scheduled skill swap!</p>
                   <p><strong>Date:</strong> ${booking.scheduled_date}</p>`,
                    });

                    // Mark as sent
                    await strapi.entityService.update('api::booking.booking', booking.id, {
                        data: { reminder_sent: true },
                    });
                } catch (err) {
                    strapi.log.error(`Failed to send reminder for booking ${booking.id}:`, err);
                }
            }
        }
    },
};
