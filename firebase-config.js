/* ============================================================
   firebase-config.js
   ------------------------------------------------------------
   Configuración de Firebase (SDK compat v10 por CDN).
   Reemplaza TODOS los valores "TU_..." por los de tu proyecto.
   ------------------------------------------------------------
   Cómo obtenerlos:
   1. https://console.firebase.google.com  ->  "Agregar proyecto"
   2. En el proyecto: Compilación -> Realtime Database -> Crear
      (elige "Modo de prueba" para empezar rápido)
   3. Configuración del proyecto (engranaje) -> Tus apps
      -> App web (</>) -> registrar app -> copiar el objeto
   4. Pega aquí abajo los valores. El campo databaseURL es
      IMPRESCINDIBLE (viene aparte, en la sección Realtime Database).
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyCFynTG7CrIjWF1gmHNclJM6khxHUYlQ",
  authDomain: "bingo-en-vivo-30d59.firebaseapp.com",
  databaseURL: "https://bingo-en-vivo-30d59-default-rtdb.firebaseio.com",
  projectId: "bingo-en-vivo-30d59",
  storageBucket: "bingo-en-vivo-30d59.firebasestorage.app",
  messagingSenderId: "149258280754",
  appId: "1:149258280754:web:96cd437a97f7678199c12b",
  measurementId: "G-MQS3R3BSPG"
};

/* --- ¿El usuario ya configuró sus credenciales? --- */
const FIREBASE_OK = !firebaseConfig.databaseURL.includes("TU_PROYECTO");

/* --- Inicialización del SDK --- */
firebase.initializeApp(firebaseConfig);

/* --- Referencia global a la base de datos en tiempo real --- */
const db = firebase.database();

/* --- Aviso visual si falta configurar --- */
if (!FIREBASE_OK) {
  window.addEventListener("DOMContentLoaded", () => {
    const b = document.createElement("div");
    b.className = "banner-config";
    b.innerHTML =
      "⚠️ <b>Falta configurar Firebase.</b> Abre <code>firebase-config.js</code> " +
      "y pega tus credenciales (apiKey, databaseURL, projectId...). " +
      "Revisa las instrucciones al final del proyecto.";
    document.body.prepend(b);
  });
}