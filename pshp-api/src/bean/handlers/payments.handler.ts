
import { Handler } from './handler.interface';
import { AppHelper } from '../helpers/app.helper';
import { v4 as uuidv4 } from 'uuid';
import { CustomerHelper } from './utils/customer.helper';
import * as moment from 'moment';
import * as unirest  from 'unirest';
import { NotificationsHelper } from './utils/notifications.helper';
import * as Mustache from 'mustache';
import * as fs from 'fs';
const RequiredFields = JSON.parse(fs.readFileSync('/usr/src/app/json-data/requiredFields.json','utf8'));

export class PaymentsHandler implements Handler{
    private static _instance: PaymentsHandler;

    beforeCalls: Object = {};
    afterCalls: Object = {};
    
    private constructor(){
        this.setupHandlers();
    }

    hasBefore(action: string, bean: string):boolean{
        return this.beforeCalls.hasOwnProperty(action+'::'+bean);
    }

    hasAfter(action: string, bean: string):boolean{
        return this.afterCalls.hasOwnProperty(action+'::'+bean);
    }  
    
    getBefore(action: string, bean: string):Function{
        return this.beforeCalls[action+'::'+bean];
    }

    getAfter(action: string, bean: string):Function{
        return this.afterCalls[action+'::'+bean];
    }     

    before(action:string, bean:string, handle:Function){
        this.beforeCalls[action+'::'+bean] = handle;
    }

    after(action:string, bean:string, handle:Function){
        this.afterCalls[action+'::'+bean] = handle;
    }

    public static getInstance():PaymentsHandler{
        if(PaymentsHandler._instance==undefined){
            PaymentsHandler._instance = new PaymentsHandler();
        }
        return PaymentsHandler._instance;
    }

