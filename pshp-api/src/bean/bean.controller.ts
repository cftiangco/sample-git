import { Controller, Get, Post, Param, Body, Query, Headers, Response, StreamableFile } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { FormDataRequest } from 'nestjs-form-data';

import { DefaultHandler } from './handlers/default.handler';
import { DocumentHandler } from './handlers/document.handler';
import { CustomersHandler } from './handlers/customers.handler';
import { RefDocsHandler } from './handlers/refdocs.handler';
import { PaymentsHandler } from './handlers/payments.handler';

import { BeanService } from './bean.service';
import { DBService } from '../persistence/db.service';

import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

import { format } from 'date-fns-tz';

dotenv.config();
@Controller(process.env['SERVICE_NAMESPACE']+'/api')
export class BeanController {

    public static mode = {
        BATCH: true,
        REQUEST: false
    }

    handlers: Object = {
        '*': DefaultHandler.getInstance(),
        'document': DocumentHandler.getInstance(),
        'customers': CustomersHandler.getInstance(),
        'refdocs': RefDocsHandler.getInstance(),
        'payments': PaymentsHandler.getInstance()
    };

    modelActions: Object = {
        'get': 'get',
        'search': 'search',
        'seek': 'seek',
        'find': 'find',
        'import': 'import',
        'extract': 'extract',
        'create': 'create',
        'update': 'update',
        'remove': 'remove',
        'batch': 'batch'
    };

    queryActions: Object = {
        'query': 'query',
        'export': 'export'
    };     

    actions: Object = {
        'verify': 'verify',
        ...this.modelActions, ...this.queryActions       
    };   

    customActions: Object = {
        'sob': 'sob',
        'eapp': 'eapp',
        'esaf': 'esaf',
        'tlic': 'tlic'
    }

    publicActions: Object = {
        'schema': 'schema',
        'meta': 'meta',
        'login': 'login',
        'refresh': 'refresh',
        'status': 'status',
        'premium': 'premium'
    };

    publicModelActions: Object = {
        'customers': ['create', 'update', 'seek'],
        'document': ['search', 'seek'],
        'refdocs': ['create', 'update', 'search', 'seek'],
        'payments': ['create', 'search', 'seek'],
        'docs': ['eapp', 'sob', 'esaf', 'tlic']
    };

    initRoles: Array<string> = ['system:System', 'guest:Guest'];
    initYesNo: Array<string> = ['Y:Yes', 'N:No'];
    initRtsStatus: Array<Object> = [
     
        {'id': 'FactivaSIP', '_id':'FactivaSip', 'statusCode': 'FactivaSIP', 'action':'leadOut', 'description':'Special Interest Person.'},
        {'id': 'FactivaSanctionsPers', '_id':'FactivaSanctionsPers', 'statusCode': 'FactivaSanctionsPers', 'action':'leadOut', 'description':'SANCTION '},
        {'id': 'FactivaPEP', '_id':'FactivaPEP', 'statusCode': 'FactivaPEP', 'action':'delay', 'description':'Politically Exposed Person'},
        {'id': 'FactivaRCA', '_id':'FactivaRCA', 'statusCode': 'FactivaRCA', 'action':'delay', 'description':'Relative Close Associate'}
    ]

    excludeBeanNames:string = '';
    excludeModelActions:string = '';
    excludeQueryActions:string = '';

    excludeBeans:Object = {
        'system:settings': 'system:settings'
    };

    static API_ACCESS_KEY: string;
    static SERVICE_NAMESPACE: string;

    header_api_access_key: string = 'api_access_key';
    header_x_access_token: string = 'x-access-token';

    envProp(targetProperty: string): string {
        return process.env[targetProperty];
    }

