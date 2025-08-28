# Scrapping Tool (Web)

UI web para buscar negocios en Google (**Places API**) y descargar resultados en **CSV**.

## Requisitos
- Google Cloud Project con **billing** activo.
- APIs habilitadas:
  - Maps JavaScript API
  - Places API
  - Geocoding API
- API Key restringida por **HTTP referrers** al dominio de Vercel.
  - Ej.: `https://maps-extractor-ot.vercel.app/*`
  - (Opcional) previews: `https://*.vercel.app/*`
  - (Opcional) local: `http://localhost:*/*`

## Estructura recomendada
