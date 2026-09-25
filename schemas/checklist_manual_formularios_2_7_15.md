# Checklist manual — formularios 2.7.15 (reportes / precios / grupos)

Fecha: 24/09/2026 · Repo: polaria-wms-web · Resultado global: **PASS**

| # | Formulario | Ítem | Resultado |
|---|---|---|---|
| 1 | Cargar reporte embed | Foco inicial en Nombre; tab Nombre→URL→Guardar | PASS |
| 2 | Cargar reporte embed | Modal no cierra con clic afuera con datos sin guardar / mientras envía | PASS |
| 3 | Cargar reporte embed | Nombre vacío → mensaje de descripción obligatoria; URL inválida → mensaje de URL | PASS |
| 4 | Editar reporte embed | Pre-llenado Nombre/URL/Estado desde BD; tabulación correcta | PASS |
| 5 | Editar reporte embed | Cambiar a Inactivo y guardar refleja estado | PASS |
| 6 | Permisos de reportes | Sin usuario no permite Guardar; picker no cierra el modal padre por backdrop | PASS |
| 7 | Permisos de reportes | Checks reflejan grants; guardar vacío quita acceso; recarga muestra grants | PASS |
| 8 | Gestión precios compradores | Export/Import/Print deshabilitados en busy; alcance Todos vs uno | PASS |
| 9 | Crear/Editar grupo | Labels y errores dicen “grupo”; NIT/teléfono validan; foco en Nombre | PASS |
| 10 | Equivalencia/precio (alias) | Precio inválido y equivalencia >255 muestran mensajes del schema | PASS |

Observación: la entidad de persistencia de grupos sigue siendo `cliente` en BD; solo cambia copy de UI.
