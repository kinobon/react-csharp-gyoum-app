import { useGetWeatherForecast } from "../../api/generated/weather";
import { WeatherPageUI } from "./WeatherPage.ui";

export function WeatherPage() {
  const forecast = useGetWeatherForecast({
    query: {
      staleTime: 60_000,
      retry: false,
      refetchOnWindowFocus: false,
    },
  });

  return (
    <WeatherPageUI
      forecasts={forecast.data}
      isPending={forecast.isPending}
      isFetching={forecast.isFetching}
      isError={forecast.isError}
      isPaused={forecast.fetchStatus === "paused"}
      onRefresh={() => void forecast.refetch()}
    />
  );
}
