
export class reqTplGetAlertStatus {

	public static getString() {
		return {
			xml:
				`
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <AuthHeader xmlns="http://tempuri.org/">
        <UserName>{{username}}</UserName>
        <Password>{{password}}</Password>
    </AuthHeader>
  </soap:Header>
  <soap:Body>
    <GetAlertStatus xmlns="http://tempuri.org/">
      <ID>{{rtsId}}</ID>
      <FCRMProductID>{{fcrmProductId}}</FCRMProductID>
    </GetAlertStatus>
  </soap:Body>
</soap:Envelope>
	`
		};
	}
}