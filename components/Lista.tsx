import { View } from 'react-native';
import { Appbar, Button, Text, Dialog, Portal, TextInput, List } from 'react-native-paper';
import * as SQLite from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { useOstokset } from '../OstoksetContext';

const Lista = () => {

    const db = SQLite.useSQLiteContext();
  
    const {ostokset, setOstokset} = useOstokset();
    const [dialogi, setDialogi] = useState<DialogiData>({auki: false, teksti: ""});
  
    //Poista ostos
   const poistaOstos = async (id : number) => {
    try {
      await db.runAsync(`DELETE FROM ostokset WHERE id=${id}`);
      await haeOstokset();
    } catch (error) {
      console.log(`Virhe ostoksen poistossa: ${error}`)
    }}
  
    const lisaaOstos = async (tuote: string) => {
      try {
        // Tarkista, onko tuote jo olemassa
        const rows = (await db.getAllAsync(`SELECT * FROM ostokset WHERE tuote = ?`, [tuote])) as Ostos[];
    
        if (rows.length > 0) {
          // Jos tuote löytyy, poimi ensimmäinen rivi ja päivitä laskuri
          const existingItem = rows[0];
          const currentCount = existingItem.count || 1; // Oletetaan, että laskuri alkaa arvosta 1
          const newCount = currentCount + 1;
    
          await db.runAsync(`UPDATE ostokset SET count = ? WHERE id = ?`, [newCount, existingItem.id]);
        } else {
          // Jos tuotetta ei ole, lisää uusi
          const statement = await db.prepareAsync(`INSERT INTO ostokset (tuote, count) VALUES (?, ?)`);
          await statement.executeAsync([tuote, 1]); // Alustetaan laskuri arvoon 1
        }
    
        // Päivitä ostoslista
        await haeOstokset();
      } catch (error) {
        console.log(`Virhe ostoksen lisäämisessä: ${error}`);
      }
      setDialogi({...dialogi, teksti: ""})
    };
      
  
  //Haetaan ostokset
  const haeOstokset = async () => {
    try {
      const allRows = await db.getAllAsync(`SELECT * FROM ostokset`);
      setOstokset(allRows)
    } catch (error : any) {
      console.log(`Virhe ostosten haussa : ${error}`)
    }
  }
  
  useEffect(() => {
    haeOstokset();  
  }, []);
  
    return (
      <>
          <Appbar.Header style={{justifyContent: "center", backgroundColor: "rgb(255, 239, 239)", marginBottom: 10}}>
            <Text style={{fontFamily: "Sacramento-Regular", fontSize: 60, textAlign: "center"}}>Ostoslista</Text>
          </Appbar.Header>
          {(ostokset.length > 0) 
          ? ostokset.map((ostos: Ostos, idx: number) => {
              return (
                <>
                <View style={{display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
                  <List.Item
                    titleStyle={{fontFamily: "ShadowsIntoLightTwo-Regular", fontSize: 27}}
                    title={`${ostos.tuote} ${ostos.count > 1 ? `x${ostos.count}` : ""}`}
                    key={idx}
                  />
                  <Button mode='contained' onPress={() => poistaOstos(ostos.id)} icon="trash-can-outline" labelStyle={{fontFamily: "EBGaramond-VariableFont_wght", fontSize: 17}} style={{backgroundColor: "rgb(255, 198, 198)"}}>Poista</Button>  
                </View> 
                </>
            )
          })
          : <Text style={{textAlign: "center", fontSize: 15}}>Ei ostoksia</Text>
        }
  
        <Button
          labelStyle={{fontFamily: "EBGaramond-VariableFont_wght", fontSize: 18}}
          style={{ marginTop : 20, backgroundColor: "rgb(255, 198, 198)" }}
          mode="contained"
          icon="plus"
          onPress={() => setDialogi({...dialogi, auki : true})}
          >Lisää uusi ostos</Button>
          <View>
        <Portal>
          <Dialog
            dismissable={false}
            style={{backgroundColor: "rgb(255, 238, 244)", margin: "auto"}}
            visible={dialogi.auki}
            onDismiss={() => setDialogi({...dialogi, auki : false})}
            >
            <Dialog.Title style={{fontFamily: "EBGaramond-VariableFont_wght", fontSize: 35}}>Lisää uusi ostos</Dialog.Title>
            <Dialog.Content>
              <TextInput 
                label="Ostos"
                mode="outlined"
                placeholder='Kirjoita ostos...'
                value={dialogi.teksti}
                onChangeText={(uusiTeksti) => {setDialogi({...dialogi, teksti: uusiTeksti})}}
                />
            </Dialog.Content>
            <Dialog.Actions>
              <Button labelStyle={{fontFamily: "EBGaramond-VariableFont_wght", fontSize: 19, color: "black"}} onPress={() => {lisaaOstos(dialogi.teksti)}}>Lisää listaan</Button>
              <Button labelStyle={{fontFamily: "EBGaramond-VariableFont_wght", fontSize: 19, color: "black"}} onPress={() => {setDialogi({...dialogi, auki: false})}}>Sulje</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        </View>
        </>
    );
  
  }

  export default Lista;