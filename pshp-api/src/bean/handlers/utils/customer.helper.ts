import { AppHelper } from '../../helpers/app.helper';
import { WorkflowHelper } from './workflow.helper';
import { LAPayload } from './lapayload.helper';
import { FiservController } from './rts/fiserv.controller';
import { DBService } from '../../../persistence/db.service';
import * as moment from 'moment';
import * as zeropad from 'zeropad';  
import * as unirest from 'unirest';

const RtsStatuses:object = {
	"FactivaSIP":  {statusCode: 'FactivaSIP', action:'leadOut', description:'Special Interest Person.'},
	"FactivaSanctionsPers": {'statusCode': 'FactivaSanctionsPers', action:'leadOut', description:'SANCTION'},
	"FactivaPEP": { statusCode: 'FactivaPEP', action:'delay', description:'Politically Exposed Person'},
	"FactivaRCA": { statusCode: 'FactivaRCA', action:'delay', description:'Relative Close Associate'}
}

export class CustomerHelper {

	public static getRtsStatusAction(status: any) {
		return (RtsStatuses.hasOwnProperty(status)) ?  RtsStatuses[status].action : 'default';
	}
	
	public static screenCustomer(data: any, db:any, control: any) {
		return new Promise((resolve) => {

			try {
				console.log("=== Preparing Real Time Screening...\n");
			
				var countryCode = "PH";
				var birthday = data.birthday.split('-').join('/');
				var fullname = data.firstname + " " + data.lastname;

				var payload = {
					"customerId": data.customerId,
					"countryCode": countryCode,
					"fullname": fullname,
					"birthday": birthday
				}
								
				return FiservController.screening(payload, db, control).then(
					function (result: any) {			
						if (result.success) {
							var rtsResponse = JSON.parse(result.message);
							result.rtsMaxScoreOnList = {};
							result.rtsAction = 'default';
				
							if (rtsResponse['soap:Envelope']['soap:Body'] != undefined) {
								if (rtsResponse['soap:Envelope']['soap:Body'].RealtimeWLFScreeningResponse != undefined) {
									if (rtsResponse['soap:Envelope']['soap:Body'].RealtimeWLFScreeningResponse.RealtimeWLFScreeningResult != undefined) {
										var rtsResult = rtsResponse['soap:Envelope']['soap:Body'].RealtimeWLFScreeningResponse.RealtimeWLFScreeningResult;
										result.rtsMaxScoreOnList = rtsResult.MaxScoreOnList;
										result.rtsId = rtsResult.UniqueIdentifier;
										result.rtsAction = CustomerHelper.getRtsStatusAction(rtsResult.MaxScoreOnList);
									}
								}
							}
							resolve(result);
						}
						else {	
							var response: any = {
								success: false,
								status: 'failed',
								message: "screening.failed",
								rtsMaxScoreOnList: {'error':'error'},
								rtsAction: 'retry',
								rtsId: '-1',
								rtsAttempts: data.rtsAttempts + 1,
								error: result
							}
							
							resolve(response);
						}
					})
			
			} catch (error) {
				var response: any = {
					success: false,
					status: 'failed',
					message: "screening.failed",
					rtsMaxScoreOnList: {'error':'error'},
					rtsAction: 'retry',
					rtsId: '-1',
					rtsAttempts: data.rtsAttempts + 1,
					error: error
				}
				resolve(response);
			}
		});
	}

