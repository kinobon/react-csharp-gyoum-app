import { Link } from "@tanstack/react-router";
import { Alert, Button } from "antd";
import type { WeatherForecast } from "../../api/generated/models";
import styles from "./weather.module.css";
import { AgGridProvider, AgGridReact } from "ag-grid-react";
import { useState } from "react";
import { AllCommunityModule, type ColDef } from "ag-grid-community";

interface WeatherPageUIProps {
  forecasts: WeatherForecast[] | undefined;
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  isPaused: boolean;
  onRefresh: () => void;
}

const modules = [AllCommunityModule];

export function WeatherPageUI({
  forecasts,
  isPending,
  isFetching,
  isError,
  isPaused,
  onRefresh,
}: WeatherPageUIProps) {
  const rowData: WeatherForecast[] =
    forecasts?.map((f) => ({
      date: f.date,
      temperatureC: f.temperatureC,
      temperatureF: f.temperatureF,
      summar: f.summary,
    })) ?? [];

  const colDefs: ColDef<WeatherForecast>[] = [
    { field: "date" },
    { field: "temperatureC" },
    { field: "temperatureF" },
    { field: "summary" },
  ];

  return (
    <main className={styles.page}>
      <title>天気予報 | 学習用アプリ</title>
      <Link to="/">部品・改訂一覧へ戻る</Link>
      <header className={styles.header}>
        <div>
          <h1>天気予報</h1>
          <p>5日分のサンプル予報です。再取得すると気温と概要が変わります。</p>
        </div>
        <Button type="primary" onClick={onRefresh} loading={isFetching} disabled={isPaused}>
          {isError ? "再試行" : "再取得"}
        </Button>
      </header>
      {isPaused && (
        <Alert type="warning" showIcon title="接続待ちです。ネットワーク接続を確認してください。" />
      )}
      {isError && (
        <Alert
          type="error"
          showIcon
          title="天気予報を取得できませんでした"
          description={
            forecasts
              ? "前回取得した予報を表示しています。接続を確認して再試行してください。"
              : "接続を確認して再試行してください。"
          }
        />
      )}
      <div role="status" aria-live="polite">
        {isPaused
          ? "通信の再開を待っています。"
          : isFetching
            ? "天気予報を取得中…"
            : forecasts
              ? `${forecasts.length}件の予報を表示しています。`
              : null}
      </div>
      {forecasts !== undefined && (
        <AgGridProvider modules={modules}>
          <div style={{ height: "500" }}>
            <AgGridReact<WeatherForecast> rowData={rowData} columnDefs={colDefs} />
          </div>
        </AgGridProvider>
      )}
      {isPending && !isFetching && !isPaused && <p>予報の取得を待っています。</p>}
    </main>
  );
}
