'use strict'
let mongoose= require('mongoose');
let Schema = mongoose.Schema;

let FollowSchema = Schema({
  
   user: {
      type: Schema.ObjectId, ref: 'User' 
   },//seguidor
   followed: {
    type: Schema.ObjectId, ref: 'User'
 }//seguido

});

module.exports = mongoose.model('Follow', FollowSchema);