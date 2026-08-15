import "fake-indexeddb/auto";
import { beforeEach, vi } from "vitest";

globalThis.confirm = vi.fn(() => true);
globalThis.alert = vi.fn();

function resetConfiguration() {
  globalThis.inv_header = {
    plot_id: {
      custom_name: "Plot ID",
      form_type: "input",
      input_type: "text",
      required: true,
      display_col: true
    },
    location: {
      custom_name: "Location",
      form_type: "input",
      input_type: "text"
    },
    topography: {
      custom_name: "Topography",
      form_type: "select",
      values: ["flat", "sloped"],
      meanings: ["Flat", "Sloped"]
    }
  };

  globalThis.inv_columns = {
    species: {
      custom_name: "Species",
      description: "Species name",
      form_type: "input",
      input_type: "text"
    },
    dbh_cm: {
      custom_name: "DBH (cm)",
      description: "Diameter at breast height",
      form_type: "input",
      input_type: "number",
      number_type: "float"
    },
    tree: {
      custom_name: "Tree #",
      description: "Tree number",
      form_type: "input",
      input_type: "number",
      number_type: "integer"
    },
    status: {
      custom_name: "Status",
      description: "Tree status",
      form_type: "select",
      values: ["LS", "DS"],
      meanings: ["Live Standing", "Dead Standing"]
    }
  };
}

globalThis.resetTestConfiguration = resetConfiguration;

beforeEach(() => {
  resetConfiguration();
  vi.clearAllMocks();
  globalThis.confirm.mockReturnValue(true);
});
