import { Link } from "@tanstack/react-router";
import { Alert, Button, Table } from "antd";
import type { TableProps } from "antd";
import type { WeatherForecast } from "../../api/generated/models";
import styles from "./weather.module.css";

interface WeatherPageUIProps {
  forecasts: WeatherForecast[] | undefined;
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  isPaused: boolean;
  onRefresh: () => void;
}

const columns: TableProps<WeatherForecast>["columns"] = [
  { title: "日付", dataIndex: "date", key: "date" },
  {
    title: "気温（℃）",
    key: "temperatureC",
    align: "right",
    render: (_, row) => row.temperatureC ?? "—",
  },
  {
    title: "気温（℉）",
    key: "temperatureF",
    align: "right",
    render: (_, row) => row.temperatureF ?? "—",
  },
  { title: "概要", key: "summary", render: (_, row) => row.summary ?? "—" },
];

export function WeatherPageUI({
  forecasts,
  isPending,
  isFetching,
  isError,
  isPaused,
  onRefresh,
}: WeatherPageUIProps) {
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
        <Table<WeatherForecast>
          aria-label="天気予報一覧"
          columns={columns}
          dataSource={forecasts}
          rowKey="date"
          pagination={false}
          scroll={{ x: 520 }}
          locale={{ emptyText: "予報データがありません" }}
        />
      )}
      {isPending && !isFetching && !isPaused && <p>予報の取得を待っています。</p>}
    </main>
  );
}
