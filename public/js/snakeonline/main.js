let ws;


let canvas = document.getElementById("canvas");
canvas.width=500;
canvas.height=500;
let ctx = canvas.getContext("2d");

const PORT = 44444;

//prod
 const wsurl = "wss://jannik323.software:"+PORT;
 const httpurl = "https://jannik323.software:"+PORT;

//debug
//const wsurl = "ws://127.0.0.1:"+PORT;
//const httpurl = "http://127.0.0.1:"+PORT;


let playUIEle = document.getElementById("playUI");

let usernameEle = document.getElementById("username");
let startMenuEle = document.getElementById("startmenu");
let deathMenuEle = document.getElementById("deathmenu");
let gameresetmenuEle = document.getElementById("gameresetmenu");
let connectionerrorEle = document.getElementById("connectionerror");
let deathCauseEle = document.getElementById("deathCause");
let leaderboardEle = document.getElementById("leaderboard");
let leaderboardListEle = document.getElementById("lbList");
let leaderboardSpanEle = leaderboardEle.querySelectorAll("button span")[1];
let chatEle = document.getElementById("chat");
let chatListEle = document.getElementById("chatList");
let chatInputEle = document.getElementById("chatinput");
let chatSpanEle = chatEle.querySelectorAll("button span")[1];

let highscoreScoreEle = document.getElementById("highscoreScore");
let highscoreUsernameEle = document.getElementById("highscoreUsername");
let highscoresEle = document.getElementById("highscores");

let roundtimeEle = document.getElementById("roundtime");




let snakes = [];
let apples = [];
let obstacles = [];
let safezones = [];
let leaderboard = [];
let chat = [];

let selfSnake;
let gridSize=10;
let id;
let initialized = false;
let spawnCountdown = -1;
let spawnCountDownTime = 3;
let fullresetTimeDate = 0;

let viewingleaderboard = false;
let viewingchat = false;


const playerSnakeColor="#4e9b49";
const playerSnakeHeadColor=tColor(playerSnakeColor,-40);
const snakeColor="#634c2b";
const snakeHeadColor=tColor(snakeColor,-40);
const playerGhostSnakeColor="#575e56";
const playerGhostSnakeHeadColor=tColor(playerGhostSnakeColor,-40);
const ghostSnakeColor="#7a7a7a";
const ghostSnakeHeadColor=tColor(ghostSnakeColor,-40);
const obstacleColor="#1f1f2b";
const appleColor="#a03030";
const safeZoneColor="#dce6ea";

function tColor(col, amt) {
    col = col.slice(1);
    var num = parseInt(col, 16);
    var r = (num >> 16) + amt;
    var b = ((num >> 8) & 0x00FF) + amt;
    var g = (num & 0x0000FF) + amt;
    var newColor = g | (b << 8) | (r << 16);
    return "#"+newColor.toString(16);
}

toggleLeaderboardShow(); // show leaderboard at start
function toggleLeaderboardShow(){
    if(viewingleaderboard){
        leaderboardSpanEle.style.transform = "rotate(0deg)";
        viewingleaderboard=false;
        leaderboardListEle.style.display="none";
    }else{
        leaderboardSpanEle.style.transform = "rotate(90deg)";
        viewingleaderboard=true;
        leaderboardListEle.style.display="flex";
        createLeaderBoard();
    }
}

function toggleChatShow(){
    if(viewingchat){
        chatSpanEle.style.transform = "rotate(0deg)";
        viewingchat=false;
        chatListEle.style.display="none";
        chatInputEle.parentElement.parentElement.style.display="none";
    }else{
        chatSpanEle.style.transform = "rotate(90deg)";
        viewingchat=true;
        chatListEle.style.display="flex";
        chatInputEle.parentElement.parentElement.style.display="flex";
        createChat();
    }
}

function createChat(){
    chatEle.setAttribute("unread",false);
    chatListEle.innerHTML="";
    if(chat.length==0){
        chatListEle.style.display="none"
        return;
    }else{
        chatListEle.style.display="flex"
    }
    chat.forEach(e=>{
        let div = document.createElement("div");
        if(e.system){
            let msgspan = document.createElement("span");
            msgspan.innerText=e.msg;
            msgspan.style.color="red";
            msgspan.style.fontSize="0.8rem";
            msgspan.style.textShadow="#810000 0px 0px 5px";
            div.appendChild(msgspan);
        }else{
            let usernamespan = document.createElement("span");
            usernamespan.innerText=e.usr;
            usernamespan.style.fontWeight="bold";
            let colonspan = document.createElement("span");
            colonspan.innerText=":";
            let msgspan = document.createElement("span");
            msgspan.innerText=e.msg;
            div.appendChild(usernamespan);
            div.appendChild(colonspan);
            div.appendChild(msgspan);
        }
        chatListEle.appendChild(div);
    })
    chatListEle.scrollTop=chatListEle.scrollHeight;
}

