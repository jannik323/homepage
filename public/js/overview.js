let categoryName = document.location.pathname.split("/")[2];
document.title = "Overview: "+categoryName;
document.getElementById("overviewTitle").innerText =categoryName;

fetch("/data/projects?category="+categoryName).then(response=>{
    if (!response.ok) {
        console.error(response.status);
        throw new Error("Request failed with status "+response.status);
    }
    return response.json();
}).then(data=>{

    let gameLinksElement = document.getElementById("gameLinks");

    let gameLinkElementTemplate = document.getElementById("gameLinkTemplate").content.querySelector("div");

    let newlinkpos = 20;

    for (let i = 0; i < data.length; i++) {
        let element = gameLinkElementTemplate.cloneNode(true);
        if(data[i].showcased){
            element.classList.add("star");
        }
        element.style.opacity="0.8";
        element.querySelector("a").innerText=data[i].name;
        element.querySelector("a").href="/projects/"+data[i].urlName;
        gameLinksElement.appendChild(element);
        initMoveable(element);
        element.moveable.y = newlinkpos;
        newlinkpos+=element.clientHeight+20;

        element.addEventListener("mouseover",e=>{
            console.log(data[i].name);
        },{once:true});
    }

    moveableContainers.push(gameLinksElement.moveable.children);
    gameLinksElement.style.height = (newlinkpos)+"px";

    if(gameLinksElement.clientHeight>700){
        document.getElementById("moveableRoot").style.height=(gameLinksElement.clientHeight+200)+"px";
    }
})
.catch(errordata=>console.error(errordata));