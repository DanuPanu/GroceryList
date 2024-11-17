import { View } from 'react-native';
import {Button, Text, Dialog, Portal, TextInput, List, IconButton } from 'react-native-paper';
import * as SQLite from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { useOstokset } from '../OstoksetContext';


const Ruoka = () => {

    const [dialogiRuoka, setDialogiRuoka] = useState<DialogiDataRuoka>({auki:false, teksti: "", nimi: ""});
    const [dialogiValmiitRuuat, setDialogiValmiitRuuat] = useState<boolean>(false)
    const [dialogiPoisto, setDialogiPoisto] = useState<DialogiPoistettava>({auki: false, tuote: "", id: 0})
    const [ruuat, setRuuat] = useState<Ruoka[]>([]);

    const {setOstokset} = useOstokset();
  
    const db_ruoka = SQLite.useSQLiteContext();
  
    const db = SQLite.useSQLiteContext();
  
    const ruuanPoisto = (ruoka : string, ruokaId : number) => {
      setDialogiPoisto({...dialogiPoisto, auki : true, tuote : ruoka, id : ruokaId})
    }
  
    const haeRuuat = async () => {
      try {
        // Hae kaikki rivit ruoka-taulusta
        const kaikkiRuuat = (await db_ruoka.getAllAsync(`SELECT * FROM ruoka`)) as Ruoka[];
    
        // Palauta tulokset
        console.log("Kaikki ruuat haettu");
        setRuuat(kaikkiRuuat)
      } catch (error) {
        console.log(`Virhe kaikkien ruokien haussa: ${error}`);
      }
    };
    
  
    const lisaaRuoka = async (nimi: string, tuotteet: string) => {
      try {    
        // Lisää ruoka tietokantaan
        const statement = await db_ruoka.prepareAsync(`INSERT INTO ruoka (nimi, tuotteet) VALUES (?, ?)`);
        await statement.executeAsync([nimi, tuotteet]);
    
        console.log(`Ruoka "${nimi}" lisätty onnistuneesti.`);
        haeRuuat();
        setDialogiRuoka({...dialogiRuoka, auki : false})
      } catch (error) {
        console.log(`Virhe ruoan lisäämisessä: ${error}`);
      }
    };
  
    const poistaRuoka = async (id: number) => {
      try {
        // Poistetaan ruoka tietokannasta ID:n perusteella
        await db_ruoka.runAsync(`DELETE FROM ruoka WHERE id = ?`, [id]);
    
        console.log(`Ruoka ID:llä ${id} poistettu onnistuneesti.`);
        haeRuuat();
        setDialogiPoisto({...dialogiPoisto, auki : false})
        setDialogiValmiitRuuat(true)
      } catch (error) {
        console.log(`Virhe ruoan poistossa: ${error}`);
      }
    };
  
    const lisaaRuokaOstoslistaan = async (ruokaId: number) => {
      try {
        // Hae ruuan tuotteet ruoka-tietokannasta
        const ruokaTulokset = (await db_ruoka.getAllAsync(
          `SELECT tuotteet FROM ruoka WHERE id = ?`,
          [ruokaId]
        )) as Ruoka[];
    
        if (!ruokaTulokset || ruokaTulokset.length === 0) {
          console.log(`Ruoan ID:llä ${ruokaId} ei löytynyt.`);
          return;
        }
    
        // Pilko tuotteet ainesosiksi
        const ruoka = ruokaTulokset[0];
        const ainekset = ruoka.tuotteet.split(',').map((aine: string) => aine.trim());
    
        for (const tuote of ainekset) {
          // Tarkista, onko tuote jo ostoslistassa
          const existingItems = (await db.getAllAsync(
            `SELECT * FROM ostokset WHERE tuote = ?`,
            [tuote]
          )) as Ostos[];
    
          if (existingItems.length > 0) {
            // Päivitä laskuri, jos tuote löytyy
            const existingItem = existingItems[0];
            const newCount = (existingItem.count || 1) + 1;
            await db.runAsync(`UPDATE ostokset SET count = ? WHERE id = ?`, [
              newCount,
              existingItem.id,
            ]);
          } else {
            // Lisää uusi tuote ostoslistaan
            await db.runAsync(`INSERT INTO ostokset (tuote, count) VALUES (?, ?)`, [tuote, 1]);
          }
        }
    
        console.log(`Ruoan ID:llä ${ruokaId} sisältämät ainekset lisätty ostoslistaan.`);
      } catch (error) {
        console.log(`Virhe ruoan ainesten lisäämisessä ostoslistaan: ${error}`);
      }
      haeOstokset();
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
      haeRuuat();
    }, []);
    
    
  
  return(
    <>
      <View style={{display: "flex", flexDirection: "row", justifyContent: "space-between", paddingBottom: 40}}>
       <Button
         labelStyle={{fontFamily: "EBGaramond-VariableFont_wght", fontSize: 17}}
         style={{ marginTop : 20, width: "45%", backgroundColor: "rgb(255, 198, 198)"}}
         mode="contained"
         icon="plus-box-multiple-outline"
         onPress={() => setDialogiRuoka({...dialogiRuoka, auki : true})}
       >Lisää uusi ruoka</Button>
       <Button
         labelStyle={{fontFamily: "EBGaramond-VariableFont_wght", fontSize: 17}}
         style={{ marginTop : 20, width: "45%", backgroundColor: "rgb(255, 198, 198)" }}
         mode="contained"
         icon="food-outline"
         onPress={() => setDialogiValmiitRuuat(true)}
       >Valmiit ruuat</Button>
     </View>
  
  
  
    <Portal>
            <Dialog
              dismissable={false}
              style={{backgroundColor: "rgb(255, 238, 244)"}}
              visible={dialogiRuoka.auki}
              onDismiss={() => setDialogiRuoka({...dialogiRuoka, auki : false})}
            >
              <Dialog.Title style={{fontFamily: "EBGaramond-VariableFont_wght", fontSize: 35}}>Lisää uusi ruoka</Dialog.Title>
              <Dialog.Content>
                <TextInput 
                  label="Ruuan nimi"
                  mode="outlined"
                  placeholder='Kirjoita nimi...'
                  onChangeText={ (uusiTeksti : string) => setDialogiRuoka({...dialogiRuoka, nimi: uusiTeksti})}
                />
                <TextInput 
                  label="Ruoka-aineket"
                  mode="outlined"
                  placeholder='Kirjoita ainkeset...'
                  onChangeText={ (uusiTeksti : string) => setDialogiRuoka({...dialogiRuoka, teksti: uusiTeksti})}
                />
              </Dialog.Content>
              <Dialog.Actions>
                <Button labelStyle={{fontFamily: "EBGaramond-VariableFont_wght", fontSize: 19, color: "black"}} onPress={() => lisaaRuoka(dialogiRuoka.nimi, dialogiRuoka.teksti)}>Lisää listaan</Button>
                <Button labelStyle={{fontFamily: "EBGaramond-VariableFont_wght", fontSize: 19, color: "black"}} onPress={() => setDialogiRuoka({...dialogiRuoka, auki: false})}>Sulje</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
  
          <Portal>
            <Dialog
              dismissable={false}
              style={{backgroundColor: "rgb(255, 238, 244)"}}
              visible={dialogiValmiitRuuat}
            >
              <Dialog.Title style={{fontFamily: "EBGaramond-VariableFont_wght", fontSize: 27}}>Valmiit ruuat</Dialog.Title>
              <Dialog.Content>
                {(ruuat.length > 0)
                ? ruuat.map((ruoka: Ruoka, idx: number) => {
                  return (
                    <View style={{display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
                      <List.Item 
                        titleStyle={{fontFamily: "ShadowsIntoLightTwo-Regular", fontSize: 22}}
                        descriptionStyle={{fontFamily: "ShadowsIntoLightTwo-Regular", fontSize: 17}}
                        title={ruoka.nimi}
                        description={ruoka.tuotteet}
                        key={idx}
                      />
                      <View style={{display: "flex", flexDirection: "row"}}>
                        <IconButton onPress={() => lisaaRuokaOstoslistaan(ruoka.id)} icon="cart"/>
                        <IconButton onPress={() => ruuanPoisto(ruoka.nimi, ruoka.id)} icon="trash-can-outline"/>  
                      </View>
                    </View>
                  )
            })
            : <Text>Ei ruokia</Text>
            }

              <Button labelStyle={{fontFamily: "EBGaramond-VariableFont_wght", fontSize: 19, color: "black"}} onPress={() => setDialogiValmiitRuuat(false)}>Sulje</Button>

              </Dialog.Content>
            </Dialog>
          </Portal>
  
          <Portal>
            <Dialog
              dismissable={false}
              style={{backgroundColor: "rgb(255, 238, 244)"}}
              visible={dialogiPoisto.auki}
            >
              <Dialog.Title style={{fontFamily: "EBGaramond-VariableFont_wght", fontSize: 27}}>Ruuan poisto</Dialog.Title>
              <Dialog.Content>
                <Text style={{fontFamily: "EBGaramond-VariableFont_wght", fontSize: 20}}>Haluatko varmasti poistaa ruuan {dialogiPoisto.tuote}?</Text>
                <Button onPress={() => {poistaRuoka(dialogiPoisto.id)}}
                  icon="trash-can-outline" 
                  labelStyle={{fontFamily: "EBGaramond-VariableFont_wght", fontSize: 19, color: "black"}} 
                  mode='outlined'
                  style={{ marginTop : 20, width: "60%", marginHorizontal: "auto"}}
                  >Kyllä</Button>
                <Button onPress={() => setDialogiPoisto({...dialogiPoisto, auki: false})}
                  icon="close-octagon-outline" 
                  labelStyle={{fontFamily: "EBGaramond-VariableFont_wght", fontSize: 19, color: "white"}} 
                  mode='contained'
                  style={{ marginTop : 20, width: "60%", backgroundColor: "rgb(200, 0, 54)", marginHorizontal: "auto"}}
                  >En</Button>
              </Dialog.Content>
            </Dialog>
          </Portal>
  
     </>
  )}

  export default Ruoka;