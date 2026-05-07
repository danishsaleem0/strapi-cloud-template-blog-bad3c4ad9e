"use strict";

/**
 * report controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

const USER_UID = "plugin::users-permissions.user";
const REPORT_UID = "api::report.report";

const getRequestData = (ctx) =>
  ctx.request.body?.data || ctx.request.body || {};

const requireAuth = (ctx) => {
  if (!ctx.state.user?.id) {
    ctx.unauthorized("Authentication required.");
    return null;
  }

  return ctx.state.user;
};

module.exports = createCoreController(REPORT_UID, ({ strapi }) => ({
  /**
   * Create a user abuse report
   *
   * POST /api/reports
   *
   * Body:
   * {
   *   "data": {
   *     "reason": "This user is harassing me.",
   *     "reported_user": 12
   *   }
   * }
   */
  async create(ctx) {
    const currentUser = requireAuth(ctx);

    if (!currentUser) {
      return;
    }

    const data = getRequestData(ctx);

    if (!data.reason) {
      return ctx.badRequest("reason is required.");
    }

    if (!data.reported_user) {
      return ctx.badRequest("reported_user is required.");
    }

    const reportedUserId = Number(data.reported_user);

    if (!reportedUserId) {
      return ctx.badRequest("reported_user must be a valid user id.");
    }

    if (reportedUserId === currentUser.id) {
      return ctx.badRequest("You cannot report yourself.");
    }

    const reportedUser = await strapi.entityService.findOne(
      USER_UID,
      reportedUserId,
    );

    if (!reportedUser) {
      return ctx.notFound("Reported user not found.");
    }

    const report = await strapi.entityService.create(REPORT_UID, {
      data: {
        reason: data.reason,
        reporter: currentUser.id,
        reported_user: reportedUserId,
        status: "pending",
      },
      populate: ["reporter", "reported_user"],
    });

    ctx.body = {
      message: "Report submitted successfully.",
      data: report,
    };
  },

  /**
   * Report user by URL param
   *
   * POST /api/users/:id/report
   *
   * Body:
   * {
   *   "data": {
   *     "reason": "This user is abusive."
   *   }
   * }
   */
  async reportUser(ctx) {
    const currentUser = requireAuth(ctx);

    if (!currentUser) {
      return;
    }

    const reportedUserId = Number(ctx.params.id);

    if (!reportedUserId) {
      return ctx.badRequest("A valid user id is required.");
    }

    if (reportedUserId === currentUser.id) {
      return ctx.badRequest("You cannot report yourself.");
    }

    const reportedUser = await strapi.entityService.findOne(
      USER_UID,
      reportedUserId,
    );

    if (!reportedUser) {
      return ctx.notFound("Reported user not found.");
    }

    const data = getRequestData(ctx);

    if (!data.reason) {
      return ctx.badRequest("reason is required.");
    }

    const report = await strapi.entityService.create(REPORT_UID, {
      data: {
        reason: data.reason,
        reporter: currentUser.id,
        reported_user: reportedUserId,
        status: "pending",
      },
      populate: ["reporter", "reported_user"],
    });

    ctx.body = {
      message: "Report submitted successfully.",
      data: report,
    };
  },

  async update(ctx) {
    const currentUser = requireAuth(ctx);

    if (!currentUser) {
      return;
    }

    const reportId = Number(ctx.params.id);

    if (!reportId) {
      return ctx.badRequest("A valid report id is required.");
    }

    /**
     * Adjust these role names based on your Strapi roles.
     * Common examples: Admin, Moderator, Authenticated
     */
    const allowedRoles = ["Admin", "Moderator"];

    const userWithRole = await strapi.entityService.findOne(
      USER_UID,
      currentUser.id,
      {
        populate: ["role"],
      },
    );

    const userRoleName = userWithRole?.role?.name;

    if (!allowedRoles.includes(userRoleName)) {
      return ctx.forbidden("Only admin or moderator can update reports.");
    }

    const data = getRequestData(ctx);

    const allowedStatuses = ["pending", "reviewed", "resolved", "rejected"];

    if (data.status && !allowedStatuses.includes(data.status)) {
      return ctx.badRequest(
        "status must be one of: pending, reviewed, resolved, rejected.",
      );
    }

    const existingReport = await strapi.entityService.findOne(
      REPORT_UID,
      reportId,
    );

    if (!existingReport) {
      return ctx.notFound("Report not found.");
    }

    const updateData = {};

    if (data.status) {
      updateData.status = data.status;
    }

    if (data.admin_note !== undefined) {
      updateData.admin_note = data.admin_note;
    }

    if (data.action_taken !== undefined) {
      updateData.action_taken = data.action_taken;
    }

    if (Object.keys(updateData).length === 0) {
      return ctx.badRequest("No valid fields provided for update.");
    }

    const updatedReport = await strapi.entityService.update(
      REPORT_UID,
      reportId,
      {
        data: updateData,
        populate: ["reporter", "reported_user"],
      },
    );

    ctx.body = {
      message: "Report updated successfully.",
      data: updatedReport,
    };
  },
}));