    constructor(private readonly beanService: BeanService) {
        if(this.excludeBeanNames && this.excludeBeanNames.length>0){
            let names = this.excludeBeanNames.split(',');
            for(let i=0;i<names.length;i++){
                this.excludeBeans[names[i].trim()] = names[i].trim();
            }
        }
        if(this.excludeModelActions && this.excludeModelActions.length>0){
            let names = this.excludeModelActions.split(',');
            for(let i=0;i<names.length;i++){
                delete this.modelActions[names[i].trim()];
                delete this.actions[names[i].trim()];
            }
        } 
        if(this.excludeQueryActions && this.excludeQueryActions.length>0){
            let names = this.excludeQueryActions.split(',');
            for(let i=0;i<names.length;i++){
                delete this.queryActions[names[i].trim()];
                delete this.actions[names[i].trim()];
            }
        }               
        if (this.envProp('API_ACCESS_KEY_FILE')) {
            BeanController.API_ACCESS_KEY = fs.readFileSync(this.envProp('API_ACCESS_KEY_FILE'), 'utf8').trim();
        } else {
            BeanController.API_ACCESS_KEY = this.envProp('API_ACCESS_KEY');
        }
        BeanController.SERVICE_NAMESPACE = this.envProp('SERVICE_NAMESPACE');

        setTimeout(()=>{
            console.log('Bean Controller started', BeanController.SERVICE_NAMESPACE);
            DBService.connect((pc) => {
                if (pc.success) {
                    let db: DBService = <DBService>pc.result;
                    let models: any = db.getModels();
                    let queries: any = db.getQueries();
                    db.query('has-connection', { }, (pam)=>{
                        for (let i in this.publicActions) {
                            db.search('system:access', { action: i, role: 'guest', service: BeanController.SERVICE_NAMESPACE }, (pa) => {
                                if (pa.success && pa.result.length > 0) {
                                } else {
                                    db.create('system:access', { action: i, bean: '', role: 'guest', allow: 'Y', service: BeanController.SERVICE_NAMESPACE }, (pc) => { if(!pc.success) console.log(i, pa, pc); });
                                }
                            });
                        }

                        for (let m in this.publicModelActions) {
                            for(let i in this.publicModelActions[m]){
                                db.search('system:access', { action: this.publicModelActions[m][i], bean: m, role: 'guest', service: BeanController.SERVICE_NAMESPACE }, (pa) => {
                                    if (pa.success && pa.result.length > 0) {
                                    } else {
                                        db.create('system:access', { action: this.publicModelActions[m][i], bean: m, role: 'guest', allow: 'Y', service: BeanController.SERVICE_NAMESPACE }, (pc) => { if(!pc.success) console.log(i, pa, pc); });
                                    }
                                });
                            }
                        }                        

                        db.query('bean-access', { role: 'system', service: BeanController.SERVICE_NAMESPACE }, (pam)=>{
                            if(pam.success && pam.result.length>0){
                                let currentModels = {};
                                for(let i=0;i<pam.result.length;i++){
                                    currentModels[pam.result[i].bean] = true;
                                }
                                for (let m in currentModels) {
                                    if(models.hasOwnProperty(m) || queries.hasOwnProperty(m)){
                                    }else{
                                        db.removeAll('system:access', {'role': 'system', 'bean':m, service: BeanController.SERVICE_NAMESPACE},(pda)=>{
                                            console.log(pda);
                                        });
                                    }
                                }
                            }
                        });

                        for (let m in models) {
                            for (let i in this.modelActions) {
                                if(this.excludeBeans.hasOwnProperty(i)==false){
                                    db.search('system:access', { action: i, bean: m, role: 'system', service: BeanController.SERVICE_NAMESPACE }, (pa) => {
                                        if (pa.success && pa.result.length > 0) {
                                        } else {
                                            db.create('system:access', { action: i, bean: m, role: 'system', allow: 'Y', service: BeanController.SERVICE_NAMESPACE }, (pc) => { if(!pc.success) console.log(i, pa, pc); });
                                        }
                                    });
                                }
                            }
                        }

                        for (let q in queries) {
                            for (let i in this.queryActions) {
                                if(this.excludeBeans.hasOwnProperty(i)==false){
                                    db.search('system:access', { action: i, bean: q, role: 'system', service: BeanController.SERVICE_NAMESPACE }, (pa) => {
                                        if (pa.success && pa.result.length > 0) {
                                        } else {
                                            db.create('system:access', { action: i, bean: q, role: 'system', allow: 'Y', service: BeanController.SERVICE_NAMESPACE }, (pc) => { if(!pc.success) console.log(i, pa, pc); });
                                        }
                                    });
                                }
                            }
                        }

                        for (let ri=0; ri<this.initRoles.length; ri++) {
                            let rri = this.initRoles[ri].split(':');
                            db.search('system:role', { id: rri[0], name: rri[1], service: BeanController.SERVICE_NAMESPACE }, (pa) => {
                                if (pa.success && pa.result.length > 0) {
                                } else {
                                    db.create('system:role', { id: rri[0], name: rri[1], service: BeanController.SERVICE_NAMESPACE }, (pc) => { if(!pc.success) console.log(rri, pa, pc); });
                                }
                            });
                        }

                        for (let ri=0; ri<this.initYesNo.length; ri++) {
                            let rri = this.initYesNo[ri].split(':');
                            db.search('system:yesno', { id: rri[0], name: rri[1], service: BeanController.SERVICE_NAMESPACE }, (pa) => {
                                if (pa.success && pa.result.length > 0) {
                                } else {
                                    db.create('system:yesno', { id: rri[0], name: rri[1], service: BeanController.SERVICE_NAMESPACE }, (pc) => { if(!pc.success) console.log(rri, pa, pc); });
                                }
                            });
                        }

                        for (let rsi=0; rsi<this.initRtsStatus.length; rsi++) {
                            let status= this.initRtsStatus[rsi];
                            db.search('rts_status', {status}, (pa) => {
                                if (pa.success && pa.result.length > 0) {
                                } else {
                                    db.create('rts_status', status, (pc) => { if(!pc.success) console.log(rsi, pa, pc); });
                                }
                            });
                        }

                        db.search('system:settings', {service: BeanController.SERVICE_NAMESPACE}, (ps) => {
                            if (ps.success && ps.result.length <= 0) {
                                crypto.generateKeyPair('rsa', {
                                    modulusLength: 2048
                                }, (err, publicKey, privateKey) => {
                                    if (err) {
                                        console.log(err);
                                        return;
                                    }
                                    let pubkey = publicKey.export({
                                        type: "pkcs1",
                                        format: "pem",
                                    }).toString();
                                    let privkey = privateKey.export({
                                        type: "pkcs1",
                                        format: "pem",
                                    }).toString();

                                    
                                    db.create('system:settings', {
                                        service: BeanController.SERVICE_NAMESPACE,
                                        pub_sig: pubkey,
                                        priv_sig: privkey
                                    }, (pc) => {
                                        console.log('Initial Master Key Created', pc.success);
                                    });
                                });                                
                            }
                        });
        
                        db.search('system:user', {username:'root', service: BeanController.SERVICE_NAMESPACE}, (ps) => {
                            if (ps.success && ps.result.length <= 0) {
                                let now = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx", { timeZone: 'Asia/Manila' });
                                
                                var rootPass = "";
                                if (this.envProp('ROOT_USER_PASS_FILE')) {
                                    rootPass = fs.readFileSync(this.envProp('ROOT_USER_PASS_FILE'), 'utf8').trim();
                                } else {
                                    rootPass = this.envProp('ROOT_USER_PASS');
                                }
                                
                                db.create('system:user',{
                                    "service": BeanController.SERVICE_NAMESPACE,
                                    "username": "root",
                                    "password": rootPass,
                                    "role": "system",
                                    "active": "Y",
                                    "createDate": now,
                                    "createdBy": "system",
                                    "updateDate": now,
                                    "updatedBy": "system"
                                  },(pc)=>{
                                    console.log('Initial Root User Created', pc.success);
                                });                        
                            }
                        });                     
                    });
    
                    return;
                              
                }
            });
        },10000);
    }

