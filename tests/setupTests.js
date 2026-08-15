import "fake-indexeddb/auto";
import { beforeEach, vi } from "vitest";

globalThis.confirm = vi.fn(() => true);
globalThis.alert = vi.fn();

function resetConfiguration() {
  globalThis.inv_header = {
    name: {
        custom_name: "Name",
        form_type: "input",
        input_type: "text",
        required: true,
        display_col: true
    },
      init_point_id: {
        custom_name: "Initial point ID",
        form_type: "input",
        input_type: "number",
        number_type: "integer"
    },
      final_point_id: {
        custom_name: "Final point ID",
        form_type: "input",
        input_type: "number",
        number_type: "integer"
    },
      comment: {
        custom_name: "Comments",
        form_type: "textarea"
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
