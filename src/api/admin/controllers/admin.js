'use strict';

const USER_UID = 'plugin::users-permissions.user';
const ROLE_UID = 'plugin::users-permissions.role';
const REPORT_UID = 'api::report.report';

const USER_FIELDS = ['id', 'username', 'email', 'provider', 'confirmed', 'blocked', 'bio', 'location', 'createdAt', 'updatedAt'];
const USER_POPULATE = ['role', 'profile_image'];
const ADMIN_USER_FIELDS = ['username', 'email', 'bio', 'location', 'blocked', 'confirmed', 'profile_image'];

const getRequestData = (ctx) => ctx.request.body?.data || ctx.request.body || {};

const pickAllowedFields = (source, fields) =>
    fields.reduce((acc, field) => {
        if (Object.prototype.hasOwnProperty.call(source, field)) {
            acc[field] = source[field];
        }

        return acc;
    }, {});

const isAdminRole = (role) => {
    const roleName = String(role?.name || '').toLowerCase();
    const roleType = String(role?.type || '').toLowerCase();

    return roleName.includes('admin') || roleType.includes('admin');
};

const requireAdmin = async (ctx) => {
    if (!ctx.state.user?.id) {
        ctx.unauthorized('Authentication required.');
        return null;
    }

    const currentUser = await strapi.entityService.findOne(USER_UID, ctx.state.user.id, {
        populate: ['role'],
    });

    if (!isAdminRole(currentUser?.role)) {
        ctx.forbidden('Admin access required.');
        return null;
    }

    return currentUser;
};

const resolveRoleId = async (role) => {
    if (role === undefined || role === null || role === '') {
        return undefined;
    }

    if (Number(role)) {
        return Number(role);
    }

    const normalizedRole = String(role).trim().toLowerCase();

    if (!['user', 'admin', 'authenticated'].includes(normalizedRole)) {
        return null;
    }

    const lookupValues =
        normalizedRole === 'admin'
            ? ['admin']
            : ['user', 'authenticated'];

    for (const lookupValue of lookupValues) {
        const foundRole = await strapi.db.query(ROLE_UID).findOne({
            where: {
                $or: [
                    { type: lookupValue },
                    { name: lookupValue },
                ],
            },
        });

        if (foundRole) {
            return foundRole.id;
        }
    }

    return null;
};

const buildUserFilters = (query) => {
    const filters = {};

    if (query.blocked !== undefined) {
        filters.blocked = String(query.blocked) === 'true';
    }

    if (query.status === 'active') {
        filters.blocked = false;
    }

    if (query.status === 'inactive') {
        filters.blocked = true;
    }

    if (query.q) {
        filters.$or = [
            { username: { $containsi: query.q } },
            { email: { $containsi: query.q } },
        ];
    }

    return filters;
};

module.exports = {
    async users(ctx) {
        if (!(await requireAdmin(ctx))) {
            return;
        }

        const page = Math.max(Number(ctx.query.page) || 1, 1);
        const pageSize = Math.min(Math.max(Number(ctx.query.pageSize) || 25, 1), 100);
        const filters = buildUserFilters(ctx.query);

        const [users, total] = await Promise.all([
            strapi.entityService.findMany(USER_UID, {
                fields: USER_FIELDS,
                filters,
                populate: USER_POPULATE,
                sort: { createdAt: 'desc' },
                start: (page - 1) * pageSize,
                limit: pageSize,
            }),
            strapi.db.query(USER_UID).count({ where: filters }),
        ]);

        ctx.body = {
            data: users,
            meta: {
                pagination: {
                    page,
                    pageSize,
                    pageCount: Math.ceil(total / pageSize),
                    total,
                },
            },
        };
    },

    async getUser(ctx) {
        if (!(await requireAdmin(ctx))) {
            return;
        }

        const user = await strapi.entityService.findOne(USER_UID, ctx.params.id, {
            fields: USER_FIELDS,
            populate: USER_POPULATE,
        });

        if (!user) {
            return ctx.notFound('User not found.');
        }

        ctx.body = user;
    },

    async updateUser(ctx) {
        if (!(await requireAdmin(ctx))) {
            return;
        }

        const data = getRequestData(ctx);
        const updateData = pickAllowedFields(data, ADMIN_USER_FIELDS);
        const roleId = await resolveRoleId(data.role);

        if (roleId === null) {
            return ctx.badRequest('Invalid role. Use "user" or "admin", and make sure the role exists.');
        }

        if (roleId !== undefined) {
            updateData.role = roleId;
        }

        if (!Object.keys(updateData).length) {
            return ctx.badRequest('No valid user fields were provided.');
        }

        const user = await strapi.entityService.update(USER_UID, ctx.params.id, {
            data: updateData,
            fields: USER_FIELDS,
            populate: USER_POPULATE,
        });

        ctx.body = user;
    },

    async deleteUser(ctx) {
        if (!(await requireAdmin(ctx))) {
            return;
        }

        const user = await strapi.entityService.delete(USER_UID, ctx.params.id, {
            fields: USER_FIELDS,
            populate: USER_POPULATE,
        });

        ctx.body = user;
    },

    async activateUser(ctx) {
        if (!(await requireAdmin(ctx))) {
            return;
        }

        const user = await strapi.entityService.update(USER_UID, ctx.params.id, {
            data: { blocked: false, confirmed: true },
            fields: USER_FIELDS,
            populate: USER_POPULATE,
        });

        ctx.body = {
            message: 'User activated successfully.',
            user,
        };
    },

    async deactivateUser(ctx) {
        if (!(await requireAdmin(ctx))) {
            return;
        }

        const user = await strapi.entityService.update(USER_UID, ctx.params.id, {
            data: { blocked: true },
            fields: USER_FIELDS,
            populate: USER_POPULATE,
        });

        ctx.body = {
            message: 'User deactivated successfully.',
            user,
        };
    },

    async abusers(ctx) {
        if (!(await requireAdmin(ctx))) {
            return;
        }

        const filters = {
            reported_item_type: 'user',
        };

        if (ctx.query.status) {
            filters.status = ctx.query.status;
        }

        const reports = await strapi.entityService.findMany(REPORT_UID, {
            filters,
            populate: ['reporter'],
            sort: { createdAt: 'desc' },
            limit: Math.min(Math.max(Number(ctx.query.limit) || 500, 1), 1000),
        });

        const groupedReports = new Map();

        reports.forEach((report) => {
            const reportedUserId = Number(report.reported_item_id);

            if (!reportedUserId) {
                return;
            }

            const existing = groupedReports.get(reportedUserId) || [];
            existing.push(report);
            groupedReports.set(reportedUserId, existing);
        });

        const users = await Promise.all(
            [...groupedReports.keys()].map(async (userId) => {
                const user = await strapi.entityService.findOne(USER_UID, userId, {
                    fields: USER_FIELDS,
                    populate: USER_POPULATE,
                });

                return user ? [userId, user] : null;
            })
        );

        const usersById = new Map(users.filter(Boolean));

        const data = [...groupedReports.entries()]
            .map(([userId, userReports]) => ({
                user: usersById.get(userId) || { id: userId, deleted: true },
                reportCount: userReports.length,
                latestReportAt: userReports[0]?.createdAt,
                reports: userReports,
            }))
            .sort((a, b) => b.reportCount - a.reportCount);

        ctx.body = {
            data,
            meta: {
                total: data.length,
                reportCount: reports.length,
            },
        };
    },
};
