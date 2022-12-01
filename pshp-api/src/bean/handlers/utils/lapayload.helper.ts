import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment';
import { AppHelper as Helper } from '../../helpers/app.helper';

import { LifeAsiaConfig as LAConfig } from "./config/lifeasia.config";
import { PolicyHelper as Policy } from "./policy.helper";

export class LAPayload {

	public static generateLAPayload(data: any) {
		if (data) {
			return  LAPayload.getLAPayload(data);
		} else {
			return { success:false, status: 'failed', message: 'invalid.data' };
		}
	}

	public static getLAPayload(data: any) {

		var payload: any = LAConfig.getPayload();
		console.log(payload);

		try {
			data = Policy.getSobData(data);
			console.log(data);

			data.idType = data.idType ?? '';
			data.idNo = data.idNo ?? '';

			payload.prushoppeData = data;

			payload.applicationName = "PRUSHOPPE";

			payload.id = uuidv4();
			payload._id = payload.id;

			payload.applicationNo = data.oir;
			payload.quotation.result.version.modelProductDescription = "PruLife Your Term"; //*
			payload.quotation.result.version.modelVersion = "1.0"; //*
			payload.quotation.planCode = "PYT"; //*

			payload.quotation.payment.totalPremiumToBePaid = parseFloat(data.modeAmount.toString().replace(/[^0-9\.]/g, ""));
			payload.quotation.payment.method = "creditCard";
			payload.quotation.payment.mode = "email";
			payload.quotation.payment.status = "paid";
			payload.quotation.payment.paid = true;
			payload.quotation.payment.orderId = data.orderId;

			payload.quotation.result.riderAnnualPremiumAmount = parseFloat(data.annualRate.toString().replace(/[^0-9\.]/g, ""));
			payload.quotation.result.baseModalPremiumAmount = parseFloat(data.saBase.toString().replace(/[^0-9\.]/g, ""));
			payload.quotation.result.totalAnnualPremiumAmount = parseFloat(data.modeAnnualAmount.toString().replace(/[^0-9\.]/g, ""));
			payload.quotation.result.annualInsuranceCharge = 1.52;
			payload.quotation.result.riderModalPremiumAmount = parseFloat(data.modeAmount.toString().replace(/[^0-9\.]/g, ""));

			payload.quotation.displayedInsuredAmount = parseFloat(data.saBase.toString().replace(/[^0-9\.]/g, ""));
			payload.quotation.currency = "PHP";
			payload.quotation.paymentCurrency = "PHP";
			payload.quotation.totalModalPremiumRecommended = parseFloat(data.annualRate.toString().replace(/[^0-9\.]/g, ""));
			payload.quotation.baseModalPremium = parseFloat(data.modeAnnualAmount.toString().replace(/[^0-9\.]/g, ""));
			payload.quotation.insuredAmount = parseFloat(data.saBase.toString().replace(/[^0-9\.]/g, ""));
			//payload.quotation.insuredAmount = 1000000;

			// payload.quotation.config.maximumInsuredAmount = parseFloat(data.saBase.trim().replace(/\,/g,''));
			// payload.quotation.config.minimumInsuredAmount = parseFloat(data.saBase.trim().replace(/\,/g,''));
			// payload.quotation.config.assuredInsuranceAge = data.age;

			// payload.quotation.result.riders.TPD.insuredAmount.default = data.saTPD.replace(",","")*1;
			payload.quotation.result.riders.TPD = {}
			payload.quotation.result.riders.TPD.insuredAmount = parseFloat(data.saTPD.toString().replace(/[^0-9\.]/g, ""));

			payload.quotation.config.maximumInsuredAmount = parseFloat(data.saBase.toString().replace(/[^0-9\.]/g, ""));
			payload.quotation.config.minimumInsuredAmount = parseFloat(data.saBase.toString().replace(/[^0-9\.]/g, ""));
			payload.quotation.config.assuredInsuranceAge = data.age;

			//payload.quotation.result.riders.TPD.insuredAmount.default = data.saTPD.replace(",","")*1;
			payload.quotation.result.riders.TPD.insuredAmount = parseFloat(data.saTPD.toString().replace(/[^0-9\.]/g, ""));
			payload.quotation.result.riders.TPD.available = true;
			payload.quotation.result.riders.TPD.desc = "Total and Permanent Disability";
			payload.quotation.result.riders.TPD.code = "TPD";
			payload.quotation.result.riders.TPD.protectionBenefitAmount = 0;

			//payload.quotation.result.riders.ADD.insuredAmount.default = data.saADD.replace(",","")*1;
			payload.quotation.result.riders.ADD = {}
			payload.quotation.result.riders.ADD.insuredAmount = parseFloat(data.saADD.toString().replace(/[^0-9\.]/g, ""));
			payload.quotation.result.riders.ADD.available = true;
			payload.quotation.result.riders.ADD.desc = "Accidental Death and Disablement";
			payload.quotation.result.riders.ADD.code = "ADD";
			payload.quotation.result.riders.ADD.protectionBenefitAmount = 0;

			//console.log(payload.quotation.selectedRiders);

			payload.quotation.selectedRiders.ADD.enabled = true;
			payload.quotation.selectedRiders.ADD.core = true;
			payload.quotation.selectedRiders.ADD.name = "Accidental Death and Disablement";
			payload.quotation.selectedRiders.ADD.benefitType = "LumpSum";
			payload.quotation.selectedRiders.ADD.insuredAmount = parseFloat(data.saADD.toString().replace(/[^0-9\.]/g, ""));
			//payload.quotation.selectedRiders.ADD.insuredAmount = data.saADD.replace(",","")*1;

			payload.quotation.selectedRiders.TPD.enabled = true;
			payload.quotation.selectedRiders.TPD.core = true;
			payload.quotation.selectedRiders.TPD.name = "Accelerated Total and Permanent Disability";
			payload.quotation.selectedRiders.TPD.benefitType = "LumpSum";
			payload.quotation.selectedRiders.TPD.insuredAmount = parseFloat(data.saTPD.toString().replace(/[^0-9\.]/g, ""));
			//payload.quotation.selectedRiders.TPD.insuredAmount = data.saTPD.replace(",","")*1;

			if (data.age < 60) {

				payload.quotation.result.riders.WPTPD = {}
				payload.quotation.result.riders.WPTPD.available = true;
				payload.quotation.result.riders.WPTPD.desc = "Waiver of Premium due to Total and Permanent Disability Benefit";
				payload.quotation.result.riders.WPTPD.code = "WPTPD";
				payload.quotation.result.riders.WPTPD.protectionBenefitAmount = 0;
				payload.quotation.result.riders.WPTPD.insuredAmount = 0;
				//payload.quotation.result.riders.WPTPD.insuredAmount = parseFloat(data.modeAmount.trim().replace(/\,/g,''));
				//*
				payload.quotation.selectedRiders.WPTPD = {}
				payload.quotation.selectedRiders.WPTPD.enabled = true;
				payload.quotation.selectedRiders.WPTPD.core = true;
				payload.quotation.selectedRiders.WPTPD.name = "Waiver of Premium due to Total and Permanent Disability Benefit";
			}
			else {
				if (payload.quotation.result.riders.WPTPD)
					delete payload.quotation.result.riders.WPTPD;

				if (payload.quotation.selectedRiders.WPTPD)
					delete payload.quotation.selectedRiders.WPTPD;
			}

			payload.quotation.initialPaymentMethod.name = "CreditCard"; //*
			payload.quotation.initialPaymentMethod.code = "CC"; //*

			payload.quotation.period = {
				"name": "1 Year",
				"code": 1
			}

			//*
			payload.quotation.paymentMode = {}
			switch (data.modeOfPayment) {
				case "monthly":
					payload.quotation.paymentMode.name = "MONTHLY";
					payload.quotation.paymentMode.code = "MONTHLY";
					break;

				case "quarterly":
					payload.quotation.paymentMode.name = "QUARTERLY";
					payload.quotation.paymentMode.code = "QUARTERLY";
					break;

				case "semi":
					payload.quotation.paymentMode.name = "SEMI ANNUAL";
					payload.quotation.paymentMode.code = "SEMI ANNUAL";
					break;

				case "annual":
				case "default":
					payload.quotation.paymentMode.name = "ANNUAL";
					payload.quotation.paymentMode.code = "ANNUAL";
					break;
			}

			payload.product.planCode.name = "PruLife Your Term";
			payload.product.planCode.code = "PYT";
			payload.product.availableRiders[0] = {
				"code": "TPD",
				"name": "Accelerated Total and Permanent Disability",
				"group": null,
				"benefit": {
					"name": null,
					"type": "Lump Sum",
					"protectionAmountDesc": "'Included in Basic Cover'"
				},
				"core": true,
				"type": "toggledInsured",
				"desc": "A core benefit of this plan that advances a portion or 100% of the basic sum assured if life insured becomes totally and permanently disabled due to bodily injury or disease.\n\nIf the life insured is between 0 to 4 years old, this benefit will only take effect when he reaches age 5.",
				"additionalDesc": "The built-in coverage of this enhancement is {currency} {defaultInsuredAmount}.",
				"riskCategories": null
			}

			payload.product.availableRiders[1] = {
				"code": "ADD",
				"name": "Accidental Death and Disablement",
				"group": null,
				"benefit": {
					"name": null,
					"type": "Lump Sum",
					"protectionAmountDesc": "insuredAmount"
				},
				"core": true,
				"type": "toggledInsured",
				"desc": "A core benefit that pays the benefit amount if the life insured dies due to an accident within 180 days from the date the accident occurred. If the life insured becomes totally and permanently disabled due to an accident within 180 days from the date the accident occurred, a percentage of the benefit amount based on a compensation schedule will be paid.\n\nIf the life insured is between 0 to 4 years old, this benefit will only take effect when he reaches age 5.",
				"additionalDesc": "The built-in coverage of this enhancement is {currency} {defaultInsuredAmount}.",
				"riskCategories": [
					{
						"code": "accidentCoverageAmount",
						"factor": 1,
						"currencyFilter": null
					}
				]
			}

			if (data.age < 60) {
				payload.product.availableRiders[2] = {
					"code": "WPTPD",
					"name": "Waiver of Premium due to Total and Permanent Disability Benefit",
					"group": null,
					"benefit": {
						"name": null,
						"type": "Waiver",
						"protectionAmountDesc": "'Future Premiums'"
					},
					"core": false,
					"type": "toggled",
					"desc": "Waives all future regular premiums due to total and permanent disability",
					"additionalDesc": null,
					"riskCategories": null
				}
			}

			payload.assured.country.name = "Philippines";
			payload.assured.country.code = "163";

			payload.assured.phoneCountryCode = {};
			payload.assured.phoneCountryCode.name = "Philippines";
			payload.assured.phoneCountryCode.code = "+63";

			console.log(data);
			payload.assured.additionalPersonalInformation.civilStatus.name = data.civilStatus;
			payload.assured.additionalPersonalInformation.civilStatus.code = (data.civilStatus ?? '').charAt(0);
			payload.assured.additionalPersonalInformation.birthCountry.name = "Philippines";
			payload.assured.additionalPersonalInformation.birthCountry.code = "163";
			payload.assured.additionalPersonalInformation.nationality.name = "Filipino";
			payload.assured.additionalPersonalInformation.nationality.code = "163";

			payload.assured.medical.height = "160"; //to be changed later.... need to convert feet to cm
			payload.assured.medical.weight = data.weight;

			//ID 
			payload.assured.additionalPersonalInformation.identificationType.name = data.idType;
			payload.assured.additionalPersonalInformation.identificationType.code = data.idType;
			payload.assured.additionalPersonalInformation.identificationNumber = data.idNo;


			payload.assured.additionalPersonalInformation.cityPermanentCustom = data.permanentLocation;
			payload.assured.additionalPersonalInformation.addressPermanent = data.permanentAddress;
			payload.assured.additionalPersonalInformation.zipcodePermanent = data.permanentZipcode;
			payload.assured.additionalPersonalInformation.preferredMailingAddress = "present";

			payload.assured.additionalPersonalInformation.countryPermanent = {}
			payload.assured.additionalPersonalInformation.countryPermanent.name = "Philippines";
			payload.assured.additionalPersonalInformation.countryPermanent.code = "163";


			payload.assured.additionalPersonalInformation.birthCity = {
				"name": data.permanentLocation,
				"code": 0
			}

			payload.assured.additionalPersonalInformation.cityPermanent = {
				"name": data.permanentLocation,
				"code": 0
			}

			payload.assured.additionalPersonalInformation.identificationNumber = data.idNo;
			payload.assured.additionalPersonalInformation.addressPermanent = data.permanentAddress + " " + data.permanentLocation;


			payload.assured.workPay.occupations = {
				"0": {
					"city": {
						"name": data.permanentLocation,
						"code": 0
					},
					"employment": "",
					"occupation": {
						"name": data.occupationName,
						"code": data.occupationCode
					},
					"businessNature": {
						"name": "",
						"code": ""
					},
					"employerName": "",
					"addressBusiness": data.permanentAddress,
					"countryBusiness": {
						"name": "Philippines",
						"code": "163"
					},
					"cityCustom": data.permanentAddress,
					"zipcodeBusiness": data.permanentZipcode,
					"occupationChange": false
				}
			}

			payload.assured.name.title = {}
			payload.assured.name.title.name = Helper.ucFirst(data.salutation);
			payload.assured.name.title.code = Helper.ucFirst(data.salutation);
			payload.assured.name.first = (data.firstname ?? '').trim();
			payload.assured.name.middle = (data.middlename ?? '').trim();
			payload.assured.name.last = (data.lastname ?? '').trim();

			payload.assured.gender = (data.gender ?? '').charAt(0);

			payload.assured.email = data.email;
			payload.assured.phone = data.mobileno;

			payload.assured.dateOfBirth = data.birthday;
			payload.assured.age = data.age;

			payload.assured.address = data.permanentAddress;
			payload.assured.cityCustom = data.permanentLocation;
			payload.assured.zipcode = data.permanentZipcode;

			payload.assured.city = {
				"name": data.permanentLocation,
				"code": 0
			}

			payload.assured.mobileCountryCode = {}
			payload.assured.mobileCountryCode.name = "+63-PH";
			payload.assured.mobileCountryCode.code = "+63";
			payload.assured.mobile = data.mobileno;
			payload.assured.id = data.customerId;

			payload.policyHolder.assured = true;

			var bene1 = {
				"relationship": {
					"name": data.firstBeneRelationship,
					"code": data.firstBeneRelationship
				},
				"name": {
					"first": (data.firstBeneFirstname ?? '').trim(),
					"title": {
						"name": data.firstBeneSalutation, //* to be changed later for actual salutation
						"code": data.firstBeneSalutation  //* to be changed later for actual salutation
					},
					"last": (data.firstBeneLastname ?? '').trim(),
					"middle": (data.firstBeneMiddlename ?? '').trim()
				},
				"beneficiaryType": "primary",
				"beneficiaryDesignation": {
					"name": "Revocable",
					"code": "revocable"
				},
				"birthCity": {
					"name": "Philippines",
					"code": "163"
				},
				"nationality": {
					"name": "Filipino",
					"code": "163"
				},
				"country": {
					"name": "Philippines",
					"code": "163"
				},
				"city": {
					"name": "Others", //*
					"code": 13        //*
				},
				"dateOfBirth": data.firstBeneBirthday,
				"gender": (data.firstBeneGender ?? '').charAt(0),
				"beneficiaryPercentage": data.firstBeneShare,
				"countryOfBirth": {
					"name": "Philippines",
					"code": "163"
				},
				"address": data.firstBeneAddress,
				"zipcode": data.firstBeneZipcode,
				"cityCustom": data.firstBeneLocation
			}

			var bene2 = {

				"relationship": {
					"name": data.secondBeneRelationship,
					"code": data.secondBeneRelationship
				},
				"name": {
					"first": (data.secondBeneFirstname ?? '').trim(),
					"title": {
						"name": (data.secondBeneSalutation ?? '').trim(),
						"code": (data.secondBeneSalutation ?? '').trim()
					},
					"last": (data.secondBeneLastname ?? '').trim(),
					"middle": (data.secondBeneMiddlename ?? '').trim()
				},
				"beneficiaryType": "primary",
				"beneficiaryDesignation": {
					"name": "Revocable",
					"code": "revocable"
				},
				"birthCity": {
					"name": "Philippines",
					"code": "163"
				},
				"nationality": {
					"name": "Filipino",
					"code": "163"
				},
				"country": {
					"name": "Philippines",
					"code": "163"
				},
				"city": {
					"name": "Others", //*
					"code": 13        //*
				},
				"dateOfBirth": data.secondBeneBirthday,
				"gender": (data.secondBeneGender ?? '').charAt(0),
				"beneficiaryPercentage": data.secondBeneShare,
				"countryOfBirth": {
					"name": "Philippines",
					"code": "163"
				},
				"address": data.secondBeneAddress,
				"zipcode": data.secondBeneZipcode,
				"cityCustom": data.secondBeneLocation
			}

			if (data.secondBeneFirstname != "") {
				payload.beneficiary.basicPlan = {
					"0": bene1,
					"1": bene2
				}
			}
			else {
				payload.beneficiary.basicPlan = {
					"0": bene1
				}
			}

			//*
			//payload.agentProfile = {};
			payload.agentProfile.code = data.agentCode;

			// if (data.agentFirstName=="") {
			//     data.agentFirstName = process.env.DEFAULT_AGENT_FIRSTNAME;
			//     data.agentLastName = process.env.DEFAULT_AGENT_LASTNAME;
			//     data.agentName = data.agentLastName + ", " + data.agentFirstName;
			// }

			payload.agentProfile.name = data.agentName;

			//payload.agentProfile.code = "70082582";
			//payload.agentProfile.name = "HEAD OFFICE, PYT ONLINE";

			var today = new Date;
			payload.createdAt = moment(today).format("MM-DD-YYYY");

			delete payload.key;
			delete payload.attributes;
			delete payload.timestamp;

			// console.log("riders==========", payload.quotation.result.riders);

			// return payload;
			//Log.info("[Payment.lifeAsiaPayload]:", payload);

			return { customerId: data.customerId, payload: payload };

		} catch (error) {
			Helper.log("LAPayloadHelper", error);
		}

	}
}