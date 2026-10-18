# Archivos adicionales para GitHubCert
Copiar estas carpetas dentro del repositorio existente, incluyendo el contenido oculto .github.
No reemplazar el repositorio entero ni modificar su package.json principal.
El proyecto didactico esta aislado en apps/rtl-demo.
Los nombres rtl-* evitan colisiones con las practicas anteriores; comprobar si ya existen.

RTL 01 consume la accion y el workflow publicos de OrganizacionRTL.
RTL 02 llama a un workflow local que usa una accion local. No necesita la organizacion.
El workflow rtl-local-reutilizable.yml solo tiene workflow_call: no aparece con Run workflow propio.
