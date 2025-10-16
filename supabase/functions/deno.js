export default {
  "$schema": "https://deno.land/x/deno/cli/schemas/config-file.v1.json",
  "importMap": "./import_map.json",
  "compilerOptions": {
    "strict": true
  },
  "lint": {
    "rules": {
      "tags": ["recommended"],
      "exclude": ["no-explicit-any", "no-unused-vars"]
    }
  }
};
