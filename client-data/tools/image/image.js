(function () {
  //Code isolation
  var imgUrl = "";

  function draw(data) {
    Tools.drawingEvent = true;
    createShape(data);
  }

  function createShape(data) {
    var image = Tools.createSVGElement("image");
    image.id = data.id;
    image.setAttribute("height", data.h);
    image.setAttribute("width", data.w);
    image.setAttribute("href", data.src);
    image.setAttribute("x", "300");
    image.setAttribute("y", "10");
    image.setAttribute("visibility", "visible");
    Tools.drawingArea.appendChild(image);
    return image;
  }

  function getMeta(url, cb) {
    const img = new Image();
    img.addEventListener("load", function () {
      cb({ w: this.naturalWidth, h: this.naturalHeight });
    });
    img.src = url;
  }

  function setImgUrl() {
    var input = document.createElement("input");
    input.type = "file";
    input.onchange = (e) => {
      var loadingEl = document.getElementById("loadingMessage");
      loadingEl.classList.remove("hidden");
      var file = e.target.files[0];
      const formData = new FormData();
      formData.append("image", file);

      fetch(
        "https://api.imgbb.com/1/upload?key=cfb7a7ac7e029a1277368e21fbc1c028",
        {
          method: "POST", // or 'PUT'
          body: formData,
        }
      )
        .then((response) => response.json())
        .then(({ data }) => {
          getMeta(data.url, ({ w, h }) => {
            Tools.drawAndSend(
              {
                src: data.url,
                w: w,
                h: h,
                id: "image-" + Math.random() * 10,
              },
              Tools.list.Image
            );
            loadingEl.classList.add("hidden");
          });
        });
    };
    input.click();
  }

  var imageTool = {
    name: "Image",
    icon: "tools/image/icon.svg",
    draw: draw,
    onstart: setImgUrl,
  };
  Tools.add(imageTool);
})(); //End of code isolation
