import json
import sys
from pathlib import Path

if len(sys.argv) != 2:
    print("Debe indicarse un archivo.", file=sys.stderr)
    sys.exit(1)

archivo = Path(sys.argv[1])

try:
    with archivo.open(encoding="utf-8") as fichero:
        json.load(fichero)
except (OSError, ValueError) as error:
    print(f"Validación fallida: {error}", file=sys.stderr)
    sys.exit(1)

print(f"JSON válido: {archivo}")
