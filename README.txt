DBZ LEYENDA — VERSION CON CATÁLOGO Y FILTROS
==============================================

CATÁLOGO
- Incluye data/cartas_exp1.json con 129 cartas.
- La carpeta assets/cards/ no se incluye en este ZIP por decisión del proyecto: contiene únicamente las imágenes de las cartas y ocupa mucho espacio.
- El código conserva la ruta esperada ./assets/cards/<ID>.png o .jpg. Al colocar la carpeta de imágenes en esa ubicación, las imágenes se cargan con el sistema existente.
- Si falta una imagen, se muestra una ficha de reemplazo; esto no modifica los datos de la carta.

FILTROS DEL CONSTRUCTOR
- ESFERA: filtra por el valor ESFERA (1 a 7).
- TIPO DE CARTA: selección múltiple por ATAQUE, HABILIDAD, MODIFICADORA, INSTANTANEA o ESFERAS DEL DRAGON. Se pueden activar varios tipos; se muestran las cartas que coincidan con al menos uno, incluidas las cartas con TIPO en formato array, sin duplicados.
- BUSCAR: busca texto parcial en NOMBRE, TEXTO, DESCRIPCION, DESCRIPCION_CORTA y PERSONAJE, sin distinguir mayúsculas ni acentos.
- ORDENAR POR: orden del catálogo, ID, ATAQUE, DEFENSA o ESFERA.
- ORDEN: menor a mayor o mayor a menor.
- Los filtros se pueden combinar. MÁS FILTROS despliega ORDENAR POR, ORDEN y LIMPIAR sin perder selecciones al cerrarse. LIMPIAR restablece todos los controles.
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


ACTUALIZACION DE INTERFAZ (23-11-2026 · LIMPIEZA DEL CONSTRUCTOR)
- Se simplificó la pantalla de creación: se quitaron títulos y ayudas redundantes y se compactó la barra superior.
- El mazo construido conserva una zona propia y desplazable, con contador y progreso compactos.
- El catálogo ocupa el espacio restante y es la zona visual principal.
- Los filtros se compactaron para dejar más superficie a las cartas; se conservan esfera, tipo, orden y dirección.
- El campo BUSCAR reemplaza la búsqueda por ID y consulta el nombre y la descripción de la carta. La búsqueda ignora mayúsculas y acentos.
- El diseño ajusta la distribución en escritorio, móvil vertical y móvil horizontal.
- Se verificó que el HTML y el código no conservan referencias al antiguo filtro por número/ID.


ACTUALIZACION DE INTERFAZ (23-11-2026 · FILTROS Y OPCIONES)
- ORDENAR POR ahora utiliza correctamente los campos JSON ID, ATAQUE, DEFENSA y ESFERA; la dirección ascendente/descendente se aplica también al orden del catálogo. Los valores ausentes quedan al final.
- BUSCAR incluye PERSONAJE además del nombre y los textos/descripciones de la carta.
- TIPO DE CARTA ahora es de selección múltiple: al elegir varios tipos se aplica coincidencia con cualquiera de ellos, incluso si TIPO es un array.
- En el constructor, ESFERA, TIPO y BUSCAR permanecen a mano; MÁS FILTROS despliega la ordenación y LIMPIAR.
- Se agregó OPCIONES al menú principal. Comparte los mismos ajustes de sonido y pantalla completa que durante el combate. VOLVER simplemente cierra el panel y regresa a la pantalla que lo abrió; ya no navega al menú principal.
