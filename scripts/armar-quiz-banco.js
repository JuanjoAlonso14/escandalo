// Arma js/quiz-banco.js con 100 preguntas por nivel (1–5), mezclando las existentes + nuevas.
//   node scripts/armar-quiz-banco.js
const fs = require("fs");
const path = require("path");
const existente = JSON.parse(fs.readFileSync(path.join(__dirname, "_quiz-existente.json"), "utf8"));

/** @type {Record<number, {t:string,v:boolean,r:string,e:string}[]>} */
const extra = { 1: [], 2: [], 3: [], 4: [], 5: [] };

function add(n, v, t, r, e) { extra[n].push({ n, t, v, r, e }); }

// ——— Nivel 1: básicos ———
[
  [true, "El Ultimate es un deporte de equipo.", "Introducción", "Se juega entre dos equipos que se enfrentan en el campo."],
  [false, "El Ultimate se juega 1 contra 1.", "5.1", "Es un deporte de equipo: 7 contra 7 en campo (5 contra 5 en playa)."],
  [true, "Para empezar el punto, la defensa lanza el disco hacia el ataque.", "7", "Ese saque se llama pull."],
  [false, "El ataque es quien hace el pull al inicio del punto.", "7 / 4.5.3", "El pull lo hace la defensa."],
  [true, "Si el disco cae al piso sin que el ataque lo tenga, cambia la posesión.", "13.1", "Eso es un turnover."],
  [false, "Si el disco cae, el mismo equipo sigue atacando siempre.", "13.1", "Si toca el suelo sin posesión del ataque, el otro equipo toma el disco."],
  [true, "No podés correr mientras tenés el disco.", "18.2", "Tenés que pivotar y pasar."],
  [false, "Podés driblar el disco como en básquet.", "Introducción / 18.2", "No existe dribling: se pasa o se pivotea."],
  [true, "El respeto al rival forma parte del juego.", "1", "Se llama Espíritu de Juego."],
  [false, "Ganar justifica cualquier falta no cantada a propósito.", "1.6", "Esconder infracciones va contra el Espíritu de Juego."],
  [true, "Un gol se anota atrapando el disco en la zona de gol rival.", "14.1", "Hace falta una recepción válida ahí."],
  [false, "Metés gol pateando el disco al arco.", "14.1", "No hay arco: se anota atrapando un pase en la zona de gol."],
  [true, "Los jugadores cobran sus propias faltas.", "1.1 / 15.4", "Es un deporte autoarbitrado."],
  [false, "Siempre hay un árbitro central que pita todo.", "1.1", "En el reglamento WFDF básico no hay árbitros obligatorios."],
  [true, "La marca puede contar hasta diez.", "9.1", "Si llega a decir “diez” antes de que sueltes, es stall-out."],
  [false, "La marca cuenta hasta veinte.", "9.1", "El conteo va del uno al diez."],
  [true, "Después de un gol hay cambios libres antes del siguiente punto.", "5.3", "Se pueden cambiar jugadores ilimitadamente entre puntos."],
  [false, "No se puede cambiar a nadie en todo el partido.", "5.3", "Entre puntos los cambios son libres."],
  [true, "Podés pasar el disco para atrás.", "Introducción", "El pase puede ir en cualquier dirección."],
  [false, "Solo se puede progresar pasando hacia la zona de gol.", "Introducción", "Los pases atrás y laterales son legales."],
  [true, "El mínimo de jugadores en campo por equipo es 5.", "5.1", "El máximo es 7."],
  [false, "Hace falta tener 15 jugadores en el campo para empezar.", "5.1", "Son 7 por lado (mínimo 5)."],
  [true, "Pedir un pase al rival es antideportivo.", "1.6.6", "Viola el Espíritu de Juego."],
  [false, "Engañar al rival mintiendo sobre una regla está bien si ayuda a ganar.", "1.5 / 1.6", "Hay que ser honesto con las reglas y las llamadas."],
  [true, "El tiempo muerto se pide haciendo una T con las manos.", "20.1", "Y avisando “tiempo muerto”."],
  [false, "El tiempo muerto dura 5 minutos.", "20.2 / 20.3", "Dura 75 segundos."],
  [true, "En mixta suele jugarse con proporción 4:3.", "5.4", "Y se alterna entre puntos."],
  [false, "En mixta siempre hay 7 hombres en cancha.", "5.4", "La proporción de género está regulada (p. ej. 4:3)."],
  [true, "Felicitar una buena jugada del rival es buen espíritu.", "1.5.3", "Es un ejemplo clásico del reglamento."],
  [false, "Burlarse del rival después de un gol es parte de la cultura del Ultimate.", "1.6.4", "Las celebraciones irrespetuosas están mal vistas y violan el espíritu."],
  [true, "Quien anota pasa a defender el punto siguiente.", "4.5.3", "Y por eso hace el pull."],
  [false, "Quien anota sigue atacando de corrido como en rugby.", "4.5.3", "Se invierten los roles tras cada gol."],
  [true, "El partido reglamentario se juega a 15 goles.", "4.2", "Gana el primero que llega a 15."],
  [false, "El partido reglamentario se juega a 50 goles.", "4.2", "El objetivo estándar es 15."],
  [true, "La media parte llega al llegar a 8 goles un equipo.", "4.3", "Ahí se corta el partido en dos mitades."],
  [false, "No existe media parte en Ultimate.", "4.3", "Sí: cuando un equipo marca 8 por primera vez."],
  [true, "Entregar el disco en la mano a un compañero es pérdida.", "13.2.3", "Se llama handover y es turnover."],
  [false, "Podés pasarle el disco tocando las manos como en basquet si no hay marca.", "13.2.3", "El disco tiene que volar: la entrega es ilegal."],
  [true, "Hay que mantener la captura para que cuente la recepción.", "12 / 14", "Si no controlás el disco, no hay posesión."],
  [false, "Alcanza con rozar el disco para que sea recepción.", "12.1", "Hace falta controlar un disco que no esté girando."],
  [true, "El campo tiene dos zonas de gol, una en cada extremo.", "2", "Se ataca una y se defiende la otra."],
  [false, "Se anota en un aro colgado como en basketball.", "2 / 14", "Se anota en una zona rectangular de gol."],
  [true, "Un contacto iniciado contra un rival puede ser falta.", "12.6 / 17", "El Ultimate es sin contacto."],
  [false, "Los bloqueos con el cuerpo tipo básquet son legales.", "12.6 / 12.7", "Obstruir o cargar al rival no está permitido."],
  [true, "Si no hay acuerdo en una jugada, se vuelve al último lanzador claro.", "1.12", "Es la resolución cuando no se ponen de acuerdo."],
  [false, "Si no hay acuerdo, gana siempre el equipo local.", "1.12", "No: se vuelve al último lanzador no disputado."],
  [true, "El lanzador establece un pie de pivote.", "18.2", "Ese pie fija su posición."],
  [false, "El lanzador puede ir caminando con el disco si mira a la marca.", "18.2", "No puede caminar/correr con el disco."],
  [true, "Decir “falta” es la forma de cantar una falta.", "15.4", "Lo hace quien la recibió."],
  [false, "Cualquiera de la banda puede cobrar faltas de los que están adentro.", "15.4", "La falta la canta el jugador involucrado."],
  [true, "El pull inicia cada punto.", "7", "Es el saque de la defensa."],
  [false, "Cada punto empieza con un saque de córner.", "7", "Empieza con el pull."],
  [true, "Podés retractarte si cantaste una falta mal.", "1.5", "Corregirse es buen espíritu."],
  [false, "Una vez cantada una falta, nunca se puede retirar.", "1.5", "Retirar una llamada equivocada es correcto."],
  [true, "El disco es el implemento oficial del juego.", "Introducción", "Sin disco no hay Ultimate."],
  [false, "Se puede jugar un partido oficial con una pelota de tenis.", "Introducción", "El reglamento asume un disco volador."],
  [true, "Los equipos se alinean antes del pull.", "7.3", "Ataque y defensa tienen posiciones iniciales."],
  [false, "El ataque puede salir corriendo a mitad de campo antes del pull sin restricciones.", "7.3", "Hay reglas de alineación y offside."],
  [true, "Gritarle insultos al marcador está mal.", "1.6", "Es falta de espíritu / conducta antideportiva."],
  [false, "Si te están marcando fuerte, podés empujarlo para hacerte espacio.", "12.6", "Iniciar contacto es falta."],
].forEach(([v, t, r, e]) => add(1, v, t, r, e));

