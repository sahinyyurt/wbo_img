/**
 *                        WHITEBOPHIR
 *********************************************************
 * @licstart  The following is the entire license notice for the 
 *  JavaScript code in this page.
 *
 * Copyright (C) 2013  Ophir LOJKINE
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend
 */

(function eraser() { //Code isolation

	var erasing = false;

	
	var currShape = null;
	var curTool = "single";
	var icons = ["<i style='margin-top:7px' class='fas fa-eraser'></i>","<i style='color: black;margin-top:7px' class='fas fa-object-group'></i>",];
	var end = false;
	var lastTime = performance.now(); //The time at which the last point was drawn
	var makeRect = false;
	var textElem;

	var rect = {
		x:0,
		y:0,
		x2:0,
		y2:0
	};

	function startErasing(x, y, evt) {
		//Prevent the press from being interpreted by the browser
		evt.preventDefault();
		if(curTool=="multi"){
			var shape  = Tools.createSVGElement("rect");
				
			shape.id = "erase-rect";
			
			shape.setAttribute("stroke", "red");
			shape.setAttribute("fill", "gray");
			shape.setAttribute("stroke-width",1);
			shape.setAttribute("fill-opacity",.1);
			
			Tools.svg.appendChild(shape);
			if(!textElem){
				textElem = Tools.createSVGElement("text");
				textElem.setAttribute("x", -1000);
				textElem.setAttribute("y", 100);
				
				textElem.setAttribute("font-size", 20);
				textElem.setAttribute("fill", "black");
				textElem.setAttribute("opacity",.1);
				textElem.textContent = "Delete this area!";
				Tools.svg.appendChild(textElem);
			}
			rect.x = x;
			rect.y = y;
			makeRect = true;
		}else{
			erasing = true;
			erase(x, y, evt);
		}
		
	}



	function stopErasing(x, y, evt) {
		evt.preventDefault();
		if(curTool=="multi"){
			//Add a last point to the shape
			if(makeRect){
				end=true;
				erase(x, y);
				end=false;
				var shape = svg.getElementById("erase-rect");	
				shape.remove();
				textElem.setAttribute("x", -1000);
				textElem.setAttribute("y", 100);
				makeRect = false;
				var targets = [];
				var rx = rect.x*Tools.scale-document.documentElement.scrollLeft;
				var rx2 = rect.x2*Tools.scale-document.documentElement.scrollLeft;
				var ry = rect.y*Tools.scale-document.documentElement.scrollTop;
				var ry2 = rect.y2*Tools.scale-document.documentElement.scrollTop;
				$("#layer-"+Tools.layer).find("*").each(
					function( i, el ) {
						var r = el.getBoundingClientRect();
						if(insideRect(r.x,r.y,r.width,r.height,rx,ry,rx2,ry2)){
							targets.push(el);
						}
					}
				);
				if(targets.length>0){
					var msg = {
						"type": "delete",
						"id": null
					};
					msg.id = [];
					for(var i = 0;i<targets.length;i++){
						msg.id.push(targets[i].id);
						
					};
					Tools.drawAndSend(msg);
				}
			}
		}else{
			erasing = false;
			
		}
	}

	function insideRect(x,y,w,h,rx,ry,rx2,ry2){
		if(rx<=x&&ry<=y){
			if(rx2>=x+w&&ry2>=y+h){
				if(rx2>rx&&ry2>ry){
					return true;
				}
			}
		}
		return false;
	}


	
	function erase(x, y, evt) {
		if (evt) evt.preventDefault();
		if(curTool=="multi"){
			if(makeRect){
				rect['x2'] = x; rect['y2'] = y;
				if (performance.now() - lastTime > 20|| end) {
					var shape = svg.getElementById("erase-rect");
					shape.x.baseVal.value = Math.min(rect['x2'], rect['x']);
					shape.y.baseVal.value = Math.min(rect['y2'], rect['y']);
					shape.width.baseVal.value = Math.abs(rect['x2'] - rect['x']);
					shape.height.baseVal.value = Math.abs(rect['y2'] - rect['y']);
					if(shape.width.baseVal.value>150&&shape.height.baseVal.value>150){
						textElem.setAttribute("x", shape.x.baseVal.value+shape.width.baseVal.value/2-60);
						textElem.setAttribute("y", shape.y.baseVal.value+shape.height.baseVal.value/2+14);
					}else{
						textElem.setAttribute("x", -1000);
						textElem.setAttribute("y",100);
					}
					lastTime = performance.now();
				}
			}
		}else{
			// evt.target should be the element over which the mouse is...
			var target = evt.target;
			if (evt.type === "touchmove") {
				// ... the target of touchmove events is the element that was initially touched,
				// not the one **currently** being touched
				var touch = evt.touches[0];
				target = document.elementFromPoint(touch.clientX, touch.clientY);
			}
			if(false || evt.type === "touchmove"){
				if (erasing && target !== Tools.svg && target.id) {
					var msg = {
						"type": "delete",
						"id": null
					};
					msg.id = target.id;
					if(!msg.id.startsWith("layer")&&msg.id!="defs"&&msg.id!="rect_1"&&msg.id!="cursors"){
						var elem = svg.getElementById(msg.id);
						if (elem === null) return; //console.error("Eraser: Tried to delete an element that does not exist.");
						else{
							var layer;
							var c = elem.getAttribute("class");
							var d = elem.getAttribute("data-lock");
							if(c && c.startsWith("layer-") && d!=1){
								layer = parseInt(c.substr(6));
								if(shouldDelete(x,y,layer))Tools.drawAndSend(msg);
							}
						}
					}
				}
			}else{
				if(erasing){
					if(scanForObject(x,y,target,0,0))return
					if(scanForObject(x,y,target,0,1))return
					if(scanForObject(x,y,target,0,-1))return
					if(scanForObject(x,y,target,1,1))return
					if(scanForObject(x,y,target,1,0))return
					if(scanForObject(x,y,target,1,-1))return
					if(scanForObject(x,y,target,-1,1))return
					if(scanForObject(x,y,target,-1,0))return
					if(scanForObject(x,y,target,-1,-1))return
					for(var i = 2; i<7;i++){
						if(scanForObject(x,y,target,0,i))return;
						if(scanForObject(x,y,target,i,0))return;
						if(scanForObject(x,y,target,0,-i))return;
						if(scanForObject(x,y,target,-i,0))return;
					}
				}
			}
		}
	}

	function draw(data) {
		var elem;
		switch (data.type) {
			//TODO: add the ability to erase only some points in a line
			case "delete":
				if(Array.isArray(data.id)){
					for(var i = 0;i<data.id.length;i++){
						elem = svg.getElementById(data.id[i]);
						if (elem !== null){ //console.error("Eraser: Tried to delete an element that does not exist.");
							elem.remove();
						}
					}
				}else{
					elem = svg.getElementById(data.id);
					if (elem === null) return; //console.error("Eraser: Tried to delete an element that does not exist.");
					elem.remove();
				}
				break;
			default:
				console.error("Eraser: 'delete' instruction with unknown type. ", data);
				break;
		}
	}

	function scanForObject(x,y,target, i,j){
		target=document.elementFromPoint((x+i)*Tools.scale-document.documentElement.scrollLeft, (y+j)*Tools.scale-document.documentElement.scrollTop);

		if (target && target !== Tools.svg) {
			var msg = {
				"type": "delete",
				"id": null
			};
			msg.id = target.id;
			if(!msg.id.startsWith("layer")&&msg.id!="defs"&&msg.id!="rect_1"&&msg.id!="cursors"){
				var elem = svg.getElementById(msg.id);
				if (elem === null) return; //console.error("Eraser: Tried to delete an element that does not exist.");
				else{
					var layer;
					var c = elem.getAttribute("class");
					var d = elem.getAttribute("data-lock");

					if(c && c.startsWith("layer-") && d!=1){
						layer = parseInt(c.substr(6));
						if(shouldDelete(x+i,y+j,layer))Tools.drawAndSend(msg);
						return true
					}
				}
			}
		}
		return false;
	}

	function segIsWithinRofPt(x, y, x1, y1, x2, y2, r) {

		if( (x1 <= x+r && x1 >= x-r) || (x2  <= x+r && x2 >= x-r) ){ //within x range
			if( (y1 <= y+r && y1 >= y-r) || (y2  <= y+r && y2 >= y-r) ){ //within y range
				
				var A = x - x1;
				var B = y - y1;
				var C = x - x2;
				var D = y - y2;

				//test distance from points

				if( (A * A + B * B <= r * r) || (C * C + D * D <= r * r) )return true;

				var E = x2 - x1;
				var F = y2 - y1;
			
				var dot = A * E + B * F;
				var len_sq = E * E + F * F;
				var param = -1;
				if (len_sq != 0) //in case of 0 length line
					param = dot / len_sq;
			
				var xx, yy;
			
				if (param < 0) {
				xx = x1;
				yy = y1;
				}
				else if (param > 1) {
				xx = x2;
				yy = y2;
				}
				else {
				xx = x1 + param * E;
				yy = y1 + param * F;
				}
			
				var dx = x - xx;
				var dy = y - yy;
				
				if( dx * dx + dy * dy <= r * r){
					if( xx <= Math.max(x1,x2) && xx >= Math.min(x1,x2) && 
						yy <= Math.max(y1,y2) && yy >= Math.min(y1,y2)){
							return true;
					}
				}
			}
		}
		return false;
	  }
	
	//Figure out if you should delete an object based upon whether the particular x,y coordinate of the object is in a valid masking region
	function shouldDelete(x,y,layer){
		for (var id in Tools.eraserCache) {
			if (Tools.eraserCache.hasOwnProperty(id)) {
				// Do things here
				if(layer<= Tools.eraserCache[id].layer){
					var pts = Tools.eraserCache[id].pts;
					var r = Tools.eraserCache[id].size;
					var x1,y1,x2,y2;
					for (var i=0;i<pts.length-1;i++){
						x1=pts[i].values[0];
						y1=pts[i].values[1];
						var n = i + 1
						x2=pts[n].values[0];
						y2=pts[n].values[1];
						//console.log(segIsWithinRofPt(x, y, x1, y1, x2, y2, r));
						if(segIsWithinRofPt(x, y, x1, y1, x2, y2, r))return false;
					}
				}
			}
		}
		return true;
	}
	var svg = Tools.svg;

	function toggle(elem){
		var index = 0;
		if(curTool=="single"){
			curTool="multi";
			index=1;
		}else{
			curTool="single";
		}
			elem.getElementsByClassName("tool-icon")[0].innerHTML = icons[index];
	};

	Tools.add({ //The new tool
		"name": "Remove",
		"icon": "?",
		"iconHTML":icons[0],
		//"shortcut": "e",
		"toggle":toggle,
		"listeners": {
			"press": startErasing,
			"move": erase,
			"release": stopErasing,
		},
		"shortcuts": {
            "changeTool":"5"
        },
		"draw": draw,
		"mouseCursor": "crosshair",
	});

})(); //End of code isolation