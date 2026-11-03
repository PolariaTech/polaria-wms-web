# Módulo: sales

Órdenes de venta y gestión comercial.

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
