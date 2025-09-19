const $ = (sel) => document.querySelector(sel)
const $$ = (sel) => [...document.querySelectorAll(sel)]

const canvas = $("canvas");
const ctx = canvas.getContext("2d");

const ball = {
    x: 100,
    y: 100,
    vx: 12,
    vy: 8,
    radius: 30,
    color: 'red',
    drawing:false,
    shadow:false,
    physics:false,
    e:0.0001,
    draw(){
        ctx.beginPath();
        ctx.arc(this.x,this.y,this.radius,0,2*Math.PI)
        ctx.fillStyle=this.color
    
        if(!this.drawing)ctx.fill();
        else ctx.stroke()
    }
}

const border = {
    width: 2,
    color: 'red',
    offset: 0,
    paddingX: 30,
    paddingY: 15,
    draw(){
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.width;
        ctx.setLineDash([7,3]);
        ctx.lineDashOffset = -this.offset;
        ctx.strokeRect(this.paddingX,this.paddingY,canvas.width-2*this.paddingX,canvas.height-2*this.paddingY);
    },

}

const inputs = $$('input[type=checkbox]')
inputs.forEach(input =>{
    changeInput(input)
    input.addEventListener('input',()=>changeInput(input));
})

intro();
function intro(){
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.overflow = "hidden";
    resize()
    run()
}

function resize(){
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth
}
window.addEventListener("resize",()=>{resize()})

function run(){
    if(!ball.drawing && !ball.shadow) ctx.clearRect(0,0,canvas.width,canvas.height);
    if(ball.shadow && !ball.drawing){
        ctx.fillStyle = 'rgb(255 255 255 / 50%)'
        ctx.fillRect(0,0,canvas.width,canvas.height);
    }

    border.offset= ++border.offset%10;
    border.draw()
    ball.draw()

    ball.x += ball.vx;
    ball.y += ball.vy;
    if(ball.physics){
        ball.vy *= 0.99
        if( Math.abs(ball.vy) < ball.e) ball.vy = -0.25
        ball.vy += 0.25

        ball.vx *= 0.999
        if(Math.abs(ball.vx) < ball.e) ball.vx = 0;
    }

    if(ball.x + ball.vx > canvas.width - ball.radius - border.paddingX ||
        ball.x + ball.vx < ball.radius + border.paddingX)
         ball.vx = -ball.vx
    if(ball.y + ball.vy > canvas.height - ball.radius - border.paddingY ||
        ball.y + ball.vy < ball.radius + border.paddingY)
         ball.vy = -ball.vy

    window.requestAnimationFrame(run)
}

function changeInput(input){
    const value = input.checked;
    const id = input.getAttribute('id')
    ball[id] = value
    console.log(ball[id])
}