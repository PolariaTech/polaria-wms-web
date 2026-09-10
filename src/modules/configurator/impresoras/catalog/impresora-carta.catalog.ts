/**
 * Catálogo de marcas y modelos de impresoras de papel carta (Letter 8.5×11),
 * típicas en oficinas de Colombia, México y Estados Unidos.
 */

export interface ImpresoraMarcaCatalogItem {
  id: string;
  nombre: string;
  origen: string;
}

export interface ImpresoraModeloCatalogItem {
  id: string;
  marcaId: string;
  nombre: string;
  tipo: "laser" | "inkjet" | "mfp";
}

export const IMPRESORA_TIPO_LABEL: Record<
  ImpresoraModeloCatalogItem["tipo"],
  string
> = {
  laser: "Láser",
  inkjet: "Inyección",
  mfp: "Multifunción",
};

export const IMPRESORA_MARCAS_CATALOG: readonly ImpresoraMarcaCatalogItem[] = [
  { id: "hp", nombre: "HP", origen: "EE. UU." },
  { id: "brother", nombre: "Brother", origen: "Japón" },
  { id: "canon", nombre: "Canon", origen: "Japón" },
  { id: "epson", nombre: "Epson", origen: "Japón" },
  { id: "lexmark", nombre: "Lexmark", origen: "EE. UU." },
  { id: "xerox", nombre: "Xerox", origen: "EE. UU." },
  { id: "kyocera", nombre: "Kyocera", origen: "Japón" },
  { id: "ricoh", nombre: "Ricoh", origen: "Japón" },
  { id: "pantum", nombre: "Pantum", origen: "China" },
  { id: "oki", nombre: "OKI", origen: "Japón" },
  { id: "dell", nombre: "Dell", origen: "EE. UU." },
  { id: "samsung", nombre: "Samsung", origen: "Corea" },
];

/**
 * Modelos carta (Letter) habituales en oficinas CO / MX / US.
 * `marcaId` debe coincidir con `IMPRESORA_MARCAS_CATALOG[].id`.
 */
