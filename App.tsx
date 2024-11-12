import { StatusBar } from 'expo-status-bar';
import { ScrollView, View } from 'react-native';
import { Appbar, Button, Text, Dialog, Portal, Provider, TextInput, List, IconButton } from 'react-native-paper';
import * as SQLite from 'expo-sqlite/legacy';
import { useEffect, useState } from 'react';
import * as Font from 'expo-font';

const fetchFonts = () => {
  return Font.loadAsync({
    'EBGaramond-VariableFont_wght': require('./assets/fonts/EBGaramond-VariableFont_wght.ttf'),
    'EBGaramond-Italic-VariableFont_wght': require('./assets/fonts/EBGaramond-Italic-VariableFont_wght.ttf'),
    'Sacramento-Regular': require('./assets/fonts/Sacramento-Regular.ttf'),
    'ShadowsIntoLightTwo-Regular': require('./assets/fonts/ShadowsIntoLightTwo-Regular.ttf'),
  });
};

interface Ostos {
  id : number;
  tuote : string;
  count : number;
}

interface Ruoka {
  id : number
  nimi : string
  tuotteet : string
}

interface DialogiData {
  auki : boolean;
  teksti : string;
}

interface DialogiPoistettava {
  auki : boolean;
  tuote : string;
  id : number
}

interface DialogiDataRuoka {
  auki : boolean;
  nimi : string
  teksti : string;
}

const db : SQLite.WebSQLDatabase = SQLite.openDatabase("ostoslista.db");

const db_ruoka : SQLite.WebSQLDatabase = SQLite.openDatabase("ruoka.db");

db.transaction(
  (tx : SQLite.SQLTransaction) => {
    //tx.executeSql(`DROP TABLE ostokset`); // Poista tämän rivin kommentti, jos haluat määrittää taulun uuddestaan (poistaa myös sisällöt)
    tx.executeSql(`CREATE TABLE IF NOT EXISTS ostokset (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tuote TEXT,
                    count INTEGER
                  )`);
  }, 
  (err : SQLite.SQLError) => { 
    console.log(err) 
  }
);

db_ruoka.transaction(
  (tx : SQLite.SQLTransaction) => {
    //tx.executeSql(`DROP TABLE ruoka`); // Poista tämän rivin kommentti, jos haluat määrittää taulun uuddestaan (poistaa myös sisällöt)
    tx.executeSql(`CREATE TABLE IF NOT EXISTS ruoka (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nimi TEXT,
                    tuotteet TEXT
                  )`);
  }, 
  (err : SQLite.SQLError) => { 
    console.log(err) 
  }
);

