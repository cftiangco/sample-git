
import { Handler } from './handler.interface';
import { AppHelper } from '../helpers/app.helper';
import { v4 as uuidv4 } from 'uuid';
import { CustomerHelper } from './utils/customer.helper';
import * as moment from 'moment';
import { PolicyHelper } from './utils/policy.helper';
import { PremiumHelper} from "../helpers/premium.helper";
/* CRIMSON */
import * as fs from 'fs';
const CreateCustomerValidation = JSON.parse(fs.readFileSync('/usr/src/app/json-data/createCustomerValidation.json','utf8'));
const UpdateCustomerValidation = JSON.parse(fs.readFileSync('/usr/src/app/json-data/updateCustomerValidation.json','utf8'));
/* CRIMSON */

export class CustomersHandler implements Handler{
    private static _instance: CustomersHandler;

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

    public static getInstance():CustomersHandler{
        if(CustomersHandler._instance==undefined){
            CustomersHandler._instance = new CustomersHandler();
        }
        return CustomersHandler._instance;
    }

    setupHandlers(){

        // https://prushoppe-api.prulifeuk.com.ph/api/customer/create        
        this.before('create', 'customers',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, flowback:Function, callback:Function) => {
                if(data){

                    let activity = {
                        controller: "CustomerController",
                        method: "createCustomer",
                        requestParams: data,
                        response: {}
                    };

                    user.activity = activity;

                    /* == INPUT VALIDATION == */
                    let vo: any = data;

                    let validator = conn.getValidator();
                    var vres =validator.validate(vo,CreateCustomerValidation);

                    if(!vres.valid) {
                        console.log(`ajv errors:`,vres);
                        let err = vres.errors.map((e) => e.schema.errorMessage ?? e.stack);
                        activity.response = { isSucces: false, success: false, message: 'create.failed', result: "there are missing(required) or invalid input customer data", errors:err};
                        AppHelper.log('CREATE CUSTOMER', activity );
                        callback(activity.response);
                        return;
                    }
                    /* == INPUT VALIDATION == */

                    if(data.hasOwnProperty('birthday')) { 
                        data.birthday = moment(new Date(data.birthday)).format("YYYY-MM-DD"); 
                    } 
                    if(data.hasOwnProperty('firstname') && data.firstname){
                        data.firstname = data.firstname.trim().toUpperCase();
                    }
                    if(data.hasOwnProperty('middlename') && data.middlename){
                        data.middlename = data.middlename.trim().toUpperCase();
                    }
                    if(data.hasOwnProperty('lastname') && data.lastname){
                        data.lastname = data.lastname.trim().toUpperCase();
                    }    
                    
                    if(data.hasOwnProperty('modeAmount') || data.hasOwnProperty('modeAnnualAmount')){
                        activity.response = {
                            customerId: "failed",
                            success: false,
                            message: "Plan amount fields are not allowed on this request.",
                            isSuccess: false,
                            status: "failed"
                        }

                        callback(activity.response);
                    }        
                    
                    if(data.birthday){
                        data.birthday = data.birthday.trim();
                    }

                    let paramsDedupe = {
                        firstname: data.firstname,
                        middlename: data.middlename,
                        lastname: data.lastname,
                        birthday: data.birthday.trim(),
                        isPaid: 'Yes'
                    };

                    conn.search('customers', paramsDedupe, (f: any) => {
                        if (f.result.length > 0) {
                            
                            activity.response = {
                                customerId: f.result[0].customerId,
                                success: true,
                                message: "Customer Already Exist.",
                                isAlreadyExist: "Yes",
                                rtsAction: "leadout",
                                isSuccess: true,
                                status: "success"
                            }

                            callback(activity.response);	
                            
                        } else {   
                            data._id = uuidv4();
                            data.customerId = data._id;

                            CustomerHelper.screenCustomer(data, conn, control).then((screening: any) => {
								
								data = CustomerHelper.initCustomer(data, data);
						
							    data.rtsResultRAW = JSON.stringify(screening);
								data.rtsMaxScoreOnList = screening.rtsMaxScoreOnList;
								data.rtsId = screening.rtsId;
								data.rtsAction = screening.rtsAction;
								data.rtsAttempts = screening.rtsAttempts; //set to 1, since this is where you create customer

								var birthdate = new Date(data.birthday);
								var tomorrow = moment(today).add(1, 'days').format("MM-DD");
								var birthday = moment(birthdate).format("MM-DD");
							
								if (birthday==tomorrow) {
									data.forNextDay = 'Yes';
                                    data.forNextDayDate = parseInt(moment(new Date()).add(1, 'days').format('x'));
								}

								var today = new Date;

								data.dateCreated = moment(today).format("YYYY-MM-DD");

								data.agentCode = process.env.DEFAULT_AGENT_CODE;
								data.agentName = process.env.DEFAULT_AGENT_NAME;

								data.isPaid = 'No';
								data.isPostedToFilenet = "";
								data.isPostedToLifeAsia = "";

                                //console.log("data before flowback:", data);

                                flowback();
                            }).catch((e)=>{
                                AppHelper.log("ERROR IN SCREENING", e);
                                callback({success:false, message:'call.failed'});
                            })
                        }
                    });               
                    
                }else{
                    callback({success:false, message:'call.failed'});
                }
            }
        );       

