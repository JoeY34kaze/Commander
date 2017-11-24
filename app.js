// webgl
var canvas;
var gl;

var vertexShader;
var fragmentShader;

// game elements
var camera;
var player;
var key;
var door;
var enemies = [];
var bananas = [];
var environment = []; //not se loh doda z global.environment.push(obj);

// hud
var timeNode;
var scoreNode;

// physics
var world;
var materials = {};
var collisionGroups = {
	GROUND: 1,
	OBJECT: 2,
	BULLET: 4,
	OTHER : 8,
};

// objekti
var objectsVI = {
	box: {
		// X, Y, Z           U,V
		vertices: [
			// Top
			-1.0, 1.0, -1.0,   0,0,		0.0,  1.0,  0.0,
			-1.0, 1.0, 1.0,    0,1,		0.0,  1.0,  0.0,
			1.0, 1.0, 1.0,     1,1,		0.0,  1.0,  0.0,
			1.0, 1.0, -1.0,    1,0,		0.0,  1.0,  0.0,

			// Left
			-1.0, 1.0, 1.0,    0,0,		-1.0,  0.0,  0.0,
			-1.0, -1.0, 1.0,   1,0,		-1.0,  0.0,  0.0,
			-1.0, -1.0, -1.0,  1,1,		-1.0,  0.0,  0.0,
			-1.0, 1.0, -1.0,   0,1,		-1.0,  0.0,  0.0,

			// Right
			1.0, 1.0, 1.0,    1,1,		1.0,  0.0,  0.0,
			1.0, -1.0, 1.0,   0,1,		1.0,  0.0,  0.0,
			1.0, -1.0, -1.0,  0,0,		1.0,  0.0,  0.0,
			1.0, 1.0, -1.0,   1,0,		1.0,  0.0,  0.0,

			// Front
			1.0, 1.0, 1.0,      1,1,		0.0,  0.0,  1.0,
			1.0, -1.0, 1.0,     1,0,		0.0,  0.0,  1.0,
			-1.0, -1.0, 1.0,    0,0,		0.0,  0.0,  1.0,
			-1.0, 1.0, 1.0,     0,1,		0.0,  0.0,  1.0,

			// Back
			1.0, 1.0, -1.0,      0,0,		0.0,  0.0, -1.0,
			1.0, -1.0, -1.0,     0,1,		0.0,  0.0, -1.0,
			-1.0, -1.0, -1.0,    1,1,		0.0,  0.0, -1.0,
			-1.0, 1.0, -1.0,     1,0,		0.0,  0.0, -1.0,

			// Bottom
			-1.0, -1.0, -1.0,   1,1,		0.0, -1.0,  0.0,
			-1.0, -1.0, 1.0,    1,0,		0.0, -1.0,  0.0,
			1.0, -1.0, 1.0,     0,0,		0.0, -1.0,  0.0,
			1.0, -1.0, -1.0,    0,1,		0.0, -1.0,  0.0
		],
		indices: [
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
	}
};



var onStart = function () {

	canvas = document.getElementById('game-surface');
	gl = initGL(canvas);

	if(!gl) {
		return;
	}

	initShaders();

	initGame(); // tle naj se zgodi vsa inicializacija objektov, karkoli se bo dlje časa rabilo met.
	initHUD();
	// inicializacija keyboard listenerjev
	document.onkeydown = handleKeyDown;
	document.onkeyup = handleKeyUp;
	//one loop to rule them all, one loop to draw them, one loop to transform them all and in the renderer bind them
	var update = function (time) { //loop ki transformira vse objekte in jih izrise

		updatePhysics(time);

		//hud

		scoreNode.nodeValue = player.data.score;
		timeNode.nodeValue = "2";
		//let health = document.getElementById("health")
		//health.value = blabla; - health naj porihta funkcija ob koliziji z sovragom

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.clearColor(0.75, 0.85, 0.8, 1.0);
		gl.cullFace(gl.BACK);
		gl.enable(gl.CULL_FACE);
		gl.enable(gl.DEPTH_TEST);
		gl.frontFace(gl.CCW);

		gameplay();

		environment.forEach(function(object) {
			if(object.visible) draw(object);
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
			if(player.data.shootCooldown > 0) {
				player.data.shootCooldown -= dt;
			}
			world.step(fixedTimeStep, dt, maxSubSteps);
			for(var i = world.removeQueue.length - 1; i >= 0; i--) {
				world.removeBody(world.removeQueue[i]);
				world.removeQueue.splice(i, 1);
			}
		}
		lastTime = time;
	};

	requestAnimationFrame(update);
};

var gameplay = function() {//do stuff
	handleKeys();

	if(player.body.position.y < -10) {
		player.actions.kill();
	}

	if(player.data.hasKey == false) {
		if(key.visible && distanceBetween(player, key) < 1) {
			player.data.hasKey = true;
			console.log("plyer je dobil kljuc.");
			//world.removeQueue.push(getObjectfromEnv("key").body);
			//removeObjectfromEnv("key");
			key.visible = false;
		}
	} else {
		if(door.visible && distanceBetween(player, door) < 1) {
			player.data.hasKey = false;
			console.log("plyer je uporabil kljuc na vratih.");
			//world.removeQueue.push(getObjectfromEnv("door").body);
			//removeObjectfromEnv("door");
			door.visible = false;
		}
	}

	// animiraj kljuc
	key.rotation[1] += 0.5;

	// za vsako banano ...
	bananas.forEach(function(banana) {
		// animiraj
		banana.rotation[1] += 1;

		// preveri distanco s playerjem in poberi
		if(banana.visible && distanceBetween(player, banana) < 1) {
			// remove banana and give 100 score
			//world.removeQueue.push(banana.body);
			banana.visible = false;
			// remove from environment
			//let envpos = environment.indexOf(banana);
			//if(envpos >= 0) {
			//	world.removeQueue.push(banana.body);
			//	environment.splice(envpos, 1);
				player.data.score += 100;
			//} else {
			//	console.warn("Object not found in environment!");
			//}
			// remove from bananas
			//let banpos = bananas.indexOf(banana);
			//if(banpos >= 0) {
			//	bananas.splice(banpos, 1);
			//} else {
			//	console.warn("Object not found in bananas!");
			//}
		}
	});

	// za vsakega enemya
	enemies.forEach(function(enemy) {
		if(enemy.data.moveLimits.length > 0) {
			let minx = enemy.data.moveLimits[0];
			let maxx = enemy.data.moveLimits[1];

			if(enemy.body.position.x < minx)
				enemy.data.moveDirection = +1;
			else if(enemy.body.position.x > maxx) {
				enemy.data.moveDirection = -1;
			}

			enemy.body.velocity.x = 2 * enemy.data.moveDirection;

			//if(enemy.body.position.x > )
			//e.data.moveLimits = enemyMovements[i];
			//	e.data.moveDirection = +1;
		}
	});

};

function distanceBetween(object1, object2) {
	let d = (object1.body.position.x - object2.body.position.x) * (object1.body.position.x - object2.body.position.x) +
		(object1.body.position.y - object2.body.position.y) * (object1.body.position.y - object2.body.position.y) +
		(object1.body.position.z - object2.body.position.z) * (object1.body.position.z - object2.body.position.z);
	return d;
}

function getObjectfromEnv(tip) {
	for(var i = 0; i < environment.length; i++) {
		if(environment[i].type === tip) {
			return environment[i];
		}
	}
}

function removeObjectfromEnv(tip) {
	for(var i = 0; i < environment.length; i++) {
		if(environment[i].type === tip) {
			environment.splice(i,1);
			break;
		}
	}
}



function initHUD() {
	// look up the elements we want to affect
	let timeElement = document.getElementById("time");
	let scoreElement = document.getElementById("score");

	// Create text nodes to save some time for the browser.
	timeNode = document.createTextNode("");
	scoreNode = document.createTextNode("");

	// Add those text nodes where they need to go
	timeElement.appendChild(timeNode);
	scoreElement.appendChild(scoreNode);
}

function initPhysics() {
	// Ustvari "svet", v katerem deluje gravitacija in collision detection.
	// V ta svet se nato dodajajo telesa (body) vsakega objekta.
	world = new CANNON.World();
	world.gravity.set(0, -10, 0); // gravitacija po Y
	world.removeQueue = []; // telesa, ki naj bodo odstranjena, pushaj v ta queue

	// Materiali določajo, kako posamezna telesa reagirajo med seboj
	materials.frictionless = new CANNON.Material("frictionlessMaterial");
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
function createObject({vertices, indices}, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], type = "", texture) {
	// Create buffers for object
	let boxVertexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, boxVertexBufferObject);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	let boxIndexBufferObject = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boxIndexBufferObject);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

	//create texture ----------------------------
	let boxTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, boxTexture); //st = uv  to je ena webgl bedarija da imajo drugacn ime texturnih koordinat
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

	if(texture != undefined) {
		gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,texture);
	} else {
		// ce textura ni navedena, assajnaj nek default texture
		gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,document.getElementById('texture_platform'));
	}

	let shaderProgram = createShaderProgram();

	var object = {
		program: shaderProgram,
		indicesLen: indices.length,
		//position: position, // !! use body.position !!
		rotation: rotation,
		scale: scale,
		body: undefined,
		type: type,
		gltexture: boxTexture,
		vertexBuffer: boxVertexBufferObject,
		indexBuffer: boxIndexBufferObject,
		visible: true,
		giveBody: function(mass = 0, material = undefined, colGroups, colGroupsMask) {
			// Objektu damo body za uporabo v physics world-u.
			// Telo dodaj v physics world
			let body = new CANNON.Body({
				mass: mass, // privzeto brez mase (staticen objekt, neodziven na gravitacijo ali trke)
				position: new CANNON.Vec3(position[0], position[1], position[2]), // pozicija
				shape: new CANNON.Box(new CANNON.Vec3(scale[0], scale[1], scale[2])), // privzeta oblike je kvader, navedemo njegovo velikost (xyz)
				fixedRotation: true, // telo se ne rotira ob trku (oz. delovanju drugih sil)
				material: material, // material telesa
				collisionFilterGroup: colGroups, // skupine, v katerih se nahaja objekt (uporabi bitwise operacijo | za nastevanje)
				collisionFilterMask: colGroupsMask, // It can only collide with group 2 and 3
			});
			this.body = body;
			body.parentObject = this;
			world.addBody(body);
		}
	};

	environment.push(object);
	return object;
}

