'use strict';

module.exports = (plugin) => {
    const originalRegister = plugin.controllers.auth.register;

    const resolveSignupRole = async (requestedRole) => {
        const normalizedRole = String(requestedRole || 'user').trim().toLowerCase();

        if (!['user', 'admin'].includes(normalizedRole)) {
            return null;
        }

        const lookupValues =
            normalizedRole === 'user'
                ? ['user', 'authenticated']
                : ['admin'];

        for (const lookupValue of lookupValues) {
            const role = await strapi.db.query('plugin::users-permissions.role').findOne({
                where: {
                    $or: [
                        { type: lookupValue },
                        { name: lookupValue },
                    ],
                },
            });

            if (role) {
                return role.id;
            }
        }

        return null;
    };

    plugin.controllers.auth.register = async (ctx) => {
        const requestedRole = ctx.request.body?.role || ctx.request.body?.roleType || 'user';
        const resolvedRoleId = await resolveSignupRole(requestedRole);

        if (!resolvedRoleId) {
            return ctx.badRequest('Invalid role. Use "user" or "admin", and make sure the role exists.');
        }

        ctx.request.body.role = resolvedRoleId;
        delete ctx.request.body.roleType;

        return originalRegister(ctx);
    };

    return plugin;
};