function createLeaderBoard(){
    leaderboardListEle.innerHTML="";
    leaderboard.forEach(e=>{
        let div = document.createElement("div");
        let usernamespan = document.createElement("span");
        usernamespan.innerText=e.username;
        let scorespan = document.createElement("span");
        scorespan.innerText=e.score;
        div.appendChild(usernamespan);
        div.appendChild(scorespan);
        leaderboardListEle.appendChild(div);
    })
}

const Camera = {
    scale :10,
    x:0,
    y:0,
    xa:0,
    ya:0,
    transform:(x,y,w=1,h=1)=>{
        return {x:(x*Camera.scale)-Camera.x,y:(y*Camera.scale)-Camera.y,w:w*Camera.scale,h:h*Camera.scale}
    },
    transformDraw(x,y,w=1,h=1){
        ctx.fillRect((x*Camera.scale)-Camera.x,(y*Camera.scale)-Camera.y,w*Camera.scale,h*Camera.scale);
        ctx.strokeRect((x*Camera.scale)-Camera.x,(y*Camera.scale)-Camera.y,w*Camera.scale,h*Camera.scale);
    }
    ,
    changeScale:(change=1)=>{
        Camera.scale+=change;
        if(Camera.scale>20){
            Camera.scale=20;
        }else if(Camera.scale<6){
            Camera.scale=6;
        }
    },
    update:()=>{
        if(selfSnake!=null){
            let distx = ((selfSnake.head.x*Camera.scale)-(Camera.x))-(canvas.width/2);
            let disty = ((selfSnake.head.y*Camera.scale)-(Camera.y))-(canvas.width/2);

            if(distx<.5){
                Camera.xa-=Math.abs(distx/40);
            }else if(distx>.5){
                Camera.xa+=Math.abs(distx/40);
            }

            if(disty<.5){
                Camera.ya-=Math.abs(disty/40);
            }else if(disty>.5){
                Camera.ya+=Math.abs(disty/40);
            }

            Camera.xa*=0.3;
            Camera.ya*=0.3;

            Camera.x+=Camera.xa;
            Camera.y+=Camera.ya;
            // Camera.x = gridSize*Camera.scale/2;
            // Camera.y = gridSize*Camera.scale/2;
        }
    }
}

class MessageHandler{
    handle(message){
        try {
            let jsonMsg = JSON.parse(message);
            this[jsonMsg.t](jsonMsg.data);
        } catch (error) {
            console.error(error);
        }
    }
    addMsgHandle(type,handle){
        this[type]=handle;
    }
}
msgHandler = new MessageHandler();

function sendMessage(type,object){
    ws.send(JSON.stringify({t:type,data:object}));
}

msgHandler.addMsgHandle("highscore",data=>{
    highscoreScoreEle.innerText=data.score;
    highscoreUsernameEle.innerText=data.usr;
})

msgHandler.addMsgHandle("lb",data=>{
    leaderboard=data;
    if(viewingleaderboard){
        createLeaderBoard();
    }
})

msgHandler.addMsgHandle("msginit",data=>{
    data.forEach(e=>{
        chat.push(e);
    })
})

msgHandler.addMsgHandle("msg",data=>{
    chat.push(data);
    if(chat.length>30){
        chat.splice(0,1);
    }
    if(viewingchat){
        createChat();
    }else{
        chatEle.setAttribute("unread",true);
    }
})

msgHandler.addMsgHandle("sysmsg",data=>{
    chat.push({system:true,msg:data});
    if(chat.length>30){
        chat.splice(0,1);
    }
    if(viewingchat){
        createChat();
    }else{
        chatEle.setAttribute("unread",true);
    }
})