	public static createPolicy(db:any, control:any, customer: any, callback: Function) {

		let activity = {
			controller: "customerController",
			method: "createPolicy",
			requestParams: customer,
			response: {}
		};

		let counter = 0;
		let tracker = db.generateKey();

		let generateOir = (db, customer) => {

			CustomerHelper.generateOIR(db, customer, async(g: any) => {
				AppHelper.log('GENERATE OIR RESPONSE', [tracker, counter, g]);

				if (g.success) {
					
					counter++;

					if(counter<=1) {
						var data = g.customer;
						var wfPayload:any = LAPayload.generateLAPayload(data);
	
						db.bucket = await db.cluster.openBucket(process.env.PRUSHOPPE_BUCKET);  
						
						db.create(process.env.PRUSHOPPE_BUCKET, wfPayload.payload, (dbResp) => { 
							AppHelper.log("PRUSHOPPE WORKFLOW ITEM CREATE RESPONSE", [tracker, counter, dbResp]);
							
							if (dbResp.success) {
								WorkflowHelper.start(null, control, null, db, null, wfPayload, null, null, null).then(function(wfResp){
									callback(wfResp);
								});
							}
						});
	
						//insert wfPayload to prushoppe-bucket
						//invoke workflow start wfPayload as "data"
						//check reply,must be isSucess=true
	
						AppHelper.log("WORKFLOW PAYLOAD CREATED ", wfPayload);
						
						// set payload generator
						// submit to filenet
						// submit to LA
					}
					
				} else {

					//if failed due to duplicate key, reprocess
					if(g.retry) {
						generateOir(db, customer);
					}
					else {
						activity.response = g;
						AppHelper.log('GENERATE OIR', activity);
						callback (g);
					}
					
				}
			});
		};

		generateOir(db, customer);

		// setTimeout(() => {														
		// 	DBService.connect((pc) => {
		// 		if (pc.success) {
		// 			let db: DBService = <DBService>pc.result;
		// 			generateOir(db, customer);
		// 		}
		// 		else {
		// 			activity.response = pc;
		// 			AppHelper.log('GENERATE OIR', activity);
		// 			callback (pc);
		// 		}
		// 	});
		// }, 10000);

	}	

	public static generateOIR(db:any, customer: any, callback: Function) {
		
		let activity = {
			controller: "customerController",
			method: "generateOIR",
			requestParams: customer,
			response: {}
		};
		
		// if(customer.hasOwnProperty('customerId')) {
		// 	activity.requestParams = customer.customerId;

		// 	if (customer.oir!=null && customer.oir!="") {
		// 		//already exist
		// 		activity.response = { success: true, retry: false, message: 'oir.success', result: "OIR retrieved from customer.", oir: customer.oir, customer: customer };
		// 		AppHelper.log('GENERATE OIR', activity);
		// 		callback(activity.response);
		// 	}
		// 	else {
		// 		//generate new oir
		// 		customer['oir'] = "";

				let params = {
					yearPrefix: moment(new Date).format("YY"),
					customerId: customer.customerId
				};

				db.query('get-oir-customer', {...params}, (oc: any) =>{

					if (oc.success && (oc.result.length>0)) {
						customer['oir'] = oc.result[0].id;
						activity.response = { success: true, retry: false, message: 'oir.success', result: "OIR retrieved from oirs.", oir: customer.oir, customer: customer };

						db.update('customers', customer, (uc) => {
							AppHelper.log('GENERATE OIR', [activity, uc]);
							//do post processing if needed
							callback(activity.response);
						});
					}
					else {
						db.query('get-max-oir', {...params}, (mo: any) =>{

							if (mo.success) {
								let maxOirId = (mo.result[0].maxOirId == null) ? 0 : parseInt(mo.result[0].maxOirId);
								if ((maxOirId>=0) && (maxOirId<10000)) {
									let oirId = maxOirId + 1;
									let oirNo = "OIR" + params.yearPrefix +  zeropad(oirId, 4);
		
									let oir = {
										_id: oirNo,
										yearPrefix: params.yearPrefix,
										oirId: oirId,
										customerId: customer.customerId
									}
									
									db.search('customers', {customerId: oir.customerId}, (sr) => {
										
										if(sr.success && sr.result.length>0 && sr.result[0].hasOwnProperty('oir') && sr.result[0].oir!="" && sr.result[0].oir!=undefined && sr.result[0].oir!=null) {
											activity.response = { success: true, retry: false, message: 'oir.success', result: "oir generated ", oir: sr.result[0].oirNo, customer: sr.result[0]};
											callback(activity.response);
											return;
										}
										
										AppHelper.log('NEW OIR FOR CREATION:', oir);
										db.create('oirs', oir, (or)=>{
											
											if (or.success) {
												AppHelper.log('GENERATE OIR', activity);
												customer.oir = oirNo;
												db.update('customers', customer, (uc) => {
													//do post processing if needed

													//investigate why OIR is not saved on customer
													console.log(">>>>>>> [CUSTOMER OIR UPDATE RESULT]: ", uc);
													
													activity.response = { success: true, retry: false, message: 'oir.success', result: "oir generated ", oir: oirNo, customer: customer};
													callback(activity.response);
												});
											}
											else {
												activity.response = { success: false, retry: true, message: 'oir.failed', result: or, customerId: customer.customerId };
												callback(activity.response);
											}
										});
									});
								}
								else {
									activity.response = { success: false, retry: false, message: 'oir.failed', result: "oir number maxed out for the year.", customerId: customer.customerId };
									callback(activity.response);
								}
							}
	
						});
					}

				});

			
			// }
		// }
		// else {
		// 	activity.response = { success: false, retry: false, message: 'oir.failed', result: "customer not found.", customerId: customer.customerId };
		// 	AppHelper.log('GENERATE OIR', activity);
		// 	callback(activity.response);
		// }
		
	} 	

