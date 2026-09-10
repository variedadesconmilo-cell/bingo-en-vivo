# 🎱 BINGO EN VIVO — Multijugador en tiempo real

Aplicación web de bingo donde un moderador transmite el sorteo en vivo
y varios jugadores se conectan desde sus móviles usando Firebase Realtime Database.

## 📂 Estructura de archivos

    bingo-en-vivo/
    ├── index.html            → Pantalla de inicio (crear / unirse a sala)
    ├── moderador.html        → Panel del moderador
    ├── jugador.html          → Pantalla del jugador
    ├── style.css             → Estilos (neón / casino digital)
    ├── app.js                → Lógica compartida
    └── firebase-config.js    → Credenciales de Firebase

## 🚀 Cómo ponerlo en marcha

### 1. Crear el proyecto en Firebase (gratis)

1. Entra a https://console.firebase.google.com y pulsa **Agregar proyecto**.
2. Ponle un nombre (ej. `bingo-en-vivo`) y crea el proyecto.
3. En el menú lateral: **Compilación → Realtime Database → Crear base de datos**.
   - Elige la ubicación más cercana.
   - Empieza en **modo de prueba** (luego puedes aplicar reglas).
4. Ve a **Configuración del proyecto** (engranaje) → pestaña **General**.
5. Baja hasta **Tus apps** → pulsa el ícono `</>` (Web) → registra una app.
6. Copia el objeto `firebaseConfig` que te muestra.

### 2. Configurar `firebase-config.js`

Abre el archivo y pega tus valores en el objeto `firebaseConfig`:

```js
const firebaseConfig = {
  apiKey:            "AIza...",
  authDomain:        "bingo-en-vivo.firebaseapp.com",
  databaseURL:       "https://bingo-en-vivo-default-rtdb.firebaseio.com",
  projectId:         "bingo-en-vivo",
  storageBucket:     "bingo-en-vivo.appspot.com",
  messagingSenderId: "1234567890",
  appId:             "1:1234:web:abcd..."
};