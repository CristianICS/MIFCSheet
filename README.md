# Forest Inventory PWA

Una aplicación web es una aplicación creada para la web a la que puedes acceder desde cualquier dispositivo. Puedes utilizar aplicaciones web para que un sitio web funcione como una aplicación y acceder a él en tu ordenador o dispositivos móviles a través del menú de aplicaciones o de la pantalla de inicio. Algunas aplicaciones web incluyen funciones adicionales, como un mayor espacio de almacenamiento para consultar contenido sin conexión, notificaciones, acceso al sistema de archivos e iconos con distintivos.

## Estructura de la base de datos (IndexedDB)

```text
// Page https://dbdiagram.io/d
// DBML to define database structure
// Docs: https://dbml.dbdiagram.io/docs

// Store inventory rows
Table rows {
  id integer [primary key]
  inventories_id integer
  rown integer // Row position inside the inventory
  // Inventory fields ----
  species varchar
  n integer
  d double
  di double
  dd double
  h double
  dma double
  dmi double
  rma double
  rmi double
  dbh double
  comments varchar
}

Table inventories {
  id integer [primary key]
  name varchar
  creator varchar
  init_point integer
  stop_point integer
  created_at timestamp
}

Table inventory_images {
  id integer [primary key]
  inventories_id integer
  src varchar
  filesize integer
  created_at timestamp
}

Table row_images {
  id integer [primary key]
  rows_id integer
  inventories_id integer
  name varchar
  src varchar
  filesize integer
  created_at timestamp
}

Ref: rows.inventories_id > inventories.id // many-to-one

Ref: rows.id < row_images.rows_id // one to many

Ref: row_images.inventories_id > inventories.id // many-to-one

Ref: inventory_images.inventories_id > inventories.id
```

## Key points

- Promises and async/await: The use of Promises and async/await makes the code more readable and easier to follow.
- (IndexedDB) Transaction Handling: The transaction handling logic is simplified and moved to use async/await, which makes it easier to manage errors and transaction completion.
- Class-based Structure: Using a class (e.g., IndexedDBHandler) provides a more modern, modular, and reusable structure. This aligns well with ES6+ JavaScript practices.
- Improved Readability: The use of methods within a class improves code organization and readability. It separates concerns more clearly and can be extended easily.
- Estructura SQL mediante la API IndexedDB. Permite almacenamiento en el dispositivo y **modo sin conexión**.

## Aspectos del código

Archivo inicial "index.html" con la estructura del inventario. Se añade los archivos "app.js" con las funcionalidades de la aplicación y el archivo "classes.js" con los diferentes objetos y métodos.

## Funcionalidad

First time the APP is loaded, the Service Worker is started and saved.

Init

- Start `Inventories` class. It contains the inventories metadata inside "Inventories.metadata" array.
- Create `Images` class in which images will be stored.
- Create `IndexedDBHandler` class, containing the main indexedDB functions.
- Create the database instance inside the `IndexedDBHandler` object with "init" function. This function returns a promise. When it is resolved:
  - Apply `Inventories.load` to add indexeddb stored inventories metadata inside this class.
  - Call `Inventories.show` method to display the above inventories inside the html form.

Option to save inventory metadata

- Call `Inventories.save` function with the metadata (input elements)
  - Transform metadata into an `Inventory` object.
  - Check if the new metadata `name` is already stored inside IDB.
    - TRUE: Check if the other properties are different too.
      - TRUE: Display a message to confirm the overwrite
        - TRUE: Save metadata inside IndexedDB
    - FALSE: Save metadata inside IndexedDB. If the properties remain the same, only the rows are saved.
- Show the new inventories calling `Inventories.load`
- Check if there is an inventory active (`Inventories.activeid`)
  - TRUE: Save its rows inside IDB.
    - Collect the rows again from IDB with `Rows.init` to place their ids inside HTML.
    - Remove prior HTML rows with `Rows.ls`
    - Show the saved rows again.
  - FALSE: Show the saved inventories panel with `Inventories.show`

Open saved inventory:

- Save the opened inventory id inside a key inside `Inventories` class.
- Update the UI
- Create new `Rows` class
- Retrieve the stored rows inside indexedDB with `Rows.init`
- Display the stored rows with `Rows.show()`

Add new empty row:

- Save all the displayed rows inside the form with `Rows().collect`
- Create a new row with `Rows.emptyRow` and add to `Rows` object class.
- Delete displayed rows to then show the ones inside `Rows` object.

Delete a row:

- Retrieve selected rows with `Rows.collect(true)`. If parameter `selected` is set to `true`, the row number from the HTML is saved.
- Delete row from the IndexedDB and from the HTML panel with `Rows.delete`.
- Collect again the remaining rows with `Rows.collect` (this time with `selected` param set to `false`). This time the row number will be computed related with number of displayed rows (as always).
- Remove ancient rows in the screen with `Rows.ls`.
- Show new collected rows with `Rows.show`.

Delete inventory (metadata, rows (and images)):

- Get the inventory ID and delete it from IDB with `Inventories.delete`. This function deletes the inventories from `Inventories.metadata` array.
- Show again the stored inventories with `Inventories.show`. This function do the following actions:
  - Reset the UI to the initial state.
  - Store the inventories in `Inventories.metadata` inside "Saved inventories" panel.
  - **Remove displayed rows in the row panel**
  - Reset the `Inventories.activeid` variable.

Go home (reset the UI to the initial state when click on the main title):

