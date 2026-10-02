using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;

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
        }
    }
}
