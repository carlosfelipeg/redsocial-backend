'use strict'
let mongoose= require('mongoose');
let Schema = mongoose.Schema;

let PublicationSchema = Schema({
   text: String,
   file : String,
   created_at: String,
   user: {
      type: Schema.ObjectId, ref: 'User' //los datos se sustituyen por los datos del user que creo la publicacion
   }
});

module.exports = mongoose.model('Publication', PublicationSchema);