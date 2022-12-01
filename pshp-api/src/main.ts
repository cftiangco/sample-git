
import { Validator } from 'jsonschema';
import { DBService } from './persistence/db.service';
DBService.setValidator(Validator);
import { NestFactory } from '@nestjs/core';
import { HttpStatus, HttpException } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import * as dotenv from 'dotenv';
import * as helmet from 'helmet';
import * as swaggerUi from 'swagger-ui-express';
import * as rewrite from 'express-urlrewrite';
import * as fs from 'fs';
import * as NodeSchedule from 'node-schedule';
import { WorkflowHelper } from './bean/handlers/utils/workflow.helper';
import { LAPayload } from './bean/handlers/utils/lapayload.helper';
import * as unirest  from 'unirest';
import RateLimit from 'express-rate-limit';
import * as noCache from 'nocache';

async function bootstrap() {
	dotenv.config();
	const app = await NestFactory.create<NestExpressApplication>(AppModule);

	//set limiters 
	var CUSTOMER_CREATE_RATE_LIMIT_MS = process.env.hasOwnProperty('CUSTOMER_CREATE_RATE_LIMIT_MS') ? process.env['CUSTOMER_CREATE_RATE_LIMIT_MS'] : 10000;
	var CUSTOMER_CREATE_RATE_LIMIT_MAX = process.env.hasOwnProperty('CUSTOMER_CREATE_RATE_LIMIT_MAX') ? process.env['CUSTOMER_CREATE_RATE_LIMIT_MAX'] : 1;
	var CUSTOMER_UPDATE_RATE_LIMIT_MS = process.env.hasOwnProperty('CUSTOMER_UPDATE_RATE_LIMIT_MS') ? process.env['CUSTOMER_UPDATE_RATE_LIMIT_MS'] : 5000;
	var CUSTOMER_UPDATE_RATE_LIMIT_MAX = process.env.hasOwnProperty('CUSTOMER_UPDATE_RATE_LIMIT_MAX') ? process.env['CUSTOMER_UPDATE_RATE_LIMIT_MAX'] : 1;
	var DOCS_RATE_LIMIT_MS = process.env.hasOwnProperty('DOCS_RATE_LIMIT_MS') ? process.env['DOCS_RATE_LIMIT_MS'] : 5000;
	var DOCS_RATE_LIMIT_MAX = process.env.hasOwnProperty('DOCS_RATE_LIMIT_MAX') ? process.env['DOCS_RATE_LIMIT_MAX'] : 1;
	var PREMIUM_RATE_LIMIT_MS = process.env.hasOwnProperty('PREMIUM_RATE_LIMIT_MS') ? process.env['PREMIUM_RATE_LIMIT_MS'] : 5000;
	var PREMIUM_RATE_LIMIT_MAX = process.env.hasOwnProperty('PREMIUM_RATE_LIMIT_MAX') ? process.env['PREMIUM_RATE_LIMIT_MAX'] : 1;
	var PAYMENT_LINK_RATE_LIMIT_MS = process.env.hasOwnProperty('PAYMENT_LINK_RATE_LIMIT_MS') ? process.env['PAYMENT_LINK_RATE_LIMIT_MS'] : 5000;
	var PAYMENT_LINK_RATE_LIMIT_MAX = process.env.hasOwnProperty('PAYMENT_LINK__RATE_LIMIT_MAX') ? process.env['PAYMENT_LINK_RATE_LIMIT_MAX'] : 1;
	var PAYMENT_STATUS_RATE_LIMIT_MS = process.env.hasOwnProperty('PAYMENT_STATUS_RATE_LIMIT_MS') ? process.env['PAYMENT_STATUS_RATE_LIMIT_MS'] : 5000;
	var PAYMENT_STATUS_RATE_LIMIT_MAX = process.env.hasOwnProperty('PAYMENT_STATUS__RATE_LIMIT_MAX') ? process.env['PAYMENT_STATUS_RATE_LIMIT_MAX'] : 1;

	var limiterConfig = {
		windowMs: 0, 
		max: 0, 
		standardHeaders: false, // Return rate limit info in the `RateLimit-*` headers
		legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	};

	limiterConfig.windowMs = +CUSTOMER_CREATE_RATE_LIMIT_MS;
	limiterConfig.max = +CUSTOMER_CREATE_RATE_LIMIT_MAX;
	const customerCreateLimiter = RateLimit(limiterConfig);

	limiterConfig.windowMs = +CUSTOMER_UPDATE_RATE_LIMIT_MS;
	limiterConfig.max = +CUSTOMER_UPDATE_RATE_LIMIT_MAX;
	const customerUpdateLimiter = RateLimit(limiterConfig);

	limiterConfig.windowMs = +DOCS_RATE_LIMIT_MS;
	limiterConfig.max = +DOCS_RATE_LIMIT_MAX;
	const docsLimiter = RateLimit(limiterConfig);

	limiterConfig.windowMs = +PREMIUM_RATE_LIMIT_MS;
	limiterConfig.max = +PREMIUM_RATE_LIMIT_MAX;
	const premiumLimiter = RateLimit(limiterConfig);

	limiterConfig.windowMs = +PAYMENT_LINK_RATE_LIMIT_MS;
	limiterConfig.max = +PAYMENT_LINK_RATE_LIMIT_MAX;
	const paymentLinkLimiter = RateLimit(limiterConfig);

	limiterConfig.windowMs = +PAYMENT_STATUS_RATE_LIMIT_MS;
	limiterConfig.max = +PAYMENT_STATUS_RATE_LIMIT_MAX;
	const paymentStatusLimiter = RateLimit(limiterConfig);
	
	// Apply the rate limiting middleware to API calls only
	app.use('/api/create/customer', customerCreateLimiter );
	app.use('/api/customer/create', customerCreateLimiter );
	app.use('/api/customer/update', customerUpdateLimiter );
	app.use('/api/premium', premiumLimiter );
	app.use('/api/docs/policy/eapp', docsLimiter);
	app.use('/api/docs/policy/esaf', docsLimiter);
	app.use('/api/docs/policy/sob', docsLimiter);
	app.use('/api/docs/policy/tlic', docsLimiter);
	app.use('/api/customer/id-upload', docsLimiter);
	app.use('/api/customer/id-upload/status', docsLimiter);
	app.use('/api/payment/link', paymentLinkLimiter);
	app.use('/api/payment/status', paymentStatusLimiter);
    
	//// https://prushoppe-api.prulifeuk.com.ph/api/status
	app.use(rewrite('/api/status', '/' + process.env['SERVICE_NAMESPACE'] + '/api/status'));
	// https://prushoppe-api.prulifeuk.com.ph/api/premium
	app.use(rewrite('/api/premium', '/' + process.env['SERVICE_NAMESPACE'] + '/api/premium'));
	// https://prushoppe-api.prulifeuk.com.ph/api/customer/create
	app.use(rewrite('/api/create/customer', '/' + process.env['SERVICE_NAMESPACE'] + '/api/create/customers'));
	app.use(rewrite('/api/customer/create', '/' + process.env['SERVICE_NAMESPACE'] + '/api/create/customers'));
	// https://prushoppe-api.prulifeuk.com.ph/api/customer/update
	app.use(rewrite('/api/customer/update', '/' + process.env['SERVICE_NAMESPACE'] + '/api/update/customers'));

	// https://prushoppe-api.prulifeuk.com.ph/api/docs/policy/sob/:customerId
	app.use(rewrite('/api/docs/policy/eapp/:id', '/' + process.env['SERVICE_NAMESPACE'] + '/api/eapp/docs/:id'));
	// https://prushoppe-api.prulifeuk.com.ph/api/docs/policy/esaf/:customerId
	app.use(rewrite('/api/docs/policy/sob/:id', '/' + process.env['SERVICE_NAMESPACE'] + '/api/sob/docs/:id'));
	// https://prushoppe-api.prulifeuk.com.ph/api/docs/policy/eapp/:customerId
	app.use(rewrite('/api/docs/policy/esaf/:id', '/' + process.env['SERVICE_NAMESPACE'] + '/api/esaf/docs/:id'));
	// https://prushoppe-api.prulifeuk.com.ph/api/docs/policy/tlic/:customerId
	app.use(rewrite('/api/docs/policy/tlic/:id', '/' + process.env['SERVICE_NAMESPACE'] + '/api/tlic/docs/:id'));

	// https://prushoppe-api.prulifeuk.com.ph/api/customer/api/docs/policy/sms
	// { doc, customerId}
	app.use(rewrite('/api/docs/policy/sms', '/' + process.env['SERVICE_NAMESPACE'] + '/api/seek/document'));

	// https://prushoppe-api.prulifeuk.com.ph/api/customer/id-upload
	app.use(rewrite('/api/customer/id-upload', '/' + process.env['SERVICE_NAMESPACE'] + '/api/create/refdocs'));
	// https://prushoppe-api.prulifeuk.com.ph/api/customer/id-upload/sms
	// { customerId }
	app.use(rewrite('/api/customer/id-upload/sms', '/' + process.env['SERVICE_NAMESPACE'] + '/api/seek/refdocs'));
	// https://prushoppe-api.prulifeuk.com.ph/api/customer/id-upload/status
	// { customerID }
	app.use(rewrite('/api/customer/id-upload/status', '/' + process.env['SERVICE_NAMESPACE'] + '/api/search/refdocs'));

	// https://prushoppe-api.prulifeuk.com.ph/api/payment/link 
	// { customerId }
	app.use(rewrite('/api/payment/link', '/' + process.env['SERVICE_NAMESPACE'] + '/api/create/payments'));
	// https://prushoppe-api.prulifeuk.com.ph/api/payment/status
	// { orderId }
	app.use(rewrite('/api/payment/status', '/' + process.env['SERVICE_NAMESPACE'] + '/api/search/payments'));

  var pathViewerJS = __dirname + '/static/ViewerJS';
  console.log (pathViewerJS);
  app.use('/ViewerJS', express.static(pathViewerJS) );

	if (!process.env['ALLOWED_DOMAINS']) {
		console.log('Error: ALLOWED_DOMAINS NOT SET');
		throw new HttpException({
			status: HttpStatus.FORBIDDEN,
			error: 'Error: CORS Settings Not Found',
		}, HttpStatus.FORBIDDEN);
	}
	
	app.enableCors();
	app.disable('x-powered-by');
	app.use(helmet.dnsPrefetchControl());
	app.use(helmet.expectCt());
	app.use(helmet.hidePoweredBy());
	app.use(helmet.ieNoOpen());
	app.use(helmet.noSniff());
	app.use(helmet.xssFilter());
	//app.use(helmet.frameguard({ action: 'sameorigin' }));
	// app.use(helmet.contentSecurityPolicy({
	// 	useDefaults: true,
	// 	directives: {
	// 		defaultSrc: ["'self'", "unpkg.com"],
	// 		scriptSrc: ["'self'", "unpkg.com"],
	// 		objectSrc: ["'none'"],
	// 		upgradeInsecureRequests: [],
	// 	},
	// 	reportOnly: false,
	// }));
	// app.use(helmet.crossOriginEmbedderPolicy());
	// app.use(helmet.crossOriginOpenerPolicy());
	// app.use(helmet.crossOriginResourcePolicy());
	app.use(noCache());

	let options = {
		swaggerOptions: {
			url: process.env['SCHEMA_URL']
		}
	}

  	app.use('/'+process.env['SERVICE_NAMESPACE']+'/api-docs', swaggerUi.serve, swaggerUi.setup(null, options));  
  
	if (process.env.ENABLE_CRON_JOBS=='Yes') {

		const nextDayJob = NodeSchedule.scheduleJob(process.env.NEXTDAY_CRON_INTERVAL, function () {
			DBService.connect((pc) => {
				if (pc.success) {
					let db = <DBService>pc.result;

					db.query('nextday-processing', {}, function (r: any) {
						console.log('CRON QUERY nextday-processing:', r);

						if (r.success) {
							//start workflow
							//update customer record set forNexDay=No, once proceed

							if(r.result.length) {

								for (let i = 0; i < r.result.length; i++) {
									let customer = r.result[i];

									try {
										console.log("====================================");
										console.log("CRON NEXT CUSTOMER", customer);
										var wfPayload = LAPayload.generateLAPayload(customer);
										let wfres = WorkflowHelper.startWF(wfPayload, null, db);

										customer.forNextDay = "No";
										db.update('customers', customer, (d) => {
											console.log("====================================");
											console.log("CRON NEXT DAY", customer.id, wfres, d);

											//check if next data is empty, if yes close db connection
											if(r.result.length==(i+1)) {
												db.close();
											}

										});

										
									}
									catch (e) {
										console.log("====================================");
										console.log("CRON NEXT DAY ERROR: ", customer.id, e);
									}
								}
							}
							else {
								db.close();
							}

						} else {
							//ignore
							db.close();
						}
					});

				}
				else {
					console.log('NEXTDAY CRON', pc);
				}
			});
		});

		const nonOirJob = NodeSchedule.scheduleJob(process.env.NON_OIR_CRON_INTERVAL, function () {
			DBService.connect((pc) => {
				if (pc.success) {
					let db = <DBService>pc.result;

					db.query('get-non-oirs', {}, function (r: any) {
						db.close();
						console.log('CRON QUERY get-non-oir:', r);

						if (r.success) {
							//start workflow
							//update customer record set forNexDay=No, once proceed

							if(r.result.length>0) {

								for (let i = 0; i < r.result.length; i++) {
									let payment = r.result[i];

									try {
										console.log("====================================");
										console.log("CRON NON OIR", payment);

										let paymentData = {
											"landbot": 1,
											"orderId": payment.orderId
										}
			
										let options: any = {
											url: process.env.API_CHECK_PAYMENT_STATUS_ENDPOINT,
											headers: {
												"Content-Type": "application/json"
											},
											json: paymentData
										};

										unirest
											.post(options.url)
											.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
											.send(paymentData)
											.then(statusResponse => {
												if (statusResponse.hasOwnProperty('body')) {
													console.log("====================================");
													console.log("CHECK PAYMENT STATUS RESPONSE", statusResponse.body);
												}
											})
											.catch(err => {    
												console.log("====================================");
												console.log("CHECK PAYMENT STATUS ERROR", paymentData, err);
											});

									}
									catch (e) {
										console.log("====================================");
										console.log("CRON NON OIR ERROR: ", payment.orderId, e);
									}
								}
							}
						} 
					});

				}
				else {
					console.log('NEXTDAY CRON', pc);
				}
			});
		});
	}

	// const nonOirJob = NodeSchedule.scheduleJob(process.env.NON_OIR_CRON_INTERVAL, function () {
	// 	DBService.connect((pc) => {
	// 		if (pc.success) {
	// 			let db = <DBService>pc.result;

	// 			db.query('get-non-oirs', {}, function (r: any) {
	// 				db.close();
	// 				console.log('CRON QUERY get-non-oir:', r);

	// 				if (r.success) {
	// 					//start workflow
	// 					//update customer record set forNexDay=No, once proceed

	// 					if(r.result.length>0) {

	// 						for (let i = 0; i < r.result.length; i++) {
	// 							let payment = r.result[i];

	// 							try {
	// 								console.log("====================================");
	// 								console.log("CRON NON OIR", payment);

	// 								let paymentData = {
	// 									"landbot": 1,
	// 									"orderId": payment.orderId
	// 								}
        
    //                                 let options: any = {
    //                                     url: process.env.API_CHECK_PAYMENT_STATUS_ENDPOINT,
    //                                     headers: {
    //                                         "Content-Type": "application/json"
    //                                     },
    //                                     json: paymentData
    //                                 };

    //                                 unirest
    //                                     .post(options.url)
    //                                     .headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
    //                                     .send(paymentData)
    //                                     .then(statusResponse => {
    //                                         if (statusResponse.hasOwnProperty('body')) {
	// 											console.log("====================================");
	// 											console.log("CHECK PAYMENT STATUS RESPONSE", statusResponse.body);
	// 										}
    //                                     })
    //                                     .catch(err => {    
    //                                         console.log("====================================");
	// 										console.log("CHECK PAYMENT STATUS ERROR", paymentData, err);
    //                                     });

	// 							}
	// 							catch (e) {
	// 								console.log("====================================");
	// 								console.log("CRON NON OIR ERROR: ", payment.orderId, e);
	// 							}
	// 						}
	// 					}
	// 				} 
	// 			});

	// 		}
	// 		else {
	// 			console.log('NEXTDAY CRON', pc);
	// 		}
	// 	});
	// });

	let port: any = process.env['SERVICE_PORT'];
	await app.listen(port * 1);
}

bootstrap();
