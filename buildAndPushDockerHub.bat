docker build -t lewan24/hexorait-api:latest ./HexoraITApi
docker build -t lewan24/hexorait-web:latest ./HexoraITWeb

docker push lewan24/hexorait-api:latest
docker push lewan24/hexorait-web:latest
