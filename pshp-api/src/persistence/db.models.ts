
export class DBModels {

    static DB_SCHEMA: string;
    static DB_NAMESPACE: string;
	static PRUSHOPPE_BUCKET: string;

    constructor(db: any) {
        DBModels.DB_SCHEMA = this.envProp('DB_SCHEMA');
        DBModels.DB_NAMESPACE = this.envProp('DB_NAMESPACE');
		DBModels.PRUSHOPPE_BUCKET = this.envProp('PRUSHOPPE_BUCKET');

        db.setExcludedModels({});
        this.storeSystemModels(db);
        this.storeServiceModels(db);
        this.storeServiceQueries(db);
    }

    envProp(targetProperty: string): string {
        return process.env[targetProperty];
    }

    storeSystemModels(db: any) {
        db.storeModel("system:user", () => {
            return {
                "id": "system:user",
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string",
                        "description": "ID"
                    },
                    "service": {
                        "type": "string",
                        "description": "Service"
                    },
                    "username": {
                        "type": "string",
                        "description": "Username"
                    },
                    "password": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Password"
                    },
                    "role": {
                        "type": "string",
                        "encrypted": true,
                        "$lookup": "system:role",
                        "description": "Role"
                    },
                    "active": {
                        "type": "string",
                        "$lookup": "system:yesno",
                        "description": "Active"
                    },
                    "createdDate": {
                        "type": "string",
                        "description": "Created Date"
                    },
                    "createdBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Created By"
                    },
                    "updatedDate": {
                        "type": "string",
                        "description": "Updated Date"
                    },
                    "updatedBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Updated By"
                    }
                }
            }
        });

        db.storeModel("system:role", () => {
            return {
                "id": "system:role",
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string",
                        "description": "ID",
                        "entry": true
                    },
                    "name": {
                        "type": "string",
                        "description": "Name"
                    },
                    "service": {
                        "type": "string",
                        "description": "Service"
                    },                    
                    "createdDate": {
                        "type": "string",
                        "description": "Created Date"
                    },
                    "createdBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Created By"
                    },
                    "updatedDate": {
                        "type": "string",
                        "description": "Updated Date"
                    },
                    "updatedBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Updated By"
                    }
                }
            }
        });

        db.storeModel("system:yesno", () => {
            return {
                "id": "system:yesno",
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string",
                        "description": "ID",
                        "entry": true
                    },
                    "name": {
                        "type": "string",
                        "description": "Name",
                        "unique": true
                    },
                    "service": {
                        "type": "string",
                        "description": "Service"
                    },                    
                    "createdDate": {
                        "type": "string",
                        "description": "Created Date"
                    },
                    "createdBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Created By"
                    },
                    "updatedDate": {
                        "type": "string",
                        "description": "Updated Date"
                    },
                    "updatedBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Updated By"
                    }
                }
            }
        });

        db.storeModel("system:access", () => {
            return {
                "id": "system:access",
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string",
                        "description": "ID"
                    },
                    "service": {
                        "type": "string",
                        "description": "Service"
                    },                    
                    "role": {
                        "type": "string",
                        "description": "Role"
                    },
                    "action": {
                        "type": "string",
                        "description": "Action"
                    },
                    "bean": {
                        "type": "string",
                        "description": "Model"
                    },
                    "allow": {
                        "type": "string",
                        "description": "Allow"
                    },
                    "createdDate": {
                        "type": "string",
                        "description": "Created Date"
                    },
                    "createdBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Created By"
                    },
                    "updatedDate": {
                        "type": "string",
                        "description": "Updated Date"
                    },
                    "updatedBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Updated By"
                    }
                }
            }
        });

        db.storeModel("system:settings", () => {
            return {
                "id": "system:settings",
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string",
                        "description": "ID"
                    },
                    "service": {
                        "type": "string",
                        "description": "Service"
                    },                    
                    "pub_sig": {
                        "type": "string",
                        "description": "Public",
                        "encrypted": true
                    },
                    "priv_sig": {
                        "type": "string",
                        "description": "Private",
                        "encrypted": true
                    },
                    "createdDate": {
                        "type": "string",
                        "description": "Created Date"
                    },
                    "createdBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Created By"
                    },
                    "updatedDate": {
                        "type": "string",
                        "description": "Updated Date"
                    },
                    "updatedBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Updated By"
                    }
                }
            }
        });
    }

    storeServiceModels(db: any) {
        
		db.storeModel("docs", () => {
            return {
                "id": "/Docs",
                "type": "object",
				"properties": {
				}
            };
        });	

        db.storeModel("document", () => {
            return {
                "id": "/Document",
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string",
                        "description": "ID",
                        "format": "uuid"
                    },
                    "name": {
                        "type": "string",
                        "description": "Document Name",
                        "encrypted": true
                    },                    
                    "attachment": {
                        "type": "string",
                        "description": "Attachment",
                        "format": "binary"
                    },
                    "thumbnail": {
                        "type": "string",
                        "description": "Thumbnail",
                        "format": "binary"
                    },
                    "metaData": {
                        "type": "object",
                        "description": "Meta Data"
                    },   
                    "active": {
                        "type": "string",
                        "description": "Active"
                    },                                    
                    "createdDate": {
                        "type": "string",
                        "description": "Created Date",
                        "format": "date-time"
                    },
                    "createdBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Created By"
                    },
                    "updatedDate": {
                        "type": "string",
                        "description": "Updated Date",
                        "format": "date-time"
                    },
                    "updatedBy": {
                        "type": "string",
                        "encrypted": true,
                        "description": "Updated By"
                    }                                                           
                }
            };
        });

		db.storeModel("rts_status", () => {
			return {
				"id": "/RtsStatus",
				"type": "object",
				"properties": {
					"id": {
						"type": "string",
						"description": "ID",
						"format": "uuid"
					},
					"country": {
						"type": "string",
						"description": "Status Code",
						"value": "PH"
					},
					"action": {
						"type": "string",
						"description": "Action"
					},
					"desc": {
						"type": "string",
						"description": "Description"
					},
					"createdDate": {
						"type": "string",
						"description": "Created Date",
						"format": "date-time"
					},
					"createdBy": {
						"type": "string",
						"encrypted": true,
						"description": "Created By"
					},
					"updatedDate": {
						"type": "string",
						"description": "Updated Date",
						"format": "date-time"
					},
					"updatedBy": {
						"type": "string",
						"encrypted": true,
						"description": "Updated By"
					}
				}
			};
		});

		db.storeModel("refdocs", () => {
			return {
				"id": "/RefDocs",
				"type": "object",
				"properties": {
					"id": {
						"type": "string",
						"description": "ID",
						"format": "uuid"
					},
					"customerId": {
						"type": "string",
						"description": "Customer ID",
						"format": "uuid"
					},
					"base64Content": {
						"type": "string",
						"description": "Base64 Content"
					},
					"idfile": {
						"type": "string",
                        "description": "ID File",
                        "format": "binary"
					},
					"mimeType": {
						"type": "string",
						"description": "MIME Type"
					},
					"createdDate": {
						"type": "string",
						"description": "Created Date",
						"format": "date-time"
					},
					"createdBy": {
						"type": "string",
						"encrypted": true,
						"description": "Created By"
					},
					"updatedDate": {
						"type": "string",
						"description": "Updated Date",
						"format": "date-time"
					},
					"updatedBy": {
						"type": "string",
						"encrypted": true,
						"description": "Updated By"
					}
				}
			};
		});

		db.storeModel("agents", () => {
			return {
				"id": "/Agents",
				"type": "object",
				"properties": {
					"id": {
						"type": "string",
						"description": "ID",
						"format": "uuid"
					},
					"agentCode": {
						"type": "string",
						"description": "Agent Code"
					},
					"firstname": {
						"type": "string",
						"description": "First Name",
						"encrypted": true
					},
					"lastname": {
						"type": "string",
						"description": "Last Name",
						"encrypted": true
					},
					"createdDate": {
						"type": "string",
						"description": "Created Date",
						"format": "date-time"
					},
					"createdBy": {
						"type": "string",
						"encrypted": true,
						"description": "Created By"
					},
					"updatedDate": {
						"type": "string",
						"description": "Updated Date",
						"format": "date-time"
					},
					"updatedBy": {
						"type": "string",
						"encrypted": true,
						"description": "Updated By"
					}
				}
			};
		});

		db.storeModel("appqueue", () => {
			return {
				"id": "/AppQueue",
				"type": "object",
				"properties": {
					"id": {
						"type": "string",
						"description": "ID",
						"format": "uuid"
					},
					"customerId": {
						"type": "string",
						"description": "Customer ID",
						"format": "uuid"
					},
					"fileNetAppDocs": {
						"type": "string",
						"description": "File Net App Documents"
					},
					"fileNetAttachment": {
						"type": "string",
						"description": "File Net Attachment"
					},
					"lifeAsia": {
						"type": "string",
						"description": "Life Asia"
					},
					"createdDate": {
						"type": "string",
						"description": "Created Date",
						"format": "date-time"
					},
					"createdBy": {
						"type": "string",
						"encrypted": true,
						"description": "Created By"
					},
					"updatedDate": {
						"type": "string",
						"description": "Updated Date",
						"format": "date-time"
					},
					"updatedBy": {
						"type": "string",
						"encrypted": true,
						"description": "Updated By"
					}
				}
			};
		});

		db.storeModel("payloads", () => {
			return {
				"id": "/Payloads",
				"type": "object",
				"properties": {
					"id": {
						"type": "string",
						"description": "ID",
						"format": "uuid"
					},
					"customerId": {
						"type": "string",
						"description": "Customer ID",
						"format": "uuid"
					},
					"tag": {
						"type": "string",
						"description": "Tag"
					},
					"jsonData": {
						"type": "string",
						"description": "JSON Data",
						"encrypted": true
					},
					"createdDate": {
						"type": "string",
						"description": "Created Date",
						"format": "date-time"
					},
					"createdBy": {
						"type": "string",
						"encrypted": true,
						"description": "Created By"
					},
					"updatedDate": {
						"type": "string",
						"description": "Updated Date",
						"format": "date-time"
					},
					"updatedBy": {
						"type": "string",
						"encrypted": true,
						"description": "Updated By"
					}
				}
			};
		});

		db.storeModel("payments", () => {
			return {
				"id": "/Payments",
				"type": "object",
				"properties": {
					"id": {
						"type": "string",
						"description": "ID"
					},
					"customerId": {
						"type": "string",
						"description": "Customer ID",
						"format": "uuid"
					},
					"chargeTotal": {
						"type": "string",
						"description": "Charge Total"
					},
					"currency": {
						"type": "string",
						"description": "Currency"
					},
					"referenceNumber": {
						"type": "string",
						"description": "Reference Number"
					},
					"name": {
						"type": "string",
						"description": "Name",
						"encrypted": true
					},
					"address1": {
						"type": "string",
						"description": "Address 1",
						"encrypted": true
					},
					"city": {
						"type": "string",
						"description": "City",
						"encrypted": true
					},
					"zip": {
						"type": "string",
						"description": "Zip",
						"encrypted": true
					},
					"country": {
						"type": "string",
						"description": "Country",
						"encrypted": true
					},
					"mobileNo": {
						"type": "string",
						"description": "Mobile Number",
						"encrypted": true
					},
					"email": {
						"type": "string",
						"description": "Email",
						"encrypted": true
					},
					"paymentUrl": {
						"type": "string",
						"description": "Payment URL"
					},
					"orderId": {
						"type": "string",
						"description": "Order ID"
					},
					"transactionId": {
						"type": "string",
						"description": "Transaction ID"
					},
					"transactionState": {
						"type": "string",
						"description": "Transaction State"
					},
					"transactionValues": {
						"type": "any",
						"description": "Transaction Values"
					},
					"statusResponse": {
						"type": "string",
						"description": "Status Response"
					},
					"createdDate": {
						"type": "string",
						"description": "Created Date",
						"format": "date-time"
					},
					"createdBy": {
						"type": "string",
						"encrypted": true,
						"description": "Created By"
					},
					"updatedDate": {
						"type": "string",
						"description": "Updated Date",
						"format": "date-time"
					},
					"updatedBy": {
						"type": "string",
						"encrypted": true,
						"description": "Updated By"
					}
				}
			};
		});

		db.storeModel("oirs", () => {
			return {
				"id": "/OIRS",
				"type": "object",
				"properties": {
					"id": {
						"type": "string",
						"description": "ID",
						"format": "uuid"
					},
					"oirId": {
						"type": "number",
						"description": "OIR ID"
					},
					"yearPrefix": {
						"type": "string",
						"description": "Year Prefix"
					},
					"customerId": {
						"type": "string",
						"description": "Customer ID",
						"format": "uuid"
					},
					"createdDate": {
						"type": "string",
						"description": "Created Date",
						"format": "date-time"
					},
					"createdBy": {
						"type": "string",
						"encrypted": true,
						"description": "Created By"
					},
					"updatedDate": {
						"type": "string",
						"description": "Updated Date",
						"format": "date-time"
					},
					"updatedBy": {
						"type": "string",
						"encrypted": true,
						"description": "Updated By"
					}
				}
			};
		});

		db.storeModel("customers", () => {
			return {
				"id": "/Customer",
				"type": "object",
				"properties": {
					"id": {
						"type": "string",
						"description": "ID",
						"format": "uuid"
					},
					"customerId": {
						"type": "string",
						"description": "Customer ID",
						"format": "uuid"
					},
					"salutation": {
						"type": "string",
						"description": "Salutation",
						"encrypted": true
					},
					"firstname": {
						"type": "string",
						"description": "First Name",
						"encrypted": true
					},
					"middlename": {
						"type": "string",
						"description": "Middle Name",
						"encrypted": true
					},
					"lastname": {
						"type": "string",
						"description": "Last Name",
						"encrypted": true
					},
					"gender": {
						"type": "string",
						"description": "Gender",
						"encrypted": true
					},
					"phResident": {
						"type": "string",
						"description": "PH Resident"
					},
					"birthday": {
						"type": "string",
						"description": "Birthday",
						"encrypted": true
					},
					"age": {
						"type": "string",
						"description": "Age",
						"encrypted": true
					},
					"location": {
						"type": "string",
						"description": "Location",
						"encrypted": true
					},
					"email": {
						"type": "string",
						"description": "Email",
						"encrypted": true
					},
					"mobileno": {
						"type": "string",
						"description": "Mobile Number",
						"encrypted": true
					},
					"remarks": {
						"type": "string",
						"description": "Remarks",
						"encrypted": true
					},
					"plan": {
						"type": "string",
						"description": "Plan",
						"encrypted": true
					},
					"planName": {
						"type": "string",
						"description": "Plan Name",
						"encrypted": true
					},
					"annualRate": {
						"type": "string",
						"description": "Annual Rate",
						"encrypted": true
					},
					"modeOfPayment": {
						"type": "string",
						"description": "Mode of Payment",
						"encrypted": true
					},
					"sumAssured": {
						"type": "string",
						"description": "Sum Assured",
						"encrypted": true
					},
					"modeAmount": {
						"type": "string",
						"description": "Mode Amount",
						"encrypted": true
					},
					"modeAnnualAmount": {
						"type": "string",
						"description": "Mode Annual Amount",
						"encrypted": true
					},
					"saBase": {
						"type": "string",
						"description": "Sa Base",
						"encrypted": true
					},
					"saADD": {
						"type": "string",
						"description": "Sa ADD",
						"encrypted": true
					},
					"saTPD": {
						"type": "string",
						"description": "Sa TPD",
						"encrypted": true
					},
					"saWPTPD": {
						"type": "string",
						"description": "Sa WPTPD",
						"encrypted": true
					},
					"height": {
						"type": "string",
						"description": "Height",
						"encrypted": true
					},
					"weight": {
						"type": "string",
						"description": "Weight",
						"encrypted": true
					},
					"q1a": {
						"type": "string",
						"description": "Q1A",
						"encrypted": true
					},
					"q1b": {
						"type": "string",
						"description": "Q1B",
						"encrypted": true
					},
					"q2": {
						"type": "string",
						"description": "Q2",
						"encrypted": true
					},
					"q3": {
						"type": "string",
						"description": "Q3",
						"encrypted": true
					},
					"q4": {
						"type": "string",
						"description": "Q4",
						"encrypted": true
					},					
					"Q4": {
						"type": "string",
						"description": "Q4",
						"encrypted": true
					},
					"q5a": {
						"type": "string",
						"description": "Q5A",
						"encrypted": true
					},
					"q5b": {
						"type": "string",
						"description": "Q5B",
						"encrypted": true
					},
					"q5c": {
						"type": "string",
						"description": "Q5C",
						"encrypted": true
					},
					"q5d": {
						"type": "string",
						"description": "Q5D",
						"encrypted": true
					},
					"q6": {
						"type": "string",
						"description": "Q6",
						"encrypted": true
					},
					"needs": {
						"type": "string",
						"description": "Needs",
						"encrypted": true
					},
					"civilStatus": {
						"type": "string",
						"description": "Civil Status",
						"encrypted": true
					},
					"country": {
						"type": "string",
						"description": "Country",
						"encrypted": true
					},
					"occupation": {
						"type": "string",
						"description": "Occupation",
						"encrypted": true
					},
					"occupationName": {
						"type": "string",
						"description": "Occupation Name",
						"encrypted": true
					},
					"occupationCode": {
						"type": "string",
						"description": "Occupation Code",
						"encrypted": true
					},
					"natureOfWork": {
						"type": "string",
						"description": "Nature of Work",
						"encrypted": true
					},
					"employer": {
						"type": "string",
						"description": "Employer",
						"encrypted": true
					},
					"natureOfEmployerBusiness": {
						"type": "string",
						"description": "Nature of Employee Business",
						"encrypted": true
					},
					"permanentAddress": {
						"type": "string",
						"description": "Permanent Address",
						"encrypted": true
					},
					"permanentStreet": {
						"type": "string",
						"description": "Permanent Street",
						"encrypted": true
					},
					"permanentProvCity": {
						"type": "string",
						"description": "Permanent Provincial City",
						"encrypted": true
					},
					"permanentZipcode": {
						"type": "string",
						"description": "Permanent Zip Code",
						"encrypted": true
					},
					"permanentLocation": {
						"type": "string",
						"description": "Permanent Location",
						"encrypted": true
					},
					"isSameAddress": {
						"type": "string",
						"description": "Is Same Address?"
					},
					"presentAddress": {
						"type": "string",
						"description": "Present Address",
						"encrypted": true
					},
					"presentLocation": {
						"type": "string",
						"description": "Present Location",
						"encrypted": true
					},
					"presentProvCity": {
						"type": "string",
						"description": "Present Provincial City",
						"encrypted": true
					},
					"presentZipcode": {
						"type": "string",
						"description": "Present Zip Code",
						"encrypted": true
					},
					"firstBeneSalutation": {
						"type": "string",
						"description": "First Bene Salutation",
						"encrypted": true
					},
					"firstBeneFirstname": {
						"type": "string",
						"description": "First Bene Firstname",
						"encrypted": true
					},
					"firstBeneMiddlename": {
						"type": "string",
						"description": "First Bene Middlename",
						"encrypted": true
					},
					"firstBeneLastname": {
						"type": "string",
						"description": "First Bene Lastname",
						"encrypted": true
					},
					"firstBeneTypeOfBenfeciary": {
						"type": "string",
						"description": "First Bene Type Of Benfeciary",
						"encrypted": true
					},
					"firstBeneBirthday": {
						"type": "string",
						"description": "First Bene Birthday",
						"encrypted": true
					},
					"firstBeneAge": {
						"type": "string",
						"description": "First Bene Age",
						"encrypted": true
					},
					"firstBeneType": {
						"type": "string",
						"description": "First Bene Type"
					},
					"firstBeneGender": {
						"type": "string",
						"description": "First Bene Gender",
						"encrypted": true
					},
					"firstBeneDesignation": {
						"type": "string",
						"description": "First Bene Designation"
					},
					"firstBeneIsSameAddressWithPO": {
						"type": "string",
						"description": "First Bene Is Same Address With PO"
					},
					"firstBeneAddress": {
						"type": "string",
						"description": "First Bene Address",
						"encrypted": true
					},
					"firstBeneStreet": {
						"type": "string",
						"description": "First Bene Street",
						"encrypted": true
					},
					"firstBeneProvCity": {
						"type": "string",
						"description": "First Bene Prov City",
						"encrypted": true
					},
					"firstBeneLocation": {
						"type": "string",
						"description": "First Bene Location",
						"encrypted": true
					},
					"firstBeneZipcode": {
						"type": "string",
						"description": "First Bene Zipcode",
						"encrypted": true
					},
					"firstBeneRelationship": {
						"type": "string",
						"description": "First Bene Relationship",
						"encrypted": true
					},
					"firstBeneShare": {
						"type": "string",
						"description": "First Bene Share"
					},
					"secondBeneSalutation": {
						"type": "string",
						"description": "Second Bene Salutation",
						"encrypted": true
					},
					"secondBeneFirstname": {
						"type": "string",
						"description": "Second Bene Firstname",
						"encrypted": true
					},
					"secondBeneMiddlename": {
						"type": "string",
						"description": "Second Bene Middlename",
						"encrypted": true
					},
					"secondBeneLastname": {
						"type": "string",
						"description": "Second Bene Lastname",
						"encrypted": true
					},
					"secondBeneTypeOfBeneficiary": {
						"type": "string",
						"description": "Second Bene Type Of Beneficiary"
					},
					"secondBeneBirthday": {
						"type": "string",
						"description": "Second Bene Birthday",
						"encrypted": true
					},
					"secondBeneAge": {
						"type": "string",
						"description": "Second Bene Age",
						"encrypted": true
					},
					"secondBeneGender": {
						"type": "string",
						"description": "Second Bene Gender",
						"encrypted": true
					},
					"secondBeneType": {
						"type": "string",
						"description": "Second Bene Type"
					},
					"secondBeneDesignation": {
						"type": "string",
						"description": "Second Bene Designation",
						"encrypted": true
					},
					"secondBeneIsSameAddressWithPO": {
						"type": "string",
						"description": "Second Bene Is Same Address With PO"
					},
					"secondBeneAddress": {
						"type": "string",
						"description": "Second Bene Address",
						"encrypted": true
					},
					"secondBeneStreet": {
						"type": "string",
						"description": "Second Bene Street",
						"encrypted": true
					},
					"secondBeneProvCity": {
						"type": "string",
						"description": "Second Bene Prov City",
						"encrypted": true
					},
					"secondBeneLocation": {
						"type": "string",
						"description": "Second Bene Location",
						"encrypted": true
					},
					"secondBeneZipcode": {
						"type": "string",
						"description": "Second Bene Zipcode",
						"encrypted": true
					},
					"secondBeneRelationship": {
						"type": "string",
						"description": "Second Bene Relationship",
						"encrypted": true
					},
					"secondBeneShare": {
						"type": "string",
						"description": "Second Bene Share",
						"encrypted": true
					},
					"agentCode": {
						"type": "string",
						"description": "Agent Code"
					},
					"agentName": {
						"type": "string",
						"description": "Agent Name",
						"encrypted": true
					},
					"agentStatus": {
						"type": "string",
						"description": "Agent Status"
					},
					"agentFirstName": {
						"type": "string",
						"description": "Agent First Name",
						"encrypted": true
					},
					"agentLastName": {
						"type": "string",
						"description": "Agent Last Name",
						"encrypted": true
					},
					"idType": {
						"type": "string",
						"description": "Id Type"
					},
					"idNo": {
						"type": "string",
						"description": "Id No",
						"encrypted": true
					},
					"methodOfPayment": {
						"type": "string",
						"description": "Method Of Payment"
					},
					"placeSigned": {
						"type": "string",
						"description": "Place Signed",
						"encrypted": true
					},
					"agreedOnMedInfo": {
						"type": "string",
						"description": "Agreed On Med Info",
						"encrypted": true
					},
					"oir": {
						"type": "string",
						"description": "OIR"
					},
					"suggestion": {
						"type": "string",
						"description": "Suggestion",
						"encrypted": true
					},
					"rating": {
						"type": "any",
						"description": "Rating"
					},
					"isPaid": {
						"type": "string",
						"description": "Is Paid"
					},
					"isPostedToFilenet": {
						"type": "string",
						"description": "Is Posted To Filenet"
					},
					"isPostedToLifeAsia": {
						"type": "string",
						"description": "Is Posted To LifeAsia"
					},
					"isAlreadyExist": {
						"type": "string",
						"description": "Is Already Exist"
					},
					"orderId": {
						"type": "string",
						"description": "Order Id"
					},
					"transactionState": {
						"type": "string",
						"description": "Transaction State"
					},
					"ccToken": {
						"type": "string",
						"description": "CC Token",
						"encrypted": true
					},
					"forNextDay": {
						"type": "string",
						"description": "For Next Day"
					},
					"forNextDayDate": {
						"type": "number",
						"description": "For Next Day Date"
					},
					"willBeDelivered": {
						"type": "string",
						"description": "Will Be Delivered"
					},
					"branchId": {
						"type": "string",
						"description": "Branch Id"
					},
					"branchName": {
						"type": "string",
						"description": "Branch Name"
					},
					"visitorId": {
						"type": "string",
						"description": "Visitor Id"
					},
					"isProfiled": {
						"type": "string",
						"description": "Is Profiled"
					},
					"isSubscribed": {
						"type": "string",
						"description": "Is Subscribed"
					},
					"assignAgent": {
						"type": "string",
						"description": "Assign Agent"
					},
					"smsSOB": {
						"type": "string",
						"description": "SMS SOB"
					},
					"smsEAPP": {
						"type": "string",
						"description": "SMS EAPP"
					},
					"smsTLIC": {
						"type": "string",
						"description": "SMS TLIC"
					},
					"dateCreated": {
						"type": "string",
						"description": "Date Created"
					},
					"dateModified": {
						"type": "string",
						"description": "Date Modified"
					},
					"dateFileUploadExpiry": {
						"type": "string",
						"description": "Date File Upload Expiry"
					},
					"rtsId": {
						"type": "string",
						"description": "RTS Id"
					},
					"rtsAction": {
						"type": "string",
						"description": "RTS Action"
					},
					"rtsMaxScoreOnList": {
						"type": "any",
						"description": "RTS Max Score On List"
					},
					"rtsResultRAW": {
						"type": "string",
						"description": "RTS Result RAW"
					},
					"rtsAttempts": {
						"type": "any",
						"description": "RTS Attempts"
					},
					"createdDate": {
						"type": "string",
						"description": "Created Date",
						"format": "date-time"
					},
					"createdBy": {
						"type": "string",
						"encrypted": true,
						"description": "Created By"
					},
					"updatedDate": {
						"type": "string",
						"description": "Updated Date",
						"format": "date-time"
					},
					"updatedBy": {
						"type": "string",
						"encrypted": true,
						"description": "Updated By"
					}
				}
			};
		});

		db.storeModel("reqdata", () => {
			return {
				"id": "/ReqData",
				"type": "object",
				"properties": {
					"customerId": {
						"type": "string",
						"description": "Customer ID",
						"format": "uuid",
						"required":true
					},
					"salutation": {
						"type": "string",
						"description": "Salutation",
						"required": true,
					},
					"firstname": {
						"type": "string",
						"description": "First Name",
						"encrypted": true
					},
					"middlename": {
						"type": "string",
						"description": "Middle Name",
						"encrypted": true
					},
					"lastname": {
						"type": "string",
						"description": "Last Name",
						"encrypted": true
					},
					"gender": {
						"type": "string",
						"description": "Gender",
						"encrypted": true
					},
					"phResident": {
						"type": "string",
						"description": "PH Resident"
					},
					"birthday": {
						"type": "string",
						"description": "Birthday",
						"encrypted": true
					},
					"age": {
						"type": "string",
						"description": "Age",
						"encrypted": true
					},
					"location": {
						"type": "string",
						"description": "Location",
						"encrypted": true
					},
					"email": {
						"type": "string",
						"description": "Email",
						"encrypted": true
					},
					"mobileno": {
						"type": "string",
						"description": "Mobile Number",
						"encrypted": true
					},
					"remarks": {
						"type": "string",
						"description": "Remarks",
						"encrypted": true
					},
					"plan": {
						"type": "string",
						"description": "Plan",
						"encrypted": true
					},
					"planName": {
						"type": "string",
						"description": "Plan Name",
						"encrypted": true
					},
					"annualRate": {
						"type": "string",
						"description": "Annual Rate",
						"encrypted": true
					},
					"modeOfPayment": {
						"type": "string",
						"description": "Mode of Payment",
						"encrypted": true
					},
					"sumAssured": {
						"type": "string",
						"description": "Sum Assured",
						"encrypted": true
					},
					"modeAmount": {
						"type": "string",
						"description": "Mode Amount",
						"encrypted": true
					},
					"modeAnnualAmount": {
						"type": "string",
						"description": "Mode Annual Amount",
						"encrypted": true
					},
					"saBase": {
						"type": "string",
						"description": "Sa Base",
						"encrypted": true
					},
					"saADD": {
						"type": "string",
						"description": "Sa ADD",
						"encrypted": true
					},
					"saTPD": {
						"type": "string",
						"description": "Sa TPD",
						"encrypted": true
					},
					"saWPTPD": {
						"type": "string",
						"description": "Sa WPTPD",
						"encrypted": true
					},
					"height": {
						"type": "string",
						"description": "Height",
						"encrypted": true
					},
					"weight": {
						"type": "string",
						"description": "Weight",
						"encrypted": true
					},
					"q1a": {
						"type": "string",
						"description": "Q1A",
						"encrypted": true
					},
					"q1b": {
						"type": "string",
						"description": "Q1B",
						"encrypted": true
					},
					"q2": {
						"type": "string",
						"description": "Q2",
						"encrypted": true
					},
					"q3": {
						"type": "string",
						"description": "Q3",
						"encrypted": true
					},
					"q4": {
						"type": "string",
						"description": "Q4",
						"encrypted": true
					},					
					"Q4": {
						"type": "string",
						"description": "Q4",
						"encrypted": true
					},
					"q5a": {
						"type": "string",
						"description": "Q5A",
						"encrypted": true
					},
					"q5b": {
						"type": "string",
						"description": "Q5B",
						"encrypted": true
					},
					"q5c": {
						"type": "string",
						"description": "Q5C",
						"encrypted": true
					},
					"q5d": {
						"type": "string",
						"description": "Q5D",
						"encrypted": true
					},
					"q6": {
						"type": "string",
						"description": "Q6",
						"encrypted": true
					},
					"needs": {
						"type": "string",
						"description": "Needs",
						"encrypted": true
					},
					"civilStatus": {
						"type": "string",
						"description": "Civil Status",
						"encrypted": true
					},
					"country": {
						"type": "string",
						"description": "Country",
						"encrypted": true
					},
					"occupation": {
						"type": "string",
						"description": "Occupation",
						"encrypted": true
					},
					"occupationName": {
						"type": "string",
						"description": "Occupation Name",
						"encrypted": true
					},
					"occupationCode": {
						"type": "string",
						"description": "Occupation Code",
						"encrypted": true
					},
					"natureOfWork": {
						"type": "string",
						"description": "Nature of Work",
						"encrypted": true
					},
					"employer": {
						"type": "string",
						"description": "Employer",
						"encrypted": true
					},
					"natureOfEmployerBusiness": {
						"type": "string",
						"description": "Nature of Employee Business",
						"encrypted": true
					},
					"permanentAddress": {
						"type": "string",
						"description": "Permanent Address",
						"encrypted": true
					},
					"permanentStreet": {
						"type": "string",
						"description": "Permanent Street",
						"encrypted": true
					},
					"permanentProvCity": {
						"type": "string",
						"description": "Permanent Provincial City",
						"encrypted": true
					},
					"permanentZipcode": {
						"type": "string",
						"description": "Permanent Zip Code",
						"encrypted": true
					},
					"permanentLocation": {
						"type": "string",
						"description": "Permanent Location",
						"encrypted": true
					},
					"isSameAddress": {
						"type": "string",
						"description": "Is Same Address?"
					},
					"presentAddress": {
						"type": "string",
						"description": "Present Address",
						"encrypted": true
					},
					"presentLocation": {
						"type": "string",
						"description": "Present Location",
						"encrypted": true
					},
					"presentProvCity": {
						"type": "string",
						"description": "Present Provincial City",
						"encrypted": true
					},
					"presentZipcode": {
						"type": "string",
						"description": "Present Zip Code",
						"encrypted": true
					},
					"firstBeneSalutation": {
						"type": "string",
						"description": "First Bene Salutation",
						"encrypted": true
					},
					"firstBeneFirstname": {
						"type": "string",
						"description": "First Bene Firstname",
						"encrypted": true
					},
					"firstBeneMiddlename": {
						"type": "string",
						"description": "First Bene Middlename",
						"encrypted": true
					},
					"firstBeneLastname": {
						"type": "string",
						"description": "First Bene Lastname",
						"encrypted": true
					},
					"firstBeneTypeOfBenfeciary": {
						"type": "string",
						"description": "First Bene Type Of Benfeciary",
						"encrypted": true
					},
					"firstBeneBirthday": {
						"type": "string",
						"description": "First Bene Birthday",
						"encrypted": true
					},
					"firstBeneAge": {
						"type": "string",
						"description": "First Bene Age",
						"encrypted": true
					},
					"firstBeneType": {
						"type": "string",
						"description": "First Bene Type"
					},
					"firstBeneGender": {
						"type": "string",
						"description": "First Bene Gender",
						"encrypted": true
					},
					"firstBeneDesignation": {
						"type": "string",
						"description": "First Bene Designation"
					},
					"firstBeneIsSameAddressWithPO": {
						"type": "string",
						"description": "First Bene Is Same Address With PO"
					},
					"firstBeneAddress": {
						"type": "string",
						"description": "First Bene Address",
						"encrypted": true
					},
					"firstBeneStreet": {
						"type": "string",
						"description": "First Bene Street",
						"encrypted": true
					},
					"firstBeneProvCity": {
						"type": "string",
						"description": "First Bene Prov City",
						"encrypted": true
					},
					"firstBeneLocation": {
						"type": "string",
						"description": "First Bene Location",
						"encrypted": true
					},
					"firstBeneZipcode": {
						"type": "string",
						"description": "First Bene Zipcode",
						"encrypted": true
					},
					"firstBeneRelationship": {
						"type": "string",
						"description": "First Bene Relationship",
						"encrypted": true
					},
					"firstBeneShare": {
						"type": "string",
						"description": "First Bene Share"
					},
					"secondBeneSalutation": {
						"type": "string",
						"description": "Second Bene Salutation",
						"encrypted": true
					},
					"secondBeneFirstname": {
						"type": "string",
						"description": "Second Bene Firstname",
						"encrypted": true
					},
					"secondBeneMiddlename": {
						"type": "string",
						"description": "Second Bene Middlename",
						"encrypted": true
					},
					"secondBeneLastname": {
						"type": "string",
						"description": "Second Bene Lastname",
						"encrypted": true
					},
					"secondBeneTypeOfBeneficiary": {
						"type": "string",
						"description": "Second Bene Type Of Beneficiary"
					},
					"secondBeneBirthday": {
						"type": "string",
						"description": "Second Bene Birthday",
						"encrypted": true
					},
					"secondBeneAge": {
						"type": "string",
						"description": "Second Bene Age",
						"encrypted": true
					},
					"secondBeneGender": {
						"type": "string",
						"description": "Second Bene Gender",
						"encrypted": true
					},
					"secondBeneType": {
						"type": "string",
						"description": "Second Bene Type"
					},
					"secondBeneDesignation": {
						"type": "string",
						"description": "Second Bene Designation",
						"encrypted": true
					},
					"secondBeneIsSameAddressWithPO": {
						"type": "string",
						"description": "Second Bene Is Same Address With PO"
					},
					"secondBeneAddress": {
						"type": "string",
						"description": "Second Bene Address",
						"encrypted": true
					},
					"secondBeneStreet": {
						"type": "string",
						"description": "Second Bene Street",
						"encrypted": true
					},
					"secondBeneProvCity": {
						"type": "string",
						"description": "Second Bene Prov City",
						"encrypted": true
					},
					"secondBeneLocation": {
						"type": "string",
						"description": "Second Bene Location",
						"encrypted": true
					},
					"secondBeneZipcode": {
						"type": "string",
						"description": "Second Bene Zipcode",
						"encrypted": true
					},
					"secondBeneRelationship": {
						"type": "string",
						"description": "Second Bene Relationship",
						"encrypted": true
					},
					"secondBeneShare": {
						"type": "string",
						"description": "Second Bene Share",
						"encrypted": true
					},
					"agentCode": {
						"type": "string",
						"description": "Agent Code"
					},
					"agentName": {
						"type": "string",
						"description": "Agent Name",
						"encrypted": true
					},
					"agentStatus": {
						"type": "string",
						"description": "Agent Status"
					},
					"agentFirstName": {
						"type": "string",
						"description": "Agent First Name",
						"encrypted": true
					},
					"agentLastName": {
						"type": "string",
						"description": "Agent Last Name",
						"encrypted": true
					},
					"idType": {
						"type": "string",
						"description": "Id Type"
					},
					"idNo": {
						"type": "string",
						"description": "Id No",
						"encrypted": true
					},
					"methodOfPayment": {
						"type": "string",
						"description": "Method Of Payment"
					},
					"placeSigned": {
						"type": "string",
						"description": "Place Signed",
						"encrypted": true
					},
					"agreedOnMedInfo": {
						"type": "string",
						"description": "Agreed On Med Info",
						"encrypted": true
					},
					"oir": {
						"type": "string",
						"description": "OIR"
					},
					"suggestion": {
						"type": "string",
						"description": "Suggestion",
						"encrypted": true
					},
					"rating": {
						"type": "any",
						"description": "Rating"
					},
					"isPaid": {
						"type": "string",
						"description": "Is Paid"
					},
					"isPostedToFilenet": {
						"type": "string",
						"description": "Is Posted To Filenet"
					},
					"isPostedToLifeAsia": {
						"type": "string",
						"description": "Is Posted To LifeAsia"
					},
					"isAlreadyExist": {
						"type": "string",
						"description": "Is Already Exist"
					},
					"orderId": {
						"type": "string",
						"description": "Order Id"
					},
					"transactionState": {
						"type": "string",
						"description": "Transaction State"
					},
					"ccToken": {
						"type": "string",
						"description": "CC Token",
						"encrypted": true
					},
					"forNextDay": {
						"type": "string",
						"description": "For Next Day"
					},
					"forNextDayDate": {
						"type": "number",
						"description": "For Next Day Date"
					},
					"willBeDelivered": {
						"type": "string",
						"description": "Will Be Delivered"
					},
					"branchId": {
						"type": "string",
						"description": "Branch Id"
					},
					"branchName": {
						"type": "string",
						"description": "Branch Name"
					},
					"visitorId": {
						"type": "string",
						"description": "Visitor Id"
					},
					"isProfiled": {
						"type": "string",
						"description": "Is Profiled"
					},
					"isSubscribed": {
						"type": "string",
						"description": "Is Subscribed"
					},
					"assignAgent": {
						"type": "string",
						"description": "Assign Agent"
					},
					"smsSOB": {
						"type": "string",
						"description": "SMS SOB"
					},
					"smsEAPP": {
						"type": "string",
						"description": "SMS EAPP"
					},
					"smsTLIC": {
						"type": "string",
						"description": "SMS TLIC"
					},
					"dateCreated": {
						"type": "string",
						"description": "Date Created"
					},
					"dateModified": {
						"type": "string",
						"description": "Date Modified"
					},
					"dateFileUploadExpiry": {
						"type": "string",
						"description": "Date File Upload Expiry"
					},
					"rtsId": {
						"type": "string",
						"description": "RTS Id"
					},
					"rtsAction": {
						"type": "string",
						"description": "RTS Action"
					},
					"rtsMaxScoreOnList": {
						"type": "any",
						"description": "RTS Max Score On List"
					},
					"rtsResultRAW": {
						"type": "string",
						"description": "RTS Result RAW"
					},
					"rtsAttempts": {
						"type": "any",
						"description": "RTS Attempts"
					},
					"createdDate": {
						"type": "string",
						"description": "Created Date",
						"format": "date-time"
					},
					"createdBy": {
						"type": "string",
						"encrypted": true,
						"description": "Created By"
					},
					"updatedDate": {
						"type": "string",
						"description": "Updated Date",
						"format": "date-time"
					},
					"updatedBy": {
						"type": "string",
						"encrypted": true,
						"description": "Updated By"
					}
				}
			};
		});

		db.storeModel("rtslogs", () => {
			return {
				"id": "/rtslogs",
				"type": "object",
				"properties": {
					"id": {
						"type": "string",
						"description": "ID",
						"format": "uuid"
					},
					"request": {
						"type": "string",
						"description": "Request"
					},
					"response": {
						"type": "string",
						"description": "Response"
					},
					"dateRequest": {
						"type": "string",
						"description": "Date Request"
					},
					"dateResponse": {
						"type": "string",
						"description": "Date Response"
					},
					"createdDate": {
						"type": "string",
						"description": "Created Date",
						"format": "date-time"
					},
					"createdBy": {
						"type": "string",
						"encrypted": true,
						"description": "Created By"
					},
					"updatedDate": {
						"type": "string",
						"description": "Updated Date",
						"format": "date-time"
					},
					"updatedBy": {
						"type": "string",
						"encrypted": true,
						"description": "Updated By"
					}
				}
			};
		});


		db.storeModel(process.env.WORKFLOW_BUCKET, () => {
            return {
                "id": "workflow-data",
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string",
                        "description": "ID"
                    },
                    "workflow": {
                        "type": "object",
                        "description": "Workflow"
                    },
                    "transform": {
                        "type": "object",
                        "description": "Transform"
                    }
                }
            }
        });

		db.storeModel(process.env.PRUSHOPPE_BUCKET, () => {
            return {
                "id": "prushoppe-data",
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string",
                        "description": "ID"
                    },
                    "applicationName": {
                        "type": "string",
                        "description": "Application Name"
                    },
                    "quotation": {
                        "type": "any",
                        "description": "Quotation"
                    },
					"product": {
                        "type": "any",
                        "description": "Product"
                    },
					"assured": {
                        "type": "any",
                        "description": "Assured"
                    },
					"policyHolder": {
                        "type": "any",
                        "description": "Policy Holder"
                    },
					"status": {
                        "type": "any",
                        "description": "Status"
                    },
					"createdAt": {
                        "type": "any",
                        "description": "Created At"
                    },
					"formVersion": {
                        "type": "any",
                        "description": "Form Version"
                    },
					"needs": {
                        "type": "any",
                        "description": "Needs"
                    },
					"fundRecommendation": {
                        "type": "any",
                        "description": "fundRecommendation"
                    },
					"riskProfile": {
                        "type": "any",
                        "description": "Risk Profile"
                    },
					"prushaseReview": {
                        "type": "any",
                        "description": "Purchase Review"
                    },
					"beneficiary": {
                        "type": "any",
                        "description": "Beneficiary"
                    },
					"requiredDocs": {
                        "type": "any",
                        "description": "Required Docs"
                    },
					"agentProfile": {
                        "type": "any",
                        "description": "Agent Profile"
                    },
					"applicationNo": {
                        "type": "string",
                        "description": "Application No"
                    }
                }
            }
        });        
    }

    storeServiceQueries(db: any) {
        db.storeQuery(
            'has-connection',
            'SELECT 1 ',
            () => {
                return {
                    "id": "/CheckConnection",
                    "type": "object",
                    "properties": {}
                }
            },
            false
        );

        db.storeQuery(
            'has-access',
            'SELECT * FROM `' +
            DBModels.DB_SCHEMA +
            '` WHERE _type="' + DBModels.DB_NAMESPACE + ':system:access" ' +
            ' AND `action`=$action' +
            ' AND `bean`=$bean' +
            ' AND `role`=$role' +
            ' AND `service`=$service' +
            ' AND `allow`="Y"',
            () => {
                return {
                    "id": "/CheckAccess",
                    "type": "object",
                    "properties": {
                        "action": {
                            "type": "string",
                            "description": "Action",
                            "required": true
                        },
                        "bean": {
                            "type": "string",
                            "description": "Model",
                            "required": true
                        },
                        "role": {
                            "type": "string",
                            "description": "Role",
                            "required": true
                        },
                        "service": {
                            "type": "string",
                            "description": "Service",
                            "required": true
                        }
                    }
                }
            },
            false
        );

        db.storeQuery(
            'bean-access',
            'SELECT * FROM `' +
            DBModels.DB_SCHEMA +
            '` WHERE _type="' + DBModels.DB_NAMESPACE + ':system:access" AND `role`=$role AND `service`=$service',
            () => {
                return {
                    "id": "/BeanAccess",
                    "type": "object",
                    "properties": {
                        "role": {
                            "type": "string",
                            "description": "Role",
                            "required": true
                        },
                        "service": {
                            "type": "string",
                            "description": "Service",
                            "required": true
                        }
                    }
                }
            },
            false
        );

		db.storeQuery(
			'get-max-oir',
			'SELECT MAX(oirId) as maxOirId FROM `' +
			DBModels.DB_SCHEMA +
			'` WHERE _type="' + DBModels.DB_NAMESPACE + ':oirs" AND `yearPrefix`=$yearPrefix',
			() => {
				return {
					"id": "/YearMaxOir",
					"type": "object",
					"properties": {
						"yearPrefix": {
							"type": "string",
							"description": "Year Prefix",
							"required": true
						}
					}
				}
			},
			false
		);

		db.storeQuery(
			'get-oir-customer',
			'SELECT id, customerId FROM `' +
			DBModels.DB_SCHEMA +
			'` WHERE _type="' + DBModels.DB_NAMESPACE + ':oirs" AND customerId=$customerId',
			() => {
				return {
					"id": "/OirCustomer",
					"type": "object",
					"properties": {
						"customerId": {
							"type": "string",
							"description": "customer Id",
							"required": true
						}
					}
				}
			},
			false
		);

		db.storeQuery(
            'policy-holders',
			`SELECT DISTINCT
				customers.*, 
				oirs.id AS oirNo,
				payments.id AS paymentOrderId,
				payments.transactionState AS paymentTransactionState
				FROM ` + "`" + DBModels.DB_SCHEMA + "`" + " customers " +
				"INNER JOIN" + "`" + DBModels.DB_SCHEMA + "`" + `oirs ON customers.customerId=oirs.customerId AND oirs._type="` + DBModels.DB_NAMESPACE + `:oirs" ` +
				"INNER JOIN" + "`" + DBModels.DB_SCHEMA + "`" + `payments ON customers.customerId=payments.customerId AND  payments._type="` + DBModels.DB_NAMESPACE + `:payments" AND payments.transactionState="CAPTURED" ` +
				`WHERE customers._type="` + DBModels.DB_NAMESPACE + `:customers" AND customers.createdDate BETWEEN $dateFrom AND $dateTo
				ORDER BY oirNo`,
				()=>{
					let tm = db.getModel('customers').schemaFn();
					let m = {
						"id": "/PolicyHolders",
						"type": "object",
						"properties": 	{
							...tm.properties,
							...{
									"dateFrom": {
										"type": "string",
										"description": "Date From",
										"required": true
									},
									"dateTo": {
										"type": "string",
										"description": "Date To",
									"required": true
								   }
							}
						}			 
					}
					//console.log("leads schema: ", m );
					return m;
					
				},
            false
        );

		db.storeQuery(
            'customer-leads',
			`SELECT  c.* FROM ` +  "`" + DBModels.DB_SCHEMA + "` c " +
			` WHERE c._type="`+ DBModels.DB_NAMESPACE + `:customers" 
				AND c.customerId NOT IN (SELECT DISTINCT RAW o.customerId FROM` +  "`" + DBModels.DB_SCHEMA + "` o " + "WHERE o._type=\""+ DBModels.DB_NAMESPACE + ":oirs\" ORDER BY c.dateCreated) AND c.createdDate BETWEEN $dateFrom AND $dateTo",
				()=>{
					let tm = db.getModel('customers').schemaFn();
					let m = {
						"id": "/CustomerLeads",
						"type": "object",
						"properties": 	{
							...tm.properties,
							...{
									"dateFrom": {
										"type": "string",
										"description": "Date From",
										"required": true
									},
									"dateTo": {
										"type": "string",
										"description": "Date To",
										"required": true
								   }
							}
						}			 
					}
					//console.log("leads schema: ", m );
					return m;
					
				},
            false
        );

		db.storeQuery(
            'customer-payments',
			`SELECT DISTINCT c.customerId, c.firstname, c.middlename, c.lastname,
                                 p.orderId, p.transactionState, p.dateCreated, p.dateUpdated FROM ` +  "`" + DBModels.DB_SCHEMA  + "` c " +
                        `INNER JOIN ` +  "`" + DBModels.DB_SCHEMA + "` p " + ` ON c.customerId=p.customerId AND p._type="`+ DBModels.DB_NAMESPACE + `:payments"
                        WHERE c._type="`+ DBModels.DB_NAMESPACE + `:customers" AND c.createdDate BETWEEN $dateFrom AND $dateTo ORDER BY p.createdDate`,
            () => {
                return {
                    "id": "/CustomerPayments",
                    "type": "object",
                    "properties": {
						"customerId": {
							"type": "string",
							"description": "Customer ID",
							"format": "uuid"
						},
						"chargeTotal": {
							"type": "string",
							"description": "Charge Total"
						},
						"currency": {
							"type": "string",
							"description": "Currency"
						},
						"referenceNumber": {
							"type": "string",
							"description": "Reference Number"
						},
						"firstname": {
							"type": "string",
							"description": "Name",
							"encrypted": true
						},
						"middlename": {
							"type": "string",
							"description": "Name",
							"encrypted": true
						},
						"lastname": {
							"type": "string",
							"description": "Name",
							"encrypted": true
						},												
						"address1": {
							"type": "string",
							"description": "Address 1",
							"encrypted": true
						},
						"city": {
							"type": "string",
							"description": "City",
							"encrypted": true
						},
						"zip": {
							"type": "string",
							"description": "Zip",
							"encrypted": true
						},
						"country": {
							"type": "string",
							"description": "Country",
							"encrypted": true
						},
						"mobileNo": {
							"type": "string",
							"description": "Mobile Number",
							"encrypted": true
						},
						"email": {
							"type": "string",
							"description": "Email"
						},
						"paymentUrl": {
							"type": "string",
							"description": "Payment URL"
						},
						"orderId": {
							"type": "string",
							"description": "Order ID"
						},
						"transactionId": {
							"type": "string",
							"description": "Transaction ID"
						},
						"transactionState": {
							"type": "string",
							"description": "Transaction State"
						},
						"statusResponse": {
							"type": "string",
							"description": "Status Response"
						},
						"createdDate": {
							"type": "string",
							"description": "Created Date",
							"format": "date-time"
						},
						"createdBy": {
							"type": "string",
							"encrypted": true,
							"description": "Created By"
						},
						"updatedDate": {
							"type": "string",
							"description": "Updated Date",
							"format": "date-time"
						},
						"updatedBy": {
							"type": "string",
							"encrypted": true,
							"description": "Updated By"
						},
						"dateFrom": {
							"type": "string",
							"description": "Date From Filter",
							"required": true
						},
						"dateTo": {
							"type": "string",
							"description": "Date To Filter",
							"required": true
						}
					}
                }
            },
            false
        );
		
		db.storeQuery(
            'nextday-processing',
			`SELECT DISTINCT
					customers.*
			FROM ` + "`" + DBModels.DB_SCHEMA + "`" + "customers " +
			"INNER JOIN" + "`" + DBModels.DB_SCHEMA  + "`" + "payments ON customers.customerId=payments.customerId AND payments._type=\""+ DBModels.DB_NAMESPACE + ":payments\" AND payments.transactionState=\"CAPTURED\" " +
			`WHERE customers._type="`+ DBModels.DB_NAMESPACE + `:customers"
				AND customers.forNextDay='Yes' 
				AND customers.forNextDayDate<=NOW_MILLIS()
				AND customers.rtsId!=""
				AND customers.rtsAction!=""
				`,
			db.getModel('customers').schemaFn,
            false
        );

		db.storeQuery(
            'get-workflow-payload-by-oir',
			"SELECT id AS payloadId FROM + `" + DBModels.DB_SCHEMA + "` " +
			"WHERE prushoppeData.oir=$oir",
			db.getModel('customers').schemaFn,
            false
        );

		db.storeQuery(
            'get-workflow-payload',
			"SELECT id AS payloadId FROM`" + DBModels.DB_SCHEMA + "` " +
			"WHERE prushoppeData.customerId=$customerId",
			db.getModel('customers').schemaFn,
            false
        );

		// db.storeQuery(
        //     'get-non-oirs',
		// 	"SELECT customerId, orderId, transactionState, updatedDate FROM `"+ DBModels.DB_SCHEMA +"` WHERE _type='prushoppe:payments' AND transactionState!='CAPTURED' AND updatedDate BETWEEN DATE_ADD_STR(NOW_TZ('Asia/Manila'), -"+process.env.NON_OIR_CRON_TO_MINUTES+", 'minute') AND  DATE_ADD_STR (NOW_TZ('Asia/Manila'), -"+process.env.NON_OIR_CRON_FROM_MINUTES+", 'minute')",
		// 	db.getModel('payments').schemaFn,
        //     false
        // );

		db.storeQuery(
            'get-non-oirs',
			"SELECT customerId, orderId, transactionState, updatedDate FROM `"+ DBModels.DB_SCHEMA +"` WHERE _type='prushoppe:payments' AND transactionState!='CAPTURED' AND updatedDate BETWEEN DATE_ADD_STR(NOW_LOCAL(), -"+process.env.NON_OIR_CRON_TO_MINUTES+", 'minute') AND  DATE_ADD_STR (NOW_LOCAL(), -"+process.env.NON_OIR_CRON_FROM_MINUTES+", 'minute')",
			db.getModel('payments').schemaFn,
            false
        );
    }
}
