shopt -s expand_aliases
alias docc='sudo docker compose -f docker-compose-rate_limiting.yml' # Se puede necesitar cambiarlo a 'docker-compose -f docker-compose-rate_limiting.yml' según cómo esté instalado.

docc --compatibility up -d --build