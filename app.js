const express = require('express');
const { join } = require('path');
const statData = require('./data/stats.json');
let projectsData = require('./data/projects.json');
const fs = require("fs");


const app = express();
const PORT = 5000;

startServer();
function startServer(){
    // Serve static files
    app.use(express.static(join(__dirname, 'public')));

    // Add routes
    app.get('/', (req, res) => {
        statData.pageVisits++;
        res.sendFile(join(__dirname, 'public', 'home.html'));
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

    app.get('/data/projects', (req, res) => {
        let data = projectsData;

        if(req.query.category!=null){
            data = data.filter(e=>e.category==req.query.category);
        }

        if(req.query.showcased!=null){
            data = data.filter(e=>e.showcased);
        }
        res.json(data);
    });

    app.get('/secret', (req, res) => {
        res.send("👽<br> 01101000011001010110110001101100011011110010000001101001001000000110000101101101001000000110000101101110001000000110000101101100011010010110010101101110")
    });

    app.all('*', (req, res) => {
        res.status(404).sendFile(join(__dirname, 'public', 'error.html'));
    });


    app.listen(PORT, () => {
        console.log(`Server started on port ${PORT}`);
    });


    //save stats
    setInterval(()=>{
        fs.writeFile('./data/stats.json', JSON.stringify(statData),()=>{
            console.log("saved stats to file: "+ new Date().toLocaleString());
        });
    },30*60000); // 30 minutes

    fs.watchFile("./data/projects.json",{interval:60000},()=>{
        projectsData=JSON.parse(fs.readFileSync("./data/projects.json","utf-8"));
        console.log("projects object is now up to date: "+ new Date().toLocaleString());
    })
}   

