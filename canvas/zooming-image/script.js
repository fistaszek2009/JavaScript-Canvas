
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const canvas = $('#canvas');
const ctx = canvas.getContext('2d')

let zoomScalee = 20

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
  handelEvent(event);
})

canvas.addEventListener('contextmenu',event=>{
  zoomScalee++;
  handelEvent(event);
})

smoothed.addEventListener('dblclick',_=>{
  const url = smoothed.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = 'zoomed.png';
  a.click();
})













































//   const zoom = (ctx, x, y) => {
//     ctx.drawImage(
//       canvas,
//       Math.min(Math.max(0, x - 5), img.width - 10),
//       Math.min(Math.max(0, y - 5), img.height - 10),
//       10,
//       10,
//       0,
//       0,
//       300,
//       300,
//     );
//   };