- Trigger a confirmation message to inform that this action will made all the unsaved data lost.
- Reset UI to the initial state.
- Show the saved inventories with `Inventories.show`.

The autocomplete input behaviour has been achieved with the code inside [How TO - Autocomplete](https://www.w3schools.com/howto/howto_js_autocomplete.asp) tutorial.

Add an image (only one at a time):

- Open the displayed image panel when user taps the "#row-btn-img" button.
- Fire the function "Images.updateImageDisplay" to visualize the image to upload.
- When button "#image-add" is clicked, check wheter a row is activated:
  - If true, the added image is linked to that row id.
  - If false, the added image is linked with the activated inventory.
- Reset image panel.

Cuando se elimina un inventario, se vuelven a cargar desde la IDB. Por eso la opción de eliminar un inventario no aparece al mostrar el formulario con las filas.

Cuando se abre un inventario, se actualiza una propiedad que marca si está o no activado (`class Inventories`).

Las filas solo se guardan en la IndexedDB cuando se pulsa el botón. Hasta entonces solo estarán en la variable global.

Download the data:

- Init the "Download" object. It requires the inventory ID, "inventories" object and "IndexedDBHandler.db" instance.

## Iniciar la PWA

> While installing a PWA only takes a couple of clicks, depending on the web application features, the result of installing a PWA usually goes well beyond creating a link to a page on the Internet; installing a PWA more deeply integrates the web application on the user's device. <br>Depending on the PWA, device, and features of the operating system and browser, installing a PWA may enable native-like features, such as giving the app its own standalone window or registering it as a file handler. This also means uninstalling a PWA, which also only requires a couple of clicks, does more than just removing the PWA's icon. [Installing and uninstalling PWAs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing#installing_and_uninstalling_pwas)

### Requisitos

Se necesita un `service worker` (`sw.js`), un archivo `manifest.json` y la unión de estos elementos dentro de la web.

Líneas de código que vinculan el archivo `manifest.json` con la web:

```html
<head>
  <link rel="manifest" href="manifest.json" />
</head>
```

Instalar el `service worker`:

```javascript
if ("serviceWorker" in navigator) {
  // Register the app's service worker
  // Passing the filename where that worker is defined.
  navigator.serviceWorker.register("sw.js").then(
    (registration) => {
      console.log("Service worker registration successful:",
      registration);
    },
    (error) => {
      console.error(`Service worker registration failed: ${error}`);
    },
  );
} else {
  console.error("Service workers are not supported.");
}
```

Una vez instalado, los archivos de la web se guardan en local y pueden ser recuperados sin necesidad de conectarse a la red.

### Instalación

[Instalar una PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing#installing_pwas)

[Instalar PWA en Chrome](https://support.google.com/chrome/answer/9658361?hl=es&co=GENIE.Platform%3DDesktop&oco=1)

### Desinstalación

[Desinstalar una PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing#uninstalling)

## Alojamiento web

https://sicuz.unizar.es/

Indicar una descripción, el motivo y finalidad de la petición:

Página web que funciona como una "Power Web Application" en el navegador del cliente gracias a un "Service Worker" y a un archivo "manifest.json". Se compone únicamente de ficheros "html", "js" y "css". La aplicación permite crear inventarios forestales digitales, añadir anotaciones e imágenes y descargarlos posteriormente, todo ello sin necesidad de conexión a internet.

Ha sido desarrollada en el marco del proyecto "Análisis dinámico de la resiliencia de los Paisajes Forestales afectados por el Fuego mediante indicadores espectrales multisensor (PaF)". El objetivo del alojamiento web es poder disponer de esta herramienta en las tabletas digitales del equipo de trabajo de campo. Realizar los inventarios de manera digital en lugar de en formato papel ahorra una gran cantidad de tiempo en gabinete, evitando así transcribir los datos al ordenador.

> La solicitud debe ser validada exclusivamente por uno/a de los siguientes responsables:

Decano/a,
Director/a de centro,
Director/a de departamento,
Director/a de cátedra,
Jefe/a de servicio,
cualquier miembro del consejo de dirección 

## Actualizaciones pendientes

Gestionar los fallos de guardado de imágenes en la indexeddb.

Colocar un botón "x" en el "input" donde se escribe el nombre de la especie (eliminar y crear nuevas búsquedas por nombre más rápido).

El campo "created_at" se modifica cada vez que se guarda (visto de momento solo en la clase "Rows").

Tener en cuenta el almacenamiento disponible.

Incluir los cambios en la UI en una nueva clase.

Mejorar las funciones que interactúan con la BBDD: Recoger las promesas con `reject`, avisar al usuario y parar la función que se está ejecutando.

## Referencias

[Guía sobre PWA](https://web.dev/learn/pwa/)

[PWA Icons](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials/CycleTracker/Manifest_file#app_iconography)

[Instalar una PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing)

Referencias acerca de AndroidStudio (fue la primera opción, crear una web con HTML y JavaScript dentro de Android):

[Información del contenido basado en la web](https://developer.android.com/develop/ui/views/layout/webapps)

[Cargar contenido en la APP](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content)

[Crear una app android con html y js](https://www.geeksforgeeks.org/build-an-android-app-with-html-css-and-javascript-in-android-studio/)

[Alojamiento web unizar](https://sicuz.unizar.es/publicacion-web/alojamiento-web/alojamiento-de-paginas-web-inicio)
