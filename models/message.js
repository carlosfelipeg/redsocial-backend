'use strict'
let mongoose= require('mongoose');
let Schema = mongoose.Schema;

let MessageSchema = Schema({
  
   text:String,
   viewed: String,
   created_at:String,
   emmiter: {
      type: Schema.ObjectId, ref: 'User' 
   },//emisor
   receiver: {
    type: Schema.ObjectId, ref: 'User'
   }//receptor
 
});

module.exports = mongoose.model('Message', MessageSchema);