import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { worldLocations, locations } from "../lib/db/schema";
import { eq } from "drizzle-orm";

// Load environment variables
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables");
  process.exit(1);
}

const client = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

// Translation data for world locations
// Key: original name in DB, Value: { de, en, sl }
const worldLocationTranslations: Record<string, { de: string; en: string; sl: string }> = {
  // =====================
  // HIGHEST MOUNTAINS
  // =====================
  "Mount Everest": { de: "Mount Everest", en: "Mount Everest", sl: "Mount Everest" },
  "K2": { de: "K2", en: "K2", sl: "K2" },
  "Kangchenjunga": { de: "Kangchenjunga", en: "Kangchenjunga", sl: "Kančendženga" },
  "Lhotse": { de: "Lhotse", en: "Lhotse", sl: "Lhoce" },
  "Makalu": { de: "Makalu", en: "Makalu", sl: "Makalu" },
  "Cho Oyu": { de: "Cho Oyu", en: "Cho Oyu", sl: "Čo Oju" },
  "Dhaulagiri": { de: "Dhaulagiri", en: "Dhaulagiri", sl: "Daulagiri" },
  "Manaslu": { de: "Manaslu", en: "Manaslu", sl: "Manaslu" },
  "Nanga Parbat": { de: "Nanga Parbat", en: "Nanga Parbat", sl: "Nanga Parbat" },
  "Annapurna": { de: "Annapurna", en: "Annapurna", sl: "Anapurna" },
  "Mont Blanc": { de: "Mont Blanc", en: "Mont Blanc", sl: "Mont Blanc" },
  "Matterhorn": { de: "Matterhorn", en: "Matterhorn", sl: "Matterhorn" },
  "Denali": { de: "Denali", en: "Denali", sl: "Denali" },
  "Aconcagua": { de: "Aconcagua", en: "Aconcagua", sl: "Akonkagva" },
  "Kilimanjaro": { de: "Kilimandscharo", en: "Kilimanjaro", sl: "Kilimandžaro" },
  "Elbrus": { de: "Elbrus", en: "Elbrus", sl: "Elbrus" },
  "Vinson Massif": { de: "Vinson-Massiv", en: "Vinson Massif", sl: "Vinson Massif" },
  "Puncak Jaya": { de: "Puncak Jaya", en: "Puncak Jaya", sl: "Puncak Jaya" },
  "Mount Fuji": { de: "Fujisan", en: "Mount Fuji", sl: "Fudži" },
  "Zugspitze": { de: "Zugspitze", en: "Zugspitze", sl: "Zugspitze" },
  "Mount Olympus": { de: "Olymp", en: "Mount Olympus", sl: "Olimp" },
  "Table Mountain": { de: "Tafelberg", en: "Table Mountain", sl: "Namizna gora" },
  "Mount Kosciuszko": { de: "Mount Kosciuszko", en: "Mount Kosciuszko", sl: "Kosciuszko" },
  "Ben Nevis": { de: "Ben Nevis", en: "Ben Nevis", sl: "Ben Nevis" },
  "Mount McKinley": { de: "Denali", en: "Denali", sl: "Denali" },

  // =====================
  // WORLD CAPITALS (selected - major ones with different names)
  // =====================
  "Washington D.C.": { de: "Washington, D.C.", en: "Washington, D.C.", sl: "Washington" },
  "London": { de: "London", en: "London", sl: "London" },
  "Paris": { de: "Paris", en: "Paris", sl: "Pariz" },
  "Berlin": { de: "Berlin", en: "Berlin", sl: "Berlin" },
  "Tokyo": { de: "Tokio", en: "Tokyo", sl: "Tokio" },
  "Beijing": { de: "Peking", en: "Beijing", sl: "Peking" },
  "Moscow": { de: "Moskau", en: "Moscow", sl: "Moskva" },
  "Canberra": { de: "Canberra", en: "Canberra", sl: "Canberra" },
  "Ottawa": { de: "Ottawa", en: "Ottawa", sl: "Ottawa" },
  "Brasilia": { de: "Brasília", en: "Brasilia", sl: "Brasília" },
  "Buenos Aires": { de: "Buenos Aires", en: "Buenos Aires", sl: "Buenos Aires" },
  "Rome": { de: "Rom", en: "Rome", sl: "Rim" },
  "Madrid": { de: "Madrid", en: "Madrid", sl: "Madrid" },
  "Lisbon": { de: "Lissabon", en: "Lisbon", sl: "Lizbona" },
  "Amsterdam": { de: "Amsterdam", en: "Amsterdam", sl: "Amsterdam" },
  "Brussels": { de: "Brüssel", en: "Brussels", sl: "Bruselj" },
  "Vienna": { de: "Wien", en: "Vienna", sl: "Dunaj" },
  "Bern": { de: "Bern", en: "Bern", sl: "Bern" },
  "Stockholm": { de: "Stockholm", en: "Stockholm", sl: "Stockholm" },
  "Oslo": { de: "Oslo", en: "Oslo", sl: "Oslo" },
  "Copenhagen": { de: "Kopenhagen", en: "Copenhagen", sl: "Köbenhavn" },
  "Helsinki": { de: "Helsinki", en: "Helsinki", sl: "Helsinki" },
  "Dublin": { de: "Dublin", en: "Dublin", sl: "Dublin" },
  "Athens": { de: "Athen", en: "Athens", sl: "Atene" },
  "Ankara": { de: "Ankara", en: "Ankara", sl: "Ankara" },
  "Cairo": { de: "Kairo", en: "Cairo", sl: "Kairo" },
  "Pretoria": { de: "Pretoria", en: "Pretoria", sl: "Pretoria" },
  "Nairobi": { de: "Nairobi", en: "Nairobi", sl: "Nairobi" },
  "New Delhi": { de: "Neu-Delhi", en: "New Delhi", sl: "New Delhi" },
  "Jakarta": { de: "Jakarta", en: "Jakarta", sl: "Džakarta" },
  "Bangkok": { de: "Bangkok", en: "Bangkok", sl: "Bangkok" },
  "Seoul": { de: "Seoul", en: "Seoul", sl: "Seul" },
  "Hanoi": { de: "Hanoi", en: "Hanoi", sl: "Hanoj" },
  "Manila": { de: "Manila", en: "Manila", sl: "Manila" },
  "Singapore": { de: "Singapur", en: "Singapore", sl: "Singapur" },
  "Kuala Lumpur": { de: "Kuala Lumpur", en: "Kuala Lumpur", sl: "Kuala Lumpur" },
  "Wellington": { de: "Wellington", en: "Wellington", sl: "Wellington" },
  "Mexico City": { de: "Mexiko-Stadt", en: "Mexico City", sl: "Ciudad de México" },
  "Lima": { de: "Lima", en: "Lima", sl: "Lima" },
  "Santiago": { de: "Santiago de Chile", en: "Santiago", sl: "Santiago" },
  "Bogota": { de: "Bogotá", en: "Bogota", sl: "Bogota" },
  "Caracas": { de: "Caracas", en: "Caracas", sl: "Caracas" },
  "Havana": { de: "Havanna", en: "Havana", sl: "Havana" },
  "Warsaw": { de: "Warschau", en: "Warsaw", sl: "Varšava" },
  "Prague": { de: "Prag", en: "Prague", sl: "Praga" },
  "Budapest": { de: "Budapest", en: "Budapest", sl: "Budimpešta" },
  "Bucharest": { de: "Bukarest", en: "Bucharest", sl: "Bukarešta" },
  "Sofia": { de: "Sofia", en: "Sofia", sl: "Sofija" },
  "Belgrade": { de: "Belgrad", en: "Belgrade", sl: "Beograd" },
  "Zagreb": { de: "Zagreb", en: "Zagreb", sl: "Zagreb" },
  "Ljubljana": { de: "Ljubljana", en: "Ljubljana", sl: "Ljubljana" },
  "Bratislava": { de: "Bratislava", en: "Bratislava", sl: "Bratislava" },
  "Kyiv": { de: "Kiew", en: "Kyiv", sl: "Kijev" },
  "Minsk": { de: "Minsk", en: "Minsk", sl: "Minsk" },
  "Riga": { de: "Riga", en: "Riga", sl: "Riga" },
  "Vilnius": { de: "Vilnius", en: "Vilnius", sl: "Vilna" },
  "Tallinn": { de: "Tallinn", en: "Tallinn", sl: "Talin" },
  "Reykjavik": { de: "Reykjavík", en: "Reykjavik", sl: "Reykjavík" },
  "Tirana": { de: "Tirana", en: "Tirana", sl: "Tirana" },
  "Skopje": { de: "Skopje", en: "Skopje", sl: "Skopje" },
  "Podgorica": { de: "Podgorica", en: "Podgorica", sl: "Podgorica" },
  "Sarajevo": { de: "Sarajevo", en: "Sarajevo", sl: "Sarajevo" },
  "Pristina": { de: "Pristina", en: "Pristina", sl: "Priština" },
  "Chisinau": { de: "Chișinău", en: "Chisinau", sl: "Kišinjev" },
  "Tbilisi": { de: "Tiflis", en: "Tbilisi", sl: "Tbilisi" },
  "Yerevan": { de: "Jerewan", en: "Yerevan", sl: "Erevan" },
  "Baku": { de: "Baku", en: "Baku", sl: "Baku" },
  "Astana": { de: "Astana", en: "Astana", sl: "Astana" },
  "Tashkent": { de: "Taschkent", en: "Tashkent", sl: "Taškent" },
  "Bishkek": { de: "Bischkek", en: "Bishkek", sl: "Biškek" },
  "Dushanbe": { de: "Duschanbe", en: "Dushanbe", sl: "Dušanbe" },
  "Ashgabat": { de: "Aşgabat", en: "Ashgabat", sl: "Ašhabad" },
  "Kabul": { de: "Kabul", en: "Kabul", sl: "Kabul" },
  "Islamabad": { de: "Islamabad", en: "Islamabad", sl: "Islamabad" },
  "Dhaka": { de: "Dhaka", en: "Dhaka", sl: "Daka" },
  "Kathmandu": { de: "Kathmandu", en: "Kathmandu", sl: "Katmandu" },
  "Colombo": { de: "Colombo", en: "Colombo", sl: "Kolombo" },
  "Thimphu": { de: "Thimphu", en: "Thimphu", sl: "Timpu" },
  "Male": { de: "Malé", en: "Male", sl: "Male" },
  "Naypyidaw": { de: "Naypyidaw", en: "Naypyidaw", sl: "Naypyidaw" },
  "Vientiane": { de: "Vientiane", en: "Vientiane", sl: "Vientiane" },
  "Phnom Penh": { de: "Phnom Penh", en: "Phnom Penh", sl: "Phnom Penh" },
  "Taipei": { de: "Taipeh", en: "Taipei", sl: "Tajpej" },
  "Ulaanbaatar": { de: "Ulaanbaatar", en: "Ulaanbaatar", sl: "Ulan Bator" },
  "Pyongyang": { de: "Pjöngjang", en: "Pyongyang", sl: "Pjongjang" },
  "Tel Aviv": { de: "Tel Aviv", en: "Tel Aviv", sl: "Tel Aviv" },
  "Amman": { de: "Amman", en: "Amman", sl: "Aman" },
  "Beirut": { de: "Beirut", en: "Beirut", sl: "Bejrut" },
  "Damascus": { de: "Damaskus", en: "Damascus", sl: "Damask" },
  "Baghdad": { de: "Bagdad", en: "Baghdad", sl: "Bagdad" },
  "Tehran": { de: "Teheran", en: "Tehran", sl: "Teheran" },
  "Riyadh": { de: "Riad", en: "Riyadh", sl: "Rijad" },
  "Abu Dhabi": { de: "Abu Dhabi", en: "Abu Dhabi", sl: "Abu Dabi" },
  "Doha": { de: "Doha", en: "Doha", sl: "Doha" },
  "Kuwait City": { de: "Kuwait-Stadt", en: "Kuwait City", sl: "Kuvajt" },
  "Muscat": { de: "Maskat", en: "Muscat", sl: "Maskat" },
  "Manama": { de: "Manama", en: "Manama", sl: "Manama" },
  "Sanaa": { de: "Sanaa", en: "Sanaa", sl: "Sana" },
  "Rabat": { de: "Rabat", en: "Rabat", sl: "Rabat" },
  "Algiers": { de: "Algier", en: "Algiers", sl: "Alžir" },
  "Tunis": { de: "Tunis", en: "Tunis", sl: "Tunis" },
  "Tripoli": { de: "Tripolis", en: "Tripoli", sl: "Tripoli" },
  "Khartoum": { de: "Khartum", en: "Khartoum", sl: "Kartum" },
  "Addis Ababa": { de: "Addis Abeba", en: "Addis Ababa", sl: "Adis Abeba" },
  "Mogadishu": { de: "Mogadischu", en: "Mogadishu", sl: "Mogadišu" },
  "Kampala": { de: "Kampala", en: "Kampala", sl: "Kampala" },
  "Kigali": { de: "Kigali", en: "Kigali", sl: "Kigali" },
  "Dar es Salaam": { de: "Daressalam", en: "Dar es Salaam", sl: "Dar es Salaam" },
  "Lusaka": { de: "Lusaka", en: "Lusaka", sl: "Lusaka" },
  "Harare": { de: "Harare", en: "Harare", sl: "Harare" },
  "Maputo": { de: "Maputo", en: "Maputo", sl: "Maputo" },
  "Luanda": { de: "Luanda", en: "Luanda", sl: "Luanda" },
  "Kinshasa": { de: "Kinshasa", en: "Kinshasa", sl: "Kinšasa" },
  "Brazzaville": { de: "Brazzaville", en: "Brazzaville", sl: "Brazzaville" },
  "Lagos": { de: "Lagos", en: "Lagos", sl: "Lagos" },
  "Accra": { de: "Accra", en: "Accra", sl: "Akra" },
  "Dakar": { de: "Dakar", en: "Dakar", sl: "Dakar" },
  "Nouakchott": { de: "Nouakchott", en: "Nouakchott", sl: "Nuakšot" },
  "Bamako": { de: "Bamako", en: "Bamako", sl: "Bamako" },
  "Niamey": { de: "Niamey", en: "Niamey", sl: "Niamey" },
  "Ouagadougou": { de: "Ouagadougou", en: "Ouagadougou", sl: "Ouagadougou" },
  "Abidjan": { de: "Abidjan", en: "Abidjan", sl: "Abidžan" },
  "Monrovia": { de: "Monrovia", en: "Monrovia", sl: "Monrovia" },
  "Freetown": { de: "Freetown", en: "Freetown", sl: "Freetown" },
  "Conakry": { de: "Conakry", en: "Conakry", sl: "Konakri" },
  "Bissau": { de: "Bissau", en: "Bissau", sl: "Bissau" },
  "Praia": { de: "Praia", en: "Praia", sl: "Praia" },
  "Banjul": { de: "Banjul", en: "Banjul", sl: "Bandžul" },
  "Lome": { de: "Lomé", en: "Lome", sl: "Lome" },
  "Porto-Novo": { de: "Porto-Novo", en: "Porto-Novo", sl: "Porto-Novo" },
  "Yaounde": { de: "Yaoundé", en: "Yaounde", sl: "Yaoundé" },
  "Libreville": { de: "Libreville", en: "Libreville", sl: "Libreville" },
  "Malabo": { de: "Malabo", en: "Malabo", sl: "Malabo" },
  "Bangui": { de: "Bangui", en: "Bangui", sl: "Bangui" },
  "Ndjamena": { de: "N'Djamena", en: "N'Djamena", sl: "Ndžamena" },
  "Antananarivo": { de: "Antananarivo", en: "Antananarivo", sl: "Antananarivo" },
  "Port Louis": { de: "Port Louis", en: "Port Louis", sl: "Port Louis" },
  "Victoria": { de: "Victoria", en: "Victoria", sl: "Victoria" },
  "Moroni": { de: "Moroni", en: "Moroni", sl: "Moroni" },
  "Gaborone": { de: "Gaborone", en: "Gaborone", sl: "Gaborone" },
  "Windhoek": { de: "Windhoek", en: "Windhoek", sl: "Windhoek" },
  "Maseru": { de: "Maseru", en: "Maseru", sl: "Maseru" },
  "Mbabane": { de: "Mbabane", en: "Mbabane", sl: "Mbabane" },
  "Guatemala City": { de: "Guatemala-Stadt", en: "Guatemala City", sl: "Ciudad de Guatemala" },
  "San Salvador": { de: "San Salvador", en: "San Salvador", sl: "San Salvador" },
  "Tegucigalpa": { de: "Tegucigalpa", en: "Tegucigalpa", sl: "Tegucigalpa" },
  "Managua": { de: "Managua", en: "Managua", sl: "Managua" },
  "San Jose": { de: "San José", en: "San Jose", sl: "San José" },
  "Panama City": { de: "Panama-Stadt", en: "Panama City", sl: "Ciudad de Panamá" },
  "Kingston": { de: "Kingston", en: "Kingston", sl: "Kingston" },
  "Port-au-Prince": { de: "Port-au-Prince", en: "Port-au-Prince", sl: "Port-au-Prince" },
  "Santo Domingo": { de: "Santo Domingo", en: "Santo Domingo", sl: "Santo Domingo" },
  "Nassau": { de: "Nassau", en: "Nassau", sl: "Nassau" },
  "Port of Spain": { de: "Port of Spain", en: "Port of Spain", sl: "Port of Spain" },
  "Bridgetown": { de: "Bridgetown", en: "Bridgetown", sl: "Bridgetown" },
  "Quito": { de: "Quito", en: "Quito", sl: "Quito" },
  "La Paz": { de: "La Paz", en: "La Paz", sl: "La Paz" },
  "Asuncion": { de: "Asunción", en: "Asuncion", sl: "Asunción" },
  "Montevideo": { de: "Montevideo", en: "Montevideo", sl: "Montevideo" },
  "Georgetown": { de: "Georgetown", en: "Georgetown", sl: "Georgetown" },
  "Paramaribo": { de: "Paramaribo", en: "Paramaribo", sl: "Paramaribo" },
  "Suva": { de: "Suva", en: "Suva", sl: "Suva" },
  "Port Moresby": { de: "Port Moresby", en: "Port Moresby", sl: "Port Moresby" },
  "Apia": { de: "Apia", en: "Apia", sl: "Apia" },
  "Honiara": { de: "Honiara", en: "Honiara", sl: "Honiara" },
  "Port Vila": { de: "Port Vila", en: "Port Vila", sl: "Port Vila" },
  "Nuku'alofa": { de: "Nuku'alofa", en: "Nuku'alofa", sl: "Nuku'alofa" },
  "Funafuti": { de: "Funafuti", en: "Funafuti", sl: "Funafuti" },
  "Tarawa": { de: "Tarawa", en: "Tarawa", sl: "Tarawa" },
  "Majuro": { de: "Majuro", en: "Majuro", sl: "Majuro" },
  "Palikir": { de: "Palikir", en: "Palikir", sl: "Palikir" },
  "Ngerulmud": { de: "Ngerulmud", en: "Ngerulmud", sl: "Ngerulmud" },
  "Yaren": { de: "Yaren", en: "Yaren", sl: "Yaren" },
  "Luxembourg": { de: "Luxemburg", en: "Luxembourg", sl: "Luksemburg" },
  "Monaco": { de: "Monaco", en: "Monaco", sl: "Monako" },
  "San Marino": { de: "San Marino", en: "San Marino", sl: "San Marino" },
  "Vatican City": { de: "Vatikanstadt", en: "Vatican City", sl: "Vatikan" },
  "Andorra la Vella": { de: "Andorra la Vella", en: "Andorra la Vella", sl: "Andorra la Vella" },
  "Vaduz": { de: "Vaduz", en: "Vaduz", sl: "Vaduz" },
  "Valletta": { de: "Valletta", en: "Valletta", sl: "Valletta" },
  "Nicosia": { de: "Nikosia", en: "Nicosia", sl: "Nikozija" },
  "Belmopan": { de: "Belmopan", en: "Belmopan", sl: "Belmopan" },
  "Djibouti": { de: "Dschibuti", en: "Djibouti", sl: "Džibuti" },
  "Asmara": { de: "Asmara", en: "Asmara", sl: "Asmara" },
  "Juba": { de: "Juba", en: "Juba", sl: "Juba" },
  "Lilongwe": { de: "Lilongwe", en: "Lilongwe", sl: "Lilongwe" },
  "Bujumbura": { de: "Bujumbura", en: "Bujumbura", sl: "Bujumbura" },
  "Sao Tome": { de: "São Tomé", en: "Sao Tome", sl: "São Tomé" },
  "Abuja": { de: "Abuja", en: "Abuja", sl: "Abuja" },
  "Dodoma": { de: "Dodoma", en: "Dodoma", sl: "Dodoma" },
  "Yamoussoukro": { de: "Yamoussoukro", en: "Yamoussoukro", sl: "Yamoussoukro" },

  // =====================
  // FAMOUS PLACES
  // =====================
  "Eiffelturm": { de: "Eiffelturm", en: "Eiffel Tower", sl: "Eifflov stolp" },
  "Kolosseum": { de: "Kolosseum", en: "Colosseum", sl: "Kolosej" },
  "Taj Mahal": { de: "Taj Mahal", en: "Taj Mahal", sl: "Tadž Mahal" },
  "Machu Picchu": { de: "Machu Picchu", en: "Machu Picchu", sl: "Machu Picchu" },
  "Pyramiden von Gizeh": { de: "Pyramiden von Gizeh", en: "Pyramids of Giza", sl: "Piramide v Gizi" },
  "Chinesische Mauer": { de: "Chinesische Mauer", en: "Great Wall of China", sl: "Kitajski zid" },
  "Freiheitsstatue": { de: "Freiheitsstatue", en: "Statue of Liberty", sl: "Kip svobode" },
  "Sydney Opera House": { de: "Sydney Opera House", en: "Sydney Opera House", sl: "Opera v Sydneyju" },
  "Big Ben": { de: "Big Ben", en: "Big Ben", sl: "Big Ben" },
  "Akropolis": { de: "Akropolis", en: "Acropolis", sl: "Akropola" },
  "Petra": { de: "Petra", en: "Petra", sl: "Petra" },
  "Angkor Wat": { de: "Angkor Wat", en: "Angkor Wat", sl: "Angkor Wat" },
  "Christ the Redeemer": { de: "Christusstatue", en: "Christ the Redeemer", sl: "Kristus Odrešenik" },
  "Stonehenge": { de: "Stonehenge", en: "Stonehenge", sl: "Stonehenge" },
  "Sagrada Familia": { de: "Sagrada Família", en: "Sagrada Familia", sl: "Sagrada Família" },
  "Burj Khalifa": { de: "Burj Khalifa", en: "Burj Khalifa", sl: "Burdž Kalifa" },
  "Golden Gate Bridge": { de: "Golden Gate Bridge", en: "Golden Gate Bridge", sl: "Most Golden Gate" },
  "Neuschwanstein": { de: "Schloss Neuschwanstein", en: "Neuschwanstein Castle", sl: "Grad Neuschwanstein" },
  "Brandenburger Tor": { de: "Brandenburger Tor", en: "Brandenburg Gate", sl: "Brandenburška vrata" },
  "Hagia Sophia": { de: "Hagia Sophia", en: "Hagia Sophia", sl: "Aja Sofija" },
  "Kreml": { de: "Kreml", en: "Kremlin", sl: "Kremelj" },
  "Verbotene Stadt": { de: "Verbotene Stadt", en: "Forbidden City", sl: "Prepovedano mesto" },
  "Grand Canyon": { de: "Grand Canyon", en: "Grand Canyon", sl: "Veliki kanjon" },
  "Niagara Falls": { de: "Niagarafälle", en: "Niagara Falls", sl: "Niagarski slapovi" },
  "Victoria Falls": { de: "Victoriafälle", en: "Victoria Falls", sl: "Viktorijini slapovi" },
  "Uluru / Ayers Rock": { de: "Uluru", en: "Uluru", sl: "Uluru" },
  "Chichen Itza": { de: "Chichén Itzá", en: "Chichen Itza", sl: "Chichén Itzá" },
  "Louvre": { de: "Louvre", en: "Louvre", sl: "Louvre" },
  "Tower of London": { de: "Tower of London", en: "Tower of London", sl: "Londonski stolp" },
  "Alhambra": { de: "Alhambra", en: "Alhambra", sl: "Alhambra" },
  "Mount Rushmore": { de: "Mount Rushmore", en: "Mount Rushmore", sl: "Mount Rushmore" },
  "Empire State Building": { de: "Empire State Building", en: "Empire State Building", sl: "Empire State Building" },
  "Buckingham Palace": { de: "Buckingham Palace", en: "Buckingham Palace", sl: "Buckinghamska palača" },
  "Vatican Museums": { de: "Vatikanische Museen", en: "Vatican Museums", sl: "Vatikanski muzeji" },
  "Schloss Versailles": { de: "Schloss Versailles", en: "Palace of Versailles", sl: "Versajska palača" },
  "Tower Bridge": { de: "Tower Bridge", en: "Tower Bridge", sl: "Tower Bridge" },
  "Leaning Tower of Pisa": { de: "Schiefer Turm von Pisa", en: "Leaning Tower of Pisa", sl: "Poševni stolp v Pisi" },
  "Sensoji Temple": { de: "Sensō-ji-Tempel", en: "Sensoji Temple", sl: "Tempelj Sensoji" },
  "Marina Bay Sands": { de: "Marina Bay Sands", en: "Marina Bay Sands", sl: "Marina Bay Sands" },
  "Santorini": { de: "Santorin", en: "Santorini", sl: "Santorini" },

  // =====================
  // UNESCO SITES
  // =====================
  "Akropolis von Athen": { de: "Akropolis von Athen", en: "Acropolis of Athens", sl: "Atenška akropola" },
  "Chichén Itzá": { de: "Chichén Itzá", en: "Chichen Itza", sl: "Chichén Itzá" },
  "Schloss Schönbrunn": { de: "Schloss Schönbrunn", en: "Schönbrunn Palace", sl: "Palača Schönbrunn" },
  "Altstadt von Dubrovnik": { de: "Altstadt von Dubrovnik", en: "Old City of Dubrovnik", sl: "Staro mestno jedro Dubrovnika" },
  "Auschwitz-Birkenau": { de: "Auschwitz-Birkenau", en: "Auschwitz-Birkenau", sl: "Auschwitz-Birkenau" },
  "Borobudur": { de: "Borobudur", en: "Borobudur", sl: "Borobudur" },
  "Timbuktu": { de: "Timbuktu", en: "Timbuktu", sl: "Timbuktu" },
  "Abu Simbel": { de: "Abu Simbel", en: "Abu Simbel", sl: "Abu Simbel" },
  "Pompeji": { de: "Pompeji", en: "Pompeii", sl: "Pompeji" },
  "Great Barrier Reef": { de: "Great Barrier Reef", en: "Great Barrier Reef", sl: "Veliki koralni greben" },
  "Galápagos-Inseln": { de: "Galápagos-Inseln", en: "Galapagos Islands", sl: "Galapaški otoki" },
  "Yellowstone-Nationalpark": { de: "Yellowstone-Nationalpark", en: "Yellowstone National Park", sl: "Narodni park Yellowstone" },
  "Victoriafälle": { de: "Victoriafälle", en: "Victoria Falls", sl: "Viktorijini slapovi" },
  "Serengeti-Nationalpark": { de: "Serengeti-Nationalpark", en: "Serengeti National Park", sl: "Narodni park Serengeti" },
  "Iguazú-Wasserfälle": { de: "Iguazú-Wasserfälle", en: "Iguazu Falls", sl: "Slapovi Iguazú" },
  "Ha Long Bay": { de: "Halong-Bucht", en: "Ha Long Bay", sl: "Zaliv Ha Long" },
  "Plitvice-Seen": { de: "Plitvicer Seen", en: "Plitvice Lakes", sl: "Plitvička jezera" },
  "Komodo-Nationalpark": { de: "Komodo-Nationalpark", en: "Komodo National Park", sl: "Narodni park Komodo" },
  "Baikalsee": { de: "Baikalsee", en: "Lake Baikal", sl: "Bajkalsko jezero" },
  "Dolomiten": { de: "Dolomiten", en: "Dolomites", sl: "Dolomiti" },
  "Schweizer Alpen Jungfrau-Aletsch": { de: "Schweizer Alpen Jungfrau-Aletsch", en: "Swiss Alps Jungfrau-Aletsch", sl: "Švicarske Alpe Jungfrau-Aletsch" },
  "Table Mountain Nationalpark": { de: "Tafelberg-Nationalpark", en: "Table Mountain National Park", sl: "Narodni park Namizna gora" },
  "Meteora": { de: "Meteora", en: "Meteora", sl: "Meteora" },
  "Mont-Saint-Michel": { de: "Mont-Saint-Michel", en: "Mont-Saint-Michel", sl: "Mont-Saint-Michel" },
  "Kappadokien": { de: "Kappadokien", en: "Cappadocia", sl: "Kapadokija" },
  "Uluru-Kata Tjuta": { de: "Uluru-Kata Tjuta", en: "Uluru-Kata Tjuta", sl: "Uluru-Kata Tjuta" },
  "Nazca-Linien": { de: "Nazca-Linien", en: "Nazca Lines", sl: "Nazca linije" },
  "Tikal": { de: "Tikal", en: "Tikal", sl: "Tikal" },

  // =====================
  // AIRPORTS
  // =====================
  "Dubai International (DXB)": { de: "Dubai International (DXB)", en: "Dubai International (DXB)", sl: "Dubaj International (DXB)" },
  "Hartsfield-Jackson Atlanta (ATL)": { de: "Hartsfield-Jackson Atlanta (ATL)", en: "Hartsfield-Jackson Atlanta (ATL)", sl: "Hartsfield-Jackson Atlanta (ATL)" },
  "London Heathrow (LHR)": { de: "London Heathrow (LHR)", en: "London Heathrow (LHR)", sl: "London Heathrow (LHR)" },
  "Tokyo Haneda (HND)": { de: "Tokio Haneda (HND)", en: "Tokyo Haneda (HND)", sl: "Tokio Haneda (HND)" },
  "Dallas/Fort Worth (DFW)": { de: "Dallas/Fort Worth (DFW)", en: "Dallas/Fort Worth (DFW)", sl: "Dallas/Fort Worth (DFW)" },
  "Istanbul Airport (IST)": { de: "Flughafen Istanbul (IST)", en: "Istanbul Airport (IST)", sl: "Letališče Istanbul (IST)" },
  "Denver International (DEN)": { de: "Denver International (DEN)", en: "Denver International (DEN)", sl: "Denver International (DEN)" },
  "Los Angeles International (LAX)": { de: "Los Angeles International (LAX)", en: "Los Angeles International (LAX)", sl: "Los Angeles International (LAX)" },
  "Chicago O'Hare (ORD)": { de: "Chicago O'Hare (ORD)", en: "Chicago O'Hare (ORD)", sl: "Chicago O'Hare (ORD)" },
  "Paris Charles de Gaulle (CDG)": { de: "Paris Charles de Gaulle (CDG)", en: "Paris Charles de Gaulle (CDG)", sl: "Pariz Charles de Gaulle (CDG)" },
  "Singapore Changi (SIN)": { de: "Singapur Changi (SIN)", en: "Singapore Changi (SIN)", sl: "Singapur Changi (SIN)" },
  "Amsterdam Schiphol (AMS)": { de: "Amsterdam Schiphol (AMS)", en: "Amsterdam Schiphol (AMS)", sl: "Amsterdam Schiphol (AMS)" },
  "Hong Kong International (HKG)": { de: "Hongkong International (HKG)", en: "Hong Kong International (HKG)", sl: "Hongkong International (HKG)" },
  "Frankfurt am Main (FRA)": { de: "Frankfurt am Main (FRA)", en: "Frankfurt am Main (FRA)", sl: "Frankfurt na Majni (FRA)" },
  "New York JFK (JFK)": { de: "New York JFK (JFK)", en: "New York JFK (JFK)", sl: "New York JFK (JFK)" },
  "Seoul Incheon (ICN)": { de: "Seoul Incheon (ICN)", en: "Seoul Incheon (ICN)", sl: "Seul Incheon (ICN)" },
  "Beijing Capital (PEK)": { de: "Peking Capital (PEK)", en: "Beijing Capital (PEK)", sl: "Peking Capital (PEK)" },
  "Madrid Barajas (MAD)": { de: "Madrid Barajas (MAD)", en: "Madrid Barajas (MAD)", sl: "Madrid Barajas (MAD)" },
  "Barcelona El Prat (BCN)": { de: "Barcelona El Prat (BCN)", en: "Barcelona El Prat (BCN)", sl: "Barcelona El Prat (BCN)" },
  "Munich Airport (MUC)": { de: "Flughafen München (MUC)", en: "Munich Airport (MUC)", sl: "Letališče München (MUC)" },
  "Sydney Kingsford Smith (SYD)": { de: "Sydney Kingsford Smith (SYD)", en: "Sydney Kingsford Smith (SYD)", sl: "Sydney Kingsford Smith (SYD)" },
  "Toronto Pearson (YYZ)": { de: "Toronto Pearson (YYZ)", en: "Toronto Pearson (YYZ)", sl: "Toronto Pearson (YYZ)" },
  "São Paulo Guarulhos (GRU)": { de: "São Paulo Guarulhos (GRU)", en: "São Paulo Guarulhos (GRU)", sl: "São Paulo Guarulhos (GRU)" },
  "Doha Hamad (DOH)": { de: "Doha Hamad (DOH)", en: "Doha Hamad (DOH)", sl: "Doha Hamad (DOH)" },
  "Abu Dhabi International (AUH)": { de: "Abu Dhabi International (AUH)", en: "Abu Dhabi International (AUH)", sl: "Abu Dabi International (AUH)" },
  "Zürich Flughafen (ZRH)": { de: "Zürich Flughafen (ZRH)", en: "Zurich Airport (ZRH)", sl: "Letališče Zürich (ZRH)" },
  "Wien-Schwechat (VIE)": { de: "Wien-Schwechat (VIE)", en: "Vienna Airport (VIE)", sl: "Dunajsko letališče (VIE)" },
  "Copenhagen Kastrup (CPH)": { de: "Kopenhagen Kastrup (CPH)", en: "Copenhagen Kastrup (CPH)", sl: "Köbenhavn Kastrup (CPH)" },
  "Bangkok Suvarnabhumi (BKK)": { de: "Bangkok Suvarnabhumi (BKK)", en: "Bangkok Suvarnabhumi (BKK)", sl: "Bangkok Suvarnabhumi (BKK)" },
  "Kuala Lumpur International (KUL)": { de: "Kuala Lumpur International (KUL)", en: "Kuala Lumpur International (KUL)", sl: "Kuala Lumpur International (KUL)" },
  "Moskau Scheremetjewo (SVO)": { de: "Moskau Scheremetjewo (SVO)", en: "Moscow Sheremetyevo (SVO)", sl: "Moskva Šeremetjevo (SVO)" },
  "Johannesburg O.R. Tambo (JNB)": { de: "Johannesburg O.R. Tambo (JNB)", en: "Johannesburg O.R. Tambo (JNB)", sl: "Johannesburg O.R. Tambo (JNB)" },
  "Dubai Al Maktoum (DWC)": { de: "Dubai Al Maktoum (DWC)", en: "Dubai Al Maktoum (DWC)", sl: "Dubaj Al Maktoum (DWC)" },
  "Mexico City (MEX)": { de: "Mexiko-Stadt (MEX)", en: "Mexico City (MEX)", sl: "Ciudad de México (MEX)" },
  "Miami International (MIA)": { de: "Miami International (MIA)", en: "Miami International (MIA)", sl: "Miami International (MIA)" },
  "San Francisco International (SFO)": { de: "San Francisco International (SFO)", en: "San Francisco International (SFO)", sl: "San Francisco International (SFO)" },
  "Rom Fiumicino (FCO)": { de: "Rom Fiumicino (FCO)", en: "Rome Fiumicino (FCO)", sl: "Rim Fiumicino (FCO)" },
  "London Gatwick (LGW)": { de: "London Gatwick (LGW)", en: "London Gatwick (LGW)", sl: "London Gatwick (LGW)" },
  "Brüssel Zaventem (BRU)": { de: "Brüssel Zaventem (BRU)", en: "Brussels Zaventem (BRU)", sl: "Bruselj Zaventem (BRU)" },
  "Dublin Airport (DUB)": { de: "Dublin Airport (DUB)", en: "Dublin Airport (DUB)", sl: "Letališče Dublin (DUB)" },
};

