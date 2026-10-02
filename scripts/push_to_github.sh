#!/bin/bash
TOKEN=$(cat .github_token 2>/dev/null | tr -d '\r\n ')
if [ -z "$TOKEN" ]; then
  echo "Hata: .github_token dosyası boş!"
  exit 1
fi

git remote set-url origin "https://x-access-token:${TOKEN}@github.com/Mikrokosmosfb/manhwa-fansub.git"
git push origin master
git push origin master:main
