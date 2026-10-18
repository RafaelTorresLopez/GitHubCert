#!/bin/sh
set -eu
nombre="${1:-mundo}"
# La salida es deliberadamente de una sola linea.
nombre=$(printf '%s' "$nombre" | tr '\r\n' '  ')
mensaje="Hola, $nombre desde una accion Docker"
printf '%s\n' "$mensaje"
printf 'mensaje=%s\n' "$mensaje" >> "$GITHUB_OUTPUT"
