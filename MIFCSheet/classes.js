/**
 * Get a JSON time in locale time.
 * https://stackoverflow.com/a/41467117/23551600
 */
export function getTime() {
  const date = new Date();
  // Locale date
  const loc_date= new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  return loc_date.toJSON();
}

export class IndexedDBHandler {

  constructor(dbname) {
    this.dbname = dbname;
    this.db = null;
  }

  /**
   * Init the IndexedDB
   * ======================
   * 1. Create main IDB object
   * 2. Create ObjectStores to save JSON information
   * 3. Create indexes to store the info properly
   */
  init() {
    return new Promise((resolve, reject) => {
      // Init database
      const request = window.indexedDB.open(this.dbname, 3);

      request.onerror = (event) => {
        console.error(`[IndexedDB request error] ${event.target.errorCode}`);
        reject(event.target.error);
      };
      request.onsuccess = (event) => {
        // Save DB instance
        this.db = event.target.result;
        // Test if ObjectStore are already created
        this.testIDB();
        resolve(this);
      };

      // IMPORTANT: This event is only implemented in recent browsers
      request.onupgradeneeded = (event) => {
        // Save the IDBDatabase interface
        this.db = event.target.result;

        // Create DB ObjectStores
        // Check the DB schema in the README.md file for details
        if (!this.db.objectStoreNames.contains('rows')) {
          const rowsOs = this.db.createObjectStore("rows", {
            keyPath: "id", autoIncrement: true, unique: true
          });

          // Define indexes to search rows by:
          rowsOs.createIndex("inventories_id", "inventories_id",
            { unique: false }
          );
        }

        if (!this.db.objectStoreNames.contains('inventories')){
          const invsOs = this.db.createObjectStore("inventories", {
            keyPath: "id", autoIncrement: true, unique: true
          });
        }

        if (!this.db.objectStoreNames.contains("inventory_images")){
          const invImgsOs = this.db.createObjectStore("inventory_images", {
            keyPath: "id", autoIncrement: true, unique: true
          });
          // Define indexes to search rows by:
          invImgsOs.createIndex("inventories_id", "inventories_id",
            {unique: false}
          );
        }

        if (!this.db.objectStoreNames.contains('row_images')){
          const spImgsOs = this.db.createObjectStore('row_images', {
            keyPath: "id", autoIncrement: true, unique: true
          });
          // Define indexes to search rows by:
          spImgsOs.createIndex("rows_id", "rows_id",
            {unique: false}
          );
          spImgsOs.createIndex("inventories_id", "inventories_id",
            {unique: false}
          );
        }
      };
    })
  } // end of init()
    
  /** Make a test query to test that IDB is correctly open */
  testIDB(){
    const transaction = this.db.transaction(["rows"], "readonly");
    const objectStore = transaction.objectStore("rows");

    transaction.onerror = (event) => {
    console.error(`[IBD test fails] ${event.target.error}`);
    };

    const countRequest = objectStore.count();
    countRequest.onsuccess = () => {
      console.log('IBD test success');
    };
    countRequest.onerror = (event) => {
      console.error(`[IBD test fails] ${event.target.error}`);
      reject(event.target.error)
    };
  }

  /**
   * Retrieve all the data inside an object store.
   * 
   * @param {String} os ObjectStore name
   * @returns {Array}
   */
  getAllData(os) {
    const transaction = this.db.transaction([os], "readonly");
    const objectStore = transaction.objectStore(os);
    // TODO: The error message is not returned
    transaction.onerror = (event) => {
      console.error(`[IBD transaction fails] ${event.target.error}`);
    };
    
    return new Promise((resolve, reject) => {
      const allRecords = objectStore.getAll();

      allRecords.onsuccess = (event) => {
          resolve(event.target.result);
      };

      allRecords.onerror = (event) => {
          console.error(`[IDBGetAll request error]: ${event.target.error}`);
          reject(event.target.error);
      };
    });
  }

  /**
   * Add data into the IndexedDB
   * 
   * It is resolved only when the transaction is fully completed.
   * 
   * @param {*} data 
   * @param {*} os 
   */
  async addData(data, os) {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([os], 'readwrite');
        const objectStore = transaction.objectStore(os);

        objectStore.put(data);

        transaction.oncomplete = () => {
            resolve();
        }

        transaction.onerror = (event) => {
            console.error(`[IDBTransaction error]: ${event.target.error}`);
            reject(event.target.error);
        };

      } catch (error) {
        console.error(`Error in addData: ${error}`);
        reject(error);
      }
    })
  }

  /**
   * Delete a record inside an ObjectStore by its id.
   * 
   * @param {String || Integer} id Item to delete's ID
   * @param {String} os ObjectStore name
   * @returns 
   */
  deleteRecord(id, os) {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([os], "readwrite");
        const objectStore = transaction.objectStore(os);
        
        objectStore.delete(id);

        transaction.oncomplete = () => {
          resolve();
        };

        transaction.onerror = () => {
          console.error(`[IBD transaction fails] ${transaction.error}`);
        };

        transaction.onabort = () => {
            reject(transaction.error);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  deleteRecords(id, indexName, os) {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([os], 'readwrite');
        const objectStore = transaction.objectStore(os);
        const index = objectStore.index(indexName);
        const request = index.openCursor(IDBKeyRange.only(id));

        request.onsuccess = (event) => {
          const cursor = event.target.result;

          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);

        request.onerror = (event) => reject(event.target.error);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get one record by id
   * @param {*} id 
   * @param {*} os 
   * @returns 
   */
  getRecord(id, os) {
    const transaction = this.db.transaction([os], "readwrite");
    const objectStore = transaction.objectStore(os);
    // TODO: The error message is not returned
    transaction.onerror = (event) => {
      console.error(`[IBD transaction fails] ${event.target.error}`);
    };
    
    return new Promise((resolve, reject) => {
      const retrievedObj = objectStore.get(id);
      
      retrievedObj.onsuccess = (event) => {
        resolve(event.target.result);
      };

      retrievedObj.onerror = (event) => {
        console.log(`[IDBDeleteRecord error]: ${event.target.error}`);
        reject(event.target.error)
      };
    })
  }

  /**
   * Retrieve all the records that match with one id from index column.
   * 
   * @param {String} id The value that define selected objects
   * @param {String} index Column name in which the value is stored (an index)
   * @param {String} os Object store name
   * @returns 
   */
  getRecords(id, indexName, os){
    const transaction = this.db.transaction([os], "readwrite");
    const objectStore = transaction.objectStore(os);
    const index = objectStore.index(indexName);
    // Get all the data with the same ID base on index column
    const keyRange = IDBKeyRange.only(id);
    const cursorRequest = index.openCursor(keyRange);
    
    return new Promise((resolve, reject) => {
      // Store the results
      const results = [];
  
      cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue(); // Move to the next item
        } else {
          resolve(results);
        }
      };
  
      cursorRequest.onerror = function(event) {
          console.error('[getRecords request error]:', event.target.error);
          reject(event.target.error);
      };
    })
  }
}

