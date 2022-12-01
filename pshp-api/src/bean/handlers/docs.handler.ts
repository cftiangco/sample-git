
import { Handler } from './handler.interface';
import { AppHelper } from '../helpers/app.helper';
import { v4 as uuidv4 } from 'uuid';
import { CustomerHelper } from './utils/customer.helper';
import * as moment from 'moment';

export class DocsHandler implements Handler{
    private static _instance: DocsHandler;

    beforeCalls: Object = {};
    afterCalls: Object = {};
    
    private constructor(){
        this.setupHandlers();
    }

    hasBefore(action: string, bean: string):boolean{
        return this.beforeCalls.hasOwnProperty(action+'::'+bean);
    }

    hasAfter(action: string, bean: string):boolean{
        return this.afterCalls.hasOwnProperty(action+'::'+bean);
    }  
    
    getBefore(action: string, bean: string):Function{
        return this.beforeCalls[action+'::'+bean];
    }

    getAfter(action: string, bean: string):Function{
        return this.afterCalls[action+'::'+bean];
    }     

    before(action:string, bean:string, handle:Function){
        this.beforeCalls[action+'::'+bean] = handle;
    }

    after(action:string, bean:string, handle:Function){
        this.afterCalls[action+'::'+bean] = handle;
    }

    public static getInstance():DocsHandler{
        if(DocsHandler._instance==undefined){
            DocsHandler._instance = new DocsHandler();
        }
        return DocsHandler._instance;
    }

    setupHandlers(){
        
        // https://prushoppe-api.prulifeuk.com.ph/api/docs/policy/eapp/:customerId
        this.before('eapp', 'docs',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, flowback:Function, callback:Function) => {
                conn.search('refdocs', { customerId: id }, (p)=>{
                    if (p.success && p.result.length>0) {
                        callback({
                            contentType: p.result[0].mimeType,
                            contentDisposition: 'attachment; filename="'+p.result[0].customerId+'-export.pdf"',
                            buffer: Buffer.from(p.result[0].base64Content, 'base64')
                        })                     
                    } else {
                        callback(p);
                    }
                })
            }
        );    
        
        // https://prushoppe-api.prulifeuk.com.ph/api/docs/policy/esaf/:customerId
        this.before('esaf', 'docs',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, flowback:Function, callback:Function) => {
                conn.search('refdocs', { customerId: id }, (p)=>{
                    if (p.success && p.result.length>0) {
                        callback({
                            contentType: p.result[0].mimeType,
                            contentDisposition: 'attachment; filename="'+p.result[0].customerId+'-export.pdf"',
                            buffer: Buffer.from(p.result[0].base64Content, 'base64')
                        })                     
                    } else {
                        callback(p);
                    }
                })
            }
        ); 

        // https://prushoppe-api.prulifeuk.com.ph/api/docs/policy/sob/:customerId
        this.before('sob', 'docs',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, flowback:Function, callback:Function) => {
                conn.search('refdocs', { customerId: id }, (p)=>{
                    if (p.success && p.result.length>0) {
                        callback({
                            contentType: p.result[0].mimeType,
                            contentDisposition: 'attachment; filename="'+p.result[0].customerId+'-export.pdf"',
                            buffer: Buffer.from(p.result[0].base64Content, 'base64')
                        })                     
                    } else {
                        callback(p);
                    }
                })
            }
        );   

        // https://prushoppe-api.prulifeuk.com.ph/api/docs/policy/tlic/:customerId
        this.before('tlic', 'docs',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, flowback:Function, callback:Function) => {
                conn.search('refdocs', { customerId: id }, (p)=>{
                    if (p.success && p.result.length>0) {
                        callback({
                            contentType: p.result[0].mimeType,
                            contentDisposition: 'attachment; filename="'+p.result[0].customerId+'-export.pdf"',
                            buffer: Buffer.from(p.result[0].base64Content, 'base64')
                        })                     
                    } else {
                        callback(p);
                    }
                })
            }
        ); 

    }
}