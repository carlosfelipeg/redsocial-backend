'use strict'

let mongoose = require('mongoose');
let app= require('./app');//exporto app
let port =3800; 


//Conexion a BD
mongoose.Promise=global.Promise;
mongoose.connect('mongodb://localhost:27017/red-social',{  useNewUrlParser: true , useUnifiedTopology: true })
        .then(()=>{
      console.log("La conexion a la bd se ha realizado correctamente");
  
      //crear servidor
      app.listen(port,()=>{
        console.log("Servidor corriendo en http://localhost:3800");
      })

    })
        .catch(err => console.log(err));

