'use strict'

 let path = require('path');
 let fs = require('fs');
 let moment=require('moment');
 let mongoosePaginate = require('mongoose-pagination');

 let Publication = require('../models/publication');
 let User = require ('../models/user');
 let Follow= require('../models/follow');

 function savePublication(req, res){
      let params = req.body;
      if(!params.text){
          return res.status(200).send({message: 'Debes enviar un texto'});
      }

      let publication = new Publication();
      publication.text=params.text;
      publication.file='null';
      publication.user=req.user.sub;
      publication.created_at=moment().unix;
      
      publication.save((err,publicationStored)=>{
          if(err) return res.status(500).send({message:'Error al guardar la publicacion'});

          if(!publicationStored) return res.status(500).send({message:'La publicacion No ha sido guardada'});
          
          return res.status(200).send({publication: publicationStored});
        });
 }

 function getPublications(req, res){
    let page=1; 
    if(req.params.page){
        page=req.params.page;
     }

     let itemsPerPage=4;

     Follow.find({user:req.user.sub}).populate('followed').exec((err, follows)=>{
        if(err) return res.status(500).send({message:'Error devolver el seguimiento'});
        
        let follows_clean = [];
        follows.forEach((follow) =>{
           follows_clean.push(follow.followed);
        });
        
        Publication.find({user: {"in":follows_clean}}).sort('-created-at').populate('user').paginate(page, itemsPerPage, (err,publications, total)=>{
            if(err) return res.status(500).send({message:'Error devolver publicacion'});
            
            if(!publications){
                return res.status(404).send({message:'No hay publicaciones'});
            }

            return res.status(200).send({
                total_items:total,
                pages: Math.ceil(total/itemsPerPage),
                page:page,
                publications
            });
        
        });//in es para buscar en un array

    });
 }

 function getPublication(req, res){
        let publicationId=req.params.id;

        Publication.findById(publicationId,(err, publication)=>{
           if(err) return res.status(500).send({message:'Error devolver publicacion'});
        
           if(!publication) return res.status(400).send({message: 'No existe la publicacion'});
        
           res.status(200).send({publication});
        });
 }

 function deletePublication(req, res){
       let publicationId=req.params.id;

       //confirmo que el id de usuario y el id de publicacion correspondan, de tal modo que un usuario que no
       //sea autor de ella no pueda borrarla
       Publication.find({user:req.user.sub, 'id': publicationId}).remove((err)=>{
        if(err) return res.status(500).send({message:'Error al borrar publicacion'});
        
        return res.status(200).send({message: 'Se ha borrado la publicacion correctamente'});
    });
 }

 function uploadImage(req, res){
    let publicationId= req.params.id;//recoger id de la url
    
    if(req.files){
        let file_path= req.files.image.path;
        
        let file_split=file_path.split('\\');

        let file_name=file_split[2];

        let ext_split=file_name.split('\.');
      
        let file_ext  = ext_split[1];

        Publication.findOne({'user':req.user.sub, '_id':publicationId}).exec((err, publication)=>{
            if(publication){
                if(file_ext=='png'|| file_ext=='jpg'|| file_ext=='jpeg'|| file_ext=='gif'){
                    Publication.findByIdAndUpdate(publicationId, {file: file_name}, {new:true},(err, publicationUpdate)=>{
                       if(err) return res.status(500).send({message: 'Error en la peticion'});
                      
                       if(!publicationUpdate) return res.status(404).send({message: 'No se ha podido actualizar la publicacion'});
       
                       return res.status(200).send({publication: publicationUpdate});
                    });
                   }else{
                      return removeFiles(res, file_path, 'Extension no valida');
               }
            }else{
                return res.status(200).send({message: 'No tienes permisos para subir una imagen a la publicacion'});
            }
        });


        
    }else{
        return res.status(200).send({message: 'No se ha subido una imagen'});
    }
 }

 function removeFiles(res, file_path, mensaje){
    fs.unlink(file_path, (err)=>{
        return res.status(200).send({message: mensaje});
    });
}

function getImageFile(req, res){
    let image_file= req.params.imageFile;
    let path_file ='./uploads/publications/'+image_file;
    fs.exists(path_file, (exist)=>{
        if(exist){
            res.sendFile(path.resolve(path_file));
        }else{
            res.status(200).send({message: 'No existe la imagen'});
        }
    });
 }

 module.exports={
     savePublication,
     getPublications,
     getPublication,
     deletePublication,
     uploadImage,
     getImageFile
 }