export const IMPRESORA_MODELOS_CATALOG: readonly ImpresoraModeloCatalogItem[] = [
  // HP
  { id: "hp-lj-m404dn", marcaId: "hp", nombre: "LaserJet Pro M404dn", tipo: "laser" },
  { id: "hp-lj-m404dw", marcaId: "hp", nombre: "LaserJet Pro M404dw", tipo: "laser" },
  { id: "hp-mfp-m428fdw", marcaId: "hp", nombre: "LaserJet Pro MFP M428fdw", tipo: "mfp" },
  { id: "hp-color-m454dw", marcaId: "hp", nombre: "Color LaserJet Pro M454dw", tipo: "laser" },
  { id: "hp-mfp-m479fdw", marcaId: "hp", nombre: "Color LaserJet Pro MFP M479fdw", tipo: "mfp" },
  { id: "hp-lj-e50145dn", marcaId: "hp", nombre: "LaserJet Enterprise E50145dn", tipo: "laser" },
  { id: "hp-oj-9015e", marcaId: "hp", nombre: "OfficeJet Pro 9015e", tipo: "inkjet" },
  { id: "hp-oj-9025e", marcaId: "hp", nombre: "OfficeJet Pro 9025e", tipo: "mfp" },
  // Brother
  { id: "br-hl-l2350dw", marcaId: "brother", nombre: "HL-L2350DW", tipo: "laser" },
  { id: "br-hl-l6400dw", marcaId: "brother", nombre: "HL-L6400DW", tipo: "laser" },
  { id: "br-hl-l8360cdw", marcaId: "brother", nombre: "HL-L8360CDW", tipo: "laser" },
  { id: "br-mfc-l2750dw", marcaId: "brother", nombre: "MFC-L2750DW", tipo: "mfp" },
  { id: "br-mfc-l8900cdw", marcaId: "brother", nombre: "MFC-L8900CDW", tipo: "mfp" },
  { id: "br-mfc-j6955dw", marcaId: "brother", nombre: "MFC-J6955DW", tipo: "inkjet" },
  // Canon
  { id: "cn-lbp226dw", marcaId: "canon", nombre: "imageCLASS LBP226dw", tipo: "laser" },
  { id: "cn-mf445dw", marcaId: "canon", nombre: "imageCLASS MF445dw", tipo: "mfp" },
  { id: "cn-mf746cdw", marcaId: "canon", nombre: "imageCLASS MF746Cdw", tipo: "mfp" },
  { id: "cn-gx6020", marcaId: "canon", nombre: "MAXIFY GX6020", tipo: "inkjet" },
  { id: "cn-ira-c3520i", marcaId: "canon", nombre: "imageRUNNER ADVANCE C3520i", tipo: "mfp" },
  // Epson
  { id: "ep-wf-4830", marcaId: "epson", nombre: "WorkForce Pro WF-4830", tipo: "mfp" },
  { id: "ep-wf-c5890", marcaId: "epson", nombre: "WorkForce Pro WF-C5890", tipo: "mfp" },
  { id: "ep-et-2850", marcaId: "epson", nombre: "EcoTank ET-2850", tipo: "inkjet" },
  { id: "ep-et-4850", marcaId: "epson", nombre: "EcoTank ET-4850", tipo: "mfp" },
  { id: "ep-wf-2860", marcaId: "epson", nombre: "WorkForce WF-2860", tipo: "mfp" },
  // Lexmark
  { id: "lx-ms431dn", marcaId: "lexmark", nombre: "MS431dn", tipo: "laser" },
  { id: "lx-mx431adn", marcaId: "lexmark", nombre: "MX431adn", tipo: "mfp" },
  { id: "lx-c3224dw", marcaId: "lexmark", nombre: "C3224dw", tipo: "laser" },
  { id: "lx-mc3224dwe", marcaId: "lexmark", nombre: "MC3224dwe", tipo: "mfp" },
  // Xerox
  { id: "xr-b230", marcaId: "xerox", nombre: "B230", tipo: "laser" },
  { id: "xr-b310", marcaId: "xerox", nombre: "B310", tipo: "laser" },
  { id: "xr-b405", marcaId: "xerox", nombre: "VersaLink B405", tipo: "mfp" },
  { id: "xr-c405", marcaId: "xerox", nombre: "VersaLink C405", tipo: "mfp" },
  // Kyocera
  { id: "ky-p2040dn", marcaId: "kyocera", nombre: "ECOSYS P2040dn", tipo: "laser" },
  { id: "ky-m2040dn", marcaId: "kyocera", nombre: "ECOSYS M2040dn", tipo: "mfp" },
  { id: "ky-p5026cdw", marcaId: "kyocera", nombre: "ECOSYS P5026cdw", tipo: "laser" },
  { id: "ky-m5526cdw", marcaId: "kyocera", nombre: "ECOSYS M5526cdw", tipo: "mfp" },
  // Ricoh
  { id: "ri-sp330dn", marcaId: "ricoh", nombre: "SP 330DN", tipo: "laser" },
  { id: "ri-im350", marcaId: "ricoh", nombre: "IM 350", tipo: "mfp" },
  { id: "ri-imc3000", marcaId: "ricoh", nombre: "IM C3000", tipo: "mfp" },
  // Pantum (LatAm)
  { id: "pa-p2509w", marcaId: "pantum", nombre: "P2509W", tipo: "laser" },
  { id: "pa-m6700dw", marcaId: "pantum", nombre: "M6700DW", tipo: "mfp" },
  { id: "pa-cp2200dw", marcaId: "pantum", nombre: "CP2200DW", tipo: "laser" },
  // OKI
  { id: "ok-b432dn", marcaId: "oki", nombre: "B432dn", tipo: "laser" },
  { id: "ok-mc573dn", marcaId: "oki", nombre: "MC573dn", tipo: "mfp" },
  { id: "ok-c332dn", marcaId: "oki", nombre: "C332dn", tipo: "laser" },
  // Dell
  { id: "dl-s2830dn", marcaId: "dell", nombre: "S2830dn", tipo: "laser" },
  { id: "dl-e525w", marcaId: "dell", nombre: "E525w", tipo: "mfp" },
  // Samsung (legacy / rebranded)
  { id: "sm-m2835dw", marcaId: "samsung", nombre: "Xpress M2835DW", tipo: "laser" },
  { id: "sm-c480w", marcaId: "samsung", nombre: "Xpress C480W", tipo: "mfp" },
];

export function getImpresoraMarcaById(
  marcaId: string,
): ImpresoraMarcaCatalogItem | undefined {
  return IMPRESORA_MARCAS_CATALOG.find((marca) => marca.id === marcaId);
}

export function listImpresoraModelosByMarca(
  marcaId: string,
): ImpresoraModeloCatalogItem[] {
  return IMPRESORA_MODELOS_CATALOG.filter((modelo) => modelo.marcaId === marcaId);
}