    setupHandlers(){
        // https://prushoppe-api.prulifeuk.com.ph/api/payment/link 
        // { customerId }        
        this.before('create', 'payments',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, flowback:Function, callback:Function) => {
                let activity = {
                    controller: "PaymentController",
                    method: "getPaymentStatus",
                    requestParams: data,
                    response: {}
                };

                var isMobile = data.hasOwnProperty('$mode');
        
                if (data) {
        
                    if (data.customerId != null || data.customerId) {
                        conn.get('customers', data.customerId, (f) => {
                            AppHelper.log('PAYMENT LINK', data );
                            if (f.success && f.result.hasOwnProperty('customerId') > 0) {
                                let vo: any = f.result;

                                let validator = conn.getValidator();
                                var vres =validator.validate(vo, RequiredFields);

                                console.log("== CUSTOMER DATA VALIDATION", vres, vo);

                                if (vres.valid) {
        
                                    if(vo.hasOwnProperty('modeAmount')) {
                                        if (vo.rtsAction!='leadOut') 
                                        {
                                            let referenceNumber: string = uuidv4();
                                            let today: any = new Date;
                                            let amount = Number(vo.modeAmount.replace(/[^0-9\.]+/g,""));
                                                    
                                            let paymentRecord = {
                                                "isMobile": isMobile,
                                                "applicationName": process.env.API_PAYMENT_APPLICATION_NAME,
                                                "provider": process.env.API_PAYMENT_PROVIDER,		
                                                "transactionId": referenceNumber,
                                                "ccDetails": {
                                                        "itemName" : "PRULink Assurance Account Plus",
                                                        "quantity" : "1",
                                                        "amount": amount,
                                                        "firstName" : vo.firstname,
                                                        "lastName": vo.lastname,
                                                        "middleName" : vo.middlename,
                                                        "address1": vo.presentAddress,
                                                        "address2": "",
                                                        "city": vo.presentLocation,
                                                        "state": "MM",
                                                        "country": "PH",
                                                        "zip": vo.presentZipcode,
                                                        "email" : vo.email,
                                                        "phone" : "",
                                                        "mobile" : vo.mobileno,
                                                        "clientIp": "",
                                                        "totalAmount": amount,
                                                        "currency": "PHP"
                                                    },
                                                "result": {},
                                                "requestDate" : today,
                                                "requestCount" : "",
                                                "overwriteExistingRequest" : true,
                                                "notification" : {}
                                            };
            
                                            var options = {
                                                url: process.env.API_PAYMENT_LINK_ENDPOINT,
                                                headers: {
                                                    "Content-Type": "application/json"
                                                },
                                                json: paymentRecord
                                            }

                                            unirest
                                            .post(options.url)
                                            .headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
                                            .send(paymentRecord)
                                            .then((paymentResponse) => {

                                                vo.orderId = paymentResponse.body.result.orderId;
                                                vo.transactionState = "TEMPLATE";

                                                conn.update('customers', vo, (s)=>{
                                                    //do post procesing here from asaian
                                                })

                                                processPaymentResponse(conn, paymentRecord, paymentResponse.body, function(paymentAPIResponse){
                                                    callback(paymentAPIResponse);
                                                });

                                            })
                                            .catch(err => {
            
                                                activity.response = { isSucces: false, success: false, message: 'payment.failed', result: "payment api error" };
                                                AppHelper.log("PAYMENT RESPONSE", [activity, err]);
                                                callback(activity.response);
                                            });

                                            let processPaymentResponse = (db: any, paymentRecord: any, paymentResponse: any, callback: Function ) => {
                                                AppHelper.log("PAYMENT RESPONSE", paymentResponse);
                                            
                                                var actResponse = JSON.parse(JSON.stringify(paymentResponse));
                                                activity.response = {...actResponse, transactionValues:[]};
                                    
                                                paymentResponse.success = paymentResponse.isSuccess;
                                                if (paymentResponse.isSuccess) {
                                                    paymentResponse.message = 'payment.success';
                                                    activity.response = paymentResponse;
                                    
                                                    //Step 3. save payment data 
                                                    paymentRecord._id = paymentResponse.result.orderId;
                                                    
                                                    paymentRecord.customerId = data.customerId;
                                                    paymentRecord.statusResponse = "";
                                                    paymentRecord.transactionState = "TEMPLATE";
                                                    paymentRecord.paymentUrl = paymentResponse.result.url;
                                                    paymentRecord.orderId =  paymentResponse.result.orderId;
                                                    paymentRecord.transactionId =  paymentResponse.result.transactionId;
                                                    paymentRecord.transactionValues = [];
                                
                                                    if(paymentRecord.isMobile) {
                                                        var smsTemplate = `Hi {{firstname}}, \n\nThank you for your interest on PRULife Your Term packages.\n\nPlease continue your application process and pay\n\nPHP {{amount}}\n\n through this link:\n\n{{paymentLink}} `;
                                    
                                                        var smsData = {
                                                            firstname : paymentRecord.ccDetails.firstName,
                                                            lastname : paymentRecord.ccDetails.lastName,
                                                            amount: AppHelper.toPeso(paymentRecord.ccDetails.amount),
                                                            paymentLink: paymentResponse.result.url
                                                        }
                                    
                                                        var smsMessage = Mustache.render(smsTemplate, smsData);
                                    
                                                        NotificationsHelper.sendSMS(data.customerId, paymentRecord.ccDetails.mobile, smsMessage, (sms) => {
                                                            AppHelper.log("SMS SEND ", sms );
                                                        });
                                                    }
                                                
                                                } else {
                                                    paymentResponse.message = 'payment.failed';
                                                }
                            
                                                for(let i in data){
                                                    delete data[i];
                                                }
                            
                                                data['transactionValues'] = [];
                            
                                                for(let i in paymentRecord){
                                                    data[i] = paymentRecord[i];
                                                }
                            
                                                user.activity = activity;
                                                flowback();
                                            } 
                                        
                                        }
                                        else {
                                            activity.response = { isSucces: false, success: false, message: 'payment.failed', result: "missing parameters"  };
                                            AppHelper.log('PAYMENT LINK', activity );
                                            callback(activity.response);
                                        }
                                    } else {
                                        activity.response = { isSucces: false, success: false, message: 'payment.failed', result: "Invalid amount" };
                                        AppHelper.log('PAYMENT LINK', activity );
                                        callback(activity.response);
                                    }
                                }
                                else {
                                    activity.response = { isSucces: false, success: false, message: 'payment.failed', result: "there are missing(required) customer data" };
                                    AppHelper.log('PAYMENT LINK', activity );
                                    callback(activity.response);
                                }

                            } else {
                                activity.response = { isSucces: false, success: false, message: 'payment.failed', result: "customer needs further verification." };
                                AppHelper.log('PAYMENT LINK', activity );
                                callback(activity.response);
                            }
                        });
        
                    } else {
                        activity.response = { isSucces: false, success: false, message: 'payment.failed', result: "missing parameters"  };
                        AppHelper.log('PAYMENT LINK', activity );
                        callback(activity);
                    }
                } else {
                    activity.response = { isSucces: false, success: false, message: 'payment.failed', result: "parameter error"  };
                    AppHelper.log('PAYMENT LINK', activity );
                    callback(activity);
                }
        
                       
            }
        );       

