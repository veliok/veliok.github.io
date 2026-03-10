## Rannikko- ja merinavigaatio säällä

### Suunnitelma ja markkinatilanne

Hieno merinavigaattori, merisää, ja karttatiedot yhdistettynä.

___
Kilpailua on kansaivälisellä tasolla paljon, mutta tod näk vähemmän, kuin kuntosalisovelluksella. Kokonaismalli ja ansaintamalli olisi myös helpompi kuvitella.
Useimmilla sovelluksilla on heikkouksia, huonoja arvosteluja, ja maksuja valitellaan. Suoraan Suomen markkinoille ei taida olla kuin yksi vaihtoehto, <https://www.digitraffic.fi/en/applications/>. Yksi erottuva malli voisi olla offline käytettävyys, jossa kartta ja tulevien tuntien sääennusteet ovat muistissa. Ei ole monta sovellusta, jotka yhdistävät navigaation, kartan, sään ja liikenteen, nämä kaikki on kylläkin liikaa projektin aikajaksolle.
Monet sovellukset kuten markkinajohtaja käyttää vanhentunutta UI:ta ja karttateknologiaa. En tiedä onko Väyläviraston merikartta tarkempi kuin kansainväliset, mutta yhdistämällä sen ja esim Ilmatieteenlaitoksen, voisi saada paikallisesti paikkaansa pitävän karttasovelluksen tehtyä? Kasuaalille veneilijälle koko maailman karttatietosovellus on ehkä overkill, jos sen suuntaisi vain itämerelle olisiko kysyntää?
AI:n mukaan profittia olisi vaikea tehdä ja kilpailua isoilla markkinoilla liikaa.

Tällä hetkellä suosituimmat sovellukset:

**Nautics Sailmate**:
- <https://play.google.com/store/apps/details?id=fi.nautics.hybridsailmate>
- Suomalainen, paskat arvostelut, ruma.

**Skippo**:
- <https://play.google.com/store/apps/details?id=com.merella>
- Pohjoismaiden johtaja, ihan hieno, ristiriitaisia arvosteluja.

**Navionics Boating**:
- <https://play.google.com/store/apps/details?id=it.navionics.singleAppMarineLakesHD>
- Markkinajohtaja, paskat arvostelut, ruma kuin mikä, *useless without subscription* eli kartta-alueet maksaa 20-50€ vuodessa.

**Windy**:
- <https://play.google.com/store/apps/details?id=com.windyty.android>
- Parhaat säätiedot, mutta ei taida olla navigaatiota?, hieno.

**C-MAP Boating**:
- <https://play.google.com/store/apps/details?id=com.isea.Embark>
- Hyvät arvostelut, voisi olla hienompi.

**Savvy Navvy**:
- <https://play.google.com/store/apps/details?id=com.savvy.navvy.android.app>
- Käytännössä google maps merenkäynnille.

**Orca**:
- <https://play.google.com/store/apps/details?id=com.theorca.slate>
- Simppeli, navigaatiota haukutaan, ilmaisversiota kehutaan.


Aikataulusta riippuen navigaatio ja hienot säätiedot kartalla olisi minimi. JOS ehtii niin mukaan sopisi reaaliaikainen meriliikenne, siihen liittyy kuitenkin runsaasti riippuen paljonko tietoa haluaa näyttää. Mietinnän alaiset/extrajutut merkattu *sulkeilla*. Karttatietoja voisi klikkailla asetuksista, mitä kaikkea haluaa nähdä.

### Kriteereistä toteutuu
- **Api**: Yhdistää useita eri rajapintoja, ehkä
- **Sensorit**: GPS, kompassi
- **Kartta**
- *(Backend)*: Varmaan välttämätön datan yhdistämiseen, jotta sen voi hakea helposti sovellukseen
- **Matematiikka**: Ainakin navigointi 

### Rajapinnat
- **Sää:** FMI/YR/OpenWeatherMap
- **Merikartta**: Väylävirasto vesiväyläverkko/OpenSeaMap
- *(Meriliikenne)*: Traficom

### GPS
- Helppo toteuttaa kartalle samalla tavalla kuin kurssilla. Jos haluaa kuljetun reitin, niin siitä pitää tallentaa tietoa ja piirtää kartalle.

### Kartta
Ideana toimisi siis niin, että on pohjakartta kuten kurssitehtävässä. Sen päälle saa lisättyä *layerina/rasterina* WMS/WFS *tile*-tyyppistä dataa, kuten väylät, syvyydet, merkit yms.

#### Pohjakartaksi on vaihtoehtoja: 

**React Native Maps**:
- Tuttu tehtävästä
- Ei suoraan tue kovin hyvin WFS/WMS-karttatietoja, jota suomalaiset rajapinnat palauttaa. Voi yhdistää *tile layerina*, mutta esim interaktiiviset jutut ja klikkaukset monimutkaista tehdä.

**Leaflet**
- Tukee suoraan datamuotoa
- Tarvii yhdistää WebViewiin(no idea mikä on)
- Huonompi suorituskyky
- <https://leafletjs.com/>

**MapLibre**
- Paras suorityskyky
- Tukee dataa jotenkin
- Epätuttu
- <https://maplibre.org/>

#### Summaus kartoista
React Native Mapsilla saa totetutettua yksinkertaisen navigaatiokartan helposti, MapBoxia/MapLibre suositellaan eniten, jos haluaa hyvän merikartan. MapLibre on suositellun MapBoxin ilmainen open-source fork.
OpenSeaMapilla saa helposti jonkunlaiset tiedot pohjakartan päälle, Väylävirastolta saa tarkemmat tiedot Suomen vesille. Periaatteessa backendiä ei saata tarvia, jos käyttää vain MapLibre+OpenSeaMap yhdistelmää ilman tarkempia tietoja ja sään hakee välimuistin kansa. Väyläviraston data on niin runsasta, että pitäisi miettiä onko järkevää hakea sitä kerralla.


## Rajapintojen mahdollisuudet
### **Väylävirasto**
- Vesiväylät, vesiliikennemerkit, majakat, laiturit, ruoppaukset, aika kattavasti kaikki:

<https://avoinapi.vaylapilvi.fi/vaylatiedot/ogc/features/v1/collections?f=text%2Fhtml>

### **Merisää**
- Useita eri vaihtoehtoja:

OpenWeatherMap oli helppo, FMI tiedot WFS muodossa, YR vaatii headereita ja omaa palvelinta *oikeaan* käyttöön. Varmaan muitakin on paljon.

### **(Traficom/Digitraffic)**: 
Vain jos toteuttaa liikenteen seurauksen.
- Vesikulkuneuvojen sijainti- ja tekniset tiedot.

<https://asiointi.traficom.fi/asiointi/tietotuotteet/vesikulkuneuvojen-tietotuotteet>

- Kaikki suomen aluella rekisteröidyt alukset:

<https://tieto.traficom.fi/fi/tietotraficom/avoin-data>

- Vesiliikenne yms:

<https://www.digitraffic.fi/meriliikenne/>
