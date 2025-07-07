const $ = (sel)=>document.querySelector(sel);
const $$ = (sel)=>[...document.querySelectorAll(sel)];

const processor = {
    greenDelete:100,
    redLeave:100,
    blueLeave:100,
};

processor.doLoad = function doLoad(){
    const video = $("#video");
    this.video = video;

    this.c1 = $("#c1")
    this.c2 = $("#c2")

    this.ctx1 = this.c1.getContext("2d")
    this.ctx2 = this.c2.getContext("2d")

    video.addEventListener("play",()=>{
        this.width = video.videoWidth/4;
        this.height = video.videoHeight/4;
        this.timerCallBack();
    })
}

processor.timerCallBack = function timerCallBack(){
    if(this.video.paused || this.video.ended) return;

    this.computeFrame();

    setTimeout(()=>{
        this.timerCallBack();
    },0)
}   

processor.computeFrame = function(){
    this.ctx1.drawImage(this.video,0,0,this.width,this.height);
    const frame = this.ctx1.getImageData(0,0,this.width,this.height);
    const data = frame.data;

    for(let i=0; i< data.length; i+=4){
        const red = data[i+0];
        const green = data[i+1];
        const blue = data[i+2];
        if(green>this.greenDelete && red<this.redLeave && blue<this.blueLeave)
            data[i+3]=0;
    }
    this.ctx2.putImageData(frame,0,0);
}

processor.doLoad();

const input = $("select")
processor.c2.style.backgroundImage = `url(img/background/${input.value}.jpg`;

input.addEventListener("input",()=>{
    processor.c2.style.backgroundImage = `url(img/background/${input.value}.jpg`;
})