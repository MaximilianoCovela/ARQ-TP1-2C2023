alias docc='docker compose -f docker-compose-replication.yml' # Se puede necesitar cambiarlo a 'docker-compose -f docker-compose-replication.yml' según cómo esté instalado.

docc --compatibility up -d --scale node=3