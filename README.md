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

Modify the `inventory_header.js` and `form_columns.js` files in order to adapt the inventory form to your needs.

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

Before starting, make sure you have:

- A web server. You can use Python's built-in HTTP server.
- A device with a web browser installed.
- Access to the application files contained in the `MIFCSheet` folder.

The application has been tested in the following web browsers:

| Web Browser | Version |
| ---------------- | ------- |
| Google Chrome | 133 |
| Google Chrome for Android | 132 |
| Firefox | 134 |

For best results, open the application using one of those browsers.

### Server setup

This step is required to serve the application files to the browser. If you have access to a web hosting service, transfer the contents of the `MIFCSheet` folder to the appropriate directory on the server.

In addition, you can configure a local server setup for testing using Python.

1. Download the project files from GitHub, or clone the repository using:

    ```bash
    git clone <repository-url>
    ```

2. Move into the folder that contains the application files:

    ```bash
    cd <repository-folder>
    ```

3. Make sure the `MIFCSheet` folder is present. This folder contains the files required to run the web application.

4. From the directory that contains the `MIFCSheet` folder, start a simple local server. If Python 3 is installed, run:

    ```bash
    python -m http.server 8000
    ```

5. Open one of the tested web browsers and go to:

    ```txt
    http://localhost:8000/MIFCSheet/
    ```

The application should load directly in the browser. You can now test the interface and functionality locally.

When testing is complete, return to the terminal and press:

```txt
Ctrl + C
```

### Use the application

Once the application has been stored in a folder and made accessible via a server, it can be accessed through a web browser.

The final optional step is to [convert it into a PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing).
