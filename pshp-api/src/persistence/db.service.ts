import { v4 as uuidv4 } from 'uuid';

import { DBModels } from './db.models';
import * as dfns from 'date-fns';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as couchbase from 'couchbase';

export class DBService {

    static ENCRYPTION_KEY: string;
    static ENCRYPTION_ALGORITHM: string;
    static ENCRYPTION_IV_LENGTH: number;
    static DB_SCHEMA: string;
    static DB_HOSTNAME: string;
    static DB_USERNAME: string;
    static DB_PASSWORD: string;

    static Validator: any;

    static DB_FILTER: RegExp;

    cluster: any;
    bucket: any;

    collections: Object = {};

    storedModels: Object = {};
    storedModelFields: Object = {};
    storedQueries: Object = {};
    storedQueryFields: Object = {};
    actualModels: Object = {};
    storedTables: Object = {};

    tmpQuery: string = '_q';
    tmpCount: string = '_c';

    excludeModels: Object = {};

    constructor() {

        if (this.envProp('DB_FILTER')) {
            try{
                DBService.DB_FILTER = new RegExp(this.envProp('DB_FILTER').trim());
            }catch(e){
                DBService.DB_FILTER = new RegExp('(.*)');
            }
        } else {
            DBService.DB_FILTER = new RegExp('(.*)');
        }

        if (!DBService.DB_HOSTNAME) {

            DBService.ENCRYPTION_KEY = this.getSetting('ENCRYPTION_KEY_FILE', 'ENCRYPTION_KEY');
            DBService.ENCRYPTION_ALGORITHM = this.getSetting('ENCRYPTION_ALGORITHM_FILE', 'ENCRYPTION_ALGORITHM');
            DBService.ENCRYPTION_IV_LENGTH = Number.parseInt(this.getSetting('ENCRYPTION_IV_LENGTH_FILE', 'ENCRYPTION_IV_LENGTH'));
            DBService.DB_USERNAME = this.getSetting('DB_USERNAME_FILE', 'DB_USERNAME');
            DBService.DB_PASSWORD = this.getSetting('DB_PASSWORD_FILE', 'DB_PASSWORD');
            DBService.DB_SCHEMA = (this.envProp('DB_SCHEMA')+'').trim();
            DBService.DB_HOSTNAME = (this.envProp('DB_HOSTNAME')+'').trim();

        }
    }

    getSetting(file:string, alt:string):string{
       
        console.log("getSettings params: ", file, alt);

        if (this.envProp(file)) {
            var mFile = this.envProp(file);
            return (fs['rea'+'dF'+'ileS'+'ync'](mFile, 'ut'+'f8')+'').trim();
        } else {
            return (this.envProp(alt+'')+'').trim(); 
        }
    }

    public static setValidator(validator: any):void{
        DBService.Validator = validator;
    }    

    public static hasLog(type: string):boolean{
        return DBService.DB_FILTER.test(type);
    }

    public static connect(cb: Function) {

        let scope = new DBService();
        let retry = 100;
        let fn = () => {
            try {

                let cluster = new couchbase.Cluster(DBService.DB_HOSTNAME);
                cluster.authenticate(DBService.DB_USERNAME, DBService.DB_PASSWORD);
                scope.cluster = cluster;
                scope.bucket = cluster.openBucket(DBService.DB_SCHEMA);

                new DBModels(scope);
                scope.query('has-connection',{},(pam)=>{
                    if(pam.success){
                        cb({
                            success: true,
                            result: scope
                        });
                    }else{
                        if (retry > 0) {
                            retry--;
                            console.log(pam);
                            setTimeout(fn, 5000);
                        } else {
                            cb({
                                success: false,
                                message: 'connection.failed'
                            });
                        }
                    }
                });
            } catch (e) {
                console.log('connecting error', e);
                if (retry > 0) {
                    retry--;
                    setTimeout(fn, 5000);
                } else {
                    cb({
                        success: false,
                        message: 'connection.failed'
                    });
                }
            }
        }
        fn();
    }

    envProp(targetProperty: string): string {
        if(process.env.hasOwnProperty(targetProperty)){
            return (process.env[targetProperty]+'').trim();
        }else{
            return undefined;
        }
    }

    getValidator() {
        return new DBService.Validator();
    }

    setExcludedModels(models: Object) {
        this.excludeModels = models
    }

    storeModel(name: string, schema: Function) {
        let namedFields = {};
        let scheme = schema();
        let fields = scheme.properties;
        let mapping = [];

        for (let i in fields) {
            namedFields[i] = i;
            mapping.push({
                id: i,
                name: fields[i].description,
                type: fields[i].type,
                lookup: fields[i]['$lookup'],
                entry: fields[i].entry
            });
        }

        this.storedModelFields[name] = {
            name: (scheme.id.indexOf('/')==0) ? scheme.id.substring(1, scheme.id.length) : scheme.id,
            props: mapping
        };
        this.storedModels[name] = {
            fields: namedFields,
            schema: schema(),
            schemaFn: schema
        };
    }

