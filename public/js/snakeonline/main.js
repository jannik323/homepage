let ws;

let canvas = document.getElementById("canvas");
canvas.width=500;
canvas.height=500;
let ctx = canvas.getContext("2d");

const PORT = 44444;

let playUIEle = document.getElementById("playUI");

let usernameEle = document.getElementById("username");
let startMenuEle = document.getElementById("startmenu");
let deathMenuEle = document.getElementById("deathmenu");
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

let viewingleaderboard = false;
let viewingchat = false;


const playerSnakeColor="#33632b";
const playerSnakeHeadColor=tColor(playerSnakeColor,-20);
const snakeColor="#634c2b";
const snakeHeadColor=tColor(snakeColor,-20);
const playerGhostSnakeColor="#575e56";
const playerGhostSnakeHeadColor=tColor(playerGhostSnakeColor,-20);
const ghostSnakeColor="#7a7a7a";
const ghostSnakeHeadColor=tColor(ghostSnakeColor,-20);
const obstacleColor="#0a0a0f";
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

function toggleLeaderboardShow(){
    if(leaderboardEle.getAttribute("open")=="true"){
        leaderboardEle.setAttribute("open","false");
        leaderboardSpanEle.style.transform = "rotate(0deg)";
        viewingleaderboard=false;
        leaderboardListEle.style.display="none";
    }else{
        leaderboardEle.setAttribute("open","true");
        leaderboardSpanEle.style.transform = "rotate(90deg)";
        viewingleaderboard=true;
        leaderboardListEle.style.display="flex";
        createLeaderBoard();
    }
}

function toggleChatShow(){
    if(chatEle.getAttribute("open")=="true"){
        chatEle.setAttribute("open","false");
        chatSpanEle.style.transform = "rotate(0deg)";
        viewingchat=false;
        chatListEle.style.display="none";
        chatInputEle.parentElement.parentElement.style.display="none";
    }else{
        chatEle.setAttribute("open","true");
        chatSpanEle.style.transform = "rotate(90deg)";
        viewingchat=true;
        chatListEle.style.display="flex";
        chatInputEle.parentElement.parentElement.style.display="flex";
        createChat();
    }
}

function createChat(){
    chatListEle.innerHTML="";
    if(chat.length==0){
        chatListEle.style.display="none"
        return;
    }else{
        chatListEle.style.display="flex"
    }
    chat.forEach(e=>{
        let div = document.createElement("div");
        let usernamespan = document.createElement("span");
        usernamespan.innerText=e.usr;
        let colonspan = document.createElement("span");
        colonspan.innerText=":";
        let msgspan = document.createElement("span");
        msgspan.innerText=e.msg;
        div.appendChild(usernamespan);
        div.appendChild(colonspan);
        div.appendChild(msgspan);
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

msgHandler.addMsgHandle("msg",data=>{
    chat.push(data);
    if(chat.length>30){
        chat.splice(0,1);
    }
    if(viewingchat){
        createChat();
    }
})

msgHandler.addMsgHandle("init",data=>{
    apples=data.apples;
    snakes=data.snakes;
    obstacles=data.obstacles;
    safezones=data.safezones;
    spawnCountDownTime=data.spawnCountDownTime;

    gridSize=data.gridSize;
    id=data.id;
    snakes.forEach(s=>{
        if(s.head.nextBody!=null){
            restoreBodyPrevious(s.head);
        }
    });
})

msgHandler.addMsgHandle("snakespawn",data=>{
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
    snakes = snakes.filter(s => s.id !== data);
})

msgHandler.addMsgHandle("death",data=>{
    deathMenuEle.style.display="flex";
    deathCauseEle.innerText=data.cause;
})

msgHandler.addMsgHandle("applechange",data=>{
    let apple = apples.find(a=>a.id==data.id);
    apple.x=data.x;
    apple.y=data.y;
})

msgHandler.addMsgHandle("appleadd",data=>{
    data.forEach(a=>{
        apples.push(a);
    })
})

msgHandler.addMsgHandle("obstacleadd",data=>{
    data.forEach(o=>{
        obstacles.push(o);
    })
})

msgHandler.addMsgHandle("obstacleremove",data=>{
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
    update();
    render();
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

function startClick(){
    if(usernameEle.value.trim().length===0){
        usernameEle.value="";
        alert("please enter a username");
        return;
    };
    startMenuEle.style.display="none";
    ws = new WebSocket("wss://jannik323.software:"+PORT);
    // ws = new WebSocket("ws://127.0.0.1:"+PORT);

    ws.onerror=()=>{
        connectionerrorEle.style.display = "block";
        playUIEle.style.display="none";
    }

    ws.onopen=()=>{
        setInterval(loop,16);
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
}

function restartClick(){
    sendMessage("restart",null);
    deathmenu.style.display="none";
}

function reloadClick(){
    location.reload(1);
}