    checkToken(conn: DBService, action: string, bean: string, headers: any, cb: Function) {
        if (this.publicActions.hasOwnProperty(action)) {
            cb({ found: true, role: 'guest', user:{ username:'guest', role: 'guest' }  });
        } else if (this.actions.hasOwnProperty(action)) {
            if (headers.hasOwnProperty(this.header_api_access_key) && headers[this.header_api_access_key] == BeanController.API_ACCESS_KEY) {
                cb({ found: true, role: 'system', user: { username: 'system', role: 'system' } });
            } else if (headers.hasOwnProperty(this.header_x_access_token)) {
                let token = headers[this.header_x_access_token];
                conn.search('system:settings', {service: BeanController.SERVICE_NAMESPACE}, (ps) => {
                    if (ps.success && ps.result.length > 0) {
                        jwt.verify(token, ps.result[0].pub_sig, { algorithms: ['RS256'], expiresIn: '15m' }, (err, user) => {
                            if (err) {
                                cb({ found: false, role: 'denied' });
                                return;
                            }
                            cb({ found: true, role: user.role, user: user });
                        });
                    }else{
                        cb({ found: false, role: 'denied' });
                    }
                });
            } else {
                cb({ found: false, role: 'denied' });
            }
        } else {
            cb({ found: false, role: 'denied' });
        }
    }

