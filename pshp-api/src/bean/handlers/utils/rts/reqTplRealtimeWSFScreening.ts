

export class reqTplRealtimeWSFScreening {

	public static getString() {
		return {
			xml: 
				`<soap:Envelope
						xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
						xmlns:xsd="http://www.w3.org/2001/XMLSchema"
						xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
						<soap:Header>
							<AuthHeader xmlns="http://tempuri.org/">
								<UserName>{{username}}</UserName>
								<Password>{{password}}</Password>
							</AuthHeader>
						</soap:Header>
						<soap:Body>
							<RealtimeWLFScreening xmlns="http://tempuri.org/">
								<UniqueIdentifier>{{rtsId}}</UniqueIdentifier>
								<Reference>{{customerId}}</Reference>
								<FCRMProductID>{{fcrmProductId}}</FCRMProductID>
								<BusinessObject>
									<![CDATA[
										<BusinessObject>
											<ObjectType>Party</ObjectType>
											<CustomerType>P</CustomerType>
											<RecordType>POO</RecordType>
											<SourceSystem>LAS</SourceSystem>
											<FullNames><FullName>{{fullname}}</FullName></FullNames>
											<LocalScriptNames><LocalScriptName></LocalScriptName></LocalScriptNames>
											<Countries><Country>{{countryCode}}</Country></Countries>
											<BirthDays><BirthDay>{{{birthday}}}</BirthDay></BirthDays>
											<AdditionalIndicator1></AdditionalIndicator1>
											<AdditionalIndicator2></AdditionalIndicator2>
											<AdditionalIndicator3></AdditionalIndicator3>
											<AdditionalIndicator4></AdditionalIndicator4>
											<AdditionalIndicator5></AdditionalIndicator5>
											<ReferenceData></ReferenceData>
										</BusinessObject>
									]]>
								</BusinessObject>
								<Options/>
							</RealtimeWLFScreening>
						</soap:Body>
					</soap:Envelope>
					`
		};
	}
}