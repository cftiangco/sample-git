
export class SwaggerHelper{

    public static schema(service:any, control:any, user: any, db: any, bean: any, data: any, id: string, files:any, callback: Function){ 
        let models = db.getModels();
        let queries = db.getQueries();
        let serviceURL = db.envProp('SERVICE_URL');
        let appName = db.envProp('APP_NAME');
        let serviceNamespace = '/'+db.envProp('SERVICE_NAMESPACE')+'/api';
        serviceURL = serviceURL.substring(0,serviceURL.length-serviceNamespace.length);
        let doctypes = ['eapp', 'sob', 'esaf', 'tlic'];

        let cleanUp = (m: any) => {
            for (let i in m) {
                if (i == '$ref') {
                    m[i] = '#/components/schemas' + m[i].toLowerCase();
                } else if (i == 'encrypted' || i == 'unique' || i == '$lookup' || i == 'entry') {
                    delete m[i];
                } else {
                    if (Array.isArray(m[i])) {
                        cleanUp(m[i]);
                    } else if (typeof m[i] == 'object') {
                        cleanUp(m[i]);
                    }
                }
            }
        };

        let schema = {
            openapi: '3.0.0',
            info: {
                version: '1.0',
                title: appName+': ' + serviceURL,
                description: appName+' endpoints'
            },
            servers: [
                { url: serviceURL }
            ],
            components: {
                securitySchemes: {
                    api_access_key: {
                        type: 'apiKey',
                        in: 'header',
                        name: 'x-access-token',
                        description: "All requests must include the `x-access-token` header containing your authorized key"
                    }
                },
                schemas: {}
            },
            security: [
                { api_access_key: [] }
            ],
            paths: {
            }
        };

        schema.paths['/api/premium'] = {
            post: {
                "tags": [
                    "Public"
                ],
                "description": "premium api",
                "requestBody": {
                    "description": "request body for premium",
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "age": {
                                        "type": "number"
                                    },
                                    "gender": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "OK",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "description": "result for premium",
                                    "type": "object",
                                    "required": [
                                        "success"
                                    ],
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };

        schema.paths['/api/customer/create'] = {
            post: {
                "tags": [
                    "Public"
                ],
                "description": "create for customers",
                "requestBody": {
                    "description": "request body for customers",
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/customers"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "OK",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "description": "create result for customers",
                                    "type": "object",
                                    "required": [
                                        "success",
                                        "message",
                                        "result"
                                    ],
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "result": {
                                            "$ref": "#/components/schemas/customers"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };     
        
        schema.paths['/api/customer/update'] = {
            post: {
                "tags": [
                    "Public"
                ],
                "description": "update for customers",
                "requestBody": {
                    "description": "request body for customers",
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/customers"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "OK",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "description": "update result for customers",
                                    "type": "object",
                                    "required": [
                                        "success",
                                        "message",
                                        "result"
                                    ],
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "result": {
                                            "$ref": "#/components/schemas/customers"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };   
        
        schema.paths['/api/customer/id-upload'] = {
            post: {
                "tags": [
                    "Public"
                ],
                "description": "create with upload for refdocs",
                "requestBody": {
                    "description": "request body for refdocs",
                    "content": {
                        "multipart/form-data": {
                            "schema": {
                                "description": "create payload for refdocs",
                                "type": "object",
                                "required": [
                                    "customerId"
                                ],
                                "properties": {
                                    "customerId": {
                                        "type": "string"
                                    },
                                    "idfile": {
                                        "type": "string",
                                        "format": "binary"
                                    }
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "OK",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "description": "standard result for refdocs",
                                    "type": "object",
                                    "required": [
                                        "success",
                                        "message",
                                        "result"
                                    ],
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "result": {
                                            "type": "array",
                                            "items": {
                                                "$ref": "#/components/schemas/refdocs"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }; 
                
        schema.paths['/api/customer/id-upload/sms'] = {
            post: {
                "tags": [
                    "Public"
                ],
                "description": "seek with upload for refdocs",
                "requestBody": {
                    "description": "request body for refdocs",
                    "content": {
                        "application/json": {
                            "schema": {
                                "description": "seek payload for refdocs",
                                "type": "object",
                                "properties": {
                                    "customerId": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "OK",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "description": "standard result for refdocs",
                                    "type": "object",
                                    "required": [
                                        "success",
                                        "message",
                                        "result"
                                    ],
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "result": {
                                            "type": "array",
                                            "items": {
                                                "$ref": "#/components/schemas/refdocs"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }; 

        schema.paths['/api/customer/id-upload/status'] = {
            post: {
                "tags": [
                    "Public"
                ],
                "description": "search with upload for refdocs",
                "requestBody": {
                    "description": "request body for refdocs",
                    "content": {
                        "application/json": {
                            "schema": {
                                "description": "search payload for refdocs",
                                "type": "object",
                                "properties": {
                                    "customerId": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "OK",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "description": "standard result for refdocs",
                                    "type": "object",
                                    "required": [
                                        "success",
                                        "message",
                                        "result"
                                    ],
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "result": {
                                            "type": "array",
                                            "items": {
                                                "$ref": "#/components/schemas/refdocs"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }; 

        schema.paths['/api/docs/policy/sms'] = {
            post: {
                "tags": [
                    "Public"
                ],
                "description": "seek for document",
                "requestBody": {
                    "description": "request body for document",
                    "content": {
                        "application/json": {
                            "schema": {
                                "description": "seek payload for document",
                                "type": "object",
                                "properties": {
                                    "doc": {
                                        "type": "string"
                                    },
                                    "customerId": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "OK",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "description": "standard result for document",
                                    "type": "object",
                                    "required": [
                                        "success",
                                        "message",
                                        "result"
                                    ],
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "result": {
                                            "type": "array",
                                            "items": {
                                                "$ref": "#/components/schemas/document"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };        

        schema.paths['/api/payment/link'] = {
            post: {
                "tags": [
                    "Public"
                ],
                "description": "create for payments",
                "requestBody": {
                    "description": "request body for payments",
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/payments"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "OK",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "description": "create result for payments",
                                    "type": "object",
                                    "required": [
                                        "success",
                                        "message",
                                        "result"
                                    ],
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "result": {
                                            "$ref": "#/components/schemas/payments"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };

        schema.paths['/api/payment/status'] = {
            post: {
                "tags": [
                    "Public"
                ],
                "description": "quick search for payments",
                "requestBody": {
                    "description": "request body for payments",
                    "content": {
                        "application/json": {
                            "schema": {
                                "description": "search payload for payments",
                                "type": "object",
                                "properties": {
                                    "customerId": {
                                        "type": "string"
                                    }
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "OK",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "description": "query result for payments",
                                    "type": "object",
                                    "required": [
                                        "success",
                                        "message",
                                        "result"
                                    ],
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "message": {
                                            "type": "string"
                                        },
                                        "result": {
                                            "$ref": "#/components/schemas/payments"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };

        for(let d in doctypes){
            schema.paths['/api/docs/policy/'+doctypes[d]+'/{id}'] = {
                "get": {
                    "tags": [
                        "Public"
                    ],
                    "description": "view "+doctypes[d]+" for docs",
                    "parameters": [
                        {
                            "in": "path",
                            "name": "id",
                            "description": "option id of the docs record",
                            "schema": {
                                "type": "string"
                            },
                            "required": true
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "OK",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "description": "standard result for docs",
                                        "type": "object",
                                        "required": [
                                            "success",
                                            "message",
                                            "result"
                                        ],
                                        "properties": {
                                            "success": {
                                                "type": "boolean"
                                            },
                                            "message": {
                                                "type": "string"
                                            },
                                            "result": {
                                                "type": "array",
                                                "items": {
                                                    "$ref": "#/components/schemas/docs"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            };
        }

        schema.paths[serviceNamespace+'/login'] = {
            post: {
                tags: ['Authorization'],
                description: 'login api',
                requestBody: {
                    description: 'request body for login',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    service: { type: 'string', example: db.envProp('SERVICE_NAMESPACE')},
                                    username: { type: 'string' },
                                    password: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'OK',
                        content: {
                            'application/json': {
                                'schema': {
                                    description: 'result for login',
                                    type: 'object',
                                    required: [
                                        'success',
                                        'message',
                                        'result'
                                    ],
                                    properties: {
                                        success: { type: 'boolean' },
                                        message: { type: 'string' },
                                        result: {
                                            type: 'object',
                                            properties: {
                                                token: { type: 'string' },
                                                refresh: { type: 'string' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };     

        schema.paths[serviceNamespace+'/premium'] = {
            post: {
                tags: ['Authorization'],
                description: 'premium api',
                requestBody: {
                    description: 'request body for premium',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    age: { type: 'number'},
                                    gender: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'OK',
                        content: {
                            'application/json': {
                                'schema': {
                                    description: 'result for premium',
                                    type: 'object',
                                    required: [
                                        'success'
                                    ],
                                    properties: {
                                        success: { type: 'boolean' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };       

        schema.paths[serviceNamespace+'/verify'] = {
            post: {
                tags: ['Authorization'],
                description: 'verify api',
                requestBody: {
                    description: 'request body for verify',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    token: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'OK',
                        content: {
                            'application/json': {
                                'schema': {
                                    description: 'result for verify',
                                    type: 'object',
                                    required: [
                                        'found',
                                        'role',
                                        'user'
                                    ],
                                    properties: {
                                        found: { type: 'boolean' },
                                        role: { type: 'string' },
                                        user: {
                                            type: 'object'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }; 

        for (let i in models) {

            if (service.excludeBeans.hasOwnProperty(i) || db.excludeModels.hasOwnProperty(i)) {
                continue;
            }

            schema.components.schemas[i] = models[i].schemaFn();
            if(schema.components.schemas[i].properties.hasOwnProperty('id')){
                let idProp = schema.components.schemas[i].properties.id;
                idProp.description = idProp.description + ' (ignored when creating)';
            }
            delete schema.components.schemas[i].id;
            cleanUp(schema.components.schemas[i]);

            if(i=='docs'){
                for(let d in doctypes){
                    schema.paths[doctypes[d]+'/' + i + '/{id}'] = {
                        get: {
                            tags: [i],
                            description: 'view '+doctypes[d]+'for ' + i,
                            parameters: [
                                {
                                    'in': 'path',
                                    'name': 'id',
                                    'description': 'option id of the ' + i + ' record',
                                    'schema': {
                                        'type': 'string'
                                    },
                                    required: true
                                }
                            ],
                            responses: {
                                '200': {
                                    description: 'OK',
                                    content: {
                                        'application/json': {
                                            'schema': {
                                                description: 'standard result for ' + i,
                                                type: 'object',
                                                required: [
                                                    'success',
                                                    'message',
                                                    'result'
                                                ],
                                                properties: {
                                                    success: { type: 'boolean' },
                                                    message: { type: 'string' },
                                                    result: {
                                                        type: 'array',
                                                        items: {
                                                            '$ref': '#/components/schemas/' + i
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    };                    
                }
            }

            if(!service.excludeActions.hasOwnProperty('create')){
                let hasAttachments = false;
                let attachments = {};
                for(let ha in schema.components.schemas[i].properties){
                    if(schema.components.schemas[i].properties[ha].hasOwnProperty('format') && schema.components.schemas[i].properties[ha]['format']=='binary'){
                        hasAttachments = true;
                        attachments[ha] = { type: 'string', format: 'binary' };
                    }
                }
                if(hasAttachments){
                    schema.paths[serviceNamespace+'/create/' + i] = {
                        post: {
                            tags: [i],
                            description: 'create with upload for ' + i,
                            requestBody: {
                                description: 'request body for ' + i,
                                content: {
                                    'multipart/form-data': {
                                        schema: {
                                            description: 'create payload for ' + i,
                                            type: 'object',
                                            required: [
                                                'data'
                                            ],
                                            properties: {
                                                data: {
                                                    '$ref': '#/components/schemas/' + i
                                                },
                                                ...attachments
                                            }
                                        }
                                    }
                                }
                            },
                            responses: {
                                '200': {
                                    description: 'OK',
                                    content: {
                                        'application/json': {
                                            'schema': {
                                                description: 'standard result for ' + i,
                                                type: 'object',
                                                required: [
                                                    'success',
                                                    'message',
                                                    'result'
                                                ],
                                                properties: {
                                                    success: { type: 'boolean' },
                                                    message: { type: 'string' },
                                                    result: {
                                                        type: 'array',
                                                        items: {
                                                            '$ref': '#/components/schemas/' + i
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    };
                }else{
                    schema.paths[serviceNamespace+'/create/' + i] = {
                        post: {
                            tags: [i],
                            description: 'create for ' + i,
                            requestBody: {
                                description: 'request body for ' + i,
                                content: {
                                    'application/json': {
                                        schema: {
                                            '$ref': '#/components/schemas/' + i
                                        }
                                    }
                                }
                            },
                            responses: {
                                '200': {
                                    description: 'OK',
                                    content: {
                                        'application/json': {
                                            'schema': {
                                                description: 'create result for ' + i,
                                                type: 'object',
                                                required: [
                                                    'success',
                                                    'message',
                                                    'result'
                                                ],
                                                properties: {
                                                    success: { type: 'boolean' },
                                                    message: { type: 'string' },
                                                    result: {
                                                        '$ref': '#/components/schemas/' + i
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    };
                }
            }

            if(!service.excludeActions.hasOwnProperty('update')){
                let hasAttachments = false;
                let attachments = {};
                for(let ha in schema.components.schemas[i].properties){
                    if(schema.components.schemas[i].properties[ha].hasOwnProperty('format') && schema.components.schemas[i].properties[ha]['format']=='binary'){
                        hasAttachments = true;
                        attachments[ha] = { type: 'string', format: 'binary' };
                    }
                }
                if(hasAttachments){
                    schema.paths[serviceNamespace+'/update/' + i] = {
                        post: {
                            tags: [i],
                            description: 'update with upload for ' + i,
                            requestBody: {
                                description: 'request body for ' + i,
                                content: {
                                    'multipart/form-data': {
                                        schema: {
                                            description: 'update payload for ' + i,
                                            type: 'object',
                                            required: [
                                                'data'
                                            ],
                                            properties: {
                                                data: {
                                                    '$ref': '#/components/schemas/' + i
                                                },
                                                ...attachments
                                            }
                                        }
                                    }
                                }
                            },
                            responses: {
                                '200': {
                                    description: 'OK',
                                    content: {
                                        'application/json': {
                                            'schema': {
                                                description: 'standard result for ' + i,
                                                type: 'object',
                                                required: [
                                                    'success',
                                                    'message',
                                                    'result'
                                                ],
                                                properties: {
                                                    success: { type: 'boolean' },
                                                    message: { type: 'string' },
                                                    result: {
                                                        type: 'array',
                                                        items: {
                                                            '$ref': '#/components/schemas/' + i
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    };
                }else{
                    schema.paths[serviceNamespace+'/update/' + i] = {
                        post: {
                            tags: [i],
                            description: 'update for ' + i,
                            requestBody: {
                                description: 'request body for ' + i,
                                content: {
                                    'application/json': {
                                        schema: {
                                            '$ref': '#/components/schemas/' + i
                                        }
                                    }
                                }
                            },
                            responses: {
                                '200': {
                                    description: 'OK',
                                    content: {
                                        'application/json': {
                                            'schema': {
                                                description: 'update result for ' + i,
                                                type: 'object',
                                                required: [
                                                    'success',
                                                    'message',
                                                    'result'
                                                ],
                                                properties: {
                                                    success: { type: 'boolean' },
                                                    message: { type: 'string' },
                                                    result: {
                                                        '$ref': '#/components/schemas/' + i
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    };
                }
            }

            if(!service.excludeActions.hasOwnProperty('remove')){
                schema.paths[serviceNamespace+'/remove/' + i + '/{id}'] = {
                    get: {
                        tags: [i],
                        description: 'remove an entry of ' + i,
                        parameters: [
                            {
                                'in': 'path',
                                'name': 'id',
                                'description': 'option id of the ' + i + ' record',
                                'schema': {
                                    'type': 'string'
                                },
                                required: true
                            }
                        ],
                        responses: {
                            '200': {
                                description: 'OK',
                                content: {
                                    'application/json': {
                                        'schema': {
                                            description: 'standard result for ' + i,
                                            type: 'object',
                                            required: [
                                                'success',
                                                'message',
                                                'result'
                                            ],
                                            properties: {
                                                success: { type: 'boolean' },
                                                message: { type: 'string' },
                                                result: {
                                                    type: 'array',
                                                    items: {
                                                        '$ref': '#/components/schemas/' + i
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                };
            }

            if(!service.excludeActions.hasOwnProperty('find')){
                schema.paths[serviceNamespace+'/find/' + i] = {
                    get: {
                        tags: [i],
                        description: 'quick list for ' + i,
                        responses: {
                            '200': {
                                description: 'OK',
                                content: {
                                    'application/json': {
                                        'schema': {
                                            description: 'standard result for ' + i,
                                            type: 'object',
                                            required: [
                                                'success',
                                                'message',
                                                'result'
                                            ],
                                            properties: {
                                                success: { type: 'boolean' },
                                                message: { type: 'string' },
                                                result: {
                                                    type: 'array',
                                                    items: {
                                                        '$ref': '#/components/schemas/' + i
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                };
            }

            if(!service.excludeActions.hasOwnProperty('find')){
                schema.paths[serviceNamespace+'/find/' + i + '/{id}'] = {
                    get: {
                        tags: [i],
                        description: 'quick find for ' + i,
                        parameters: [
                            {
                                'in': 'path',
                                'name': 'id',
                                'description': 'option id of the ' + i + ' record',
                                'schema': {
                                    'type': 'string'
                                },
                                required: true
                            }
                        ],
                        responses: {
                            '200': {
                                description: 'OK',
                                content: {
                                    'application/json': {
                                        'schema': {
                                            description: 'standard result for ' + i,
                                            type: 'object',
                                            required: [
                                                'success',
                                                'message',
                                                'result'
                                            ],
                                            properties: {
                                                success: { type: 'boolean' },
                                                message: { type: 'string' },
                                                result: {
                                                    type: 'array',
                                                    items: {
                                                        '$ref': '#/components/schemas/' + i
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                };
            }

            if(!service.excludeActions.hasOwnProperty('get')){
                schema.paths[serviceNamespace+'/get/' + i + '/{id}'] = {
                    get: {
                        tags: [i],
                        description: 'quick find for ' + i,
                        parameters: [
                            {
                                'in': 'path',
                                'name': 'id',
                                'description': 'option id of the ' + i + ' record',
                                'schema': {
                                    'type': 'string'
                                },
                                required: true
                            }
                        ],
                        responses: {
                            '200': {
                                description: 'OK',
                                content: {
                                    'application/json': {
                                        'schema': {
                                            description: 'standard result for ' + i,
                                            type: 'object',
                                            required: [
                                                'success',
                                                'message',
                                                'result'
                                            ],
                                            properties: {
                                                success: { type: 'boolean' },
                                                message: { type: 'string' },
                                                result: {
                                                    type: 'array',
                                                    items: {
                                                        '$ref': '#/components/schemas/' + i
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                };
            }        
            
            if(!service.excludeActions.hasOwnProperty('search')){
                schema.paths[serviceNamespace+'/search/' + i] = {
                    post: {
                        tags: [i],
                        description: 'quick search for ' + i,
                        requestBody: {
                            description: 'request body for ' + i,
                            content: {
                                'application/json': {
                                    schema: {
                                        description: 'standard filter params for ' + i,
                                        type: 'object'
                                    }
                                }
                            }
                        },
                        responses: {
                            '200': {
                                description: 'OK',
                                content: {
                                    'application/json': {
                                        'schema': {
                                            description: 'query result for ' + i,
                                            type: 'object',
                                            required: [
                                                'success',
                                                'message',
                                                'result'
                                            ],
                                            properties: {
                                                success: { type: 'boolean' },
                                                message: { type: 'string' },
                                                result: {
                                                    '$ref': '#/components/schemas/' + i
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                };
            }

            if(!service.excludeActions.hasOwnProperty('import')){
                let sampleColumns = {};
                let sampleFields = schema.components.schemas[i].properties;
                for(let sf in sampleFields){
                    sampleColumns[sf] = sf;
                }
                let sampleData = JSON.stringify({'$columns':sampleColumns});
                schema.paths[serviceNamespace+'/import/' + i] = {
                    post: {
                        tags: [i],
                        description: 'csv import for ' + i,
                        requestBody: {
                            description: 'request body for ' + i,
                            content: {
                                'multipart/form-data': {
                                    schema: {
                                        description: 'import payload for ' + i,
                                        type: 'object',
                                        required: [
                                            'data',
                                            'file'
                                        ],
                                        properties: {
                                            data: { type: 'string', example: sampleData },
                                            file: { type: 'string', format: 'binary' }
                                        }
                                    }
                                }
                            }
                        },
                        responses: {
                            '200': {
                                description: 'OK',
                                content: {
                                    'application/json': {
                                        'schema': {
                                            description: 'standard result for ' + i,
                                            type: 'object',
                                            required: [
                                                'success',
                                                'message',
                                                'result'
                                            ],
                                            properties: {
                                                success: { type: 'boolean' },
                                                message: { type: 'string' },
                                                result: {
                                                    type: 'array',
                                                    items: {
                                                        '$ref': '#/components/schemas/' + i
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                };
            }

            if(!service.excludeActions.hasOwnProperty('extract')){
                schema.paths[serviceNamespace+'/extract/' + i] = {
                    post: {
                        tags: [i],
                        description: 'quick search for ' + i,
                        requestBody: {
                            description: 'request body for ' + i,
                            content: {
                                'application/json': {
                                    schema: {
                                        description: 'standard filter params for ' + i,
                                        type: 'object'
                                    }
                                }
                            }
                        },
                        responses: {
                            '200': {
                                description: 'OK',
                                content: {
                                    'application/octet-stream': {
                                        'schema': {
                                            description: 'extract result for ' + i,
                                            type: 'string',
                                            format: 'binary'
                                        }
                                    }
                                }
                            }
                        }
                    }
                };
            }
        }

        for (let i in queries) {

            if (service.excludeBeans.hasOwnProperty(i) || db.excludeModels.hasOwnProperty(i)) {
                continue;
            }

            schema.components.schemas[i] = queries[i].schemaFn();

            delete schema.components.schemas[i].id;
            cleanUp(schema.components.schemas[i]);


            if(!service.excludeActions.hasOwnProperty('query')){
                schema.paths[serviceNamespace+'/query/' + i] = {
                    post: {
                        tags: [i],
                        description: 'quick search for ' + i,
                        requestBody: {
                            description: 'request body for ' + i,
                            content: {
                                'application/json': {
                                    schema: {
                                        '$ref': '#/components/schemas/' + i
                                    }
                                }
                            }
                        },
                        responses: {
                            '200': {
                                description: 'OK',
                                content: {
                                    'application/json': {
                                        'schema': {
                                            description: 'query result for ' + i,
                                            type: 'object',
                                            required: [
                                                'success',
                                                'message',
                                                'result'
                                            ],
                                            properties: {
                                                success: { type: 'boolean' },
                                                message: { type: 'string' },
                                                result: {
                                                    '$ref': '#/components/schemas/' + i
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                };
            }

            if(!service.excludeActions.hasOwnProperty('export')){
                schema.paths[serviceNamespace+'/export/' + i] = {
                    post: {
                        tags: [i],
                        description: 'quick export for ' + i,
                        requestBody: {
                            description: 'request body for ' + i,
                            content: {
                                'application/json': {
                                    schema: {
                                        description: 'standard filter params for ' + i,
                                        type: 'object'
                                    }
                                }
                            }
                        },
                        responses: {
                            '200': {
                                description: 'OK',
                                content: {
                                    'application/octet-stream': {
                                        'schema': {
                                            description: 'export result for ' + i,
                                            type: 'string',
                                            format: 'binary'
                                        }
                                    }
                                }
                            }
                        }
                    }
                };
            }                       
        }
        callback(schema);
    }
}