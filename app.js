var gl_global;
var canvas_global;

var environment=new Array; //not se loh doda z global.environment.push(obj);


//var vs_global;
//var fs_global;
var program_global;
var boxIndices_global;

var instantiate_cube=function(){
	window.canvas_global = document.getElementById('game-surface');
	gl = window.canvas_global.getContext('webgl');
	if (!gl) {
		console.log('WebGL not supported, falling back on experimental-webgl');
		gl = window.canvas_global.getContext('experimental-webgl');
	}

	if (!gl) {
		alert('Your browser does not support WebGL');
	}

	gl.clearColor(0.75, 0.85, 0.8, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CCW);
	gl.cullFace(gl.BACK);


		//
		// Create shaders
		// 
		var fragmentShader = getShader(gl, "shader-fs");
		var vertexShader = getShader(gl, "shader-vs");

	  gl.compileShader(vertexShader);
	  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		  console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
		  return;
	  }
  
	  gl.compileShader(fragmentShader);
	  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		  console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
		  return;
	  }

	  program = gl.createProgram();
	  gl.attachShader(program, vertexShader);
	  gl.attachShader(program, fragmentShader);
	  gl.linkProgram(program);
	  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		  console.error('ERROR linking program!', gl.getProgramInfoLog(program));
		  return;
	  }
	  gl.validateProgram(program);
	  if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
		  console.error('ERROR validating program!', gl.getProgramInfoLog(program));
		  return;
	  }
  
	  //
	  // Create buffer
	  //
	  var boxVertices = 
	  [ // X, Y, Z           R, G, B
		  // Top
		  -1.0, 1.0, -1.0,   0.5, 0.5, 0.5,
		  -1.0, 1.0, 1.0,    0.5, 0.5, 0.5,
		  1.0, 1.0, 1.0,     0.5, 0.5, 0.5,
		  1.0, 1.0, -1.0,    0.5, 0.5, 0.5,
  
		  // Left
		  -1.0, 1.0, 1.0,    0.75, 0.25, 0.5,
		  -1.0, -1.0, 1.0,   0.75, 0.25, 0.5,
		  -1.0, -1.0, -1.0,  0.75, 0.25, 0.5,
		  -1.0, 1.0, -1.0,   0.75, 0.25, 0.5,
  
		  // Right
		  1.0, 1.0, 1.0,    0.25, 0.25, 0.75,
		  1.0, -1.0, 1.0,   0.25, 0.25, 0.75,
		  1.0, -1.0, -1.0,  0.25, 0.25, 0.75,
		  1.0, 1.0, -1.0,   0.25, 0.25, 0.75,
  
		  // Front
		  1.0, 1.0, 1.0,    1.0, 0.0, 0.15,
		  1.0, -1.0, 1.0,    1.0, 0.0, 0.15,
		  -1.0, -1.0, 1.0,    1.0, 0.0, 0.15,
		  -1.0, 1.0, 1.0,    1.0, 0.0, 0.15,
  
		  // Back
		  1.0, 1.0, -1.0,    0.0, 1.0, 0.15,
		  1.0, -1.0, -1.0,    0.0, 1.0, 0.15,
		  -1.0, -1.0, -1.0,    0.0, 1.0, 0.15,
		  -1.0, 1.0, -1.0,    0.0, 1.0, 0.15,
  
		  // Bottom
		  -1.0, -1.0, -1.0,   0.5, 0.5, 1.0,
		  -1.0, -1.0, 1.0,    0.5, 0.5, 1.0,
		  1.0, -1.0, 1.0,     0.5, 0.5, 1.0,
		  1.0, -1.0, -1.0,    0.5, 0.5, 1.0,
	  ];
  
	  var boxIndices =
	  [
		  // Top
		  0, 1, 2,
		  0, 2, 3,
  
		  // Left
		  5, 4, 6,
		  6, 4, 7,
  
		  // Right
		  8, 9, 10,
		  8, 10, 11,
  
		  // Front
		  13, 12, 14,
		  15, 14, 12,
  
		  // Back
		  16, 17, 18,
		  16, 18, 19,
  
		  // Bottom
		  21, 20, 22,
		  22, 20, 23
	  ];
  
	  var boxVertexBufferObject = gl.createBuffer();
	  gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
	  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(boxVertices), gl.STATIC_DRAW);
  
	  var boxIndexBufferObject = gl.createBuffer();
	  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
	  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(boxIndices), gl.STATIC_DRAW);
  
	  var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
	  var colorAttribLocation = gl.getAttribLocation(program, 'vertColor');
	  gl.vertexAttribPointer(
		  positionAttribLocation, // Attribute location
		  3, // Number of elements per attribute
		  gl.FLOAT, // Type of elements
		  gl.FALSE,
		  6 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
		  0 // Offset from the beginning of a single vertex to this attribute
	  );
	  gl.vertexAttribPointer(
		  colorAttribLocation, // Attribute location
		  3, // Number of elements per attribute
		  gl.FLOAT, // Type of elements
		  gl.FALSE,
		  6 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
		  3 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
	  );
  
	  gl.enableVertexAttribArray(positionAttribLocation);
	  gl.enableVertexAttribArray(colorAttribLocation);







	window.gl_global=gl;
	//window.vs_global=vertexShader;
	//window.fs_global=fragmentShader;
	//window.program_global=program;
	//window.boxIndices_global=boxIndices;


	var platform_cube={
		program:program,
		boxIndices:boxIndices,
	};

	window.environment.push(platform_cube);


}