    isAllowed(conn: DBService, action: string, bean: string, headers: any, cb: Function) {
        this.checkToken(conn, action, bean, headers, (user) => {
            console.log('Checking Token', user);
            if (user.found) {
                let data = { action: action, bean: bean, role: user.role, service: BeanController.SERVICE_NAMESPACE };
                if(bean==undefined){
                    data.bean = '';
                }
                conn.query('has-access', data, (pa:any) => {
                    if (pa.success && pa.result.length > 0) {
                        cb({ 'success': true, 'message': 'access.allowed', user: user.user});
                    } else {
                        cb({ 'success': false, 'message': 'access.denied' });
                    }
                });
            } else {
                let data = { action: action, bean: bean, role: 'guest', service: BeanController.SERVICE_NAMESPACE };

                if(bean==undefined){
                    data.bean = '';
                }

                conn.query('has-access', data, (pa:any) => {
                    if (pa.success && pa.result.length > 0) {
                        cb({ 'success': true, 'message': 'access.allowed', user: { username:'guest', role: 'guest' } });
                    } else {
                        cb({ 'success': false, 'message': 'access.denied' });
                    }
                });
            }
        })
    }
    
    @Get('/:action')
    async processGetAction(@Param() params, @Query() query, @Body() body, @Headers() headers, @Response({ passthrough: true }) res): Promise<Object | StreamableFile>{
        return this.processRequest(params, query, body, headers, res);
    }

    @Post('/:action')
    @FormDataRequest()
    async processPostAction(@Param() params, @Query() query, @Body() body, @Headers() headers, @Response({ passthrough: true }) res): Promise<Object | StreamableFile> {
        return this.processRequest(params, query, body, headers, res);
    }

    @Get('/:action/:bean/:id')
    async processGetActionBeanId(@Param() params, @Query() query, @Body() body, @Headers() headers, @Response({ passthrough: true }) res): Promise<Object | StreamableFile> {
        return this.processRequest(params, query, body, headers, res);
    }

    @Post('/:action/:bean/:id')
    @FormDataRequest()
    async processPostActionBeanId(@Param() params, @Query() query, @Body() body, @Headers() headers, @Response({ passthrough: true }) res): Promise<Object | StreamableFile> {
        return this.processRequest(params, query, body, headers, res);
    }

    @Get('/:action/:bean')
    async processGetActionBean(@Param() params, @Query() query, @Body() body, @Headers() headers, @Response({ passthrough: true }) res): Promise<Object | StreamableFile> {
        return this.processRequest(params, query, body, headers, res);
    }

    @Post('/:action/:bean')
    @FormDataRequest()
    async processPostActionBean(@Param() params, @Query() query, @Body() body, @Headers() headers, @Response({ passthrough: true }) res): Promise<Object | StreamableFile> {
        return this.processRequest(params, query, body, headers, res);
    }

