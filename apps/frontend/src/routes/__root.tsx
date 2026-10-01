import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: function RootLayout() {
    return (
      <>
        <Outlet />
        {import.meta.env.DEV && <TanStackRouterDevtools />}
      </>
    );
  },
  notFoundComponent: function NotFound() {
    return (
      <main style={{ padding: "2rem" }}>
        <h1>ページが見つかりません</h1>
        <p>URLを確認するか、一覧画面へ戻ってください。</p>
        <Link to="/">一覧へ戻る</Link>
      </main>
    );
  },
});
