type IdCliente = string | number | null | undefined;

interface DebeAvisarDireccionInput {
  /** El cambio de cliente lo hizo el usuario (catálogo o sugerencias). */
  verificarDireccionEntrega: boolean | undefined;
  idClienteAnterior: IdCliente;
  idClienteNuevo: IdCliente;
}

/**
 * REQ-160: el aviso de revisar la dirección de entrega solo sale cuando el
 * usuario cambió de un cliente ya elegido a otro. Elegir el primer cliente o
 * confirmar el mismo no lo dispara, aunque el pedido ya traiga dirección.
 */
export function debeAvisarVerificarDireccion({
  verificarDireccionEntrega,
  idClienteAnterior,
  idClienteNuevo,
}: DebeAvisarDireccionInput): boolean {
  if (!verificarDireccionEntrega) return false;
  return Boolean(idClienteAnterior) && idClienteAnterior !== idClienteNuevo;
}
