# Commander-dev

## Osnovno

Posamezen objekt instanciraš v funkciji `initGame()`: kličeš funckijo `createObject(...)`, ki ji podaš array vertices in array indices (poljubno še translacijski, rotacijski in skalirni vektor).
Funkcija kreira shader program in bufferje za objekt in objekt doda v array `environment`.

Po vseh inicializacijah se prične game loop (`update()` funkcija), ki je v glavnem sestavljena iz:
- `gameplay()` funckije, ki naj bi implementirala vso igralno logiko (premiki objektov, preverjanje kolizij, ipd.),
- zanke z `draw(object)`, ki v WebGL canvas izriše vse objekte v spremenljivki `environment`
## TODO

Implementacije:
- rotacije v funckiji `createObject()`
- svetloba (in mogoče še teksture) v shaderjih
- kolizije med objekti in primerne reakcije (npr. med igralcem in tlemi; za začetek je igralec lahko tudi navaden kvader...)
- kontrola objekta (igralca) prek tipk na tipkovnici (premik levo-desno, skok)

-----

**Če za kako stvar nisi siguren kako in kaj je najboljš, da vprašaš v chatu.**