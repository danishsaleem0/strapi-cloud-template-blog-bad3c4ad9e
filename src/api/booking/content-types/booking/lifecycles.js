// // src/api/booking/content-types/booking/lifecycles.js
// module.exports = {
//   async afterCreate(event) {
//     const { result } = event;

//     const booking = await strapi.entityService.findOne(
//       "api::booking.booking",
//       result.id,
//       { populate: { provider: true, requester: true } },
//     );

//     // Booking created → notify provider
//     if (booking?.provider?.email) {
//       await strapi
//         .plugin("email")
//         .service("email")
//         .send({
//           to: booking.provider.email,
//           subject: "New Booking Request",
//           text: `You have a new booking request from ${booking.requester?.username || "a user"}.`,
//         });
//     }
//   },

//   async afterUpdate(event) {
//     const { result, params } = event;

//     // Only run when booking_status is being updated
//     if (!params?.data?.booking_status) return;

//     const booking = await strapi.entityService.findOne(
//       "api::booking.booking",
//       result.id,
//       { populate: { provider: true, requester: true } },
//     );

//     const newStatus = booking.booking_status;

//     // Booking accepted → notify requester
//     if (newStatus === "accepted" && booking?.requester?.email) {
//       await strapi
//         .plugin("email")
//         .service("email")
//         .send({
//           to: booking.requester.email,
//           subject: "Booking Accepted",
//           text: `Your booking has been accepted by ${booking.provider?.username || "the provider"}.`,
//         });
//     }

//     // Booking completed → review reminder to both
//     if (newStatus === "completed") {
//       if (booking?.requester?.email) {
//         await strapi
//           .plugin("email")
//           .service("email")
//           .send({
//             to: booking.requester.email,
//             subject: "Leave a Review",
//             text: `Your session is complete. Please leave a review for ${booking.provider?.username || "the provider"}.`,
//           });
//       }

//       if (booking?.provider?.email) {
//         await strapi
//           .plugin("email")
//           .service("email")
//           .send({
//             to: booking.provider.email,
//             subject: "Leave a Review",
//             text: `Your session is complete. Please leave a review for ${booking.requester?.username || "the requester"}.`,
//           });
//       }
//     }
//   },
// };
