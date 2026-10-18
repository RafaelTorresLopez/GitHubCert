# Práctica: acciones personalizadas de GitHub

## Qué incluye y cómo empezar

Esta práctica adapta y completa la unidad de Microsoft Learn:
https://learn.microsoft.com/es-es/training/modules/create-custom-github-actions/create-custom-github-action

1. Descomprime el ZIP.
2. Copia el CONTENIDO de la carpeta custom-actions-lab a la raíz de tu repositorio de pruebas.
   Debe quedar .github/workflows/probar-acciones.yml, no una carpeta adicional por encima.
3. Incluye también la carpeta oculta .github, los assets y .github/actions/setup-mycli/dist/.
   En el Explorador de Windows activa Ver > Mostrar > Elementos ocultos si lo necesitas.
4. Confirma y sube los archivos a main (o a una rama feature/...).
5. Abre Actions > Practica de acciones personalizadas.
6. También puedes ejecutar Run workflow y elegir 1.2.3, 1.2.4 o latest.
   Para que aparezca Run workflow, el workflow debe estar en la rama predeterminada.
7. Revisa los jobs javascript-y-composite y contenedor y sus pasos desplegados.
   No requieren secretos, Projects, Azure ni publicar imágenes o paquetes.

No necesitas ejecutar npm install para USAR las acciones del ZIP. El bundle ya está generado.
Si modificas el código fuente de la acción, sí debes reconstruirlo (véase abajo).
El job Docker construye una imagen local para ejecutar su acción; no la publica en GHCR.

## Qué corrige respecto al ejemplo de la página

- MyCLI y cli.example.com son marcadores de ejemplo; el texto no especifica un producto real.
- La variable version se lee y se muestra, pero el comando curl del ejemplo no la transmite.
  No hay selección efectiva de la versión en ese código.
- El ejemplo no añade explícitamente ningún directorio al PATH.
  El instalador externo podría hacerlo, pero el código presentado no lo garantiza.
- @actions/core no aparece por arte de magia: debe instalarse y distribuirse.
  GitHub no ejecuta npm install automáticamente por encontrar package.json en una acción.
- Actualizamos runs.using de node16 a node24.
- Una acción local necesita checkout ANTES de uses: ./.github/actions/... .
  Poner checkout dentro de una acción local no resuelve su propia localización inicial.
- No implementamos la caché ilustrativa ~/.mycli del artículo:
  ni la instalación ni la versión que usa ese ejemplo quedan ligadas coherentemente a esa ruta.
  inputs.version solo existe si el workflow tiene realmente esa entrada en su contexto.
- Este laboratorio reutiliza la instalación dentro del MISMO job. Eso NO es una caché entre ejecuciones.
- La sección de contenedor de esta práctica es un ejemplo mínimo añadido: no pretende ser código literal del artículo.

## Qué CLI se instala de verdad

Se instala MyCLI DIDÁCTICA, incluida en este ZIP. No es Azure CLI (az), GitHub CLI (gh),
Docker, act ni el producto de terceros que pudiera tener el mismo nombre.

Tiene tres comandos:
- mycli --version
- mycli greet "Rafael"
- mycli validate-json ejemplos/aplicacion.json

La instalación NO descarga un ejecutable de Internet y NO publica un paquete npm.
Copia un programa propio y su manifest de versión a:
RUNNER_TEMP/mycli-lab/VERSION/bin/

Las versiones 1.2.3 y 1.2.4 son versiones educativas: comparten los comandos y se diferencian
por el manifest y la versión que muestran. latest resuelve explícitamente a 1.2.4;
no consulta ningún registro y no cambia mientras no modifiques el código.

Para instalar una CLI real debes sustituir el origen local por sus distribuciones oficiales:
resolver versión, sistema y arquitectura, descargar, comprobar integridad, extraer,
verificar --version y registrar PATH. El comando de instalación concreto depende del producto.

## Archivos y responsabilidad

