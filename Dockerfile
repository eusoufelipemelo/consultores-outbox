# OutBox Consultores — app estático servido por nginx (pronto para EasyPanel)
FROM nginx:alpine

# Copia o app para o diretório público do nginx
COPY . /usr/share/nginx/html

# Config: SPA fallback + cache (HTML/JS/CSS sem cache, mídia 30d)
RUN printf 'server {\n\
  listen 80;\n\
  server_name _;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / { try_files $uri $uri/ /index.html; }\n\
  location ~* \\.html$ { add_header Cache-Control "no-cache"; }\n\
  location ~* \\.(css|js)$ { add_header Cache-Control "no-cache"; }\n\
  location ~* \\.(svg|jpg|jpeg|png|webp|gif|ico|woff2?)$ { expires 30d; add_header Cache-Control "public, max-age=2592000"; }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