msgHandler.addMsgHandle("gamereset",()=>{
    initialized=false;
    snakes = [];
    apples = [];
    obstacles = [];
    safezones = [];
    leaderboard = [];
    selfSnake = null;
    deathMenuEle.style.display="none";
    gameresetmenuEle.style.display="flex";
})

msgHandler.addMsgHandle("init",data=>{
    gameresetmenuEle.style.display="none";
    initialized=true;
    apples=data.apples;
    snakes=data.snakes;
    obstacles=data.obstacles;
    safezones=data.safezones;
    spawnCountDownTime=data.spawnCountDownTime;
    fullresetTimeDate=data.frT;

    highscoreScoreEle.innerText=data.hc.score;
    highscoreUsernameEle.innerText=data.hc.usr;

    leaderboard=data.lb;
    if(viewingleaderboard){
        createLeaderBoard();
    }

    gridSize=data.gridSize;
    id=data.id;
    snakes.forEach(s=>{
        if(s.head.nextBody!=null){
            restoreBodyPrevious(s.head);
        }
    });
})

msgHandler.addMsgHandle("snakespawn",data=>{
    if(!initialized){initConnectionError();return;}
    let snake = snakes.find(s=>s.id==data.id);
    if(data.id==id){
        selfSnake=data;
        Camera.x=selfSnake.head.x*Camera.scale-(canvas.width/2);
        Camera.y=selfSnake.head.y*Camera.scale-(canvas.width/2);
    }
    if(snake==null){
        snakes.push(data);
    }else{
        snake.dir=         data.dir;
        snake.state=       data.state;
        snake.eaten=       data.eaten;
        snake.head =       data.head;
        snake.username =   data.username;
        snake.length =     data.length;
    }
})

msgHandler.addMsgHandle("snakechange",data=>{
    if(!initialized){initConnectionError();return;}
    data.forEach((s,i)=>{
        if(s==null||snakes[i]==null)return;
        if(s.id==id){
            selfSnake.dir=s.dir;
            selfSnake.state=s.state;
            selfSnake.eaten=s.eaten;
        }
        snakes[i].dir=s.dir;
        snakes[i].state=s.state;
        snakes[i].eaten=s.eaten;

        updateSnake(snakes[i]);
    })
})

msgHandler.addMsgHandle("snakeremove",data=>{
    if(!initialized){initConnectionError();return;}
    snakes = snakes.filter(s => s.id !== data);
})

msgHandler.addMsgHandle("death",data=>{
    deathMenuEle.style.display="flex";
    deathCauseEle.innerText=data.cause;
})

msgHandler.addMsgHandle("applechange",data=>{
    if(!initialized){initConnectionError();return;}
    let apple = apples.find(a=>a.id==data.id);
    apple.x=data.x;
    apple.y=data.y;
})

msgHandler.addMsgHandle("appleadd",data=>{
    if(!initialized){initConnectionError();return;}
    data.forEach(a=>{
        apples.push(a);
    })
})

msgHandler.addMsgHandle("obstacleadd",data=>{
    if(!initialized){initConnectionError();return;}
    data.forEach(o=>{
        obstacles.push(o);
    })
})

msgHandler.addMsgHandle("obstacleremove",data=>{
    if(!initialized){initConnectionError();return;}
    let i = obstacles.findIndex(o=>o.id==data);
    if(i==-1){
        console.error("tried removing non existing obstacle:"+ data);
        return;
    }
    obstacles.splice(i,1);
})

msgHandler.addMsgHandle("username",data=>{
    snakes.find(s=>s.id==data.id).username=data.username;
})

function initConnectionError(){
    console.error("Connection Setup Error.\n Reload maybe needed, because developer is too lazy to fix.");
}

function getSnakeTail(body){
    if(body.nextBody==null)return body;
    return getSnakeTail(body.nextBody);
}

function moveSnakeBody(body){
    if(body.previousBody==null)return;
    body.x=body.previousBody.x;
    body.y=body.previousBody.y;
    moveSnakeBody(body.previousBody);
}

function addBody(body){
    if(body.nextBody!=null)return;
    body.nextBody={x:body.x,y:body.y,previousBody:body,nextBody:null};
}