/**
 * Obtain the column acting as ID column
 * 
 * It yields an error if there is more than one column marked as the column
 * to display.
 * 
 * @returns {Text} The column name that is acting as the name and id of
 *   the inventory.
 */
function getDisplayColumn() {
  const displayCols = Object.keys(inv_header).filter(
    key => inv_header[key].display_col === true
  );

  if (displayCols.length !== 1) {
    const msg = `inventory_header.js must contain exactly one "display_col: true". Found ${displayCols.length}.`;
    alert(msg);
    throw new Error(msg);
  }

  return displayCols[0];
}

export class Inventory {
  /** Represent an inventory with its metadata */
  constructor(metadata, id = false) {
    // Extract inventory header col keys
    let inv_metadata_keys = Object.keys(inv_header);
    // Try to return the metadata file (if any)
    inv_metadata_keys.forEach((key) => {
        let data = metadata[key];
        if (data) {
            this[key] = data;
        }
    })
    this.id = id;
    this.created_at = metadata.created_at || getTime();
  }

  /** Transform current object into an array to store it inside the IDB. */
  parseIdb() {
    let idbArray = {};

    Object.keys(inv_header).forEach((key) => {
        idbArray[key] = this[key];
    });

    if (this.id) {
      idbArray.id = this.id;
    } 

    idbArray.created_at = this.created_at;

    return idbArray;
  }

  /**
   * Create inventory object access in HTML.
   * 
   * Display the inventory inside created inventories panel.
   * 
   * @returns {HTMLLIElement}
   */
  toHtml(){
    // Init li element
    const invEl = document.createElement("li");
    
    const displayCol = getDisplayColumn();
    invEl.textContent = `Inventory ${this[displayCol]}`;
 
    invEl.textContent = `Inventory ${this[displayCol]}`;
    // Update style
    invEl.classList.add('savedinv');
    // Store the inv id
    invEl.id = this.id;

    // Include options to handle the saved inventories (inside a span element)
    const invControls = document.createElement("span");
    // Display inventory
    const openBtn = document.createElement("a");
    openBtn.textContent = "open";
    openBtn.id = `open-${this.id}`;
    // Download inventory
    const downBtn = document.createElement("a");
    downBtn.textContent = "download";
    downBtn.id = `download-${this.id}`;
    // Delete inventory
    const delBtn = document.createElement("a");
    delBtn.textContent = "delete";
    delBtn.id = `delete-${this.id}`;

    invControls.appendChild(openBtn);
    invControls.appendChild(downBtn);
    invControls.appendChild(delBtn);
    // Add controls to the inventory item
    invEl.appendChild(invControls);
    return invEl;
  }

  /** Display inventory info inside the inventory pannel */
  populate() {
    const info = Object.keys(this);
    info.forEach((prop) => {
      if (!['id', 'created_at'].includes(prop)) {
        // Get input to display the information
        const el = document.querySelector(`#inventory-${prop}`);
        el.value = this[prop];
      }
    });
  }

  /**
   * Delete an inventory from the database.
   * 
   * @param {IndexedDBHandler} dbHandler 
   */
  async delete(dbHandler) {
    const displayCol = getDisplayColumn();
    let msg = `Are you sure you want to delete the inventory "${this[displayCol]}"`

    if (!confirm(msg)){
      return false;
    };
    
    await dbHandler.deleteRecord(this.id, 'inventories');
    return true;
  }
}

export class Inventories {
  /** Class to handle inventories. */
  constructor() {
    // Variable to store inventory metadata
    this.metadata = [];
    // Store the active inventory id
    this.activeid = NaN;
    // Message to display if there is a duplicated inventory name
    this.confMsg = 'There is an inv with the same name. ' +
    'If you continue the inventory metadata will be overwritten.';
  }

  /**
   * Retrieve stored inventories form the database.
   * 
   * @param {IndexedDBHandler} dbHandler 
   */
  async load(dbHandler) {
    // Reset variable
    this.metadata = [];
    // Get stored inventories inside IDB.
    const idbInventories = await dbHandler.getAllData('inventories');
    idbInventories.forEach((inv) => {
      // Create a new Inventory with its stored info
      const inventory = this.initInv(inv, inv.id);

      // Update past inventories and store them inside current class
      this.metadata.push(inventory);
    });
  }

  /**
   * Transform object with inventory metadata in Inventory class object.
   * 
   * The id property is passed in a separated parameter to allow init an
   * Inventory object without ID (which only appears when an Inventory is
   * added to the IDB).
   * 
   * @param {Object} metadata One inventory metadata
   * @param {Number} id Inventory IDB index
   */
  initInv(metadata, id = false) {
    try {
      return new Inventory(metadata, id);
    } catch (error) {
      console.log(`[Inventories.storeInv error]${error}`);
    }
  }

