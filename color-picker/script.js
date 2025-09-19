const img = new Image();
img.crossOrigin = 'anonymous'

const input = document.querySelector("select")
img.src = `../images/z${input.value}.jpg`

input.addEventListener("input",()=>{
    img.src = `../images/z${input.value}.jpg`
})

const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

img.onload = _ => ctx.drawImage(img,0,0,canvas.width,canvas.height)

const hoveredColor = document.querySelector('#hovered-color')
const selectedColor = document.querySelector('#selected-color')

function pick(destination,event){
    const canvasPosition = canvas.getBoundingClientRect()

    const pixelData = ctx.getImageData(event.clientX - canvasPosition.x,event.clientY - canvasPosition.y,1,1).data
    
    const rgbColor = `rgb(${pixelData[0]} ${pixelData[1]} ${pixelData[2]} / ${pixelData[3] / 255})`
    destination.innerText = rgbColor
    destination.style.backgroundColor = rgbColor

    if(pixelData[0]>200 || pixelData[1]>200 || pixelData[2]>200) destination.classList.add('dark-font')
    else destination.classList.remove('dark-font')

    return rgbColor
}

canvas.addEventListener('mousemove',event=>pick(hoveredColor,event))
canvas.addEventListener('click', event=>pick(selectedColor,event))