var initObjFiles = function() {
	var objectsImport = [
		'./banana.obj',
		'./key.obj',
		//'./teddy.obj',
		'./door.obj'
	];

	let client;
	let objForIm;
	let objName;
	for(let k = 0; k < objectsImport.length; k++) {
		client = new XMLHttpRequest();
		objForIm = objectsImport[k];
		objName = objForIm.substring(2, objForIm.length - 4);

		client.open('GET', objForIm, false);
		client.addEventListener("load", function() {
			let mesh = new OBJ.Mesh(client.responseText);
			mesh.vertices = fixVertices(mesh.vertices);
			let vertices = [];
			for(let i = 0; i < mesh.vertices.length; i += 3) {
				for(let j = 0; j < 3; j++) {
					vertices.push(mesh.vertices[i + j]);
				}
				//tukej treba namest treh rgb vrednosti dat 2 uv koordinate
				for(let j = 0; j < 2; j++) {
					if(k < 1) {
						vertices.push(mesh.textures[i + j]);
					}
					else{
						vertices.push(0.5);
					}
				}

				for(let j = 0; j < 3; j++){
					vertices.push(mesh.vertexNormals[i+j]);
				}
			}

			objectsVI[objName] = {};
			objectsVI[objName].vertices = vertices;
			objectsVI[objName].indices = mesh.indices;
		});
		client.send();
	}

	// createObject(...) funkcija pricakuje vertice na obmocju (-1, 1). Ta funckija podane vertice
	// popravi (t.j. resizea objekt, da pase v obmocje (-1, 1) )
	function fixVertices(vertices) {
		// poiscemo najmanjso vertico in najvecjo vertico
		let min = vertices[0];
		let max = vertices[0];
		for(let i = 0; i < vertices.length; i++) {
			if(vertices[i] < min) min = vertices[i];
			if(vertices[i] > max) max = vertices[i];
		}

		//pogledamo katera absolutna vrednost je vecja
		min *= -1;
		if(min > max) max = min;
		// vse vertice delimo z max, da zmanjsamo predmet na (-1, 1) - to kar smo hoteli.
		// Te nove vertice lahko zdaj vrnemo.
		for(let i = 0; i < vertices.length; i++) {
			vertices[i] /= max;
		}
		return vertices;
	}
};