// ——— Nivel 2 ———
[
  [true, "Las líneas perimetrales no forman parte del campo.", "2.3 / 11.1", "Pisar la línea es estar fuera."],
  [false, "Pisar la línea lateral cuenta como dentro.", "11.1", "La línea es fuera de límites."],
  [true, "La línea de gol es parte de la zona central.", "2.4", "No forma parte de la zona de gol."],
  [false, "La línea de gol cuenta como zona de gol.", "2.4", "Es parte del playing field proper central."],
  [true, "La marca cuenta solo si está a menos de 3 metros del pivote.", "9.3.2", "Si se aleja, reinicia."],
  [false, "La marca puede contar desde mitad de cancha.", "9.3.2", "Tiene que estar cerca del pivote (< 3 m)."],
  [true, "Stall-out es pérdida de posesión.", "13.2.2", "Si llegan a “diez” antes de que sueltes."],
  [false, "Stall-out solo advierte: seguís con el disco.", "13.2.2", "Es turnover."],
  [true, "Recepción simultánea ataque-defensa: se queda el ataque.", "12.3", "El ataque conserva la posesión."],
  [false, "Recepción simultánea: se queda la defensa.", "12.3", "Es al revés: posee el ataque."],
  [true, "Contacto menor yendo al mismo punto no siempre es falta.", "12.8", "Hay que minimizarlo, pero no todo roce es falta."],
  [false, "Cualquier roce en un salto compartido es falta automática.", "12.8", "El contacto menor incidental no necesariamente lo es."],
  [true, "Ir al disco no justifica iniciar contacto.", "12.6.1", "Nunca hay justificación para iniciar contacto."],
  [false, "Si vas al disco podés cargar al rival.", "12.6.1", "Eso es falta."],
  [true, "La defensa no puede tocar el pull antes que el ataque o el suelo.", "7.7", "Si lo toca, es infracción."],
  [false, "Un defensor puede interceptar el pull en el aire libremente.", "7.7", "No puede tocar el pull antes."],
  [true, "Tocar el pull y no atraparlo es pull caído.", "7.8", "Turnover para el ataque."],
  [false, "Si tocás el pull y se cae, lo podés levantar igual.", "7.8", "Pierden la posesión."],
  [true, "Antes del pull el ataque pone un pie en su línea de gol.", "7.3", "Y no se reordenan hasta el saque."],
  [false, "Antes del pull el ataque puede estar en cualquier lado del campo.", "7.3", "Deben alinearse en su línea de gol."],
  [true, "El brick se señaliza con el brazo bien arriba.", "7.12", "Antes de levantar el disco."],
  [false, "El brick se pide pisando el disco.", "7.12", "Se señaliza con el brazo extendido."],
  [true, "El disco puede volar fuera y volver sin salir de juego.", "11.7", "Sale cuando toca fuera o a un atacante fuera."],
  [false, "Si el disco cruza la línea en el aire ya es out.", "11.7", "En el aire puede volver; importa el contacto con fuera."],
  [true, "Captura implica controlar un disco que no gira.", "12.1", "No alcanza con un toque."],
  [false, "Un tip sin control ya es recepción.", "12.1", "Hace falta establecer posesión."],
  [true, "Autopase es turnover.", "13.2.5", "No podés tirar y atrapar vos solo."],
  [false, "Autopase es legal si nadie te marca.", "13.2.5", "Es ilegal siempre."],
  [true, "Travel no detiene el juego como una falta.", "18.2.5", "Se corrige el pivote y se sigue."],
  [false, "Todo travel congela el juego automáticamente.", "18.2.5", "Es una infracción que no detiene igual que una falta."],
  [true, "Los de la banda no deberían meterse en discusiones.", "1.10.2", "Salvo roles específicos (p. ej. capitanes según contexto)."],
  [false, "Toda la bancada puede votar cómo se resuelve una jugada.", "1.10.2", "Deciden quienes jugaron/vieron la jugada."],
  [true, "Sangrado requiere parada técnica.", "19.2.1", "Hay un tiempo para resolverlo."],
  [false, "Podés seguir jugando sangrando sin problema reglamentario.", "19.2.1", "Hay que atender la herida."],
  [true, "Un tip del defensor no es turnover por sí solo.", "12 / 13", "Importa quién posee después."],
  [false, "Si la defensa toca el disco, automáticamente es de ellos.", "13", "Solo si establecen posesión o el ataque pierde el disco al piso, etc."],
  [true, "Layout limpio al disco es legal.", "12", "Si no hay contacto ilegal ni peligro."],
  [false, "Todo layout es falta porque es peligroso.", "17.1", "El peligro se cobra si el juego es peligroso; un layout limpio vale."],
  [true, "Después de turnover en zona de gol hay más tiempo de pivote.", "8.5", "20 s en zona de gol, 10 s en central."],
  [false, "El pivote siempre hay que ponerlo en 3 segundos.", "8.5", "Los plazos son 10 o 20 segundos según la zona."],
  [true, "Solo la marca cuenta el stall.", "9.3", "Con las condiciones de distancia."],
  [false, "Un compañero desde la banda puede llevar el conteo oficial.", "9.3", "Cuenta la marca."],
  [true, "Poach defensivo es legal si no hay infracción.", "Introducción", "Dejar una marca para ayudar es táctica."],
  [false, "Cambiar de marca está prohibido.", "Introducción", "No está prohibido por sí solo."],
  [true, "Contestar un travel abre la discusión.", "15", "Se puede no estar de acuerdo y resolver."],
  [false, "El travel no se puede contestar nunca.", "15", "Como otras infracciones, se puede discutir."],
  [true, "Handover es turnover aunque ambos estén quietos.", "13.2.3", "El disco tiene que ser pasado, no entregado."],
  [false, "Handover vale en la zona de gol.", "13.2.3", "Es ilegal en todo el campo."],
  [true, "El receptor que salta de adentro y cae afuera pierde la recepción.", "11.3 / 11.4", "Su estado al aterrizar define si está out."],
  [false, "Si saltaste de adentro, aunque caigas afuera la recepción vale.", "11.3", "Al caer fuera estás fuera."],
  [true, "Espacio de disco: la marca no puede estar demasiado cerca del pivote.", "18.1.1.3", "Menos de un diámetro de disco es infracción (salvo causa del lanzador)."],
  [false, "La marca puede pegarse al cuerpo del lanzador sin límite.", "18.1.1.3", "Hay distancia mínima (disco space)."],
  [true, "Un pase al piso incompleto es turnover donde cayó.", "13.1", "La nueva ofensiva juega desde ahí."],
  [false, "Un pase al piso vuelve al lanzador automáticamente.", "13.1", "Es pérdida de posesión."],
  [true, "El ataque elige brick o el punto de salida en varios pulls out.", "7.12", "Es una elección del ataque."],
  [false, "El brick lo elige siempre la defensa.", "7.12", "Lo pide/elige el ataque."],
  [true, "Juego peligroso puede ser falta sin contacto.", "17.1.1", "No hace falta tocarse."],
  [false, "Sin contacto nunca hay falta.", "17.1.1", "El juego peligroso no requiere contacto."],
].forEach(([v, t, r, e]) => add(2, v, t, r, e));

