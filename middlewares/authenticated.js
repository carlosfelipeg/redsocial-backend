'use strict'
let jwt=require('jwt-simple');
let moment=require('moment');
let secret='pass_secret_admin_red.social';

exports.ensureAuth = function(req, res, next){
    if(!req.headers.authorization){
        return res.status(403).send({message: 'La peticion no tiene la cabecera de autenticacion'});
    }

    let token = req.headers.authorization.replace(/['"]+/g, '');
    try{
    let payload = jwt.decode(token, secret);//decodifico el token
      if(payload.exp<=moment().unix()){
         return res.status(401).send({
             message :'El token ha expirado'
         });
      }

      }catch(ex){
        return res.status(404).send({
            message :'El token no es valido'
        });
    }
       req.user=payload;
       next();
}