var initGame = function() {
	// init camera
	camera = {
		position:[-4, 3, 15]
	};

	let keyPosition = [54, -4.5, 1];
	let doorPosition = [76,-1.5,0];

	initPhysics();
	initObjFiles();

	key = createObject(objectsVI.key, keyPosition, undefined, [1, 1, 1], "key",document.getElementById('texture_key'));
	key.giveBody();

	door = createObject(objectsVI.door, doorPosition, undefined, [2, 3, 0], "door",document.getElementById('texture_door'));
	door.giveBody(0, materials.frictionless, collisionGroups.OTHER, collisionGroups.OBJECT | collisionGroups.BULLET);

	// PRIPRAVA LEVELA
	loadPlatforms();
	loadBananas();

	initPlayer();

	initEnemies();

	console.log(environment);
};

function initPlayer() {
	let startPosition = [0,0,0];

	player = createObject(objectsVI.box, startPosition, undefined, [0.5, 1, 0.4], "player", document.getElementById('texture_player'));
	player.giveBody(30, materials.frictionless, collisionGroups.OBJECT, collisionGroups.GROUND | collisionGroups.OBJECT);

	player.data = {};
	player.data.hasKey = false;
	player.data.shootCooldown = 0;
	player.data.lookDirectionX = +1;
	player.data.speed = 4;
	player.data.canJump = false;
	player.data.score = 0;

	player.actions = {
		kill: function() {
			player.body.position = new CANNON.Vec3(0, 0, 0);
			player.data.hasKey = false;

			//nazaj pokazat stvari katere je player pobral prej
			key.visible = true;
			door.visible = true;
			bananas.forEach(function(banana) {
				banana.visible = true;
			});
			player.data.score = 0;
			enemies.forEach(function(enemy) {
				enemy.actions.respawn(enemy);
			});
		},
		shoot: function() {
			let pos = player.body.position;
			let bSize = [0.2, 0.2, 0.2];
			let bRot = [45, 45, 0];
			let bSpeed = 14;
			let b = createObject(objectsVI.box, [pos.x, pos.y, pos.z], bRot, bSize, "bullet");
			b.giveBody(0, undefined, collisionGroups.BULLET, collisionGroups.GROUND | collisionGroups.OBJECT | collisionGroups.BULLET);
			// if mass is set to 0, body type is STATIC. To make velocity effective, we need to set body type to DYNAMIC and call updateMassProperties();
			b.body.type = CANNON.Body.DYNAMIC;
			b.body.updateMassProperties();
			b.body.velocity.x = bSpeed * player.data.lookDirectionX;

			var bulletCollisionEvent = function(event) {
				if(event.body.parentObject.type == "bullet") {
					//world.removeBody(event.body);
					let envpos = environment.indexOf(event.body.parentObject);
					if(envpos >= 0) {
						world.removeQueue.push(event.body);
						environment.splice(envpos, 1);
					} else {
						console.warn("Object not found in environment!");
					}
				} else if(event.target.parentObject.type === "bullet") {
					let envpos = environment.indexOf(event.target.parentObject);
					if(envpos >= 0) {
						event.target.removeEventListener("collide", bulletCollisionEvent);
						world.removeQueue.push(event.target);
						environment.splice(envpos, 1);
					} else {
						console.warn("Object not found in environment!");
					}
				}
			};

			b.body.addEventListener("collide", bulletCollisionEvent);
		},
	};

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
}