  /**
   * Populate inventory data inside saved inventories' panel.
   */
  show() {
    // Save HTML object to store the inventories
    const savedInvEl = document.getElementById("saved-inventories");
    // Clear the list of past invents., it's going to re-render it.
    savedInvEl.innerHTML = "";

    // Define saved inventories' container
    const pastInvHeader = document.createElement("h2");
    pastInvHeader.textContent = "Saved inventories";

    const pastInvList = document.createElement("ul");
    // Append inventories inside the above list
    this.metadata.forEach((inv) => {
      pastInvList.appendChild(inv.toHtml());
    });

    // Append inside the saved inventory panel all the inventories
    savedInvEl.appendChild(pastInvHeader);
    savedInvEl.appendChild(pastInvList);

    // Reset the form where inventory's metadata is written.
    document.querySelectorAll('#inventory-form .inv-mtd')
    .forEach((inp) => {inp.value = ""});
    
    // Close the displayed row's panel
    document.querySelector('#rows-form').style.display = 'none';
    // Reset displayed rows
    let rows = new Rows();
    rows.ls();
    // Reset show inventory variable
    this.activeid = NaN;
  }

  /**
   * Save inventory metadata inside IndexedDB
   * 
   * @param {HTMLInputElementArray} metadata 
   * @param {IndexedDBHandler} dbHandler 
   */
  async save(metadata, dbHandler) {

    // Handle inputs form elements with the inventory metadata
    var metadataDict = {};
    metadata.forEach((inp) => {
      // Get the key (column name from "inventories" form)
      let key = inp.id.split('-')[1];
      let value = inp.value;
      metadataDict[key] = value;
    });

    let inventory = this.initInv(metadataDict);
    
    const displayCol = getDisplayColumn();
    // Check if there is a stored inventory with the same name
    let duplicatedInv = this.selectByColumn(
      displayCol,
      inventory[displayCol]
    );

    if (duplicatedInv) {
      // Check if the duplicated metadata has duplicated properties
      if (this.checkProperties(inventory, duplicatedInv) == 0) {
        // Overwrite the inv metadata
        if (confirm(this.confMsg)){
          // Replace duplicated inventory metadata by switching the ids
          inventory.id = duplicatedInv.id;
          inventory.created_at = duplicatedInv.created_at;

          await dbHandler.addData(inventory.parseIdb(), 'inventories');
        }
      }
    } else {
      await dbHandler.addData(inventory.parseIdb(), 'inventories');
    }
  }
  
  /**
   * Retrieve inventory metadata by inventory's id
   * 
   * @param {Number} id 
   * @returns {Object}
   */
  selectById(id) {
    return this.metadata.find((inv) => inv.id == id);
  }
  
  /**
   * Select one row by a value inside a column
   * 
   * @param {String} column The target column where find the `value`.
   * @param {String} value Value inside the `column` to filter with.
   * @returns {Object} Filtered column's row values.
   */
  selectByColumn(column, value) {
    return this.metadata.find((inv) => inv[column] === value);
  }

  /**
   * Compare the keys inside two inventories.
   * 
   * Return true if the two inventories have the same values.
   * 
   * @param {Inventory} newinv
   * @param {Inventory} current
   * @returns 0 if inventories are not equal and 1 if both are equals.
   */
  checkProperties(newinv, current){
    // Properties to check
    let props = Object.keys(inv_header);
    let isequal = props.reduce((prev, key) => {
      return (newinv[key] == current[key]) * prev;
    }, 1)
    return isequal;
  }

  /**
   * Remove an inventory from IDB.
   * 
   * @param {Number} id 
   * @param {IndexedDBHandler} dbHandler 
   */
  async delete(id, dbHandler) {
    const inventory = this.selectById(id);

    // Stop the entire deletion process if the user cancels
    const deleted = await inventory.delete(dbHandler);
    
    if (!deleted) {
      return;
    }

    // Delete images directly linked to the inventory
    await dbHandler.deleteRecords(
       id,
      'inventories_id',
      'inventory_images'
    );

    // Delete any remaining row images linked to the inventory
    await dbHandler.deleteRecords(
      id,
      'inventories_id',
      'row_images'
    );

    // Delete associated rows
    let rows = new Rows();
    await rows.init(id, dbHandler);
    await rows.delete(dbHandler, false);

    // Remove inventory from memory
    this.metadata = this.metadata.filter((mtd) => {return mtd.id != id});
  }
}

export var init_inventory_panel = function() {
    // Get the container where inventory rows are
    let container = document.querySelector("#inventory-form fieldset");
    Object.keys(inv_header).forEach((key) => {
        let props = inv_header[key];
        // Define the input id for the current key
        let key_id = `inventory-${key}`;
        // Container with info label and input
        let p = document.createElement('p');

        // Create the label
        let lbl = document.createElement('label');
        lbl.setAttribute('for', key_id);
        lbl.innerText = props['custom_name'];
        p.appendChild(lbl)

        // Allow select elements inside the inventory header
        if (props['form_type'] == 'select') {
            let inp = document.createElement('select');
            inp.id = key_id;
            inp.classList.add('inv-mtd');

            // Add empty default option
            let defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '';
            inp.appendChild(defaultOption);

            if (props.required) {
                inp.required = true;
            }

            props['values'].forEach((value, i) => {

                let option = document.createElement('option');

                option.value = value;
                option.innerText = props['meanings'][i];

                inp.appendChild(option);
            });

            p.appendChild(inp);
        } else {
            // Define input
            let inp = document.createElement(props['form_type']);
            inp.id = key_id;
            inp.classList.add("inv-mtd");
            if (Object.keys(props).includes("required")) {
                inp.setAttribute("required", true)
            }
            if (props['form_type'] == 'input') {
                inp.setAttribute('type', props['input_type']);
            }
            p.appendChild(inp);
        }
        
        // Add the inventory header row to the HTML container
        container.appendChild(p);
    })
}

