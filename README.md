# Keen3D-WebGL

## Kako igrati
- smerne tipke: premikanje
- space: skok
- X: streljaj

## O igri

Keen3D je 3D platformer igra narejena v WebGL. Igra ima narejen nek osnoven level, ki vsebuje nekaj banan in enemyev. Igralec lahko pobira banane za dodatne točke. 

Če se igralec dotakne enemya ali pade v luknjo (dol z platform) se igra resetira (ponovi level). Igralec lahko enemye odstrani tako, da jih ustreli.

## Nekaj več

Collision detection je implementiran s pomočjo knjižnice Cannon.js. Za pobiranje banan in ključa pa se računa razdalja med igralcem in objektom.

Za vsak izstreljen metek se ustvari nov objekt; Pobiranje banan in ključa pa je implementirano tako, da imajo objekti lastnost _visible_, ki se nastavi na false, ko je objekt pobran oz. uničen (ob resetu levela, t.j. ko player umre, se parameter nastavi nazaj na true).

Igra ima implementirano uporabo tekstur in osvetljevanja (ambient light in directional light). Teksture so nekaj osnovnega: platforme imajo neko zeleno, igralec ima svojo, ključ in banane svojo. Ambient light se nekoliko spremeni, če je igralec blizu ključa.
