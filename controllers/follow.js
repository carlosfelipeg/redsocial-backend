'use strict'

//let path = require(path);
//let fs=require('fs');
let mongoosePaginate = require('mongoose-pagination');

let User = require('../models/user');
let Follow = require('../models/follow');

function saveFollow(req, res){
    let params = req.body;
    let follow = new Follow();
    follow.user =  req.user.sub; // seguidor
    follow.followed = params.followed // seguido

    follow.save((err,followStored) => {
        if(err) return res.status(500).send({message : 'Error al guardar el seguimiento'});
        if(!followStored){
            return res.status(404).send({message : 'El seguimiento no se ha guardado'});
        }
        return res.status(200).send({follow : followStored});
    });
}

function deleteFollow(req, res){
        let userId = req.user.sub;
        let followId = req.params.id;

        Follow.find({'user':userId, 'followed':followId}).remove(err =>{
            if(err) return res.status(500).send({message : 'Error al dejar de seguir'});

            return res.status(200).send({message:'Follow eliminado correctamente'});
        });
}

//listar los usuarios que esta siguiendo determinado usuario
function getFollowingUsers(req, res){
    let userId = req.user.sub;
    if(req.params.id&&req.params.page){
        userId=req.params.id;
    }

    let page=1;

    if(req.params.page){
        page=req.params.page;
    }else if(req.params.id){
        page=req.params.id; 
    }

    let itemsPerPage = 4 ;

    Follow.find({user:userId}).populate('followed').paginate(page,itemsPerPage,(err, follows, total)=>{//el populate es para mostrar la informacion interna de el usuario seguido, en vez de mostrar el id solamente
        console.log(page);
        if(err) return res.status(500).send({message : 'Error en el servidor'});
        if(!follows) return res.status(404).send({message: 'No estas siguiendo a ningun usuario'});
        return res.status(200).send({
            total : total,
            pages: Math.ceil(total/itemsPerPage),
            follows
        });
    });
}
//listar los usuarios que siguen a determinado usuario
function getFollowersUsers(req, res){
let userId = req.user.sub;
    if(req.params.id&&req.params.page){
        userId=req.params.id;
    }s
    let page=1;
    if(req.params.page){
        page=req.params.page;
    }else if(req.params.id){
        page=req.params.id; 
    }
    let itemsPerPage = 4 ;
    Follow.find({followed:userId}).populate('user').paginate(page,itemsPerPage,(err, follows, total)=>{//el populate es para mostrar la informacion interna de el usuario, en vez de mostrar el id solamente
        if(err) return res.status(500).send({message : 'Error en el servidor'});
        if(!follows) return res.status(404).send({message: 'No te sigue ningun usuario'});
        return res.status(200).send({
            total : total,
            pages: Math.ceil(total/itemsPerPage),
            follows
        });
    });
}

//devolver listado de usuarios a los que sigo o los usuarios que me estan siguendo
function getMyFollows(req,res){
      let userId = req.user.sub;
      let find = Follow.find({user: userId});

      if(req.params.followed){
          find=Follow.find({followed: userId});
      }

      find.populate('user followed').exec((err,follows)=>{
        if(err) return res.status(500).send({message : 'Error en el servidor'});
        if(!follows) return res.status(404).send({message: 'No sigues a ningun usuario'});
        return res.status(200).send({follows});
      });
}

module.exports={
     saveFollow,
     deleteFollow,
     getFollowingUsers,
     getFollowersUsers,
     getMyFollows
}