import { getCompradorAdmin } from "@/modules/admin-panel";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";
import { UNIDAD_MEDIDA_VENTA_DEFAULT } from "../../shared/types/sales.types";
import { leerPedidoConIaApi } from "../services/sales-ai.api";
import { crearBorradorDesdeDocs } from "./crear-borrador-desde-docs";
import { extractCorreoContactoDesdeTexto } from "../utils/origen/correo-chrome";
import { groupOrigenCorreoToOrdenesTrabajo } from "../utils/origen/origen-correo-ordenes-trabajo";
import { cleanCorreoBodyForNotas, isCuerpoMensajeFormato } from "../utils/origen/texto-origen-pedido";
import { todayIsoDate, tomorrowIsoDate } from "../utils/pedido/build-orden-venta-captura-observaciones";
import { mapPedidoExtraidoToForm } from "../utils/pedido/map-pedido-extraido-to-form";
import { isGarbageOcValue, resolveOrdenCompraLimpia } from "../utils/pedido/normalize-numero-pedido";
import { formatPrecioInput } from "../utils/pedido/orden-venta-create-helpers";
import { buildOrdenVentaPrefillFromComprador } from "../utils/pedido/prefill-orden-venta-from-comprador";
import { rankCompradoresFromNombre, shouldAutoAssignComprador } from "../utils/match/match-comprador-from-nombre";

