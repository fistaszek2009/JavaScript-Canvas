
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const canvas = $('#canvas');
const ctx = canvas.getContext('2d')


const smoothed = $('#smoothed');
const smoothedCtx = smoothed.getContext('2d');
smoothedCtx.imageSmoothingEnabled = true;

const pixelated = $('#pixelated')
const pixelatedCtx = pixelated.getContext('2d');
pixelatedCtx.imageSmoothingEnabled = false;

const img = new Image();
img.crossOrigin = "anonymous";
img.src = "../images/z1.jpg";
img.onload = ()=>{ctx.drawImage(img,0,0,canvas.width,canvas.height)}

let zoomScalee = Math.min(30,Math.floor(Math.min(img.height/3,img.width/3)));

canvas.addEventListener('mousemove',event=>{
  handelEvent(event)
})

function handelEvent(event){
  const bounding = canvas.getBoundingClientRect()

  const x = event.clientX - bounding.x;
  const y = event.clientY - bounding.y;

  const xImg = x * img.width / canvas.width;
  const yImg = y * img.height / canvas.height;

  zoom(smoothed,smoothedCtx,xImg,yImg);
  zoom(pixelated,pixelatedCtx,xImg,yImg);
}

function zoom(destination,ctx,x,y){
  ctx.drawImage(
    img,
    Math.min(Math.max(x-zoomScalee,0),img.width-2*zoomScalee),
    Math.min(Math.max(y-zoomScalee,0),img.height-2*zoomScalee),
    2*zoomScalee,2*zoomScalee,
    0,0,
    destination.width,destination.height
  )
}

canvas.addEventListener('click',event=>{
  zoomScalee--;
  if(zoomScalee<=0) zoomScalee = 0;
  console.log(zoomScalee)
  handelEvent(event);
})

canvas.addEventListener('contextmenu',event=>{
  zoomScalee++;
  if(zoomScalee>=img.height/2 || zoomScalee>=img.width/2) zoomScalee = Math.floor(Math.min(img.height/2,img.width/2))
  handelEvent(event);
})

smoothed.addEventListener('dblclick',_=>{
  const url = smoothed.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = 'zoomed.png';
  a.click();
})