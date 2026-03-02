'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::booking.booking', ({ strapi }) => ({


    async create(params) {
        const result = await super.create(params);

        await this.sendBookingEmail(result.id, 'pending');

        return result;
    },

    async update(id, params) {

        // Get existing booking using numeric id
        const oldBooking = await strapi.documents('api::booking.booking').findOne({
            documentId: id,
        });

        // Perform update
        const result = await super.update(id, params);

        const newStatus = params?.data?.booking_status;

        // Send email only if booking_status changed
        if (newStatus && newStatus !== oldBooking?.booking_status) {
            await this.sendBookingEmail(result?.id, newStatus);
        }

        return result

    },

    /*
    |--------------------------------------------------------------------------
    | SEND EMAIL
    |--------------------------------------------------------------------------
    */

    async sendBookingEmail(bookingId, status) {

        const booking = await strapi.entityService.findOne(
            'api::booking.booking',
            bookingId,
            {
                populate: ['requester', 'provider', 'requested_skill', 'offered_skill'],
            }
        );

        if (!booking?.requester?.email || !booking?.provider?.email) return;

        const statusMap = {
            pending: {
                subject: 'Booking Request Submitted',
                color: '#f4b400',
                message: 'Your booking request has been submitted and is awaiting approval.',
            },
            accept: {
                subject: 'Booking Accepted 🎉',
                color: '#34a853',
                message: 'Great news! Your booking request has been accepted.',
            },
            reject: {
                subject: 'Booking Rejected',
                color: '#ea4335',
                message: 'Unfortunately, your booking request has been rejected.',
            },
            complete: {
                subject: 'Booking Completed ✅',
                color: '#4285f4',
                message: 'This booking has been successfully completed.',
            },
            cancel: {
                subject: 'Booking Cancelled',
                color: '#999999',
                message: 'This booking has been cancelled.',
            },
        };

        const config = statusMap[status];
        if (!config) return;

        try {

            await strapi.plugins['email'].services.email.send({
                to: [
                    "danishsaleem909@gmail.com",
                    "danishsaleem909@icloud.com",
                ],
                subject: config.subject,
                html: `
          <div style="font-family: Arial, sans-serif; background:#f5f7fa; padding:30px;">
            <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.08);">

              <div style="background:${config.color}; padding:20px; text-align:center; color:white;">
                <h2 style="margin:0;">Booking Status Update</h2>
              </div>

              <div style="padding:25px; color:#333;">

                <p style="font-size:16px;">
                  ${config.message}
                </p>

                <table style="width:100%; margin-top:20px;">
                  <tr>
                    <td><strong>Requester:</strong></td>
                    <td>${booking.requester.username}</td>
                  </tr>
                  <tr>
                    <td><strong>Provider:</strong></td>
                    <td>${booking.provider.username}</td>
                  </tr>
                  <tr>
                    <td><strong>Skill:</strong></td>
                    <td>${booking.requested_skill?.title || booking.offered_skill?.title || '-'}</td>
                  </tr>
                  <tr>
                    <td><strong>Scheduled Date:</strong></td>
                    <td>${booking.scheduled_date || '-'}</td>
                  </tr>
                  ${status === 'complete' && booking.completed_at ? `
                  <tr>
                    <td><strong>Completed At:</strong></td>
                    <td>${booking.completed_at}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td><strong>Status:</strong></td>
                    <td style="color:${config.color}; font-weight:bold;">
                      ${status.toUpperCase()}
                    </td>
                  </tr>
                </table>

                <p style="margin-top:30px; font-size:13px; color:#888;">
                  Thank you for using our platform.
                </p>

              </div>

            </div>
          </div>
        `,
            });

            strapi.log.info(`Booking status email sent: ${status}`);

        } catch (err) {
            strapi.log.error('Failed to send booking status email:', err);
        }
    },

}));