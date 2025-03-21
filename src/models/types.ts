// Veritabanı modelleri ve genel tipler

export interface GoldPrice {
  alis: number;
  satis: number;
  dusuk: number;
  yuksek: number;
  kapanis: number;
  tarih: string;
}

export interface Subscription {
  id?: number;
  chat_id: number;
  type: string;
  created_at?: Date;
}

export interface Portfolio {
  id: string;
  chat_id: number;
  type: string;
  amount: number;
  buy_price: number;
  date: string;
  created_at?: Date;
}

export interface PriceHistory {
  id?: number;
  type: string;
  timestamp: Date;
  alis: number;
  satis: number;
  dusuk: number;
  yuksek: number;
  kapanis: number;
  tarih?: string;
  created_at?: Date;
}

// Altın tiplerini içeren nesne
export const GOLD_TYPES: { [key: string]: string } = {
  "ALTIN": "Gram Altın",
  "USDPURE": "USD Pure",
  "ONS": "Ons Altın",
  "USDKG": "USD/KG",
  "EURKG": "EUR/KG",
  "GBPTRY": "GBP/TRY",
  "AYAR22": "22 Ayar Altın",
  "KULCEALTIN": "Külçe Altın",
  "XAUXAG": "XAU/XAG",
  "CEYREK_YENI": "Yeni Çeyrek Altın",
  "CEYREK_ESKI": "Eski Çeyrek Altın",
  "YARIM_YENI": "Yeni Yarım Altın",
  "YARIM_ESKI": "Eski Yarım Altın",
  "TEK_YENI": "Yeni Tam Altın",
  "TEK_ESKI": "Eski Tam Altın",
  "ATA_YENI": "Yeni Ata Altın",
  "ATA_ESKI": "Eski Ata Altın",
  "ATA5_YENI": "Yeni 5 Ata Altın",
  "ATA5_ESKI": "Eski 5 Ata Altın",
  "GREMESE_YENI": "Yeni Gremese Altın",
  "GREMESE_ESKI": "Eski Gremese Altın",
  "AYAR14": "14 Ayar Altın",
  "XPTUSD": "XPT/USD",
  "PLATIN": "Platin",
  "NOKTRY": "NOK/TRY",
  "USDTRY": "USD/TRY",
  "EURTRY": "EUR/TRY",
  "CHFTRY": "CHF/TRY",
  "AUDTRY": "AUD/TRY",
  "CADTRY": "CAD/TRY",
  "SARTRY": "SAR/TRY",
  "JPYTRY": "JPY/TRY",
  "SEKTRY": "SEK/TRY",
  "DKKTRY": "DKK/TRY",
  "USDJPY": "USD/JPY",
  "GUMUSTRY": "Gümüş/TRY",
  "XPDUSD": "XPD/USD",
  "PALADYUM": "Paladyum",
  "EURUSD": "EUR/USD",
  "USDCHF": "USD/CHF",
  "XAGUSD": "XAG/USD",
  "GUMUSUSD": "Gümüş/USD",
  "USDCAD": "USD/CAD",
  "GBPUSD": "GBP/USD",
  "AUDUSD": "AUD/USD",
  "USDSAR": "USD/SAR",
  "USDILS": "USD/ILS",
  "ILSTRY": "ILS/TRY"
}; 