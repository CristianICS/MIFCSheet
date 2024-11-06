# MIFCSheet PWA

Application to collect in-situ forest inventories with MIFC approach.

## Key points

- Promises and async/await: The use of Promises and async/await makes the code more readable and easier to follow.
- (IndexedDB) Transaction Handling: The transaction handling logic is simplified and moved to use async/await, which makes it easier to manage errors and transaction completion.
- Class-based Structure: Using a class (e.g., IndexedDBHandler) provides a more modern, modular, and reusable structure. This aligns well with ES6+ JavaScript practices.
- Improved Readability: The use of methods within a class improves code organization and readability. It separates concerns more clearly and can be extended easily.
- **Offline-mode**.

## Configuration

First time the APP is loaded, the Service Worker is started and saved. Then, the user should added the application to the init page of their device and the app is ready to use it.

> While installing a PWA only takes a couple of clicks, depending on the web application features, the result of installing a PWA usually goes well beyond creating a link to a page on the Internet; installing a PWA more deeply integrates the web application on the user's device. <br>Depending on the PWA, device, and features of the operating system and browser, installing a PWA may enable native-like features, such as giving the app its own standalone window or registering it as a file handler. This also means uninstalling a PWA, which also only requires a couple of clicks, does more than just removing the PWA's icon. [Installing and uninstalling PWAs](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing#installing_and_uninstalling_pwas)

[Installing a PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing#installing_pwas)

[Uninstalling a PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing#uninstalling)

## References

```bibtex
@article{camaraartigasMuestreoTransectoFormaciones2013,
  title = {Muestreo En Transecto de Formaciones Vegetales de Faner{\'o}fitos y Cam{\'e}fitos ({{I}}): Fundamentos Metodol{\'o}gicos},
  shorttitle = {Muestreo En Transecto de Formaciones Vegetales de Faner{\'o}fitos y Cam{\'e}fitos ({{I}})},
  author = {C{\'a}mara Artigas, Rafael and D{\'i}az Del Olmo, Fernando},
  year = {2013},
  month = jun,
  journal = {Estudios Geogr{\'a}ficos},
  volume = {74},
  number = {274},
  pages = {67--88},
  issn = {1988-8546, 0014-1496},
  doi = {10.3989/estgeogr.201303},
  urldate = {2024-10-07},
  file = {C:\Zotero\storage\8THRKWQD\Cámara Artigas and Díaz Del Olmo - 2013 - Muestreo en transecto de formaciones vegetales de fanerófitos y caméfitos (I) fundamentos metodológ.pdf}
}

@article{camaraartigasMuestreoTransectoFormaciones2013a,
  title = {Muestreo En Transecto de Formaciones Vegetales de Faner{\'o}fitos y Cam{\'e}fitos ({{MIFC}}) ({{II}}): Estudio de Los Sabinares de La {{Reserva Biol{\'o}gica}} de {{Do{\~n}ana}} ({{RBD}}) ({{Espa{\~n}a}})},
  shorttitle = {Muestreo En Transecto de Formaciones Vegetales de Faner{\'o}fitos y Cam{\'e}fitos ({{MIFC}}) ({{II}})},
  author = {C{\'a}mara Artigas, Rafael and D{\'i}az Del Olmo, Fernando and Borja Barrera, C{\'e}sar},
  year = {2013},
  month = jun,
  journal = {Estudios Geogr{\'a}ficos},
  volume = {74},
  number = {274},
  pages = {89--114},
  issn = {1988-8546, 0014-1496},
  doi = {10.3989/estgeogr.201304},
  urldate = {2024-10-07},
  file = {C:\Zotero\storage\Q2TQK327\Cámara Artigas et al. - 2013 - Muestreo en transecto de formaciones vegetales de fanerófitos y caméfitos (MIFC) (II) estudio de lo.pdf}
}
```
