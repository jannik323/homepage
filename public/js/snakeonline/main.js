let ws;

let canvas = document.getElementById("canvas");
canvas.width=500;
canvas.height=500;
let ctx = canvas.getContext("2d");

const PORT = 44444;
// const IP = "127.0.0.1";
const IP = "206.189.102.50";

let username = document.getElementById("username");
let startButton = document.getElementById("start");
let restartButton = document.getElementById("restart");
let startMenu = document.getElementById("startmenu");
let deathmenu = document.getElementById("deathmenu");
let deathCause = document.getElementById("deathCause");

let snakes = [];
let apples = [];
let obstacles = [];
let safezones = [];

let selfSnake;
let gridSize=10;
let id;
let initialized = false;

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

msgHandler.addMsgHandle("msg",data=>{
    console.log(data);
})

msgHandler.addMsgHandle("init",data=>{
    apples=data.apples;
    snakes=data.snakes;
    obstacles=data.obstacles;
    safezones=data.safezones;

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
    if(snake==null){
        if(data.id==id){
            selfSnake=data;
        }
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
    deathmenu.style.display="flex";
    deathCause.innerText=data.cause;
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
}

function renderBodies(body,altcolor){
    Camera.transformDraw(body.x,body.y);
    if(body.nextBody==null)return;
    ctx.fillStyle=altcolor;
    renderBodies(body.nextBody);
}

function render(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle="#b8dced";
    safezones.forEach(s => {
        Camera.transformDraw(s.x,s.y,s.size,s.size);
    });

    snakes.forEach(snake => {
        if(snake.state=="d")return;
        if(snake.id==id){
            ctx.fillStyle="#33632b";
            renderBodies(snake.head,"#4b8c48");
        }else{
            ctx.fillStyle="#634c2b";
            renderBodies(snake.head,"#8c7048");
            let transform = Camera.transform(snake.head.x,snake.head.y);
            ctx.fillText(snake.username,transform.x-(ctx.measureText(snake.username).width/2)+(Camera.scale/2),transform.y-5);
        }
    });

    ctx.fillStyle="#a03030";
    apples.forEach(apple => {
        Camera.transformDraw(apple.x,apple.y);
    });

    ctx.fillStyle="#0a0a0f";
    obstacles.forEach(obstacle => {
        Camera.transformDraw(obstacle.x,obstacle.y);
    });

    {
        let transform = Camera.transform(0,0,gridSize,gridSize);    
        ctx.strokeStyle="#0a0a0f";
        ctx.lineWidth = 2;
        ctx.strokeRect(transform.x,transform.y,transform.w,transform.h);
        ctx.lineWidth = 1;
    }
}


startButton.onclick=()=>{
    if(username.value.trim().length===0){
        username.value="";
        return;
    };
    startButton.onclick=null;
    startMenu.style.display="none";
    ws = new WebSocket("wss://jannik323.software:"+PORT);

    setInterval(loop,16);

    ws.onerror=()=>{
        alert("Unable to connect to host.\nTry again later!");
        location.reload(1);
    }

    ws.addEventListener("open", () =>{
        sendMessage("username",username.value);
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
                    if(selfSnake.dir.y==1&&selfSnake.length>0)break;
                    sendMessage("move","up");
                break;
                case "s":
                    if(selfSnake.dir.y==-1&&selfSnake.length>0)break;
                    sendMessage("move","down");
                break;
                case "a":
                    if(selfSnake.dir.x==1&&selfSnake.length>0)break;
                    sendMessage("move","left");
                break;
                case "d":
                    if(selfSnake.dir.x==-1&&selfSnake.length>0)break;
                    sendMessage("move","right");
                break;
            }
        }
    });
    addEventListener('keyup', e=>{
        delete keysdown[e.key];
    });
}

restartButton.onclick=()=>{
    sendMessage("restart",{});
    deathmenu.style.display="none";
}
