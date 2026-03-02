'use strict';

const USER_UID = 'plugin::users-permissions.user';
const SKILL_UID = 'api::skill.skill';

const PROFILE_FIELDS = ['username', 'email', 'bio', 'location', 'profile_image'];
const SKILL_FIELDS = ['title', 'type', 'images', 'location', 'category', 'description_text', 'skill_level', 'availability_slots'];

const pickAllowedFields = (source, fields) =>
    fields.reduce((acc, field) => {
        if (Object.prototype.hasOwnProperty.call(source, field)) {
            acc[field] = source[field];
        }

        return acc;
    }, {});

const getRequestData = (ctx) => ctx.request.body?.data || ctx.request.body || {};

const requireAuth = (ctx) => {
    if (!ctx.state.user?.id) {
        ctx.unauthorized('Authentication required.');
        return null;
    }

    return ctx.state.user;
};

const getOwnedSkill = async (skillId, userId) => {
    const skill = await strapi.entityService.findOne(SKILL_UID, skillId, {
        populate: ['images', 'category', 'user'],
    });

    if (!skill || skill.user?.id !== userId) {
        return null;
    }

    return skill;
};

module.exports = {
    async me(ctx) {
        const currentUser = requireAuth(ctx);

        if (!currentUser) {
            return;
        }

        const user = await strapi.entityService.findOne(USER_UID, currentUser.id, {
            populate: ['role', 'profile_image', 'skills', 'skill_availabilities'],
        });

        ctx.body = user;
    },

    async updateMe(ctx) {
        const currentUser = requireAuth(ctx);

        if (!currentUser) {
            return;
        }

        const data = pickAllowedFields(getRequestData(ctx), PROFILE_FIELDS);

        if (!Object.keys(data).length) {
            return ctx.badRequest('No valid profile fields were provided.');
        }

        const user = await strapi.entityService.update(USER_UID, currentUser.id, {
            data,
            populate: ['role', 'profile_image', 'skills'],
        });

        ctx.body = user;
    },

    async mySkills(ctx) {
        const currentUser = requireAuth(ctx);

        if (!currentUser) {
            return;
        }

        const filters = {
            user: {
                id: currentUser.id,
            },
        };

        if (ctx.query.status) {
            filters.approval_status = ctx.query.status;
        }

        if (ctx.query.type) {
            filters.type = ctx.query.type;
        }

        const skills = await strapi.entityService.findMany(SKILL_UID, {
            filters,
            populate: ['images', 'category'],
            sort: { createdAt: 'desc' },
        });

        ctx.body = skills;
    },

    async createMySkill(ctx) {
        const currentUser = requireAuth(ctx);

        if (!currentUser) {
            return;
        }

        const data = pickAllowedFields(getRequestData(ctx), SKILL_FIELDS);

        if (!data.title || !data.description_text) {
            return ctx.badRequest('Both title and description_text are required.');
        }

        const skill = await strapi.entityService.create(SKILL_UID, {
            data: {
                ...data,
                user: currentUser.id,
                approval_status: 'pending',
                total_requests: 0,
                total_completed: 0,
                rating_sum: 0,
                rating_count: 0,
            },
            populate: ['images', 'category', 'user'],
        });

        ctx.body = skill;
    },

    async getMySkill(ctx) {
        const currentUser = requireAuth(ctx);

        if (!currentUser) {
            return;
        }

        const skill = await getOwnedSkill(ctx.params.id, currentUser.id);

        if (!skill) {
            return ctx.notFound('Skill not found.');
        }

        ctx.body = skill;
    },

    async updateMySkill(ctx) {
        const currentUser = requireAuth(ctx);

        if (!currentUser) {
            return;
        }

        const existingSkill = await getOwnedSkill(ctx.params.id, currentUser.id);

        if (!existingSkill) {
            return ctx.notFound('Skill not found.');
        }

        const data = pickAllowedFields(getRequestData(ctx), SKILL_FIELDS);

        if (!Object.keys(data).length) {
            return ctx.badRequest('No valid skill fields were provided.');
        }

        const skill = await strapi.entityService.update(SKILL_UID, ctx.params.id, {
            data: {
                ...data,
                approval_status: 'pending',
            },
            populate: ['images', 'category', 'user'],
        });

        ctx.body = skill;
    },

    async deleteMySkill(ctx) {
        const currentUser = requireAuth(ctx);

        if (!currentUser) {
            return;
        }

        const existingSkill = await getOwnedSkill(ctx.params.id, currentUser.id);

        if (!existingSkill) {
            return ctx.notFound('Skill not found.');
        }

        const skill = await strapi.entityService.delete(SKILL_UID, ctx.params.id);

        ctx.body = skill;
    },
};
