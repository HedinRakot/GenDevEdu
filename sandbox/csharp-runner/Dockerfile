# Sandbox-Runner-Image für F7 Code-Aufgaben (MVP: C#).
# Enthält KEINEN Lerner-Code — der wird pro Submission ins /work-Volume gelegt.
# Wird vom rootless Podman-Sidecar gestartet mit:
#   --network none --memory 256m --memory-swap 256m --cpus 0.5 --pids-limit 20
#   --read-only --user 1000 --cap-drop ALL --security-opt no-new-privileges
#
# Das SDK-Image bringt bereits einen non-root User mit UID 1000 (`app`) mit —
# daher KEIN eigenes useradd (UID 1000 wäre nicht eindeutig).
FROM mcr.microsoft.com/dotnet/sdk:10.0

# Geteilter, welt-lesbarer NuGet-Ordner: beim Build (als root, mit Netz) gefüllt,
# zur Laufzeit (UID 1000, --network none) wiederverwendet ⇒ Offline-Compile.
ENV DOTNET_NOLOGO=1 \
    DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1 \
    DOTNET_CLI_TELEMETRY_OPTOUT=1 \
    NUGET_PACKAGES=/opt/nuget

# Framework-Refs/NuGet vorwärmen, damit `dotnet build --network none` offline läuft.
RUN mkdir -p /opt/nuget && chmod -R 0777 /opt/nuget \
    && mkdir -p /warmup && cd /warmup \
    && printf '<Project Sdk="Microsoft.NET.Sdk">\n<PropertyGroup>\n<OutputType>Exe</OutputType>\n<TargetFramework>net10.0</TargetFramework>\n<ImplicitUsings>enable</ImplicitUsings>\n<Nullable>enable</Nullable>\n</PropertyGroup>\n</Project>\n' > warmup.csproj \
    && printf 'Console.WriteLine("warmup");\n' > Program.cs \
    && dotnet build -c Release -o /tmp/warmup-out --nologo \
    && rm -rf /warmup /tmp/warmup-out

USER 1000
WORKDIR /work

# KEIN ENTRYPOINT: das Backend setzt pro Container das vollständige Cmd
# (z. B. ["bash","-lc","… dotnet build …"] bzw. ["dotnet","/work/out/proj.dll"]).
