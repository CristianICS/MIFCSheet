// Init global inventories class
var inventories = new Inventories();
// Create the inventories panel
init_inventory_panel();
// Init images object
var images = new Images();
// Init Database
const dbHandler = new IndexedDBHandler('forestInventory');
// Show the saved inventories
dbHandler.init().then(async (db) => {
  await inventories.load(db);
  inventories.show();
});

// Handle inventory form/rows controls
const newInvFormEl = document.getElementsByTagName("form")[0];
newInvFormEl.addEventListener("submit", async (event) => {
  // Prevent the form from submitting to the server
  // since everything is client-side.
  event.preventDefault();

  // Save inventory metadata inside IDB
  let metadata = document.querySelectorAll('.inv-mtd');

  await inventories.save(metadata, dbHandler);
  await inventories.load(dbHandler);
  
  // When one inventory is opened, save its rows too.
  if (!isNaN(inventories.activeid)) {
    // Initialize the 'rows' object and collect the displayed rows
    let rows = new Rows();
    rows.collect();
    rows.save(inventories.activeid, dbHandler);
    // Collect again the rows from IDB to show its ids
    await rows.init(inventories.activeid, dbHandler);
    rows.ls();
    rows.show();

    // Save images
    images.save(dbHandler, rows.arrays);
  }
  else {
    // Show the 'saved inventories' panel refreshed
    inventories.show();
  }
  // Save inventory's images
  images.save(dbHandler);
});

// Get saved inventories buttons parent HTML block
const savedInventoriesEl = document.getElementById("saved-inventories");
// Handle saved inventories functions
savedInventoriesEl.addEventListener("click", async (event) => {
  // Check if user has clicked on predefined controls
  const idParts = event.target.id.split('-');
  switch (idParts[0]){
    case 'open': // The user wants to open a stored inventory
      // Get inventory id (inside button id)
      var id = parseInt(idParts[1]);
      // Select inventory by ID and populate the info inside the form
      inventories.selectById(id).populate();
      // Update the activate ID
      inventories.activeid = id;
      // Update UI
      // Hide the saved inventories form
      document.getElementById('saved-inventories').innerHTML = "";
      // Change #app-main-form-title
      let editTitle = "Fill in"
      document.getElementById('app-main-form-title').textContent = editTitle;
      // Change #app-main-form-btn text
      document.getElementById('app-main-form-btn').textContent = "Save";
      // Display the row panel
      document.getElementById('rows-form').style.display = 'block';
      // Show rows
      let rows = new Rows();
      await rows.init(id, dbHandler);
      rows.show();
      break;
    case 'download':
      // Get inventory id (inside button id)
      var id = parseInt(idParts[1]);
      var downData = new Download(id, inventories);
      // Fetch data and download
      downData.fetchData(dbHandler);
      break;
    case 'delete':
      // Get inventory id (inside button id)
      var id = parseInt(idParts[1]);
      // Select inventory by ID and delete it
      await inventories.delete(id, dbHandler);
      // Show the inventories again
      inventories.show();
      break;
  }
});

// Save the container with row controls
const rowsEl = document.getElementById("rows-form");
// Add listeners to handle row controls
rowsEl.addEventListener("click", async (event) => {
  // The buttons id action is stored in the string row-btn-action
  const objIdParts = event.target.id.split('-');
  // Check only the action buttons
  if (objIdParts.length == 3) {
    // Handle it
    switch (objIdParts[2]) {
      case 'add':
        // Init a new Rows element to handle rows
        var rows = new Rows()
        // Retrieve rows inside the form
        rows.collect();
        // Add an empty row
        rows.emptyRow();
        // To init the rows form again, prior remove ancient rows
        rows.ls();
        // Show the new rows (ancient ones plus new empty one)
        rows.show();
        break;
      case 'del':
        // Init a new Rows element to handle rows
        var rows = new Rows();
        // Retrieve selected row(s) to delete
        rows.collect(true);
        // Exit the function if there are no rows selected.
        if (rows.arrays.length == 0) {return alert('Select a row.');}
        // Delete above rows
        await rows.delete(dbHandler);
        // Collect again and show to reflect the changes in row numbers
        rows.collect();
        // Init the rows form again (clean)
        rows.ls();
        rows.show();
        break;
      case 'img': // The user wants to link an image inside the selected row
        images.openImageDisplay();
    }
  }

  // Select/Unselect a row
  if(objIdParts[0] == 'rown') {
    // Check if it's already selected
    const isSelected = event.target.classList.contains('selected');
    if (isSelected) {
      // Unselect
      event.target.classList.remove('selected');
    } else {
      // Change the background color
      event.target.classList.add('selected');
    }
  }
});

