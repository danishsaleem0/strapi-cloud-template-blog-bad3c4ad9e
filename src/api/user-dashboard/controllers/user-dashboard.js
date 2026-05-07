"use strict";

const USER_UID = "plugin::users-permissions.user";

const BOOKING_UID = "api::booking.booking";
const SKILL_UID = "api::skill.skill";

const requireAuth = (ctx) => {
  if (!ctx.state.user?.id) {
    ctx.unauthorized("Authentication required.");
    return null;
  }

  return ctx.state.user;
};

const userFields = ["username", "email", "bio", "location"];

const bookingPopulate = {
  requester: {
    fields: userFields,
  },
  provider: {
    fields: userFields,
  },
  offered_skill: {
    populate: {
      category: true,
      images: true,
    },
  },
  requested_skill: {
    populate: {
      category: true,
      images: true,
    },
  },
  review: true,
};

module.exports = {
  async index(ctx) {
    try {
      const currentUser = requireAuth(ctx);

      if (!currentUser) {
        return;
      }

      const userDocumentId = currentUser.documentId;

      const profile = await strapi.documents(USER_UID).findOne({
        documentId: userDocumentId,
        fields: [
          "username",
          "email",
          "bio",
          "location",
          "confirmed",
          "blocked",
          "createdAt",
        ],
      });

      /**
       * Skills offered/created by logged-in user
       */
      const offeredSkills = await strapi.documents(SKILL_UID).findMany({
        filters: {
          user: {
            documentId: {
              $eq: userDocumentId,
            },
          },
          type: {
            $eq: "OFFER",
          },
        },
        sort: { createdAt: "desc" },
        populate: {
          category: true,
          images: true,
        },
      });

      /**
       * Requests sent by logged-in user
       * requester = current user
       */
      const sentRequests = await strapi.documents(BOOKING_UID).findMany({
        filters: {
          requester: {
            documentId: {
              $eq: userDocumentId,
            },
          },
        },
        sort: { createdAt: "desc" },
        populate: bookingPopulate,
      });

      /**
       * Requests received by logged-in user
       * provider = current user
       */
      const receivedRequests = await strapi.documents(BOOKING_UID).findMany({
        filters: {
          provider: {
            documentId: {
              $eq: userDocumentId,
            },
          },
        },
        sort: { createdAt: "desc" },
        populate: bookingPopulate,
      });

      ctx.body = {
        message: "User dashboard fetched successfully.",
        data: {
          profile,

          stats: {
            offeredSkills: offeredSkills.length,
            sentRequests: sentRequests.length,
            receivedRequests: receivedRequests.length,
            totalBookings: sentRequests.length + receivedRequests.length,
          },

          offeredSkills,

          bookings: {
            sentRequests,
            receivedRequests,
          },
        },
      };
    } catch (error) {
      strapi.log.error("User dashboard error:", error);
      return ctx.internalServerError(error.message);
    }
  },
};