function updateSnake(snake){
    if(snake.state=="d")return;

    if(snake.eaten>snake.length){
        snake.length++;
        addBody(getSnakeTail(snake.head));
    }

    moveSnakeBody(getSnakeTail(snake.head));

    snake.head.x+=snake.dir.x;
    snake.head.y+=snake.dir.y;
    if(snake.head.x>gridSize-1){
        snake.head.x=0;
    }else if(snake.head.x<0){
        snake.head.x=gridSize-1;
    }
    if(snake.head.y>gridSize-1){
        snake.head.y=0;
    }else if(snake.head.y<0){
        snake.head.y=gridSize-1;
    }
}

function restoreBodyPrevious(body){
    if(body.nextBody==null)return;
    body.nextBody.previousBody=body;
    restoreBodyPrevious(body.nextBody);
}

function loop(){
    if(!initialized)return;
    update();
    render();
}

function updateRoundTimer(){
    let time = (fullresetTimeDate-Date.now());
    let mins = Math.floor(time/60000);
    roundtimeEle.innerText= Math.floor(mins/60) +":"+mins%60+":"+Math.floor(time/1000)%60;
}

function update(){
    Camera.update();

    if(selfSnake!=null&&selfSnake.state=="it"&&spawnCountdown==-1){
        startSpawnCountDown();
    }
}

async function startSpawnCountDown(){
    for (let i = spawnCountDownTime; i > 0; i--) {
        spawnCountdown=i;
        await waitFor(1);
    }
    spawnCountdown=0;
    await waitFor(1);
    spawnCountdown=-1;

}

function renderBodies(body,altcolor){
    Camera.transformDraw(body.x,body.y);
    if(body.nextBody==null)return;
    ctx.fillStyle=altcolor;
    renderBodies(body.nextBody);
}

function render(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.strokeStyle="black";
    ctx.lineWidth = 2;

    ctx.fillStyle=safeZoneColor;
    if(selfSnake!=null&&(selfSnake.state=="i")){
        safezones.forEach(s => {
            Camera.transformDraw(s.x,s.y,s.size,s.size);
        });
    }

    snakes.forEach(snake => {
        if(snake.state=="d")return;
        if(snake.id==id){
            if(snake.state=="i"||snake.state=="it"){
                ctx.fillStyle=playerGhostSnakeHeadColor;
                renderBodies(snake.head,playerGhostSnakeColor);

                if(spawnCountdown!=-1){
                    let transform = Camera.transform(snake.head.x,snake.head.y);
                    ctx.fillText(spawnCountdown.toString(),transform.x-(ctx.measureText(spawnCountdown.toString()).width/2)+(Camera.scale/2),transform.y-5);
                }
            }else{
                ctx.fillStyle=playerSnakeHeadColor;
                renderBodies(snake.head,playerSnakeColor);
            }
        }else{
            if(snake.state=="i"||snake.state=="it"){
                ctx.fillStyle=ghostSnakeHeadColor;
                renderBodies(snake.head,ghostSnakeColor);
            }else{
                ctx.fillStyle=snakeHeadColor;
                renderBodies(snake.head,snakeColor);
            }
            ctx.fillStyle=snakeHeadColor;
            renderBodies(snake.head,snakeColor);
            let transform = Camera.transform(snake.head.x,snake.head.y);
            ctx.fillText(snake.username,transform.x-(ctx.measureText(snake.username).width/2)+(Camera.scale/2),transform.y-5);
        }
    });

    ctx.fillStyle=appleColor;
    apples.forEach(apple => {
        let transform = Camera.transform(apple.x,apple.y);
        ctx.beginPath();
        ctx.arc(transform.x+transform.w/2,transform.y+transform.w/2,transform.w/2,0,Math.PI*2);
        ctx.fill();
        ctx.stroke();
    });

    ctx.fillStyle=obstacleColor;
    obstacles.forEach(obstacle => {
        Camera.transformDraw(obstacle.x,obstacle.y);
    });

    if(selfSnake==null||selfSnake.state!="i"){
        ctx.fillStyle=obstacleColor;
        ctx.globalAlpha = 0.8;
        safezones.forEach(s => {
            Camera.transformDraw(s.x,s.y,s.size,s.size);
        });
        ctx.globalAlpha = 1;
    }

    {
        let transform = Camera.transform(0,0,gridSize,gridSize);    
        ctx.strokeStyle=obstacleColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(transform.x,transform.y,transform.w,transform.h);
        ctx.lineWidth = 1;
    }
}

async function waitFor(seconds){
    return new Promise((res)=>{
        setTimeout(()=>{
            res();
        },seconds*1000);
    });
}