        this.after('create', 'customers',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, p:any, callback:Function) => {
                let activity = user.activity;

                if(p.success==true) {
                    activity.response = {
                        customerId: data.customerId,
                        success: true,
                        message: "Customer Created.",
                        isAlreadyExist: "No",
                        rtsAction: data.rtsAction,
                        isSuccess: true,
                        status: "success"
                    }
                }else{
                    activity.response = {
                        customerId: "",
                        success: false,
                        message: "customer creation failed",
                        isAlreadyExist: "No",
                        rtsAction: data.rtsAction,
                        isSuccess: false,
                        status: "failed"
                    }
                }	

                callback(activity.response);
            }
        );

        // https://prushoppe-api.prulifeuk.com.ph/api/customer/update
        this.before('update', 'customers',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, flowback:Function, callback:Function) => {
                
                if(data){
                    
                    /* == INPUT VALIDATION == */
                    let activity = {
                        controller: "CustomerController",
                        method: "updateCustomer",
                        requestParams: data,
                        response: {}
                    };
                    let vo: any = data;

                    let validator = conn.getValidator();
                    let vres =validator.validate(vo,UpdateCustomerValidation);

                    if(!vres.valid) {
                        console.log(`ajv errors:`,vres);
                        let err = vres.errors.map((e) => e.schema.errorMessage ?? e.stack);
                        activity.response = { isSucces: false, success: false, message: 'update.failed', result: "there are missing(required) or invalid input customer data", errors:err};
                        AppHelper.log('UPDATE CUSTOMER', activity );
                        callback(activity.response);
                        return;
                    }
                    /* == INPUT VALIDATION == */

                   PolicyHelper.validatePlan(data, (v)=>{
                        user.planValid = v.success;

                        if (!v.success) {
                            callback({isSuccess: false, success: false, message: "create.failed", result: "plan amount mismatch"});
                            return; 
                        }
                      
                        //re-inforce setting of plan amount
                        data = PolicyHelper.getSobData(data);

                        if(data.hasOwnProperty('customerId')){
                            data.id = data.customerId;
                        }

                        data.forNextDayDate = parseInt(moment(new Date()).add(1, 'days').format('x'));

                        if(data.hasOwnProperty('birthday')) { data.birthday = moment(new Date(data.birthday)).format("YYYY-MM-DD"); } 
                        if(data.hasOwnProperty('firstBeneBirthday')) { data.firstBeneBirthday = moment(new Date(data.firstBeneBirthday)).format("YYYY-MM-DD"); } 
                        if(data.hasOwnProperty('secondBeneBirthday')) { data.secondBeneBirthday = moment(new Date(data.secondBeneBirthday)).format("YYYY-MM-DD"); } 
                        if(data.hasOwnProperty('country')) { data.country = (data.country!="") ? data.country : "Philippines"; }
                        if(data.hasOwnProperty('occupation')) {
                            var occupation = data.occupation.split(",");
                            data.occupationName = occupation[1].trim();
                            data.occupationCode = occupation[0].trim();
                        }
            
                        if (data.hasOwnProperty('agentCode')) {
                            // if (data.agentCode.trim()!="") {
                                CustomerHelper.validateAgent(data.agentCode, (r) => {

                                    AppHelper.log("VALIDATE AGENT RESPONSE", r );

                                    data.agentCode = r.agentCode;
                                    data.agentName = r.agentName;
                                    // data.agentFirstName = r.agentFirstName;
                                    // data.agentLastName = r.agentLastName;
                                    data.agentStatus = r.agentStatus;

                                    AppHelper.log("Customer data before update customer flowback()!", data );
                                    flowback();
                                })
                            // }
                            // else {
                            //     AppHelper.log("AGENT CODE EMPTY!", data );
                            //     flowback();
                            // }
                        }
                        else {
                            AppHelper.log("NO AGENT CODE PROPERTY", data );
                            flowback();
                        }

                    });
                    
                }else{
                    AppHelper.log("CUSTOMER UPDATE", data );
                    callback({success:false, message:'update.failed', result: "data is required"});
                }
            }
        );

        this.after('update', 'customers',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, p:any, callback:Function) => {
                let activity = {
                    controller: "CustomerController",
                    method: "updateCustomer",
                    requestParams: {},
                    response: {
                        customerId: "",
                        success: false,
                        message: "",
                        agentStatus: "",
                        isSuccess: false,
                        status: "",
                        warnings: ""
                    }
                };

                if(p.success==true) {
                    let agentStatus = (p.result.agentStatus) ? p.result.agentStatus : 'default';
                    activity.response = {
                        customerId: data.customerId,
                        success: true,
                        message: "Customer Updated.",
                        agentStatus: agentStatus,
                        isSuccess: true,
                        status: "success",
                        warnings: ""
                    }
                }else{
                    activity.response = {
                        customerId: data.customerId,
                        success: false,
                        message: "customer update failed",
                        agentStatus: 'default',
                        isSuccess: false,
                        status: "failed",
                        warnings: ""
                    }
                }	

                // if(!user.planValid) {
                //     activity.response.warnings = "Plan amount submitted is not matched with the selected plan. Correct amount was applied.";
                // }

                callback(activity.response);
            }
        );        
    }
}