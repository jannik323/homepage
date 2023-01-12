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
    res.cookie("discordToken",data.access_token,{ maxAge: 604800, httpOnly: true,secure:true });
    addValidAuth(data.access_token);
    res.redirect("/");
  });
  
});

function findUserName(token){
  let auth = validAuth.find(e=>e.token==token);
  if(auth==null)return null;
  return auth.username;
}

function addValidAuth(token){
  let newauth = {token:token,username:null};
  if(validAuth.find(e=>e.token==token)==null){
      validAuth.push(newauth);
      fetch("https://discord.com/api/oauth2/@me",{
          headers:{
              "Authorization":"Bearer "+token,
          }
      }).then(response=>{
          if (!response.ok) {
          throw new Error("HTTP error " + response.status);
          }
          return response.json();
      }).then(data=>{
          console.log(data);
          newauth.username=data.user.username;
      });
  }
  
}

module.exports.discordrouter = router;
module.exports.addValidAuth = addValidAuth;
module.exports.findUserName = findUserName;