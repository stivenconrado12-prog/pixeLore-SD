# 🎮 PixeLore

> Enciclopedia web, catálogo interactivo y comparador de precios de videojuegos con gestión de lore y personajes.

![Badge Estado](https://img.shields.io/badge/Estado-Completado-success?style=for-the-badge)
![Tecnologías](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20JS-blue?style=for-the-badge)

---

## 🚀 Descripción del Proyecto

**PixeLore** es una aplicación web frontend desarrollada como proyecto académico para el programa de Análisis y Desarrollo de Software (**ADSO**). Su objetivo principal es ofrecer a los gamers un espacio centralizado donde no solo pueden consultar información técnica y de lore profundo sobre sus videojuegos favoritos, sino también comparar precios entre distintas tiendas digitales y filtrar catálogos de forma dinámica.

---

## ✨ Características Principales

* 🔍 **Buscador en Tiempo Real:** Filtra instantáneamente el catálogo por título de juego o compañía desarrolladora.
* 🏷️ **Filtro por Géneros:** Selector dinámico basado en las categorías disponibles en la base de datos.
* 📖 **Modal de Detalles (Lore y Personajes):** Cada tarjeta despliega una ventana emergente con la historia del juego, descripción de personajes principales y enlaces directos de compra con indicador de mejor precio.
* ⚙️ **Panel de Administración Secreto:** Permite añadir nuevos juegos al catálogo local mediante un atajo de teclado (`admin`).
* 💾 **Persistencia de Datos:** Sincronización automática entre el archivo fuente `games.json` y el almacenamiento local (`localStorage`) del navegador.

---

## 🛠️ Tecnologías Utilizadas

* **HTML5:** Estructuración semántica del contenido.
* **CSS3:** Diseño responsivo con Flexbox, CSS Grid, variables personalizadas y modo oscuro (`Dark Theme`).
* **JavaScript (ES6+):** Lógica asincrónica (`fetch API`), manipulación del DOM, gestión de eventos y almacenamiento local.
* **Live Server:** Entorno de desarrollo local.

---

## 📂 Estructura de Archivos

```text
PixeLore/
│
├── index.html
├── data/
│   └── games.json
└── assets/
    ├── css/
    │   └── styles.css
    └── js/
        └── app.js