| Archivo | Responsabilidad |
|---|---|
| .github/workflows/probar-acciones.yml | Activa los jobs y llama a las acciones locales |
| .github/actions/setup-mycli/action.yml | Entradas, salidas, runtime y punto de entrada JavaScript |
| .github/actions/setup-mycli/index.js | Fuente legible del instalador |
| .github/actions/setup-mycli/dist/index.js | Programa que REALMENTE ejecuta el runner, con @actions/core empaquetado |
| .github/actions/setup-mycli/dist/licenses.txt | Licencias de dependencias incluidas en el bundle |
| .github/actions/setup-mycli/cli/mycli.cjs | La CLI que el instalador copia al runner |
| .github/actions/setup-mycli/releases/.../package.json | Manifests de las dos versiones educativas |
| .github/actions/probar-mycli/action.yml | Acción compuesta: versión, saludo, validación y salida |
| .github/actions/saludo-docker/action.yml | Define una acción Docker y su argumento |
| .github/actions/saludo-docker/Dockerfile | Prepara un contenedor Alpine con entrypoint |
| .github/actions/saludo-docker/entrypoint.sh | Código ejecutado DENTRO del contenedor |
| ejemplos/aplicacion.json | Documento JSON válido para probar la CLI |
| package.json y package-lock.json | Dependencias y comandos de desarrollo del bundle |
| tests/action.test.cjs | Pruebas locales de instalación, CLI, errores y entrypoint |

## index.js explicado por bloques

El nombre correcto del archivo es index.js (no indes.js).
No es una palabra reservada: runs.main podría apuntar a otro nombre.

La declaración efectiva es:

    runs:
      using: node24
      main: dist/index.js

GitHub carga action.yml y usa el runtime Node 24 del runner para ejecutar dist/index.js.
index.js es la fuente que agrupamos con ncc para generar ese archivo. El código del bundle
y las dependencias van juntos; los archivos cli/ y releases/ siguen distribuyéndose aparte.

No estamos ejecutando npm start ni una web ni un servidor. Se ejecuta un script una vez
por invocación de la acción.

### 1. Importaciones

- require('@actions/core'): funciones oficiales para inputs, outputs, PATH y errores.
- node:fs: leer/copiar archivos y crear directorios.
- node:path: construir rutas.
- node:child_process: ejecutar el programa instalado y verificar su versión.
Las tres últimas librerías están incluidas en Node; @actions/core es una dependencia npm.

### 2. Entrada version

    const requested = core.getInput('version') || 'latest';

En el workflow, with.version llega al proceso JavaScript como INPUT_VERSION.
core.getInput la lee y elimina espacios al principio/final.
GitHub aplica default: latest si la entrada se omite en la invocación normal.

La lista SUPPORTED evita aceptar versiones arbitrarias o rutas con ../.
LATEST fija el alias latest a 1.2.4. Este contrato hace efectiva la selección de versión.

### 3. Directorio y archivos instalados

RUNNER_TEMP lo proporciona el runner; su ruta absoluta no se presupone.
binDir añade mycli-lab, la versión y bin. __dirname se refiere a dist/, no al workspace;
se calcula el directorio padre para encontrar cli/ y releases/.

La acción compara el programa y su manifest para saber si puede reutilizar la instalación.
Si los archivos faltan o cambiaron, los escribe. chmod concede ejecución a mycli.

### 4. Verificación real

execFileSync ejecuta el Node actual con el archivo instalado y --version.
Comprueba que la salida coincide con la versión resuelta.
No usa execSync con texto concatenado en una shell: los argumentos se pasan separados.

### 5. PATH y salidas

    core.addPath(binDir);
    core.setOutput('version', version);
    core.setOutput('bin-path', binDir);
    core.setOutput('reused', String(reused));

core.addPath registra el directorio en GITHUB_PATH y actualiza el PATH del proceso.
El runner incorpora esa ruta al entorno de los pasos posteriores del MISMO job.
No instala el programa en tu PC ni lo hace persistente en otro job o ejecución.

core.setOutput escribe las salidas en GITHUB_OUTPUT. Con id: instalar se leen como:
steps.instalar.outputs.version, steps.instalar.outputs.bin-path y steps.instalar.outputs.reused.
Declararlas en action.yml describe la interfaz; es el código setOutput el que produce los valores.
Las salidas son textos: reused contiene "true" o "false".

### 6. Errores y logs

core.info escribe información visible. core.debug requiere depuración de pasos para mostrarse.
core.setFailed registra el error y establece un código de salida de fallo.
El try/catch captura versiones no soportadas y errores de instalación/verificación.

## Procedencia de las variables

