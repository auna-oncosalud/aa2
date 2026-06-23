/* ============================================================
   Reclama Virtual — INDECOPI
   Configuración Tailwind unificada (paleta "Granate / Civic Trust")
   Se carga DESPUÉS del CDN de Tailwind en cada página.
   ============================================================ */
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Marca principal
        "primary": "#c40043",            // Granate Indecopi
        "on-primary": "#ffffff",
        "primary-container": "#fdeef3",
        "on-primary-container": "#5c0020",
        // Secundario (Navy institucional)
        "secondary": "#001e40",
        "on-secondary": "#ffffff",
        "secondary-container": "#e6e9ed",
        "on-secondary-container": "#001e40",
        // Acento naranja
        "tertiary": "#ff8934",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#fff2e8",
        "on-tertiary-container": "#662d00",
        "accent": "#ff8934",
        // Superficies y neutros
        "surface": "#f7f9fd",
        "on-surface": "#191c1e",
        "surface-variant": "#e0e3e6",
        "on-surface-variant": "#5b4042",
        "background": "#f7f9fd",
        "on-background": "#191c1e",
        "outline": "#8f6f71",
        "outline-variant": "#e4bdc0",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f2f4f7",
        "surface-container": "#eceef1",
        "surface-container-high": "#e6e8eb",
        "surface-container-highest": "#e0e3e6",
        "surface-soft": "#f9f9fc",
        "surface-lowest": "#ffffff",
        // Estados / semántica
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "success": "#1b7a34",
        // Alias de marca (compatibilidad con los mockups)
        "brand-navy": "#001e40",
        "brand-maroon": "#c40043",
        "brand-orange": "#ff8934",
        // Acentos por categoría
        "transport-teal": "#00897b",
        "education-purple": "#7b1fa2",
        "warning-gold": "#d4af37"
      },
      borderRadius: {
        "DEFAULT": "1rem",
        "lg": "1.5rem",
        "xl": "2rem",
        "2xl": "1.75rem",
        "full": "9999px"
      },
      spacing: {
        "input-height-lg": "64px",
        "touch-target-min": "48px",
        "stack-sm": "12px",
        "stack-md": "24px",
        "stack-lg": "48px",
        "gutter": "24px",
        "base": "8px",
        "container-padding": "24px",
        "margin-mobile": "16px",
        "margin-desktop": "48px"
      },
      maxWidth: {
        "container-max": "1200px"
      },
      fontFamily: {
        "display-lg": ["Public Sans"],
        "headline-lg": ["Public Sans"],
        "headline-lg-mobile": ["Public Sans"],
        "headline-md": ["Public Sans"],
        "title-md": ["Public Sans"],
        "body-lg": ["Public Sans"],
        "body-md": ["Public Sans"],
        "label-md": ["Public Sans"],
        "label-sm": ["Public Sans"],
        "label-uppercase": ["Public Sans"],
        "helper-text": ["Public Sans"],
        "placeholder-text": ["Public Sans"]
      },
      fontSize: {
        "display-lg": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "headline-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "700" }],
        "headline-lg-mobile": ["28px", { "lineHeight": "36px", "fontWeight": "700" }],
        "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
        "title-md": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "label-md": ["14px", { "lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "600" }],
        "label-sm": ["12px", { "lineHeight": "16px", "fontWeight": "500" }],
        "label-uppercase": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "700" }],
        "helper-text": ["14px", { "lineHeight": "20px", "fontWeight": "500" }],
        "placeholder-text": ["16px", { "lineHeight": "24px", "fontWeight": "400" }]
      }
    }
  }
};
