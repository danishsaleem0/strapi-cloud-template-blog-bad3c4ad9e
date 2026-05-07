"use strict";

module.exports = {
  routes: [
    {
      method: "GET",
      path: "/user-dashboard",
      handler: "user-dashboard.index",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
