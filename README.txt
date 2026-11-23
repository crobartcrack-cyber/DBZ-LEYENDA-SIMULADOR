DBZ LEYENDA — VERSION CON CATÁLOGO Y FILTROS
==============================================

CATÁLOGO
- Incluye data/cartas_exp1.json con 129 cartas.
- La carpeta assets/cards/ no se incluye en este ZIP por decisión del proyecto: contiene únicamente las imágenes de las cartas y ocupa mucho espacio.
- El código conserva la ruta esperada ./assets/cards/<ID>.png o .jpg. Al colocar la carpeta de imágenes en esa ubicación, las imágenes se cargan con el sistema existente.
- Si falta una imagen, se muestra una ficha de reemplazo; esto no modifica los datos de la carta.

FILTROS DEL CONSTRUCTOR
- ESFERA: filtra por el valor ESFERA (1 a 7).
- TIPO DE CARTA: filtra por ATAQUE, HABILIDAD, MODIFICADORA, INSTANTANEA o ESFERAS DEL DRAGON. Las cartas con varios tipos aparecen al seleccionar cualquiera de sus tipos.
- NUMERO / ID: busca por coincidencia numérica en el ID.
- ORDENAR POR: orden del catálogo, ID, ATAQUE, DEFENSA o ESFERA.
- ORDEN: menor a mayor o mayor a menor.
- Los filtros se pueden combinar. LIMPIAR restablece todos los controles.
- Al ordenar por ataque o defensa, las cartas que no tengan ese atributo quedan al final.

SISTEMA DE MAZOS
- Se permiten tantos mazos como el almacenamiento local del navegador admita.
- La pantalla de administración permite crear, editar, duplicar, eliminar y seleccionar mazos.
- Se puede configurar un mazo de rival independiente. Si se desactiva, el rival utiliza una copia del mazo del jugador.
- Los cambios en las cartas se guardan automáticamente al agregar o quitar una carta, no solamente al salir del editor.
- El juego exige un mínimo de 40 cartas para el mazo del jugador y, si está activado, también para el mazo personalizado del rival.
- La selección y los mazos se guardan en localStorage bajo la clave dbz-leyenda:mazos:v1.
- La persistencia es local a cada navegador/dispositivo; no existe sincronización entre PC y móvil.
- El almacenamiento disponible depende del navegador y puede limitar la cantidad de mazos.

CÓMO EJECUTAR
No abrir index.html directamente con file://, porque el navegador puede bloquear fetch() del catálogo.
Ejecutar desde un servidor estático local, por ejemplo:
  python -m http.server 8000
y abrir:
  http://localhost:8000

PRUEBAS Y LIMITACIONES
- Se comprobó la sintaxis de todos los módulos JavaScript.
- Se comprobó que el catálogo JSON contiene 129 cartas y que las propiedades usadas por los filtros existen.
- Se comprobó la unicidad de los IDs HTML.
- No se pudo completar una prueba interactiva de navegador en este entorno por una restricción del navegador de pruebas.
- Las imágenes no se incluyen en este ZIP deliberadamente; deben estar en assets/cards/ en la instalación donde se ejecuta el juego.

ACTUALIZACION DE INTERFAZ (23-11-2026)
- El menú de opciones durante el combate incluye un interruptor para activar y salir de pantalla completa.
- El estado del interruptor se sincroniza con los cambios de pantalla completa del navegador y muestra avisos si la función no está disponible o el navegador la rechaza.
- Se corrigió la vista del editor de mazos: al abrir un mazo se oculta el panel de selección de modo de juego y queda visible el constructor con su catálogo.
- Al volver desde el editor se restaura la pantalla de administración de mazos.
