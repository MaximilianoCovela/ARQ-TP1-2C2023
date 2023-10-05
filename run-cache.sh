shopt -s expand_aliases
alias docc='sudo docker compose -f docker-compose-cache.yml'

docc --compatibility up -d --build