export class Rows {

  constructor() {
    this.arrays = [];
  }
   
  /**
   * 
   * @param {Number} invid 
   * @param {IndexedDBHandler} dbH 
   */
  async init(invid, dbH) {
    this.arrays = [];
    // Get stored rows inside IDB
    const invRows = await dbH.getRecords(invid, 'inventories_id', 'rows');
    // Loop over all rows and init them
    invRows.forEach((row) => {
      // Create new row element
      let newR = new Row(this.arrays, row.id, row)
      this.arrays.push(newR)
    });
  }

  show() {
    this.arrays.forEach((row) => {row.display()});
    // Show the number of rows in the legend name
    // let nrows = `Rows (${this.arrays.length})`;
    let nrows = `(${this.arrays.length})`;
    document.getElementById('rows-number').textContent = nrows;
  }

  /**
   * Instead of retrieve rows from IDB, collect them inside the HTML form
   * 
   * @param {Boolean} selected If true collect only the selected rows.
   */
  collect(selected = false) {
    // Reset arrays variable
    this.arrays = [];
    // Handle the rows to select
    let selectClass = selected ? '.inv-row.selected' : '.inv-row';
    // Select each <p> element with row inputs info
    let rowsPNodeList = document.querySelectorAll(selectClass);
    // Sort by rowid
    // Handle rows
    rowsPNodeList.forEach((r) => {
      // Get row id
      let id = !r.dataset.id ? false : parseInt(r.dataset.id);
      // Get current row number
      let rown = selected ? parseInt(r.id.split('-')[1]) : false;
      // Get values from inputs inside p element
      // Note: First select the id of the row to look for all inputs elements
      let inputsNodeList = document.querySelectorAll(`#${r.id} input`);
      // Store each input key:val inside an object
      let inputsDict = {};
      inputsNodeList.forEach((input) => {
        // Get inputProperty
        let key = input.id.split('-')[0];
        let val = input.value;
        // Transform the numeric values
        if (Object.keys(inv_columns[key]).includes('number_type')){
            if (val === '') {
                // Prevent blank fields be converted into NaN string
                inputsDict[key] = '';

            } else if (inv_columns[key]['number_type'] == 'integer') {
                inputsDict[key] = parseInt(val);

            } else if (inv_columns[key]['number_type'] == 'float') {
                inputsDict[key] = parseFloat(val);
            }

        } else {
            // Remain text format
            inputsDict[key] = val
        }
      });

      // Obtain the select tag elements too
      let selectNodeList = document.querySelectorAll(`#${r.id} select`);
      selectNodeList.forEach((select) => {
        // Get input Property
        let key = select.id.split('-')[0];
        let val = select.value;
        // When the user has not selected a value, the key == val
        if (key == val){
            inputsDict[key] = "";
        } else {
            inputsDict[key] = val;
        }
      });

      // Create new row element
      let newR = new Row(this.arrays, id, inputsDict, rown);
      this.arrays.push(newR);
    })
  }

  emptyRow() {
    let newRow = new Row(this.arrays);
    this.arrays.push(newRow);
  }

  /** Remove all the rows inside the form */
  ls() {
    let rows = document.querySelectorAll("#rows-fieldset div");
    rows.forEach((row) => {row.remove()});
  }

  /**
   * Remove a row for html container and try to delete it from the DB.
   * When this function is applied, all the Rows.arrays array will be deleted.
   * 
   * @param {Boolean} verbose If it shows a confirmation message or not
   */
  delete(dbHandler, verbose = true) {
    if (verbose) {
      // Display a confirmation message prior to the delete function
      // (its changes are irreversible).
      let confMsg = `Are you sure you want to delete ${this.arrays.length} rows?`;
      if (confirm(confMsg)){
        this.arrays.forEach((row) => {row.delete(dbHandler);});
      }
    } else {
      this.arrays.forEach((row) => {row.delete(dbHandler);});
    }
  }

  async save(invId, dbHandler) {
    const promises = this.arrays.map((row) => {
      let rowDict = row.parseIdb();
      rowDict['inventories_id'] = invId;

      return row.save(rowDict, dbHandler);
    });

    // Wait until all the rows are saved by propagating these promises
    // and waiting for them
    await Promise.all(promises);
  }
}

export class Row {
  /**
   * Save inventory rows
   * 
   * Add the row number (inside the row's form) too. This is like the current
   * row's index inside the rows global variable array.
   * 
   * When the id and the values are null, the row is new (it has no been
   * stored inside IDB yet).
   * 
   * @param {Rows} rows The Row.arrays element in which rows will be stored.
   * @param {Number} id Row id unique identifier inside IDB
   * @param {Object} vals Row values for the attributes inside IndexedDB rows
   * @param {Number} rown Row number, passed if new row comes from HTML box.
   * ObjectStore
   */
  constructor(rows, id = false, vals = false, rown = false) {
    // Set a row number (to select the rows and get its parameters later)
    // When the row number value is not passed, guess it by the
    // length of the currently existing rows.
    this.rown = rown ? rown : rows.length + 1;
    this.created_at = getTime();
    // Database columns. The row names of 'genus' and 'n' are defined in
    // other parts of the classes.js, but the rest of the row parameters can
    // be added or removed.
    this.cols = Object.keys(inv_columns);
    if (id) {
      this.id = id;
    }
    if (vals) {
      this.cols.forEach((key) => {
        this[key] = vals[key];
      });
    }
  }

