const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

//clock border
const clockRadius = 200,clockWidth = 16,clockBorderColor = 'darkblue',clockBackground = 'lightgrey';
//marks
const hourMarkWidth = 20, hourMarkBoldenss = 8;
const minuteMarkWidth = 8, minuteMarkBoldness= 4;
const markBorderDistance = 0;
//hands
const hourHandWidth = 110, hourHandBoldness = 13;
const minuteHandWidth = 150, minuteHandBoldness = 10;
const secondHandWidth = 165, secondHandBoldness = 5;
let scale = 1,speed=1;
let dif = 0;

let startTimestamp = Date.now()
let virtualTime = Date.now()

function myClock(){
  const nowTimeStamp = new Date();
  const deltaTime = (nowTimeStamp - startTimestamp) * speed;
  startTimestamp = nowTimeStamp;

  virtualTime += deltaTime
  const now = new Date(virtualTime)
  
  ctx.clearRect(0,0,canvas.width,canvas.height)

  ctx.save();

  ctx.translate(canvas.width/2,canvas.height/2);
  ctx.rotate(-Math.PI/2)
  ctx.scale(scale,scale)

  //clock border
  ctx.lineWidth = clockWidth
  ctx.strokeStyle = clockBorderColor
  ctx.fillStyle = clockBackground
  ctx.beginPath()
  ctx.arc(0,0,clockRadius,0,Math.PI *2)
  ctx.fill()
  ctx.stroke()

  drawMarks(60,6,minuteMarkWidth,minuteMarkBoldness,markBorderDistance)
  drawMarks(12,30,hourMarkWidth,hourMarkBoldenss,markBorderDistance)

  const sec = now.getSeconds()-1  /*+ now.getMilliseconds()/1000*/;
  const min = now.getMinutes() + dif;
  const hr = now.getHours() % 12;

  //image description
  canvas.innerText = `The time is: ${hr}:${min}:${sec}`;

  ctx.fillStyle = "black";
  ctx.lineCap = 'round'
  ctx.strokeStyle= 'black'

  //hours hand
  ctx.save();
  ctx.lineWidth = hourHandBoldness
  ctx.rotate(
  (Math.PI / 6) * hr +  (Math.PI / 360)* min + (Math.PI / 21600)*sec);
  ctx.beginPath();
  ctx.moveTo(-20,0)
  ctx.lineTo(hourHandWidth-20,0)
  ctx.stroke()
  ctx.restore();

  //minute hand
  ctx.save()
  ctx.lineWidth = minuteHandBoldness
  ctx.rotate(
   (Math.PI/30)*min+ (Math.PI/1800)*sec)
  ctx.beginPath()
  ctx.moveTo(-30,0)
  ctx.lineTo(minuteHandWidth-30,0)
  ctx.stroke()
  ctx.restore()

  //second hand
  ctx.save()
  ctx.rotate(
    (Math.PI / 30) * sec
  )
  ctx.strokeStyle = "#D40000";
  ctx.fillStyle = "#D40000";
  ctx.lineWidth = secondHandBoldness;
  ctx.beginPath();
  ctx.moveTo(-35, 0);
  ctx.lineTo(secondHandWidth-35, 0);
  ctx.stroke();

  ctx.beginPath()
  ctx.arc(0,0,hourHandBoldness+0.5,0,Math.PI*2,true)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(secondHandWidth-35+0.5*6+secondHandBoldness+1,0,6,0,Math.PI*2,true)
  ctx.stroke()
  ctx.restore()

  ctx.restore()
  window.requestAnimationFrame(myClock);
}

function drawMarks(quantity,deg,width,boldness,borderDistance){
  ctx.save();
  ctx.lineCap = 'round'
  ctx.strokeStyle= 'black'
  ctx.lineWidth = boldness
  for(let i=0; i<quantity;i++){
    ctx.rotate((Math.PI/180)*deg)
    ctx.beginPath();
    ctx.moveTo(clockRadius - borderDistance-clockWidth,0)
    ctx.lineTo(clockRadius - borderDistance-clockWidth-width,0)
    ctx.stroke()
  }
  ctx.restore()
}

function resize(){
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

function changeScale(){
  const input = $('input[id=scale]')
  const value = input.value
  $('label[for=scale] i').innerText = value;
  scale = value
}

function changeSpeed(){
  const input = $('input[id=speed]')
  const value = input.value
  $('label[for=speed] i').innerText = value;
  speed = value
  //speed = parseFloat(value);
  startTimestamp = Date.now();
}

function reset(){
  virtualTime =  Date.now()
}


changeScale()
changeSpeed()
resize()
window.addEventListener('resize',resize)
window.requestAnimationFrame(myClock);

window.addEventListener('keydown',(event)=>{
  console.log(event.key)
  if(event.key == 'ArrowLeft') dif--;
  else if(event.key == 'ArrowRight') dif++;
  dif%60*12;
})