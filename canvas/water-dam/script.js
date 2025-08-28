const $ = (sel)=>{return document.querySelector(sel)}
const $$ = (sel)=>{return [...document.querySelectorAll(sel)]}

const inputs = $$('.menuInput input[type=range]')

const canvas = $('canvas')
const ctx = canvas.getContext('2d')
const canvasContainer = $('main section')

// --- NOWE: zegar i prosta hydraulika 3-komorowa ---
let lastTime = performance.now()

// poziomy wody (unormowane 0..1 w obrębie kanału)
let H_up   = 0.50   // przed tamą A (zasilanie wg suwaka "float")
let H_mid  = 0.40   // między tamami
let H_down = 0.20   // za tamą B (odpływ do „świata”)

// parametry dynamiki
const HYDRO = {
  kA: 1.2,         // "przepustowość" tamy A
  kB: 1.2,         // "przepustowość" tamy B
  levelGain: 0.35, // jak szybko Q zmienia poziom w MID
  tailGain: 0.60,  // jak Q_B podnosi poziom DOWN
  drainK: 0.30,    // jak DOWN samoczynnie spływa do zera
  upInertia: 0.8,  // jak szybko UP goni swój target (z suwaka)
};

// pomocnicze
const clamp = (a,b,x)=>Math.max(a,Math.min(b,x));
const lerp  = (a,b,t)=>a+(b-a)*t;

