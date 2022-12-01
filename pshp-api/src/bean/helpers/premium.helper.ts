
import * as fs from 'fs';

const maleRates = JSON.parse(fs.readFileSync('/usr/src/app/json-data/male.pyt.json','utf8'));
const femaleRates = JSON.parse(fs.readFileSync('/usr/src/app/json-data/female.pyt.json','utf8'));
const maleNextYearRates = JSON.parse(fs.readFileSync('/usr/src/app/json-data/maleNextYears.pyt.json','utf8'));
const femaleNextYearRates = JSON.parse(fs.readFileSync('/usr/src/app/json-data/femaleNextYears.pyt.json','utf8'));
const premiumRiders = JSON.parse(fs.readFileSync('/usr/src/app/json-data/riders.json','utf8'));
const baseSumAssured = JSON.parse(fs.readFileSync('/usr/src/app/json-data/baseSumAssured.json','utf8'));

import { AppHelper } from './app.helper';

export class PremiumHelper {

    public static premium(service: any, control: any, user: any, db: any, bean: any, data: any, id: string, files: any, callback: Function) {
		if (data) {
			service.sanitize(data);
			let validator = db.getValidator();
            let validation = validator.validate(data, {
                "id": "/PremiumInfo",
                "type": "object",
                "properties": {
                    "age": {
                        "type": "number",
                        "description": "Age",
                        "required": true
                    },
                    "gender": {
                        "type": "string",
                        "description": "Gender",
                        "required": true
                    }
                }
            }, { nestedErrors: true });
			
            if (!validation.valid) {
                let errors = [];
                for (let i = 0; i < validation.errors.length; i++) {
                    errors.push(validation.errors[i].stack.split('instance.').join(''));
                }
                callback({success:false, message:'login.failed', result: errors});
                return;
            }
						
			callback(this.getRates(data));
		} else {
			callback({ status: 'failed', message: 'invalid.data' });
		}
	}

	public static getRates(data: any) {
		try {
			var gender = (data.gender + '').trim().toLowerCase();
			var age = data.age;

			var matrix: any = this.getPremiumData(age, gender, false);
			matrix.isSuccess = true;
			return matrix;
		}
		catch (error) {
			return {
				isSuccess: false,
				status: 'failed',
				error: error.message
			};
		}
	}

	public static getPremiumData(age: any, gender: any, nextYears: any) {
		var response = {}
		var rates = {}

		if (gender == "male") {
			rates = (nextYears) ? maleNextYearRates : maleRates;
		}
		else if (gender == "female") {
			rates = (nextYears) ? femaleNextYearRates : femaleRates;
		}
		else {
			response = {
				isSuccess: false,
				status: 'failed',
				error: "gender(" + gender + ") not supported."
			}

			return response;
		}

		var premiumRates = rates[age];

		if (premiumRates == null) {
			response = {
				isSuccess: false,
				status: 'failed',
				error: "age(" + age + ") not supported."
			}

			return response;
		}

		var paymentModes = {}

		for (var key in premiumRates) {
			if (key && (premiumRates[key] != null)) {

				var annual = premiumRates[key];
				var semi = annual * 0.525; //0.525
				var quarterly = annual * 0.285;  //0.25
				var monthly = annual * 0.0975; //0.0975

				paymentModes[key] = {}
				paymentModes[key]["annual"] = {
					fee: AppHelper.toPeso(annual),
					totalFee: AppHelper.toPeso(annual)
				}

				paymentModes[key]["semi"] = {
					fee: AppHelper.toPeso(semi),
					totalFee: AppHelper.toPeso(semi * 2)
				}

				paymentModes[key]["quarterly"] = {
					fee: AppHelper.toPeso(quarterly),
					totalFee: AppHelper.toPeso(quarterly * 4)
				}

				paymentModes[key]["monthly"] = {
					fee: AppHelper.toPeso(monthly),
					totalFee: AppHelper.toPeso(monthly * 12)
				}
			}
			else {
				delete premiumRates[key];
			}
		}

		response = {
			status: 'success',
			rates: premiumRates,
			modes: paymentModes,
			riders: premiumRiders,
			sumAssured: baseSumAssured
		}

		return response;
	};
}