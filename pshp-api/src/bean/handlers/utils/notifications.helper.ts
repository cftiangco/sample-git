
import { AppHelper } from '../../helpers/app.helper';
import * as unirest  from 'unirest';

export class NotificationsHelper {

	public static sendSMS(customerId: any, mobileNumber: string, message: string, callback: Function) {

		try {
		
			var payload = {
				"appId": 'pruone-common',
				"topic": 'NOTIFICATION_TOPIC',
				"messages": {
					"action": 'sms',
					"payload": {
						"customerId": customerId,
						"mobileNumber": mobileNumber,
						"message": message
				   }
				}
			}
			
			var options = {
				url: process.env.KAFKA_PRODUCE_URL,
				headers: { "Content-Type": "application/json" },
				json: payload
			}

			unirest
			.post(options.url)
			.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
			.send(payload)
			.then((r) => {

				AppHelper.log("SMS RESPONSE", r.body );
				
				if(r.body.hasOwnProperty('error')) {
					callback({success: true, message: "sms:failed", result: "sms api error"});
				}
				else {
					var smsResponse = r.body;
					if (smsResponse.isSuccess) {
						callback({isSuccess: true, success: true, message: "sms:success", result: "sms sent"});
					}
					else {
						callback({isSuccess: false, success: false, message: "sms:failed", result: "sms api error"});
					}
				}

			})
			.catch(err => {
				var response = { isSucces: false, success: false, message: 'sms.failed', result: "sms api error" };
				AppHelper.log("SMS REQUEST ERROR", [response, err]);
				callback(response);
			});
		} catch (err) {
			AppHelper.log("SMS REQUEST ERROR", [payload, err] );
			callback({
				isSuccess: false,
				message: err
			});
		}	
	}

	public static sendEmail(from: string, to: string, subject: string, message: string, callback: Function) {
	
		try {
			var payload = {
				"from": from,
				"to": to,
				"cc": "",
				"subject": subject,
				"html": message
			}

			var options = {
				url: process.env.KAFKA_PRODUCE_URL,
				headers: { "Content-Type": "application/json" },
				json: {
					"appId": 'pruone-common',
					"topic": 'NOTIFICATION_TOPIC',
					"messages": {
						action: 'email',
						payload: payload
					}
				}
			}

			unirest
			.post(options.url)
			.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
			.send(payload)
			.then((r) => {
				
				if(r.body.hasOwnProperty('error')) {
					callback({success: true, message: "email:failed", result: "email api error"});
				}
				else {
					var smsResponse = r.body;
					if (smsResponse.isSuccess) {
						callback({isSuccess: true, success: true, message: "email:success", result: "email sent"});
					}
					else {
						callback({isSuccess: false, uccess: false, message: "email:failed", result: "email api error"});
					}
				}
			})
			.catch(err => {
				var response = { isSucces: false, success: false, message: 'email.failed', result: "email api error" };
				AppHelper.log("EMAIL REQUEST ERROR", [response, err]);
				callback(response);
			});

		} catch (err) {
			AppHelper.log("EMAIL ERROR", [to, subject, err] );
			callback({
				isSuccess: false,
				message: err
			});
		}
	}

}