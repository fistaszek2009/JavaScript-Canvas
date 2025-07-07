
// addEventListener("mousemove", (e) => {
//   cursor.x = e.clientX;
//   cursor.y = e.clientY;
// });

// addEventListener(
//   "touchmove",
//   (e) => {
//     e.preventDefault();
//     cursor.x = e.touches[0].clientX;
//     cursor.y = e.touches[0].clientY;
//   },
//   { passive: false },
// );

// function generateColor() {
//   let hexSet = "0123456789ABCDEF";
//   let finalHexString = "#";
//   for (let i = 0; i < 6; i++) {
//     finalHexString += hexSet[Math.ceil(Math.random() * 15)];
//   }
//   return finalHexString;
// }


const $ = sel=>document.querySelector(sel)
const $$ = sel=>document.querySelectorAll(sel)

const canvas = $('canvas')
const ctx = canvas.getContext('2d');

const PARTICLES_AMOUNT = 1;
const circleMaxRadius = 200;
const particles = [];

const cursor = {
  x: innerWidth/2,
  y: innerHeight/2
}

function generateParticles(){
  for(let i = 0; i<PARTICLES_AMOUNT;i++){
    const r = Math.random()*circleMaxRadius;
    const br = Math.random()* 2*Math.PI
    particles.push(new Particle(
      cursor.x + Math.cos(br) * r,
      cursor.y + Math.sin(br)* r,
      5,
      'red',
      0.02,
      br,
      r
    ))
  }
}

function Particle(x,y,width,color,rotateSpeed,beginRotation,radius){
  this.x = x;
  this.y = y;
  this.width = width
  this.color = color
  this.rotateSpeed = rotateSpeed

  this.r = radius;
  this.rotation = beginRotation

  this.rotate = _=>{
    const ls = {
      x : this.x,
      y : this.y,
    }
    
    this.rotation += this.rotateSpeed
    this.x = cursor.x + Math.cos(this.rotation) * this.r;
    this.y = cursor.y + Math.sin(this .rotation) * this.r;

    ctx.lineWidth = this.width
    ctx.strokeStyle = this.color
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(ls.x,ls.y)
    ctx.lineTo(this.x,this.y)
    ctx.stroke()
  }

}

function setSize(){
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight;
}

function run(){
  ctx.fillStyle = 'rgb(0 0 0 / 5%)'
  ctx.fillRect(0,0,canvas.width,canvas.height)

  particles.forEach(particle => particle.rotate())
  requestAnimationFrame(run)
}

setSize()
generateParticles();
run()
window.addEventListener('resize',setSize)

canvas.addEventListener('click', event => {

  const dx = event.clientX - cursor.x;
  const dy = event.clientY - cursor.y;


  const r = Math.hypot(dx, dy);


  let br = Math.atan2(dy, dx);
  if (br < 0) br += 2 * Math.PI;

  particles.push(new Particle(
    event.clientX,
    event.clientY,
    5,
    'red',
    0.02,
    br,
    r
  ));
});

document.addEventListener('keydown',event=>{
  if(event.code = 'Space'){
    ctx.fillStyle = 'black'
    ctx.fillRect(0,0,canvas.width,canvas.height)
    particles.length = 0;
    generateParticles(1)
  }
})