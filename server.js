const statData = require('./data/stats.json');
let projectsData = require('./data/projects.json');
let projectsDataCategory;
initProjectsDataCategory();

const express = require('express');
const { join } = require('path');
const fs = require("fs");
const https = require('https');
const app = express();

//const cookieParser = require('cookie-parser');
//const { validAuth, discordrouter, findUserName } = require('./auth/discord');

// let ALLOWED_ORIGINS = ["http://localhost:8080","https://localhost:3000"];


startServer();
function startServer(){

    //cookie parse
   // app.use(cookieParser());

    //register with discord
    // app.use('/auth/discord', discordrouter);

    // app.use((req, res, next) => {
    //     let origin = req.headers.origin;
    //     let theOrigin = (ALLOWED_ORIGINS.indexOf(origin) >= 0) ? origin : ALLOWED_ORIGINS[0];
    //     res.header("Access-Control-Allow-Origin", theOrigin);
    //     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    //     next();
    // })

    // Serve static files
    app.use(express.static(join(__dirname, 'public')));

    app.get('/', (req, res) => {
        res.sendFile(join(__dirname, 'public', 'home.html'));
    });

    app.get("/download/:file",(req, res) => {
        let prefix = join(__dirname, 'download');
        let downloadPath = join(prefix,req.params.file);
        if(downloadPath.startsWith(prefix)){
            if(fs.existsSync(downloadPath)){
                res.download(downloadPath);
            }else{
                res.status(404).sendFile(join(__dirname, 'public', 'error.html'));
            }
        }
    });

    app.get('/about', (req, res) => {
        res.sendFile(join(__dirname, 'public', 'about.html'));
    });

    app.get('/projects/:project', (req, res) => {
        res.sendFile(join(__dirname, 'public', 'project.html'));
    });

    app.get('/overview/:category', (req, res) => {
        res.sendFile(join(__dirname, 'public', 'overview.html'));
    });

    app.get('/data/stats', (req, res) => {
        res.json(statData);
    });

    app.get('/socketclient', (req, res) => {
        res.redirect("https://cdn.socket.io/4.3.2/socket.io.esm.min.js");
    });

    app.get('/data/projects', (req, res) => {
        let data = projectsData;

        if(req.query.category!=null){
            data = projectsDataCategory[req.query.category]
            if(data==null){
                data = [];
            }
        }

        if(req.query.showcased!=null){
            data = data.filter(e=>e.showcased);
        }

        res.json(data);
    });

    app.get('/secret', (req, res) => {
        res.send("👽<br> 01101000011001010110110001101100011011110010000001101001001000000110000101101101001000000110000101101110001000000110000101101100011010010110010101101110")
    });

    // app.get('/data/username', (req, res) => {
    //     let token = req.cookies['discordToken'];
    //     let username = findUserName(token);
    //     res.json(username);
    // });

    app.all('*', (req, res) => {
        res.status(404).sendFile(join(__dirname, 'public', 'error.html'));
    });

    //save stats and auth
   // setInterval(()=>{
      //  fs.writeFile('./data/stats.json', JSON.stringify(statData),()=>{
    //        console.log("saved stats to file: "+ new Date().toLocaleString());
  //      });

        // fs.writeFile('./data/validauth.json', JSON.stringify(validAuth),()=>{
        //     console.log("saved validauth to file: "+ new Date().toLocaleString());
        // });
//    },30*60000); // 30 minutes

    fs.watchFile("./data/projects.json",{interval:60000},()=>{
        projectsData=JSON.parse(fs.readFileSync("./data/projects.json","utf-8"));
        initProjectsDataCategory();
        console.log("projects object is now up to date: "+ new Date().toLocaleString());
    })

    require("greenlock-express")
    .init({
        packageRoot: __dirname,
        configDir: "./greenlock.d",
        maintainerEmail: "jannik323@outlook.de",
        cluster: false
    }).serve(app);

    // app.listen(80, () => {
    // 	console.log("server is running at port 80");
    // });

}

function initProjectsDataCategory(){
    projectsDataCategory = {};
    projectsData.forEach(e=>{
        if(projectsDataCategory[e.category]==null){
            projectsDataCategory[e.category]=[];
        }
        projectsDataCategory[e.category].push(e);
    })
}