function initEnemies() {
	let enemyPositions = [
		[7, 0, 0], // rampa
		[32, 2, -1.5], // stopnica 2
		[26, -1, 0.9], // poleg stopnic
		[40, -1, 2.1], // poleg stopnic
		[57.5, -6.5, 2], // podtla
		[73, -1, 0], // rampa konc
	];
	let enemyMovements = [
		[4, 10],
		[31, 33],
		[26, 40],
		[26, 40],
		[54, 60],
		[69, 73]
	];

	for(let i = 0; i < enemyPositions.length; i++) {
		let e = createObject(objectsVI.box, enemyPositions[i], [0, 0, 0], [0.6, 0.7, 0.6], "enemy");
		e.giveBody(1, materials.frictionless, collisionGroups.OBJECT, collisionGroups.OBJECT | collisionGroups.GROUND | collisionGroups.BULLET);

		e.data = {};
		e.data.moveDirection = -1;
		e.data.moveLimits = enemyMovements[i];

		e.actions = {
			kill: function(e) {
				e.visible = false;
				e.body.collisionFilterMask = collisionGroups.GROUND;
			},
			respawn: function(e) {
				e.visible = true;
				e.body.collisionFilterMask = collisionGroups.OBJECT | collisionGroups.GROUND | collisionGroups.BULLET;
			}
		};
		e.body.addEventListener("collide", function(event) {
			let object, other;
			if(event.body.parentObject.type == "enemy") {
				object = event.body.parentObject;
				other = event.target.parentObject;
			} else {
				object = event.target.parentObject;
				other = event.body.parentObject;
			}
			if(object.visible) {
				if(other.type == "bullet") {
					object.actions.kill(object);
					player.data.score += 50;
				}
				if(other.type == "player") {
					player.actions.kill();
				}
			}
		});
		enemies.push(e);
	}
}

