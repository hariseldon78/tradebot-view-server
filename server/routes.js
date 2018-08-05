"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const router_1 = require("./api/controllers/examples/router");
const router_2 = require("./api/controllers/candles/router");
function routes(app) {
    app.use('/api/v1/examples', router_1.default);
    app.use('/api/v1/candles', router_2.default);
}
exports.default = routes;
;
//# sourceMappingURL=routes.js.map