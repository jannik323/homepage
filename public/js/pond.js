
let moveableContainers=[];

let globalforce = {x:0,y:0};
let moveableRoot = document.getElementById("moveableRoot");

let lastele = {
    element:moveableRoot,
    xa:0,
    ya:0,
    lastele:null,
    children:[],
};
lastele.element.moveable=lastele;

function initMoveable(el,lastele=null){
    let moveable  = {
        x:el.offsetLeft,
        y:el.offsetTop,
        startx:0,
        starty:0,
        element:el,
        xa:0,
        ya:0,
        lastele:lastele,
        children:[],
    }
    moveable.element.moveable = moveable;
    if(moveable.element.parentNode.moveable!=null){
        moveable.element.parentNode.moveable.children.push(moveable);
    }

    let mousemove = e=>{
        if(!(e.buttons&1))return;
        moveable.xa+=(e.x-(moveable.x+moveable.startx))/50;
        moveable.ya+=(e.y-(moveable.y+moveable.starty))/50;
    }
    el.addEventListener("mousedown",e=>{
        moveable.element.setAttribute("held","true");
        moveable.startx = e.x-moveable.x;
        moveable.starty = e.y-moveable.y;
        removeEventListener("mousemove",mousemove);
        addEventListener("mousemove",mousemove);
        addEventListener("mouseup",()=>{
            removeEventListener("mousemove",mousemove);
            moveable.element.removeAttribute("held");
        },{once:true});
        e.stopPropagation();
    })
    return moveable;
}

{
let moveables = [];
[...document.getElementsByClassName("moveable")].forEach(el=>{
    let moveable = initMoveable(el,lastele);
    moveables.push(moveable);
    lastele=moveable;
})

moveableContainers = moveables.map(e=>{
    if(e.children.length<1)return null;
    return e.children;
}).filter(e=>e!=null);
moveableContainers.push(moveableRoot.moveable.children);
}


revealMoveable();
function revealMoveable(){
    if(lastele.lastele==null)return;
    lastele.element.style.opacity="0.8";
    lastele = lastele.lastele;
    setInterval(revealMoveable,50);
}

setInterval(()=>{
    moveableContainers.forEach(con=>{
        for(let i = 0;i<con.length;i++){
            let e = con[i];

            if(globalforce.x!=0){
                e.xa+=globalforce.x;
            }
            if(globalforce.y!=0){
                e.ya+=globalforce.y;
            }
            
            e.xa *=0.95;
            e.ya *=0.95;
            e.x+=e.xa;
            e.y+=e.ya;
            
            if(e.x<0){
                e.x=0;
                e.element.parentElement.moveable.xa+=e.xa/2;
                e.xa*=-0.5;
            }else if(e.x+e.element.clientWidth>e.element.parentElement.clientWidth){
                e.x=e.element.parentElement.clientWidth-e.element.clientWidth;
                e.element.parentElement.moveable.xa+=e.xa/2;
                e.xa*=-0.5;
            }
    
            if(e.y<0){
                e.y=0;
                e.element.parentElement.moveable.ya+=e.ya/2;
                e.ya*=-0.5;
            }else if(e.y+e.element.clientHeight>e.element.parentElement.clientHeight){
                e.y=e.element.parentElement.clientHeight-e.element.clientHeight;
                e.element.parentElement.moveable.ya+=e.ya/2;
                e.ya*=-0.5;
            }
    
            e.element.style.left = e.x+"px";
            e.element.style.top = e.y+"px";

            if(con.length>1){
                for (let j = 0; j < con.length; j++) {
                    if(i==j)continue;
                    collision(e,con[j]);
                }
            }
        };
    })
    
},10);

function track(self){
    self.onclick=null;
    self.innerText= "I know where you are 😈";
    self.title = "Just as a note: \nNo actual personal data is being collected :)"
    addEventListener("mousemove",e=>{
        self.innerText="I know where you are 😈";
        self.innerText+= "\n x: "+e.clientX+", y:"+e.clientY;
    })
}

function changeGlobalForce(x,y=0){
    globalforce.x=x;
    globalforce.y=y;
}

function collision(moveable1,moveable2){
    let topDist = (moveable1.y+moveable1.element.clientHeight) - (moveable2.y);
    let btmDist = (moveable2.y+moveable2.element.clientHeight) - (moveable1.y) ;
    let lftDist = (moveable1.x+moveable1.element.clientWidth) - (moveable2.x);
    let rgtDist = (moveable2.x+moveable2.element.clientWidth) - (moveable1.x) ;
    
    if(!(lftDist>0&&rgtDist>0)||!(topDist>0&&btmDist>0))return;
    
    
    if( ((topDist<btmDist)?topDist:btmDist)/moveable2.element.clientHeight < ((lftDist<rgtDist)?lftDist:rgtDist)/moveable2.element.clientWidth){
        if(topDist<btmDist){
            moveable1.y= moveable2.y - moveable1.element.clientHeight;
            moveable2.ya +=moveable1.ya/2;
            moveable1.ya *= -0.5;
        }else{
            moveable1.y= moveable2.y + moveable2.element.clientHeight;
            moveable2.ya +=moveable1.ya/2;
            moveable1.ya *= -0.5;
        }
    }else{
        if(lftDist<rgtDist){
            moveable1.x= moveable2.x - moveable1.element.clientWidth;
            moveable2.xa +=moveable1.xa/2;
            moveable1.xa *= -0.5;
        }else{
            moveable1.x= moveable2.x + moveable2.element.clientWidth;
            moveable2.xa +=moveable1.xa/2;
            moveable1.xa *= -0.5;
        }
    }
}