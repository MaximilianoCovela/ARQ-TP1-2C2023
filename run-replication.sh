shopt -s expand_aliases
alias docc='sudo docker compose -f docker-compose-replication.yml' # Se puede necesitar cambiarlo a 'docker-compose -f docker-compose-replication.yml' según cómo esté instalado.

docc --compatibility up -d --build --scale node=3