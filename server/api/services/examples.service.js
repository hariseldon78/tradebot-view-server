"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const logger_1 = require("../../common/logger");
let id = 0;
;
const examples = [
    { id: id++, name: 'example 0' },
    { id: id++, name: 'example 1' }
];
class ExamplesService {
    all() {
        logger_1.default.info(examples, 'fetch all examples');
        return Promise.resolve(examples);
    }
    byId(id) {
        logger_1.default.info(`fetch example with id ${id}`);
        return this.all().then(r => r[id]);
    }
    create(name) {
        logger_1.default.info(`create example with name ${name}`);
        const example = {
            id: id++,
            name
        };
        examples.push(example);
        return Promise.resolve(example);
    }
}
exports.ExamplesService = ExamplesService;
exports.default = new ExamplesService();
//# sourceMappingURL=examples.service.js.map