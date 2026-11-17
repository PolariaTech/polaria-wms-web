function valorAtributo(valor: string): string {
  return valor.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function bloqueAtributos(elemento: Element, sangria: string): string {
  const lista = Array.from(elemento.attributes);
  if (lista.length === 0) return "";
  if (lista.length === 1) {
    return ` ${lista[0].name}="${valorAtributo(lista[0].value)}"`;
  }
  return lista
    .map((atributo) => `\n${sangria}${atributo.name}="${valorAtributo(atributo.value)}"`)
    .join("");
}

function serializarElemento(elemento: Element, profundidad: number): string {
  const sangria = "  ".repeat(profundidad);
  const sangriaHija = "  ".repeat(profundidad + 1);
  const nombre = elemento.tagName;
  const atributos = bloqueAtributos(elemento, sangriaHija);
  const variosAtributos = elemento.attributes.length > 1;
  const hijos = Array.from(elemento.children);
  const texto = hijos.length === 0 ? (elemento.textContent ?? "").trim() : "";
  const apertura = `${sangria}<${nombre}${atributos}`;
  if (hijos.length === 0 && texto === "") {
    return `${apertura}${variosAtributos ? `\n${sangria}` : ""}/>`;
  }
  if (hijos.length === 0) {
    return `${apertura}${variosAtributos ? `\n${sangria}` : ""}>${texto}</${nombre}>`;
  }
  const interior = hijos.map((hijo) => serializarElemento(hijo, profundidad + 1)).join("\n");
  return `${apertura}${variosAtributos ? `\n${sangria}>` : ">"}\n${interior}\n${sangria}</${nombre}>`;
}

/**
 * El XML de una factura o pedido suele venir en una sola línea. Lo parte para leerlo;
 * si no se puede interpretar, se deja como llegó. La descarga sigue siendo el original.
 */
export function formatearXmlParaVista(texto: string): string {
  const documento = new DOMParser().parseFromString(texto, "application/xml");
  if (documento.getElementsByTagName("parsererror").length > 0) return texto;
  const raiz = documento.documentElement;
  if (!raiz) return texto;
  const declaracion = /^(\s*<\?xml[\s\S]*?\?>)/.exec(texto);
  const cuerpo = serializarElemento(raiz, 0);
  return declaracion ? `${declaracion[1]}\n${cuerpo}` : cuerpo;
}
