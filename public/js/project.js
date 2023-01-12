let projectName = document.location.pathname.split("/")[2];
fetch("/data/"+projectName+".json").then(response=>{
    if (!response.ok) {
        alert("It seems like this project could not be found. Try again later.");
        location.replace("/");
        throw new Error("Request failed with status "+response.status);
    }
    return response.json();
}).then(data=>{
    let projectNameElement =  document.getElementById("projectName");
    projectNameElement.innerText=data.name;
    document.title = "Project: "+data.name;

    let projectStateElement =  document.getElementById("projectState");
    projectStateElement.innerText=data.state;
    switch(data.state){
        case "finished":
            projectStateElement.style.color="#5ac95a";
            break;
        case "never finished💀":
            projectStateElement.style.color="red";
            break;
        case "paused":
        case "discontinued":
        case "lost interest":
            projectStateElement.style.color="#bcac7a";
            break;
        case "in progress":
            projectStateElement.style.color="#8495ef";
            break;
    }

    let projectDescriptionElement =  document.getElementById("projectDescription");
    projectDescriptionElement.innerText=data.description;

    let techElementTemplate = document.getElementById("techTemplate").content.querySelector("div");
    let projectTechElement = document.getElementById("projectTech");

    for (let i = 0; i < data.tech.length; i++) {
        let element = techElementTemplate.cloneNode(true);
        element.querySelector("img").src="/imgs/"+data.tech[i]+".svg";
        element.querySelector("img").alt=data.tech[i];
        element.title = data.tech[i];
        projectTechElement.appendChild(element);
    }

    let projectLinksElement = document.getElementById("projectLinks");
    projectLinksElement.moveable.y=(projectDescriptionElement.parentNode.clientHeight+projectDescriptionElement.parentNode.offsetTop+40);

    let projectLinkElementTemplate = document.getElementById("linkTemplate").content.querySelector("div");

    let newlinkpos = 20;
    for (let i = 0; i < data.links.length; i++) {
        let element = projectLinkElementTemplate.cloneNode(true);
        element.style.opacity="0.8";
        element.querySelector("a").innerText=data.links[i].name;
        element.querySelector("a").href=data.links[i].url;
        projectLinksElement.appendChild(element);
        initMoveable(element);
        element.moveable.x = newlinkpos;
        newlinkpos+=element.clientWidth+20;
    }


    if(projectLinksElement.childElementCount>2){
        moveableContainers.push(projectLinksElement.moveable.children);
    }else{
        projectLinksElement.remove();
        moveableRoot.moveable.children.pop(projectLinksElement.moveable);
    }
    projectLinksElement.style.width = newlinkpos+"px";


    let imgElementTemplate = document.getElementById("imgTemplate").content.querySelector("div");

    let newimgposx = projectNameElement.parentNode.clientWidth+projectNameElement.parentNode.offsetLeft;
    if(projectDescriptionElement.parentNode.clientWidth+projectDescriptionElement.parentNode.offsetLeft>newimgposx){
        newimgposx = projectDescriptionElement.parentNode.clientWidth+projectDescriptionElement.parentNode.offsetLeft+20;
    }else{
        newimgposx+=20;
    }

    let newimgposy = 20;
    let imgCount = 0;
    addImageElement();
    function addImageElement(){
        if(imgCount>data.imgs.length-1)return;

        let element = imgElementTemplate.cloneNode(true);
        element.style.opacity="0.8";
        element.querySelector("img").src=data.imgs[imgCount];
        moveableRoot.appendChild(element);
        initMoveable(element);
        element.moveable.x = newimgposx;
        element.moveable.y = newimgposy;
        element.querySelector("img").onload=()=>{
            newimgposy+=element.clientHeight+20;
            if(newimgposy>800){
                moveableRoot.style.height=(newimgposy+200)+"px";
            }
            imgCount++;
            addImageElement();
        }
    }
    
})
.catch(errordata=>console.error(errordata));

