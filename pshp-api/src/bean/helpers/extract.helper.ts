
import { writeToBuffer } from '@fast-csv/format';
import * as ExcelJS from 'exceljs';

export class ExtractHelper{

    public static extract(service:any, control:any, user: any, db: any, bean: any, data: any, id: string, files:any, callback: Function){ 
        if(data && data.hasOwnProperty('$csv')){
            delete data['$csv'];
            ExtractHelper.extractCSV(service, control, user, db, bean, data, id, files, callback);
        }else if(data && data.hasOwnProperty('$xlsx')){
            delete data['$xlsx'];
            ExtractHelper.extractCSV(service, control, user, db, bean, data, id, files, callback);
        }else{
            ExtractHelper.extractXLSX(service, control, user, db, bean, data, id, files, callback);
        }
    }

    public static extractXLSX(service:any, control:any, user: any, db: any, bean: any, data: any, id: string, files:any, callback: Function){ 
        if (data) {
            let columns = [];
            let colmap = [];
            if(data.hasOwnProperty('$columns')){
                columns = data['$columns'];
                delete data['$columns'];
            }
            let workbook = new ExcelJS.Workbook();
            let worksheet = workbook.addWorksheet("data");
            service.sanitize(data);
            db.search(bean, data, (p) => {
                if(p.success && p.result.length>=0){
                    let model:any = db.getModel(bean);
                    let rows:any = [];
                    if(columns.length<=0){
                        for(let j in model.schema.properties){
                            colmap.push({ header:j, key:j, width: 15});
                            columns.push(j);
                        }
                    }

                    for(let i=0;i<p.result.length;i++){
                        let row = {};
                        for(let j=0;j<columns.length;j++){
                            let col = columns[j];
                            if(p.result[i].hasOwnProperty(col)){
                                if(typeof(p.result[i][col])=='object' || Array.isArray(p.result[i][col])){
                                    row[col] = JSON.stringify(p.result[i][col]);
                                }else{
                                    row[col] = p.result[i][col];
                                }
                            }else{
                                row[col] = '';
                            }
                        }
                        rows.push(row);
                    }

                    worksheet.columns = colmap; 
                    worksheet.addRows(rows);
                    workbook.xlsx.writeBuffer().then((buffer)=>{
                        callback({
                            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                            contentDisposition: 'attachment; filename="'+bean+'-extract.xlsx"',
                            buffer: buffer
                        })
                    }).catch((err)=>{
                        callback({ success: false, message: 'export.failed' });
                    });                    
                }else{
                    callback(p);
                }
            });
        } else {
            callback({ success: false, message: 'export.failed' });
        }
    }

    public static extractCSV(service:any, control:any, user: any, db: any, bean: any, data: any, id: string, files:any, callback: Function){ 
        if (data) {
            let columns = [];
            if(data.hasOwnProperty('$columns')){
                columns = data['$columns'];
                delete data['$columns'];
            }
            service.sanitize(data);
            db.search(bean, data, (p) => {
                if(p.success && p.result.length>=0){
                    let model:any = db.getModel(bean);
                    let rows:any = [];
                    if(columns.length<=0){
                        for(let j in model.schema.properties){
                            columns.push(j);
                        }
                        rows.push(columns);
                    }
                    for(let i=0;i<p.result.length;i++){
                        let row = [];
                        for(let j=0;j<columns.length;j++){
                            let col = columns[j];
                            if(p.result[i].hasOwnProperty(col)){
                                if(typeof(p.result[i][col])=='object' || Array.isArray(p.result[i][col])){
                                    row.push(JSON.stringify(p.result[i][col]));
                                }else{
                                    row.push(p.result[i][col]);
                                }
                            }else{
                                row.push('');
                            }
                        }
                        rows.push(row);
                    }
                    writeToBuffer(rows).then((buffer) => {
                        callback({
                            contentType: 'text/csv',
                            contentDisposition: 'attachment; filename="'+bean+'-extract.csv"',
                            buffer: buffer
                        })
                    }).catch((err)=>{
                        callback({ success: false, message: 'extract.failed' });
                    });
                }else{
                    callback(p);
                }
            });
        } else {
            callback({ success: false, message: 'extract.failed' });
        }
    }
}