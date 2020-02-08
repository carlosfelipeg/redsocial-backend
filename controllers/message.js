'use strict'
let moment = require('moment');
let mongoosePaginate= require('mongoose-pagination');

let User = require('../models/user');
let Follow = require('../models/follow');
let Message = require('../models/message');

function save_message(req, res){
    let params=req.body;

    if(!params.text||!params.receiver){
        return res.status(200).send({message: 'Envia los campos necesarios'});
    }else{
        let message= new Message();
        message.emitter= req.user.sub;
        message.receiver=params.receiver;
        message.text=params.text;
        message.viewed='false';
        message.created_at=momment().unix();

        message.save((err,messageStored)=>{
            if(err) return res.status(500).send({message: 'Error en la peticion'});
            if(!messageStored){
                return res.status(500).send({message: 'Error al enviar el mensaje'});
            }else{
                return res.status(200).send({message: messageStored});
            }
        });

    }
}

function getReceivedMessages(req, res){

    let userId= req.user.sub;

    let page=1;

    if(req.params.page){
       page=req.params.page;
    }

     let itemsPerPage=4;

     //segundo parametro del populate para que solo me muestre esos campos
     Message.find({receiver:userId}).populate('emmiter', 'name surname _id nick image').paginate(page, itemsPerPage, (err, messages, total)=>{
        if(err) return res.status(500).send({message: 'Error en la peticion'}); 
        if(!messages){
            return res.status(404).send({message: 'No te han enviado mensajes'});
          }else{
            return res.status(500).send({
                total_items:total,
                pages: Math.ceil(total/itemsPerPage),
                page:page,
                messages
            });
          }
     });
}

function getSendMessages(req, res){

    let userId= req.user.sub;

    let page=1;

    if(req.params.page){
       page=req.params.page;
    }

     let itemsPerPage=4;

     //segundo parametro del populate para que solo me muestre esos campos
     Message.find({emitter:userId}).populate('emitter receiver', 'name surname _id nick image').paginate(page, itemsPerPage, (err, messages, total)=>{
        if(err) return res.status(500).send({message: 'Error en la peticion'}); 
        if(!messages){
            return res.status(404).send({message: 'No has enviado mensajes'});
          }else{
            return res.status(500).send({
                total_items:total,
                pages: Math.ceil(total/itemsPerPage),
                page:page,
                messages
            });
          }
     });
}

function setViewedMessages(req, res){
    let userId=req.user.sub;

    Message.update({receiver:userId, viewed:'false'},{viewed:'true'},{"multi":true},(err, messageUpdated)=>{
        if(err) return res.status(500).send({message: 'Error en la peticion'}); 
        
            return res.status(200).send({
                messages: messageUpdated});
    });

}

function getUnviewedMessages(req, res){
    let userId= req.user.sub;
    
    Message.count({receiver:userId, viewed:'false'}).exec((err, count)=>{
        if(err) return res.status(500).send({message: 'Error en la peticion'});
        
            return res.status(200).send({
                'unviewed':count
            });
        
    });
}

module.exports={
     save_message,
     getReceivedMessages,
     getSendMessages,
     getUnviewedMessages,
     setViewedMessages
}