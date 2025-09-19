
//     // Obsługa przewijania myszką
//     canvas.addEventListener("wheel", (e) => {
//         e.preventDefault(); // zablokuj przewijanie strony
//         x -= e.deltaY * 0.5; // deltaY (pionowa) steruje przesuwaniem poziomym
//     });


const $ = (sel)=> document.querySelector(sel)
const $$ = (sel)=> [...document.querySelectorAll(sel)]

const canvas = $('canvas');
const ctx = canvas.getContext('2d');

const img = new Image();
img.src = "Capitan_Meadows,_Yosemite_National_Park.jpg";

//controls
let x = 0,y=0;
const dx = 0.75;
const speed = 30
const offsetX = 200

img.onload = _=>{
  canvas.width = img.width - offsetX
 setInterval(draw,speed)
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height)

  ctx.drawImage(img,x,y,img.width,img.height)
  if(x+img.width<canvas.width) ctx.drawImage(img,x+img.width,y,img.width,img.height)
  if(x>0) ctx.drawImage(img,x-img.width,y,img.width,img.height)

  x+=dx
  if(x > img.width) x -= img.width
  if(x < -img.width) x += img.width
}

canvas.addEventListener("wheel",(e)=>{
  console.log(e)
  e.preventDefault();
  x -= e.deltaY * 0.5
})