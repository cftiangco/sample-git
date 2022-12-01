import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs-extra';
import * as moment from 'moment';
import * as xmlParser from 'xml2json';
import * as Mustache from 'mustache';
import * as unirest  from 'unirest';
import { AppHelper as Helper } from '../../../helpers/app.helper';
import { reqTplRealtimeWSFScreening} from './reqTplRealtimeWSFScreening';
import { reqTplGetAlertStatus } from './reqTplGetAlertStatus';
import { RTSEmailNotifTemplate } from './RTSEmailNotifTemplate';
import { NotificationsHelper } from '../notifications.helper';

dotenv.config();
export class FiservController {

	// public static xmlReqScreeningTpl: any = fs.readFileSync('./reqTplRealtimeWLFScreening.txt', { encoding: 'utf8', flag: 'r' });
	// public static xmlReqStatusTpl: any = fs.readFileSync('./reqTplGetAlertStatus.txt', { encoding: 'utf8', flag: 'r' });
	// public static rtsEmailNotifTemplate: any = fs.readFileSync( './RTSEmailNotifTemplate.txt', { encoding: 'utf8', flag: 'r' });

	log(header: any, data: any) {
		console.log("========== " + header);
		console.log(data);
	}

	public static screening(data: any, db: any, control: any) {
		data.rtsId = uuidv4();
		return new Promise(function (resolve) {
			FiservController.sendRequest('RealtimeWLFScreening', data, db, control)
				.then(function (result) {
					console.log("rtsResult", result);
					resolve(result);
				});
		});
	}

	public static getAlertStatus(data: any, db: any, control: any) {
		return new Promise(function (resolve) {
			FiservController.sendRequest('GetAlertStatus', data, db, control)
				.then(function (result) {
					resolve(result)
				});
		})
	}

	public static sendEmailAlert(data: any, control: any) {
		var to = process.env.RTS_ALERT_RECIPIENT;
		var from = process.env.RTS_ALERT_SENDER;
		var message = Mustache.render(RTSEmailNotifTemplate.getString().html, data);

		var today = new Date();
		var dateToday = moment(today).format("MMM D, YYYY");
		var subject = "[PRUShoppe] " + data.oir + " - " + data.rtsMaxScoreOnList + " Notification - " + dateToday;

		NotificationsHelper.sendEmail(from, to, subject, message, (r) =>{
			
		});
	}

	public static sendRequest(op: any, data: any, db: any, control: any) {
	
		return new Promise(function (resolve) {
			try {
				FiservController.getXmlRequest(op, data).then(function (xmlRequest) {

					var doc: any = {};

					doc.request = xmlRequest;
					doc.dateRequest = new Date().toISOString();
					doc.response = "";
					doc.dateResponse = "";

					db.create('rtslogs', doc, function (p) {
						Helper.log("UNIREQ REQUEST", doc);

						if (p.success) {

							var unireq = unirest("POST", process.env.FISERV_API_URL);
							
							if(unireq) {
								unireq.query({"op": op});

								unireq.headers({
									"cache-control": "no-cache",
									"Connection": "keep-alive",
									"Accept-Encoding": "gzip, deflate",
									"Host": process.env.FISERV_HOST,
									"Cache-Control": "no-cache",
									"Accept": "*/*",
									"Content-Type": "text/xml"
								});
								unireq.send(doc.request);
								unireq.end(function (result) {
									if (result.error) {
										var response = {
											isSuccess: false,
											success: false,
											status: "failed.rtsCall",
											message: result.error
										}
	
										Helper.log(op + " WLF RESPONSE", [data.customerId, response]);
										resolve(response);
									}
									else {
										Helper.log(op + " WLF RESPONSE", [data.customerId, result.body]);
	
										p.result.dateResponse = new Date().toISOString();
										p.result.response = result;
	
										db.update('rtslogs', p.result, function (p) { });
	
										//remove header
										var xmlResult = result.body.replace(/<\?xml.+\?>/, "");
										var jsonResult = xmlParser.toJson(xmlResult);
	
										resolve({
											success: true,
											status: 'success',
											message: jsonResult
										},);
	
									}
	
								});
							}
							else {
								Helper.log(op + " WLF ERROR ERROR", [data.customerId, p.message]);
								
								resolve({
									isSuccess: false,
									success: false,
									result: "unires.failed",
									endpoint: process.env.FISERV_HOST
								});
							}
						
						}
						else {
							Helper.log(op + " WLF ERROR", [data.customerId, p.message]);
							p.rtsId = "error" + data.rtsId;
							resolve(p);
						}

					});

				});
			}
			catch (error) {
				return {
					success: false,
					status: 'failed',
					message: error

				};
			}
		});
	}

	public static getXmlRequest(op: any, data: any) {
		let _this = this;
		return new Promise(function (resolve) {
			var username = "";
			var fiservPas = "";

			if (process.env.FISERV_AUTH_USERNAME_FILE) {
				username = fs.readFileSync(process.env.FISERV_AUTH_USERNAME_FILE, 'utf8');
				username = (username) ? username.trim() : "";
				
			} else {
				username = process.env.FISERV_AUTH_USERNAME;
			}

			if (process.env.FISERV_AUTH_PASSWORD_FILE) {
				fiservPas = fs.readFileSync(process.env.FISERV_AUTH_PASSWORD_FILE, 'utf8');
				fiservPas = (fiservPas) ? fiservPas.trim() : "";
			} else {
				fiservPas = process.env.FISERV_AUTH_PASSWORD;
			}

			// data.username = process.env.FISERV_AUTH_USERNAME;
			// data.password = process.env.FISERV_AUTH_PASSWORD;
			data.username = username;
			data.password = fiservPas;
			data.appId = process.env.FISERV_APPID || 'PRULifeYourTerm';
			data.fcrmProductId = process.env.FCRM_PRODUCT_ID || 'PLUK#X5499';

			var xmlTemplate = "";

			if (op == "RealtimeWLFScreening") {
				// data.countryCode = params.countryCode;
				// data.fullname = params.fullname;
				// data.birthday = params.birthday;

				xmlTemplate = reqTplRealtimeWSFScreening.getString().xml;
			}
			else if (op == "GetAlertStatus") {
				//we only need the rtsId and productId here
				//params are already defined 
				xmlTemplate = reqTplGetAlertStatus.getString().xml;
			}

			var xmlRequestData = Mustache.render(xmlTemplate, data);
			console.log(xmlRequestData);
			resolve(xmlRequestData);
		});
	}
}