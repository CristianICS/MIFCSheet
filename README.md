[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.17140284.svg)](https://doi.org/10.5281/zenodo.17140284)

# MIFCSheet PWA

Application to collect in-situ forest inventories with MIFC approach. URL: [https://mifcsheet.unizar.es](https://mifcsheet.unizar.es/)

The parameters collected by the application can be customized to match the user requirements.

## Key points

- Promises and async/await: The use of Promises and async/await makes the code more readable and easier to follow.
- (IndexedDB) Transaction Handling: The transaction handling logic is simplified and moved to use async/await, which makes it easier to manage errors and transaction completion.
- Class-based Structure: Using a class (e.g., IndexedDBHandler) provides a more modern, modular, and reusable structure. This aligns well with ES6+ JavaScript practices.
- Improved Readability: The use of methods within a class improves code organization and readability. It separates concerns more clearly and can be extended easily.
- **Offline-mode**.
- Inventory parameters easy customization using the JSON dictionaries *inventory_header.js* and *form_columns.js*.

## Configuration

First time the APP is loaded, the Service Worker is started and saved. Then, the user should added the application to the init page of their device and the app is ready to use it.

> While installing a PWA only takes a couple of clicks, depending on the web application features, the result of installing a PWA usually goes well beyond creating a link to a page on the Internet; installing a PWA more deeply integrates the web application on the user's device. <br>Depending on the PWA, device, and features of the operating system and browser, installing a PWA may enable native-like features, such as giving the app its own standalone window or registering it as a file handler. This also means uninstalling a PWA, which also only requires a couple of clicks, does more than just removing the PWA's icon. [Installing and uninstalling PWAs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing#installing_and_uninstalling_pwas)

[Installing a PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing#installing_pwas)

[Uninstalling a PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing#uninstalling)

## Customization

Available parameters to include in *inventory_header.js*:

| Parameter | Description |
| --------- | ----------- |
| `custom_name` | Name describing the variable. |
| `form_type` | Available options are input, select and textarea. HTML form elements where the variables are included. |
| `input_type` | When `form_type` is input. Available options are text and number. |
| `required` | If the variable is mandatory. Boolean. |
| `display_col` | It is the column which will describe the inventory inside the panel containing all the collected inventories. Usually is a variable with a custom name giving more information than the auto-generated ID. |

Available parameters to include in *form_columns.js*:

| Parameter | Description |
| --------- | ----------- |
| `description` | Brief text explaining the feature. It will be showed at the bottom of the inventory page automatically.
| `form_type` | Available options are input and select.
| `input_type` | When `form_type` is input. Available options are text and number
| `input_type` | When `form_type` is input. Available options are text and number
| `number_type` | When `form_type` is input and input_type equals number. Available options are integer and float
| `values` | When `form_type` is select, this is the field where the user specifies the available options. List of possible values, e.g., [’N’, ’S’].
| `meanings` | Descriptions for each of the values available, e.g., ['North', 'South'].
| `autocomplete` | `true` or `false`. Specifies if current field has an autocomplete function. If it does, the `species.js` dictionary must contain entries related with the name of the `form_columns.js` dictionary's key.
| `autocomplete_code` | `true` or `false`. If there is a column with `autocomplete`, the `autocomplete_code` column displays the code of the value inside autocomplete column.
| `autocomplete_value` | Inside the `autocomplete_code` column, This parameter defines the column key that stores the values relating to the autocomplete code.

## How to use

1. Copy all the files to your own server.
2. Modify the `inventory_header.js` and `form_columns.js` files in order to adapt the inventory form to your needs.
3. Access the application through a modern web browser.
4. Optional: [Convert it into a PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing).

