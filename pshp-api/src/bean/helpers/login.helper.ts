
import * as jwt from 'jsonwebtoken';

export class LoginHelper {

    public static login(service: any, control: any, user: any, db: any, bean: any, data: any, id: string, files: any, callback: Function) {
        if (data) {            
            let validator = db.getValidator();
            let validation = validator.validate(data, {
                "id": "/LoginInfo",
                "type": "object",
                "properties": {
                    "username": {
                        "type": "string",
                        "description": "User Name",
                        "required": true
                    },
                    "password": {
                        "type": "string",
                        "description": "Password",
                        "required": true
                    }
                }
            }, { nestedErrors: true });

            if (!validation.valid) {
                let errors = [];
                for (let i = 0; i < validation.errors.length; i++) {
                    errors.push(validation.errors[i].stack.split('instance.').join(''));
                }
                callback({success:false, message:'login.failed', result: errors});
                return;
            }

            service.sanitize(data);
            db.search('system:user', { username: data.username, service: process.env['SERVICE_NAMESPACE'], active: 'Y' }, (p) => {
                if (p.success && p.result.length > 0 && p.result[0].password == data.password) {
                    db.search('system:settings', { service: process.env['SERVICE_NAMESPACE'] }, (ps) => {
                        if (ps.success && ps.result.length > 0) {
                            let user: any = { username: p.result[0].username, role: p.result[0].role, time: new Date() + '' };
                            try {
                                let token = jwt.sign(
                                    user,
                                    ps.result[0].priv_sig,
                                    { algorithm: 'RS256', expiresIn: '15m' }
                                );
                                let refresh = jwt.sign(
                                    {...user, role:'guest'},
                                    ps.result[0].priv_sig,
                                    { algorithm: 'RS256', expiresIn: '60m' }
                                );
                                user.token = token;
                                user.refresh = refresh;
                                let meta = db.getFields();
                                for(let i in meta.fields){
                                    if(i.startsWith('system:') || service.excludeBeans.hasOwnProperty(i)){
                                        delete meta.fields[i];
                                    }
                                }
                                for(let i in meta.queries){
                                    if(i.startsWith('system:') || service.excludeBeans.hasOwnProperty(i)){
                                        delete meta.queries[i];
                                    }
                                }
                                user.meta = meta;
                                callback({ success: true, message: 'login.success', result: user });
                            } catch (e) {
                                callback({ success: false, message: 'login.failed', result: e });
                            }
                        } else {
                            callback({ success: false, message: 'login.failed' });
                        }
                    });
                } else {
                    callback({ success: false, message: 'login.failed' });
                }
            });
        } else {
            callback({ success: false, message: 'login.failed' });
        }
    }
}