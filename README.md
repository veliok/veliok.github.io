# Kuntosalisovellus

## Suunnitelma ja markkinatilanne

Ainakin päiväkirjamallinen treenien seuranta ja tilastot.
Miten lisätä mukaan mahdollisesti sensoreita tai apia? Ei tietenkään ole pakko.
Tällä hetkellä suosituimpia samankaltaisia sovelluksia:

**Strong**:
- <https://play.google.com/store/apps/details?id=io.strongapp.strong>
- Käyttöliittymässä parantamisen varaa, ehkä liikaa näytöllä.

**JEFIT**:
- <https://play.google.com/store/apps/details/JEFIT_Gym_Workout_Plan_Tracker?id=je.fit>
- Ok, turhia ominaisuuksia. Iso liikekirjasto.

**Fitbod**:
- <https://play.google.com/store/apps/details?id=com.fitbod.fitbod>
- AI-sovellus. Hyvä selkeä käyttöliittymä.

**Hevy**:
- <https://play.google.com/store/apps/details?id=com.windyty.android>
- Ok näköinen, muutamia hyviä ominaisuuksia kuten painon seuranta.

> Useimpien sovellusten tilastojen visualisointi on minimaalista, tai rumahkoa. UI:t ovat myös täyteen tupattuja,
paljon ominaisuuksia, joita ei moni käytä. Teknisesti sovellukset on hyvin yksinkertaisia, jonka takia niitä on paljon.

## Ominaisuudet
- **Liikekirjasto**: luonti/poisto/editointi.
- **Treenikirjasto**: luonti/poisto/editointi.
- **Treenin seuranta**:
    - sarjat/painot/toistot per liike.
    - ajastin?
- **Tilastot**:
    - edistymisen seuranta per liike.
    - painon seuranta?
    - maksiminoston laskuri?
    - voluumin seuranta?

## Projektin rakenne suositelma
> Kaikkea näistä ei tarvitse toteuttaa, ideaalinen toteutus.
```
src
 ├── components     uudellenkäytettävät UI-palaset (listat, kortit, napit...)
 ├── screens        sivut/näkymät (esim. HomeScreen.tsx)
 ├── navigation     navigaation konfiguraatio (Tab/Stack)
 ├── hooks          custom hookit, yhdistävät UI:n ja datan (esim. useWorkout.ts)
 ├── store          globaalit tilat (context tai zustand)
 ├── database       tietokannan alustus, skeema, yhteys, CRUD
 ├── services       loogiset funktiot
 ├── utils          apufunktiot (esim. calculateBMI.ts)
 ├── types          datatyypit (esim. Type Wokout{})
 └── theme          provider teemalle
```

### Components
Uudelleenkäytettävät UI-komponentit. Käyttöliittymä pysyy yhtenäisenä, jos elementit jakaa komponentteihin.
Komponentteja on karkeasti kahden tyylisiä, *stateless* ja *stateful*.

**Stateless**
- Ei sisällä monimutkaista logiikkaa.
- Ottaa vastaan datan propsina ja näyttää sen.
- Esim: ```JokuButton.tsx```, jota käytetään useassa paikkaa UI:ssa.

**Stateful**
- Hallitsee omaa tilaansa (```useState```) tai käyttää hookkeja.
- Esim. komponentti, joka: hakee treenin -> tallentaa tilaan -> antaa *stateless*-komponentille näytettäväksi.

> Jos pyrkii siihen, että mahdollisimman moni komponentti on *stateless*, UI:n tekeminen ja muokkaaminen helpottuu.
Eli ei yhtä komponenttia, joka tekee kaiken: hakee, muuttaa ja näyttää. 

---

### Screens

Mitä näkymiä tarvitaan/halutaan, ainakin:
- Treenisessio
- Liikekirjasto
- Tilastot
- Asetukset?

---

### Navigation