// When click on app title, go to the initial UI
var appTitle = document.querySelector('#app-title');
appTitle.addEventListener('click', (e) => {
  // Confirm to prevent close an open inventory with unsaved data
  if (confirm('Unsaved data will be erased. Are you sure?')) {
    // Update UI
    // Open the saved inventories form
    document.getElementById('saved-inventories').innerHTML = "";
    // Change #app-main-form-title
    let editTitle = "Init new inventory"
    document.getElementById('app-main-form-title').textContent = editTitle;
    // Change #app-main-form-btn text
    document.getElementById('app-main-form-btn').textContent = "Create Inventory";
    // Display the saved inventories panel
    inventories.show();
  }
})

// Handle images
// Load image button
const captureImg = document.querySelector('#capture-img');
captureImg.addEventListener('change', (el) => {
  const input = el.target;
  const preview = document.querySelector('.img-preview');
  // Display the image on the screen and save its data
  images.updateImageDisplay(preview, input);
});

// Button to insert the loaded image inside IndexedDB
const addImg = document.querySelector('#image-add');
addImg.addEventListener('click', (_) => {
  const selectedRow = document.querySelectorAll('.selected');
  // Handle selected rows (one or none selected rows are available)
  // With one row selected, the image will be linked to it
  // With none selected, it will be linked with the activated inventory
  if (selectedRow.length == 1){
    // Select row id
    const id = selectedRow[0].id;
    // Add images inside the images.content
    images.add(id, inventories.activeid);
    images.resetDisplay(document.querySelector('.img-preview'));

  } else if (selectedRow.length == 0) {
    // Liked the image with the active inventory
    images.add(inventories.activeid);
    images.resetDisplay(document.querySelector('.img-preview'));
  } else {
    alert('Select only one row and try again.');
  }
});

// Generate tooltip panel
function create_tooltip_panel() {
    let accordion_panel = document.querySelector('#tooltip-panel');
    // Get the properties
    let columns = Object.keys(inv_columns);
    columns.forEach((key) => {
        // Create the container
        let container = document.createElement('div');
        container.classList.add('tab');
        // Input element: mandatory. It will collapse/open the content
        let input_el = document.createElement('input');
        input_el.setAttribute('type', 'checkbox');
        input_el.setAttribute('name', `accordion-${key}`);
        input_el.id = key;
        container.appendChild(input_el);
        // Create label (text that will display column name)
        let label_el = document.createElement('label');
        label_el.setAttribute('for', key);
        label_el.classList.add('tab__label');
        label_el.innerText = inv_columns[key]['custom_name'];
        container.appendChild(label_el);

        // Create the explanation content
        let exp_div = document.createElement('div');
        exp_div.classList.add('tab__content');
        // Description
        let p_descript = document.createElement('p');
        let descript_text = inv_columns[key]['description'];
        p_descript.innerHTML = `<strong>Description:</strong> ${descript_text}`;
        exp_div.appendChild(p_descript);

        // Table with the predefined parameters accepted by the column
        // (only if it's a select element)
        if (inv_columns[key]['form_type'] == 'select') {
            let table_div = document.createElement('div');
            table_div.classList.add('table-container');
            let table_el = document.createElement('table');
            // Define header columns
            let header = document.createElement('tr');
            let key_col = document.createElement('th');
            key_col.innerText = 'Key';
            header.appendChild(key_col);
            let descript_col = document.createElement('th');
            descript_col.innerText = 'Meaning';
            header.appendChild(descript_col);
            // Append header to the main table
            table_el.appendChild(header)
    
            // Define table rows
            inv_columns[key]['values'].forEach((value, i) => {
                // Create new row
                let tr_el = document.createElement('tr');
                // Set the name of the key
                let col_1 = document.createElement('td');
                col_1.innerText = value;
                tr_el.appendChild(col_1);
                // Write its descriptor text
                let col_2 = document.createElement('td');
                col_2.innerText = inv_columns[key]['meanings'][i];
                tr_el.appendChild(col_2);
    
                // Append the row to the main table
                table_el.appendChild(tr_el);
            });
    
            // Append table to its parent container
            table_div.appendChild(table_el);
            // Append the table to its parent container
            exp_div.appendChild(table_div);
        }
        // Add exp_div to the main tab inside the accordion menu
        container.appendChild(exp_div);

        // Include the container as a new label of accordion menu
        accordion_panel.appendChild(container);
    })

}
create_tooltip_panel()