// ——— Nivel 3 ———
[
  [true, "Cualquier defensor puede cantar travel.", "15.5.1", "No solo la marca."],
  [false, "Solo la marca puede cantar travel.", "15.5.1", "Cualquier defensor puede."],
  [true, "Doble marca: segundo defensor <3 m sin marcar a otro.", "18.1.1.5", "Si marca a otro atacante, no es double team."],
  [false, "Pasar cerca del pivote siempre es doble marca.", "18.1.1.5", "Hay que estar a menos de 3 m y sin marcar a otro."],
  [true, "Cualquier atacante puede cantar doble marca.", "15.5.1", "No solo el lanzador."],
  [false, "Solo el lanzador canta double team.", "15.5.1", "Cualquier atacante puede."],
  [true, "Turnover en zona central: 10 s para el pivote.", "8.5.1.1", "Desde que el disco se detiene."],
  [false, "Turnover en zona central: 30 s para el pivote.", "8.5.1.1", "Son 10 segundos."],
  [true, "Durante el punto solo el lanzador pide tiempo muerto.", "20.3", "Después del pull."],
  [false, "Cualquier atacante pide tiempo muerto a mitad del punto.", "20.3", "Solo el lanzador con el disco."],
  [true, "Faltas compensatorias: vuelve al último lanzador no disputado.", "17.9.1", "Cuando ambas se aceptan en la misma jugada."],
  [false, "Faltas compensatorias: el disco queda donde cayó.", "17.9.1", "Vuelve al último lanzador claro."],
  [true, "Strip aceptado en gol: se concede el gol.", "17.3.2", "Excepción importante del strip."],
  [false, "Strip en la zona de gol nunca puede dar gol.", "17.3.2", "Si hubiera sido gol, se concede."],
  [true, "Juego peligroso no necesita contacto.", "17.1.1", "La peligrosidad basta."],
  [false, "Juego peligroso solo existe con contacto.", "17.1.1", "Puede cobrarse sin contacto."],
  [true, "Podés pivotar en cualquier dirección con el pivote fijo.", "18.2.2", "El pivote no se levanta."],
  [false, "Solo se puede pivotar hacia la zona de gol.", "18.2.2", "Cualquier dirección es válida."],
  [true, "Atrapando al correr: hasta dos apoyos más sin cambiar dirección ni acelerar.", "18.2.1.1", "Para soltar un pase legal."],
  [false, "Atrapando al correr podés seguir 10 pasos si tirás.", "18.2.1.1", "Como máximo dos apoyos adicionales con condiciones."],
  [true, "Stall-out contestado: se retoma en 8.", "9.5.3", "“Contando ocho”."],
  [false, "Stall-out contestado: se retoma en 1.", "9.5.3", "Se retoma en 8."],
  [true, "Incumplimiento defensivo aceptado: conteo desde 1.", "9.5.1", "Reinicio completo para el ataque."],
  [false, "Incumplimiento defensivo aceptado: conteo en 9.", "9.5.1", "Vuelve a “Contando uno”."],
  [true, "Pick: conteo como máximo en 6.", "9.5.5", "Como muchas otras llamadas."],
  [false, "Pick: conteo siempre en 1.", "9.5.5", "Máximo en 6."],
  [true, "En el aire conservás el estado hasta tocar suelo.", "11.3.1", "Dentro/fuera se define al aterrizar."],
  [false, "En el aire ya sos out si cruzaste la línea imaginaria.", "11.3.1", "Importa el contacto con el suelo/fuera."],
  [true, "Podés demorar hasta 2 s para cantar pick.", "18.3.1.1", "Para ver si afectó."],
  [false, "El pick se puede cantar al final del punto.", "18.3.1.1", "La demora máxima es corta (~2 s)."],
  [true, "Offside defensivo cobrado: se juega como brick.", "7.5.2", "El ataque deja caer y reanuda tipo brick."],
  [false, "Offside defensivo siempre rehace el pull.", "7.5.2", "El procedimiento indicado es jugarlo como brick."],
  [true, "Tiempo muerto sin tener: +2 al conteo.", "20.4", "Puede producir stall-out."],
  [false, "Tiempo muerto sin tener: expulsión.", "20.4", "La sanción es sumar 2 al conteo."],
  [true, "Wrapping: parte del defensor sobre el pivote.", "18.1.1.4", "Salvo que lo cause solo el lanzador."],
  [false, "Wrapping solo existe si hay contacto con la mano.", "18.1.1.4", "Es por la posición sobre el pivote."],
  [true, "Si el lanzador se mete encima de la marca, no es disco space del defensor.", "18.1.1.3", "Lo tiene que causar el defensor."],
  [false, "Cualquier cercanía es disco space del defensor.", "18.1.1.3", "Si la causa el lanzador, no."],
  [true, "Turnover en zona de gol: 20 s de pivote.", "8.5.1.2", "Más tiempo que en central."],
  [false, "Turnover en zona de gol: 5 s de pivote.", "8.5.1.2", "Son 20 segundos."],
  [true, "Tiempo muerto en el punto: sin cambios (salvo lesión).", "20.3.1", "No es un entrepunto."],
  [false, "Tiempo muerto en el punto: cambios libres.", "20.3.1", "No se permiten cambios libres."],
  [true, "Travel aceptado: el juego no se detiene.", "18.2.5", "Se corrige pivote y sigue."],
  [false, "Travel aceptado: siempre hay stoppage largo.", "18.2.5", "No detiene como una falta."],
  [true, "Falta indirecta: hasta 2 s para cantarla.", "17.8.1.1", "Para ver si afectó."],
  [false, "Falta indirecta: solo en el instante exacto o no vale.", "17.8.1.1", "Hay una demora breve permitida."],
  [true, "Incumplimiento del ataque aceptado: conteo máx. en 9.", "9.5.2", "No vuelve a 1."],
  [false, "Incumplimiento del ataque aceptado: conteo en 1.", "9.5.2", "Se retoma como máximo en 9."],
  [true, "Sangrado: 70 segundos.", "19.2.1.2", "Si no, cambio o tiempo muerto."],
  [false, "Sangrado: 10 minutos.", "19.2.1.2", "Son 70 segundos."],
  [true, "Tras tiempo muerto el lanzador es el mismo.", "20.3.3", "No podés cambiar quién tiene el disco."],
  [false, "Tras tiempo muerto puede tirar cualquiera.", "20.3.3", "Sigue el mismo lanzador."],
  [true, "Tras tiempo muerto primero se ubica el ataque.", "20.3.4 / 20.3.5", "Después la defensa."],
  [false, "Tras tiempo muerto primero se ubica la defensa.", "20.3.4 / 20.3.5", "Primero atacantes."],
  [true, "Tip a un compañero puede ser recepción válida.", "12", "Si alguien establece posesión."],
  [false, "Tippear a un compañero es siempre handover.", "13.2.3", "Handover es entregar sin que vuele; un tip en el aire es distinto."],
  [true, "Si la marca se aleja >3 m, reinicia el conteo.", "9.3.2", "No puede seguir desde el número anterior."],
  [false, "Si la marca se aleja y vuelve, sigue el número.", "9.3.2", "Debe reiniciar."],
].forEach(([v, t, r, e]) => add(3, v, t, r, e));

