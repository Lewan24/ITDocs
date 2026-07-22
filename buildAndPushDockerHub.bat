docker build -t lewan24/itdocs-api:latest ./ITDocsApi
docker build -t lewan24/itdocs-web:latest ./ITDocsApp

docker push lewan24/itdocs-api:latest
docker push lewan24/itdocs-web:latest
