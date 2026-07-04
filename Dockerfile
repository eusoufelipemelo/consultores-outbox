# OutBox Consultores — app estático servido por nginx (pronto para EasyPanel)
FROM nginx:alpine

# Config nginx (gzip + cache dos assets versionados) — arquivo real, sem printf frágil
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia o app para o diretório público do nginx
COPY . /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
