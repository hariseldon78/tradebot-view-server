"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const examples_service_1 = require("../../services/examples.service");
class Controller {
    candles(req, res) {
        // const candles=JSON.parse(fs.readFileSync('../../bitmexbot/lastCandles.json', 'utf8'));
        res.json({ this: 'is a test' });
    }
    all(req, res) {
        examples_service_1.default.all().then(r => res.json(r));
    }
}
exports.Controller = Controller;
exports.default = new Controller();
//# sourceMappingURL=controller.js.map