Käytetäänkö esim. ``BottomTab``-navigaatiota, se on ainakin yksinkertainen toteuttaa?
Esim: [veliok/mobile-hybrid-week8](https://github.com/veliok/mobile-hybrid-week8/blob/main/navigation/Tabs.tsx)

---

### Store

> **Ei välttämätön, mutta voi hyödyttää**.

Säilytetään tilat, joita tarvitaan useammalla screenillä. Esim. treenien tilaa voi tarvita monessa paikkaa.
Ilman tämmöistä tulee sitä *prop-drillausta*, eli jotain tilaa välitetään propsina komponentilta toiselle, vaikka tarvittaisiin vain viimeisessä välitettävässä. Tämä on siis käytännössä joko ``Zustand``-kirjasto tai Reactin omia ``useContext`` funktioita.
Minimaalinen esimerkki ilman:
``WorkoutCard`` tarvii tiedon asetuksista, tila välitetään:
 - ```App``` -> ```MainScreen``` -> ```WorkoutCard```
Esimerkki storella:
 - ```WorkoutCard``` ottaa suoraan storesta.

---

### Database

- Tietokannan tiedosto(alustus, skeema, yms.)
- Repositoryt (CRUD SQL funktiot)
- Migraatiot, jos tarvitaan.

---

### Services

Esimerkiksi ``exerciseService.ts`` sisältäisi funktiot:
 - Uuden liikkeen luomiselle
 - Editoinnille
 - Poistamiselle

Näitä funktioita voisi sitten käyttää screeneillä tyyliin:

```ts
exerciseService.createExercise(data);
```

---

### Utils

Hyödylliset apufunktiot jos tarvii, esim:
- `dateUtils.ts` — muuttaa päivämäärän tiettyyn muotoon.

---

### Types

Pitkin ohjelmaa tarvittavat datatyypit, esim:
```ts
export type Exercise = {
    id: string;
    name: string;
    group/category: string;
}
```

---

### Theme
Sovelluksella kannattaa olla ```useContext``` ```Provider```, josta jokainen komponentti saa perustyylin: värit, fontin, spacing, teema, jne. Ei tarvi tehdä styleä jokaiselle komponentille erikseen.

---

## UI
Halutaanko tehdä aivan omannäköinen sovellus, vai käyttää valmiita kirjastoja. Esim. ```Paper``` ja ```Material``` kirjastoilla saa helposti ulkoasusta modernin ja semmoisen ettei mikään pistä silmään. Toisaalta se voi olla sitten geneerinen.

---

## Tilastot
Tähän tarvii miettiä mitä kaikkea halutaan näyttää ja myös UI:n osalta, onko jossain kirjastossa hyviä datan visualisointityökaluja.

---

## Tietokanta/käyttäjätiedot PÄIVITETTY
Kotlinkurssin mukaisen "offline-first" periaatteen ja käyttäjätilin/autentikoinnin saisi luotua Supabasella.
Puhelimessa olisi paikallinen SQLite tietokanta, joka synkkautuisi pilveen ajoittain/tallennuksen yhteydessä. Supabase on vähän kuin SQLite ja Firebase yhdistettynä ja suosittu mobiilisovelluksissa.

**Flow olisi:**

``Treenin tallennus`` -> ``Paikallinen tietokanta`` -> ``if !synced`` -> ``syncService`` -> ``Supabase tallennus`` -> ``synced = true``

``Synced`` on synkronointilippu(flag) paikallisessa tietokannassa, joka kertoo onko kyseinen rivi jo lähetetty pilveen. Käyttäjä luo uutta tietoa sovelluksessa, ``synced`` saa arvon ``0``, pilveen lähettämisen jälkeen asetetaan arvoon ``1``. Sama idea toimisi jokaiselle tietokannan taululle ja ``syncService`` käy läpi kaikki tarkistaen onko uutta tietoa.

**syncService flow**:

``SELECT WHERE synced = 0`` -> ``talletus Supabase`` -> ``UPDATE synced = 1``

Supabasessa on myös automaattinen id-järjestelmä. Käyttäjän rekisteröityessä Supabase luo jokaiselle ``UUID``-tunnisteen ja tallentaa sen ``auth.users``-tauluun.

**Kansiorakenne muuttuisi**:
```
remote/
    client.ts
    authService.ts
local/
    db.ts
    initDb.ts
    repositoryt
services/
    syncService.ts
```

**Tietokantaan tarvisi lisätä**:
- userId UUID REFERENCES auth.users(id)
- synced INTEGER DEFAULT 0

---


**Tietokannan rakenne minimitoimintaan**:

| Taulu | Sarakkeet |
|-------|-----------|
| `workout` | workoutId, name |
| `exercise` | exerciseId, name, category |
| `workout_history` | historyId, exerciseId, weight, reps, date, sessionId |
| `workout_exercise` | workoutId, exerciseId |

> Tarvittaessa tähän voisi lisätä taulun, johon yksittäinen treenisessio talletetaan:

> | Taulu | Sarakkeet |
> |-------|-----------|
> | `workout_session` | sessionId, workoutId, date |

### SQLite
> Esimerkki Kotlinilla toimivasta tietokannasta, Reactia varten voi tarvia pieniä muutoksia.

```sql
DROP TABLE IF EXISTS workout_history;
DROP TABLE IF EXISTS workout;
DROP TABLE IF EXISTS exercise;
DROP TABLE IF EXISTS workout_exercise;

CREATE TABLE exercise (
    exerciseId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL
);

CREATE TABLE workout (
    workoutId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    name TEXT NOT NULL
);

CREATE TABLE workout_exercise (
    workoutId INTEGER NOT NULL,
    exerciseId INTEGER NOT NULL,
    PRIMARY KEY(workoutId, exerciseId),
    FOREIGN KEY(workoutId) REFERENCES workout(workoutId) ON DELETE CASCADE,
    FOREIGN KEY(exerciseId) REFERENCES exercise(exerciseId) ON DELETE CASCADE
);

CREATE TABLE workout_history (
    historyId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    exerciseId INTEGER NOT NULL,
    weight REAL NOT NULL,
    reps INTEGER NOT NULL,
    date INTEGER NOT NULL,
    sessionId INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS index_workout_exercise_workoutId ON workout_exercise(workoutId);
CREATE INDEX IF NOT EXISTS index_workout_exercise_exerciseId ON workout_exercise(exerciseId);
```