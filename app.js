var canvas;
var gl;

var vertexShader;
var fragmentShader;

var camera;
var player;

var environment = []; //not se loh doda z global.environment.push(obj);

var onStart = function () {

	canvas = document.getElementById('game-surface');
	gl = initGL(canvas);

	if(!gl) {
		return;
	}

	initShaders();

	initGame(); // tle naj se zgodi vsa inicializacija objektov, karkoli se bo dlje časa rabilo met.

	// inicializacija keyboard listenerjev
	document.onkeydown = handleKeyDown;
	document.onkeyup = handleKeyUp;
	
	//one loop to rule them all, one loop to draw them, one loop to transform them all and in the renderer bind them
	var update = function (time) { //loop ki transformira vse objekte in jih izrise

		updatePhysics(time);

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

	// procesiranje gravitacije, collision detection-a
	var fixedTimeStep = 1.0 / 60.0; // seconds
	var maxSubSteps = 3;
	var lastTime;
	var updatePhysics = function(time) {
		if(lastTime !== undefined) {
			var dt = (time - lastTime) / 1000;
			world.step(fixedTimeStep, dt, maxSubSteps);
		}
		lastTime = time;
	};



	requestAnimationFrame(update);
};

var gameplay = function() {//do stuff
	handleKeys();
};

var world;
var materials = {};

function initPhysics() {
	// Ustvari "svet", v katerem deluje gravitacija in collision detection.
	// V ta svet se nato dodajajo telesa (body) vsakega objekta.
	world = new CANNON.World();
	world.gravity.set(0, -10, 0); // gravitacija po Y

	// Materiali določajo, kako posamezna telesa reagirajo med seboj
	materials.frictionless = new CANNON.Material("frictionlessMaterial");
	// TODO: potweakaj, da ne bo bounca
	let mat_frictionless = new CANNON.ContactMaterial(materials.frictionless, materials.frictionless, {
		friction: 0,
		restitution: 0,
		//contactEquationStiffness: 1e8,
		//contactEquationRelaxation: 3,
		//frictionEquationStiffness: 1e8,
		//frictionEquationRegularizationTime: 3,
	});

	world.addContactMaterial(mat_frictionless);
}

// keira objekt s podanimi parametri (obvezno podati vertice in indice)
function createObject(vertices, indices, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
	// Create buffers for object
	let boxVertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  
	let boxIndexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Float32Array(indices), gl.STATIC_DRAW);

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

	// Objektu damo body za uporabo v physics world-u.
	let body = createBody(position, scale, 0, materials.frictionless);
	// Telo dodaj v physics world
	world.addBody(body);

	var object = {
		program: shaderProgram,
		indices: indices,
		//position: position, // !! use body.position !!
		rotation: rotation,
		angle: 0,
		scale: scale,
		body: body
	};

	environment.push(object);
	return object;
}

function createBody(position, scale, mass = 0, material = undefined) {
	let body = new CANNON.Body({
		mass: mass, // privzeto brez mase (staticen objekt, neodziven na gravitacijo ali trke)
		position: new CANNON.Vec3(position[0], position[1], position[2]), // pozicija
		shape: new CANNON.Box(new CANNON.Vec3(scale[0], scale[1], scale[2])), // privzeta oblike je kvader, navedemo njegovo velikost (xyz)
		fixedRotation: true, // telo se ne rotira ob trku (oz. delovanju drugih sil)
		material: material, // material telesa
	});
	return body;
}