function remainingCheck(self,remainingMax){
    let remaining =(remainingMax-self.value.length);
    if(remaining<0){
        self.value=self.value.slice(0,remainingMax);
        return;
    }
    self.parentElement.setAttribute("remaining",remaining.toString());
}

usernameEle.addEventListener("keydown",e=>{
    if(e.key=="Enter"){
        startClick();
    }
})

chatInputEle.addEventListener("keydown",e=>{
    e.stopPropagation();

    if(e.key=="Enter"){
        if(chatInputEle.value.trim().length!=0){
            sendMessage("msg",chatInputEle.value);
            chatInputEle.parentElement.setAttribute("remaining",32);
            chatInputEle.value="";
        }
    }
})

function openMenu(id){
    document.getElementById(id).style.display="flex";
}

function closeMenu(id){
    document.getElementById(id).style.display="none";
}

function startClick(){
    if(usernameEle.value.trim().length===0){
        usernameEle.value="";
        alert("please enter a username");
        return;
    };
    startMenuEle.style.display="none";
    ws = new WebSocket(wsurl);

    ws.onerror=()=>{
        connectionerrorEle.style.display = "block";
        playUIEle.style.display="none";
        deathMenuEle.style.display="block";
    }

    ws.onopen=()=>{
        setInterval(loop,16);
        setInterval(updateRoundTimer,1000);
        playUIEle.style.display="block";
    }

    ws.addEventListener("open", () =>{
        sendMessage("username",usernameEle.value);
    });
    
    ws.addEventListener('message', function (event) {
        msgHandler.handle(event.data);
    });

    var keysdown = {};
    addEventListener('keydown', e=>{
        if(!(e.key in keysdown)) {
            keysdown[e.key] = true;
            if(selfSnake==null||selfSnake.state=="d")return;
            switch(e.key){
                case "w":
                    sendMessage("input","up");
                break;
                case "s":
                    sendMessage("input","down");
                break;
                case "a":
                    sendMessage("input","left");
                break;
                case "d":
                    sendMessage("input","right");
                break;
                // case " ":
                //     sendMessage("input","shoot");
                // break;
            }
        }
    });
    addEventListener('keyup', e=>{
        delete keysdown[e.key];
    });
    if(navigator.userAgent.toLowerCase().match(/mobile/i)) { 
            canvas.addEventListener("touchstart",(e)=>{
            var br = canvas.getBoundingClientRect();
            var x = e.touches[0].clientX - br.left;
            var y = e.touches[0].clientY - br.top;
            if(x>y){
                if((x-canvas.clientWidth)*-1>y){
                    sendMessage("input","up");
                    //top
                }else{
                    sendMessage("input","right");
                    //right
                }
            }else{
                if(x>(y-canvas.clientHeight)*-1){
                    sendMessage("input","down");
                    //bottom
                }else{
                    sendMessage("input","left");
                    //left
                }
            }
        });
    }
}

function restartClick(){
    sendMessage("restart",null);
    deathMenuEle.style.display="none";
}

function reloadClick(){
    location.reload(1);
}

getHighscores();
function getHighscores(){
    fetch(httpurl+"/history")
    .then(res=>{
        if(!res.ok){
            throw new Error("Error while fetching history data:" + res.statusText);
        }
        return res.json();
    }).then(e=>{
        displayHighscores(e);
    }).catch(err=>{
        console.error(err);
    })

    fetch(httpurl+"/highscore")
    .then(res=>{
        if(!res.ok){
            throw new Error("Error while fetching history data:" + res.statusText);
        }
        return res.json();
    }).then(e=>{
        document.getElementById("todayHighscorePlayer").innerText=e.usr;
        document.getElementById("todayHighscoreScore").innerText=e.score;
    }).catch(err=>{
        console.error(err);
    })
}

function displayHighscores(data){
    console.log(data);
    data.forEach(e => {
        let tr = document.createElement("tr");
        let userspan = document.createElement("td");
        userspan.innerText=e.data.usr;
        let scorespan = document.createElement("td");
        scorespan.innerText=e.data.score;
        let datespan = document.createElement("td");
        let date = new Date(e.date);
        datespan.innerText=date.getDate()+"."+(date.getMonth()+1);
        tr.appendChild(userspan);
        tr.appendChild(scorespan);
        tr.appendChild(datespan);
        highscoresEle.appendChild(tr);
    });
}