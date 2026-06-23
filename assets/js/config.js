/* ============================================================
   Reclama Virtual — INDECOPI · Configuración del asistente IA
   ============================================================

   👉 PASO ÚNICO: pega tu API key de Google Gemini entre las comillas.
      Consíguela gratis en: https://aistudio.google.com/app/apikey

   ⚠️ SEGURIDAD: esta key queda visible para cualquiera que inspeccione
      el sitio. Úsala solo para demos/prototipos. Para producción, mueve
      la llamada a un backend proxy (ver enviarAGemini() en chat.js).
   ============================================================ */

window.GEMINI_API_KEY = "AQ.Ab8RN6JawEqcI8UnWH-JMDAw4yCWYyNtcTlaf_YNtc7hCVO14Q";

// Modelo a usar (editable). Por defecto: Gemini 3.1 Flash Lite.
window.GEMINI_MODEL = "gemini-3.1-flash-lite";

// Canales de contacto inmediato (se muestran en el chat).
window.CONTACTO_INDECOPI = {
   telefono: "0-800-4-4040",
   correo: "sacreclamo@indecopi.gob.pe"
};