function loadBananas() {
	let bananaPositions = [
		[-2, 1, 0], // na startu
		[4, 0, 0], // rampa
		[7, 0, 0], // rampa
		[10, 0, 0], // rampa
		[15, -1, -2], // levodesno
		[15, -1, +2], // levodesno
		[21, 1.5, 0], // nad luknjo
		[28, 0, -1.5], // stopnica 1
		[32, 2, -1.5], // stopnica 2
		[40, 3.5, -1.5], // stopnice na vrh
		[49, 5, -1.5], // odskok
		//[54, -4.5, 1], // kljuc ??
		[57.5, -6.5, 0], // podtla
		[57.5, -6.5, 2], // podtla
		[70, -1, 0], // rampa konc
		[73, -1, 0], // rampa konc
	];

	for(let i = 0; i < bananaPositions.length; i++) {
		let b = createObject(objectsVI.banana, bananaPositions[i], [0, Math.random() * 180, 30], [1, 1, 1], "pickup", document.getElementById("texture_key"));
		b.giveBody();
		bananas.push(b);
	}
}

function loadPlatforms() {
	function createPlatform(name, position, rotation, scale) {
		return {
			name: name, // za lastno referenco
			position: position,
			rotation: rotation,
			scale: scale
		};
	}
	let platforms = [
		createPlatform("zacetek", [0, -3, 0], [0, 0, 0], [5, 1, 3]),
		createPlatform("zadnja stena", [-4, 0, 0], [0, 0, 0], [0.2, 4, 2]),
		createPlatform("prva rampa", [7, -2, 0], [0, 0, 0], [5, 1, 1]),
		createPlatform("tla za rampo", [13, -3, 0], [0, 0, 0], [3, 1, 3]),
		createPlatform("tla za rampo, ozka", [18, -3, 0], [0, 0, 0], [2, 1, 1.5]),
		createPlatform("tla, skupna s stopnicami", [30, -3, 0], [0, 0, 0], [8, 1, 3]),
		createPlatform("stopnice: 1", [28, -2, -1.5], [0, 0, 0], [2, 1.5, 1.5]),
		createPlatform("stopnice: 2", [32, -1, -1.5], [0, 0, 0], [2, 2, 1.5]),
		createPlatform("stopnice: 3", [36, 0, -1.5], [0, 0, 0], [2, 2.5, 1.5]),
		createPlatform("tla naprej od stopnic (spodaj)", [41, -3, 1.5], [0, 0, 0], [3, 1, 1.5]),
		createPlatform("platforma naprej od stopnic", [41, 2, -1.5], [0, 0, 0], [3, 0.5, 1.5]),
		createPlatform("naprej od stopnic", [48, -3, 0], [0, 0, 0], [4, 1, 3]),
		createPlatform("tla poleg podtal", [58.25, -5, -2], [0, 0, 0], [6.25, 3, 1]),
		createPlatform("tla nad podtlemi", [55, -2.5, 1], [0, 0, 0], [3, 0.5, 2]),
		createPlatform("podtla tla", [56.75, -8, 1], [0, 0, 0], [4.75, 0.5, 2]),
		createPlatform("podtla stena na levi", [51, -6.25, 0], [0, 0, 0], [1, 2.25, 3]),
		createPlatform("podtla desno stopnice: 1", [62, -7.25, 1], [0, 0, 0], [0.5, 1.25, 2]),
		createPlatform("podtla desno stopnice: 2", [63, -6.5, 1], [0, 0, 0], [0.5, 2, 2]),
		createPlatform("podtla desno stopnice: 3", [64, -5.75, 1], [0, 0, 0], [0.5, 2.75, 2]),
		createPlatform("rampa naprej od stopnic", [71, -3, 0], [0, 0, 0], [3, 1, 1]),
		createPlatform("tla naprej od rampe (konec?)", [76, -3.5, 0], [0, 0, 0], [4, 1, 3]),
	];

	for(let i = 0; i < platforms.length; i++) {
		createObject(objectsVI.box, platforms[i].position, platforms[i].rotation, platforms[i].scale, "platform", document.getElementById("texture_grass"))
			.giveBody(0, materials.frictionless, collisionGroups.GROUND, collisionGroups.OBJECT | collisionGroups.BULLET);
	}
}

