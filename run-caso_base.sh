shopt -s expand_aliases
alias docc='docker compose -f docker-compose-caso_base.yml' # Se puede necesitar cambiarlo a 'docker-compose -f docker-compose-caso_base.yml' según cómo esté instalado.

docc --compatibility up -d --build