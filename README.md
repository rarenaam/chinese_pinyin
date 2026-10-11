# Pinyin Studio

Een statische, responsive Chinese luisterquiz voor GitHub Pages.

## Publiceren op GitHub Pages
1. Maak/open een GitHub-repository.
2. Upload `index.html` en `data.json` naar de hoofdmap van de repository.
3. Ga naar **Settings → Pages**.
4. Kies **Deploy from a branch**, selecteer `main` en `/ (root)`, en sla op.
5. Open de URL die GitHub Pages toont.

## Belangrijk
- Dit is een statische website; er is geen Python-server nodig.
- De quiz gebruikt de ingebouwde spraaksynthese van je browser om de Chinese tekens uit te spreken. Beschikbare Chinese stemmen verschillen per apparaat en browser.
- De quizresultaten worden in `localStorage` van de browser opgeslagen; ze synchroniseren niet tussen apparaten.
- `data.json` is afgeleid van de meegeleverde `pinyin_all.csv`, een oefendataset. Controleer de woorden/tekens op juistheid voordat je dit als woordenboek gebruikt.
- De groepen voor initialen/finalen zijn praktische filters op pinyin-lettergrepen, geen formele fonologische cursusindeling.