  /**
   * Transform dict row in HTML format
   *
   * Each row is inside in a <p> element. Each column is inside in a
   * <label><input> pairs.
   * 
   * @returns {HTMLObject}
   */
  toHtml(){
    // Create UI element which contains the row columns
    let newr = document.createElement('div');
    // Add the row's position in the row list
    newr.id = `rown-${this.rown}`;
    // Add style
    newr.classList.add('inv-row');
    // Add idb id
    if (this.hasOwnProperty('id')){newr.setAttribute('data-id', this.id)};

    // Define the inputs (columns) inside the row
    this.cols.forEach((key, index) => {
      let inpId = key + '-' + this.rown;
      var inp;
      // Create the sub-container with label-input pair
      var var_div = document.createElement('div');
      var_div.classList.add("input-group");

      // Get current column metadata values
      let col_meta = inv_columns[key];
      
      // Create the label
      var inp_lbl = document.createElement('label');
      inp_lbl.setAttribute("for", inpId);
      inp_lbl.innerText = col_meta['custom_name'];
      var_div.appendChild(inp_lbl);

      // Cast the available options for each column type
      if (col_meta['form_type'] == 'select') {

        // Create the input element
        inp = document.createElement('select');
        inp.id = inpId;
        inp.name = key;

        let defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '';
        inp.appendChild(defaultOption);

        // Construct the available options
        let options = col_meta['values'];
        let options_objs = options.map((opt) => {
            let opt_object = document.createElement('option');
            opt_object.setAttribute('value', opt);
            opt_object.innerHTML = `${opt}`;
            // When there is a prior selected option, show it
            if (this.hasOwnProperty(key)) {
                if (this[key] == opt) {
                    opt_object.setAttribute('selected', true)
                }
            }
            return opt_object;
        });

        // Include options inside the input element
        options_objs.map((opt) => {inp.appendChild(opt)});

      } else if (col_meta['form_type'] == 'input') {
          // Define input id by appending the row number
          // Create input element in HTML format
          inp = document.createElement('input');
          // Add elements based on row properties
          inp.type = col_meta['input_type'];
          inp.id = inpId;
          inp.name = key;
          // Populate the element with the saved data (if exists)
          if (this.hasOwnProperty(key)) {inp.value = this[key];}
          // Set tabindex taking into account the number of rows, i.e.,
          // Actual row = 3, Current input (index+1) = 1, number of props = 11
          // Tabindex = (ninputs * nrow) + (index + 1) = 34
          inp.setAttribute('tabindex', index+1+(this.rown * this.cols.length));
          // Create placeholder
          inp.setAttribute('placeholder', key);
          // Add class to retrieve inputs later
          inp.classList.add('row-input');
      }

      // Autocomplete behavior is declared entirely in form_columns.js.
      if (col_meta['autocomplete']) {
        autocomplete(inp, col_meta['autocomplete'], this.rown);
        let divAuto = document.createElement('div');
        divAuto.classList.add('autocomplete');
        divAuto.appendChild(inp);
        var_div.appendChild(divAuto);
        newr.appendChild(var_div);
      } else {
        var_div.appendChild(inp);
        newr.appendChild(var_div);
      }
    });
    return(newr);
  } // end toHtml

  display() {
    const rowEl = this.toHtml();
    // Select the container to display the rows
    const box = document.querySelector('#rows-fieldset');
    box.appendChild(rowEl);
  }

  /**
   * Delete a row from the HTML container and IndexedDB.
   * 
   * @param {Number} id  The id of the row to be deleted
   * @param {IndexedDBHandler} dbHandler 
   */
  async delete(dbHandler) {
    if (this.hasOwnProperty('id')){
      // Delete images linked to this row first
      await dbHandler.deleteRecords(this.id, 'rows_id', 'row_images');

      // Delete row
      await dbHandler.deleteRecord(this.id, 'rows');
    }

    // Delete the row inside HTML container (if it exists)
    const toDel = document.querySelector(`#rown-${this.rown}`)
    if (toDel) {toDel.remove()};
  }

  /**
   * Create the dictionary to upload inside IndexedDB
   */
  parseIdb() {
    // Get only the DB columns (Destructuring)
    // https://stackoverflow.com/a/56592365/23551600
    let rowDict = this.cols
    .filter(key => key in this) // line can be removed to make it inclusive
    .reduce((obj2, key) => (obj2[key] = this[key], obj2), {});
    // Check for row id
    if (this.hasOwnProperty('id')){rowDict['id'] = this.id;}
    // Append row number too (connecting rows with images)
    rowDict['rown'] = this.rown;
    return rowDict;
  }

  save(rowDict, dbHandler) {
    return dbHandler.addData(rowDict, 'rows');
  }
}

export class Images {

  constructor() {
    // https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types
    this.fileTypes = [
      "image/apng",
      "image/bmp",
      "image/gif",
      "image/jpeg",
      "image/pjpeg",
      "image/png",
      "image/svg+xml",
      "image/tiff",
      "image/webp",
      "image/x-icon",
    ];
    this.content = [];
  }
  
  /**
   * Check if a File type is a valid one
   * @param {File} file File object
   * @returns 
   */
  validFileType(file) {
    return this.fileTypes.includes(file.type);
  }

  /**
   * Takes a number of bytes (from a File's size property) and turns it into a
   * nicely formatted size in bytes/KB/MB
   * 
   * @param {Number} number Number of bytes
   * @returns 
   */
  returnFileSize(number) {
    if (number < 1e3) {
      return `${number} bytes`;
    } else if (number >= 1e3 && number < 1e6) {
      return `${(number / 1e3).toFixed(1)} KB`;
    } else {
      return `${(number / 1e6).toFixed(1)} MB`;
    }
  }