        this.after('create', 'payments',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, p:any, callback:Function) => {
                let activity = user.activity;

                if(p.success==true) {
                    AppHelper.log('PAYMENT LINK', activity);
                    callback(activity.response);
                }else{
                    activity.response = { isSucces: false, success: false, message: 'payment.failed', result: "save error"  };
                    callback(activity.response);
                }	
            }
        );

        // https://prushoppe-api.prulifeuk.com.ph/api/payment/status
        // { orderId }        
        this.before('search', 'payments',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, flowback:Function, callback:Function) => {
                let activity = {
                    controller: "PaymentController",
                    method: "getPaymentStatus",
                    requestParams: data,
                    response: {}
                };
                
                try {
                    if (data) {
                        
                        if (data.orderId != null || data.hasOwnProperty('orderId')) {
                            
                            conn.get('payments', data.orderId, (p) => {
                                AppHelper.log("DB RESPONSE", p);
                        
                                if (p.success && p.result != null) {
                                    let payment: any = p.result;
        
                                    let paymentData = {
                                        "orderId": payment.orderId,
                                        "currency": "PHP",
                                        "application": process.env.API_PAYMENT_APPLICATION_NAME
                                    }
        
                                    let options: any = {
                                        url: process.env.API_PAYMENT_STATUS_ENDPOINT,
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
                                             processPaymentResponse(conn, payment, statusResponse.body, function(paymentResponse){
                                                callback(paymentResponse);
                                            });
                                        
                                        })
                                        .catch(err => {    
                                            activity.response = { isSucces: false, success: false, message: 'payment.failed', result: "payment api error" };
                                            AppHelper.log("PAYMENT RESPONSE", [activity, err]);
                                            callback(activity.response);
                                        });
        
                                }
                                else {
                                    activity.response = { isSucces: false, success: false, message: 'payment.failed', result: "order not found" };
                                    AppHelper.log("PAYMENT RESPONSE", activity);
                                    callback(activity.response);
                                }
                            });
                        } 
                        else {
                            activity.response= { isSucces: false, success: false, message: 'status.failed', result: 'order not found.' };
                            AppHelper.log('PAYMENT STATUS', activity);
                            callback(activity.response);
                        }
        
                    } else {
                        activity.response= { isSucces: false, success: false, message: 'status.failed', result: 'order not found.' };
                        AppHelper.log('PAYMENT STATUS', activity);
                        callback(activity.response);
                    }
                }
                catch (e: any){
                    activity.response = e;
                    activity.response["isSuccess"] = false;
                    AppHelper.log('PAYMENT STATUS', activity);
                    callback(activity.response);
                }
        
                let processPaymentResponse = (db:any, payment:any, statusResponse:any,  callback: Function ) => {
                
                    activity.response = JSON.parse(JSON.stringify(statusResponse));
        
                    let status: any = statusResponse.result;
                    let transaction: any = status.transactionValues.pop();

                    if ( (transaction!=null) && (transaction.hasOwnProperty('transactionState'))) {

                        var resp = {
                            isSuccess: true,
                            success: true,
                            result: {
                                orderId: transaction.orderId,
                                transactionValues: [{
                                    transactionState: transaction.transactionState
                                }]
                            }
                        }

                        if (payment.transactionState != transaction.transactionState){
                            
                            payment.transactionState = transaction.transactionState;
                            payment.transactionValues.push(transaction);

                            db.update('payments',  payment, (pr: any) =>{

                                AppHelper.log("PAYMENT STATUS PAYMENT UPDATE: ", pr);
                                
                                if(pr.success) {
                                    db.search('customers', {customerId: payment.customerId}, (c: any) => {
                                        
                                        // console.log("CUSTOMER RETRIEVED:", c);
                                        
                                        if (c.success && c.result.length>0) {
                                            let customer: any = c.result[0];
                                            c.transactionState = payment.transactionState;
            
                                            db.update('customers', customer, (uc: any)=>{
            
                                                // console.log("CUSTOMER UPDATE RESPONSE:", uc);
            
                                                if(uc.success) {
                                                    AppHelper.log('PAYMENT STATUS', activity);
                                                    callback(resp);
                                                    
                                                    if (payment.transactionState == 'CAPTURED') {
                                                        db.query('get-workflow-payload', {"customerId": customer.customerId}, function(pd:any){
                                                            if(pd.success && !pd.result.length) {
                                                                CustomerHelper.createPolicy (db, control, customer, (cp: any) => {
                                                                    //do post processing if needed
                                                                    AppHelper.log("CREATE POLICY RESPONSE", cp);
                                                                });
                                                            }
                                                        });
                                                     }
            
                                                } else {
                                                    console.log(new Date(), " PAYMENT STATUS ERROR: ", uc );
                                                    activity.response = { isSucces: false, success: false, message: 'status.failed', result: 'failed to save customer record.', others: uc };
                                                    AppHelper.log('PAYMENT STATUS', activity);
                                                    callback(activity.response);
                                                }
                                            });
                                        }
                                        else {
                                            console.log(new Date(), " PAYMENT STATUS ERROR: ", pr );
                                            activity.response = { isSucces: false, success: false, message: 'status.failed', result: '[1] customer not found.' };
                                            AppHelper.log('PAYMENT STATUS', activity);
                                            callback(activity.response);					
                                        }
                                    }); 
            
                                }else{
                                    activity.response = { isSucces: false, success: false, message: 'status.failed', result: '[2] customer not found.' };
                                    AppHelper.log('PAYMENT STATUS', activity);
                                    callback(activity.response);		                                
                                }
                            });
                        }
                        else {
                            callback(resp);
                        }

                    }
                    else {
                        activity.response = { isSucces: false, success: false, message: 'status.failed', result: 'order not found.' };
                        AppHelper.log('PAYMENT STATUS', activity);
                        callback(activity.response);
                    }
        
                }
            }
        );        
    }
}
