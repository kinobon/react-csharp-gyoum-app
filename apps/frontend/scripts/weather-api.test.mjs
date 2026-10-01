import assert from "node:assert/strict";
import { test } from "node:test";
import { QueryClient } from "@tanstack/react-query";
import { getGetWeatherForecastQueryOptions } from "../src/api/generated/weather.ts";

test("生成クライアントがQueryへ予報・空配列・通信エラーを伝える", async (t) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  t.after(() => client.clear());
  const options = getGetWeatherForecastQueryOptions();
  const forecast = [{ date: "2026-10-02", temperatureC: 0, temperatureF: 32, summary: null }];
  const fetchMock = t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(url, "/api/WeatherForecast");
    assert.equal(init.method, "GET");
    assert.ok(init.signal instanceof AbortSignal);
    return Response.json(forecast);
  });

  assert.deepEqual(await client.fetchQuery(options), forecast);

  fetchMock.mock.mockImplementation(async () =>
    Response.json({ title: "Unavailable" }, { status: 503 }),
  );
  await assert.rejects(client.fetchQuery(options), { status: 503 });
  assert.deepEqual(
    client.getQueryData(options.queryKey),
    forecast,
    "再取得失敗時も前回のデータを保持する",
  );
  assert.equal(client.getQueryState(options.queryKey).status, "error");

  fetchMock.mock.mockImplementation(async () => {
    throw new TypeError("Failed to fetch");
  });
  await assert.rejects(client.fetchQuery(options), /Failed to fetch/);

  fetchMock.mock.mockImplementation(async () => Response.json([]));
  assert.deepEqual(await client.fetchQuery(options), [], "空配列は正常な取得結果");
  assert.equal(client.getQueryState(options.queryKey).status, "success");
});
