"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const controller_1 = require("./controller");
exports.default = express.Router()
    .get('/candles', controller_1.default.candles)
    .get('/example', controller_1.default.all);
//# sourceMappingURL=router.js.map