// Gives the browser/config globals that classes.js expects
import "fake-indexeddb/auto";
import { vi } from "vitest";

global.confirm = vi.fn(() => true);
global.alert = vi.fn();

global.inv_header = {
  name: {
    custom_name: "Inventory name",
    form_type: "input",
    input_type: "text",
    required: true,
    display_col: true
  },
  location: {
    custom_name: "Location",
    form_type: "input",
    input_type: "text"
  }
};

global.inv_columns = {
  species: {
    custom_name: "Species",
    form_type: "input",
    input_type: "text"
  },
  dbh: {
    custom_name: "DBH",
    form_type: "input",
    input_type: "number",
    number_type: "float"
  },
  n: {
    custom_name: "N",
    form_type: "input",
    input_type: "number",
    number_type: "integer"
  }
};

global.species_metadata = [];
global.autocomplete = vi.fn();