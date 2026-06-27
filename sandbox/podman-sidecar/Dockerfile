# Rootless Podman-Sidecar für F7. Exponiert einen Docker-kompatiblen Socket,
# über den das Backend kurzlebige Sandbox-Container startet.
#
# Das Runner-Image wird als Tarball mitgeliefert und beim Start in den
# (rootless) Podman-Store geladen — umgeht damit die Registry-Erreichbarkeit
# des Sidecars komplett (sein Image-Store ist getrennt vom Cluster-containerd).
# Den Tarball erzeugt das Deploy-Skript per `podman save` VOR dem Build.
FROM quay.io/podman/stable

# VFS-Storage braucht kein /dev/fuse → robust für rootless-in-k8s.
ENV STORAGE_DRIVER=vfs

COPY csharp-runner.tar /images/csharp-runner.tar
COPY entrypoint.sh /usr/local/bin/sidecar-entrypoint.sh
RUN chmod +x /usr/local/bin/sidecar-entrypoint.sh

USER 1000:1000
ENTRYPOINT ["/usr/local/bin/sidecar-entrypoint.sh"]