export async function abrirFormularioDesdeDocs(input: OrdenVentaFormEstado) {
  const { codigoCuenta, origenTexto, origenArchivoFiles, compradorLabel, compradores, handleSelectComprador, idComprador, selectedCompradorIdRef, ensureFormDataReady, productos, fichaComprador, anden, centroConsumo, contacto, correo, direccion, observaciones, telefono, ventanaDesde, ventanaHasta, fechaEntrega, ordenCompraHotel, aceptaSustituciones, requiereLote, registrarTemperatura, autoFields, warnFields, setAceptaSustituciones, setAnden, setAutoFields, setCentroConsumo, setCompradorLabel, setCompradorNombreIa, setCompradorSugerencias, setContacto, setCorreo, setDireccion, setDiscrepancias, setError, setExigeOc, setFechaEntrega, setFichaComprador, setFormOtPage, setIdComprador, setIsReadingIa, setLineas, setMissingFields, setObservaciones, setOrdenCompraHotel, setOrdenesTrabajoPreview, setOrigenCorreoDraft, setOrigenTexto, setRegistrarTemperatura, setRequiereLote, setStartMode, setStep, setTelefono, setVentanaDesde, setVentanaHasta, setWarnFields, setTotalSolicitudDetectado } = input;
    if (!codigoCuenta) {
      setError("No hay cuenta activa.");
      return;
    }
    if (!origenTexto.trim() && origenArchivoFiles.length === 0) {
      setError("Pega el texto del pedido o adjunta al menos un archivo.");
      return;
    }

    const ready = await ensureFormDataReady();
    if (!ready) return;

    setIsReadingIa(true);
    setError(null);
    setTotalSolicitudDetectado(null);

    try {
      const pedido = await leerPedidoConIaApi({
        codigoCuenta,
        cliente: compradorLabel || undefined,
        texto: origenTexto,
        archivos: origenArchivoFiles,
      });
      // REQ-279: total del cuerpo o de adjuntos extraídos en el BFF.
      setTotalSolicitudDetectado(
        typeof pedido.totalSolicitud === "number" &&
          Number.isFinite(pedido.totalSolicitud) &&
          pedido.totalSolicitud > 0
          ? pedido.totalSolicitud
          : null,
      );

      const compradorRank = rankCompradoresFromNombre(
        pedido.nombreCliente,
        compradores,
      );
      const autoComprador = shouldAutoAssignComprador(
        compradorRank,
        pedido.nombreCliente,
      );
      const nombreEscritoIa = pedido.nombreCliente?.trim() || null;
      // Siempre conserva lo que escribió/leyó del cliente (caption bajo el campo).
      if (nombreEscritoIa) {
        setCompradorNombreIa(nombreEscritoIa);
      }

      let fichaForMap = fichaComprador;
      let idCompradorForMap = idComprador;
      let telefonoForMap = telefono;

      // Solo auto-asigna con match exacto si el usuario aún no eligió uno.
      if (autoComprador && !idComprador) {
        handleSelectComprador(autoComprador, {
          keepNombreIa: Boolean(nombreEscritoIa),
          // Ficha solo rellena huecos vía map; no pisa Ship To del documento.
          preservePedidoData: true,
        });
        idCompradorForMap = autoComprador.idComprador;
        telefonoForMap = autoComprador.telefono?.trim() || telefono;
        try {
          const detalle = await getCompradorAdmin({
            codigoCuenta,
            idComprador: autoComprador.idComprador,
          });
          if (selectedCompradorIdRef.current === autoComprador.idComprador) {
            fichaForMap = detalle.ficha;
            setFichaComprador(detalle.ficha);
            const prefill = buildOrdenVentaPrefillFromComprador({
              ficha: detalle.ficha,
              telefonoComprador: autoComprador.telefono,
            });
            setExigeOc(prefill.exigeOc);
          }
        } catch {
          /* se mantiene el match; ficha puede quedar vacía */
        }
      } else if (!idComprador && nombreEscritoIa) {
        selectedCompradorIdRef.current = "";
        setIdComprador("");
        setCompradorLabel(nombreEscritoIa);
        setCompradorSugerencias(
          compradorRank.candidates.map((c) => c.comprador).slice(0, 4),
        );
        setFichaComprador(null);
        setExigeOc(false);
      } else if (!idComprador) {
        selectedCompradorIdRef.current = "";
        setIdComprador("");
        setCompradorLabel("");
        setCompradorNombreIa(null);
        setCompradorSugerencias([]);
        setFichaComprador(null);
        setExigeOc(false);
      }

      const fichaBase = fichaForMap
        ? buildOrdenVentaPrefillFromComprador({
            ficha: fichaForMap,
            telefonoComprador:
              compradores.find((row: { idComprador: string; telefono?: string | null }) => row.idComprador === idCompradorForMap)
                ?.telefono ?? telefonoForMap,
          })
        : {
            centroConsumo,
            ventanaDesde,
            ventanaHasta,
            direccion,
            anden,
            contacto,
            telefono: telefonoForMap,
            correo,
            aceptaSustituciones: "",
            requiereLote: "",
            registrarTemperatura: "",
            observaciones,
          };

      const mapped = mapPedidoExtraidoToForm({
        pedido,
        productos,
        ficha: {
          centroConsumo: fichaBase.centroConsumo,
          ventanaDesde: fichaBase.ventanaDesde,
          ventanaHasta: fichaBase.ventanaHasta,
          direccion: fichaBase.direccion,
          anden: fichaBase.anden,
          contacto: fichaBase.contacto,
          telefono: fichaBase.telefono,
          correo: fichaBase.correo,
          aceptaSustituciones: fichaBase.aceptaSustituciones,
          requiereLote: fichaBase.requiereLote,
          registrarTemperatura: fichaBase.registrarTemperatura,
          observaciones: fichaBase.observaciones,
        },
        tomorrowIso: tomorrowIsoDate(),
        todayIso: todayIsoDate(),
      });

      setFechaEntrega(mapped.fechaEntrega);
      setCentroConsumo(mapped.centroConsumo);
      setObservaciones(mapped.observaciones);
      {
        const occMapped = resolveOrdenCompraLimpia(
          mapped.ordenCompraHotel,
          origenTexto,
        );
        if (occMapped) setOrdenCompraHotel(occMapped);
        else if (isGarbageOcValue(ordenCompraHotel)) setOrdenCompraHotel("");
      }
      setDireccion(mapped.direccion);
      setAnden(mapped.anden);
      setContacto(mapped.contacto);
      setTelefono(mapped.telefono);
      setCorreo(
        mapped.correo.trim() ||
          extractCorreoContactoDesdeTexto(
            pedido.textoOrigen || origenTexto,
          ) ||
          "",
      );
      setVentanaDesde(mapped.ventanaDesde);
      setVentanaHasta(mapped.ventanaHasta);
      setAceptaSustituciones(mapped.aceptaSustituciones);
      setRequiereLote(mapped.requiereLote);
      setRegistrarTemperatura(mapped.registrarTemperatura);
      setAutoFields(mapped.autoFields);
      setWarnFields(mapped.warnFields);
      const nextMissing = new Set(mapped.missingFields);
      if (!autoComprador && !idCompradorForMap) {
        nextMissing.add("cliente");
      } else {
        nextMissing.delete("cliente");
      }
      if (!mapped.direccion.trim()) nextMissing.add("direccion");
      else nextMissing.delete("direccion");
      setMissingFields(nextMissing);
      setDiscrepancias(mapped.discrepancias);
      setLineas(
        mapped.lineas.map((linea) => ({
          idProducto: linea.idProducto,
          nombre: linea.nombre,
          codigo: linea.codigo,
          idBodega: linea.idBodega,
          cantidadInput: linea.cantidadInput,
          cajasInput: linea.cajasInput,
          presentacion: linea.presentacion,
          especificacion: linea.especificacion,
          descuentoPctInput: linea.descuentoPctInput,
          ivaPct: "0",
          kgDisponible: linea.kgDisponible,
          unidadMedida: linea.unidadMedida || UNIDAD_MEDIDA_VENTA_DEFAULT,
          precioUnitario: linea.precioUnitario,
          precioInput: formatPrecioInput(linea.precioUnitario),
          precioManual: linea.precioManual,
          aliasCliente: linea.aliasCliente,
          filledByIa: linea.filledByIa,
          otId: linea.otId,
          catalogPending: linea.catalogPending,
          catalogAmbiguo: linea.catalogAmbiguo,
          sugerencia: linea.sugerencia ?? null,
          sugerenciasAlternativas: linea.sugerenciasAlternativas ?? [],
        })),
      );

      const avisos: string[] = [];
      if (mapped.advertencia) avisos.push(mapped.advertencia);
      if (mapped.archivosNoLegibles.length > 0) {
        avisos.push(
          `No se pudieron leer: ${mapped.archivosNoLegibles.join(", ")}. Se guardan como respaldo.`,
        );
      }
      const pendingCatalog = mapped.lineas.filter(
        (linea) => linea.catalogPending,
      ).length;
      if (mapped.lineas.length === 0 && !mapped.advertencia) {
        avisos.push(
          "No se reconocieron productos del pedido. Revisa el mensaje y agrégalos a mano.",
        );
      } else if (pendingCatalog > 0) {
        avisos.push(
          pendingCatalog === 1
            ? "1 producto no identificado."
            : `${pendingCatalog} productos no identificados.`,
        );
      }
      if (!autoComprador && !idCompradorForMap) {
        const sugeridos = compradorRank.candidates.length;
        avisos.push(
          pedido.nombreCliente?.trim()
            ? sugeridos > 0
              ? `El cliente «${pedido.nombreCliente.trim()}» no coincide exacto: revisa la sugerencia o elige otro.`
              : `El cliente «${pedido.nombreCliente.trim()}» no está en clientes. Selecciónalo para continuar.`
            : "Selecciona el cliente para continuar.",
        );
      }

      setStartMode("docs");
      const origenRows = Array.isArray(pedido.origenCorreo)
        ? pedido.origenCorreo
        : [];
      setOrigenCorreoDraft(origenRows);
      setOrdenesTrabajoPreview(groupOrigenCorreoToOrdenesTrabajo(origenRows));
      setFormOtPage(0);
      // Persistir body del correo / mensaje para notas generales del PDF.
      const textoOrigenPersist =
        pedido.textoOrigen?.trim() ||
        (origenTexto.trim()
          ? isCuerpoMensajeFormato(origenTexto)
            ? origenTexto.trim()
            : cleanCorreoBodyForNotas(origenTexto)
          : "");
      if (textoOrigenPersist) setOrigenTexto(textoOrigenPersist);

      // REQ-199: crear borrador ya (origen + adjuntos) para el «+» de Cypher y Guardar.
      const avisoBorrador = await crearBorradorDesdeDocs(input, {
        origenRows,
        textoOrigen: textoOrigenPersist,
        idComprador: idCompradorForMap,
      });
      if (avisoBorrador) avisos.push(avisoBorrador);

      setStep(origenRows.length > 0 ? "preview" : "form");
      setError(avisos.length > 0 ? avisos.join(" ") : null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo leer el pedido. Intenta de nuevo.",
      );
    } finally {
      setIsReadingIa(false);
    }
}
