'use strict'
let bcrypt = require('bcrypt-nodejs');
let mongoosePaginate=require('mongoose-pagination');
let fs=require('fs');
let path=require('path');

//primera en mayuscula para saber que es un modelo
let User = require('../models/user');
let Follow = require('../models/follow');
let Publication = require('../models/publication');
let jwt=require('../services/jwt');

//metodos de prueba
function home(req, res){
    console.log(req.body);
    res.status(200).send({
        message: 'Hola Inicio' 
    })
};
function pruebas(req, res){
    res.status(200).send({
        message: 'Hola desde Prueba' 
    })
};

// Registro
function saveUser(req,res){
    let params = req.body;
    //creo el usuario que voy a guardar
    let user= new User();
    if(params.name&&params.surname&& params.nick&&params.email&&params.password){
        //asigno los datos del request al modelo..
        user.name=params.name;
        user.surname=params.surname;
        user.nick=params.nick;
        user.email=params.email;
        user.role = 'ROLE_USER';
        user.image = null;

        //controlar usuarios duplicados
        User.find({ $or: [
                {email: user.email.toLowerCase()},
                {nick: user.nick.toLowerCase()}
        ]}).exec((err, users)=>{
            if(err){
                return res.status(500).send({message: 'Error en la peticion de usuarios'});
            }
            if(users && users.length >=1){
                return res.status(200).send({message: 'El Usuario ya existe'});
            }else{
            //Crifro la password
            bcrypt.hash(params.password, null, null,(err, hash) =>{
            user.password=hash;
            
            user.save((err, userStored) =>{ //guardo el usuario con mongoose
                if(err) return res.status(500).send({message: 'Error al Guardar el usuario'});
                if(userStored){
                    res.status(200).send({user: userStored});//devuelvo un json con el usuario que guarde en la BD
                }else{
                    res.status(404).send({message: 'No se ha registrado el usuario'});
                }
            });
        });
            }
        });
    }else{
        res.status(200).send({
            message: 'Es necesario llenar todos los campos'
        });
    }
}
//Login
function loginUser(req, res){
  let params=req.body;
  let email=params.email;
  let password=params.password;

  User.findOne({email: email}, (err, user)=>{
      if(err) return res.status(500).send({message: 'Error en la peticion'});

      if(user){
          bcrypt.compare(password, user.password, (err, check)=>{//comparo la del POST con la encriptada
            if(check){
                 user.password=undefined;//elimino la contraseña de los datos que retorno
                 //devolver datos de usuario
                 if(params.gettoken){
                      //generar y devolver token
                      return res.status(200).send({
                          token: jwt.createToken(user)
                      });

                 }else{
                    return res.status(200).send({user});
                 }
            }else{
                  res.status(404).send({message:'El usuario no se ha podido identificar'});
            }
          });
      }else{
        res.status(404).send({message:'El usuario no se ha podido identificar'});
      }
  });
}

//Conseguir datos de un usuario por ID.
function getUser(req, res){
    //cuando los datos son por get se usa params, cuando es por post o put usamos body
    let userId=req.params.id;

    User.findById(userId, (err, user) =>{
        if(err) return res.status(500).send({message: 'Error en la peticion'});
        
        if(!user) return res.status(404).send({message: 'El usuario no existe'});
        
        followThisUser(req.user.sub, userId).then((value)=>{
        return res.status(200).send({
            user, 
            following: value.following,
            followed: value.followed
        });
       });
    });
}

async function followThisUser(identity_user_id, user_id){
    let following =await Follow.findOne({"user":identity_user_id, "followed":user_id}).exec((err, follow)=>{
        if(err) return handleError(err);
        return follow;
    });

    let followed = await Follow.findOne({"user":user_id, "followed":identity_user_id}).exec((err, follow)=>{
        if(err) return handleError(err);
        return follow;
    });

    return {
        following: following,
        followed: followed
    }
}

