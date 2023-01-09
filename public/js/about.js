let myBirthday = new Date(2001,7,19);
let ageElement = document.getElementById("age");
updateAge();        
setInterval(updateAge,3000)
function updateAge(){
    ageElement.innerText="I am "+  ((Date.now() - myBirthday.getTime())/31556952000).toFixed(7) + " years old";
}

function createBox(self){
    let element = document.createElement("div");
    element.classList.add("moveable");
    element.ondragstart = ()=>false;
    element.ondrop = ()=>false;
    element.style.opacity="0.8";
    moveableRoot.appendChild(element);
    initMoveable(element);
    element.moveable.x = self.offsetLeft+25+(Math.random()*25);
    element.moveable.y = self.offsetTop-60+(Math.random()*25);
}