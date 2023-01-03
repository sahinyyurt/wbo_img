(function documents() { //Code isolation


// This isn't an HTML5 canvas, it's an old svg hack, (the code is _that_ old!)

var xlinkNS = "http://www.w3.org/1999/xlink";
var imgCount = 1;
var fileInput;
function onstart() {
    fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.click();
    fileInput.addEventListener("change", function(){
        const imageFile = fileInput.files[0];
        var reader = new FileReader();
        reader.readAsDataURL(imageFile);
      
        reader.onload = function (e) {
            var image = new Image();
            image.src = e.target.result;
            image.onload = function () {
            var canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            var uid = Tools.generateUID("doc"); // doc for document
            let w = this.width;
            let h = this.height;
            if (w > h) {
                if (w > 1028) {
                    h = h * (768 / h);
                    w = 1028;
                }
            } else {
                if (h > 768) {
                    w = w * (768 / h);
                    h = 768;
                }
            }
          
            canvas.width = w;
            canvas.height = h;
            // console.log(image.src.toString().length);
            ctx.drawImage(this, 0, 0,w, h);
            var dataurl = canvas.toDataURL(imageFile.type);
            var msg = {
                id: uid,
                type:"doc",
                src: dataurl,
                w: w || 300,
                h: h || 300,
                x: (100+document.documentElement.scrollLeft)/Tools.scale+10*imgCount,
                y: (100+document.documentElement.scrollTop)/Tools.scale + 10*imgCount
                //fileType: fileInput.files[0].type
            };
            draw(msg);
            Tools.send(msg,"Document");
            imgCount++;
            };
        };
       // Tools.change(Tools.prevToolName);
    });
}

function draw(msg) {
    //const file = self ? msg.data : new Blob([msg.data], { type: msg.fileType });
    //const fileURL = URL.createObjectURL(file);

   // fakeCanvas.style.background = `url("${fileURL}") 170px 0px no-repeat`;
    //fakeCanvas.style.backgroundSize = "400px 500px";
    var aspect = msg.w/msg.h
    var img = Tools.createSVGElement("image");
    img.id=msg.id;
    img.setAttribute("class", "layer-"+Tools.layer);
    img.setAttribute("href", msg.src);
    img.x.baseVal.value = msg['x'];
    img.y.baseVal.value = msg['y'];
    img.setAttribute("width", 400*aspect);
    img.setAttribute("height", 400);
    if(msg.transform)
			img.setAttribute("transform",msg.transform);
    Tools.group.appendChild(img);
    
}

Tools.add({
    "name": "Document",
    "icon":"?",
    "iconHTML": '<i style="margin-top:7px" class="fas fa-file-image"></i>',
    "shortcuts": {
        "changeTool":"7"
    },
    "draw": draw,
    "onstart": onstart,
    "oneTouch":true
});

})(); //End of code isolation