const simulation = {
  damAFlow: 0,
  damBFlow: 0,
  float: 0,
  draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height)
    this.drawBackground();
    this.drawWater();
    this.drawJetA()
    this.drawJetB()
  },
  drawBackground(){
    ctx.save()
    ctx.fillStyle = '#63B7F8' // niebo
    ctx.fillRect(0,0,canvas.width,canvas.height)
    ctx.fillStyle = '#149026'  // zielony pasek trawy (górna granica wody)
    ctx.fillRect(0,canvas.height/3,canvas.width,5)
    ctx.fillStyle = '#75380F'  // ziemia
    ctx.fillRect(0,canvas.height/3+5,canvas.width,canvas.height)
    ctx.fillStyle = '#3F1E08'  // ciemnobrązowy pas dna (dolna granica wody)
    ctx.fillRect(0,canvas.height/3*2.5,canvas.width,canvas.height)
    ctx.restore()
  },
  drawJetA(){
    const width = Math.max(Math.min(canvas.width/15,30),8)
    const leftOffset =  Math.max(Math.min(canvas.width/10,40),5)

    ctx.fillStyle = '#282828ff'
    ctx.beginPath()
    ctx.roundRect(leftOffset,(canvas.height/3+5)-((this.damAFlow/100)*(canvas.height*0.5-5)),width,canvas.height*0.5-5,[5])
    ctx.fill()
  },
  drawJetB(){
    ctx.save()
    const width = Math.max(Math.min(canvas.width/15,30),8)
    const leftOffset =  Math.max(Math.min(canvas.width/10,40),5)

    ctx.fillStyle = '#282828ff'
    ctx.translate(canvas.width, 0)
    ctx.scale(-1,1)
    ctx.beginPath()
    ctx.roundRect(leftOffset,(canvas.height/3+5)-((this.damBFlow/100)*(canvas.height*0.5-5)),width,canvas.height*0.5-5,[5])
    ctx.fill()
    ctx.restore()
  },

  // --- NOWE: rysowanie i fizyka wody (3 komory + fale + ograniczenia) ---
  drawWater(){
    // czas
    const t  = performance.now()
    const dt = (t - lastTime) / 1000; // sekundy
    lastTime = t

    // horyzontalna geometria bram (musi być spójna z drawJetA/B)
    const gateW = Math.max(Math.min(canvas.width/15,30),8)
    const gateOffset = Math.max(Math.min(canvas.width/10,40),5)

    const xA0 = gateOffset
    const xA1 = gateOffset + gateW

    const xB1 = canvas.width - gateOffset
    const xB0 = xB1 - gateW

    // trzy strefy kanału:
    const X_UP0   = 0,       X_UP1   = xA0        // przed tamą A
    const X_MID0  = xA1,     X_MID1  = xB0        // pomiędzy tamami
    const X_DOWN0 = xB1,     X_DOWN1 = canvas.width // za tamą B

    // pionowe ograniczenia wody (ścisłe):
    const Y_TOP    = canvas.height/3 + 5;          // tu zaczyna się woda (pod trawą)
    const Y_BOTTOM = canvas.height/3*2.5;          // NIE niżej niż górna krawędź ciemnobrązowego pasa

    // mapowanie poziomu [0..1] -> Y
    const yOf = (H)=>clamp(Y_TOP, Y_BOTTOM, lerp(Y_TOP, Y_BOTTOM, clamp(0,1,H)));

    // --- FIZYKA ---
    const openA = (+this.damAFlow)/100;
    const openB = (+this.damBFlow)/100;

    // UP dąży do poziomu wynikającego z suwaka "float" (zasilanie z „rzeki”)
    const H_up_target = clamp(0.08, 0.95, (+this.float)/25); // 0..25 -> 0.08..0.95
    H_up += (H_up_target - H_up) * HYDRO.upInertia * dt;

    // przepływy przez bramy (proste Torricelli-like): Q ~ otwarcie * sqrt(Δh)
    const dHA = Math.max(0, H_up - H_mid);
    const dHB = Math.max(0, H_mid - H_down);
    const Q_A = HYDRO.kA * openA * Math.sqrt(dHA);
    const Q_B = HYDRO.kB * openB * Math.sqrt(dHB);

    // bilans w MID
    H_mid += (Q_A - Q_B) * HYDRO.levelGain * dt;
    H_mid  = clamp(0, 1, H_mid);

    // zbiornik za B: zasilany Q_B, sam odpływa do „zera”
    H_down += (Q_B * HYDRO.tailGain - HYDRO.drainK * H_down) * dt;
    H_down = clamp(0, 1, H_down);

    // --- RYSOWANIE (z falami i twardymi ograniczeniami) ---
    const ampBase = 3;
    const ampUp   = ampBase + 4 * openA;               // trochę mocniej, gdy A otwarta
    const ampMid  = ampBase + 4 * (openA + openB)/2;
    const ampDown = ampBase + 4 * openB;

    // gradient wody (stały)
    const grad = ctx.createLinearGradient(0, Y_TOP, 0, Y_BOTTOM);
    grad.addColorStop(0, '#2e9ed5ff');
    grad.addColorStop(0.4, '#186eacff');
    grad.addColorStop(1, '#17446cff');

    // uniwersalny rysownik fali w przedziale [x0,x1] na poziomie H
    function drawCompartment(x0,x1,H,amp){
      const xStep = 5;
      const phase = t * 0.002;

      // linia fali
      const yBase = yOf(H);

      ctx.fillStyle = grad;
      ctx.beginPath();
      // górna krawędź (fala)
      ctx.moveTo(x0, yBase + Math.sin((x0*0.05)+phase)*amp);
      for(let x=x0; x<=x1; x+=xStep){
        const y = yBase + Math.sin((x*0.05)+phase)*amp;
        ctx.lineTo(x, clamp(Y_TOP, Y_BOTTOM, y));
      }
      // dół do Y_BOTTOM (bez wyciekania pod pas)
      ctx.lineTo(x1, Y_BOTTOM);
      ctx.lineTo(x0, Y_BOTTOM);
      ctx.closePath();
      ctx.fill();

      // delikatna linia zwierciadła
      ctx.strokeStyle = 'rgba(220,230,255,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for(let x=x0; x<=x1; x+=xStep){
        const y = yBase + Math.sin((x*0.05)+phase)*amp;
        const yy = clamp(Y_TOP, Y_BOTTOM, y);
        if(x===x0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }

    // RYSUJEMY WODĘ W TRZECH STREFACH (nie zachodzi na trawę ani pod dno)
    drawCompartment(X_UP0,   X_UP1,   H_up,   ampUp);
    drawCompartment(X_MID0,  X_MID1,  H_mid,  ampMid);
    drawCompartment(X_DOWN0, X_DOWN1, H_down, ampDown);
  },
}

inputs.forEach((input)=>{inputChange(input);input.addEventListener('input',()=>inputChange(input))})

function inputChange(input){
  const value = input.value;
  const id = input.getAttribute('id')
  const outputPlace = $(`label[for=${id}]+p`)
  outputPlace.innerText = value
  simulation[id] = value
}

function resize(){
  // const dpr = Math.min(window.devicePixelRatio || 1, 2);
  // const rect = document.getElementById('stage').getBoundingClientRect();
  // canvas.width = Math.floor(rect.width * dpr);
  // canvas.height = Math.floor(rect.height * dpr);
  // ctx.setTransform(dpr,0,0,dpr,0,0);
}
new ResizeObserver(resize).observe(document.getElementById('stage'));

function animate(){
  simulation.draw()
  requestAnimationFrame(animate)
}
animate()
