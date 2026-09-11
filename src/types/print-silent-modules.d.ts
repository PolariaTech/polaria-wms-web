declare module "ipp" {
  type IppCallback = (
    err: Error | null,
    res?: { statusCode?: string },
  ) => void;

  interface IppPrinter {
    execute(
      operation: string,
      message: Record<string, unknown>,
      callback: IppCallback,
    ): void;
  }

  interface IppModule {
    Printer: (url: string) => IppPrinter;
  }

  const ipp: IppModule;
  export default ipp;
}

declare module "qz-tray" {
  const qz: unknown;
  export default qz;
}
