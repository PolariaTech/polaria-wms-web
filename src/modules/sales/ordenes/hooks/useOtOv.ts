import { getCompradorAdmin } from "@/modules/admin-panel";
import type { OrdenVentaFormEstado } from "../types/orden-venta-form-estado";
import { leerPedidoConIaApi } from "../services/sales-ai.api";
import { crearBorradorDesdeDocs } from "./crear-borrador-desde-docs";
import { extractCorreoContactoDesdeTexto } from "../utils/origen/correo-chrome";
import { groupOrigenCorreoToOrdenesTrabajo } from "../utils/origen/origen-correo-ordenes-trabajo";
import { todayIsoDate, tomorrowIsoDate } from "../utils/pedido/build-orden-venta-captura-observaciones";
import { mapPedidoExtraidoToForm } from "../utils/pedido/map-pedido-extraido-to-form";
import { isGarbageOcValue, resolveOrdenCompraLimpia } from "../utils/pedido/normalize-numero-pedido";
import { buildOrdenVentaPrefillFromComprador } from "../utils/pedido/prefill-orden-venta-from-comprador";
import { rankCompradoresFromNombre, shouldAutoAssignComprador, sugerenciasCompradorParaPicker } from "../utils/match/match-comprador-from-nombre";
import { catalogoDesdeBootstrap } from "./ov-form-bootstrap-catalogo";
import { construirAvisosPedidoIa, construirMissingFieldsPedidoIa, mapLineasPedidoIaAForm, resolverTextoOrigenParaPersistir } from "./useOtOv-helpers";

export async function abrirFormularioDesdeDocs(input: OrdenVentaFormEstado) {
  const { codigoCuenta, origenTexto, origenArchivoFiles, compradorLabel, compradores, handleSelectComprador, idComprador, selectedCompradorIdRef, ensureFormDataReady, bootstrapPromiseRef, productos, fichaComprador, anden, centroConsumo, contacto, correo, direccion, observaciones, telefono, ventanaDesde, ventanaHasta, ordenCompraHotel, setAceptaSustituciones, setAnden, setAutoFields, setCentroConsumo, setCompradorLabel, setCompradorNombreIa, setCompradorSugerencias, setContacto, setCorreo, setDireccion, setDiscrepancias, setError, setExigeOc, setFechaEntrega, setFichaComprador, setFormOtPage, setIdComprador, setIsReadingIa, setLineas, setMissingFields, setObservaciones, setOrdenCompraHotel, setOrdenesTrabajoPreview, setOrigenCorreoDraft, setOrigenTexto, setRegistrarTemperatura, setRequiereLote, setStartMode, setStep, setTelefono, setVentanaDesde, setVentanaHasta, setWarnFields, setTotalSolicitudDetectado } = input;
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

    // REQ-326: no rankear con `compradores` stale del render anterior a setState.
    const boot = bootstrapPromiseRef?.current
      ? await bootstrapPromiseRef.current
      : null;
    const catalogo = catalogoDesdeBootstrap(boot, { compradores, productos });

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
        catalogo.compradores,
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
      // REQ-326: sugerencias del picker para cualquier cliente (exacto + fuzzy).
      const sugerenciasPicker = nombreEscritoIa
        ? sugerenciasCompradorParaPicker(nombreEscritoIa, catalogo.compradores)
        : [];

      if (autoComprador && !idComprador) {
        handleSelectComprador(autoComprador, {
          // Nombre Mateo se conserva por defecto (REQ-326).
          // Ficha solo rellena huecos vía map; no pisa Ship To del documento.
          preservePedidoData: true,
        });
        idCompradorForMap = autoComprador.idComprador;
        telefonoForMap = autoComprador.telefono?.trim() || telefono;
        setCompradorSugerencias(sugerenciasPicker);
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
        setCompradorSugerencias(sugerenciasPicker);
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
              catalogo.compradores.find((row: { idComprador: string; telefono?: string | null }) => row.idComprador === idCompradorForMap)
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
        productos: catalogo.productos,
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
      const nextMissing = construirMissingFieldsPedidoIa({
        baseMissingFields: mapped.missingFields,
        tieneCliente: Boolean(autoComprador || idCompradorForMap),
        direccion: mapped.direccion,
      });
      setMissingFields(nextMissing);
      setDiscrepancias(mapped.discrepancias);
      setLineas(mapLineasPedidoIaAForm(mapped.lineas));

      const avisos = construirAvisosPedidoIa({
        advertencia: mapped.advertencia,
        archivosNoLegibles: mapped.archivosNoLegibles,
        lineas: mapped.lineas,
        tieneCliente: Boolean(autoComprador || idCompradorForMap),
        nombreCliente: pedido.nombreCliente,
        cantidadSugeridos: compradorRank.candidates.length,
      });

      setStartMode("docs");
      const origenRows = Array.isArray(pedido.origenCorreo)
        ? pedido.origenCorreo
        : [];
      setOrigenCorreoDraft(origenRows);
      setOrdenesTrabajoPreview(groupOrigenCorreoToOrdenesTrabajo(origenRows));
      setFormOtPage(0);
      // Persistir body del correo / mensaje para notas generales del PDF.
      const textoOrigenPersist = resolverTextoOrigenParaPersistir(
        pedido.textoOrigen,
        origenTexto,
      );
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