const App : React.FC = () : React.ReactElement => {

  const [dialogi, setDialogi] = useState<DialogiData>({auki:false, teksti: ""});
  const [dialogiRuoka, setDialogiRuoka] = useState<DialogiDataRuoka>({auki:false, teksti: "", nimi: ""});
  const [dialogiValmiitRuuat, setDialogiValmiitRuuat] = useState<boolean>(false)
  const [dialogiPoisto, setDialogiPoisto] = useState<DialogiPoistettava>({auki: false, tuote: "", id: 0})
  const [ostokset, setOstokset] = useState<Ostos[]>([]);
  const [ruuat, setRuuat] = useState<Ruoka[]>([]);

  const poistaRuoka = (id : number) : void => {

    db_ruoka.transaction(
      (tx : SQLite.SQLTransaction) => {
        tx.executeSql(`DELETE FROM ruoka WHERE id=${id}`, [], 
          (_tx : SQLite.SQLTransaction, rs : SQLite.SQLResultSet) => {
            haeRuuat();
          });
      }, 
      (err: SQLite.SQLError) => console.log(err));

    setDialogiPoisto({...dialogiPoisto, auki: false})
    setDialogiValmiitRuuat(true)
  }
  const poistaOstos = (id : number) : void => {

    db.transaction(
      (tx : SQLite.SQLTransaction) => {
        tx.executeSql(`DELETE FROM ostokset WHERE id=${id}`, [], 
          (_tx : SQLite.SQLTransaction, rs : SQLite.SQLResultSet) => {
            haeOstokset();
          });
      }, 
      (err: SQLite.SQLError) => console.log(err));

  }

  const lisaaOstos = () : void => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM ostokset WHERE tuote = ?`, 
        [dialogi.teksti],
        (_tx, rs) => {
          if (rs.rows.length > 0) {
            const existingOstos = rs.rows.item(0);
            // Päivitä `count`
            tx.executeSql(
              `UPDATE ostokset SET count = count + 1 WHERE id = ?`,
              [existingOstos.id],
              (_tx, _rs) => {
                haeOstokset();
              }
            );
          } else {
            tx.executeSql(
              `INSERT INTO ostokset (tuote, count) VALUES (?, ?)`,
              [dialogi.teksti, 1],
              (_tx, _rs) => {
                haeOstokset();
              }
            );
          }
        }
      );
    }, (err) => console.log(err));
    setDialogi({ ...dialogi, auki: false, teksti: "" });
  };
  
  const lisaaRuoka = () : void => {

    db_ruoka.transaction(
      (tx : SQLite.SQLTransaction) => {
        tx.executeSql(`INSERT INTO ruoka (nimi, tuotteet) VALUES (?, ?)`, [dialogiRuoka.nimi, dialogiRuoka.teksti], 
          (_tx : SQLite.SQLTransaction, rs : SQLite.SQLResultSet) => {
            haeRuuat();
          });
      }, 
      (err: SQLite.SQLError) => console.log(err));

    setDialogiRuoka({...dialogiRuoka, auki : false, teksti : "", nimi : ""})

  }

  const lisääRuokaOstoslistaan = (ruoka: Ruoka): void => {
    const tuotteet = ruoka.tuotteet.split(",").map((tuote) => tuote.trim());
  
    db.transaction((tx) => {
      tuotteet.forEach((tuote) => {
        tx.executeSql(
          `SELECT * FROM ostokset WHERE tuote = ?`,
          [tuote],
          (_tx, rs) => {
            if (rs.rows.length > 0) {
              // Tuote löytyy jo, päivitetään sen määrää
              const existingOstos = rs.rows.item(0);
              tx.executeSql(
                `UPDATE ostokset SET count = count + 1 WHERE id = ?`,
                [existingOstos.id],
                (_tx, _rs) => {
                  haeOstokset();
                }
              );
            } else {
              // Tuote ei ole vielä listassa, lisätään uusi rivi
              tx.executeSql(
                `INSERT INTO ostokset (tuote, count) VALUES (?, ?)`,
                [tuote, 1],
                (_tx, _rs) => {
                  haeOstokset();
                }
              );
            }
          }
        );
      });
    }, (err) => console.log(err));
  };
  
  const haeOstokset = () : void => {

    db.transaction(
      (tx : SQLite.SQLTransaction) => {
        tx.executeSql(`SELECT * FROM ostokset`, [], 
          (_tx : SQLite.SQLTransaction, rs : SQLite.SQLResultSet) => {
            setOstokset(rs.rows._array);
          });
      }, 
      (err: SQLite.SQLError) => console.log(err));

  }

  const haeRuuat = () : void => {

    db_ruoka.transaction(
      (tx : SQLite.SQLTransaction) => {
        tx.executeSql(`SELECT * FROM ruoka`, [], 
          (_tx : SQLite.SQLTransaction, rs : SQLite.SQLResultSet) => {
            setRuuat(rs.rows._array);
          });
      }, 
      (err: SQLite.SQLError) => console.log(err));

  }

  useEffect(() => {

    haeOstokset();
    haeRuuat();
    fetchFonts();

  }, []);

  const ruuanPoisto = (ruoka : string, ruokaId : number) => {

    setDialogiValmiitRuuat(false)
    setDialogiPoisto({...dialogiPoisto, auki : true, tuote : ruoka, id : ruokaId})
  }

  return (
    <Provider>
      <Appbar.Header style={{alignContent: "center", justifyContent: "center", backgroundColor: "rgb(255, 239, 239)"}}>
        <Text style={{fontFamily: "Sacramento-Regular", fontSize: 60}}>Ostoslista</Text>
      </Appbar.Header>
      <ScrollView style={{padding : 20, backgroundColor: "rgb(255, 239, 239)"}}>
        {(ostokset.length > 0) 
        ? ostokset.map((ostos: Ostos, idx: number) => {
            return (
              <>
              <View style={{display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
                <List.Item
                  titleStyle={{fontFamily: "ShadowsIntoLightTwo-Regular", fontSize: 27}}
                  title={`${ostos.tuote} ${ostos.count > 1 ? `${ostos.count}x` : ""}`}
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
        <View style={{display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
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
            style={{backgroundColor: "rgb(255, 238, 244)"}}
            visible={dialogi.auki}
            onDismiss={() => setDialogi({...dialogi, auki : false})}
          >
            <Dialog.Title style={{fontFamily: "EBGaramond-VariableFont_wght", fontSize: 35}}>Lisää uusi ostos</Dialog.Title>
            <Dialog.Content>
              <TextInput 
                label="Ostos"
                mode="outlined"
                placeholder='Kirjoita ostos...'
                onChangeText={ (uusiTeksti : string) => setDialogi({...dialogi, teksti: uusiTeksti})}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button labelStyle={{fontFamily: "EBGaramond-VariableFont_wght", fontSize: 17, color: "black"}} onPress={lisaaOstos}>Lisää listaan</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Portal>
          <Dialog
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
              <Button labelStyle={{fontFamily: "EBGaramond-VariableFont_wght", fontSize: 17, color: "black"}} onPress={lisaaRuoka}>Lisää listaan</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Portal>
          <Dialog
            style={{backgroundColor: "rgb(255, 238, 244)"}}
            visible={dialogiValmiitRuuat}
            onDismiss={() => setDialogiValmiitRuuat(false)}
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
                      <IconButton onPress={() => lisääRuokaOstoslistaan(ruoka)} icon="cart"/>
                      <IconButton onPress={() => {ruuanPoisto(ruoka.nimi, ruoka.id)}} icon="trash-can-outline"/>  
                    </View>
                  </View>
                )
          })
          : <Text>Ei ruokia</Text>
          }
            </Dialog.Content>
          </Dialog>
        </Portal>

        <Portal>
          <Dialog
            style={{backgroundColor: "rgb(255, 238, 244)"}}
            visible={dialogiPoisto.auki}
            onDismiss={() => setDialogiPoisto({...dialogiPoisto, auki : false})}
          >
            <Dialog.Title style={{fontFamily: "EBGaramond-VariableFont_wght", fontSize: 27}}>Ruuan poisto</Dialog.Title>
            <Dialog.Content>
              <Text style={{fontFamily: "EBGaramond-VariableFont_wght", fontSize: 20}}>Haluatko varmasti poistaa ruuan {dialogiPoisto.tuote}?</Text>
              <Button onPress={() => {poistaRuoka(dialogiPoisto.id)}}
                icon="trash-can-outline" 
                labelStyle={{fontFamily: "EBGaramond-VariableFont_wght", fontSize: 17, color: "white"}} 
                mode='contained'
                style={{ marginTop : 20, width: "60%", backgroundColor: "rgb(255, 198, 198)", marginHorizontal: "auto"}}
                >Kyllä</Button>
            </Dialog.Content>
          </Dialog>
        </Portal>

        <StatusBar style="auto" />
      </ScrollView>
    </Provider>
  );
}

export default App;