  /**
   * Add image metadata inside Images.content
   * 
   * This function is fired when user taps "Add image" button.
   * 
   * @param {String} id The id of the row/inventory linked with the image.
   * @param {Number} inventory_id If the inventory id is included, the
   * image corresponds to a row.
   * or an inventory (1 or 2 respectively).
   */
  add(id, inventory_id = false) {
    const pendingImages = Array.from(document.querySelectorAll('.img-to-add'));

    if (pendingImages.length === 0) {
      throw new Error('No valid image is ready to be inserted.');
    }

    pendingImages.forEach((img) => {
      let img_metadata = {
        uid: this.content.length + 1,
        id: id,
        src: img.src,
        fileSize: img.dataset.filesize,
        extension: img.dataset.fileExtension,
        created_at: getTime(),
        type: inventory_id !== false ? 'row' : 'inventory'
      };

      if (inventory_id !== false) {
        img_metadata.inventories_id = inventory_id;
      }

      this.content.push(img_metadata);
    });

    return pendingImages.length;
  }

  /**
   * Grab images inside an EventListener.
   * ====================================
   * This function makes the following steps:
   * Source: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#getting_information_on_selected_files
   * 
   * - Use a while loop to erase the previous contents of the preview <div>.
   * - Grab the FileList object that contains the information on all the
   *   selected files, and store it in a variable called curFiles.
   * - Check to see if no files were selected, by checking if curFiles.length
   *   is equal to 0. If so, print a message into the preview <div> stating
   *   that no files have been selected.
   * - If files have been selected, we loop through each one, printing
   *   information about it into the preview <div>. Things to note here:
   * - We use the custom validFileType() function to check whether the
   *   file is of the correct type (e.g. the image types specified in the
   *   accept attribute).
   * - If it is, we:
   *    - Print out its name and file size into a paragraph item.
   *    - The custom returnFileSize() function returns a nicely-formatted
   *      version of the size in bytes/KB/MB (by default the browser reports 
   *      the size in absolute bytes).
   *    - Generate a thumbnail preview of the image by calling
   *      URL.createObjectURL(file).
   *    - Then, insert the image into the paragraph by creating a new 
   *      <img> and setting its src to the thumbnail.
   * - If the file type is invalid, we display a message inside a list item
   *   telling the user that they need to select a different file type.
   * 
   * @param {HTMLDivElement} preview Preview div element
   * @param {HTMLInputElement} input Input [type=file] element
   */
  updateImageDisplay(preview, input) {
    // Delete prior displayed images (delete this lines to allow multiple imgs)
    this.resetDisplay(preview, false);
    // Get files
    const curFiles = input.files;
    // When there are no files selected, reset display and show a message
    if (curFiles.length === 0) {
      this.resetDisplay(preview);
    } else {
      // Add files selected
      for (const file of curFiles) {
        const para = document.createElement("p");
        if (this.validFileType(file)) {
          let fileSize = this.returnFileSize(file.size);
          para.textContent = `File size ${fileSize}.`;
          const image = document.createElement("img");

          // Transform the image into a base64 url.
          // The function "URL.createObjectURL(File)" is a good method for
          // display purposes, but the storing and downloading processes 
          // cannot be handled with this one.
          let reader = new FileReader();
          // When the image is loaded inside FileReader, transform it.
          reader.addEventListener("load", function () {
            image.src = reader.result;
            image.alt = image.title = file.name;
            image.dataset.filesize = fileSize;
            // Retrieve the extension
            // (split by point and select the last chunk, the extension)
            let nameSplit = file.name.split('.');
            image.dataset.fileExtension = nameSplit[nameSplit.length - 1];
            // Add a custom class to add the image into IDB later
            image.classList.add('img-to-add');
            para.appendChild(image);
          }, false);

          reader.addEventListener("error", function () {
            para.textContent = `File name ${file.name}: The image could not be read.`;
          }, false);

          reader.readAsDataURL(file);

        } else {
          para.textContent = `File name ${file.name}: Not a valid file type. Update your selection.`;
        }
        preview.appendChild(para);
      }
    }
  }

  /**
   * Save images inside indexed DB
   * 
   * Verify the row before accessing row.id
   * 
   * Two options:
   * - Row's images required the row elements with indexedDB ids. The id
   * stored in Images.content array contains the row number.
   * - Inventory's images, save normally because the id corresponds with
   * inventory's id.
   * 
   * @param {Rows.arrays} rows Array with saved rows properties.
   */
  async save(dbHandler, rows = false) {
    
    while (this.content.length > 0) {
      // Always process the first pending image.
      const img = this.content[0];
      const imgData = {...img};

      if (imgData.type === "row") {

        if (rows === false) {
            throw new Error('Rows are required to save row images.');
        }

        const rowNumber = Number(imgData.id.split('-')[1]);

        const row = rows.find((r) => r.rown === rowNumber);

        if (!row || !row.id) {
          throw new Error(
            `Could not find the saved row for image linked to row ${rowNumber}.`
          );
        }

        // Switch the form IDs to the IndexedDB ones
        imgData.rows_id = row.id;
        
        // Delete unnecessary properties
        delete imgData.id;
        delete imgData.uid;
        delete imgData.type;
        
        // Wait until IndexedDB confirms the write.
        await dbHandler.addData(imgData, 'row_images');

      } else if (imgData.type === "inventory") {
        // Change the id property to join indexedDB schema
        imgData.inventories_id = imgData.id;

        // Delete unnecessary properties
        delete imgData.id;
        delete imgData.uid;
        delete imgData.type;

        // Wait until IndexedDB confirms the write.
        await dbHandler.addData(img, 'inventory_images');

      } else {
        throw new Error(`Unknown image type: ${imgData.type}`);
      }
      
      // Remove only the image that was succesfully saved.
      this.content.shift();
    }
  }

