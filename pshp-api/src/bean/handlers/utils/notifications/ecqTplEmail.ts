
export class ecqTplEmail {
    public static getSubject() {
        return "PRUone Non Face-to-Face Purchase Review and Payment Link";
    }
	public static getTemplate() {
		return {
			html: `
				<html>
					<body>
						<div style='background: #FAFAFA;font-family: Verdana, Geneva, Tahoma, sans-serif; font-size: 15px;' width='100%' height='100%'>
							<center>
								<table border='0' cellpadding='20' cellspacing='0' height='100%' width='98%'
									style='border: 1px solid #DDDDDD; background: #FFF;'>
									<tbody>
										<tr>
											<td align='left'> <img style='max-height: 40px; margin-top: 20px;'
													src='https://drive.google.com/uc?id=1LCW_AABfe0s49f1Q_pB7YB5zRbt4h3Ho'></td>
										</tr>
										<tr>
											<td><b>Dear {{{salutation}}}. {{{firstName}}} {{{lastName}}},</b>
												<p>Thank you for your interest in purchasing a Pru Life UK insurance product.</p>
												<p>You may now proceed reviewing your purchase details and then proceed with the premium payment by clicking on the link provided to our secure online payment facility.<br>
													<a href='{{{ecqURL}}}'>Click here</a></p>
												
												<p>Regards,</p>
												<p><span style='color: red'><strong>Pru Life UK</strong></span></p>

												<p style='font-size: 12px; color: gray'><i><strong>Note: </strong> This is a system generated message. If you did not make this transaction, kindly disregard this message.</i></p>
											</td>
										</tr>
									</tbody>
								</table>
							</center>
						</div>
					</body>
				</html>		
			`
		};
	}
}