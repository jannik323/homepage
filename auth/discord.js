const express = require("express");
const fetch = require('node-fetch');
const {URLSearchParams} = require("url");
const validAuth = require('../data/validauth.json');

const router = express.Router();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const rawredirect = "http://localhost:8080/auth/discord/callback";
const redirect = encodeURIComponent("http://localhost:8080/auth/discord/callback");

router.get("/", (req, res) => {
  res.redirect("https://discordapp.com/api/oauth2/authorize?client_id="+CLIENT_ID+"&scope=identify&response_type=code&redirect_uri="+redirect+"&prompt=consent");
});

router.get('/callback',(req, res) => {
  if (!req.query.code) {
    res.status(400).send("")
    return;
  }
  const code = req.query.code;
  
  let params = new URLSearchParams();
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', rawredirect);
  fetch("https://discord.com/api/oauth2/token",{
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body:params
  }).then(response=>{
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      return response.json();
  }).then(data=>{
    res.cookie("discordToken",data.access_token,{ maxAge: data.expires_in, httpOnly: true,secure:true });
    //data.refresh_token for refresh 
    addValidAuth(data.access_token,data.expires_in,()=>{
      res.redirect("/");
    });
  });
  
});

function findUserName(token){
  let auth = validAuth.find(e=>e.token==token);
  if(auth==null)return null;
  return auth.username;
}

function addValidAuth(token,expires_in,callback){
  let newauth = {token:token,username:null,id:null,expires_in:expires_in};
  fetch("https://discord.com/api/oauth2/@me",{
      headers:{
          "Authorization":"Bearer "+token,
      }
  }).then(response=>{
      if (!response.ok) {
        throw new Error("HTTP error while getting auth info " + response.status);
      }
      return response.json();
  }).then(data=>{
      newauth.username=data.user.username;
      newauth.id=data.user.id;

      let existingAuth = validAuth.find(e=>e.id==newauth.id);
      if(existingAuth==null){
        validAuth.push(newauth);
      }else{
        existingAuth.username=newauth.username;
        existingAuth.token=newauth.token;
      }
      callback();
  });
  
}

module.exports.discordrouter = router;
module.exports.addValidAuth = addValidAuth;
module.exports.findUserName = findUserName;