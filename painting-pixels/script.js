const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const img = new Image();
img.crossOrigin = "anonymous";
img.onload = () => {
  ctx.drawImage(img, 0, 0,canvas.width,canvas.height);
  resetMenu()
};

const drawMenu = document.querySelectorAll('.menu input[type=radio]')
function resetMenu(){
  drawMenu.forEach(input=>{
    if(input.getAttribute('id')=='original') input.checked = true
    else input.checked = false;
  })
}

const select = document.querySelector('select')
img.src = `../images/z${select.value}.jpg`
select.addEventListener('input',_=>{
    img.src = `../images/z${select.value}.jpg`
    resetMenu()
}
)

const imageColoring = {
  original:_=>ctx.drawImage(img, 0, 0,canvas.width,canvas.height),
  grayscale(){
    ctx.drawImage(img, 0, 0,canvas.width,canvas.height);

    const imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
    const data = imageData.data;

    for(let i=0; i<data.length; i+=4){
       const avg = (data[i] + data[i+1] + data[i+2]) / 3;
       data[i] = data[i+1] = data[i+2] = avg
    }

    ctx.putImageData(imageData,0,0)
  },
  inverted(){
    ctx.drawImage(img, 0, 0,canvas.width,canvas.height);

    const imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
    const data = imageData.data;

    for(let i=0; i<data.length; i+=4){
      data[i] = 255 - data[i];
      data[i+1] = 255 - data[i+1];
      data[i+2] = 255 - data[i+2];
    }

    ctx.putImageData(imageData,0,0)
  },
  sepia(){
    ctx.drawImage(img, 0, 0,canvas.width,canvas.height);

    const imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
    const data = imageData.data;

    for(let i=0; i<data.length; i+=4){
      let r = data[i],
          g = data[i+1],
          b = data[i+2];

      
      data[i] = Math.min(Math.round(0.393 * r + 0.769 * g + 0.189 * b), 255);
      data[i + 1] = Math.min(Math.round(0.349 * r + 0.686 * g + 0.168 * b), 255);
      data[i + 2] = Math.min(Math.round(0.272 * r + 0.534 * g + 0.131 * b), 255);
    }

    ctx.putImageData(imageData,0,0)
  },
}

drawMenu.forEach(input=>input.addEventListener('change',event=>{
  switch(event.target.value){
    case 'grayscale':
      imageColoring.grayscale();
      break;
    case 'inverted':
      imageColoring.inverted();
      break;
    case 'sepia':
      imageColoring.sepia();
      break;
    default:
      imageColoring.original();
  }
    
}))