// ——— Nivel 4 ———
[
  [true, "Strip requiere disco ya controlado.", "17.3", "Si todavía no había captura, no es strip."],
  [false, "Strip se canta en cualquier tip del defensor.", "17.3", "Es hacer soltar un disco atrapado."],
  [true, "Falta ofensiva aceptada en recepción de gol: no hay gol.", "17.2 / 17.6", "Es turnover / se anula el gol."],
  [false, "Falta ofensiva en el endzone igual da gol si atrapó.", "17", "Si se acepta la falta ofensiva, no hay gol."],
  [true, "Falta defensiva en intento de recepción: receptor con disco.", "17.2.2", "Salvo excepciones."],
  [false, "Falta defensiva en recepción incompleta: siempre rehace el pull.", "17.2", "Se otorga posesión al receptor ofendido."],
  [true, "No se puede contar con el disco muerto.", "9.3", "El disco tiene que estar en juego."],
  [false, "Se puede empezar a contar en cuanto el rival suelta el disco al piso.", "9.3", "Hace falta que esté en juego y haya marca legal."],
  [true, "Con disco en el aire tras una llamada, se sigue hasta la posesión.", "15.7", "Después se resuelve."],
  [false, "Con disco en el aire tras una llamada, todos se detienen en el acto.", "15.7", "Se juega hasta establecer posesión."],
  [true, "Gol válido aunque después salgas de la zona de gol.", "14.1 / 14.2", "Importa dónde estableciste posesión."],
  [false, "Si celebrás saliendo del endzone se anula el gol.", "14", "Salir después no anula la posesión ya establecida."],
  [true, "Defensor <3 m marcando a otro no es doble marca.", "18.1.1.5", "Tiene que no estar marcando a nadie."],
  [false, "Dos defensores cerca del pivote siempre es double team.", "18.1.1.5", "Depende de si el segundo marca a alguien."],
  [true, "Pick requiere estar a ≤3 m del atacante marcado.", "18.3.1", "Si estás lejos, no es pick."],
  [false, "Pick se canta desde cualquier distancia.", "18.3.1", "Hay requisito de proximidad."],
  [true, "Tardar de más en el pivote se puede cobrar.", "8.5 / 15", "Es una violation de tiempo."],
  [false, "El pivote se puede demorar sin límite.", "8.5", "Hay plazos de 10/20 s."],
  [true, "Travel del interceptor no devuelve el disco al lanzador previo.", "18.2.5 / 13", "El turnover ya pasó; se corrige pivote."],
  [false, "Travel tras intercepción anula el turnover.", "13 / 18", "No vuelve automáticamente al lanzador anterior."],
  [true, "Playa: 5 contra 5.", "Apéndice / 5.1", "Campo completo es 7."],
  [false, "Playa: 7 contra 7 igual que césped.", "Apéndice", "En playa es 5 vs 5."],
  [true, "Brick hay que señalizarlo antes de levantar el disco.", "7.12", "Si no, no cuenta como pedido a tiempo."],
  [false, "Podés pedir brick después de caminar 10 metros con el disco.", "7.12", "La señal es previa a recogerlo."],
  [true, "Fast count se puede cantar si acelera el ritmo.", "9.1 / 18.1", "Menos de un segundo entre números."],
  [false, "La marca puede contar a velocidad libre.", "9.1", "Mínimo un segundo entre números."],
  [true, "Defensor puede jugar el disco desde fuera.", "11.2", "Los defensores se consideran in-bounds."],
  [false, "Defensor con un pie fuera no puede tocar el disco.", "11.2", "La defensa no queda out como el ataque."],
  [true, "Bobblear y después controlar puede ser captura.", "12.1", "La posesión se establece al controlar."],
  [false, "Si el disco te rebota en la mano ya no podés atraparlo.", "12.1", "Podés terminar de controlar después del bobble."],
  [true, "Offside hay que cantarlo para que se aplique.", "7.5 / 15", "Si nadie lo cobra, el punto sigue."],
  [false, "El offside se autoaplica aunque nadie diga nada.", "15", "Hace falta la llamada."],
  [true, "Marcaje con brazos es legal sin wrapping ni disco space.", "18.1", "Respetá las restricciones de marcaje."],
  [false, "Levantar los brazos para marcar es siempre wrapping.", "18.1.1.4", "Wrapping es estar sobre el pivote."],
  [true, "Capitán de banda no canta faltas ajenas.", "15.4", "Las canta quien las recibe."],
  [false, "El capitán puede pitar faltas por sus jugadores.", "15.4", "No reemplaza al jugador involucrado."],
  [true, "Pull tocado por defensa antes de tiempo es infracción.", "7.7", "Aunque el disco “quede bien”."],
  [false, "La defensa puede tippear el pull si cae en brick.", "7.7", "No pueden tocarlo antes."],
  [true, "Tras brick, con pivote y marca legal se puede contar.", "9.3", "El disco queda en juego."],
  [false, "Tras brick hay 30 segundos sin conteo obligatorio.", "9.3", "Se aplica el conteo normal cuando corresponde."],
  [true, "Falta y travel juntos no se resuelven solo por quién gritó primero.", "15 / 17 / 18", "Importa el tipo de infracción y la posesión."],
  [false, "Siempre prevalece la primera palabra cantada.", "15", "No es un criterio único del reglamento."],
  [true, "Pick demorado más de ~2 s es tarde.", "18.3.1.1", "Hay una ventana corta."],
  [false, "Pick se puede guardar para el final de la jugada larga.", "18.3.1.1", "La demora máxima es breve."],
  [true, "Handover ilegal en todo el campo.", "13.2.3", "También en endzone."],
  [false, "En la zona de gol el handover es legal.", "13.2.3", "No lo es."],
  [true, "Autopase ilegal aunque toque el piso primero (es turnover igual).", "13", "Piso = turnover; atraparlo vos no lo salva como autopase legal."],
  [false, "Si el autopase pica primero, se vuelve legal.", "13.2.5", "El piso ya mató la posesión del ataque."],
  [true, "Ratio mixta no se cambia libremente a mitad del punto.", "5.4", "Se define para el punto."],
  [false, "En mixta podés meter 7 del mismo género si querés.", "5.4", "La proporción está regulada."],
  [true, "Strip es distinto de tip.", "17.3 / 12", "Strip = soltar disco ya atrapado."],
  [false, "Todo contacto con el disco del receptor es strip.", "17.3", "Tiene que haber habido posesión previa."],
  [true, "Receptor a horcajadas sobre la línea de gol: no es gol.", "14.1 / 2.4", "Todos los apoyos deben estar en la zona de gol."],
  [false, "Un pie en zona de gol alcanza para el gol.", "14.1", "Todos los apoyos en contacto con el suelo deben estar en la zona de gol."],
  [true, "Conteo audible obligatorio.", "9.1", "El lanzador tiene que poder oírlo."],
  [false, "Conteo susurrado es válido si hay costumbre.", "9.1", "Debe ser audible."],
  [true, "Atacante fuera que toca el disco: disco out.", "11.7", "Aunque después caiga adentro."],
  [false, "Atacante fuera puede tippear el disco hacia adentro legalmente.", "11.4 / 11.7", "Su contacto desde fuera saca el disco."],
  [true, "Spirit timeout no es un timeout libre de cualquiera a mitad del punto.", "1 / Apéndice", "Tiene procedimientos específicos."],
  [false, "Cualquiera pide spirit timeout cuando quiere como un timeout normal.", "Apéndice", "No funciona así."],
  [true, "Travel aceptado corrige pivote; no premia reinicio a 1 automático.", "18.2.5 / 9.5", "El juego continúa."],
  [false, "Todo travel aceptado pone el conteo en 1.", "9.5", "No es el efecto automático del travel."],
  [true, "Gol lo define el receptor en la zona de gol, no el pivote del lanzador.", "14.1", "El lanzador puede estar en central."],
  [false, "Para anotar el lanzador también debe estar en la zona de gol.", "14.1", "Solo importa la recepción en la zona."],
  [true, "Blocking ilegal: moverse solo para tapar el camino del rival.", "12.7 / 17", "Sin jugar el disco."],
  [false, "Cortar el camino del rival siempre es legal si no lo tocás.", "12.7", "Obstruir el movimiento puede ser falta."],
].forEach(([v, t, r, e]) => add(4, v, t, r, e));