	public static initCustomer(data, initData) {

		data.id = initData.id;
		data._id = initData._id;

		data.customerId = initData.customerId;
		data.salutation = initData.salutation;
		data.firstname = initData.firstname.trim();
		data.middlename = initData.middlename.trim();
		data.lastname = initData.lastname.trim();
		data.gender = initData.gender;
		data.phResident = "Yes";
		data.birthday = initData.birthday;
		data.age = initData.age;
		data.location = "";
		data.email = "";
		data.mobileno = "";
		data.remarks = "";

		data.plan = "";
		data.planName = "";
		data.annualRate = "";

		data.modeOfPayment = "";
		data.sumAssured = "";
		data.modeAmount = "";
		data.modeAnnualAmount = "";
		data.saBase = "";
		data.saADD = "";
		data.saTPD = "";

		data.height = "";
		data.weight = "";
		data.q1a = "No";
		data.q1b = "No";
		data.q2 = "No";
		data.q3 = "No";
		data.q4 = "No";
		data.q5a = "No";
		data.q5b = "No";
		data.q5c = "No";
		data.q5d = "No";
		data.q6 = "No";

		data.needs = "";

		data.civilStatus = "";

		data.country = "Philippines";

		data.occupation = "";
		data.occupationCode = "";
		data.occupationName = "";
		data.natureOfWork = "";
		data.employer = "";
		data.natureOfEmployerBusiness = "";

		data.permanentAddress = "";
		data.permanentStreet = "";
		data.permanentProvCity = "";
		data.permanentZipcode = "";
		data.permanentLocation = "";

		data.presentAddress = "";
		data.presentLocation = "";
		data.presentProvCity = "";
		data.presentZipcode = "";

		data.firstBeneSalutation = "";
		data.firstBeneFirstname = "";
		data.firstBeneMiddlename = "";
		data.firstBeneLastname = "";
		data.firstBeneTypeOfBenfeciary = "";
		data.firstBeneBirthday = "";
		data.firstBeneAge = "";
		data.firstBeneType = "";
		data.firstBeneGender = "";
		data.firstBeneDesignation = "";
		data.firstBeneIsSameAddressWithPO = "";
		data.firstBeneAddress = "";
		data.firstBeneStreet = "";
		data.firstBeneProvCity = "";
		data.firstBeneLocation = "";
		data.firstBeneZipcode = "";
		data.firstBeneRelationship = "";
		data.firstBeneShare = "";

		data.secondBeneSalutation = "";
		data.secondBeneFirstname = "";
		data.secondBeneMiddlename = "";
		data.secondBeneLastname = "";
		data.secondBeneType = "";
		data.secondBeneBirthday = "";
		data.secondBeneAge = "";
		data.secondBeneGender = "";
		data.secondBeneType = "";
		data.secondBeneDesignation = "";
		data.secondBeneIsSameAddressWithPO = "";
		data.secondBeneAddress = "";
		data.secondBeneStreet = "";
		data.secondBeneProvCity = "";
		data.secondBeneLocation = "";
		data.secondBeneZipcode = "";
		data.secondBeneRelationship = "";
		data.secondBeneShare = "";

		data.isSubscribed = "No";
		data.isProfiled = "No";

		data.isProfiled = initData.isProfiled;
		data.isSubscribed = initData.isSubscribed;

		data.agentCode = process.env.DEFAULT_AGENT_CODE;
		data.agentName = process.env.DEFAULT_AGENT_NAME;

		data.agentFirstName = "PRUDENCE";
		data.agentLastName = "PRUSHOPPE";
		// data.agentCode = "70082582";
		// data.agentName = "HEAD OFFICE AGENT";

		data.cardNumber = "";
		data.cardName = "";
		data.expiryMonth = "";
		data.expiryYear = "";
		data.cvc = "";

		data.idType = "";
		data.idNo = "";

		data.methodOfPayment = "";

		data.placeSigned = initData.placeSigned;
		data.agreedOnMedInfo = initData.agreedOnMedInfo;

		data.oir = "";
		data.orderId = "";

		data.dateCreated = new Date().toISOString();
		data.dateModified = "";

		data.isPaid = "No";
		data.isPostedToFilenet = "No";
		data.isPostedToLifeAsia = "No";

		data.smsSOB = "No";
		data.smsEAPP = "No";
		data.smsTLIC = "No";
		data.agentStatus = "default";

		data.dateFileUploadExpiry = "";

		//console.log("afterInit ", data);

		data.rtsId = initData.rtsId;
		data.rtsAction = initData.rtsAction;
		data.rtsResultRAW = initData.rtsResultRAW;
		data.rtsMaxScoreOnList = initData.rtsMaxScoreOnList;

		data.isAlreadyExist = initData.isAlreadyExist;

		return data;
	}	

