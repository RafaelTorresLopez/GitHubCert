# Ejemplo de acción Docker en GitHub Actions

## Qué incluye

- `.github/actions/validar-json/action.yml`: entradas y ejecución de la acción.
- `.github/actions/validar-json/Dockerfile`: imagen con Python 3.12.
- `.github/actions/validar-json/validar.py`: valida la sintaxis de un archivo JSON.
- `.github/workflows/validar.yml`: ejecuta la validación con cada push o manualmente.
- `config/aplicacion.json`: configuración de ejemplo válida.
- `.github/workflows/saludo-contenedor.yml`: segundo ejemplo, con una imagen Alpine publicada; se ejecuta solo manualmente.

## Reproducirlo en GitHub

1. Crea un repositorio de pruebas en GitHub y clónalo en tu equipo.
2. Extrae el ZIP y copia su contenido a la raíz de ese repositorio. Incluye la carpeta `.github` completa; no copies una carpeta contenedora adicional. Si ya existe `.github`, combina las carpetas sin eliminar archivos existentes.
3. Confirma que existen las rutas `.github/workflows/validar.yml` y `config/aplicacion.json` desde la raíz del repositorio.
4. Desde PowerShell, dentro de la carpeta del repositorio, ejecuta:

```powershell
git add .github config README.md
git commit -m "Añadir ejemplo de acción Docker para validar JSON"
git push
```

5. Abre la pestaña **Actions** de tu repositorio y la ejecución **Validar configuración**.
6. El paso **Validar archivo JSON** debe mostrar `JSON válido: config/aplicacion.json` y terminar correctamente.

No tienes que instalar Python ni Docker en tu equipo para probarlo en GitHub: el job utiliza un runner Ubuntu hospedado por GitHub. GitHub Actions debe estar habilitado y las políticas de tu repositorio deben permitir las acciones utilizadas.

Para iniciarlo manualmente, el workflow debe estar en la rama predeterminada. En **Actions**, selecciona **Validar configuración**, pulsa **Run workflow**, selecciona la rama y confirma la ejecución. El ejemplo **Saludo desde un contenedor** se inicia del mismo modo y muestra `Hola desde Alpine`.

## Provocar un fallo y comprobar la validación

En `config/aplicacion.json`, añade una coma después del último valor:

```text
"descripcion": null,
}
```

Ese fragmento es deliberadamente inválido. Haz commit y push. El paso de validación debe fallar con `Validación fallida: ...` y código de salida 1. Retira la coma, haz otro commit y push y comprueba que vuelve a pasar.

La acción comprueba la sintaxis JSON. No comprueba que existan campos determinados, que el puerto sea válido o que la configuración cumpla reglas de negocio.

## Prueba local opcional

Si tienes Python instalado, desde la raíz del repositorio en Windows:

```powershell
py -3 .github/actions/validar-json/validar.py config/aplicacion.json
```

Si además dispones de Docker Desktop configurado para contenedores Linux, puedes reproducir el entorno desde PowerShell:

```powershell
docker build -t ejemplo-validar-json .github/actions/validar-json
docker run --rm --mount "type=bind,source=$($PWD.Path),target=/github/workspace" --workdir /github/workspace ejemplo-validar-json config/aplicacion.json
```

## Qué observar

El workflow obtiene el repositorio con checkout. Después construye la imagen definida por el Dockerfile y ejecuta el validador dentro de un contenedor, con acceso al directorio de trabajo del repositorio. Python procede de la imagen y no requiere un paso de instalación en el runner.

Las etiquetas de imágenes y acciones se mantienen aquí para facilitar el aprendizaje. Para una fijación inmutable se pueden utilizar digests de imágenes y SHA de commits de acciones.

## Verificación de este paquete

Se ha ejecutado el programa Python con el JSON incluido (éxito), con JSON inválido (fallo) y con un archivo inexistente (fallo). Se ha comprobado la integridad del ZIP. La construcción Docker y la ejecución en GitHub no se han realizado desde este entorno.

## Documentación oficial

- https://docs.github.com/en/actions/tutorials/use-containerized-services/create-a-docker-container-action
- https://docs.github.com/en/actions/reference/workflows-and-actions/metadata-syntax
- https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax



## Para visualizar el estado del workflow
[![Node.js CI](https://github.com/RafaelTorresLopez/GitHubCert/actions/workflows/node.js.yml/badge.svg?branch=main&event=push)](https://github.com/RafaelTorresLopez/GitHubCert/actions/workflows/node.js.yml)
[![Mostrar Variables](https://github.com/RafaelTorresLopez/GitHubCert/actions/workflows/mostrar_variables.yml/badge.svg)](https://github.com/RafaelTorresLopez/GitHubCert/actions/workflows/mostrar_variables.yml)
