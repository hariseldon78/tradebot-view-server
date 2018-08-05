"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./common/env");
const server_1 = require("./common/server");
const routes_1 = require("./routes");
const port = parseInt(process.env.PORT);
exports.default = new server_1.default()
    .router(routes_1.default)
    .listen(port);
//# sourceMappingURL=index.js.map