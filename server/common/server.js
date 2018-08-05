"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const http = require("http");
const os = require("os");
const cookieParser = require("cookie-parser");
const logger_1 = require("./logger");
const app = express();
class ExpressServer {
    constructor() {
        const root = path.normalize(__dirname + '/../..');
        app.set('appPath', root + 'client');
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(cookieParser(process.env.SESSION_SECRET));
        app.use(express.static(`${root}/public`));
        app.get('*', function (req, res, next) {
            logger_1.default.info('request received:', req.method, req.url);
            next();
        });
        app.use(function (req, res, next) {
            // Website you wish to allow to connect
            res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
            // Request methods you wish to allow
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
            // Request headers you wish to allow
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
            // Set to true if you need the website to include cookies in the requests sent
            // to the API (e.g. in case you use sessions)
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            // Pass to next layer of middleware
            next();
        });
    }
    router(routes) {
        // swaggerify(app, routes);
        routes(app);
        return this;
    }
    listen(port = parseInt(process.env.PORT)) {
        const welcome = port => () => logger_1.default.info(`up and running in ${process.env.NODE_ENV || 'development'} @: ${os.hostname()} on port: ${port}}`);
        http.createServer(app).listen(port, welcome(port));
        return app;
    }
}
exports.default = ExpressServer;
//# sourceMappingURL=server.js.map