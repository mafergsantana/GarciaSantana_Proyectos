var w=800;
var h=400;
var jugador;
var fondo;

var bala, balaD=false, nave,nave1, bala1, balaf=false;
var salto;
var izquierda; 
var menu;

var velocidadBala;
var velocidadBala1;
var despBala;
var desp2Bala;
var estatusAire;

var estatusCamina;
var caminando = false;
var sionoRegresa = false;
var deRegreso = false;

var nnNetwork , nnEntrenamiento, nnSalida, datosEntrenamiento=[]; // Variables para el entrenamiento del salto
var nnNetwork2 , nnEntrenamiento2, nnSalida2, datosEntrenamiento2=[]; // Variables para el entrenamiento del movimiento a un lado

var modoAuto = false, eCompleto=false;

var juego = new Phaser.Game(w, h, Phaser.CANVAS, '', { preload: preload, create: create, update: update, render:render});

// se cargan los elementos para que se vean desde antes de jugar

function preload() {
    juego.load.image('fondo', 'assets/game/fondo.jpg');
    juego.load.spritesheet('mono', 'assets/sprites/altair.png',32 ,48);
    juego.load.image('nave', 'assets/game/ufo.png');
    juego.load.image('nave1', 'assets/game/ufo.png'); 

    juego.load.image('bala', 'assets/sprites/purple_ball.png');
    juego.load.image('bala1', 'assets/sprites/purple_ball.png'); 

    juego.load.image('menu', 'assets/game/menu.png');
}

//se crean e inicializan

function create() {

    juego.physics.startSystem(Phaser.Physics.ARCADE);
    juego.physics.arcade.gravity.y = 800;
    juego.time.desiredFps = 30;

    fondo = juego.add.tileSprite(0, 0, w, h, 'fondo');
    nave = juego.add.sprite(w-100, h-70, 'nave');
    bala = juego.add.sprite(w-100, h, 'bala');
    jugador = juego.add.sprite(50, h, 'mono');
    bala1 = juego.add.sprite(w-725, h-350, 'bala1'); // bala que cae
    nave1 = juego.add.sprite(w-766, h-400, 'nave1'); // nave de arriba

    juego.physics.enable(jugador);
    jugador.body.collideWorldBounds = true;
    var corre = jugador.animations.add('corre',[8,9,10,11]);
    jugador.animations.play('corre', 10, true);

    juego.physics.enable(bala); // Dandole fisicas a la bala de X
    juego.physics.enable(bala1); // Dandole fisicas a la bala de Y

    bala.body.collideWorldBounds = true;
    bala1.body.collideWorldBounds = false;

    pausaL = juego.add.text(w - 100, 20, 'Pausa', { font: '20px Arial', fill: '#fff' });
    pausaL.inputEnabled = true;
    pausaL.events.onInputUp.add(pausa, self);
    juego.input.onDown.add(mPausa, self);

    salto = juego.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    izquierda = juego.input.keyboard.addKey('37');

    //Entrenamiento para saltar
    nnNetwork =  new synaptic.Architect.Perceptron(2, 3, 1);
    nnEntrenamiento = new synaptic.Trainer(nnNetwork);

    //Entrenamiento para moverse
    nnNetwork2 =  new synaptic.Architect.Perceptron(2, 3, 1);
    nnEntrenamiento2 = new synaptic.Trainer(nnNetwork2);
}

function enRedNeural(){
    nnEntrenamiento.train(datosEntrenamiento, {rate: 0.003, iterations: 30000, shuffle: true}); // Entrenamiento de los datos del salto
    nnEntrenamiento2.train(datosEntrenamiento2, {rate: 0.0003, iterations: 20000, shuffle: true}); // Entrenamiento de los datos del movimiento
}

//Función para procesar los datos del entrenamiento para saltar
function datosDeEntrenamiento(param_entrada){
    console.log("Entrada",param_entrada[0]+" "+param_entrada[1]);
    nnSalida = nnNetwork.activate(param_entrada);
    console.log(nnSalida);
    var aire=Math.round( nnSalida[0]*100 );
    console.log("Valor","En la salida de saltar " + aire);
    return aire > 40;
}

//Función para procesar los datos del entrenamiento para moverse
function datosDeEntrenamiento2(param_entrada){
    console.log("Entrada2",param_entrada[0]+" "+param_entrada[1]);
    nnSalida2 = nnNetwork2.activate(param_entrada);
    console.log(nnSalida2);
    var piso=Math.round( nnSalida2[0]*100 );
    console.log("Valor","En la salida de moverse " + piso);
    return piso > 60;
}

function pausa(){
    juego.paused = true;
    menu = juego.add.sprite(w/2,h/2, 'menu');
    menu.anchor.setTo(0.5, 0.5);
}