// ——— Nivel 5 ———
[
  [true, "Stall-out contestado reiterado sigue retomando en 8.", "9.5.3", "Cada vez."],
  [false, "El segundo stall-out contestado se retoma en 5.", "9.5.3", "Sigue siendo 8."],
  [true, "Estado en el aire se define al aterrizar.", "11.3.1", "Hasta entonces conservás el estado previo."],
  [false, "Cruzar la línea en el aire ya te hace out.", "11.3.1", "Importa el primer contacto con el suelo/fuera."],
  [true, "Faltas compensatorias no dejan el disco “donde estaba en el aire”.", "17.9.1", "Vuelven al último lanzador no disputado."],
  [false, "Faltas compensatorias: posesión donde iba a caer el disco.", "17.9.1", "Se vuelve al lanzador previo claro."],
  [true, "Infracción de marcaje aceptada no siempre reinicia en 1.", "9.5", "A veces máx. en 6."],
  [false, "Toda infracción de marcaje pone el conteo en 1.", "9.5", "Depende del tipo."],
  [true, "Tocar el disco primero no limpia un layout ilegal.", "17.1 / 12.6", "El contacto ilegal sigue siendo falta."],
  [false, "Si tocás el disco antes que al rival, el contacto posterior es legal.", "12.6", "No justifica iniciar contacto."],
  [true, "Bobble + control final puede ser captura.", "12.1", "La posesión se establece al controlar."],
  [false, "Un bobble anula siempre la jugada.", "12.1", "Podés terminar de atrapar."],
  [true, "Brick tarde (disco ya en mano) no vale.", "7.12", "Señal antes de levantarlo."],
  [false, "Brick se puede pedir en cualquier momento del punto.", "7.12", "Es una opción tras ciertos pulls, a tiempo."],
  [true, "Señalizar el conteo con la mano es opcional.", "9.1", "Lo obligatorio es el conteo audible."],
  [false, "Sin gestos con la mano el conteo es inválido.", "9.1", "No es un requisito."],
  [true, "Spirit captain no anula faltas de sus compañeros.", "15.4 / 1", "La llamada es del jugador involucrado."],
  [false, "El spirit captain puede borrar cualquier falta del equipo.", "1", "No tiene ese poder."],
  [true, "Win-by-2 no es la regla general WFDF a 15.", "4.2", "Gana quien llega a 15; formatos de torneo pueden agregar universo."],
  [false, "14-14 siempre exige ganar por 2 en el reglamento básico.", "4.2", "Eso es regla de formato, no la general."],
  [true, "Handover ilegal aunque estén quietos.", "13.2.3", "Debe volar el disco."],
  [false, "Handover quieto es legal en stall 9.", "13.2.3", "Nunca es legal."],
  [true, "Wrapping causado solo por el lanzador no se cobra al defensor.", "18.1.1.4", "Misma lógica que disco space."],
  [false, "Si hay brazo sobre pivote siempre es wrapping del defensor.", "18.1.1.4", "Hay excepción si lo causa el lanzador."],
  [true, "Pick aceptado no “regala” la recepción automáticamente.", "18.3 / 15.7", "Se reubican / se resuelve según la regla."],
  [false, "Pick con disco en el aire = receptor se queda con el disco siempre.", "18.3", "No es automático."],
  [true, "Decir “diez” cuando el disco ya salió: no es stall-out.", "13.2.2", "Tiene que empezar “diez” antes del release."],
  [false, "Si “diez” y el release son al mismo tiempo, siempre es stall.", "13.2.2", "Debe soltar antes de que empiece a decirse “diez”."],
  [true, "Atrapar el pull en tu endzone no te da brick.", "7.8 / 7.12", "Si lo atrapás, poseés ahí."],
  [false, "Atrapar el pull en tu endzone permite brick igual.", "7.12", "Brick es para ciertos pulls no atrapados/out."],
  [true, "Doble llamada no se ordena solo por quién gritó primero.", "15 / 17", "Se mira el efecto sobre la posesión."],
  [false, "La primera llamada siempre cancela a la segunda.", "15", "No es la regla."],
  [true, "Disco space aceptado: conteo máx. en 6.", "9.5.4 / 9.5.5", "Como la mayoría."],
  [false, "Disco space aceptado: conteo en 1 siempre.", "9.5", "Máximo en 6."],
  [true, "Defensor out puede tocar el disco.", "11.2", "Se lo considera in-bounds."],
  [false, "Defensor con pie sobre la línea lateral no puede tippear.", "11.2", "Puede jugar el disco."],
  [true, "Continuation genérica pedida por cualquiera no existe.", "15 / 16", "Hay reglas específicas, no un comodín."],
  [false, "Cualquiera canta “continuation” y se ignora la falta.", "15", "No funciona así."],
  [true, "Lesión: el jugador puede tener que salir si no continúa.", "19", "No se queda “sí o sí”."],
  [false, "Toda parada técnica por lesión obliga a dejar al jugador dentro.", "19", "Puede requerir sustitución."],
  [true, "Pull out: pivote con plazos de 10 s en central.", "8.5 / 7", "No 20 s salvo zona de gol."],
  [false, "Pull out: siempre 20 s para poner el disco.", "8.5", "20 s es para zona de gol."],
  [true, "Falta compensatoria no fuerza conteo en 1 por sí sola.", "17.9.1 / 9.5", "Vuelve el disco al lanzador; el conteo sigue reglas de reanudación."],
  [false, "Falta compensatoria = stall count 1 automático.", "9.5", "No es esa la regla automática."],
  [true, "Travel no se “activa” solo: alguien debe cantarlo para cobrarse.", "15 / 18.2", "Como el resto de infracciones autoarbitradas."],
  [false, "Un travel existe aunque nadie lo diga y anula el pase solo.", "15", "Sin llamada, el juego sigue."],
  [true, "Universo/win-by-2 es típico de formatos, no del 4.2 puro.", "4.2", "El reglamento base es a 15."],
  [false, "El reglamento WFDF obliga universo en todo partido a 15.", "4.2", "No lo obliga como regla general."],
  [true, "Strip ≠ tip en el intento de recepción.", "17.3", "Strip es después de la captura."],
  [false, "Tip del defensor en la recepción es strip.", "17.3", "Si no había posesión, no es strip."],
  [true, "Offside de ataque y de defensa tienen procedimientos distintos.", "7.5", "No se resuelven igual."],
  [false, "Todo offside se resuelve igual sin importar quién se adelantó.", "7.5", "Ataque y defensa tienen tratamientos distintos."],
  [true, "Reanudar tras pick implica reubicación.", "18.3", "Se restaura el estado previo a la obstrucción."],
  [false, "Tras pick el juego sigue sin reubicar a nadie.", "18.3", "La idea del pick es reestablecer posiciones."],
  [true, "Conteo tras la mayoría de llamadas: máx. 6.", "9.5.5", "Con excepciones (p. ej. stall contestado en 8, ciertas en 1 o 9)."],
  [false, "Tras cualquier llamada el conteo vuelve siempre a 1.", "9.5", "Hay varios reinicios posibles."],
  [true, "Pivote en endzone propia tras turnover: 20 s.", "8.5.1.2", "Zona de gol."],
  [false, "Pivote en endzone propia tras turnover: 10 s.", "8.5.1.2", "En zona de gol son 20."],
  [true, "Un pase puede ser tippeado por varios y seguir vivo.", "12 / 13", "Hasta que alguien posea o toque el piso/out."],
  [false, "El segundo tip automático es turnover.", "12", "No hay esa regla."],
  [true, "Marcador que pierde distancia reinicia, no “pausá y seguí”.", "9.3.2", "Debe volver a empezar el conteo."],
  [false, "Marcador que se aleja puede volver y seguir en el mismo número.", "9.3.2", "Reinicia."],
  [true, "El lanzador del tiempo muerto indebido sufre +2 al stall.", "20.4", "Puede stall-out."],
  [false, "Tiempo muerto indebido solo advierte verbalmente.", "20.4", "Hay penalización de conteo."],
  [true, "Receptor con posesión en endzone: gol, aunque el defensor diga “no fue control”.", "14.1 / 12", "Si hubo captura real, es gol; se puede discutir el control."],
  [false, "El defensor puede anular un gol solo gritándolo más fuerte.", "1 / 14", "Se discute con criterios de posesión, no por volumen."],
].forEach(([v, t, r, e]) => add(5, v, t, r, e));

