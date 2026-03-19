# MITÄ PITÄÄ PÄÄTTÄÄ

## Miten tieto kulkee tietokannasta -> UI, TÄLLEEN UI:N TEKEMINEN OLISI HELPPOA

Tähän olisi hyvä käyttää kerrostettua mallia, eli sovelluksen toiminta on jaettu eri tasoihin:

1. **Data layer - database/**
- ``database/repository`` toteuttaa pelkät tietokannan CRUD-operaatiot ja palauttaa raakadatan.
2. **Business layer - service/**
- Logiikka, tyypitys, poikkeusten käsittely
- ``servicet`` paketoi datan käyttöliittymässä käytettäviin muotoihin type-objektien muodossa.
- tekee myös loogiset tarkistukset uudelle datalle, ja repository olettaa datan olevan kunnossa.
3. **Presentation layer - ui/**
- Näyttää tiedon, jonka business layer on jo muokannut tavittavaksi

### Miksi näin/hyödyt
Kuten harjoitustehtävissä, sitä tietokannan dataa pitää paketoida tyyppeihin(``type``), tarkistaa, koostaa ja ehkä muokata. Sitä ei ole hyvä tehdä **UI**-tiedostoissa, eikä suoraan tietokantakutsuissa.
Hyötyä olisi myös ``types/tyypit.ts``-tiedostosta, jossa on tarvittavat tyypit valmiina.

### Esimerkki liikkeen luomisella koko hommasta:
1. ``database/repository/exerciseRepository.ts``, eli pelkät tietokantakutsut:

```sql
export const getExercises = () => {
  return database.getAllAsync(
    "SELECT * FROM exercise"
  )
}
```

2. ``service/exerciseService.ts``, eli logiikka:

```typescript
import { Exercise } from "../types/models"
import { ExerciseRepository } from "../database/repositories/ExerciseRepository"

async createExercise(name: string, category: string, userId: string) {
  if(!name) {
    throw new Error("Tarvitaan nimi")
  }
  if (!category) {
    throw new Error("Tarvitaan kategoria")
  }
  return ExerciseRepository.insert({
    name: name.trim(),
    category,
    user_id: userId
  })
}
```

3. ``screens/jokuScreen.tsx``, UI:ssa voi vain helposti kutsua servicen funktiota:

```JSX
import { exerciseService } from "../services/exerciseService"
import { Exercise } from "../types/models"

// Statena voi käyttää tyyppiä
const [exercise, setExercise] = useState<Exercise>({
  name: "",
  category: ""
})

const handleCreateExercise = async () => {
  await exerciseService.createExercise(
    exercise.name,
    exercise.category,
    userId
  )
}
return (
	<TextInput
    	value={exercise.name}
    	onChangeText={(text) =>
    		setExercise(prev => ({ ...prev, name: text }))
        }
  	/>
	<Button onPress={handleCreateExercise}/>
)
```

4. ``types/types.ts``, valmiiksi määritellyt tyypit:

```typescript
export type Exercise = {
  exerciseId?: number
  user_id?: string
  name: string
  category: string
}
```


## Teemoitus
Miten teemoitus toteutetaan?

1. **React Native Paper**
 - <https://oss.callstack.com/react-native-paper/>
 - <https://oss.callstack.com/react-native-paper/docs/guides/theming/>

## Tilanhallinta
Tulee tilanteita, joissa useampi näkymä tarvitsee tietoa saman tilamuuttujan tilasta (``state``). Tästä esimerkkinä teema. Viime kurssilla opettaja esitteli ratkaisuksi **Zustand**-kirjaston. 
- [Moodle harjoitus](https://moodle.oulu.fi/pluginfile.php/3326222/mod_resource/content/1/ThemeSwitcherZustand.pdf)

## Navigaatio
``React Navigation Bottom Tabs Navigator``-navigaatiolla saa käyttöliittymäsuunnitelman mukaisen alanavigaation. <https://reactnavigation.org/docs/bottom-tab-navigator/>

Esim: [veliok/mobile-hybrid-week8](https://github.com/veliok/mobile-hybrid-week8/blob/main/navigation/Tabs.tsx)

## Suosittelurakenne React native mobiilisovellukselle
```
src
 ├── components     uudellenkäytettävät UI-palaset (listat, kortit, napit...)
 ├── screens        sivut/näkymät (esim. HomeScreen.tsx)
 ├── navigation     navigaation konfiguraatio (Tab/Stack)
 ├── hooks          custom hookit, jos tulee
 ├── store          globaalit tilat (context tai zustand)
 ├── database       tietokannan alustus, skeema, yhteys, CRUD
 ├── services       loogiset funktiot
 ├── utils          apufunktiot (esim. calculateBMI.ts)
 └── types          datatyypit (esim. Type Wokout{})        
```

## Viat
- auth email confirmation
- email rate limit 2 per hour, jos rekisteröityminen ei onnistu, ei hyväksy kaikkia sähköposteja
