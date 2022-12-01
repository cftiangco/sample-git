import { AppHelper, AppHelper as Helper } from '../../helpers/app.helper';
import * as moment from 'moment-timezone';
import { AppController } from 'src/app.controller';
import * as unirest  from 'unirest';

export class WorkflowHelper {

    public static startWF(wfdata: any, control: any, db: any) {
        
        return new Promise<Object>(async (resolve, reject) => { 
            try {
             
                let data = wfdata.payload;
                let requestPayload: any = {
                    processDefKey: process.env.PROCESS_DEF_KEY || 'fullintegration-PRUSHOPPE',
                    variables: {}
                    
                };

                let riders: any =  await WorkflowHelper.getRiders(data.quotation.result.riders);
          
                let beneficiary = [];
                if(data.hasOwnProperty("beneficiary")){
                    let basic: any = [];
                    let payor: Array<any> = [];
                    
                    if(data.policyHolder.assured){
                        if(data.beneficiary.hasOwnProperty("basicPlan")){
                            basic = await WorkflowHelper.getBeneficiaries(data.beneficiary.basicPlan, data.assured.phoneCountryCode,
                                data.assured.mobileCountryCode, data.assured.phone, data.assured.mobile,
                                data.assured.country, data.assured.address, data.assured.zipcode, data.assured.email, 
                                data.assured.additionalPersonalInformation.civilStatus, data.assured.workPay.occupations[0].occupation, data.assured.name, 
                                data.assured.dateOfBirth, data.assured.gender, true);
                                
                        }
                        if(data.beneficiary.hasOwnProperty("payorTermOrWaiver")){
                            payor.push(await WorkflowHelper.getBeneficiaries(data.beneficiary.payorTermOrWaiver, data.assured.phoneCountryCode,
                                data.assured.mobileCountryCode, data.assured.phone, data.assured.mobile,
                                data.assured.country, data.assured.address, data.assured.zipcode, data.assured.email, 
                                data.assured.additionalPersonalInformation.civilStatus, data.assured.workPay.occupations[0].occupation, data.assured.name, 
                                data.assured.dateOfBirth, data.assured.gender, false));
                        }
                        
                    }else {
                        if(data.beneficiary.hasOwnProperty("basicPlan")){
                            basic = await WorkflowHelper.getBeneficiaries(data.beneficiary.basicPlan, data.policyHolder.phoneCountryCode,
                                data.policyHolder.mobileCountryCode, data.policyHolder.phone, data.policyHolder.mobile,
                                data.policyHolder.country, data.policyHolder.address, data.policyHolder.zipcode, data.policyHolder.email, 
                                data.policyHolder.additionalPersonalInformation.civilStatus, data.policyHolder.workPay.occupations[0].occupation, data.policyHolder.name, 
                                data.policyHolder.dateOfBirth, data.policyHolder.gender, true);
                        }
                        if(data.beneficiary.hasOwnProperty("payorTermOrWaiver")){
                            payor.push(await WorkflowHelper.getBeneficiaries(data.beneficiary.payorTermOrWaiver, data.policyHolder.phoneCountryCode,
                                data.policyHolder.mobileCountryCode, data.policyHolder.phone, data.policyHolder.mobile,
                                data.policyHolder.country, data.policyHolder.address, data.policyHolder.zipcode, data.policyHolder.email, 
                                data.policyHolder.additionalPersonalInformation.civilStatus, data.policyHolder.workPay.occupations[0].occupation, data.policyHolder.name, 
                                data.policyHolder.dateOfBirth, data.policyHolder.gender, false));
                            
                        }
                        
                    }
                    beneficiary = basic.concat(payor);
                    // console.log("BASIC: ", basic);
                    
                }
                // make it a function/helper
                var productCode = "";
                if (data.product.hasOwnProperty("planCode")) {
                    productCode = ((typeof data.product.planCode == 'string') ? data.product.planCode.toUpperCase(): data.product.planCode.code.toUpperCase())
                    //append period if kasama talaga
                    let period = ""
                    if(productCode != "PRUM" && productCode != "PIA" && productCode != "PYT" 
                    && productCode != "PAA" && productCode != "PA"  && productCode != "CA20") {
                        if(data.quotation.hasOwnProperty("period")) {
                            if((typeof data.quotation.period) == "string"){
                                period = " " + data.quotation.period;
                            }
                            if((typeof data.quotation.period) == "object") {
                                period = " " + data.quotation.period.code;
                            }
                        }
                    }
                    productCode = productCode+period;
                }
                
                if(data.hasOwnProperty("policyHolder")) {
                    if(data.policyHolder.hasOwnProperty("assured")) {
                        if(data.policyHolder.assured) {
                            console.log('ASSURED!');
                            requestPayload.variables = {
                                "insured":{ 
                                    "presentCountry":((typeof data.assured.country) == "string") ? data.assured.country.toUpperCase() : data.assured.country.name.toUpperCase(),
                                    "permanentCountry": ((typeof data.assured.additionalPersonalInformation.countryPermanent) == "string") ? data.assured.additionalPersonalInformation.countryPermanent.toUpperCase() : data.assured.additionalPersonalInformation.countryPermanent.name.toUpperCase(),
                                    "birthCountry": ((typeof data.assured.additionalPersonalInformation.birthCountry) == "string") ? data.assured.additionalPersonalInformation.birthCountry.toUpperCase() : data.assured.additionalPersonalInformation.birthCountry.name.toUpperCase(),
                                    "businessCountry": ((data.assured.workPay.occupations[0].employment.toUpperCase() == "NOTEMPLOYED") || (data.assured.workPay.occupations[0].employment.toUpperCase() == "NOT EMPLOYED") ? "": data.assured.workPay.occupations[0].countryBusiness.name.toUpperCase()), //check if employed
                                    "salutation": data.assured.name.title.name.toUpperCase(),
                                    "civilStatus": data.assured.additionalPersonalInformation.civilStatus.name.toUpperCase(),
                                    "occupation": ((typeof data.assured.workPay.occupations[0].occupation) == "string") ? data.assured.workPay.occupations[0].occupation.toUpperCase() : data.assured.workPay.occupations[0].occupation.name.toUpperCase(),
                                    "mobileCountryCode": data.assured.mobileCountryCode.code.toUpperCase(),
                                    "phoneCountryCode": data.assured.phoneCountryCode.code.toUpperCase(),
                                    "nationality": data.assured.additionalPersonalInformation.nationality.name.toUpperCase(),
                                    "firstName": data.assured.name.first,
                                    "lastName": data.assured.name.last
                                },
                                "policyHolder":{ 
                                    "presentCountry": ((typeof data.assured.country) == "string") ? data.assured.country.toUpperCase() : data.assured.country.name.toUpperCase(),
                                    "permanentCountry": ((typeof data.assured.additionalPersonalInformation.countryPermanent) == "string") ?  data.assured.additionalPersonalInformation.countryPermanent.toUpperCase() : data.assured.additionalPersonalInformation.countryPermanent.name.toUpperCase(),
                                    "birthCountry": (( typeof data.assured.additionalPersonalInformation.birthCountry) == "string") ? data.assured.additionalPersonalInformation.birthCountry.toUpperCase() : data.assured.additionalPersonalInformation.birthCountry.name.toUpperCase(),
                                    "businessCountry": ((data.assured.workPay.occupations[0].employment.toUpperCase() == "NOTEMPLOYED") || (data.assured.workPay.occupations[0].employment.toUpperCase() == "NOT EMPLOYED") ? "": data.assured.workPay.occupations[0].countryBusiness.name.toUpperCase()), //check if employed
                                    "salutation": data.assured.name.title.name.toUpperCase(),
                                    "civilStatus": data.assured.additionalPersonalInformation.civilStatus.name.toUpperCase(),
                                    "occupation": ((typeof data.assured.workPay.occupations[0].occupation) == "string") ? data.assured.workPay.occupations[0].occupation.toUpperCase() : data.assured.workPay.occupations[0].occupation.name.toUpperCase(),
                                    "mobileCountryCode": data.assured.mobileCountryCode.code.toUpperCase(),
                                    "phoneCountryCode": data.assured.phoneCountryCode.code.toUpperCase(),
                                    "nationality": data.assured.additionalPersonalInformation.nationality.name.toUpperCase(),
                                    "firstName": data.assured.name.first,
                                    "lastName": data.assured.name.last
                                },
                                "payloadId": data.id, //not uppercase
                                "agentProfile": {
                                    "code":  data.agentProfile.code //not uppercase
                                },
                                "productCode": productCode,
                                "paymentMethod": data.quotation.payment.method.toUpperCase(),
                                "orderId": data.quotation.payment.orderId, //not uppercase
                                "currency": data.quotation.currency.toUpperCase(), 
                                "applicationName": data.applicationName.toUpperCase(),
                                "beneficiary": beneficiary,
                                "noBeneficiary": beneficiary.length,
                                "noRider": riders.length,
                                "riders": riders,
                                "paymentMode": (data.quotation.payVariant.toUpperCase() == "SINGLE" ? data.quotation.payVariant.toUpperCase() :data.quotation.paymentMode.name.toUpperCase()),
                                "paymentMethodRecurring": "CASH",
                                "isSamePolicyholderAndInsured": data.policyHolder.assured,
                                "totalAnnualPremiumAmount": data.quotation.result.totalAnnualPremiumAmount
                            }
                            
                        }
                        else {
                            console.log('POlicyHolder!');
                            requestPayload.variables = {
                                "insured":{ 
                                    "presentCountry": ((typeof data.assured.country) == "string") ? data.assured.country.toUpperCase() : data.assured.country.name.toUpperCase(),
                                    "permanentCountry": ((typeof data.assured.additionalPersonalInformation.countryPermanent) == "string") ?  data.assured.additionalPersonalInformation.countryPermanent.toUpperCase() : data.assured.additionalPersonalInformation.countryPermanent.name.toUpperCase(),
                                    "birthCountry": (( typeof data.assured.additionalPersonalInformation.birthCountry) == "string") ? data.assured.additionalPersonalInformation.birthCountry.toUpperCase() : data.assured.additionalPersonalInformation.birthCountry.name.toUpperCase(),
                                    "businessCountry": ((data.assured.workPay.occupations[0].employment.toUpperCase() == "NOTEMPLOYED") || (data.assured.workPay.occupations[0].employment.toUpperCase() == "NOT EMPLOYED") ? "": data.assured.workPay.occupations[0].countryBusiness.name.toUpperCase()), //check if employed
                                    "salutation": data.assured.name.title.name.toUpperCase(),
                                    "civilStatus": data.assured.additionalPersonalInformation.civilStatus.name.toUpperCase(),
                                    "occupation": ((typeof data.assured.workPay.occupations[0].occupation) == "string") ? data.assured.workPay.occupations[0].occupation.toUpperCase() : data.assured.workPay.occupations[0].occupation.name.toUpperCase(),
                                    "mobileCountryCode": data.assured.mobileCountryCode.code.toUpperCase(),
                                    "phoneCountryCode": data.assured.phoneCountryCode.code.toUpperCase(),
                                    "nationality": data.assured.additionalPersonalInformation.nationality.name.toUpperCase(),
                                    "firstName": data.assured.name.first,
                                    "lastName": data.assured.name.last
                                },
                                "policyHolder":{ 
                                    "presentCountry": ((typeof data.policyHolder.country) == "string") ? data.policyHolder.country.toUpperCase() : data.policyHolder.country.name.toUpperCase(),
                                    "permanentCountry": ((typeof data.policyHolder.additionalPersonalInformation.countryPermanent) == "string") ?  data.policyHolder.additionalPersonalInformation.countryPermanent.toUpperCase() : data.policyHolder.additionalPersonalInformation.countryPermanent.name.toUpperCase(),
                                    "birthCountry": ((typeof data.policyHolder.additionalPersonalInformation.birthCountry) == "string") ? data.policyHolder.additionalPersonalInformation.birthCountry.toUpperCase() : data.policyHolder.additionalPersonalInformation.birthCountry.name.toUpperCase(),
                                    "businessCountry": ((data.policyHolder.workPay.occupations[0].employment.toUpperCase() == "NOTEMPLOYED") || (data.policyHolder.workPay.occupations[0].employment.toUpperCase() == "NOT EMPLOYED") ? "": data.policyHolder.workPay.occupations[0].countryBusiness.name.toUpperCase()), //check if employed
                                    "salutation": data.policyHolder.name.title.name.toUpperCase(),
                                    "civilStatus": data.policyHolder.additionalPersonalInformation.civilStatus.name.toUpperCase(),
                                    "occupation": ((typeof data.policyHolder.workPay.occupations[0].occupation) == "string") ? data.policyHolder.workPay.occupations[0].occupation.toUpperCase() : data.policyHolder.workPay.occupations[0].occupation.name.toUpperCase(),
                                    "mobileCountryCode": data.policyHolder.mobileCountryCode.code.toUpperCase(),
                                    "phoneCountryCode": data.policyHolder.phoneCountryCode.code.toUpperCase(),
                                    "nationality": data.policyHolder.additionalPersonalInformation.nationality.name.toUpperCase(),
                                    "firstName": data.policyHolder.name.first,
                                    "lastName": data.policyHolder.name.last
                                },
                                "payloadId": data.id, //not uppercase
                                "agentProfile": {
                                    "code":  data.agentProfile.code //not uppercase
                                },
                                "productCode": productCode, //+ data.product.period.code.toString(),
                                "paymentMethod": data.quotation.payment.method.toUpperCase(),
                                "orderId": data.quotation.payment.orderId, //not uppercase
                                "currency": data.quotation.currency.toUpperCase(),
                                "applicationName": data.applicationName.toUpperCase(),
                                "beneficiary": beneficiary,
                                "noBeneficiary": beneficiary.length,
                                "noRider": riders.length,
                                "riders": riders,
                                "paymentMode": (data.quotation.payVariant.toUpperCase() == "SINGLE" ? data.quotation.payVariant.toUpperCase() :data.quotation.paymentMode.name.toUpperCase()) ,
                                "paymentMethodRecurring": "CASH",
                                "isSamePolicyholderAndInsured": data.policyHolder.assured,
                                "totalAnnualPremiumAmount": data.quotation.result.totalAnnualPremiumAmount
                            }
                            
                        }
        
                        if(data.assured.hasOwnProperty("additionalPersonalInformation")) {
                            console.log('additionalPersonalInformation!');
                            requestPayload.variables.haveBeneficialOwner = data.assured.additionalPersonalInformation.haveBeneficialOwner;
                            if(data.assured.additionalPersonalInformation.hasOwnProperty("haveBeneficialOwner") && 
                                    data.assured.additionalPersonalInformation.haveBeneficialOwner) {
                                var beneOwner = data.assured.additionalPersonalInformation.beneficialOwner;
                                requestPayload.variables.beneficialOwner = {
                                    "presentCountry": beneOwner.country.name.toUpperCase(),
                                    "permanentCountry": beneOwner.countryPermanent.name.toUpperCase(),
                                    "birthCountry": beneOwner.birthCountry.name.toUpperCase(),
                                    "businessCountry": ((beneOwner.employment.toUpperCase() == "NOTEMPLOYED") || (beneOwner.employment.toUpperCase() == "NOT EMPLOYED")) ? "" : beneOwner.countryBusiness.name.toUpperCase(),
                                    "salutation": beneOwner.title.name.toUpperCase(),
                                    "civilStatus": beneOwner.civilStatus.name.toUpperCase(),
                                    "occupation": ((typeof beneOwner.occupation) == "string") ? beneOwner.occupation.toUpperCase(): beneOwner.occupation.name.toUpperCase(),
                                    "mobileCountryCode": beneOwner.mobileCountryCode.code.toUpperCase(),
                                    "phoneCountryCode": beneOwner.phoneCountryCode.code.toUpperCase(),
                                    "nationality": beneOwner.nationality.name.toUpperCase(),
                                    "firstName": beneOwner.name.first,
                                    "lastName": beneOwner.name.last
                                }  
        
                                
                            }
                    
                        }
                    }
                }
                if(data.hasOwnProperty("applicationNo")){
                    requestPayload.variables.applicationNo = {
                        result: {
                            applicationNo: data.applicationNo
                        }
                    }
                }
                
                
                //console.log("REQ PAYLOAD: ", requestPayload.variables)
                //default
                requestPayload.variables.forNextBusinessDay = false
                requestPayload.variables.autoIssue = process.env.AUTOISSUE || false;
            
                var validDays = process.env.VALID_DAYS || "1,2,3,4,5";
                var arrayOfValidDays = validDays.split(",");
                var validStartTime = WorkflowHelper.setDateTime(process.env.VALID_START_HOUR || 6, process.env.VALID_START_MINUTE || 0, process.env.VALID_START_SECOND || 0);
                var validEndTime = WorkflowHelper.setDateTime(process.env.VALID_END_HOUR || 21, process.env.VALID_END_MINUTE || 30, process.env.VALID_END_SECOND || 0);
                var getDateTimeInGMT8 = moment().tz('Asia/Manila');
                if(arrayOfValidDays.indexOf(getDateTimeInGMT8.get("day").toString()) > -1) {
                    if(!(getDateTimeInGMT8.isBetween(validStartTime, validEndTime))) {
                        requestPayload.variables.forNextBusinessDay = true
                        console.log("forNextBusinessDay = true1");
                    } 
                }
                else { //assumes saturday and sunday
                    console.log("forNextBusinessDay = true2");
                    requestPayload.variables.forNextBusinessDay = true
                }
            
                requestPayload.variables.agentName = data.agentProfile.name;
                requestPayload.variables.agentCode = data.agentProfile.code;
                requestPayload.variables.agentBranch = data.agentProfile.branch.name;
                requestPayload.variables.agentBranchCode = data.agentProfile.branch.code;
                requestPayload.variables.initialPaymentMethod = data.quotation.initialPaymentMethod.code;
                requestPayload.variables.sumAssured = data.quotation.insuredAmount;
                let totalAmt = (!(typeof data.quotation.result.totalModalPremiumAmount == 'string')) ? 
                data.quotation.result.totalModalPremiumAmount.toFixed(2).toString() : data.quotation.result.totalModalPremiumAmount;
                requestPayload.variables.totalAPE = totalAmt;
               
                
                let payloadForSearch = {
                    "page": 1,
                    "limit": 1,
                    "searchBy": "payloadId",
                    "searchValue": data.id
                }

                const options = {
                    url: process.env.PRUONE_GET_TASK_WORKFLOW_URL || "http://ps-workflow:12009/query/all/variables/searchTask",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    json: payloadForSearch
                };

                 unirest
                .post(options.url)
                .headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
                .send(payloadForSearch)
                .then(async (sr)  => {

                    let wfResp = sr.body;
                    AppHelper.log("WORKFLOW SEARCH RESPONSE", wfResp );
          
                    let workflowDataBucketModel = {
                        "_id": data.id,
                        "id": data.id,
                        "workflow": {},
                        "transform": {}
                    }

                    db.bucket = await db.cluster.openBucket(process.env.WORKFLOW_BUCKET);                  
                    db.create('workflow-data', workflowDataBucketModel, (dbResp) => { 
                        console.log("DB CREATE RESP: ", dbResp);
                        if(dbResp.success) {

                            const options = {
                                url: process.env.WORKFLOW_START_URL,
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                json: requestPayload
                            };

                            unirest
                                .post(options.url)
                                .headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
                                .send(requestPayload)
                                .then((wfr) => {
                                    //AppHelper.log("WORKFLOW START RAW RESPONSE", wfr );
                                    let wfStartResp = wfr.body;
                                    AppHelper.log("WF START RESP: ", wfStartResp);
                                    resolve(wfStartResp);
                                })
                                .catch(err => {
                                    var response = { isSucces: false, success: false, message: 'workflow.failed', result: "workflow api error" };
                                    AppHelper.log("SMS REQUEST ERROR", [response, err]);
                                    resolve(response);
                                });

    
                        } else { 
                            console.log("DB RESP FAILED: ", dbResp); 
                            resolve({
                                isSuccess: false,
                                message: dbResp
                            })
                        }     
                    });

                })
                .catch(err => {
                    var response = { isSucces: false, success: false, message: 'sms.failed', result: "sms api error" };
                    AppHelper.log("SMS REQUEST ERROR", [response, err]);
                    resolve(response);
                });
                
                AppHelper.log('WORKFLOW EXECUTED!!', "");               
            }
            catch(e) {
                AppHelper.log('WORKFLOW EXECUTION ERR!!:', e);  
            
                resolve({
                    isSuccess: false,
                    message: e
                })
            }
        });
        
    }