// izrise izbran objekt
var draw = function(object) {
	let program = object.program;

	gl.useProgram(program);

	let matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
	let matViewUniformLocation = gl.getUniformLocation(program, 'mView');
	let matProjUniformLocation = gl.getUniformLocation(program, 'mProj');

	let matNormalUniformLocation = gl.getUniformLocation(program, 'mNormal');

	let vecAmbientColUniformLocation = gl.getUniformLocation(program, 'vAmbientColor');
	let vecLightDirUniformLocation = gl.getUniformLocation(program, 'vLightingDirection');
	let vecDirColUniformLocation = gl.getUniformLocation(program, 'vDirectionalColor');

	let samplerUniformLocation = gl.getUniformLocation(program, 'sampler');


	let worldMatrix = new Float32Array(16);
	let viewMatrix = new Float32Array(16);
	let projMatrix = new Float32Array(16);

	let normalMatrix = new Float32Array(9);
	let ambientCol = new Float32Array([0.25, 0.25, 0.25]);
	let lightDir = new Float32Array([-0.4, -0.6, -0.7]);
	let dirCol = new Float32Array([0.7, 0.7, 0.7]);

	mat4.identity(worldMatrix);
	let cam = player.body.position;
	cam = [cam.x + camera.position[0],cam.y + camera.position[1],cam.z + camera.position[2]];//tukej se naredi mal offseta
	mat4.lookAt(viewMatrix, cam, [player.body.position.x,player.body.position.y + 1,player.body.position.z], [0, 1, 0]); //camera (pozicija kamere, kam gleda , vektor ki kaze gor)
	mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.width / canvas.height, 0.1, 1000.0);
	//mat4.identity(projMatrix);



	// TRANSFORMACIJE
	let transformMatrix = new Float32Array(16);
	mat4.identity(transformMatrix);

	let pos = object.body.position;
	mat4.translate(transformMatrix, transformMatrix, [pos.x, pos.y, pos.z]);
	mat4.scale(transformMatrix, transformMatrix, object.scale);
	mat4.rotateX(transformMatrix, transformMatrix, glMatrix.toRadian(object.rotation[0]));
	mat4.rotateY(transformMatrix, transformMatrix, glMatrix.toRadian(object.rotation[1]));
	mat4.rotateZ(transformMatrix, transformMatrix, glMatrix.toRadian(object.rotation[2]));

	mat4.mul(worldMatrix, worldMatrix, transformMatrix);

	mat3.normalFromMat4(normalMatrix, worldMatrix); //naj bi delala isto kot vse te ostale skupaj
	/*mat3.identity(normalMatrix);
	mat3.fromMat4(normalMatrix, worldMatrix);
	mat3.invert(normalMatrix, normalMatrix);
	mat3.transpose(normalMatrix, normalMatrix);*/

	let adjLightDir = vec3.create();
	vec3.normalize(adjLightDir, lightDir);
	vec3.scale(adjLightDir, adjLightDir, -1);

	//nastavi bufferje
	gl.bindBuffer(gl.ARRAY_BUFFER, object.vertexBuffer);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.indexBuffer);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D,object.gltexture);

	let positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
	let normalAttribLocation = gl.getAttribLocation(program, 'vertNormal');
	let texCoordAttribLocation = gl.getAttribLocation(program, 'vertTexCoord');

	gl.vertexAttribPointer(positionAttribLocation, 3, gl.FLOAT, gl.FALSE, 8 * Float32Array.BYTES_PER_ELEMENT, 0);//5 namest 6 ker smo rgb zamenjal z uv koordinatam
	gl.vertexAttribPointer(normalAttribLocation, 3, gl.FLOAT, gl.FALSE, 8 * Float32Array.BYTES_PER_ELEMENT, 5 * Float32Array.BYTES_PER_ELEMENT);
	gl.vertexAttribPointer(texCoordAttribLocation, 2, gl.FLOAT, gl.FALSE, 8 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);

	gl.enableVertexAttribArray(positionAttribLocation);
	gl.enableVertexAttribArray(normalAttribLocation);
	gl.enableVertexAttribArray(texCoordAttribLocation);


	//nastavi uniforme
	gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
	gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);
	gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);
	gl.uniformMatrix3fv(matNormalUniformLocation, gl.FALSE, normalMatrix);
	gl.uniform3fv(vecAmbientColUniformLocation, ambientCol);
	gl.uniform3fv(vecLightDirUniformLocation, adjLightDir);
	gl.uniform3fv(vecDirColUniformLocation, dirCol);
	gl.uniform1i(samplerUniformLocation, 0);

	gl.drawElements(gl.TRIANGLES, object.indicesLen, gl.UNSIGNED_SHORT, 0);
};

