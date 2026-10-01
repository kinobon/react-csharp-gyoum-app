import { mkdir, writeFile } from "node:fs/promises";

const url = process.env.OPENAPI_URL ?? "http://localhost:5199/openapi/v1.json";
const response = await fetch(url);
if (!response.ok) {
  throw new Error(`OpenAPIの取得に失敗しました: HTTP ${response.status}`);
}
const schema = await response.json();
if (!schema.openapi || !schema.paths) {
  throw new Error("取得したJSONはOpenAPIドキュメントではありません。");
}
// 実行時のホスト・ポートに生成物が依存しないよう、接続先はOrval側で指定する。
delete schema.servers;
const destination = new URL("../openapi/api.json", import.meta.url);
await mkdir(new URL("../openapi/", import.meta.url), { recursive: true });
await writeFile(destination, `${JSON.stringify(schema, null, 2)}\n`);
console.log(`OpenAPIを保存しました: ${destination.pathname}`);
