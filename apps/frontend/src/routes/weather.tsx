import { createFileRoute } from "@tanstack/react-router";
import { WeatherPage } from "../features/weather/WeatherPage";

export const Route = createFileRoute("/weather")({ component: WeatherPage });
