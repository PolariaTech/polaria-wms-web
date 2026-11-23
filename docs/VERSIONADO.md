# Versionado de producto (web + api + db)

Los tres repos de WMS comparten **el mismo número de versión de producto**.

| Repo | Archivos a actualizar |
|------|------------------------|
| `polaria-wms-web` | `VERSION`, `package.json`, `package-lock.json`, `POLARIA_PRODUCT_VERSION` en `src/constants/brand/brand.ts` |
| `polaria-wms-api` | `VERSION`, `package.json`, `package-lock.json` |
| `polaria-wms-db` | `VERSION`, `package.json`, `package-lock.json` |

## Regla

1. La versión visible al usuario es la del **web** (`version: x.y.z` en el shell).
2. En cada release de producto, **api** y **db** se bumpean al **mismo** `x.y.z`.
3. No dejar repos con números distintos salvo hotfixes documentados (y alinear en el siguiente release).

## Cómo bumpear

1. Elegir el nuevo semver (ej. `2.13.54`).
2. Actualizar los archivos de la tabla en los tres repos.
3. Commit/tag por repo con el mismo número cuando se despliegue juntos.