| Dato | Procedencia | Valor o regla |
|---|---|---|
| inputs.cli-version | Elección del formulario workflow_dispatch | 1.2.3, 1.2.4 o latest |
| CLI_VERSION | env del job | Entrada manual o 1.2.3 cuando el evento es push |
| inputs.version de la acción JS | with.version | Valor de CLI_VERSION |
| INPUT_VERSION | Variable que prepara el runner para la acción JS | Entrada version |
| requested | core.getInput | Entrada leída o latest |
| version | Lógica JavaScript | Versión literal admitida o 1.2.4 para latest |
| RUNNER_TEMP | Runner de GitHub | Directorio temporal propio del job |
| binDir | path.join en index.js | RUNNER_TEMP/mycli-lab/version/bin |
| GITHUB_PATH | Runner | Archivo para registrar rutas de pasos posteriores |
| GITHUB_OUTPUT | Runner, por paso | Archivo donde se publican las salidas de ese paso |
| steps.instalar.outputs.version | core.setOutput | Versión que verificó el instalador |
| NOMBRE y ARCHIVO | env de pasos de la acción compuesta | inputs.nombre e inputs.archivo |
| steps.compuesta.outputs.script-result | value del output compuesto | Salida result del paso comprobar |
| GITHUB_STEP_SUMMARY | Runner | Archivo del resumen visible de la ejecución |

## Acción compuesta

probar-mycli NO instala MyCLI: utiliza el comando ya instalado en ese job.
No puede asumir la instalación del job contenedor ni de otro workflow.
Agrupa varios pasos shell, pasa entradas mediante env y devuelve Success a través de:
echo -> GITHUB_OUTPUT del paso comprobar -> outputs.script-result de la acción ->
steps.compuesta.outputs.script-result en el workflow.

Es distinto de la acción JS: no tiene main ni index.js; declara runs.using: composite y steps.

## Acción Docker

El segundo job es independiente del primero: pueden ejecutarse en paralelo.
GitHub construye el Dockerfile y ejecuta /entrypoint.sh en el contenedor.
El input nombre se pasa con runs.args y se recibe como $1.
El script publica mensaje mediante GITHUB_OUTPUT.
Docker se prepara con Alpine, no con Node, y no utiliza la CLI del primer job.
Invocar sh explícitamente también permite probar el script fuera de Docker.
.gitattributes fuerza LF en scripts; chmod se aplica dentro de la imagen.

## Resultados esperados

Con 1.2.3:
- Version recibida: 1.2.3
- Reutilizado: false (primera llamada en un runner limpio)
- mycli --version muestra 1.2.3
- Hola, Rafael! MyCLI 1.2.3
- JSON valido: ejemplos/aplicacion.json
- La segunda instalación informa que se reutiliza.
- La acción compuesta devuelve Success.
- El job Docker devuelve Hola, Rafael desde una accion Docker.

Con latest: el valor solicitado sigue siendo latest, pero la salida version será 1.2.4.
Si cambias manualmente la versión a 9.9.9 en el YAML, la acción fallará intencionadamente.
Si invalidas aplicacion.json, fallará la validación. Revierte esos cambios para recuperar verde.

## Desarrollo y pruebas locales

Necesitas Node 24 y npm. Desde la raíz de la práctica, también en PowerShell:

    npm ci
    npm run build:action
    npm test

Las pruebas de instalación/CLI están preparadas para Linux, como el workflow.
En Windows utiliza WSL con Node 24 para ejecutar npm test.
ncc puede regenerar el bundle en Windows, pero la acción de instalación rechaza runners Windows.

Después de modificar index.js o sus dependencias, regenera y sube dist/index.js y licenses.txt.
No subas node_modules: está excluido mediante .gitignore.
Los archivos cli/ y releases/ también deben subirse.
Para probar solo el saludo fuera del contenedor, consulta la prueba local incluida.
La ejecución con act es opcional y requiere instalar act y Docker por separado; no se incluyen.

## Seguridad y alcance

No contiene secretos ni usa permisos de escritura. contents: read permite checkout.
Los inputs no se insertan directamente en comandos shell.
La acción solo instala contenido incluido en el repositorio en el temporal del runner.
Las acciones de terceros están referenciadas por versión mayor para lectura didáctica;
en un entorno corporativo puedes fijarlas a un SHA revisado.
No es un instalador de una herramienta de producción ni una copia literal incompleta del artículo.

## Fuentes

- Unidad analizada: https://learn.microsoft.com/es-es/training/modules/create-custom-github-actions/create-custom-github-action
- Metadatos: https://docs.github.com/en/actions/reference/workflows-and-actions/metadata-syntax
- Comandos PATH/output: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands
- JavaScript y empaquetado: https://docs.github.com/en/actions/tutorials/create-actions/create-a-javascript-action