    async processRequest(params: any, query: any, body: any, headers: any, res: any): Promise<Object | StreamableFile> {
      
        console.log("REQUEST HEADERS ==========================\n", headers );
        console.log("\n\n=========================================\n\n");
        if(params && params.action && 
            (this.publicActions.hasOwnProperty(params.action) ||
             this.actions.hasOwnProperty(params.action) || this.customActions.hasOwnProperty(params.action))
        ){
            return new Promise<Object>((resolve, reject) => {
                DBService.connect((pc) => {
                    if (pc.success) {
                        let conn: DBService = <DBService>pc.result;
                        let { action, bean, id } = params;
                        let data = undefined;
                        let hasData = false;
                        
                        if (process.env.hasOwnProperty('ALLOWED_DOMAINS')) {

                            var payload:any = {};
                            if (body && body.hasOwnProperty('data')) {
                                payload = JSON.parse(body.data);
                            } else {
                                payload = body;
                            }

                            // var host = headers.host;
                            // var xhost = headers['x-original-host'];
                            //var hostList = process.env['ALLOWED_HOSTS'] ? process.env['ALLOWED_HOSTS'].split(',') : [];
                            var origin = headers.origin;
                            var postmanToken = null;
                            
                            if (process.env.hasOwnProperty('ENABLE_POSTMAN_TOKEN')) {
                                var postmanTokenKey = process.env.ENABLE_POSTMAN_TOKEN;
                                postmanToken = headers.hasOwnProperty(postmanTokenKey) ? headers[postmanTokenKey] : null;
                            }

                            var originList = process.env['ALLOWED_DOMAINS'] ? process.env['ALLOWED_DOMAINS'].split(',') : [];
                            var referer = headers.referer;
                            var refererList = process.env['ALLOWED_REFERERS'] ? process.env['ALLOWED_REFERERS'].split(',') : [];
                            var docActions = ['tlic', 'sob', 'eapp'];
                            var publicActions = ['login'];

                            //console.log("public Actions", params, publicActions, publicActions.indexOf(params.action))
                            //console.log( "LISTS: ", originList, refererList );
                            //console.log("processRequest Payload:", payload);  
                            if (payload.hasOwnProperty('landbot') && payload.landbot==1) {
                                //res.setHeader('Access-Control-Allow-Origin', 'https://chats.landbot.io');

                                /* crimson */
                                res.setHeader('Content-Security-Policy', "default-src 'self' unpkg.com;script-src 'self';object-src 'none';upgrade-insecure-requests;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;script-src-attr 'none';style-src 'self' https: 'unsafe-inline'" );
                                res.setHeader('X-Frame-Options', "SAMEORIGIN");
                                res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
                                res.setHeader('Referrer-Policy', 'same-origin');
                                res.setHeader('Permissions-Policy', `camera=(), microphone=(), geolocation=("${process.env.BASE_WEB_URL}")`);
                                /* crimson */

                                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                                res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Accept');
                                res.setHeader('Access-Control-Allow-Credentials', true);
                            }
                            else if (postmanToken!=null) {
                                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                                res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Accept');
                                res.setHeader('Access-Control-Allow-Credentials', true);
                            }
                            else if (origin!=undefined && origin!=null && originList.indexOf(origin)>-1) {
                                res.setHeader('Access-Control-Allow-Origin', origin);
                                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                                res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Accept');
                                res.setHeader('Access-Control-Allow-Credentials', true);
                            }
                            else if (referer!=undefined && referer!=null && refererList.indexOf(referer)>-1) {
                                res.setHeader('Access-Control-Allow-Origin', referer);
                                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                                res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Accept');
                                res.setHeader('Access-Control-Allow-Credentials', true);
                            }
                            else if (params.bean=='docs' && docActions.indexOf(params.action)>-1 ) {
                                res.setHeader('Access-Control-Allow-Origin', 'docs');
                                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                                res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Accept');
                                res.setHeader('Access-Control-Allow-Credentials', true);
                            }
                            else if (publicActions.indexOf(params.action) > -1) {
                                res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Accept');
                                res.setHeader('Access-Control-Allow-Credentials', true);
                            }
                            // else if (host!=undefined && host!=null && hostList.indexOf(host)!== -1) {
                            //     res.setHeader('Access-Control-Allow-Origin', host);
                            //     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                            //     res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Accept');
                            //     res.setHeader('Access-Control-Allow-Credentials', true);
                            // }
                            // else if (xhost!=undefined && xhost!=null && hostList.indexOf(xhost)!== -1) {
                            //     res.setHeader('Access-Control-Allow-Origin', xhost);
                            //     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
                            //     res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Accept');
                            //     res.setHeader('Access-Control-Allow-Credentials', true);
                            // }
                            else {

                                /* crimson */
                                res.setHeader('Content-Security-Policy', "default-src 'self' unpkg.com;script-src 'self';object-src 'none';upgrade-insecure-requests;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;script-src-attr 'none';style-src 'self' https: 'unsafe-inline'" );
                                res.setHeader('X-Frame-Options', "SAMEORIGIN");
                                res.setHeader('Cache-control', 'no-cache, no-store, must-revalidate');
                                res.setHeader('Referrer-Policy', 'same-origin');
                                res.setHeader('Permissions-Policy', `camera=(), microphone=(), geolocation=("${process.env.BASE_WEB_URL}")`);
                                /* crimson */

                                console.log("INVALID HEADERS:", headers, params);

                                res.setHeader('Access-Control-Allow-Origin', 'forbidden');
                                res.setHeader('Access-Control-Allow-Credentials', false);
                                reject({success: false, status: "request.failed", message: "forbidden", statusCode: 403 });
                                conn.close();
                                return;
                            }
                        }

                        var beanWithCSP = ["payment", "customer"];
                        var actionsWithCSP = ["id-upload", "link", "status", "create"];
                        
                        if (beanWithCSP.includes(bean) && actionsWithCSP.includes(action) ) {

                            /* crimson */
                            res.setHeader('Cache-control', 'no-cache, no-store, must-revalidate');
                            res.setHeader('Referrer-Policy', 'same-origin');
                            res.setHeader('Permissions-Policy', `camera=(), microphone=(), geolocation=("${process.env.BASE_WEB_URL}")`);
                            /* crimson */

                            res.setHeader('X-Frame-Options', "SAMEORIGIN");
                            res.setHeader('Content-Security-Policy', "default-src 'self' unpkg.com;script-src 'self';object-src 'none';upgrade-insecure-requests;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;script-src-attr 'none';style-src 'self' https: 'unsafe-inline'" );
                        }
                        else if (action=="premium") {
                            /* crimson */
                            res.setHeader('Cache-control', 'no-cache, no-store, must-revalidate');
                            res.setHeader('Referrer-Policy', 'same-origin');
                            res.setHeader('Permissions-Policy', `camera=(), microphone=(), geolocation=("${process.env.BASE_WEB_URL}")`);
                            /* crimson */

                            res.setHeader('X-Frame-Options', "SAMEORIGIN");
                            res.setHeader('Content-Security-Policy', "default-src 'self' unpkg.com;script-src 'self';object-src 'none';upgrade-insecure-requests;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;script-src-attr 'none';style-src 'self' https: 'unsafe-inline'" );
                        }
                        else {
                            /* crimson */
                            res.setHeader('Cache-control', 'no-cache, no-store, must-revalidate');
                            res.setHeader('Content-Security-Policy', "default-src 'self' unpkg.com;script-src 'self';object-src 'none';upgrade-insecure-requests;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;script-src-attr 'none';style-src 'self' https: 'unsafe-inline'" );
                            res.setHeader('Referrer-Policy', 'same-origin');
                            res.setHeader('Permissions-Policy', `camera=(), microphone=(), geolocation=("${process.env.BASE_WEB_URL}")`);
                            /* crimson */
                            
                            res.setHeader('X-Frame-Options', "SAMEORIGIN");
                        }

                        if(headers && query && !headers.hasOwnProperty(this.header_api_access_key) && query.hasOwnProperty && query.hasOwnProperty(this.header_api_access_key)){
                            headers[this.header_api_access_key] = query[this.header_api_access_key];
                        }
                        try {
                            if (body && body.hasOwnProperty('data')) {
                                data = JSON.parse(body.data);
                                hasData = true;
                            } else {
                                data = body;
                            }
                        
                        } catch (e) {
                            conn.close();
                            resolve({ 'success': false, 'message': 'api.failed.data' });
                        }

                        if (action == 'batch') {
                            try {
                                let cIndex = -1;
                                let results = [];
                                let fn = () => {
                                    cIndex++;
                                    if (cIndex >= data.length) {
                                        resolve({ 'success': true, 'message': 'batch.success', result: results });
                                        return;
                                    }
                                    let b = data[cIndex];
                                    if (!b.hasOwnProperty('id')) {
                                        b.id = '';
                                    } else if (!b.hasOwnProperty('data')) {
                                        b.data = {};
                                    }
                                    this.executeRequest(conn, b.action, b.bean, b.data, b.id, headers, body, BeanController.mode.BATCH, (p) => {
                                        p.key = b.key;
                                        if(p && p.hasOwnProperty('success') && p.success==false){
                                            console.log({
                                                action: b.action,
                                                bean: b.bean,
                                                data: b.data,
                                                id: b.id,
                                                reply: p
                                            });
                                        }
                                        results.push(p);
                                        fn();
                                    });
                                };
                                fn();
                            } catch (e) {
                                resolve({ 'success': false, 'message': 'access.denied' });
                                return;
                            }
                        } else {
                            this.executeRequest(conn, action, bean, data, id, headers, body, BeanController.mode.REQUEST, (p) => {
                                if(p && p.hasOwnProperty('success') && p.success==false){
                                    console.log({
                                        action: action,
                                        bean: bean,
                                        data: data,
                                        id: id,
                                        reply: p
                                    });
                                }
                                if(p.hasOwnProperty('buffer')){
                                    res.set({
                                        'Content-Type': p.contentType,
                                        'Content-Disposition': p.contentDisposition
                                    });
                                    resolve(new StreamableFile(p.buffer));
                                }else if(p.hasOwnProperty('fileStream')){
                                    res.set({
                                        'Content-Type': p.contentType,
                                        'Content-Disposition': p.contentDisposition
                                    });
                                    p.fileStream.stream.pipe(res);
                                    p.fileStream.proceed(p.fileStream.stream, ()=>{
                                        p.fileStream.stream.end();
                                        //resolve(null);
                                    });
                                }else{
                                    resolve(p);
                                }
                            });
                        }
                    } else {
                        resolve({ 'success': false, 'message': 'api.failed.connection' });
                    }
                });
            });
        }else{
            return new Promise<Object>((resolve, reject) => {
                resolve({ 'success': false, 'message': 'api.failed.promise' });
            });
        }
    }

