# Render has no native .NET runtime (Node, Python, Ruby, Go, Rust and Elixir
# only), so the API is deployed as a Docker web service built from this file.

# ── Build ─────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore first, on its own layer, so dependency downloads are cached and only
# re-run when the csproj changes.
COPY backend/Ascension.Api.csproj backend/
RUN dotnet restore backend/Ascension.Api.csproj

COPY backend/ backend/
RUN dotnet publish backend/Ascension.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# ── Runtime ───────────────────────────────────────────────
# aspnet is the smaller runtime-only image — no SDK in the deployed container.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production

# Render's default port. Program.cs reads PORT and binds 0.0.0.0, so this only
# needs to match whatever Render injects.
EXPOSE 10000

# Run as the image's non-root user rather than root.
USER $APP_UID

ENTRYPOINT ["dotnet", "Ascension.Api.dll"]
