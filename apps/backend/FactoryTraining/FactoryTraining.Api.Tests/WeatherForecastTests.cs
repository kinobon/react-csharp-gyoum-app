using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Text.Json;

namespace FactoryTraining.Api.Tests
{
    public class WeatherForecastTests
    {
        [Fact]
        public async Task GetWeatherForecast_ReturnsOk()
        {
            // Arrange
            using var factory = new WebApplicationFactory<Program>();
            using var client = factory.CreateClient(
                new WebApplicationFactoryClientOptions
                {
                    BaseAddress = new Uri("http://localhost"),
                    AllowAutoRedirect = false
                }
            );

            // Act
            using var response = await client.GetAsync("/WeatherForecast");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Equal("application/json; charset=utf-8", response.Content.Headers.ContentType?.ToString());

            // レスポンス本文をJSONとして読む
            var body = await response.Content.ReadAsStringAsync();
            using var json = JsonDocument.Parse(body);
            var forecasts = json.RootElement;

            // 各予報の中身を確認
            foreach (var forecast in forecasts.EnumerateArray())
            {
                Assert.Equal(JsonValueKind.Object, forecast.ValueKind);

                var date = forecast.GetProperty("date");
                var summary = forecast.GetProperty("summary");
                var temperatureC = forecast.GetProperty("temperatureC");
                var temperatureF = forecast.GetProperty("temperatureF");

                // プロパティの型を確認
                Assert.Equal(JsonValueKind.String, date.ValueKind);
                Assert.Equal(JsonValueKind.String, summary.ValueKind);
                Assert.Equal(JsonValueKind.Number, temperatureC.ValueKind);
                Assert.Equal(JsonValueKind.Number, temperatureF.ValueKind);
            }
        }
    }
}
