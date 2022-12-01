import { AppHelper } from './app.helper';
import * as unirest  from 'unirest';
import * as dotenv from 'dotenv';
import { NotificationsHelper } from '../handlers/utils/notifications.helper';
import * as moment from 'moment';

dotenv.config();
export class DocsHelper {

	public static getDoc(db: any, id: any, docType: any, callback: Function) {
        if(id && id.indexOf('?')!=-1){
            id = id.split('?')[0];
        }
        db.search('customers', {customerId: id}, (p) => {

            let processDoc = (docType, customerData) => {
                DocsHelper.generateDoc(docType, customerData, (r) => {
                    if (r.body.isSuccess) {
                        var response =  {
                            contentType: 'application/pdf',
                            contentDisposition: 'inline',
                            buffer: Buffer.from(r.body.base64, 'base64')
                        };

                        callback(response);
                    }
                    else {
                        AppHelper.log(docType + " ERROR", [id, p] );
                        callback({ success:false, id: id, result: r.body});
                    } 
                });
            }

            if(p.success && p.result[0]) {
                if(docType!="sob" ) {
                    if(p.result[0].oir=="") {
                        db.search('oirs', {customerId: id}, (po) => {
                            if(po.success && po.result[0]) {
                                p.result[0].oir = po.result[0].id;
                                processDoc(docType, p.result[0]);
                            } else {
                                processDoc(docType, p.result[0]);
                            }
                        });
                    } else {
                        processDoc(docType, p.result[0]);
                    }
                } else {
                    processDoc(docType, p.result[0]);
                }
            } 
            else {
                AppHelper.log( docType + " ERROR", [ id, p] );
                callback({ success:false, id: id, result: p});
            }
            
        });


    }

    public static generateDoc(docType:string, data: any, callback: Function ) {
        
        data = DocsHelper.prepareData(data);

        let payload = {
            "productCode": process.env.API_PRUSHOPPE_PRODUCT_CODE,
            "docType": docType,
            "returnJson": true,
            "prushoppeData": data
        };

        var options = {
            url: process.env.API_GENERATEDOC_ENDPOINT,
            headers: {
                "Content-Type": "application/json"
            },
            json: payload
        }

        unirest
        .post(options.url)
        .headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
        .send(payload)
        .then((docgenResponse) => {
            callback(docgenResponse);
        })
        .catch(err => {
            var response = { body: { isSucces: false, success: false, message: 'doc.failed', result: "api error" }};
            AppHelper.log("GENERATEDOC RESPONSE", [err]);
            callback(response);
        });
    }

    public static smsDoc(data: any, docType: any, callback: Function) {

		try {
			docType = docType.toLowerCase();
			var pdfLink = process.env.BASE_API_URL + '/api/docs/policy/' + docType + '/' + data.customerId;
			var doc = "";

			if (docType == 'sob') { doc = "SUMMARY OF BENEFITS"; }
			if (docType == 'eapp') { doc = "eAPPLICATION"; }
			if (docType == 'tlic') { doc = "TEMPORARY LIFE INSURANCE CERTIFICATE"; }

			var message = "Hi " + data.firstname + ",\n\nHere is the download link for your PRULife Your Term's " + doc + ".\n\n" + "Click Here:\n" + pdfLink;

			NotificationsHelper.sendSMS(data.customerId, data.mobileno, message, (smsResp)=>{
				callback(smsResp);
			});
			
		} catch (err) {
			AppHelper.log("SMS DOC REQUEST ERROR", [docType, data.customerId, err] );
			callback({
				isSuccess: false,
				message: err
			});
		}
	}

    public static prepareData(data:any) {
        data.createdDate = data.hasOwnProperty('createdDate') ? moment(data.createdDate).format("YYYY-MM-DD") : data.createdDate;
        data.updatedDate = data.hasOwnProperty('updatedDate') ? moment(data.updateddDate).format("YYYY-MM-DD") : data.updatedDate;
        return data;
    }
}