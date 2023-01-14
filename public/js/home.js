// let webpageVisitsEle = document.getElementById("webpageVisits");
// if(webpageVisitsEle!=null){
//     fetch("/data/stats").then(response=>{
//         if (!response.ok) {
//             error(response.status);
//             throw new Error("Request failed with status "+response.status);
//         }
//         return response.json();
//     }).then(data=>{
//         webpageVisitsEle.innerText=data.pageVisits;
//     })
//     .catch(errordata=>console.error(errordata));
// }

// let discordLogin = document.getElementById("discordlogin");
// if(getCookie("discordToken")!=null){
//     fetch("/data/username").then(response=>{
//         if (!response.ok) {
//             console.error(response.status);
//             throw new Error("Request failed with status "+response.status);
//         }
//         return response.json();
//     }).then(data=>{
//         discordLogin.innerText="Hi "+ data+ "!";
//     }).catch(errordata=>console.error(errordata));
// }

fetch("/data/projects?showcased=true").then(response=>{
    if (!response.ok) {
        console.error(response.status);
        throw new Error("Request failed with status "+response.status);
    }
    return response.json();
}).then(data=>{
    shuffleArray(data);

    let gamesLinksElement = document.getElementById("gamesLinks");
    let toolsLinksElement = document.getElementById("toolsLinks");
    let otherLinksElement = document.getElementById("otherLinks");

    let linkElementTemplate = document.getElementById("linkTemplate").content.querySelector("div");

    let gamesNewlinkpos = 80;
    let toolsNewlinkpos = 80;
    let otherNewlinkpos = 80;

    let gCounter = 3;
    let tCounter = 3;
    let oCounter = 3;

    for (let i = 0; i < data.length; i++) {
        switch(data[i].category){
            case "games":
                if(gCounter<=0)continue;
                gCounter--;
                break;
                case "tools":
                    if(tCounter<=0)continue;
                tCounter--;
                break;
                case "other":
                if(oCounter<=0)continue;
                oCounter--;
                break;
        }
        let element = linkElementTemplate.cloneNode(true);
        if(data[i].showcased){
            element.classList.add("star");
        }
        element.style.opacity="0.8";
        element.style.maxWidth="55%";
        element.querySelector("a").innerText=data[i].name;
        element.querySelector("a").style.width="100%";
        element.querySelector("a").href="/projects/"+data[i].urlName;
        switch(data[i].category){
            case "games":
                gamesLinksElement.appendChild(element);
                initMoveable(element);
                element.moveable.y = gamesNewlinkpos;
                gamesNewlinkpos+=element.clientHeight+20;
                break;
            case "tools":
                toolsLinksElement.appendChild(element);
                initMoveable(element);
                element.moveable.y = toolsNewlinkpos;
                toolsNewlinkpos+=element.clientHeight+20;
                break;
            case "other":
                otherLinksElement.appendChild(element);
                initMoveable(element);
                element.moveable.y = otherNewlinkpos;
                otherNewlinkpos+=element.clientHeight+20;
                break;
        }
    }
})
.catch(errordata=>console.error(errordata));

function track(self){
    self.onclick=null;
    self.innerText= "I know where you are 😈";
    self.title = "Just as a note: \nNo actual personal data is being collected :)"
    addEventListener("mousemove",e=>{
        self.innerText="I know where you are 😈";
        self.innerText+= "\n x: "+e.clientX+", y:"+e.clientY;
    })
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
        }
    }
    return "";
}

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}