
import { Handler } from './handler.interface';
import { AppHelper } from '../helpers/app.helper';
import * as fs from 'fs-extra';
import * as HummusRecipe from 'hummus-recipe';
import { v4 as uuidv4 } from 'uuid';
import { NotificationsHelper } from './utils/notifications.helper';

export class RefDocsHandler implements Handler{
    private static _instance: RefDocsHandler;

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

    public static getInstance():RefDocsHandler{
        if(RefDocsHandler._instance==undefined){
            RefDocsHandler._instance = new RefDocsHandler();
        }
        return RefDocsHandler._instance;
    }

    setupHandlers(){

        // https://prushoppe-api.prulifeuk.com.ph/api/customer/id-upload
        this.before('create', 'refdocs',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, flowback:Function, callback:Function) => {
                if(data){

                    let activity = {
                        controller: "customerController",
                        method: "idUpload",
                        requestParams: data,
                        files: files,
                        response: {}
                    };

                    for(let f=0;f<files.length;f++){
                        data[files[f].fieldname] = files[f];
                    }
            
                    user.activity = activity;

                    if(data.hasOwnProperty('customerId') && data.hasOwnProperty('idfile') ) {
			
                        let fileId = uuidv4();
                        let uploadDir = '/usr/src/app/_tmp';
                        let uploadedFile = uploadDir+'/'+data.customerId+'-'+fileId;
                        let pdfFile = uploadDir+'/'+data.customerId+'.pdf';
            
                        let buffer = data.idfile.buffer;

                        user.pdfFile = pdfFile;
            
                        fs.writeFile(uploadedFile, buffer, (err) => {
                            if(err) {
                                console.log(err);
                                activity.response = { isSuccess: false, success: false, message: 'status.failed', result: "file creation failed", customerId: data.customerId };
                                AppHelper.log('ID UPLOAD', activity);
                                callback(activity.response);
                            }else {
                                let pdfDoc = new HummusRecipe('new', pdfFile,{
                                    version: 1.6,
                                    author: 'PRUShoppe',
                                    title: 'Supporting Document ['+data.customerId+']',
                                    subject: 'Supporting Document ['+data.customerId+']'
                                });
                                
                                pdfDoc
                                    .createPage('letter-size')
                                    .image(uploadedFile, 20, 100, {width: 400, keepAspectRatio: true})
                                    .endPage()
                                    .endPDF();
                    
                                fs.remove(uploadedFile);
    
                                let base64Content = fs.readFileSync(pdfFile).toString('base64');
                            
                                let refdoc =  { 
                                    customerId: data.customerId,
                                    base64Content: base64Content,
                                    mimeType: "application/pdf"
                                };

                                for(let i in data){
                                    delete data[i];
                                }
                                for(let i in refdoc){
                                    data[i] = refdoc[i];
                                }

                                conn.search('refdocs', {customerId: data.customerId}, (rp)=>{
                                    if(rp.success && rp.result.length>0){
                                        data.id = rp.result[0].id;
                                        let body = {};
                                        for(let f=0;f<files.length;f++){
                                            body[files[f].fieldname] = files[f];
                                        }
                                        control.execute(control, user, conn, 'update', bean, data, id, body, false, callback);
                                    }else{
                                        flowback();  
                                    }
                                });
                            }
                        });
                    } else {
                        activity.response = { isSuccess: false, success: false, message: 'status.failed', result: "incomplete parameters", customerId: data.customerId };
                        AppHelper.log('ID UPLOAD', activity);
                        callback(activity.response);
                    }
                }else{
                    callback({success:false, message:'call.failed'});
                }
            }
        );       

        this.after('create', 'refdocs',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, p:any, callback:Function) => {
                let activity = user.activity;
                fs.remove(user.pdfFile);
                if (p.success) {
                    activity.response = { isSuccess: true, success: true, message: 'status.success', result: "file uploaded", customerId: data.customerId };
                    callback(activity.response);
                } else {
                    activity.response = { isSuccess: false, success: false, message: 'status.failed', result: "failed to save file in storage.", customerId: data.customerId };
                    callback(activity.response);
                }
            }
        );

        this.after('update', 'refdocs',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, p:any, callback:Function) => {
                let activity = user.activity;
                fs.remove(user.pdfFile);
                if (p.success) {
                    activity.response = { isSuccess: true, success: true, message: 'status.success', result: "file uploaded", customerId: data.customerId };
                    callback(activity.response);
                } else {
                    activity.response = { isSuccess: false, success: false, message: 'status.failed', result: "failed to save file in storage.", customerId: data.customerId };
                    callback(activity.response);
                }
            }
        );        
        
        // https://prushoppe-api.prulifeuk.com.ph/api/customer/id-upload/sms
        // { customerId }        
        this.before('seek', 'refdocs',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, flowback:Function, callback:Function) => {
                conn.search('customers', { customerId: data.customerId }, (p)=>{
                    if (p.success && p.result.length>0) {
                       
                        var customer = p.result[0];
                        var formLink = process.env.BASE_WEB_URL + '/upload.html#' + customer.customerId;
                        var smsMessage = "Hi " + customer.firstname + ",\n\nPlease click the link below to upload required ID for your PRULife Your Term application.\n\n" + formLink;
                        
                        NotificationsHelper.sendSMS(customer.customerId, customer.mobileno, smsMessage, (r) =>{
                            for(let i in data) { delete data[i];}
                            for(let i in p) { delete p[i];}

                            let message = (r.isSuccess) ? "upload form sent via sms" : "sms failed. please try agaun.";

                            p = {
                                customerId: data.customerId,
                                isSuccess: r.isSuccess,
                                success: r.isSuccess,
                                message: message
                            }

                            callback(p);                              
                        });
                        
                                      
                    } else {
                        callback(p);
                    }
                })
            }
        );

        // https://prushoppe-api.prulifeuk.com.ph/api/customer/id-upload/status
        // { customerID }      
        this.before('search', 'refdocs',
            (control:any, user:any, conn:any, bean:string, data:any, id:string, files:any, flowback:Function, callback:Function) => {
                conn.search('refdocs', { customerId: data.customerId }, (p)=>{
                    if (p.success && p.result.length>0) {
                        AppHelper.log('SEARCH REFDOCS: ', [data, files]);
                        p['isSuccess'] = true;
                        p.result[0].base64Content;
                        p.message = "ID File was uploaded.";
                        flowback();                 
                    } else {
                        p['isSuccess'] = false;
                        AppHelper.log('SEARCH REFDOCS: ', p);
                        callback({isSuccess: false, status: "status.failed", message: "id not yet uploaded"});
                    }
                })
            }
        );        
    }
}