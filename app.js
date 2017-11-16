var canvas;
var gl;

var vertexShader;
var fragmentShader;

var camera;

var environment = []; //not se loh doda z global.environment.push(obj);

var onStart = function () {

	canvas = document.getElementById('game-surface');
	gl = initGL(canvas);

	if(!gl) {
		return;
	}

	initShaders();

	init(); // tle naj se zgodi vsa inicializacija objektov, karkoli se bo dlje časa rabilo met.	
	
	//one loop to rule them all, one loop to draw them, one loop to transform them all and in the renderer bind them
	var update = function () { //loop ki transformira vse objekte in jih izrise

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.clearColor(0.75, 0.85, 0.8, 1.0);
		gl.cullFace(gl.BACK);
		gl.enable(gl.CULL_FACE);
		gl.enable(gl.DEPTH_TEST);
		gl.frontFace(gl.CCW);

		gameplay();

		environment.forEach(function(object) {
			draw(object);
		});

		requestAnimationFrame(update);
	};
	requestAnimationFrame(update);

};

// keira objekt s podanimi parametri (obvezno podati vertice in indice)
function createObject(vertices, indices, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
	// Create buffers for object
	let boxVertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  
	let boxIndexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

	let shaderProgram = createShaderProgram();
  
	let positionAttribLocation = gl.getAttribLocation(shaderProgram, 'vertPosition');
	let colorAttribLocation = gl.getAttribLocation(shaderProgram, 'vertColor');
 
	// gl.vertexAttribPointer(
	//   Attribute location, 
	//   Number of elements per attribute, 
	//   Type of elements, 
	//   , 
	//   Size of an individual vertex, 
	//   Offset from the beginning of a single vertex to this attribute
	// );
	gl.vertexAttribPointer(positionAttribLocation, 3, gl.FLOAT, gl.FALSE, 6 * Float32Array.BYTES_PER_ELEMENT, 0);
	gl.vertexAttribPointer(colorAttribLocation, 3, gl.FLOAT, gl.FALSE, 6 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
  
	gl.enableVertexAttribArray(positionAttribLocation);
	gl.enableVertexAttribArray(colorAttribLocation);

	var object = {
		program: shaderProgram,
		indices: indices,
		position: position,
		rotation: rotation,
		angle: 0,
		scale: scale
	};

	environment.push(object);
}

var objectsVI = {
	// X, Y, Z           R, G, B
	boxVertices: [ 
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
	],
	boxIndices: [
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
	]
};

var init = function() {
	// init camera
	camera = {
		position:[0, 0.5, -6]
	};
	createObject(objectsVI.boxVertices, objectsVI.boxIndices, [0, -1, 0]);
	createObject(objectsVI.boxVertices, objectsVI.boxIndices, [0, -2.5, 0], undefined, [2, 1, 1]);
	console.log(environment);
};

// izrise izbran objekt
var draw = function(object) {
	let program = object.program;

	gl.useProgram(program);

	let matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
	let matViewUniformLocation = gl.getUniformLocation(program, 'mView');
	let matProjUniformLocation = gl.getUniformLocation(program, 'mProj');

	let worldMatrix = new Float32Array(16);
	let viewMatrix = new Float32Array(16);
	let projMatrix = new Float32Array(16);

	mat4.identity(worldMatrix);
	mat4.lookAt(viewMatrix, camera.position, [0,0,0], [0, 1, 0]); //camera (pozicija kamere, kam gleda , vektor ki kaze gor)
	mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 1000.0);

	gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
	gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
	gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

	//------------------------------------TRANSFORMACIJE--------------------------------------------------
	//tipicno je TRS - translacija, rotacija, skaliranje
	let transformMatrix = new Float32Array(16);
	mat4.identity(transformMatrix);

	mat4.translate(transformMatrix, transformMatrix, object.position);
	mat4.scale(transformMatrix, transformMatrix, object.scale);
	// TODO: implementiraj se rotacije ??? mogoce je potrebno drugace podati rotacije kot trenutno
	//mat4.rotate(transformMatrix, ???);

	mat4.mul(worldMatrix, worldMatrix, transformMatrix);

	gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
	gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT, 0);
};




var gameplay = function() {//do stuff

};

function initGL(canvas) {
	let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
	if (!gl) {
		alert('No WebGL context found.');
	}
	return gl;
}

function initShaders() {
	fragmentShader = getShader(gl, "shader-fs");
	vertexShader = getShader(gl, "shader-vs");

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
}

function createShaderProgram() {
	let program = gl.createProgram();
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
	return program;
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