    private static getRiders (val: any) {
        return new Promise<Object>(async (res, rej) => { 
            try { 
                let temp: any = [];
                if(!(typeof val === 'undefined') && val != null) {
        
                    if(val.constructor === Array) {
                        temp = val;
                        res (temp);
                    } else {
                        temp = Object.keys(val).map(key => {
                            val[key].code = key;
                            return val[key];
                        });
                        res (temp);
                    }
                }
            } catch (e) {
                res(e)
            }
        });

    }

    private static getBeneficiaries (val: any, phoneCountryCode: any, mobileCountryCode: any, phone: any, mobile: string, country: any,
         address: string, zipcode: string, email: string, civilStatus: any, occupation: any, ownerName: any, ownerDate: string, ownerGender: string, isBasic: any) {
        return new Promise<Object>(async (res, rej) => {  
            try {
                let temp:any[] = [];
                if((typeof country) == "string") {
                    country = {
                        name : country
                    }
                }
        
                if((typeof occupation) == "string") {
                    occupation = {
                        name : country
                    }
                }
        
                if(!(typeof val === 'undefined') && val != null){
                    if(val.constructor === Array){
                        temp = val;
                    }
                    else{
                        temp = Object.keys(val).map(key => {
                            var ownerSameAsBene = false;
                            if(isBasic == true || isBasic == "true") val[key].type = "BASIC"
                            else val[key].type = "PAYOR"
        
                            if(val[key].hasOwnProperty("countryOfBirth"))val[key].birthCountry = val[key].countryOfBirth.name.toUpperCase();
                            if(val[key].hasOwnProperty("nationality"))val[key].nationality = val[key].nationality.name.toUpperCase();
                            if(val[key].hasOwnProperty("name")){
                                if(val[key].name.hasOwnProperty("title"))val[key].salutation = val[key].name.title.name.toUpperCase();
                                
                                if(val[key].name.hasOwnProperty("last") && 
                                   val[key].name.hasOwnProperty("first") && 
                                   val[key].name.hasOwnProperty("middle") && 
                                   val[key].hasOwnProperty("dateOfBirth") &&
                                   val[key].hasOwnProperty("gender")) {
                                    if(val[key].name.last.toUpperCase() == ownerName.last.toUpperCase() &&
                                        val[key].name.first.toUpperCase() == ownerName.first.toUpperCase() && 
                                        val[key].name.middle.toUpperCase() == ownerName.middle.toUpperCase() &&
                                        val[key].dateOfBirth == ownerDate && 
                                        val[key].gender == ownerGender) {
                                            ownerSameAsBene = true;
                                     }
                                }   
                            }
        
                            
                            val[key].email = val[key].hasOwnProperty("email") ? val[key].email : email;
                            val[key].phone = val[key].hasOwnProperty("phone") ? val[key].phone : phone;
                            val[key].mobile = val[key].hasOwnProperty("mobile") ? val[key].mobile : mobile;
                            val[key].address = address;
                            val[key].zipcode = zipcode;
                            val[key].civilStatus = (ownerSameAsBene) ? civilStatus.name.toUpperCase() : "SINGLE";
                            val[key].phoneCountryCode = phoneCountryCode.code.toUpperCase();
                            val[key].mobileCountryCode = mobileCountryCode.code.toUpperCase();
                            val[key].country = country;
                            val[key].country.name = val[key].country.name.toUpperCase();
                            val[key].presentCountry = val[key].country.name.toUpperCase();
                            val[key].permanentCountry = val[key].country.name.toUpperCase();
                            val[key].businessCountry = val[key].country.name.toUpperCase();
        
                            val[key].occupation = (ownerSameAsBene) ? occupation.name.toUpperCase() : "OTHER OCCUPATION";
                            val[key].beneficiaryDesignation = val[key].beneficiaryDesignation.name.toUpperCase();
                            val[key].beneficiaryType = val[key].beneficiaryType.toUpperCase();
        
                            if(val[key].hasOwnProperty("relationship")){
                                if((typeof val[key].relationship) == 'object') {
                                    
                                    val[key].relationship = val[key].relationship.name.toUpperCase();
                                    if( val[key].relationship == 'AUNT/UNCLE')  val[key].relationship = 'AUNT'
                                }
                                else {
                                    val[key].relationship = val[key].relationship.toUpperCase();
                                    if(val[key].relationship == 'AUNT/UNCLE')  val[key].relationship = 'AUNT'
                                }
        
                            }
                            return val[key];
                        });
                        res(temp);
                    }
                }else {
        
                    res(temp);
                }
        
            } catch(e) {
                res(e);
            }
        });
        
    }

    private static setDateTime (hour, minute, second) {
        var d = moment().tz('Asia/Manila');
        d.set('hour', hour);
        d.set('minute', minute);
        d.set('second', second);
    
        return d;
    }

	public static start(service: any, control: any, user: any, db: any, bean: any, data: any, id: string, files: any, callback: Function) {
		
        return new Promise<Object>(async (resolve) => { 
            try { 
                //get workflow task
                //if no task

                Helper.log("WORKFLOW DATA", data);

                //start workflow
                let resp = WorkflowHelper.startWF(data, control, db);     
                console.log("WorkflowHelper RESP: ", resp);     
                resolve(resp);
    
            } catch(e) {
    
                Helper.log('Workflow Start Err: ', e);            
                resolve({ isSucces: false, message: 'Workflow Start Err: ' + e });
    
            }

        });
	}
}