var currentlyPressedKeys = {};

function handleKeys() {
	// tipko drzimo ...
	if (currentlyPressedKeys["ArrowLeft"]) {
		player.body.velocity.x = -player.data.speed;
		player.data.lookDirectionX = -1;
	}
	if (currentlyPressedKeys["ArrowRight"]) {
		player.body.velocity.x = +player.data.speed;
		player.data.lookDirectionX = +1;
	}
	if (currentlyPressedKeys["ArrowUp"]) {
		if(player.body.position.z > -2)
			player.body.velocity.z = -player.data.speed;
		else
			player.body.velocity.z = 0;
	}
	if (currentlyPressedKeys["ArrowDown"]) {
		if(player.body.position.z < 2)
			player.body.velocity.z = +player.data.speed;
		else
			player.body.velocity.z = 0;
	}

	if (!currentlyPressedKeys["ArrowLeft"] && !currentlyPressedKeys["ArrowRight"]) {
		player.body.velocity.x = 0;
	}
	if (!currentlyPressedKeys["ArrowUp"] && !currentlyPressedKeys["ArrowDown"]) {
		player.body.velocity.z = 0;
	}

	if(player.data.shootCooldown <= 0 && currentlyPressedKeys["KeyX"]) {
		player.actions.shoot();
		player.data.shootCooldown = 0.5;
	}
}

function handleKeyDown(event) {
	// storing the pressed state for individual key
	currentlyPressedKeys[event.code] = true;
	if (player.data.canJump && event.code == "Space") {
		// do jump
		player.data.canJump = false;
		player.body.velocity.y = 6.5;
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
