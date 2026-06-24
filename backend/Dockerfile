# ---- build stage ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore (leverage layer caching)
COPY DevEdu.Api.csproj ./
RUN dotnet restore DevEdu.Api.csproj

# Build & publish
COPY . ./
RUN dotnet publish DevEdu.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# ---- runtime stage ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080 \
    DOTNET_RUNNING_IN_CONTAINER=true

COPY --from=build /app/publish ./

# Run as the non-root user provided by the base image
USER $APP_UID

EXPOSE 8080
ENTRYPOINT ["dotnet", "DevEdu.Api.dll"]
