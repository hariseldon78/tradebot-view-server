import * as express from 'express';
import {Application} from 'express';
import * as path from 'path';
import * as bodyParser from 'body-parser';
import * as http from 'http';
import * as os from 'os';
import * as cookieParser from 'cookie-parser';
import swaggerify from './swagger';
import l from './logger';

const app = express();

export default class ExpressServer {
	constructor() {
		const root = path.normalize(__dirname + '/../..');
		app.set('appPath', root + 'client');
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({extended: true}));
		app.use(cookieParser(process.env.SESSION_SECRET));
		app.use(express.static(`${root}/public`));
		app.get('*',function (req, res,next) {
			l.info('request received:',req.method, req.url);
			next();
		});
		app.use(function (req, res, next) {

			// Website you wish to allow to connect
			res.setHeader('Access-Control-Allow-Origin', '*');

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

	router(routes: (app: Application) => void): ExpressServer {
		// swaggerify(app, routes);
		routes(app);
		return this;
	}

	listen(port: number = parseInt(process.env.PORT)): Application {
		const welcome = port => () => l.info(`up and running in ${process.env.NODE_ENV || 'development'} @: ${os.hostname() } on port: ${port}}`);
		http.createServer(app).listen(port, welcome(port));
		return app;
	}
}