// Completar hasta 100 con paráfrasis controladas de hechos ya validados (misma verdad, otro enunciado)
function completar(n, faltan) {
  const base = [...existente[n], ...extra[n]];
  const out = [];
  let i = 0;
  const molds = [
    (p) => ({ ...p, t: p.v ? `Es correcto afirmar: ${p.t[0].toLowerCase()}${p.t.slice(1)}` : `Es correcto afirmar: ${p.t[0].toLowerCase()}${p.t.slice(1)}` }),
    (p) => ({ ...p, t: p.v ? `Según el reglamento: ${p.t[0].toLowerCase()}${p.t.slice(1)}` : `Según el reglamento: ${p.t[0].toLowerCase()}${p.t.slice(1)}` }),
    (p) => ({ ...p, t: `Verdadero o falso — ${p.t}` }),
  ];
  // Mejor: generar enunciados espejo invirtiendo verdad con negación explícita
  while (out.length < faltan && i < base.length * 3) {
    const p = base[i % base.length];
    const modo = Math.floor(i / base.length);
    i++;
    let t, v;
    if (modo === 0) {
      // Negación del enunciado → verdad invertida
      if (/^No |^Nunca |^Tampoco /i.test(p.t)) continue;
      t = p.v ? `No es cierto que ${p.t[0].toLowerCase()}${p.t.slice(1)}` : `No es cierto que ${p.t[0].toLowerCase()}${p.t.slice(1)}`;
      // Si p.v true, "No es cierto que [true statement]" is FALSE
      // If p.v false, "No es cierto that [false statement]" is TRUE (because the statement is false)
      v = !p.v;
      // Wait: p.t when p.v is false is a false claim. "No es cierto que [false claim]" = true.
      // p.t when p.v is true is a true claim. "No es cierto que [true claim]" = false.
      v = !p.v; // if p.v true, v=false; if p.v false, v=true. Correct: v = !p.v means...
      // p.v=true (statement true): "No es cierto que S" → false. We want v=false = !p.v. OK
      // p.v=false (statement false): "No es cierto que S" → true. We want v=true = !p.v. OK
    } else if (modo === 1) {
      t = `En el Ultimate WFDF, ${p.t[0].toLowerCase()}${p.t.slice(1)}`;
      v = p.v;
    } else {
      t = `Regla ${p.r}: ${p.t}`;
      v = p.v;
    }
    // evitar duplicar textos exactos
    if (base.some((x) => x.t === t) || out.some((x) => x.t === t)) continue;
    out.push({ n, t, v, r: p.r, e: p.e });
  }
  return out;
}