var init=function(){
	instantiate_cube();
}


var drawCube=function(positionV,rotationV,angle,scaleV, program, boxIndices){
	/*what dis do:
	pos-pozicija(ubistvu se kamera odmika)
	rot-vektor rotacije([1,0,0]) je okol x recimo
	angle - kot okol prejsnga vektorja
	scaleV - vektor for skeil [sx,sy,sz]

	*/
	
	//console.log('This is working');
		var gl=window.gl_global;
		//var fragmentShader=window.fs_global;
		//var vertexShader=window.vs_global;
		//var program=window.program_global;
		//var boxIndices=window.boxIndices_global;
		// Tell OpenGL state machine which program should be active.
		gl.useProgram(program);
	
		var matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
		var matViewUniformLocation = gl.getUniformLocation(program, 'mView');
		var matProjUniformLocation = gl.getUniformLocation(program, 'mProj');
	
		var worldMatrix = new Float32Array(16);
		var viewMatrix = new Float32Array(16);
		var projMatrix = new Float32Array(16);
		mat4.identity(worldMatrix);
		mat4.lookAt(viewMatrix, [0, 2, -7], [0,0,0], [0, 1, 0]);//camera (pozicija kamere, kam gleda , vektor ki kaze gor)
		mat4.perspective(projMatrix, glMatrix.toRadian(45), window.canvas_global.clientWidth / window.canvas_global.clientHeight, 0.1, 1000.0);
	
		gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
		gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
		gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);
	
		var rotationMatrix 	= new Float32Array(16);
		var scaleMatrix		= new Float32Array(16);
		var translation		= new Float32Array(16);
		var identityMatrix = new Float32Array(16);
		mat4.identity(identityMatrix);
		//------------------------------------TRANSFORMACIJE--------------------------------------------------

		mat4.scale(scaleMatrix,identityMatrix,scaleV)
		mat4.mul(worldMatrix,worldMatrix,scaleMatrix);
		mat4.rotate(rotationMatrix,identityMatrix,angle,rotationV);
		mat4.mul(worldMatrix, worldMatrix, rotationMatrix);
		mat4.translate(worldMatrix, identityMatrix,positionV);

		gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
		gl.clearColor(0.75, 0.85, 0.8, 1.0);
		gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
		gl.drawElements(gl.TRIANGLES, boxIndices.length, gl.UNSIGNED_SHORT, 0);
}

//
// getShader
//
// Loads a shader program by scouring the current document,
// looking for a script with the specified ID.
//
// op.: skopirano iz primerov z vaj
//
function getShader(gl, id) {
  var shaderScript = document.getElementById(id);

  // Didn't find an element with the specified ID; abort.
  if (!shaderScript) {
    return null;
  }

  // Walk through the source element's children, building the
  // shader source string.
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) {
        shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
  
  // Now figure out what type of shader script we have,
  // based on its MIME type.
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;  // Unknown shader type
  }

  // Send the source to the shader object
  gl.shaderSource(shader, shaderSource);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}




var onStart = function () {

	init(); // tle naj se zgodi vsa inicializacija objektov, karkoli se bo dlje časa rabilo met.

	var m=0;
	//one loop to rule them all, one loop to draw them, one loop to transform them all and in the renderer bind them
	var loop = function () {


		window.environment.forEach(function(object){
			//console.log(window.environment);

			drawCube([0,0,0],[0,2,0],0,[3,1,1],object.program,object.boxIndices);  //positionV,rotationV,angle,scaleV
			
		});

		requestAnimationFrame(loop);
	};
	requestAnimationFrame(loop);

};