function mPausa(event){
    if(juego.paused){
        var menu_x1 = w/2 - 270/2, menu_x2 = w/2 + 270/2,
            menu_y1 = h/2 - 180/2, menu_y2 = h/2 + 180/2;

        var mouse_x = event.x  ,
            mouse_y = event.y  ;

        if(mouse_x > menu_x1 && mouse_x < menu_x2 && mouse_y > menu_y1 && mouse_y < menu_y2 ){
            if(mouse_x >=menu_x1 && mouse_x <=menu_x2 && mouse_y >=menu_y1 && mouse_y <=menu_y1+90){
                eCompleto=false;
                datosEntrenamiento = [];
                datosEntrenamiento2 = [];
                modoAuto = false;
            }else if (mouse_x >=menu_x1 && mouse_x <=menu_x2 && mouse_y >=menu_y1+90 && mouse_y <=menu_y2) {
                if(!eCompleto) {
                    console.log("","Entrenamiento "+ datosEntrenamiento.length +" valores" );
                    console.log("","Entrenamiento "+ datosEntrenamiento2.length +" valores" );
                    enRedNeural();
                    eCompleto=true;
                }
                modoAuto = true;
            }

            menu.destroy();
            jugador.position.x = 50;
            jugador.position.y = h - 50;
            caminando = false;
            resetVariables();
            bala1.body.velocity.y = 0;
            bala1.position.y = h-380;
            balaf=false;
            juego.paused = false;

        }
    }
}

function resetVariables(){
    bala.body.velocity.x = 0;
    bala.position.x = w-100;
    //jugador.position.x=150;
    balaD=false;
}

function saltar(){
    jugador.body.velocity.y = -270;
}

//movimiento del mono a la izquierda con la flecha del teclado
function moverizquierda(){
    jugador.body.velocity.x = -150;
    caminando=true;
}

function update() {

    fondo.tilePosition.x -= 1;

    juego.physics.arcade.collide(bala, jugador, colisionH, null, this); // Detectar la colision de la bala en X
    juego.physics.arcade.collide(bala1, jugador, colisionH, null, this); // Detectar la colision de la bala en Y
    
    estatusCamina = 0;

    estatusAire = 0;
    
    //Identificar si el jugador se esta moviendo
    if(sionoRegresa){
        estatusCamina = 1;
    }
    //Identificar si el jugador esta saltando
    if(!jugador.body.onFloor()) {
        estatusAire = 1;
    }

    velocidadBala1 = Math.round(bala1.body.velocity.y);

    despBala = Math.floor( jugador.position.x - bala.position.x );
    desp2Bala = Math.floor( jugador.position.x - bala1.position.y );

    // Verificar si el mono puede saltar
    if( modoAuto==false && salto.isDown &&  jugador.body.onFloor() ){
        saltar();
    }
    // Verificar si el mono puede moverse
    if( modoAuto==false && izquierda.isDown && !caminando){
        moverizquierda();
        sionoRegresa=true;
        caminando=true;
        console.log("IZQUIERDA");
    }

    // Verificar si el mono tiene que regresar a su posicion original
    if (modoAuto==false && jugador.position.x == 0 && caminando) {
        jugador.body.velocity.x = 150;
        sionoRegresa = false;
        deRegreso = true;
    }
    // Verificar si el mono esta en su posicion original
    if (modoAuto==false && jugador.position.x == 50 && deRegreso) {
        jugador.position.x = 50;
        jugador.body.velocity.x = 0;
        deRegreso = false;
        caminando = false;
    }

    // Verificar si se activa el modo automatico y puede o no saltar
    if( modoAuto == true  && jugador.body.onFloor()) {
        if( datosDeEntrenamiento( [despBala , velocidadBala] )  ){
            saltar();
        }
    }
    
    // Verificar si se activa el modo automatico y puede o no moverse
    if( modoAuto == true  && !caminando) {
        if( datosDeEntrenamiento2( [desp2Bala , velocidadBala1] )  ){
            moverizquierda();
        }
    }

    // Verificar si esta en modo automatico y debe regresar a su posicion original.
    if (modoAuto == true && jugador.position.x == 0 && caminando) {
        jugador.body.velocity.x = 150;
        deRegreso = true;
    }
    // Verificar si esta en modo automatico y esta en su posicion original
    if (modoAuto == true && jugador.position.x == 50 && deRegreso) {
        jugador.position.x = 50;
        jugador.body.velocity.x = 0;
        deRegreso = false;
        caminando = false;
    }
    
    if( balaD==false ){
        disparo();
    }

    // validacion del segundo disparo
    if( balaf==false ){
        disparo2();  
    }

    if( bala.position.x <= 0  ){
        resetVariables();
    }

    if( bala1.position.y >= 400  ){
        bala1.body.velocity.y = 0;
        bala1.position.y = h-380;
        balaf=false;
    }
    
    if( modoAuto ==false  && bala.position.x > 0 ){

        datosEntrenamiento.push({
                'input' :  [despBala , velocidadBala],
                'output':  [estatusAire ]  
        });

        console.log("Bala " + despBala, + " " + velocidadBala, + " "+ estatusAire);
   }

   if( modoAuto ==false  && bala1.position.y < 400 ){

        datosEntrenamiento2.push({
                'input' :  [desp2Bala , velocidadBala1],
                'output':  [estatusCamina ]
         });
    
        console.log("Bala1 " + desp2Bala, + " " +velocidadBala1, + " "+ estatusCamina);

    }
    
}


function disparo(){
    velocidadBala =  -1 * velocidadRandom(300,800);
    bala.body.velocity.y = 0 ;
    bala.body.velocity.x = velocidadBala ;
    balaD=true;
}

function disparo2(){
   // velocidadBala1 =  -1 * velocidadRandom(300,800);
    bala1.body.velocity.x = 0 ;
    balaf=true;
}

function colisionH(){
    pausa();
}

function velocidadRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function render(){

}