var objectsVI = {
	// X, Y, Z           R, G, B
	boxVertices: [ 
		// Top
		-1.0, 1.0, -1.0,   0.82, 0.27, 0.27,
		-1.0, 1.0, 1.0,    0.82, 0.27, 0.27,
		1.0, 1.0, 1.0,     0.82, 0.27, 0.27,
		1.0, 1.0, -1.0,    0.82, 0.27, 0.27,

		// Left
		-1.0, 1.0, 1.0,    0.22, 0.66, 0.22,
		-1.0, -1.0, 1.0,   0.22, 0.66, 0.22,
		-1.0, -1.0, -1.0,  0.22, 0.66, 0.22,
		-1.0, 1.0, -1.0,   0.22, 0.66, 0.22,

		// Right
		1.0, 1.0, 1.0,    0.22, 0.66, 0.22,
		1.0, -1.0, 1.0,   0.22, 0.66, 0.22,
		1.0, -1.0, -1.0,  0.22, 0.66, 0.22,
		1.0, 1.0, -1.0,   0.22, 0.66, 0.22,

		// Front
		1.0, 1.0, 1.0,      0.82, 0.73, 0.27,
		1.0, -1.0, 1.0,     0.82, 0.73, 0.27,
		-1.0, -1.0, 1.0,    0.82, 0.73, 0.27,
		-1.0, 1.0, 1.0,     0.82, 0.73, 0.27,

		// Back
		1.0, 1.0, -1.0,      0.82, 0.73, 0.27,
		1.0, -1.0, -1.0,     0.82, 0.73, 0.27,
		-1.0, -1.0, -1.0,    0.82, 0.73, 0.27,
		-1.0, 1.0, -1.0,     0.82, 0.73, 0.27,

		// Bottom
		-1.0, -1.0, -1.0,   0.82, 0.27, 0.27,
		-1.0, -1.0, 1.0,    0.82, 0.27, 0.27,
		1.0, -1.0, 1.0,     0.82, 0.27, 0.27,
		1.0, -1.0, -1.0,    0.82, 0.27, 0.27,
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





var initObjFiles=function(){

	var client = new XMLHttpRequest();
	client.open('GET', './aKey.obj');
	client.onreadystatechange = function() {
		var mesh=new OBJ.Mesh(client.responseText);
	  console.log(mesh.vertices);
		OBJ.initMeshBuffers(gl,mesh);
	  	createObject(mesh.vertices,mesh.indices,[0,2,0]);
	}
	client.send();

	

}

var initGame = function() {
	// init camera
	camera = {
		position:[0, 0, 10]
	};

	initPhysics();
	initObjFiles();

	createObject(objectsVI.boxVertices, objectsVI.boxIndices, [0, -3, 0], undefined, [5, 1, 3]);
	createObject(objectsVI.boxVertices, objectsVI.boxIndices, [3, -2, 0], undefined, [3, 1, 1]);
	player = createObject(objectsVI.boxVertices, objectsVI.boxIndices, [-2, -0.5, 0], undefined, [0.5, 1, 0.4]);
	
	player.body.mass = 30;
	player.body.type = CANNON.Body.DYNAMIC;
	player.body.updateMassProperties();

	player.data = {};
	player.data.speed = 3;
	player.data.canJump = false;

	var contactNormal = new CANNON.Vec3();
	var upAxis = new CANNON.Vec3(0,1,0);
	player.body.addEventListener("collide", function(event) {
		var contact = event.contact;

		// contact.bi and contact.bj are the colliding bodies, and contact.ni is the collision normal.
		// We do not yet know which one is which! Let's check.
		if(contact.bi.id == player.id)  // bi is the player body, flip the contact normal
			contact.ni.negate(contactNormal);
		else
			contactNormal.copy(contact.ni); // bi is something else. Keep the normal as it is

		// If contactNormal.dot(upAxis) is between 0 and 1, we know that the contact normal is somewhat in the up direction.
		if(contactNormal.dot(upAxis) > 0.5) // Use a "good" threshold value between 0 and 1 here!
		player.data.canJump = true;
	});

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
	//mat4.identity(projMatrix);

	gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
	gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
	gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

	//------------------------------------TRANSFORMACIJE--------------------------------------------------
	//tipicno je TRS - translacija, rotacija, skaliranje
	let transformMatrix = new Float32Array(16);
	mat4.identity(transformMatrix);

	let pos = object.body.position;
	mat4.translate(transformMatrix, transformMatrix, [pos.x, pos.y, pos.z]);
	mat4.scale(transformMatrix, transformMatrix, object.scale);
	// TODO: implementiraj se rotacije ??? mogoce je potrebno drugace podati rotacije kot trenutno
	//mat4.rotate(transformMatrix, ???);

	mat4.mul(worldMatrix, worldMatrix, transformMatrix);

	gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
	gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT, 0);
};

var currentlyPressedKeys = {};

function handleKeys() {
	// tipko drzimo ...
	if (currentlyPressedKeys["ArrowLeft"]) { player.body.velocity.x = -player.data.speed }
	if (currentlyPressedKeys["ArrowRight"]) { player.body.velocity.x = +player.data.speed }
	if (currentlyPressedKeys["ArrowUp"]) { player.body.velocity.z = -player.data.speed }
	if (currentlyPressedKeys["ArrowDown"]) { player.body.velocity.z = +player.data.speed }

	if (!currentlyPressedKeys["ArrowLeft"] && !currentlyPressedKeys["ArrowRight"]) {
		player.body.velocity.x = 0;
	}
	if (!currentlyPressedKeys["ArrowUp"] && !currentlyPressedKeys["ArrowDown"]) {
		player.body.velocity.z = 0;
	}
}

function handleKeyDown(event) {
	// storing the pressed state for individual key
	currentlyPressedKeys[event.code] = true;

	console.log(CANNON.ObjectCollisionMatrix());

	if (player.data.canJump && event.code == "Space") { 
		// do jump
		player.data.canJump = false;
		player.body.velocity.y = 6;
	}
}

function handleKeyUp(event) {
	// reseting the pressed state for individual key
	currentlyPressedKeys[event.code] = false;
}

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