  /** 
   * Retrieve data from IndexedDB
   * 
   * @param {Integer} id The inventory/row id which images are linked to.
   * @param {String} idbCol Columname from indexedDb which contains the id.
   * @param {String} os Object Store name with the images to store.
   */
  async collect(id, idbId, os, dbH) {
    const invImages = await dbH.getRecords(id, idbId, os);
    // Loop over all images and store them
    invImages.forEach((img) => {
      this.content.push(img)
    });
  }
 
  /**
   * Remove thumbnail images
   * @param {HTMLDivElement} preview Element where images are stored
   * @param {Boolean} message Show message or not
   */
  resetDisplay(preview, message = true) {
    while (preview.firstChild) {
      preview.removeChild(preview.firstChild);
    }
    if (message) {
      const para = document.createElement("p");
      para.textContent = "No files currently selected for upload";
      preview.appendChild(para);
    }
  }

  openImageDisplay() {
    document.getElementById('img-container').style.display = 'block';
    // Block the app
    document.getElementById('block-app-div').style.display = 'block';
    // Add an event listener to close the image display
    document.querySelector('#close-img-container')
    .addEventListener('click', (_) => {
      // Reset image display
      const preview = document.querySelector('.img-preview');
      this.resetDisplay(preview);
      // Close image display panel
      document.getElementById('img-container').style.display = 'none';
      // Unblock the app
      document.getElementById('block-app-div').style.display = 'none';
    });
  }

  /**
   * Clear pending images when exiting the inventory
   */
  clearPending() {
    this.content = [];
  }

}

/**
 * Cache CSV-backed autocomplete datasets so each file is fetched only once.
 */
const autocompleteDataCache = new Map();

/**
 * Parse a CSV string into an array of objects.
 * Quoted fields and escaped double quotes are supported.
 *
 * @param {String} text CSV text.
 * @returns {Array<Object>}
 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = "";
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((value) => value !== "")) rows.push(row);
  if (rows.length === 0) return [];

  const headers = rows.shift().map((header, index) => {
    const cleanHeader = header.trim();
    return index === 0 ? cleanHeader.replace(/^\uFEFF/, "") : cleanHeader;
  });

  return rows.map((values) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = (values[index] ?? "").trim();
    });
    return item;
  });
}

/**
 * Load and cache an autocomplete CSV file.
 *
 * @param {String} source Relative URL to the CSV file.
 * @returns {Promise<Array<Object>>}
 */
function loadAutocompleteData(source) {
  if (!autocompleteDataCache.has(source)) {
    const request = fetch(source)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load autocomplete source: ${source}`);
        }
        return response.text();
      })
      .then(parseCsv)
      .catch((error) => {
        autocompleteDataCache.delete(source);
        console.error(error);
        return [];
      });

    autocompleteDataCache.set(source, request);
  }

  return autocompleteDataCache.get(source);
}

/**
 * Populate other columns in the same inventory row from a selected record.
 *
 * @param {Object} record Selected CSV record.
 * @param {Object} fillMap target inventory column -> CSV column.
 * @param {Number} rown Inventory row number.
 */
function fillAutocompleteColumns(record, fillMap, rown) {
  Object.entries(fillMap || {}).forEach(([targetColumn, sourceField]) => {
    const targetInput = document.querySelector(`#${targetColumn}-${rown}`);
    if (targetInput) {
      targetInput.value = record[sourceField] ?? "";
    }
  });
}

/**
 * Add CSV-backed autocomplete to an input.
 *
 * Schema in form_columns.js:
 * autocomplete: {
 *   source: 'species.csv',
 *   value: 'name',
 *   fill: { species_code: 'code' }
 * }
 *
 * Only the CSV columns referenced by `value` and `fill` are required.
 *
 * @param {HTMLInputElement} inp Text input element.
 * @param {Object} config Autocomplete configuration.
 * @param {Number} rown Inventory row number.
 */
function autocomplete(inp, config, rown) {
  let currentFocus = -1;
  const dataPromise = loadAutocompleteData(config.source);

  inp.addEventListener("input", async function () {
    const val = this.value;
    closeAllLists();
    if (!val) return;

    const data = await dataPromise;
    // Ignore stale async results if the user has typed again.
    if (this.value !== val) return;

    currentFocus = -1;
    const list = document.createElement("div");
    list.setAttribute("id", this.id + "autocomplete-list");
    list.setAttribute("class", "autocomplete-items");
    this.parentNode.appendChild(list);

    const searchValue = val.toLocaleLowerCase();

    data.forEach((record) => {
      const itemValue = String(record[config.value] ?? "");
      if (!itemValue.toLocaleLowerCase().startsWith(searchValue)) return;

      const item = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = itemValue.slice(0, val.length);
      item.appendChild(strong);
      item.appendChild(document.createTextNode(itemValue.slice(val.length)));

      item.addEventListener("click", () => {
        inp.value = itemValue;
        fillAutocompleteColumns(record, config.fill, rown);
        closeAllLists();
      });

      list.appendChild(item);
    });
  });

  // Also support a value typed manually instead of selected from the list.
  inp.addEventListener("change", async function () {
    const value = this.value.trim().toLocaleLowerCase();
    if (!value) return;

    const data = await dataPromise;
    const record = data.find((item) =>
      String(item[config.value] ?? "").trim().toLocaleLowerCase() === value
    );

    if (record) {
      this.value = record[config.value];
      fillAutocompleteColumns(record, config.fill, rown);
    }
  });

  inp.addEventListener("keydown", function (e) {
    let items = document.getElementById(this.id + "autocomplete-list");
    if (items) items = items.getElementsByTagName("div");

    if (e.code === 'ArrowDown') {
      currentFocus++;
      addActive(items);
    } else if (e.code === 'ArrowUp') {
      currentFocus--;
      addActive(items);
    } else if (e.code === 'Enter') {
      e.preventDefault();
      if (currentFocus > -1 && items) items[currentFocus].click();
    }
  });

  function addActive(items) {
    if (!items || items.length === 0) return;
    removeActive(items);
    if (currentFocus >= items.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = items.length - 1;
    items[currentFocus].classList.add("autocomplete-active");
  }

  function removeActive(items) {
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      items[i].classList.remove("autocomplete-active");
    }
  }

  function closeAllLists(element) {
    const lists = document.getElementsByClassName("autocomplete-items");
    for (let i = lists.length - 1; i >= 0; i--) {
      if (element !== lists[i] && element !== inp) {
        lists[i].parentNode.removeChild(lists[i]);
      }
    }
  }

  document.addEventListener("click", (e) => closeAllLists(e.target));
}

