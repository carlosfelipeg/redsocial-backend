'use strict'

let express=require('express');
let MessageController=require('../controllers/message');
let api = express.Router();
let md_auth=require('../middlewares/authenticated');

api.get('/message',md_auth.ensureAuth,MessageController.save_message);
api.get('/my-messages/:page?',md_auth.ensureAuth,MessageController.getReceivedMessages);
api.get('/send-messages/:page?',md_auth.ensureAuth,MessageController.getSendMessages);
api.get('/unviewed-messages',md_auth.ensureAuth,MessageController.getUnviewedMessages);
api.get('/set-viewed-messages',md_auth.ensureAuth,MessageController.setViewedMessages);

module.exports =api;