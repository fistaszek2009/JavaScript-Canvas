const $ = (sel) => document.querySelector(sel)
const $$ = (sel) => [...document.querySelectorAll(sel)]

const canvas = $("canvas");
const ctx = canvas.getContext("2d");

let borderPaddingX = 30,borderPaddingY=15;
let ballRadius =30;
let borderWidth = 2, borderOffset = 0;

intro();

function intro(){
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";
    ctx.fillStyle = "blue"
    ctx.fillRect(0,0,canvas.width,canvas.height)
    resize()
    animateBorder();
    ball(borderPaddingX+ballRadius+borderWidth,borderPaddingY+ballRadius+borderWidth)
    setTimeout(intro,60);
}

function resize(){
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth
}

function border(){
    ctx.clearRect(borderPaddingX-borderWidth-1,borderPaddingY-borderWidth-1,(canvas.width-2*borderPaddingX)+borderWidth+3,(canvas.height-2*borderPaddingY)+borderWidth+3);
    ctx.strokeStyle = "red";
    ctx.lineWidth = borderWidth;
    ctx.setLineDash([7,3]);
    ctx.lineDashOffset = -borderOffset;
    ctx.strokeRect(borderPaddingX,borderPaddingY,canvas.width-2*borderPaddingX,canvas.height-2*borderPaddingY);
}

function animateBorder(){
    borderOffset= ++borderOffset%10;
    border();
}

function ball(x,y){
    ctx.beginPath();
    ctx.arc(x,y,ballRadius,0,2*Math.PI)
    ctx.fillStyle="red"
    ctx.strokeStyle="red"
    ctx.lineWidth ="0"
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;
    ctx.shadowBlur = 2;
    ctx.shadowColor = "rgb(0 0 0 / 50%)"
    ctx.fill();
    ctx.shadowColor = "rgb(0 0 0 / 0%)"
}

window.addEventListener("resize",()=>{intro()})

