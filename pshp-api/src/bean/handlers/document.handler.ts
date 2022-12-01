
import { DBModels } from "src/persistence/db.models";
import { AppHelper } from "../helpers/app.helper";
import { DocsHelper } from "../helpers/docs.helper";
import { Handler } from "./handler.interface";
export class DocumentHandler implements Handler{
    private static _instance: DocumentHandler;

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

    public static getInstance():DocumentHandler{
        if(DocumentHandler._instance==undefined){
            DocumentHandler._instance = new DocumentHandler();
        }
        return DocumentHandler._instance;
    }

    setupHandlers(){
        // https://prushoppe-api.prulifeuk.com.ph/api/customer/api/docs/policy/sms
        // { doc, customerId }
        this.before('seek', 'document',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, flowback:Function, callback:Function) => {
                if(data){
                    var docType = data.doc;
                    var customerId = data.customerId;

                    conn.search('customers', {customerId: customerId}, (r) => {
                        if(r.success && r.result[0]) {
                            var customer = r.result[0];

                            DocsHelper.smsDoc(customer, docType, (s) => {
                                AppHelper.log("SEEK DOCUMENT RESPONSE", s);
                                callback(s);
                            })
                        }
                        else {
                            AppHelper.log("SEEK DOCUMENT ERROR", r);
                            callback(r);
                        }
                    });

                    //console.log('call SMS API Here', data, files);
                }else{
                    callback({success:false, message:'call.failed'});
                }
            }
        );    
    }
}