async function updateWorldLocations() {
  console.log("Updating world location translations...");

  // Get all world locations
  const allLocations = await db.select().from(worldLocations);
  console.log(`Found ${allLocations.length} world locations`);

  let updated = 0;
  let notFound = 0;

  for (const loc of allLocations) {
    const translation = worldLocationTranslations[loc.name];

    if (translation) {
      await db
        .update(worldLocations)
        .set({
          nameDe: translation.de,
          nameEn: translation.en,
          nameSl: translation.sl,
        })
        .where(eq(worldLocations.id, loc.id));
      updated++;
    } else {
      // For locations without translation, copy the original name to all fields
      await db
        .update(worldLocations)
        .set({
          nameDe: loc.name,
          nameEn: loc.name,
          nameSl: loc.name,
        })
        .where(eq(worldLocations.id, loc.id));
      notFound++;
      console.log(`  No translation for: ${loc.name}`);
    }
  }

  console.log(`\nWorld locations: ${updated} translated, ${notFound} using original name`);
}

async function updateSwissLocations() {
  console.log("\nUpdating Swiss location translations...");

  // Get all Swiss locations
  const allLocations = await db.select().from(locations);
  console.log(`Found ${allLocations.length} Swiss locations`);

  // Swiss locations translations (common ones - most are the same in all languages)
  const swissTranslations: Record<string, { de: string; en: string; sl: string }> = {
    "Zürich": { de: "Zürich", en: "Zurich", sl: "Zürich" },
    "Genf": { de: "Genf", en: "Geneva", sl: "Ženeva" },
    "Bern": { de: "Bern", en: "Bern", sl: "Bern" },
    "Basel": { de: "Basel", en: "Basel", sl: "Basel" },
    "Lausanne": { de: "Lausanne", en: "Lausanne", sl: "Lausanne" },
    "Luzern": { de: "Luzern", en: "Lucerne", sl: "Luzern" },
    "Winterthur": { de: "Winterthur", en: "Winterthur", sl: "Winterthur" },
    "St. Gallen": { de: "St. Gallen", en: "St. Gallen", sl: "St. Gallen" },
    "Lugano": { de: "Lugano", en: "Lugano", sl: "Lugano" },
    "Biel/Bienne": { de: "Biel", en: "Biel/Bienne", sl: "Biel" },
    "Thun": { de: "Thun", en: "Thun", sl: "Thun" },
    "Freiburg": { de: "Freiburg", en: "Fribourg", sl: "Freiburg" },
    "Schaffhausen": { de: "Schaffhausen", en: "Schaffhausen", sl: "Schaffhausen" },
    "Chur": { de: "Chur", en: "Chur", sl: "Chur" },
    "Neuenburg": { de: "Neuenburg", en: "Neuchâtel", sl: "Neuchâtel" },
    "Sitten": { de: "Sitten", en: "Sion", sl: "Sion" },
    "Zermatt": { de: "Zermatt", en: "Zermatt", sl: "Zermatt" },
    "Interlaken": { de: "Interlaken", en: "Interlaken", sl: "Interlaken" },
    "Davos": { de: "Davos", en: "Davos", sl: "Davos" },
    "St. Moritz": { de: "St. Moritz", en: "St. Moritz", sl: "St. Moritz" },
    "Grindelwald": { de: "Grindelwald", en: "Grindelwald", sl: "Grindelwald" },
  };

  let updated = 0;
  let notFound = 0;

  for (const loc of allLocations) {
    const translation = swissTranslations[loc.name];

    if (translation) {
      await db
        .update(locations)
        .set({
          nameDe: translation.de,
          nameEn: translation.en,
          nameSl: translation.sl,
        })
        .where(eq(locations.id, loc.id));
      updated++;
    } else {
      // For Swiss locations without specific translation, use original name for all
      await db
        .update(locations)
        .set({
          nameDe: loc.name,
          nameEn: loc.name,
          nameSl: loc.name,
        })
        .where(eq(locations.id, loc.id));
      notFound++;
    }
  }

  console.log(`Swiss locations: ${updated} translated, ${notFound} using original name`);
}

async function main() {
  console.log("Starting translation update...\n");

  await updateWorldLocations();
  await updateSwissLocations();

  console.log("\nTranslation update completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Update failed:", error);
    process.exit(1);
  });
