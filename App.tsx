import { ScrollView } from 'react-native';
import { Provider } from 'react-native-paper';
import * as SQLite from 'expo-sqlite';
import { useEffect } from 'react';
import * as Font from 'expo-font';
import { OstoksetProvider } from './OstoksetContext';
import Ruoka from './components/Ruoka';
import Lista from './components/Lista';

const fetchFonts = () => {
  return Font.loadAsync({
    'EBGaramond-VariableFont_wght': require('./assets/fonts/EBGaramond-VariableFont_wght.ttf'),
    'EBGaramond-Italic-VariableFont_wght': require('./assets/fonts/EBGaramond-Italic-VariableFont_wght.ttf'),
    'Sacramento-Regular': require('./assets/fonts/Sacramento-Regular.ttf'),
    'ShadowsIntoLightTwo-Regular': require('./assets/fonts/ShadowsIntoLightTwo-Regular.ttf'),
  });
};

async function initializeDatabase(db: any, tableName: string, tableDefinition: string) {
  try {
    // Luo taulu vain, jos sitä ei ole jo olemassa
    await db.execAsync(`CREATE TABLE IF NOT EXISTS ${tableName} ${tableDefinition}`);
    console.log(`${tableName} database initialized!`);
  } catch (error: any) {
    console.log(`Error while initializing table ${tableName}: ${error}`);
  }
}

async function initializeDatabases(db: any) {
  try {
    // Alustetaan "ostokset"-taulu
    await initializeDatabase(db, "ostokset", `(id INTEGER PRIMARY KEY AUTOINCREMENT, tuote TEXT, count INTEGER DEFAULT 1)`);

    // Alustetaan "ruoka"-taulu
    await initializeDatabase(db, "ruoka", `(id INTEGER PRIMARY KEY AUTOINCREMENT, nimi TEXT, tuotteet TEXT)`);

    console.log("Both tables initialized!");
  } catch (error: any) {
    console.log(`Error while initializing databases: ${error}`);
  }
}



const App : React.FC = () : React.ReactElement => {

  useEffect(() => {
  fetchFonts(); 
}, []);


  return (
    <Provider>
      <OstoksetProvider>
        <ScrollView style={{paddingHorizontal : 20, backgroundColor: "rgb(255, 239, 239)"}}>
          <SQLite.SQLiteProvider databaseName='ostokset.db' onInit={initializeDatabases}>
            <Lista />
            <Ruoka />
          </SQLite.SQLiteProvider>
        </ScrollView>
      </OstoksetProvider>
    </Provider>
  );
}

export default App;