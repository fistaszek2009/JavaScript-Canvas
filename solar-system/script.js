const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const canvas = $("canvas");
const ctx = canvas.getContext("2d");
const inputs = $$('input')

const planets = [
  { name: "Merkury", radius: 4, distance: 30, color: "gray", period: 88 },
  { name: "Wenus", radius: 7, distance: 50, color: "orange", period: 225 },
  { name: "Ziemia", radius: 8, distance: 70, color: "green", period: 365 },
  { name: "Mars", radius: 6, distance: 100, color: "red", period: 687 },
  { name: "Jowisz", radius: 20, distance: 140, color: "orange", period: 4380 },
  { name: "Saturn", radius: 17, distance: 180, color: "goldenrod", period: 10585 },
  { name: "Uran", radius: 12, distance: 220, color: "lightblue", period: 30660 },
  { name: "Neptun", radius: 11, distance: 260, color: "blue", period: 60152 }
];
const moon = {radius: 1.5, distance: 10, color: "lightgrey", period: 27.3}
const sun =  {radius: 30, color: "yellow"};

const stars = [];

const controls={
  STARS_NUM : 250,
  distanceScale : 0.9,
  sizeScale : 0.8,
  TIME_MULTIPLIER : 1000000
}

const sky = new Image();
sky.src = 'sky.jpg';
let skyLoaded = false;

sky.onload = () => skyLoaded = true;

function init() {
  for(const input of inputs){
    changeInput(input.getAttribute('id'))
  }
  resize();
  createStars();
  window.requestAnimationFrame(draw);
}

function draw() {
  ctx.globalCompositeOperation = "destination-over";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const shadowGradient = ctx.createLinearGradient(0,0,20,10)
  shadowGradient.addColorStop(0,'rgb(0 0 0 / 40%');
  shadowGradient.addColorStop(1,'rgb(0 0 0 / 70%');

  ctx.fillStyle = shadowGradient;
  ctx.strokeStyle = "rgb(0 153 255 / 40%)";

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  planets.forEach((planet,index)=>{
    drawPlanet(planet,index);
    drawOrbit(controls.distanceScale * planet.distance + sun.radius * controls.sizeScale);
  })
  ctx.restore();

  // Słońce
  const gradient = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, sun.radius * controls.sizeScale * 0.5,
    canvas.width / 2, canvas.height / 2, sun.radius * controls.sizeScale * 1.85
  );
  gradient.addColorStop(0.1, 'rgba(255,255,255,0.6)');
  gradient.addColorStop(0.2, 'rgba(255,255,100,0.5)');
  gradient.addColorStop(1, 'rgba(255,255,100,0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, sun.radius * controls.sizeScale * 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = sun.color;
  ctx.beginPath();
  ctx.arc(canvas.width / 2, canvas.height / 2, sun.radius * controls.sizeScale, 0, Math.PI * 2);
  ctx.fill();

  //if(skyLoaded)ctx.drawImage(sky,0,0,canvas.width,canvas.height)
  drawStars();
  ctx.fillStyle = 'black'
  ctx.fillRect(0,0,canvas.width,canvas.height)

  window.requestAnimationFrame(draw);
}

function drawOrbit(r) {
  ctx.beginPath();
  ctx.lineWidth = 1.5;
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPlanet(planet,index) {

  const time = new Date();
  const j2000 = new Date('2000-01-01T12:00:00Z')

  const elapsedDays = (time - j2000) / (1000 * 60 * 60 * 24) * controls.TIME_MULTIPLIER;
  const orbitFraction = (elapsedDays % planet.period) / planet.period;

  const angle = orbitFraction * 2 * Math.PI;

 ctx.save();
  ctx.rotate(angle);
  ctx.translate(controls.distanceScale * planet.distance + sun.radius *controls.sizeScale, 0);
 
  //Shadow
  if(planet.name == 'Ziemia') ctx.fillRect(0, -planet.radius * controls.sizeScale, controls.sizeScale * planet.radius + moon.distance *controls.distanceScale+ controls.sizeScale *moon.radius*2, planet.radius*2*controls.sizeScale);
  else if(planet.name == 'Saturn') ctx.fillRect(0, -planet.radius * controls.sizeScale * 0.55, controls.sizeScale * planet.radius + planet.radius*0.2 * controls.sizeScale, planet.radius*controls.sizeScale * 0.55*2);
  else{
    ctx.beginPath();
    ctx.arc(0,0, controls.sizeScale *planet.radius+1, (Math.PI*3)/2,Math.PI /2, );
    ctx.fill()
  }

  //Planet
  if(planet.name=='Saturn'){
    ctx.lineWidth = planet.radius * 0.2 * controls.sizeScale;
    ctx.strokeStyle = planet.color
    ctx.fillStyle = planet.color
    ctx.beginPath();
    ctx.arc(0, 0, controls.sizeScale * planet.radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0,0,controls.sizeScale * planet.radius,0,Math.PI*2);
    ctx.stroke()
  }
  else{
    ctx.fillStyle = planet.color;
    ctx.beginPath();
    ctx.arc(0, 0, controls.sizeScale * planet.radius , 0, Math.PI * 2);
    ctx.fill();
  }

  //Moon
   if(planet.name == 'Ziemia'){
    const moonFraction = (elapsedDays % moon.period) / moon.period
    const moonAngle = moonFraction * 2 * Math.PI;
    
    ctx.save();

   ctx.rotate(moonAngle);
    ctx.translate(0, controls.sizeScale *planet.radius+ moon.distance*controls.distanceScale);
    ctx.fillStyle = moon.color;
    ctx.beginPath();
    ctx.arc(0, 0, controls.sizeScale *moon.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    
  }

  ctx.restore();

}

function resize() {
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
  //stars.length = 0;
  //createStars();
}

function createStars(){
  stars.length = 0
  for(let i=0; i<controls.STARS_NUM; i++){
    stars.push({
      x: Math.random() * screen.width,
      y: Math.random() * screen.height,
      radius: Math.random() * 1.5 + 0.1,
      flickerSpeed: Math.random() * 3 + 1.5,
      flickerPhase: Math.random() * Math.PI * 2
    })
  }
}

function drawStars(){
 
  for(const star of stars){
    const now = performance.now() / 1000;
    const alpha = 0.7 + 0.3 * Math.sin(now * star.flickerSpeed + star.flickerPhase);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`
    ctx.beginPath();
    ctx.arc(star.x,star.y,star.radius*controls.sizeScale,0,Math.PI*2);
    ctx.fill()
  }
}

init();
window.addEventListener("resize", resize);

function changeInput(label){
  const value = $(`input#${label}`).value;
  $(`label[for=${label}] i`).innerText = value;
  if(label in controls) controls[label] = value;
  else{console.log("Label doesn't exist in controls")}
  if(label == 'STARS_NUM')createStars()
}