    getControl(){
        return {
            execute: (control: any, user: any, conn: any, action: string, bean: string, data: any, id: string, body: any, batchMode: boolean, callback: Function) => {
                let adata = { action: action, bean: bean, role: user.role, service: BeanController.SERVICE_NAMESPACE };
                if(bean==undefined){
                    adata.bean = '';
                }
                conn.query('has-access', adata, (pa:any) => {
                    if (pa.success && pa.result.length > 0) {
                        this.performRequest(control, user, conn, action, bean, data, id, body, batchMode, callback);
                    } else {
                        callback({ 'success': false, 'message': 'access.denied' });
                    }
                });
            }
        }
    }

    performRequest(control: any, user: any, conn: any, action: string, bean: string, data: any, id: string, body: any, batchMode: boolean, callback: Function) {
        try {
            let files:any = [];
            // if(!data){
            //     data = {};
            // }
            for(let i in body){
                console.log(i,body[i]);
                if(body[i] && body[i].hasOwnProperty('buffer')){
                    body[i].fieldname = i;
                    files.push(body[i]);
                }
                // else{
                //     if(data && !data.hasOwnProperty(i)){
                //         data[body[i].fieldname] = body[i];
                //     }
                // }
            }
            let postback = (p) => {
                if (this.handlers.hasOwnProperty(bean) && this.handlers[bean].hasAfter(action, bean)) {
                    this.handlers[bean].getAfter(action, bean)(control, user, conn, bean, data, id, files, p, callback);
                } else if (this.handlers['*'].hasAfter(action, bean)) {
                    this.handlers['*'].getAfter(action, bean)(control, user, conn, bean, data, id, files, p, callback);
                } else {
                    callback(p);
                }
            }

            let flowback = () => {
                this.beanService[action](control, user, conn, bean, data, id, files, (p) => {
                    postback(p);
                    if (batchMode || p.batchMode) {
                    }else{
                        conn.close();
                    }
                });                        
            }                    

            if(this.handlers.hasOwnProperty(bean) && this.handlers[bean].hasBefore(action, bean)){
                this.handlers[bean].getBefore(action, bean)(control, user, conn, bean, data, id, files, flowback, callback);
            }else if(this.handlers['*'].hasBefore(action, bean)){
                this.handlers['*'].getBefore(action, bean)(control, user, conn, bean, data, id, files, flowback, callback);
            }else{
                flowback();
            }

        } catch (e) {
            console.log('error', action, bean, e);
            callback({ 'success': false, 'message': 'access.denied' });
            conn.close();
        }
    }

    async executeRequest(conn: any, action: string, bean: string, data: any, id: string, headers: any, body: any, batchMode: boolean, callback: Function) {
        this.isAllowed(conn, action, bean, headers, (pa) => {
            if (pa.success) {
                let control = this.getControl();
                this.performRequest(control, pa.user, conn, action, bean, data, id, body, batchMode, callback);
            } else {
                callback({ 'success': false, 'message': 'access.denied' });
            }
        });        
    }

}
