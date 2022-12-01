import { AppHelper, AppHelper as Helper } from '../../helpers/app.helper';
import { PremiumHelper as Premium } from "../../helpers/premium.helper";

export class PolicyHelper {

	public static getSobData(data: any) {

		var response: any;

		if (!data) {
			response.success = 'false';
			response.message = 'Customer not found';
			return data;
		}
		else {

			var gender = data.gender.trim().toLowerCase();

			data.planName = data.lastname + ", " + data.firstname + " " + data.middlename;
			var premium: any = Premium.getPremiumData(data.age, gender, false);
			
			var modes = ["annual", "semi", "quarterly", "monthly"];

			if (modes.indexOf(data.modeOfPayment) > -1) {
				data.modeAmount = premium.modes[data.plan][data.modeOfPayment].fee;
				data.modeAnnualAmount = premium.modes[data.plan][data.modeOfPayment].totalFee;

				data.saBase = Helper.toPeso(premium.riders[data.plan]["Base SA"]);
				data.saADD = Helper.toPeso(premium.riders[data.plan]["ADD SA"]);
				data.saTPD = Helper.toPeso(premium.riders[data.plan]["TPD SA"]);
				data.WPTPD = Helper.toPeso(premium.riders[data.plan]["WPTPD"]);

				data.sumAssured = Helper.toPeso(premium.sumAssured[data.plan]);
			}
			else {
				AppHelper.log("Plan code is not set.", data);
			}
		}

		return data;
	}

	public static validatePlan(data: any, callback: Function) {

		let activity = {
			controller: "PremiumHelper",
			method: "validatePlan",
			requestParams: data,
			response: {}
		};


		if (!data) {
			activity.response = {success: false, message: "plan.failed", result: 'invalid customer data'};
			AppHelper.log("VALIDATE PLAN ERROR:", activity );
			callback(activity.response);
		}
		else {

			var gender = data.gender.trim().toLowerCase();
			var premium: any = Premium.getPremiumData(data.age, gender, false);
			
			var modes = ["annual", "semi", "quarterly", "monthly"];

			if (data.modeOfPayment=="" || data.modeOfPayment==null || data.modeOfPayment==undefined) {
				activity.response = {success: true, message: "plan.pending", result: 'Waiting for modeOfPayment assignment.'};
				callback(activity.response);
			}
			else if (modes.indexOf(data.modeOfPayment) > -1) {
				let planModeAmount = parseFloat(premium.modes[data.plan][data.modeOfPayment].fee.replace(/[^0-9\.]/g, '').split(".")[0]);
				let planModeAnnualAmount =  parseFloat(premium.modes[data.plan][data.modeOfPayment].totalFee.replace(/[^0-9\.]/g, '').split(".")[0]);
				// let planModeAmount = parseFloat(premium.modes[data.plan][data.modeOfPayment].fee.replace(/[^0-9\.]/g, ''));
				// let planModeAnnualAmount =  parseFloat(premium.modes[data.plan][data.modeOfPayment].totalFee.replace(/[^0-9\.]/g, ''));

				if (!data.hasOwnProperty('modeAmount')) {
					data.modeAmount = data.modeAnnualAmount;
				}
				
				let dataModeAmount = parseFloat(data.modeAmount.replace(/[^0-9\.]/g, '').split(".")[0]);
				let dataModeAnnualAmount =  parseFloat(data.modeAnnualAmount.replace(/[^0-9\.]/g, '').split(".")[0]);
				// let dataModeAmount = parseFloat(data.modeAmount.replace(/[^0-9\.]/g, ''));
				// let dataModeAnnualAmount =  parseFloat(data.modeAnnualAmount.replace(/[^0-9\.]/g, ''));


				AppHelper.log( "MODE AMOUNTS", [planModeAmount, dataModeAmount, planModeAnnualAmount, dataModeAnnualAmount]);

				if((planModeAmount!=dataModeAmount) || (planModeAnnualAmount!=dataModeAnnualAmount) ) {
					// let dataModeAmountp01 = dataModeAmount + 0.01;
					// let dataModeAmountm01 = dataModeAmount - 0.01;

					// if (planModeAmount==dataModeAmountp01 || planModeAmount==dataModeAmountm01) {
					// 	let dataModeAnnualAmountp01 = dataModeAnnualAmount + 0.01;
					// 	let dataModeAnnualAmountm01 = dataModeAnnualAmount - 0.01;

					// 	if (planModeAnnualAmount==dataModeAnnualAmountp01 || planModeAnnualAmount==dataModeAnnualAmountm01) {
					// 		activity.response = {success: true, message: "plan.success", result: 'plan is valid'};
					// 		callback(activity.response);
					// 		return;
					// 	}
					// 	else {
					// 		activity.response = {success: false, message: "plan.error", result: 'plan amount mismatch'};
					// 		AppHelper.log("VALIDATE PLAN ERROR", activity );
					// 		callback(activity.response);
					// 		return;
					// 	}
					// }

					activity.response = {success: false, message: "plan.error", result: 'plan amount mismatch'};
					AppHelper.log("VALIDATE PLAN ERROR", activity );
					callback(activity.response);
				}
				else {
					activity.response = {success: true, message: "plan.success", result: 'plan is valid'};
					callback(activity.response);
				}
				
			}
			else {
				activity.response = {success: false, message: "plan.failed", result: 'invalid modeOfPayment'};
				AppHelper.log("VALIDATE PLAN ERROR:", activity );
				callback(activity.response);
			}
		}
	}

}