	public static validateAgent(agentCode: any, callback: Function) {

		var data: any = {
			agentCode: process.env.DEFAULT_AGENT_CODE,
			agentName: process.env.DEFAULT_AGENT_NAME,
			agentStatus: 'default'
		};

		try {

			if (agentCode) {
				let options = {
					url: process.env.API_PRISM_ENDPOINT,
					headers: {
						"Authorization": "Basic " + process.env.API_PRISM_BASIC_AUTH,
						"Solace-Reply-Wait-Time-In-ms": 10000,
						"Content-Type": "application/json"
					},
					json: {
						"agent_code": agentCode
					}
				};
	
				unirest
				.post(options.url)
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
				.send(options.json)
				.then((r) => {

					// AppHelper.log("VALIDATE AGENT RAW RESPONSE BODY", r.body );		
					let agent = r.body;
	
					if (agent.hasOwnProperty('life_license_expiry')) {
						var today = new Date();
						var licenseExpiry = new Date(agent.life_license_expiry);
						var now = moment(today);
						var expiry = moment(licenseExpiry);
	
						if (expiry > now) {
							data.agentCode = agentCode;
							data.agentName = agent.agent_name;
							data.agentStatus = 'active';
						}
						else {
							data.agentStatus = 'expired';
						}
					} else {
						data.agentStatus = 'notFound';
					}
	
					callback(data);
				})
				.catch(error => {
					AppHelper.log("VALIDATE AGENT ERROR ", error );
					callback(data);
				});
			}
			else {
				callback(data);
			}
		
		} catch (error) {
			AppHelper.log("VALIDATE AGENT ERROR ", error );
			callback(data);
		}
	}

}