export class Download {

  /**
   * Create an object with data to download.
   * 
   * @param {Number} inventoryId
   * @param {Inventories} inventories
   */
  constructor(inventoryId, inventories) {
    // Get active inventory metadata
    this.inventory = inventories.selectById(inventoryId);
    
    // Use the column marked as display_col for the ZIP name
    const displayCol = getDisplayColumn()
    
    const displayValue = sanitizeFilename(
      this.inventory[displayCol],
      String(inventoryId)
    );

    // Construct the output folder name
    this.foldername = `inventory_${displayValue}.zip`;
  }

  /** Retrieve the data to download from IndexedDB */
  async fetchData(dbH) {
    // Get rows from IDB
    var rows = await dbH.getRecords(
      this.inventory.id, 'inventories_id', 'rows');
    this.rows = rows;

    // Get images (from the inventory)
    let invImages = new Images();
    await invImages.collect(
      this.inventory.id, 'inventories_id', 'inventory_images', dbH);
    // Store images inside this object
    this.inv_imgs = invImages.content;

    // Get images (from rows)
    let rowImages = new Images();
    await rowImages.collect(this.inventory.id, 'inventories_id', 'row_images', dbH);
    // Store images inside this object
    this.row_imgs = rowImages.content;

    // Download the data inside a ZIP folder
    this.download();
  }

  /**
   * Transform Array into CSV
   * ===============================================
   * Example input data:
   * [{colnames in json}, {row1 in json}]
   *
   * Example output:
   * [[colnames sep by colons], [row1 values], [row2 values] ...]
   *
   * @param {Array} arr Array of objects with properties to convert in csv
   * @param {Array} colnames Columnames inside an array
   */
  arrayToCsv(arr, colnames = null) {
    if (!Array.isArray(arr) || arr.length === 0) {
      return '';
    }

    const columns = colnames || Array.from(
      new Set(arr.flatMap((row) => Object.keys(row)))
    );

    const escapeCsvValue = (value) => {
      const text = String(value ?? '');

      // Quote CSV values containing commas, quotation marks, or line breaks
      if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
      }

      return text;
    };

    const csvRows = [
      columns,
        ...arr.map((row) => columns.map((column) => row[column] ?? ''))
      ];

    return csvRows
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n');
  }

  /**
  * Retrieve arrayBuffer from a base64 image
  * ===============================================
  * Get a blob base64 image and transform into an image object.
  * 
  * Function from FileSaver.js
  * 
  * @param {String} url Image in base64
  * @return {Promise} The promise containing the image.
  */
  transformImage(url) {
    return new Promise((resolve, reject) => {
      JSZipUtils.getBinaryContent(url, function (err, data) {
      if(err) {
          reject(err);
      } else {
          resolve(data);
      }
      });
    });
  }

  /**
   * Save data inside zip folder
   * 
   * Download the Download class elements inside a folder.
   */
  async download() {
    // Create new zip object
    var zip = new JSZip();
    // Add data. The metadata CSV always follows inventory_header.js.
    const metadataColumns = [...Object.keys(inv_header), 'id', 'created_at'];
    zip.file(
      'inventory_metadata.csv',
      this.arrayToCsv([this.inventory], metadataColumns)
    );

    const rowsForExport = this.rows.map(({ id, rown, ...row}) => ({
      row_id: rown,
      ...row
    }));
    
    zip.file('rows.csv', rowsForExport);

    // Add inventory images
    for (let img of this.inv_imgs) {
      // Transform image into arrayBuffer
      await this.transformImage(img.src).then((array_img)=>{
        let img_name = `invImage_${img.id}.${img.extension}`;
        zip.file(`inv_images/${img_name}`, array_img, {binary: true});
      })
    }

    // Map IndexedDB row IDs to inventory row numbers
    const rowNumberById = new Map(
      this.rows.map((row) => [row.id, row.rown])
    );

    // Add row images
    for (let img of this.row_imgs) {
      const rowNumber = rowNumberById.get(img.rows_id);

      if (rowNumber === undefined) {
        throw new Error(
          `Could not find row number for row image ${img.id}.`
        );
      }

      const array_img = await this.transformImage(img.src);

      const img_name = `row_${rowNumber}_image_${img.id}.${img.extension}`;

      // Transform image into arrayBuffer
      zip.file(
        `row_images/${img_name}`,
        array_img,
        {binary: true}
      );
    }

    // Generate task to download the folder
    zip.generateAsync({type: 'blob'}, (metadata) => {
      if (metadata.currentFile) {
        console.log("Current file = " + metadata.currentFile);
      }
      // console.log(metadata);
    }).then((blob) => {
      console.log('Downloading folder...');
      saveAs(blob, this.foldername);
    }, (e) => {
      console.log(e)
    });

  }
}

function sanitizeFilename(value, fallback = 'file') {
  let filename = String(value ?? '').trim();

  // Characters invalid in Windows filenames and ZIP paths
  filename = filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');

  // Windows does not allow filenames ending in spaces or dots
  filename = filename.replace(/[. ]+$/g, '');

  return filename || fallback;
}