//Devolver un listado de usuarios paginados
function getUsers(req, res){
     let identity_user_id = req.user.sub;//payload propiedad sub
     let page=1;
     if(req.params.page){
       page=req.params.page;
     }
     let itemsPerPage=5;

     User.find().sort('_id').paginate(page,itemsPerPage,(err,users,total)=>{
        if(err) return res.status(500).send({message: 'Error en la peticion'});
        if(!users) return res.status(404).send({message: 'No hay Usuarios disponibles'});
     
        followUserIds(identity_user_id).then((value)=>{
            return res.status(200).send({
                users,
                users_following:value.following,
                users_follow_me:value.followed,
                total,
                pages: Math.ceil(total/itemsPerPage)
            });
        });
        
    });
}

async function followUserIds(user_id){
    //los que sigo
    let following= await Follow.find({"user":user_id}).select({'_id':0,'_v':0, 'user':0}).exec((err,follows)=>{
        return follows;
    });
    

    //los que me siguen
    let followed= await Follow.find({"followed":user_id}).select({'_id':0,'_v':0, 'followed':0}).exec((err,follows)=>{
        return follows;
    });

    //procesar following_ids
    let following_clean = [];
        following.forEach((follow)=>{
            following_clean.push(follow.followed);
        });

    //procesar followed_ids    
    let followed_clean = [];
    followed.forEach((follow)=>{
        followed_clean.push(follow.user);
    });
    return {
        following: following_clean,
        followed: followed_clean
    }
}

function getCounters(req,res){
    let userId=req.user.sub;
    if(req.params.id){
          userId=req.params.id;  
    }
    getCountFollow(userId).then((value)=>{
        return res.status(200).send(value);
    });
}

    async function getCountFollow(user_id){
        try{
            let following = await Follow.count({'user': user_id}).exec()
                .then((following) =>{
                    return following;
                })
                .catch((err) =>{
                    return handleerror(err);
                });
            let followed = await Follow.count({'followed':user_id}).exec()
                .then((followed) =>{
                    return followed;
                })
                .catch((err) =>{
                    return handleerror(err);
                });
            let publications = await Publication.count({'user':user_id}).exec()
                .then((publications) =>{
                    return publications
                })
                .catch((err) =>{
                    return handleerror(err);
                });
    
            return {
                following: following,
                followed: followed,
                publications: publications
            }
    
        }catch(e){
           console.log(e);
        }
}

function updateUser(req, res){
   let userId= req.params.id;//recoger id de la url
   let update=req.body;
   delete update.password;//borrar propiedad password
   if(userId != req.user.sub){
         return res.status(500).send({message:'No tienes permiso para actualizar los datos del usuario'});
        }
      User.findByIdAndUpdate(userId, update, {new:true} ,(err, userUpdate)=>{
               if(err) return res.status(500).send({message: 'Error en la peticion'});
               
               if(!userUpdate) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});
               
               return res.status(200).send({user: userUpdate});
            });
}

//Subir archivod de imagen/avatar de usuarip
function uploadImage(req, res){
    let userId= req.params.id;//recoger id de la url
    if(userId != req.user.sub){
       return removeFiles(res, file_path, 'No tienes permiso para actualizar los datos de usuario');
         }
    if(req.files){
        let file_path= req.files.image.path;
        console.log(file_path);
        
        let file_split=file_path.split('\\');
        console.log(file_split);

        let file_name=file_split[2];
        console.log(file_name);

        let ext_split=file_name.split('\.');
        console.log(ext_split);
        let file_ext  = ext_split[1];
        console.log(file_ext);


        if(file_ext=='png'|| file_ext=='jpg'|| file_ext=='jpeg'|| file_ext=='gif'){
             User.findByIdAndUpdate(userId, {image: file_name}, {new:true},(err, userUpdate)=>{
                if(err) return res.status(500).send({message: 'Error en la peticion'});
               
                if(!userUpdate) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});

                return res.status(200).send({user: userUpdate});
             });
            }else{
               return removeFiles(res, file_path, 'Extension no valida');
        }
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
   let path_file ='./uploads/users/'+image_file;
   fs.exists(path_file, (exist)=>{
       if(exist){
           res.sendFile(path.resolve(path_file));
       }else{
           res.status(200).send({message: 'No existe la imagen'});
       }
   });
}

module.exports={
    home,
    pruebas,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    getCounters,
    updateUser,
    uploadImage,
    getImageFile
}
