

let canvas = document.getElementById("canvas");

canvas.width=500;
canvas.height=500;

let ctx = canvas.getContext("2D");


var socket = io("wss://localhost:3000");


// socket.on("connect", () => {
    
//   });