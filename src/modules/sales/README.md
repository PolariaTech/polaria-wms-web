# Módulo: sales

Órdenes de venta y gestión comercial.

## Comunicación (OV y afines)

Canal híbrido documentado en [docs/ARQUITECTURA-COMUNICACION.md](../../../docs/ARQUITECTURA-COMUNICACION.md) §6:

- Listado / borrador / locks / materializar → **Supabase (A)**
- Emitir / cancelar / correos / OT / reagrupar → **Nest (B)**
- Leer pedido IA / impresión / adjuntos / log → **BFF Next (D)** (+ Mateo **C** en lectura)

No mover un bloque de canal sin ticket y tests.

## Responsabilidades

- Creación y seguimiento de órdenes de venta (OV)
- Reserva de stock al confirmar venta
- Facturación y documentos comerciales
- Gestión de clientes

## Funcionalidades previstas

- Crear OV con productos, cantidades y precios
- Estados: borrador → confirmada → en preparación → despachada → entregada
- Consultar disponibilidad de stock al crear OV
- Cancelación y devoluciones
- Reportes de ventas por período

## Entidades relacionadas

- OrdenVenta, LíneaVenta, Cliente, Factura

## Correos de pedidos (REQ-104)

- `correos/`: barra lateral de Ventas, lista de correos de n8n con filtros y paginación del servidor, e ingreso manual de un correo como OV (asíncrono: 202 + sondeo del estado).
- Rutas: `/dashboard/ventas/correos-mateo` (todos) y `/dashboard/ventas/correos-descartados` (los que el flujo no ingresó).
- `/dashboard/ventas/correo/[messageId]`: el correo completo (mensaje aislado y adjuntos), en la misma pestaña, con «Volver a los correos»; dos columnas (datos y adjuntos / mensaje) en el alto de la ventana y el asunto como título.
