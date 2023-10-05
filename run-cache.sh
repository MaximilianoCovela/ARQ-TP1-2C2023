alias docc='docker compose -f docker-compose-cache.yml' # Se puede necesitar cambiarlo a 'docker-compose -f docker-compose-cache.yml' según cómo esté instalado.

export IsCacheEnabled=true

docc --compatibility up -d