const final = [];
for (const n of [1, 2, 3, 4, 5]) {
  const merged = [];
  const seen = new Set();
  for (const p of [...existente[n], ...extra[n]]) {
    const k = p.t.trim().toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    merged.push({ n, t: p.t, v: p.v, r: p.r, e: p.e });
  }
  if (merged.length < 100) {
    for (const p of completar(n, 100 - merged.length)) {
      const k = p.t.trim().toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      merged.push(p);
      if (merged.length >= 100) break;
    }
  }
  // Si aún faltan, clonar con sufijo distintivo de contexto (último recurso)
  let guard = 0;
  while (merged.length < 100 && guard < 500) {
    guard++;
    const p = merged[guard % merged.length];
    const t = `${p.t} (${n}.${merged.length + 1})`;
    if (seen.has(t.toLowerCase())) continue;
    // En vez de sufijos feos, usar reformulación "Evaluá esta afirmación:"
    const t2 = `Evaluá esta afirmación: ${p.t}`;
    if (seen.has(t2.toLowerCase())) continue;
    seen.add(t2.toLowerCase());
    merged.push({ n, t: t2, v: p.v, r: p.r, e: p.e });
  }
  if (merged.length < 100) {
    console.error(`Nivel ${n}: solo ${merged.length}`);
    process.exit(1);
  }
  final.push(...merged.slice(0, 100));
  console.log(`Nivel ${n}: ${merged.length >= 100 ? 100 : merged.length}`);
}

const out = `// Banco del quiz de reglas: 100 preguntas por nivel. Generado por scripts/armar-quiz-banco.js
const PREGUNTAS = ${JSON.stringify(final, null, 0).replace(/"n":/g, "n:").replace(/"t":/g, "t:").replace(/"v":/g, "v:").replace(/"r":/g, "r:").replace(/"e":/g, "e:").replace(/\\"/g, '\\"')};
`;
// prettier-ish: write as JS array with readable lines
const lines = ["// Banco del quiz de reglas: 100 preguntas por nivel (sorteo en quiz.js).", "// Generado: node scripts/armar-quiz-banco.js", "const PREGUNTAS = ["];
for (const p of final) {
  const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  lines.push(`  { n: ${p.n}, t: "${esc(p.t)}", v: ${p.v}, r: "${esc(p.r)}", e: "${esc(p.e)}" },`);
}
lines.push("];");
fs.writeFileSync(path.join(__dirname, "..", "js", "preguntas.js"), lines.join("\n") + "\n");
console.log("OK js/preguntas.js", final.length);
