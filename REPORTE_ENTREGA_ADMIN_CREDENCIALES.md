# REPORTE DE ENTREGA AL ADMINISTRADOR

**Proyecto:** pedido-csa-web  
**Fecha:** 4 de marzo de 2026  
**Asunto:** Credenciales vigentes y estado de validaciones de contraseña

---

## 1) Resumen ejecutivo
Se actualizó el sistema con las credenciales vigentes del equipo y se sincronizaron las validaciones internas que antes usaban claves antiguas.

---

## 2) Usuarios y contraseñas vigentes

| ID | Usuario      | Contraseña        | Rol          | Alcance principal |
|----|--------------|-------------------|--------------|-------------------|
| 1  | adrian       | adrian2026        | admin        | Acceso total |
| 2  | hector       | hector2026        | admin        | Acceso total |
| 8  | EMC          | superadmin123     | superadmin   | Reportes avanzados |
| 3  | inventario   | inventario2026*   | inventario   | Bodega, catálogo, pedidos |
| 4  | contabilidad | conta*            | contabilidad | Facturas y reportes de cobro |
| 5  | vendedor 3   | vendedor*         | admin        | Acceso total |

Fuente de verdad en código: `src/components/Login.jsx`

---

## 3) Módulos donde se validan contraseñas de seguridad
Se actualizaron para aceptar únicamente las contraseñas vigentes listadas arriba:

- `src/components/CatalogoProductos.jsx` (confirmación de eliminación de producto)
- `src/components/FacturasGuardadas.jsx` (operaciones sensibles en facturas)
- `src/components/FacturaDetalle.jsx` (editar/eliminar abonos)

---

## 4) Estado de entrega

✅ Credenciales de acceso alineadas con usuarios actuales.  
✅ Validaciones antiguas (`edwin` / `777`) retiradas.  
✅ Componentes críticos sincronizados con el esquema actual.

---

## 5) Recomendación inmediata (seguridad)
Por seguridad, se recomienda en una siguiente iteración:

1. Mover contraseñas fuera del frontend (no hardcodear en React).  
2. Gestionar autenticación en backend (Supabase Auth o API).  
3. Rotar claves compartidas periódicamente y usar hashing.

---

## 6) Responsable técnico
Actualización aplicada en la base de código del proyecto `pedido-csa-web` con fecha 4 de marzo de 2026.
