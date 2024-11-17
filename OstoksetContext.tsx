import React, { createContext, useState, useContext, ReactNode } from 'react';

// Määritellään ostosten ja setOstokset-funktion tyyppi
interface OstoksetContextType {
  ostokset: Ostos[];  // Tai voit käyttää tarkempaa tyyppiä, jos tiedät datan rakenteen
  setOstokset: React.Dispatch<React.SetStateAction<any[]>>; // Funktio, joka päivittää ostokset
}

// Luo konteksti, jossa oletuksena on tyhjä taulukko
const OstoksetContext = createContext<OstoksetContextType | undefined>(undefined);

// Luo kontekstin tarjoaja
export const OstoksetProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [ostokset, setOstokset] = useState<any[]>([]);  // Asetetaan oletusarvoksi tyhjä taulukko

  return (
    <OstoksetContext.Provider value={{ ostokset, setOstokset}}>
      {children}
    </OstoksetContext.Provider>
  );
};

// Luo hook, joka palauttaa kontekstin
export const useOstokset = (): OstoksetContextType => {
  const context = useContext(OstoksetContext);
  if (!context) {
    throw new Error('useOstokset pitää käyttää OstoksetProviderin sisällä');
  }
  return context;
};