    storeQuery(name: string, sql: string, schema: Function, filterable: boolean) {
        let namedFields = {};
        let scheme = schema();
        let fields = scheme.properties;
        let mapping = [];

        for (let i in fields) {
            namedFields[i] = i;
            mapping.push({
                id: i,
                name: fields[i].description,
                lookup: fields[i]['$lookup']
            });
        }

        this.storedQueryFields[name] = {
            name: (scheme.id.indexOf('/')==0) ? scheme.id.substring(1, scheme.id.length) : scheme.id,
            props: mapping
        };
        this.storedQueries[name] = {
            sql: sql,
            filterable: filterable,
            fields: namedFields,
            schema: schema(),
            schemaFn: schema
        };
    }

    generateKey(): string {
        return dfns.format(new Date(), 'yyyyww') + (uuidv4().split('-').join(''));
    }

    encryptPath(obj: any, path: string) {
        try {
            const params: string[] = path
            .split(/[.\[\]]+/g)
            .filter(Boolean)
            .map((i: string) => i.replace(/^["'](.*)["']$/g, "$1"));            
            let i = 0
            for (; i < params.length - 1; i++) {
                obj = obj[params[i]];
            }
            if (obj[params[i]]) {
                obj[params[i]] = this.encrypt(obj[params[i]]);                
            }
        } catch (e) { 
            console.log(path, e);
        }
        return obj;
    }

    decryptPath(obj: any, path: string) {
        try {
            const params: string[] = path
            .split(/[.\[\]]+/g)
            .filter(Boolean)
            .map((i: string) => i.replace(/^["'](.*)["']$/g, "$1"));            
            let i = 0;
            let parent = undefined;
            for (; i < params.length - 1; i++) {
                parent = obj;                
                obj = obj[params[i]];
            }

            obj[params[i]] = this.decrypt(obj[params[i]]);

            if(this.isNumeric(params[i]) && i>0){
                if(parent.hasOwnProperty(params[i-1]+'_filter')){
                    delete parent[params[i-1]+'_filter'];
                }
            }else{
                if(obj.hasOwnProperty(params[i]+'_filter')){
                    delete obj[params[i]+'_filter'];
                }            
            }
        } catch (e) { 
            console.log(path, e);
        }
        return obj;
    }

    hashPath(obj: any, path: string) {
        try {
            const params: string[] = path
            .split(/[.\[\]]+/g)
            .filter(Boolean)
            .map((i: string) => i.replace(/^["'](.*)["']$/g, "$1"));            
            let i = 0;
            let parent = undefined;
            for (; i < params.length - 1; i++) {
                parent = obj;
                obj = obj[params[i]];
            }
            if (obj[params[i]]) {
                if(this.isNumeric(params[i]) && i>0){
                    if(parent.hasOwnProperty(params[i-1]+'_filter')==false){
                        parent[params[i-1]+'_filter'] = [];
                    }
                    parent[params[i-1]+'_filter'][params[i]] = this.hash(obj[params[i]]);
                }else{
                    obj[params[i]+'_filter'] = this.hash(obj[params[i]]);
                }
            }
        } catch (e) { 
            console.log('hash', path, e);
        }
    }


    hashPathAndEncrypt(obj: any, path: string) {
        try {
            const params: string[] = path
            .split(/[.\[\]]+/g)
            .filter(Boolean)
            .map((i: string) => i.replace(/^["'](.*)["']$/g, "$1"));            
            let i = 0;
            let parent = undefined;
            for (; i < params.length - 1; i++) {
                parent = obj;
                obj = obj[params[i]];
            }
            if (obj[params[i]]) {
                if(this.isNumeric(params[i]) && i>0){
                    if(parent.hasOwnProperty(params[i-1]+'_filter')==false){
                        parent[params[i-1]+'_filter'] = [];
                    }
                    parent[params[i-1]+'_filter'][params[i]] = this.hash(obj[params[i]]);
                }else{
                    obj[params[i]+'_filter'] = this.hash(obj[params[i]]);
                }
                obj[params[i]] = this.encrypt(obj[params[i]]); 
            }
        } catch (e) { 
            console.log('hash', path, e);
        }
    }    

    hashPathAndRemove(obj: any, path: string) {
        try {
            let oobj = obj;
            const params: string[] = path
            .split(/[.\[\]]+/g)
            .filter(Boolean)
            .map((i: string) => i.replace(/^["'](.*)["']$/g, "$1"));            
            let i = 0
            let parent = undefined;
            for (; i < params.length - 1; i++) {
                parent = obj;
                obj = obj[params[i]];
            }
            if (obj[params[i]]) {
                if(this.isNumeric(params[i]) && i>0){
                    if(parent.hasOwnProperty(params[i-1]+'_filter')==false){
                        parent[params[i-1]+'_filter'] = [];
                    }
                    parent[params[i-1]+'_filter'][params[i]] = this.hash(obj[params[i]]);
                    if((parseInt(params[i]))>=parent[params[i-1]].length-1){
                        delete parent[params[i-1]];
                    }
                }else{
                    obj[params[i]+'_filter'] = this.hash(obj[params[i]]);
                    delete obj[params[i]];
                }
            }
        } catch (e) { 
            console.log('hash', path, e);
        }
    }

    hashPaths(obj: any, paths: Array<string>, done:Function) {
        for (let i = 0; i < paths.length; i++) {
            this.hashPath(obj, paths[i]);
        }
    }

    hashPathsAndRemove(obj: any, paths: Array<string>) {
        for (let i = 0; i < paths.length; i++) {
            this.hashPathAndRemove(obj, paths[i]);
        }         
    }  

    hashPathsAndEncrypt(obj: any, paths: Array<string>) {
        for (let i = 0; i < paths.length; i++) {
            this.hashPathAndEncrypt(obj, paths[i]);
        }        
    }       

    encryptPaths(obj: any, paths: Array<string>) {
        for (let i = 0; i < paths.length; i++) {
            this.encryptPath(obj, paths[i]);
        }
    }

    decryptPaths(obj: any, paths: Array<string>) {
        for (let i = 0; i < paths.length; i++) {
            this.decryptPath(obj, paths[i]);
        }
    }

    validateModel(name: string, data: Object): Array<string> {
        let model = this.storedModels[name];
        if (!model.hasOwnProperty('validator')) {
            let validator: any = new DBService.Validator();
            validator.attributes.encrypted = (instance: any, schema: any, options: any, ctx: any) => {
                let prefix = 'instance.';
                let path = ctx.propertyPath.substring(ctx.propertyPath.indexOf(prefix) + prefix.length, ctx.propertyPath.length);
                if (options && options.hasOwnProperty('forEncryption') == false) {
                    options['forEncryption'] = [];
                }
                options['forEncryption'].push(path);
                return true;
            }
            for (let i in this.storedModels) {
                if (i != name) {
                    let ref = this.storedModels[i];
                    validator.addSchema(ref.schema, ref.schema.id);
                }
            }
            model.validator = validator;
        }
        let result = model.validator.validate(data, model.schema, { nestedErrors: true });
        return result;
    }


    validateQuery(name: string, data: Object): Array<string> {
        let query = this.storedQueries[name];
        if (!query.hasOwnProperty('validator')) {
            let validator: any = new DBService.Validator();
            validator.attributes.encrypted = (instance: any, schema: any, options: any, ctx: any) => {
                let prefix = 'instance.';
                let path = ctx.propertyPath.substring(ctx.propertyPath.indexOf(prefix) + prefix.length, ctx.propertyPath.length);
                if (options && options.hasOwnProperty('forEncryption') == false) {
                    options['forEncryption'] = [];
                }
                options['forEncryption'].push(path);
                return true;
            }
            query.validator = validator;
        }
        let result = query.validator.validate(data, query.schema, { nestedErrors: true });
        return result;
    }

    status(flag: boolean, message: string, result: any): Object {
        return {
            success: flag,
            message: message,
            result: result
        };
    }

    isNumeric(value) {
        return /^\d+$/.test(value);
    }

    hash(phrase:string) {
        return crypto.createHash("sha256").update(phrase+DBService.ENCRYPTION_KEY).digest("hex");
    }

    encrypt(phrase:string) {
        if(!phrase){
            phrase = '';
        }
        let key = Buffer.from(DBService.ENCRYPTION_KEY, 'base64');
        let algorithm = DBService.ENCRYPTION_ALGORITHM;
        let iv_length = DBService.ENCRYPTION_IV_LENGTH;
        let iv = crypto.randomBytes(iv_length);
        let cipher = crypto.createCipheriv(algorithm, key, iv);
        let message = Buffer.from(phrase);
        let encrypted = cipher.update(message.toString('binary'), 'binary', 'binary');
        encrypted += cipher.final('binary');
        let combined = Buffer.concat([iv, Buffer.from(encrypted, 'binary')]);
        return combined.toString('base64');
    }

    decrypt(secret:string) {
        try{
            if(secret){
                let chunk = Buffer.from(secret, 'base64');
                let key = Buffer.from(DBService.ENCRYPTION_KEY, 'base64');
                let algorithm = DBService.ENCRYPTION_ALGORITHM;
                let iv_length = DBService.ENCRYPTION_IV_LENGTH;
        
                let iv = chunk.slice(0, iv_length);    
                let decoded = chunk.slice(iv_length, chunk.length);
        
                let decipher = crypto.createDecipheriv(algorithm, key, iv);
                let decrypted = decipher.update(decoded.toString('binary'), 'binary', 'binary');
                decrypted += decipher.final();
            
                return decrypted.toString();
            }else{
                return secret;
            }
        }catch(e){
            console.log('decrypting', secret, e);
            return secret;
        }
    }

    close() {
        try {
            if (this.bucket) {
                this.bucket.disconnect();
            }
        } catch (e) { }
    }

    remove(type: string, id: string, cb: Function) {
        let scope = this;
        type = this.envProp('DB_NAMESPACE') + ':' + type;
        let props = this.storedModels[type].schema.properties;
        if (props && props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry && id && id.indexOf(this.envProp('DB_NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':')==-1) {
            id = (this.envProp('DB_NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':') + id;
        }

        scope.get(type, id, function (p) {
            if (p.success) {
                try{
                    scope.bucket.remove(id, function (error, result) {
                        if (error) {
                            cb(scope.status(false, 'remove.failed', error));
                        } else {
                            cb(scope.status(true, 'remove.success', error));
                        }
                    });    
                }catch(e){
                    console.log('DB ERROR:remove', type, e);
                    cb(scope.status(false, 'remove.failed', p.result));
                }
            } else {
                cb(scope.status(false, 'remove.failed', p.result));
            }
        });
    }

    removeAll(type: string, data: any, cb: Function) {
        let otype = type;
        let scope = this;
        let fields = scope.storedModels[otype].fields;
        type = this.envProp('DB_NAMESPACE') + ':' + type;
        data._type = type;

        let props = this.storedModels[otype].schema.properties;
        if (props && props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry && data.hasOwnProperty('id') && data.id.indexOf(this.envProp('DB_NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':')==-1) {
            data.id = (this.envProp('DB_NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':') + data.id;
        }

        if (otype.indexOf('system:')==0 && props.hasOwnProperty('service')) {
            data.service = scope.envProp('SERVICE_NAMESPACE');
        }        

        let sql = 'DELETE FROM `'+DBService.DB_SCHEMA+'` WHERE _type = $_type ';
        for (let i in data) {
            if (fields[i] != undefined) {
                sql += ' AND `' + fields[i] + '` = $' + fields[i] + '';
            }
        }        
        if(DBService.hasLog(otype)) console.log('Deleting many', type, data, sql);
        scope.exec(sql, data, (p)=>{
            cb(p);
        });
    }

    find(type: string, id: string, cb: Function) {
        let otype = type;
        let scope = this;
        type = this.envProp('DB_NAMESPACE') + ':' + type;
        let filter = { _type: type };
        if (id && id.trim() != '%' && id.trim() != '') {
            filter['id'] = id;
        }else{
            id = '%';
        }

        let props = this.storedModels[otype].schema.properties;
        if (props && props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry && id && id.indexOf(this.envProp('DB_NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':')==-1) {
            id = (this.envProp('DB_NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':') + id;
        }

        let sql = 'SELECT * FROM `' + DBService.DB_SCHEMA + '` WHERE _type=$_type AND id LIKE $id';
        let data:any = { _type: type, id: id };

        if (otype.indexOf('system:')==0 && props.hasOwnProperty('service')) {
            data.service = scope.envProp('SERVICE_NAMESPACE');
            sql += ' AND `service`=$service';
        }

        let q = couchbase.N1qlQuery.fromString(sql);

        if(DBService.hasLog(otype)) console.log('    find sql:', sql, data);

        let retry = 0;
        let queryFn = function () {
            try{
                scope.bucket.query(q, data, (error, rows) => {
                    if (error) {
                        if(error.code == 5000){
                            retry++;
                            queryFn();
                        }else{
                            cb(scope.status(false, 'find.failed', error));
                        }                    
                    } else {
                        let records = [];
                        for (let i = 0; i < rows.length; i++) {
                            let row = rows[i];
                            if(row && row.hasOwnProperty(DBService.DB_SCHEMA)){
                                row = rows[i][DBService.DB_SCHEMA];
                            }
                            let validation: any = scope.validateModel(otype, row);
                            if (validation && validation.hasOwnProperty('options') && validation.options.hasOwnProperty('forEncryption')) {
                                scope.decryptPaths(row, validation.options.forEncryption);
                            }
                            let props = scope.storedModels[otype].schema.properties;
                            if (props && props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry && row.hasOwnProperty('id')) {
                                row.id = row.id.substring((scope.envProp('DB_NAMESPACE') + ':' + scope.envProp('SERVICE_NAMESPACE') + ':').length, row.id.length);
                            }                  
                            records.push(row);
                        }
                        cb(scope.status(true, 'find.success', records));
                    }
                });
            }catch(e){
                console.log('DB ERROR:find', otype, e);
                cb(scope.status(false, 'find.failed', []));
            }
            
        }
        queryFn();
    }

    exec(sql:string, data:any, cb:Function) {
        let scope = this;
        let q = couchbase.N1qlQuery.fromString(sql);
        // console.log('  exec:', sql, data);

        try{
            scope.bucket.query(q, data, (error, rows) => {
                if (error) {
                    console.log('exec error', q, data, error);
                    cb(scope.status(false, 'exec.failed', error));
                } else {
                    var records = [];
                    for (var i = 0; i < rows.length; i++) {
                        if (rows[i][DBService.DB_SCHEMA]) {
                            records.push(rows[i][DBService.DB_SCHEMA]);
                        } else {
                            records.push(rows[i]);
                        }
                    }          
                    cb(scope.status(true, 'exec.success', records));
                }
            });
        }catch(e){
            console.log('DB ERROR:exec', sql, e);
            cb(scope.status(false, 'exec.failed', []));
        }
    }

    search(type: string, data: any, cb: Function) {
        data = {...data};
        let otype = type;
        let props = this.storedModels[otype].schema.properties;
        if (props && props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry && data.hasOwnProperty('id') && data.id.indexOf(this.envProp('DB_NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':')==-1) {
            data.id = (this.envProp('DB_NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':') + data.id;
        }

        let validation: any = this.validateModel(type, data);
        if (validation && validation.hasOwnProperty('options') && validation.options.hasOwnProperty('forEncryption')) {
            this.hashPathsAndRemove(data, validation.options.forEncryption);
        }

        type = this.envProp('DB_NAMESPACE') + ':' + type;
        let scope = this;
        data._type = type;

        if (otype.indexOf('system:')==0 && props.hasOwnProperty('service')) {
            data.service = scope.envProp('SERVICE_NAMESPACE');
        }        

        let sql = ' FROM `' + DBService.DB_SCHEMA + '` WHERE _type=$_type';
        let fields = scope.storedModels[otype].fields;
        let schema = scope.storedModels[otype].schema;

        if (fields) {
            if (data.hasOwnProperty('$q')) {
                sql += ' AND (';
                let pass = false;
                for (let i in fields) {
                    if (pass) sql += ' OR';
                    pass = true;
                    sql += ' LOWER(`' + fields[i] + '`) LIKE LOWER($' + fields[i] + ')';
                    if (data.hasOwnProperty('$exact') && data['$exact'] == true) {
                        data[i] = data['$q'];
                    } else {
                        data[i] = '%' + data['$q'] + '%';
                    }
                }
                sql += ')';
            } else {
                for (let i in data) {
                    
                    let k = undefined;

                    if(i.indexOf('_filter')!=-1){
                        k = i.substring(0,i.lastIndexOf('_filter'));
                    }

                    if ((fields[i] != undefined)  || (fields[k] != undefined)) {
                       
                        if(k && schema.properties.hasOwnProperty(k) && schema.properties[k].encrypted){
                            sql += ' AND `' + fields[k] + '_filter` = $' + fields[k] + '_filter';
                        }else{
                            sql += ' AND LOWER(`' + fields[i] + '`) LIKE LOWER($' + fields[i] + ')';
                        }
                    }
                }
            }
        }

        let cnt = 'SELECT count(1) as total ' + sql;
        sql = 'SELECT * ' + sql;
        let n = couchbase.N1qlQuery.fromString(cnt);
        let pg = data['$paging'];
        if (pg != undefined && pg['sort'] != undefined && pg['dir'] != undefined) {
            sql +=
                ' ORDER BY `' +
                fields[pg['sort']] +
                '` ' +
                (pg['dir'] == 'ASC' ? 'ASC' : 'DESC');
        }
        let sg = data['$sorting'];
        if (sg != undefined && sg['sort'] != undefined && sg['dir'] != undefined) {
            sql +=
                ' ORDER BY `' +
                fields[sg['sort']] +
                '` ' +
                (sg['dir'] == 'ASC' ? 'ASC' : 'DESC');
        }
        if (
            pg != undefined &&
            pg['start'] != undefined &&
            pg['limit'] != undefined
        ) {
            sql += ' OFFSET $_offset LIMIT $_limit';
            data['_offset'] = pg['start'];
            data['_limit'] = pg['limit'];
        }

        let q = couchbase.N1qlQuery.fromString(sql);

        data._type = type;

        if(DBService.hasLog(otype)) console.log('search:', sql, data);

        let retry = 0;
        let queryFn = function () {
            if (pg == undefined) {
                try{
                    scope.bucket.query(q, data, (error, rows) => {
                        if (error) {
                            if(error.code == 5000){
                                retry++;
                                queryFn();
                            }else{
                                cb(scope.status(false, 'search.failed', error));
                            }
                        } else {
                            var records = [];
                            for (var i = 0; i < rows.length; i++) {
                                let row = rows[i];
                                if(row && row.hasOwnProperty(DBService.DB_SCHEMA)){
                                    row = rows[i][DBService.DB_SCHEMA];
                                }
                                let validation: any = scope.validateModel(otype, row);
                                if (validation && validation.hasOwnProperty('options') && validation.options.hasOwnProperty('forEncryption')) {
                                    scope.decryptPaths(row, validation.options.forEncryption);
                                }
                                let props = scope.storedModels[otype].schema.properties;
                                if (props && props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry && row.hasOwnProperty('id')) {
                                    row.id = row.id.substring((scope.envProp('DB_NAMESPACE') + ':' + scope.envProp('SERVICE_NAMESPACE') + ':').length, row.id.length);
                                }                            
                                records.push(row);
                            }
                            cb(scope.status(true, 'search.success', records));
                        }
                    });
                }catch(e){
                    console.log('DB ERROR:search', otype, e);
                    cb(scope.status(false, 'search.failed', []));
                }
                
                return;
            }
            let pagedResult:any = {};
            try{
                scope.bucket.query(n, data, (nerror, nrows) => {
                    if (nerror) {
                        if(nerror.code == 5000){
                            retry++;
                            queryFn();
                        }else{
                            cb(scope.status(false, 'search.failed', nerror));
                        }                    
                    } else {
                        pagedResult.total = nrows[0]['total'];
                        scope.bucket.query(q, data, (error, rows) => {
                            if (error) {
                                if(error.code == 5000){
                                    retry++;
                                    queryFn();
                                }else{
                                    cb(scope.status(false, 'search.failed', error));
                                }
                            } else {
                                var records = [];
                                for (var i = 0; i < rows.length; i++) {
                                    let row = rows[i];
                                    if(row && row.hasOwnProperty(DBService.DB_SCHEMA)){
                                        row = rows[i][DBService.DB_SCHEMA];
                                    }
                                    let validation: any = scope.validateModel(otype, row);
                                    if (validation && validation.hasOwnProperty('options') && validation.options.hasOwnProperty('forEncryption')) {
                                        scope.decryptPaths(row, validation.options.forEncryption);
                                    }
                                    let props = scope.storedModels[otype].schema.properties;
                                    if (props && props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry && row.hasOwnProperty('id')) {
                                        row.id = row.id.substring((scope.envProp('DB_NAMESPACE') + ':' + scope.envProp('SERVICE_NAMESPACE') + ':').length, row.id.length);
                                    }
                                    records.push(row);
                                }
                                pagedResult.records = records;
                                cb(scope.status(true, 'search.success', pagedResult));
                            }
                        });
                    }
                });
            }catch(e){
                console.log('DB ERROR:search', otype, e);
                cb(scope.status(false, 'search.failed', []));
            }
            
        }
        queryFn();
    }

    query(type: string, data: any, cb: Function) {
        let otype = type;
        let props = this.storedQueries[otype].schema.properties;
        if (props && props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry && data.hasOwnProperty('id') && data.id.indexOf(this.envProp('DB_NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':')==-1) {
            data.id = (this.envProp('DB_NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':') + data.id;
        }
        let validation: any = this.validateQuery(type, data);
        if (validation && validation.hasOwnProperty('options') && validation.options.hasOwnProperty('forEncryption')) {
            this.hashPathsAndRemove(data, validation.options.forEncryption);
        }

        type = this.envProp('DB_NAMESPACE') + ':' + type;
        let scope = this;
        data._type = type;

        if (otype.indexOf('system:')==0 && props.hasOwnProperty('service')) {
            data.service = scope.envProp('SERVICE_NAMESPACE');
        }

        let oSql = this.storedQueries[otype].sql;
        let sql = oSql;
        let fields = scope.storedQueries[otype].fields;
        let schema = scope.storedQueries[otype].schema;

        if(scope.storedQueries[otype].filterable){
            sql = 'SELECT * FROM (' + oSql + ') as '+this.tmpQuery+' WHERE 1=1';
            if (otype.indexOf('system:')==0 && props.hasOwnProperty('service')) {
                sql += ' AND `service`=$service';
            }
            if (fields) {
                if (data.hasOwnProperty('$q')) {
                    sql += ' AND (';
                    let pass = false;
                    for (let i in fields) {
                        if (pass) sql += ' OR';
                        pass = true;
                        sql += ' LOWER(`' + fields[i] + '`) LIKE LOWER($' + fields[i] + ')';
                        if (data.hasOwnProperty('$exact') && data['$exact'] == true) {
                            data[i] = data['$q'];
                        } else {
                            data[i] = '%' + data['$q'] + '%';
                        }
                    }
                    sql += ')';
                } else {
                    for (let i in data) {
                    
                        let k = undefined;
    
                        if(i.indexOf('_filter')!=-1){
                            k = i.substring(0,i.lastIndexOf('_filter'));
                        }
    
                        if ((fields[i] != undefined)  || (fields[k] != undefined)) {
                           
                            if(k && schema.properties.hasOwnProperty(k) && schema.properties[k].encrypted){
                                sql += ' AND `' + fields[k] + '_filter` = $' + fields[k] + '_filter';
                            }else{
                                sql += ' AND LOWER(`' + fields[i] + '`) LIKE LOWER($' + fields[i] + ')';
                            }
                        }
                    }
                }
            }
        }

        let cnt = 'SELECT count(1) as total FROM (' + sql + ') as '+this.tmpCount;

        let n = couchbase.N1qlQuery.fromString(cnt);
        let pg = data['$paging'];
        if (pg != undefined && pg['sort'] != undefined && pg['dir'] != undefined) {
            sql +=
                ' ORDER BY `' +
                fields[pg['sort']] +
                '` ' +
                (pg['dir'] == 'ASC' ? 'ASC' : 'DESC');
        }
        let sg = data['$sorting'];
        if (sg != undefined && sg['sort'] != undefined && sg['dir'] != undefined) {
            sql +=
                ' ORDER BY `' +
                fields[sg['sort']] +
                '` ' +
                (sg['dir'] == 'ASC' ? 'ASC' : 'DESC');
        }
        if (
            pg != undefined &&
            pg['start'] != undefined &&
            pg['limit'] != undefined
        ) {
            sql += ' OFFSET $_offset LIMIT $_limit';
            data['_offset'] = pg['start'];
            data['_limit'] = pg['limit'];
        }

        let q = couchbase.N1qlQuery.fromString(sql);
        data._type = type;
        
        if(DBService.hasLog(otype)) console.log('query:', sql, data);

        let retry = 0;
        let queryFn = function () {
            if (pg == undefined) {
                try{
                    scope.bucket.query(q, data, (error, rows) => {
                        if (error) {
                            if(error.code == 5000){
                                retry++;
                                queryFn();
                            }else{
                                cb(scope.status(false, 'query.failed', error));
                            }
                        } else {
                            var records = [];
                            for (var i = 0; i < rows.length; i++) {
                                let row = rows[i];
                                if(row && row.hasOwnProperty(DBService.DB_SCHEMA)){
                                    row = rows[i][DBService.DB_SCHEMA];
                                }
                                let validation: any = scope.validateQuery(otype, row);
                                if (validation && validation.hasOwnProperty('options') && validation.options.hasOwnProperty('forEncryption')) {
                                    scope.decryptPaths(row, validation.options.forEncryption);
                                }
                                let props = scope.storedQueries[otype].schema.properties;
                                if (props && props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry && row.hasOwnProperty('id')) {
                                    row.id = row.id.substring((scope.envProp('DB_NAMESPACE') + ':' + scope.envProp('SERVICE_NAMESPACE') + ':').length, row.id.length);
                                } 
                                records.push(row);
                            }
                            cb(scope.status(true, 'query.success', records));
                        }
                    });
                }catch(e){
                    console.log('DB ERROR:query', otype, e);
                    cb(scope.status(false, 'query.failed', []));
                }
                
                return;
            }
            let pagedResult:any = {};
            scope.bucket.query(n, data, (nerror, nrows) => {
                data = {...data};
                if (nerror) {
                    cb(scope.status(false, 'query.failed', nerror));
                } else {
                    pagedResult.total = nrows[0]['total'];
                    try{
                        scope.bucket.query(q, data, (error, rows) => {
                            if (error) {
                                if(error.code == 5000){
                                    retry++;
                                    queryFn();
                                }else{
                                    cb(scope.status(false, 'query.failed', error));
                                }
                            } else {
                                var records = [];
                                for (var i = 0; i < rows.length; i++) {
                                    let row = rows[i];
                                    if(row && row.hasOwnProperty(DBService.DB_SCHEMA)){
                                        row = rows[i][DBService.DB_SCHEMA];
                                    }
                                    let validation: any = scope.validateModel(otype, row);
                                    if (validation && validation.hasOwnProperty('options') && validation.options.hasOwnProperty('forEncryption')) {
                                        scope.decryptPaths(row, validation.options.forEncryption);
                                    }
                                    let props = scope.storedQueries[otype].schema.properties;
                                    if (props && props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry && row.hasOwnProperty('id')) {
                                        row.id = row.id.substring((scope.envProp('DB_NAMESPACE') + ':' + scope.envProp('SERVICE_NAMESPACE') + ':').length, row.id.length);
                                    }            
                                    records.push(row);
                                }
                                pagedResult.records = records;
                                cb(scope.status(true, 'query.success', pagedResult));
                            }
                        });
                    }catch(e){
                        console.log('DB ERROR:query', otype, e);
                        cb(scope.status(false, 'query.failed', []));
                    } 
                }
            });
        }
        queryFn();
    }

    get(type: string, id: string, cb: Function) {
        let otype = type;
        let scope = this;
        type = this.envProp('DB_NAMESPACE') + ':' + type;
        let retry = 0;

        let props = this.storedModels[otype].schema.properties;
        if (props && props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry && id && id.indexOf(this.envProp('DB_NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':')==-1) {
            id = (this.envProp('DB_NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':') + id;
        }
                
        let queryFn = function () {
            try{
                scope.bucket.get(id, function (error, result) {
                    if (error) {
                        if(error.code == 5000){
                            retry++;
                            queryFn();
                        }else{
                            cb(scope.status(false, 'get.failed', error));
                        }                    
                    } else {
                        let validation: any = scope.validateModel(otype, result.value);
                        if (validation && validation.hasOwnProperty('options') && validation.options.hasOwnProperty('forEncryption')) {
                            scope.decryptPaths(result.value, validation.options.forEncryption);
                        }
                        let props = scope.storedModels[otype].schema.properties;
                        if (props && props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry && result.value.hasOwnProperty('id')) {
                            result.value.id = result.value.id.substring((scope.envProp('DB_NAMESPACE') + ':' + scope.envProp('SERVICE_NAMESPACE') + ':').length, result.value.id.length);
                        }
                        cb(scope.status(true, 'get.success', result.value));
                    }
                });
            }catch(e){
                console.log('DB ERROR:get', otype, e);
                cb(scope.status(false, 'get.failed', {}));
            }
        };
        queryFn();
    }

    create(type: string, data: any, cb: Function) {
        data = {...data};
        
        console.log(type, "!", data);

        let otype = type;
        let validation: any = this.validateModel(type, data);
        if (validation && validation.hasOwnProperty('options') && validation.options.hasOwnProperty('forEncryption')) {
            this.hashPathsAndEncrypt(data, validation.options.forEncryption);
        }

        type = this.envProp('DB_NAMESPACE') + ':' + type;
        let scope = this;

        if (!validation.valid) {
            let errors = [];
            for (let i = 0; i < validation.errors.length; i++) {
                errors.push(validation.errors[i].stack.split('instance.').join(''));
            }
            cb(scope.status(false, 'create.failed', errors));
        }

        let id = uuidv4();
        let props = scope.storedModels[otype].schema.properties;

        if (props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry) {
            id = scope.envProp('DB_NAMESPACE') + ':' + scope.envProp('SERVICE_NAMESPACE') + ':' + data.id;
        } else if (data && data.hasOwnProperty('_id')) {
            id = data._id;
            delete data._id;
        }

        if (otype.indexOf('system:')==0 && props.hasOwnProperty('service')) {
            data.service = scope.envProp('SERVICE_NAMESPACE');
        }

        data._type = type;
        data.id = id;
        let retry = 0;

        let createFn = function () {
            try{
                scope.bucket.insert(id, data, function (error, result) {
                    if (error) {
                        if (error.code == 11) {
                            retry++;
                            createFn();
                        } else {
                            cb(scope.status(false, 'create.failed', error));
                        }
                    } else {
                        if(DBService.hasLog(otype)) console.log('  create', type, data.id, retry);
                        scope.get(otype, id, function (p) {
                            if (p.success) {
                                cb(scope.status(true, 'create.success', p.result));
                            } else {
                                cb(scope.status(false, 'create.failed', p.result));
                            }
                        });
                    }
                });
            }catch(e){
                console.log('DB ERROR:create', otype, e);
                cb(scope.status(false, 'create.failed', {}));
            }
        }
        createFn();
    }

    update(type: string, data: any, cb: Function) {
        data = {...data}; 
        let otype = type;
        let validation: any = this.validateModel(type, data);
        if (validation && validation.hasOwnProperty('options') && validation.options.hasOwnProperty('forEncryption')) {
            this.hashPathsAndEncrypt(data, validation.options.forEncryption);
        }

        type = this.envProp('DB_NAMESPACE') + ':' + type;
        let retry = 0;
        let scope = this;

        if (!validation.valid) {
            let errors = [];
            for (let i = 0; i < validation.errors.length; i++) {
                errors.push(validation.errors[i].stack.split('instance.').join(''));
            }
            cb(scope.status(false, 'update.failed', errors));
        }

        let props = scope.storedModels[otype].schema.properties;

        if (props && props.hasOwnProperty('id') && props.id.hasOwnProperty('entry') && props.id.entry && data.id && data.id.indexOf(this.envProp('DB_NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':')==-1) {
            data.id = (this.envProp('DB_NAMESPACE') + ':' + this.envProp('SERVICE_NAMESPACE') + ':') + data.id;
        }

        if (otype.indexOf('system:')==0 && props.hasOwnProperty('service')) {
            data.service = scope.envProp('SERVICE_NAMESPACE');
        }        

        let updateFn = function () {
            data._type = type;
            try{
                scope.bucket.replace(data.id, data, function (error, result) {
                    if (error) {
                        if (error.code == 11) {
                            updateFn();
                        } else {
                            cb(scope.status(false, 'update.failed', error));
                        }
                    } else {
                        if(DBService.hasLog(otype)) console.log('  update', type, data.id, retry);
                        scope.get(otype, data.id, function (p) {
                            if (p.success) {
                                cb(scope.status(true, 'update.success', p.result));
                            } else {
                                cb(scope.status(false, 'update.failed', p.result));
                            }
                        });
                    }
                });
            }catch(e){
                console.log('DB ERROR:update', otype, e);
                cb(scope.status(false, 'update.failed', {}));
            }
            
        }
        updateFn();
    }

    getModels(): Object {
        return this.storedModels;
    }


    getModel(name:string): Object {
        return this.storedModels[name];
    }    

    getQueries(): Object {
        return this.storedQueries;
    }

    getQuery(name:string): Object {
        return this.storedQueries[name];
    }      

    getFields(): Object {
        return {
            fields: this.storedModelFields,
            queries: this.storedQueryFields
        };
    }

}
