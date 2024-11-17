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