import {
  REGIMENES,
  SI_NO,
  SUSTITUCIONES,
  TOLERANCIAS,
  UNIDADES,
} from "./openai-pedido.tipos";

export const RESPONSE_SCHEMA = {
  name: "extraccion_pedido",
  strict: true,
  schema: {
    type: "object",
    properties: {
      fechaEntregaTexto: {
        type: ["string", "null"],
        description:
          "La frase EXACTA del mensaje/PDF/tabla que indica cuándo se debe ENTREGAR el pedido (ej. 'mañana temprano', 'el jueves', '15 de septiembre', '21/10/2026', '27 de agosto de 2026'). Copia la frase tal cual, no calcules la fecha ni asumas 'mañana' si hay otra fecha concreta. Extráela AUNQUE sea la única pista de fecha (cuerpo, columna Fecha, Delivery Date). Si el mensaje menciona otras fechas que no son la de entrega, esas van en la especificación de esa línea, no aquí. null SOLO si de verdad no hay ninguna pista de fecha de entrega.",
      },
      centroConsumo: {
        type: ["string", "null"],
        description:
          "Área INTERNA de consumo del hotel (cocina, bar, banquete, almacén de fila, centro de costo). Copia CÓDIGO + NOMBRE completos tal cual (ej. 'ABAN Banquetes Alim', 'BAWH Bar Whisky', 'COPM Coc Plaza Mx', 'ACOE Comedor Empleados'). NUNCA acortes ni quites el prefijo de 3–6 letras. NUNCA pongas hotel/denominación/Bill To (eso es nombreCliente). Si solo hay resort sin cocina/área → null. Incertidumbre → null.",
      },
      observaciones: {
        type: ["string", "null"],
        description:
          "Observación general corta del pedido completo (no de una línea de producto). PRIORIDAD ALTA si el documento trae secciones rotuladas: «Observaciones del cliente», «Observaciones», «Notas del cliente», «Comentarios del cliente», «Indicaciones del cliente», «Instrucciones», «Notas», «Aviso al almacén». Copia ahí lo que diga el cliente (madurez, calidad, empaque, etc.). NUNCA inventes conclusiones, inconsistencias entre correo y adjuntos, ni análisis del documento — eso no es una nota de alistamiento. null solo si de verdad no hay ninguna.",
      },
      notasGeneralesAlmacen: {
        type: ["string", "null"],
        description:
          "SOLO palabras clave / especificaciones de almacén (máx. 160 caracteres, 3 renglones). PRIORIDAD: bloque «Observaciones del cliente» (o Notas/Comentarios/Indicaciones del cliente), madurez (no muy maduro, enrriados, amarillo, etc.), andén, sin sustitutos, juegos de OC. Incluye viñetas del cliente si existen. NO copies el cuerpo del correo, saludos, tablas de productos, firma, vigencia, horario genérico de recepción ni dirección. NUNCA escribas conclusiones tipo «el correo dice X pero el PDF dice Y» — solo aclaraciones útiles para surtir/entregar. null solo si no hay ninguna especificación útil.",
      },
      ordenCompraHotel: {
        type: ["string", "null"],
        description:
          "Identificador de la orden de compra del hotel/cliente para ESTE pedido. INTERPRETA el documento: no busques solo una etiqueta fija. El rótulo cambia según el emisor (ej. 'PO NUMBER', 'PO #', 'P.O.', 'Purchase Order', 'Orden de compra', 'OC', 'Nº OC', 'No. de orden', 'Order No.', 'Customer PO', 'Requisition', 'Req #', 'REQUISICION #', 'R.C.'). Extrae el CÓDIGO/NÚMERO asociado a esa idea (ej. 'CUNMC0046026' o '50184' si dice REQUISICION # 50184). En PDFs XPU HA la OCC es el número junto a 'REQUISICION #' (ej. 50179), NUNCA el código de la columna 'Artículo' (ej. 00001678 con ceros a la izquierda) ni el título 'Requisición de Compra'. NUNCA uses 'Autoriza', 'Autorizado', 'rAutorizado' ni 'Solicita'. null solo si de verdad no aparece ningún identificador de OC/PO/requisición.",
      },
      nombreCliente: {
        type: ["string", "null"],
        description:
          "Denominación comercial / razón social / hotel / propiedad / cuenta que hace el pedido (ej. 'Dreams Jade Resort & Spa', 'Promociones Marina Morelos', 'Marriott Cancun'). Etiquetas: Cliente, Customer, Bill To, Sold To, Hotel, Property, Account Name, Compañía, Denominación. NO es el centro de consumo (cocina/bar). No uses el PO ni el RFC como nombre. null solo si no aparece ningún nombre de cliente/hotel.",
      },
      rfc: {
        type: ["string", "null"],
        description:
          "RFC del cliente/hotel SOLO si aparece literal en el mensaje o en algún documento adjunto (ej. 'nuestro RFC es XAXX010101000'). null si no se menciona — no lo inventes ni lo deduzcas del nombre del cliente.",
      },
      // Entrega: extraer SIEMPRE del correo, mensaje o PDF (Ship To / Deliver To /
      // Enviar a / Andén / Contacto / Tel / hora). null solo si ese dato no aparece.
      // Régimen y políticas siguen siendo null salvo mención explícita.
      regimen: {
        type: ["string", "null"],
        enum: [...REGIMENES, null],
        description:
          "Régimen fiscal del receptor SOLO si el mensaje/documento lo declara explícito (ej. 'nuestro régimen es 601'). Usa la opción de la lista más parecida a lo dicho; null si no se menciona.",
      },
      direccion: {
        type: ["string", "null"],
        description:
          "Dirección de ENTREGA tal como aparece en el correo, mensaje o PDF. Busca Ship To, Deliver To, Enviar a, Entregar en, Domicilio de entrega, Dirección de envío. Copia calle, número, colonia, ciudad y CP si vienen. Si hay Bill To (facturación) y Ship To (entrega), usa Ship To. Solo dirección física: NUNCA incluyas correos, fax ni teléfonos (van en sus propios campos), aunque aparezcan junto a la dirección; si el único dato junto a la etiqueta es un correo, no es la dirección. null solo si el documento no trae ninguna dirección de entrega.",
      },
      anden: {
        type: ["string", "null"],
        description:
          "Andén, muelle, dock, puerta o punto de recepción si aparece en el correo, mensaje o PDF (Andén, Dock, Puerta, Muelle, Receiving). Copia el texto tal cual. null solo si no aparece.",
      },
      contacto: {
        type: ["string", "null"],
        description:
          "Nombre de quien recibe esta entrega si aparece en el correo, mensaje o PDF (Contacto, Attn, Recibe, Atención, Buyer de recepción). null solo si no aparece.",
      },
      telefono: {
        type: ["string", "null"],
        description:
          "Teléfono de la entrega o del contacto si aparece en el correo, mensaje o PDF (Tel, Teléfono, Phone, Cel, WhatsApp). Copia el número tal cual. null solo si no aparece.",
      },
      correo: {
        type: ["string", "null"],
        description:
          "Correo del CONTACTO del hotel/cliente (persona). Si De/From es genérico (bss_system@birchstreet.net, noreply, admonaguacatesdepuebla@gmail.com, cuenta del proveedor), IGNÓRALO y busca Email/E-mail/Correo/mailto en el cuerpo o PDF del hotel. Si De/From es una persona del hotel (ej. 'Nombre <mail@hotel.com>'), úsalo. No uses el Para/To del proveedor. null solo si no hay ningún correo humano del cliente.",
      },
      horarioDesde: {
        type: ["string", "null"],
        description:
          "Hora de INICIO de la ventana de recepción, 24h HH:MM, tomada del correo, mensaje o PDF (Hora de entrega, delivery time, ventana de recepción, a partir de, de X a Y). Ej. 'Hora de entrega 6:00 am' → '06:00'; '8:00 AM – 2:00 PM' → desde '08:00'. Si solo hay una hora, ponla aquí. null SOLO si no hay ninguna hora.",
      },
      horarioHasta: {
        type: ["string", "null"],
        description:
          "Hora de FIN de la ventana de recepción, 24h HH:MM, si el correo, mensaje o PDF indica un rango (hasta, before, entre X y Y, 8am-2pm). Ej. '8:00 AM – 2:00 PM' → '14:00'. null si solo hay una hora o no hay fin.",
      },
      tolerancia: {
        type: ["string", "null"],
        enum: [...TOLERANCIAS, null],
        description:
          "Tolerancia de peso aceptada SOLO si el mensaje/documento la declara explícita (ej. 'aceptamos +/- 5%'). null si no se menciona.",
      },
      sustituciones: {
        type: ["string", "null"],
        enum: [...SUSTITUCIONES, null],
        description:
          "Política de sustitución de producto SOLO si el mensaje/documento la declara explícita para este pedido (ej. 'si no hay, sustituyan avisando antes'). Usa la opción de la lista que mejor represente lo dicho; null si no se menciona.",
      },
      lote: {
        type: ["string", "null"],
        enum: [...SI_NO, null],
        description:
          "'Sí' o 'No' SOLO si el mensaje/documento pide explícito trazabilidad de lote para este pedido. null si no se menciona.",
      },
      temperatura: {
        type: ["string", "null"],
        enum: [...SI_NO, null],
        description:
          "'Sí' o 'No' SOLO si el mensaje/documento pide explícito registro de temperatura al entregar. null si no se menciona.",
      },
      advertencia: {
        type: ["string", "null"],
        description:
          "Cuando el texto y/o los archivos NO parecen tener relación con un pedido de fruta/verdura para un hotel (ej. es un contrato, un currículum, spam, contenido irrelevante, o está vacío/ilegible), explica brevemente por qué en una frase. Si sí es un pedido (aunque venga incompleto), deja null.",
      },
      cuerpoMensaje: {
        type: "array",
        description:
          "Cuerpo del correo/mensaje ORGANIZADO para mostrarlo al usuario: prosa (saludo, instrucciones, firma) y tablas reales. No inventes filas ni celdas. Une celdas partidas por salto de línea (ej. 'Baja' + 'California' → 'Baja California'). Quita cabeceras De/From/Subject y disclaimers legales. Conserva hora de entrega, notas y firma.",
        items: {
          type: "object",
          properties: {
            tipo: {
              type: "string",
              enum: ["texto", "tabla"],
              description:
                "'texto' = párrafos con saltos de línea. 'tabla' = matriz de celdas (primera fila = encabezados).",
            },
            texto: {
              type: ["string", "null"],
              description:
                "Prosa del bloque si tipo=texto. null si tipo=tabla.",
            },
            filas: {
              type: ["array", "null"],
              description:
                "Filas de la tabla si tipo=tabla (cada fila es un array de celdas string). Primera fila = encabezados. null si tipo=texto.",
              items: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
          required: ["tipo", "texto", "filas"],
          additionalProperties: false,
        },
      },
      lineas: {
        type: "array",
        items: {
          type: "object",
          properties: {
            textoOriginal: {
              type: "string",
              description:
                "Cómo el cliente nombró el producto, tal cual, sin traducir.",
            },
            productoCatalogo: {
              type: ["string", "null"],
              description:
                "SOLO si hay UNA coincidencia inequívoca: la clave EXACTA de la lista de catálogo inyectada (copia carácter por carácter, ej. 'AGUACATE EXTRA HASS (115001005)'). null si: (a) ninguna clave encaja, (b) hay 2+ claves parecidas (misma fruta/verdura con distinta talla, calibre, grado, presentación o SKU) y el documento no distingue cuál, o (c) solo hay parecido parcial. Nunca inventes ni reformatees claves. Si dejas null, el usuario verá sugerencias cercanas y podrá elegir, cambiar o borrar la línea.",
            },
            cantidad: {
              type: ["number", "null"],
              description:
                "SOLO si el mensaje da un número de cantidad TOTAL explícito y directo (ej. '40 kilos'). Si el mensaje solo da cajas y una presentación (ej. '15 cajas de 1.5 kg') y no dice el total, deja null — NO lo calcules tú, eso lo hace el backend con código, no tú.",
            },
            unidad: {
              type: ["string", "null"],
              enum: [...UNIDADES, null],
              description:
                "Unidad mencionada: KGM (kilos), CJ (cajas como unidad de conteo, sin peso), UN (piezas/unidades sueltas). null si no se menciona explícitamente. Nunca devuelvas un valor fuera de esta lista (ej. nunca 'kilos' o 'kg' como texto — siempre el código KGM).",
            },
            cajas: {
              type: ["number", "null"],
              description:
                "Número de cajas si el mensaje lo menciona explícitamente. null si no.",
            },
            presentacion: {
              type: ["string", "null"],
              description:
                "La presentación EXACTA (de la lista de presentaciones disponibles) si el mensaje la menciona explícitamente (ej. 'cajas de 20 kg' → 'Caja 20 kg'). null si no se menciona — no asumas la presentación habitual del cliente.",
            },
            especificacion: {
              type: ["string", "null"],
              description:
                "Especificación de ESTE producto para almacén (REQ-287). Interpreta correo + adjuntos: madurez/color/textura/corte/empaque/domo/tamaño u otra indicación del cliente sobre ESE ítem (comida FYV, quesos, salsas, etc.). Si dice «Madurez: Amarillo» o columna Madurez=Amarillo → escribe exactamente «Madurez: Amarillo» (no solo «Amarillo»). Si el nombre trae «(Domo de 500 g)» → «Domo de 500g». Ej.: «limón verde», «queso blando», «sin penacho», «2x galón de 5 litros». No inventes. null si esa fila no trae especificación.",
            },
            numeroPedido: {
              type: ["string", "null"],
              description:
                "Número/código de pedido del hotel para ESTE renglón (PO line order, Numero pedido, Order No. distinto por destino). Si el documento trae varios pedidos (387529 Banquetes, 387531 Cocina, etc.), cada línea lleva el suyo. null si no hay.",
            },
            almacen: {
              type: ["string", "null"],
              description:
                "Almacén / cocina / centro de consumo de ESTE renglón (columna Almacén / Centro de consumo / Centro de costo). Copia el texto COMPLETO: código + nombre (ej. 'ABAN Banquetes Ali', 'ACOE ComedorEmplea', 'BAWH Bar Whisky', 'COPM Coc Plaza Mx'). NUNCA omitas ni acortes el código de 3–6 letras aunque la celda del PDF se vea cortada. NO uses el almacén genérico del encabezado si la fila trae el suyo. null solo si la fila no indica destino.",
            },
            numeroAlmacen: {
              type: ["string", "null"],
              description:
                "Código numérico del almacén si viene (ej. '001'). null si no.",
            },
            referenciaPedido: {
              type: ["string", "null"],
              description:
                "Texto de referencia del pedido/renglón (ej. 'FYV BANQUETES PARA ENTREGA 29/09/2026…'). null si no.",
            },
            codigoProductoCliente: {
              type: ["string", "null"],
              description:
                "SKU/código del producto según el cliente (ej. '00000889'). null si no.",
            },
            responsableExterno: {
              type: ["string", "null"],
              description:
                "Nombre del responsable externo/contacto del pedido si aparece por renglón. null si no.",
            },
            precioUnitario: {
              type: ["number", "null"],
              description:
                "Precio unitario de ESTE renglón tomado de la columna Precio / P.U. / Precio unitario del documento (número, sin símbolo de moneda ni comas de miles). Ej. 33.00 o 188.00. null si la fila no trae precio.",
            },
          },
          required: [
            "textoOriginal",
            "productoCatalogo",
            "cantidad",
            "unidad",
            "cajas",
            "presentacion",
            "especificacion",
            "numeroPedido",
            "almacen",
            "numeroAlmacen",
            "referenciaPedido",
            "codigoProductoCliente",
            "responsableExterno",
            "precioUnitario",
          ],
          additionalProperties: false,
        },
      },
    },
    required: [
      "fechaEntregaTexto",
      "centroConsumo",
      "observaciones",
      "notasGeneralesAlmacen",
      "ordenCompraHotel",
      "nombreCliente",
      "rfc",
      "regimen",
      "direccion",
      "anden",
      "contacto",
      "telefono",
      "correo",
      "horarioDesde",
      "horarioHasta",
      "tolerancia",
      "sustituciones",
      "lote",
      "temperatura",
      "advertencia",
      "cuerpoMensaje",
      "lineas",
    ],
    additionalProperties: false,
  },
} as const;
