import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { worldLocations } from "../lib/db/schema";
import { nanoid } from "nanoid";

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

interface WorldLocationData {
  category: string;
  name: string;
  latitude: number;
  longitude: number;
  countryCode?: string;
  additionalInfo?: string;
  difficulty?: "easy" | "medium" | "hard";
}

// Highest Mountains of the World (25 entries)
const highestMountains: WorldLocationData[] = [
  { category: "highest-mountains", name: "Mount Everest", latitude: 27.9881, longitude: 86.9250, countryCode: "NP", additionalInfo: JSON.stringify({ elevation: 8849 }), difficulty: "easy" },
  { category: "highest-mountains", name: "K2", latitude: 35.8808, longitude: 76.5155, countryCode: "PK", additionalInfo: JSON.stringify({ elevation: 8611 }), difficulty: "medium" },
  { category: "highest-mountains", name: "Kangchenjunga", latitude: 27.7025, longitude: 88.1475, countryCode: "NP", additionalInfo: JSON.stringify({ elevation: 8586 }), difficulty: "hard" },
  { category: "highest-mountains", name: "Lhotse", latitude: 27.9617, longitude: 86.9333, countryCode: "NP", additionalInfo: JSON.stringify({ elevation: 8516 }), difficulty: "hard" },
  { category: "highest-mountains", name: "Makalu", latitude: 27.8897, longitude: 87.0889, countryCode: "NP", additionalInfo: JSON.stringify({ elevation: 8485 }), difficulty: "hard" },
  { category: "highest-mountains", name: "Cho Oyu", latitude: 28.0942, longitude: 86.6608, countryCode: "NP", additionalInfo: JSON.stringify({ elevation: 8188 }), difficulty: "hard" },
  { category: "highest-mountains", name: "Dhaulagiri", latitude: 28.6967, longitude: 83.4875, countryCode: "NP", additionalInfo: JSON.stringify({ elevation: 8167 }), difficulty: "hard" },
  { category: "highest-mountains", name: "Manaslu", latitude: 28.5497, longitude: 84.5597, countryCode: "NP", additionalInfo: JSON.stringify({ elevation: 8163 }), difficulty: "hard" },
  { category: "highest-mountains", name: "Nanga Parbat", latitude: 35.2378, longitude: 74.5892, countryCode: "PK", additionalInfo: JSON.stringify({ elevation: 8126 }), difficulty: "hard" },
  { category: "highest-mountains", name: "Annapurna", latitude: 28.5969, longitude: 83.8203, countryCode: "NP", additionalInfo: JSON.stringify({ elevation: 8091 }), difficulty: "medium" },
  { category: "highest-mountains", name: "Mont Blanc", latitude: 45.8326, longitude: 6.8652, countryCode: "FR", additionalInfo: JSON.stringify({ elevation: 4808 }), difficulty: "easy" },
  { category: "highest-mountains", name: "Matterhorn", latitude: 45.9766, longitude: 7.6586, countryCode: "CH", additionalInfo: JSON.stringify({ elevation: 4478 }), difficulty: "easy" },
  { category: "highest-mountains", name: "Denali", latitude: 63.0695, longitude: -151.0074, countryCode: "US", additionalInfo: JSON.stringify({ elevation: 6190 }), difficulty: "medium" },
  { category: "highest-mountains", name: "Aconcagua", latitude: -32.6532, longitude: -70.0109, countryCode: "AR", additionalInfo: JSON.stringify({ elevation: 6962 }), difficulty: "medium" },
  { category: "highest-mountains", name: "Kilimanjaro", latitude: -3.0674, longitude: 37.3556, countryCode: "TZ", additionalInfo: JSON.stringify({ elevation: 5895 }), difficulty: "easy" },
  { category: "highest-mountains", name: "Elbrus", latitude: 43.3499, longitude: 42.4453, countryCode: "RU", additionalInfo: JSON.stringify({ elevation: 5642 }), difficulty: "medium" },
  { category: "highest-mountains", name: "Vinson Massif", latitude: -78.5254, longitude: -85.6172, countryCode: "AQ", additionalInfo: JSON.stringify({ elevation: 4892 }), difficulty: "hard" },
  { category: "highest-mountains", name: "Puncak Jaya", latitude: -4.0833, longitude: 137.1833, countryCode: "ID", additionalInfo: JSON.stringify({ elevation: 4884 }), difficulty: "hard" },
  { category: "highest-mountains", name: "Mount Fuji", latitude: 35.3606, longitude: 138.7274, countryCode: "JP", additionalInfo: JSON.stringify({ elevation: 3776 }), difficulty: "easy" },
  { category: "highest-mountains", name: "Zugspitze", latitude: 47.4211, longitude: 10.9856, countryCode: "DE", additionalInfo: JSON.stringify({ elevation: 2962 }), difficulty: "medium" },
  { category: "highest-mountains", name: "Mount Olympus", latitude: 40.0859, longitude: 22.3583, countryCode: "GR", additionalInfo: JSON.stringify({ elevation: 2918 }), difficulty: "medium" },
  { category: "highest-mountains", name: "Table Mountain", latitude: -33.9625, longitude: 18.4039, countryCode: "ZA", additionalInfo: JSON.stringify({ elevation: 1085 }), difficulty: "easy" },
  { category: "highest-mountains", name: "Mount Kosciuszko", latitude: -36.4564, longitude: 148.2639, countryCode: "AU", additionalInfo: JSON.stringify({ elevation: 2228 }), difficulty: "medium" },
  { category: "highest-mountains", name: "Ben Nevis", latitude: 56.7969, longitude: -5.0036, countryCode: "GB", additionalInfo: JSON.stringify({ elevation: 1345 }), difficulty: "medium" },
  { category: "highest-mountains", name: "Mount McKinley", latitude: 63.0695, longitude: -151.0074, countryCode: "US", additionalInfo: JSON.stringify({ elevation: 6190 }), difficulty: "medium" },
];

// World Capitals (195 entries - all UN member states)
const worldCapitals: WorldLocationData[] = [
  { category: "capitals", name: "Washington D.C.", latitude: 38.9072, longitude: -77.0369, countryCode: "US", difficulty: "easy" },
  { category: "capitals", name: "London", latitude: 51.5074, longitude: -0.1278, countryCode: "GB", difficulty: "easy" },
  { category: "capitals", name: "Paris", latitude: 48.8566, longitude: 2.3522, countryCode: "FR", difficulty: "easy" },
  { category: "capitals", name: "Berlin", latitude: 52.5200, longitude: 13.4050, countryCode: "DE", difficulty: "easy" },
  { category: "capitals", name: "Tokyo", latitude: 35.6762, longitude: 139.6503, countryCode: "JP", difficulty: "easy" },
  { category: "capitals", name: "Beijing", latitude: 39.9042, longitude: 116.4074, countryCode: "CN", difficulty: "easy" },
  { category: "capitals", name: "Moscow", latitude: 55.7558, longitude: 37.6173, countryCode: "RU", difficulty: "easy" },
  { category: "capitals", name: "Canberra", latitude: -35.2809, longitude: 149.1300, countryCode: "AU", difficulty: "medium" },
  { category: "capitals", name: "Ottawa", latitude: 45.4215, longitude: -75.6972, countryCode: "CA", difficulty: "medium" },
  { category: "capitals", name: "Brasilia", latitude: -15.8267, longitude: -47.9218, countryCode: "BR", difficulty: "medium" },
  { category: "capitals", name: "Buenos Aires", latitude: -34.6037, longitude: -58.3816, countryCode: "AR", difficulty: "easy" },
  { category: "capitals", name: "Rome", latitude: 41.9028, longitude: 12.4964, countryCode: "IT", difficulty: "easy" },
  { category: "capitals", name: "Madrid", latitude: 40.4168, longitude: -3.7038, countryCode: "ES", difficulty: "easy" },
  { category: "capitals", name: "Lisbon", latitude: 38.7223, longitude: -9.1393, countryCode: "PT", difficulty: "easy" },
  { category: "capitals", name: "Amsterdam", latitude: 52.3676, longitude: 4.9041, countryCode: "NL", difficulty: "easy" },
  { category: "capitals", name: "Brussels", latitude: 50.8503, longitude: 4.3517, countryCode: "BE", difficulty: "easy" },
  { category: "capitals", name: "Vienna", latitude: 48.2082, longitude: 16.3738, countryCode: "AT", difficulty: "easy" },
  { category: "capitals", name: "Bern", latitude: 46.9480, longitude: 7.4474, countryCode: "CH", difficulty: "easy" },
  { category: "capitals", name: "Stockholm", latitude: 59.3293, longitude: 18.0686, countryCode: "SE", difficulty: "easy" },
  { category: "capitals", name: "Oslo", latitude: 59.9139, longitude: 10.7522, countryCode: "NO", difficulty: "easy" },
  { category: "capitals", name: "Copenhagen", latitude: 55.6761, longitude: 12.5683, countryCode: "DK", difficulty: "easy" },
  { category: "capitals", name: "Helsinki", latitude: 60.1699, longitude: 24.9384, countryCode: "FI", difficulty: "easy" },
  { category: "capitals", name: "Dublin", latitude: 53.3498, longitude: -6.2603, countryCode: "IE", difficulty: "easy" },
  { category: "capitals", name: "Athens", latitude: 37.9838, longitude: 23.7275, countryCode: "GR", difficulty: "easy" },
  { category: "capitals", name: "Ankara", latitude: 39.9334, longitude: 32.8597, countryCode: "TR", difficulty: "medium" },
  { category: "capitals", name: "Cairo", latitude: 30.0444, longitude: 31.2357, countryCode: "EG", difficulty: "easy" },
  { category: "capitals", name: "Pretoria", latitude: -25.7479, longitude: 28.2293, countryCode: "ZA", difficulty: "medium" },
  { category: "capitals", name: "Nairobi", latitude: -1.2921, longitude: 36.8219, countryCode: "KE", difficulty: "medium" },
  { category: "capitals", name: "New Delhi", latitude: 28.6139, longitude: 77.2090, countryCode: "IN", difficulty: "easy" },
  { category: "capitals", name: "Jakarta", latitude: -6.2088, longitude: 106.8456, countryCode: "ID", difficulty: "medium" },
  { category: "capitals", name: "Bangkok", latitude: 13.7563, longitude: 100.5018, countryCode: "TH", difficulty: "medium" },
  { category: "capitals", name: "Seoul", latitude: 37.5665, longitude: 126.9780, countryCode: "KR", difficulty: "easy" },
  { category: "capitals", name: "Hanoi", latitude: 21.0285, longitude: 105.8542, countryCode: "VN", difficulty: "medium" },
  { category: "capitals", name: "Manila", latitude: 14.5995, longitude: 120.9842, countryCode: "PH", difficulty: "medium" },
  { category: "capitals", name: "Singapore", latitude: 1.3521, longitude: 103.8198, countryCode: "SG", difficulty: "easy" },
  { category: "capitals", name: "Kuala Lumpur", latitude: 3.1390, longitude: 101.6869, countryCode: "MY", difficulty: "medium" },
  { category: "capitals", name: "Wellington", latitude: -41.2865, longitude: 174.7762, countryCode: "NZ", difficulty: "medium" },
  { category: "capitals", name: "Mexico City", latitude: 19.4326, longitude: -99.1332, countryCode: "MX", difficulty: "easy" },
  { category: "capitals", name: "Lima", latitude: -12.0464, longitude: -77.0428, countryCode: "PE", difficulty: "medium" },
  { category: "capitals", name: "Santiago", latitude: -33.4489, longitude: -70.6693, countryCode: "CL", difficulty: "medium" },
  { category: "capitals", name: "Bogota", latitude: 4.7110, longitude: -74.0721, countryCode: "CO", difficulty: "medium" },
  { category: "capitals", name: "Caracas", latitude: 10.4806, longitude: -66.9036, countryCode: "VE", difficulty: "medium" },
  { category: "capitals", name: "Havana", latitude: 23.1136, longitude: -82.3666, countryCode: "CU", difficulty: "medium" },
  { category: "capitals", name: "Warsaw", latitude: 52.2297, longitude: 21.0122, countryCode: "PL", difficulty: "easy" },
  { category: "capitals", name: "Prague", latitude: 50.0755, longitude: 14.4378, countryCode: "CZ", difficulty: "easy" },
  { category: "capitals", name: "Budapest", latitude: 47.4979, longitude: 19.0402, countryCode: "HU", difficulty: "easy" },
  { category: "capitals", name: "Bucharest", latitude: 44.4268, longitude: 26.1025, countryCode: "RO", difficulty: "medium" },
  { category: "capitals", name: "Sofia", latitude: 42.6977, longitude: 23.3219, countryCode: "BG", difficulty: "medium" },
  { category: "capitals", name: "Belgrade", latitude: 44.7866, longitude: 20.4489, countryCode: "RS", difficulty: "medium" },
  { category: "capitals", name: "Zagreb", latitude: 45.8150, longitude: 15.9819, countryCode: "HR", difficulty: "medium" },
  { category: "capitals", name: "Ljubljana", latitude: 46.0569, longitude: 14.5058, countryCode: "SI", difficulty: "medium" },
  { category: "capitals", name: "Bratislava", latitude: 48.1486, longitude: 17.1077, countryCode: "SK", difficulty: "medium" },
  { category: "capitals", name: "Kyiv", latitude: 50.4501, longitude: 30.5234, countryCode: "UA", difficulty: "easy" },
  { category: "capitals", name: "Minsk", latitude: 53.9006, longitude: 27.5590, countryCode: "BY", difficulty: "medium" },
  { category: "capitals", name: "Riga", latitude: 56.9496, longitude: 24.1052, countryCode: "LV", difficulty: "medium" },
  { category: "capitals", name: "Vilnius", latitude: 54.6872, longitude: 25.2797, countryCode: "LT", difficulty: "medium" },
  { category: "capitals", name: "Tallinn", latitude: 59.4370, longitude: 24.7536, countryCode: "EE", difficulty: "medium" },
  { category: "capitals", name: "Reykjavik", latitude: 64.1466, longitude: -21.9426, countryCode: "IS", difficulty: "medium" },
  { category: "capitals", name: "Tirana", latitude: 41.3275, longitude: 19.8187, countryCode: "AL", difficulty: "hard" },
  { category: "capitals", name: "Skopje", latitude: 41.9981, longitude: 21.4254, countryCode: "MK", difficulty: "hard" },
  { category: "capitals", name: "Podgorica", latitude: 42.4304, longitude: 19.2594, countryCode: "ME", difficulty: "hard" },
  { category: "capitals", name: "Sarajevo", latitude: 43.8563, longitude: 18.4131, countryCode: "BA", difficulty: "medium" },
  { category: "capitals", name: "Pristina", latitude: 42.6629, longitude: 21.1655, countryCode: "XK", difficulty: "hard" },
  { category: "capitals", name: "Chisinau", latitude: 47.0105, longitude: 28.8638, countryCode: "MD", difficulty: "hard" },
  { category: "capitals", name: "Tbilisi", latitude: 41.7151, longitude: 44.8271, countryCode: "GE", difficulty: "medium" },
  { category: "capitals", name: "Yerevan", latitude: 40.1872, longitude: 44.5152, countryCode: "AM", difficulty: "hard" },
  { category: "capitals", name: "Baku", latitude: 40.4093, longitude: 49.8671, countryCode: "AZ", difficulty: "hard" },
  { category: "capitals", name: "Astana", latitude: 51.1605, longitude: 71.4704, countryCode: "KZ", difficulty: "hard" },
  { category: "capitals", name: "Tashkent", latitude: 41.2995, longitude: 69.2401, countryCode: "UZ", difficulty: "hard" },
  { category: "capitals", name: "Bishkek", latitude: 42.8746, longitude: 74.5698, countryCode: "KG", difficulty: "hard" },
  { category: "capitals", name: "Dushanbe", latitude: 38.5598, longitude: 68.7740, countryCode: "TJ", difficulty: "hard" },
  { category: "capitals", name: "Ashgabat", latitude: 37.9601, longitude: 58.3261, countryCode: "TM", difficulty: "hard" },
  { category: "capitals", name: "Kabul", latitude: 34.5553, longitude: 69.2075, countryCode: "AF", difficulty: "medium" },
  { category: "capitals", name: "Islamabad", latitude: 33.6844, longitude: 73.0479, countryCode: "PK", difficulty: "medium" },
  { category: "capitals", name: "Dhaka", latitude: 23.8103, longitude: 90.4125, countryCode: "BD", difficulty: "medium" },
  { category: "capitals", name: "Kathmandu", latitude: 27.7172, longitude: 85.3240, countryCode: "NP", difficulty: "medium" },
  { category: "capitals", name: "Colombo", latitude: 6.9271, longitude: 79.8612, countryCode: "LK", difficulty: "medium" },
  { category: "capitals", name: "Thimphu", latitude: 27.4728, longitude: 89.6393, countryCode: "BT", difficulty: "hard" },
  { category: "capitals", name: "Male", latitude: 4.1755, longitude: 73.5093, countryCode: "MV", difficulty: "hard" },
  { category: "capitals", name: "Naypyidaw", latitude: 19.7633, longitude: 96.0785, countryCode: "MM", difficulty: "hard" },
  { category: "capitals", name: "Vientiane", latitude: 17.9757, longitude: 102.6331, countryCode: "LA", difficulty: "hard" },
  { category: "capitals", name: "Phnom Penh", latitude: 11.5564, longitude: 104.9282, countryCode: "KH", difficulty: "medium" },
  { category: "capitals", name: "Taipei", latitude: 25.0330, longitude: 121.5654, countryCode: "TW", difficulty: "medium" },
  { category: "capitals", name: "Ulaanbaatar", latitude: 47.8864, longitude: 106.9057, countryCode: "MN", difficulty: "hard" },
  { category: "capitals", name: "Pyongyang", latitude: 39.0392, longitude: 125.7625, countryCode: "KP", difficulty: "medium" },
  { category: "capitals", name: "Tel Aviv", latitude: 32.0853, longitude: 34.7818, countryCode: "IL", difficulty: "easy" },
  { category: "capitals", name: "Amman", latitude: 31.9454, longitude: 35.9284, countryCode: "JO", difficulty: "medium" },
  { category: "capitals", name: "Beirut", latitude: 33.8938, longitude: 35.5018, countryCode: "LB", difficulty: "medium" },
  { category: "capitals", name: "Damascus", latitude: 33.5138, longitude: 36.2765, countryCode: "SY", difficulty: "medium" },
  { category: "capitals", name: "Baghdad", latitude: 33.3152, longitude: 44.3661, countryCode: "IQ", difficulty: "medium" },
  { category: "capitals", name: "Tehran", latitude: 35.6892, longitude: 51.3890, countryCode: "IR", difficulty: "medium" },
  { category: "capitals", name: "Riyadh", latitude: 24.7136, longitude: 46.6753, countryCode: "SA", difficulty: "medium" },
  { category: "capitals", name: "Abu Dhabi", latitude: 24.4539, longitude: 54.3773, countryCode: "AE", difficulty: "medium" },
  { category: "capitals", name: "Doha", latitude: 25.2854, longitude: 51.5310, countryCode: "QA", difficulty: "medium" },
  { category: "capitals", name: "Kuwait City", latitude: 29.3759, longitude: 47.9774, countryCode: "KW", difficulty: "medium" },
  { category: "capitals", name: "Muscat", latitude: 23.5880, longitude: 58.3829, countryCode: "OM", difficulty: "hard" },
  { category: "capitals", name: "Manama", latitude: 26.2285, longitude: 50.5860, countryCode: "BH", difficulty: "hard" },
  { category: "capitals", name: "Sanaa", latitude: 15.3694, longitude: 44.1910, countryCode: "YE", difficulty: "hard" },
  { category: "capitals", name: "Rabat", latitude: 34.0209, longitude: -6.8416, countryCode: "MA", difficulty: "medium" },
  { category: "capitals", name: "Algiers", latitude: 36.7538, longitude: 3.0588, countryCode: "DZ", difficulty: "medium" },
  { category: "capitals", name: "Tunis", latitude: 36.8065, longitude: 10.1815, countryCode: "TN", difficulty: "medium" },
  { category: "capitals", name: "Tripoli", latitude: 32.8872, longitude: 13.1913, countryCode: "LY", difficulty: "medium" },
  { category: "capitals", name: "Khartoum", latitude: 15.5007, longitude: 32.5599, countryCode: "SD", difficulty: "hard" },
  { category: "capitals", name: "Addis Ababa", latitude: 9.0320, longitude: 38.7465, countryCode: "ET", difficulty: "medium" },
  { category: "capitals", name: "Mogadishu", latitude: 2.0469, longitude: 45.3182, countryCode: "SO", difficulty: "hard" },
  { category: "capitals", name: "Kampala", latitude: 0.3476, longitude: 32.5825, countryCode: "UG", difficulty: "hard" },
  { category: "capitals", name: "Kigali", latitude: -1.9403, longitude: 29.8739, countryCode: "RW", difficulty: "hard" },
  { category: "capitals", name: "Dar es Salaam", latitude: -6.7924, longitude: 39.2083, countryCode: "TZ", difficulty: "hard" },
  { category: "capitals", name: "Lusaka", latitude: -15.3875, longitude: 28.3228, countryCode: "ZM", difficulty: "hard" },
  { category: "capitals", name: "Harare", latitude: -17.8292, longitude: 31.0522, countryCode: "ZW", difficulty: "hard" },
  { category: "capitals", name: "Maputo", latitude: -25.9692, longitude: 32.5732, countryCode: "MZ", difficulty: "hard" },
  { category: "capitals", name: "Luanda", latitude: -8.8390, longitude: 13.2894, countryCode: "AO", difficulty: "hard" },
  { category: "capitals", name: "Kinshasa", latitude: -4.4419, longitude: 15.2663, countryCode: "CD", difficulty: "hard" },
  { category: "capitals", name: "Brazzaville", latitude: -4.2634, longitude: 15.2429, countryCode: "CG", difficulty: "hard" },
  { category: "capitals", name: "Lagos", latitude: 6.5244, longitude: 3.3792, countryCode: "NG", difficulty: "medium" },
  { category: "capitals", name: "Accra", latitude: 5.6037, longitude: -0.1870, countryCode: "GH", difficulty: "hard" },
  { category: "capitals", name: "Dakar", latitude: 14.7167, longitude: -17.4677, countryCode: "SN", difficulty: "hard" },
  { category: "capitals", name: "Nouakchott", latitude: 18.0735, longitude: -15.9582, countryCode: "MR", difficulty: "hard" },
  { category: "capitals", name: "Bamako", latitude: 12.6392, longitude: -8.0029, countryCode: "ML", difficulty: "hard" },
  { category: "capitals", name: "Niamey", latitude: 13.5116, longitude: 2.1254, countryCode: "NE", difficulty: "hard" },
  { category: "capitals", name: "Ouagadougou", latitude: 12.3714, longitude: -1.5197, countryCode: "BF", difficulty: "hard" },
  { category: "capitals", name: "Abidjan", latitude: 5.3600, longitude: -4.0083, countryCode: "CI", difficulty: "hard" },
  { category: "capitals", name: "Monrovia", latitude: 6.2907, longitude: -10.7605, countryCode: "LR", difficulty: "hard" },
  { category: "capitals", name: "Freetown", latitude: 8.4657, longitude: -13.2317, countryCode: "SL", difficulty: "hard" },
  { category: "capitals", name: "Conakry", latitude: 9.6412, longitude: -13.5784, countryCode: "GN", difficulty: "hard" },
  { category: "capitals", name: "Bissau", latitude: 11.8636, longitude: -15.5977, countryCode: "GW", difficulty: "hard" },
  { category: "capitals", name: "Praia", latitude: 14.9331, longitude: -23.5133, countryCode: "CV", difficulty: "hard" },
  { category: "capitals", name: "Banjul", latitude: 13.4549, longitude: -16.5790, countryCode: "GM", difficulty: "hard" },
  { category: "capitals", name: "Lome", latitude: 6.1725, longitude: 1.2314, countryCode: "TG", difficulty: "hard" },
  { category: "capitals", name: "Porto-Novo", latitude: 6.4969, longitude: 2.6289, countryCode: "BJ", difficulty: "hard" },
  { category: "capitals", name: "Yaounde", latitude: 3.8480, longitude: 11.5021, countryCode: "CM", difficulty: "hard" },
  { category: "capitals", name: "Libreville", latitude: 0.4162, longitude: 9.4673, countryCode: "GA", difficulty: "hard" },
  { category: "capitals", name: "Malabo", latitude: 3.7504, longitude: 8.7371, countryCode: "GQ", difficulty: "hard" },
  { category: "capitals", name: "Bangui", latitude: 4.3947, longitude: 18.5582, countryCode: "CF", difficulty: "hard" },
  { category: "capitals", name: "Ndjamena", latitude: 12.1348, longitude: 15.0557, countryCode: "TD", difficulty: "hard" },
  { category: "capitals", name: "Antananarivo", latitude: -18.8792, longitude: 47.5079, countryCode: "MG", difficulty: "hard" },
  { category: "capitals", name: "Port Louis", latitude: -20.1609, longitude: 57.5012, countryCode: "MU", difficulty: "hard" },
  { category: "capitals", name: "Victoria", latitude: -4.6191, longitude: 55.4513, countryCode: "SC", difficulty: "hard" },
  { category: "capitals", name: "Moroni", latitude: -11.7172, longitude: 43.2473, countryCode: "KM", difficulty: "hard" },
  { category: "capitals", name: "Gaborone", latitude: -24.6282, longitude: 25.9231, countryCode: "BW", difficulty: "hard" },
  { category: "capitals", name: "Windhoek", latitude: -22.5609, longitude: 17.0658, countryCode: "NA", difficulty: "hard" },
  { category: "capitals", name: "Maseru", latitude: -29.3151, longitude: 27.4869, countryCode: "LS", difficulty: "hard" },
  { category: "capitals", name: "Mbabane", latitude: -26.3054, longitude: 31.1367, countryCode: "SZ", difficulty: "hard" },
  { category: "capitals", name: "Guatemala City", latitude: 14.6349, longitude: -90.5069, countryCode: "GT", difficulty: "medium" },
  { category: "capitals", name: "San Salvador", latitude: 13.6929, longitude: -89.2182, countryCode: "SV", difficulty: "hard" },
  { category: "capitals", name: "Tegucigalpa", latitude: 14.0723, longitude: -87.1921, countryCode: "HN", difficulty: "hard" },
  { category: "capitals", name: "Managua", latitude: 12.1149, longitude: -86.2362, countryCode: "NI", difficulty: "hard" },
  { category: "capitals", name: "San Jose", latitude: 9.9281, longitude: -84.0907, countryCode: "CR", difficulty: "hard" },
  { category: "capitals", name: "Panama City", latitude: 8.9824, longitude: -79.5199, countryCode: "PA", difficulty: "medium" },
  { category: "capitals", name: "Kingston", latitude: 17.9714, longitude: -76.7920, countryCode: "JM", difficulty: "medium" },
  { category: "capitals", name: "Port-au-Prince", latitude: 18.5944, longitude: -72.3074, countryCode: "HT", difficulty: "hard" },
  { category: "capitals", name: "Santo Domingo", latitude: 18.4861, longitude: -69.9312, countryCode: "DO", difficulty: "hard" },
  { category: "capitals", name: "Nassau", latitude: 25.0343, longitude: -77.3963, countryCode: "BS", difficulty: "hard" },
  { category: "capitals", name: "Port of Spain", latitude: 10.6596, longitude: -61.5086, countryCode: "TT", difficulty: "hard" },
  { category: "capitals", name: "Bridgetown", latitude: 13.0969, longitude: -59.6145, countryCode: "BB", difficulty: "hard" },
  { category: "capitals", name: "Quito", latitude: -0.1807, longitude: -78.4678, countryCode: "EC", difficulty: "medium" },
  { category: "capitals", name: "La Paz", latitude: -16.4897, longitude: -68.1193, countryCode: "BO", difficulty: "medium" },
  { category: "capitals", name: "Asuncion", latitude: -25.2637, longitude: -57.5759, countryCode: "PY", difficulty: "hard" },
  { category: "capitals", name: "Montevideo", latitude: -34.9011, longitude: -56.1645, countryCode: "UY", difficulty: "medium" },
  { category: "capitals", name: "Georgetown", latitude: 6.8013, longitude: -58.1551, countryCode: "GY", difficulty: "hard" },
  { category: "capitals", name: "Paramaribo", latitude: 5.8520, longitude: -55.2038, countryCode: "SR", difficulty: "hard" },
  { category: "capitals", name: "Suva", latitude: -18.1416, longitude: 178.4419, countryCode: "FJ", difficulty: "hard" },
  { category: "capitals", name: "Port Moresby", latitude: -9.4438, longitude: 147.1803, countryCode: "PG", difficulty: "hard" },
  { category: "capitals", name: "Apia", latitude: -13.8506, longitude: -171.7514, countryCode: "WS", difficulty: "hard" },
  { category: "capitals", name: "Honiara", latitude: -9.4456, longitude: 159.9729, countryCode: "SB", difficulty: "hard" },
  { category: "capitals", name: "Port Vila", latitude: -17.7334, longitude: 168.3220, countryCode: "VU", difficulty: "hard" },
  { category: "capitals", name: "Nuku'alofa", latitude: -21.2167, longitude: -175.2000, countryCode: "TO", difficulty: "hard" },
  { category: "capitals", name: "Funafuti", latitude: -8.5200, longitude: 179.1983, countryCode: "TV", difficulty: "hard" },
  { category: "capitals", name: "Tarawa", latitude: 1.4518, longitude: 172.9717, countryCode: "KI", difficulty: "hard" },
  { category: "capitals", name: "Majuro", latitude: 7.1164, longitude: 171.1858, countryCode: "MH", difficulty: "hard" },
  { category: "capitals", name: "Palikir", latitude: 6.9248, longitude: 158.1610, countryCode: "FM", difficulty: "hard" },
  { category: "capitals", name: "Ngerulmud", latitude: 7.5006, longitude: 134.6243, countryCode: "PW", difficulty: "hard" },
  { category: "capitals", name: "Yaren", latitude: -0.5466, longitude: 166.9210, countryCode: "NR", difficulty: "hard" },
  { category: "capitals", name: "Luxembourg", latitude: 49.6116, longitude: 6.1319, countryCode: "LU", difficulty: "medium" },
  { category: "capitals", name: "Monaco", latitude: 43.7384, longitude: 7.4246, countryCode: "MC", difficulty: "medium" },
  { category: "capitals", name: "San Marino", latitude: 43.9333, longitude: 12.4500, countryCode: "SM", difficulty: "hard" },
  { category: "capitals", name: "Vatican City", latitude: 41.9029, longitude: 12.4534, countryCode: "VA", difficulty: "medium" },
  { category: "capitals", name: "Andorra la Vella", latitude: 42.5063, longitude: 1.5218, countryCode: "AD", difficulty: "hard" },
  { category: "capitals", name: "Vaduz", latitude: 47.1410, longitude: 9.5209, countryCode: "LI", difficulty: "hard" },
  { category: "capitals", name: "Valletta", latitude: 35.8997, longitude: 14.5146, countryCode: "MT", difficulty: "hard" },
  { category: "capitals", name: "Nicosia", latitude: 35.1856, longitude: 33.3823, countryCode: "CY", difficulty: "medium" },
  { category: "capitals", name: "Belmopan", latitude: 17.2510, longitude: -88.7590, countryCode: "BZ", difficulty: "hard" },
  { category: "capitals", name: "Djibouti", latitude: 11.5886, longitude: 43.1456, countryCode: "DJ", difficulty: "hard" },
  { category: "capitals", name: "Asmara", latitude: 15.3229, longitude: 38.9251, countryCode: "ER", difficulty: "hard" },
  { category: "capitals", name: "Juba", latitude: 4.8594, longitude: 31.5713, countryCode: "SS", difficulty: "hard" },
  { category: "capitals", name: "Lilongwe", latitude: -13.9626, longitude: 33.7741, countryCode: "MW", difficulty: "hard" },
  { category: "capitals", name: "Bujumbura", latitude: -3.3614, longitude: 29.3599, countryCode: "BI", difficulty: "hard" },
  { category: "capitals", name: "Sao Tome", latitude: 0.3302, longitude: 6.7273, countryCode: "ST", difficulty: "hard" },
  { category: "capitals", name: "Abuja", latitude: 9.0765, longitude: 7.3986, countryCode: "NG", difficulty: "hard" },
  { category: "capitals", name: "Dodoma", latitude: -6.1630, longitude: 35.7516, countryCode: "TZ", difficulty: "hard" },
  { category: "capitals", name: "Yamoussoukro", latitude: 6.8276, longitude: -5.2893, countryCode: "CI", difficulty: "hard" },
];

// Famous Places (40 entries)
const famousPlaces: WorldLocationData[] = [
  { category: "famous-places", name: "Eiffelturm", latitude: 48.8584, longitude: 2.2945, countryCode: "FR", difficulty: "easy" },
  { category: "famous-places", name: "Kolosseum", latitude: 41.8902, longitude: 12.4922, countryCode: "IT", difficulty: "easy" },
  { category: "famous-places", name: "Taj Mahal", latitude: 27.1751, longitude: 78.0421, countryCode: "IN", difficulty: "easy" },
  { category: "famous-places", name: "Machu Picchu", latitude: -13.1631, longitude: -72.5450, countryCode: "PE", difficulty: "medium" },
  { category: "famous-places", name: "Pyramiden von Gizeh", latitude: 29.9792, longitude: 31.1342, countryCode: "EG", difficulty: "easy" },
  { category: "famous-places", name: "Chinesische Mauer", latitude: 40.4319, longitude: 116.5704, countryCode: "CN", difficulty: "easy" },
  { category: "famous-places", name: "Freiheitsstatue", latitude: 40.6892, longitude: -74.0445, countryCode: "US", difficulty: "easy" },
  { category: "famous-places", name: "Sydney Opera House", latitude: -33.8568, longitude: 151.2153, countryCode: "AU", difficulty: "easy" },
  { category: "famous-places", name: "Big Ben", latitude: 51.5007, longitude: -0.1246, countryCode: "GB", difficulty: "easy" },
  { category: "famous-places", name: "Akropolis", latitude: 37.9715, longitude: 23.7267, countryCode: "GR", difficulty: "easy" },
  { category: "famous-places", name: "Petra", latitude: 30.3285, longitude: 35.4444, countryCode: "JO", difficulty: "medium" },
  { category: "famous-places", name: "Angkor Wat", latitude: 13.4125, longitude: 103.8670, countryCode: "KH", difficulty: "medium" },
  { category: "famous-places", name: "Christ the Redeemer", latitude: -22.9519, longitude: -43.2105, countryCode: "BR", difficulty: "easy" },
  { category: "famous-places", name: "Stonehenge", latitude: 51.1789, longitude: -1.8262, countryCode: "GB", difficulty: "medium" },
  { category: "famous-places", name: "Sagrada Familia", latitude: 41.4036, longitude: 2.1744, countryCode: "ES", difficulty: "medium" },
  { category: "famous-places", name: "Burj Khalifa", latitude: 25.1972, longitude: 55.2744, countryCode: "AE", difficulty: "easy" },
  { category: "famous-places", name: "Golden Gate Bridge", latitude: 37.8199, longitude: -122.4783, countryCode: "US", difficulty: "easy" },
  { category: "famous-places", name: "Neuschwanstein", latitude: 47.5576, longitude: 10.7498, countryCode: "DE", difficulty: "medium" },
  { category: "famous-places", name: "Brandenburger Tor", latitude: 52.5163, longitude: 13.3777, countryCode: "DE", difficulty: "easy" },
  { category: "famous-places", name: "Hagia Sophia", latitude: 41.0086, longitude: 28.9802, countryCode: "TR", difficulty: "medium" },
  { category: "famous-places", name: "Kreml", latitude: 55.7520, longitude: 37.6175, countryCode: "RU", difficulty: "easy" },
  { category: "famous-places", name: "Verbotene Stadt", latitude: 39.9163, longitude: 116.3972, countryCode: "CN", difficulty: "medium" },
  { category: "famous-places", name: "Grand Canyon", latitude: 36.1069, longitude: -112.1129, countryCode: "US", difficulty: "medium" },
  { category: "famous-places", name: "Niagara Falls", latitude: 43.0962, longitude: -79.0377, countryCode: "US", difficulty: "medium" },
  { category: "famous-places", name: "Victoria Falls", latitude: -17.9243, longitude: 25.8572, countryCode: "ZW", difficulty: "hard" },
  { category: "famous-places", name: "Uluru / Ayers Rock", latitude: -25.3444, longitude: 131.0369, countryCode: "AU", difficulty: "medium" },
  { category: "famous-places", name: "Chichen Itza", latitude: 20.6843, longitude: -88.5678, countryCode: "MX", difficulty: "medium" },
  { category: "famous-places", name: "Louvre", latitude: 48.8606, longitude: 2.3376, countryCode: "FR", difficulty: "easy" },
  { category: "famous-places", name: "Tower of London", latitude: 51.5081, longitude: -0.0759, countryCode: "GB", difficulty: "medium" },
  { category: "famous-places", name: "Alhambra", latitude: 37.1760, longitude: -3.5881, countryCode: "ES", difficulty: "medium" },
  { category: "famous-places", name: "Mount Rushmore", latitude: 43.8791, longitude: -103.4591, countryCode: "US", difficulty: "medium" },
  { category: "famous-places", name: "Empire State Building", latitude: 40.7484, longitude: -73.9857, countryCode: "US", difficulty: "easy" },
  { category: "famous-places", name: "Buckingham Palace", latitude: 51.5014, longitude: -0.1419, countryCode: "GB", difficulty: "easy" },
  { category: "famous-places", name: "Vatican Museums", latitude: 41.9065, longitude: 12.4536, countryCode: "VA", difficulty: "medium" },
  { category: "famous-places", name: "Schloss Versailles", latitude: 48.8049, longitude: 2.1204, countryCode: "FR", difficulty: "medium" },
  { category: "famous-places", name: "Tower Bridge", latitude: 51.5055, longitude: -0.0754, countryCode: "GB", difficulty: "easy" },
  { category: "famous-places", name: "Leaning Tower of Pisa", latitude: 43.7230, longitude: 10.3966, countryCode: "IT", difficulty: "easy" },
  { category: "famous-places", name: "Sensoji Temple", latitude: 35.7148, longitude: 139.7967, countryCode: "JP", difficulty: "medium" },
  { category: "famous-places", name: "Marina Bay Sands", latitude: 1.2834, longitude: 103.8607, countryCode: "SG", difficulty: "medium" },
  { category: "famous-places", name: "Santorini", latitude: 36.3932, longitude: 25.4615, countryCode: "GR", difficulty: "medium" },
];

// UNESCO World Heritage Sites (40 entries - mix of cultural and natural)
const unescoSites: WorldLocationData[] = [
  // Cultural Heritage
  { category: "unesco", name: "Angkor Wat", latitude: 13.4125, longitude: 103.8670, countryCode: "KH", difficulty: "easy" },
  { category: "unesco", name: "Akropolis von Athen", latitude: 37.9715, longitude: 23.7267, countryCode: "GR", difficulty: "easy" },
  { category: "unesco", name: "Petra", latitude: 30.3285, longitude: 35.4444, countryCode: "JO", difficulty: "easy" },
  { category: "unesco", name: "Machu Picchu", latitude: -13.1631, longitude: -72.5450, countryCode: "PE", difficulty: "easy" },
  { category: "unesco", name: "Taj Mahal", latitude: 27.1751, longitude: 78.0421, countryCode: "IN", difficulty: "easy" },
  { category: "unesco", name: "Chinesische Mauer", latitude: 40.4319, longitude: 116.5704, countryCode: "CN", difficulty: "easy" },
  { category: "unesco", name: "Kolosseum", latitude: 41.8902, longitude: 12.4922, countryCode: "IT", difficulty: "easy" },
  { category: "unesco", name: "Alhambra", latitude: 37.1760, longitude: -3.5881, countryCode: "ES", difficulty: "medium" },
  { category: "unesco", name: "Chichén Itzá", latitude: 20.6843, longitude: -88.5678, countryCode: "MX", difficulty: "medium" },
  { category: "unesco", name: "Stonehenge", latitude: 51.1789, longitude: -1.8262, countryCode: "GB", difficulty: "medium" },
  { category: "unesco", name: "Hagia Sophia", latitude: 41.0086, longitude: 28.9802, countryCode: "TR", difficulty: "medium" },
  { category: "unesco", name: "Schloss Versailles", latitude: 48.8049, longitude: 2.1204, countryCode: "FR", difficulty: "medium" },
  { category: "unesco", name: "Schloss Schönbrunn", latitude: 48.1845, longitude: 16.3122, countryCode: "AT", difficulty: "medium" },
  { category: "unesco", name: "Altstadt von Dubrovnik", latitude: 42.6507, longitude: 18.0944, countryCode: "HR", difficulty: "medium" },
  { category: "unesco", name: "Auschwitz-Birkenau", latitude: 50.0343, longitude: 19.1784, countryCode: "PL", difficulty: "medium" },
  { category: "unesco", name: "Borobudur", latitude: -7.6079, longitude: 110.2038, countryCode: "ID", difficulty: "hard" },
  { category: "unesco", name: "Timbuktu", latitude: 16.7735, longitude: -3.0074, countryCode: "ML", difficulty: "hard" },
  { category: "unesco", name: "Abu Simbel", latitude: 22.3372, longitude: 31.6258, countryCode: "EG", difficulty: "hard" },
  { category: "unesco", name: "Verbotene Stadt", latitude: 39.9163, longitude: 116.3972, countryCode: "CN", difficulty: "medium" },
  { category: "unesco", name: "Pompeji", latitude: 40.7508, longitude: 14.4869, countryCode: "IT", difficulty: "medium" },
  // Natural Heritage
  { category: "unesco", name: "Great Barrier Reef", latitude: -18.2871, longitude: 147.6992, countryCode: "AU", difficulty: "easy" },
  { category: "unesco", name: "Galápagos-Inseln", latitude: -0.9538, longitude: -90.9656, countryCode: "EC", difficulty: "easy" },
  { category: "unesco", name: "Yellowstone-Nationalpark", latitude: 44.4280, longitude: -110.5885, countryCode: "US", difficulty: "easy" },
  { category: "unesco", name: "Grand Canyon", latitude: 36.1069, longitude: -112.1129, countryCode: "US", difficulty: "easy" },
  { category: "unesco", name: "Victoriafälle", latitude: -17.9243, longitude: 25.8572, countryCode: "ZW", difficulty: "medium" },
  { category: "unesco", name: "Serengeti-Nationalpark", latitude: -2.3333, longitude: 34.8333, countryCode: "TZ", difficulty: "medium" },
  { category: "unesco", name: "Iguazú-Wasserfälle", latitude: -25.6953, longitude: -54.4367, countryCode: "AR", difficulty: "medium" },
  { category: "unesco", name: "Ha Long Bay", latitude: 20.9101, longitude: 107.1839, countryCode: "VN", difficulty: "medium" },
  { category: "unesco", name: "Plitvice-Seen", latitude: 44.8654, longitude: 15.5820, countryCode: "HR", difficulty: "hard" },
  { category: "unesco", name: "Komodo-Nationalpark", latitude: -8.5500, longitude: 119.4833, countryCode: "ID", difficulty: "hard" },
  { category: "unesco", name: "Baikalsee", latitude: 53.5587, longitude: 108.1650, countryCode: "RU", difficulty: "medium" },
  { category: "unesco", name: "Dolomiten", latitude: 46.4102, longitude: 11.8440, countryCode: "IT", difficulty: "medium" },
  { category: "unesco", name: "Schweizer Alpen Jungfrau-Aletsch", latitude: 46.5475, longitude: 8.0010, countryCode: "CH", difficulty: "medium" },
  { category: "unesco", name: "Table Mountain Nationalpark", latitude: -33.9625, longitude: 18.4039, countryCode: "ZA", difficulty: "medium" },
  // Mixed Heritage
  { category: "unesco", name: "Meteora", latitude: 39.7217, longitude: 21.6306, countryCode: "GR", difficulty: "medium" },
  { category: "unesco", name: "Mont-Saint-Michel", latitude: 48.6361, longitude: -1.5115, countryCode: "FR", difficulty: "medium" },
  { category: "unesco", name: "Kappadokien", latitude: 38.6431, longitude: 34.8289, countryCode: "TR", difficulty: "medium" },
  { category: "unesco", name: "Uluru-Kata Tjuta", latitude: -25.3444, longitude: 131.0369, countryCode: "AU", difficulty: "medium" },
  { category: "unesco", name: "Nazca-Linien", latitude: -14.7390, longitude: -75.1300, countryCode: "PE", difficulty: "hard" },
  { category: "unesco", name: "Tikal", latitude: 17.2220, longitude: -89.6237, countryCode: "GT", difficulty: "hard" },
];

// International Airports (40 entries - major global hubs)
const internationalAirports: WorldLocationData[] = [
  // Mega Hubs (Top 10 by passenger traffic)
  { category: "airports", name: "Dubai International (DXB)", latitude: 25.2532, longitude: 55.3657, countryCode: "AE", difficulty: "easy" },
  { category: "airports", name: "Hartsfield-Jackson Atlanta (ATL)", latitude: 33.6407, longitude: -84.4277, countryCode: "US", difficulty: "medium" },
  { category: "airports", name: "London Heathrow (LHR)", latitude: 51.4700, longitude: -0.4543, countryCode: "GB", difficulty: "easy" },
  { category: "airports", name: "Tokyo Haneda (HND)", latitude: 35.5494, longitude: 139.7798, countryCode: "JP", difficulty: "medium" },
  { category: "airports", name: "Dallas/Fort Worth (DFW)", latitude: 32.8998, longitude: -97.0403, countryCode: "US", difficulty: "medium" },
  { category: "airports", name: "Istanbul Airport (IST)", latitude: 41.2608, longitude: 28.7418, countryCode: "TR", difficulty: "medium" },
  { category: "airports", name: "Denver International (DEN)", latitude: 39.8561, longitude: -104.6737, countryCode: "US", difficulty: "hard" },
  { category: "airports", name: "Los Angeles International (LAX)", latitude: 33.9416, longitude: -118.4085, countryCode: "US", difficulty: "easy" },
  { category: "airports", name: "Chicago O'Hare (ORD)", latitude: 41.9742, longitude: -87.9073, countryCode: "US", difficulty: "medium" },
  { category: "airports", name: "Paris Charles de Gaulle (CDG)", latitude: 49.0097, longitude: 2.5479, countryCode: "FR", difficulty: "easy" },
  // Major International Hubs
  { category: "airports", name: "Singapore Changi (SIN)", latitude: 1.3644, longitude: 103.9915, countryCode: "SG", difficulty: "easy" },
  { category: "airports", name: "Amsterdam Schiphol (AMS)", latitude: 52.3105, longitude: 4.7683, countryCode: "NL", difficulty: "easy" },
  { category: "airports", name: "Hong Kong International (HKG)", latitude: 22.3080, longitude: 113.9185, countryCode: "HK", difficulty: "easy" },
  { category: "airports", name: "Frankfurt am Main (FRA)", latitude: 50.0379, longitude: 8.5622, countryCode: "DE", difficulty: "easy" },
  { category: "airports", name: "New York JFK (JFK)", latitude: 40.6413, longitude: -73.7781, countryCode: "US", difficulty: "easy" },
  { category: "airports", name: "Seoul Incheon (ICN)", latitude: 37.4602, longitude: 126.4407, countryCode: "KR", difficulty: "medium" },
  { category: "airports", name: "Beijing Capital (PEK)", latitude: 40.0799, longitude: 116.6031, countryCode: "CN", difficulty: "medium" },
  { category: "airports", name: "Madrid Barajas (MAD)", latitude: 40.4983, longitude: -3.5676, countryCode: "ES", difficulty: "medium" },
  { category: "airports", name: "Barcelona El Prat (BCN)", latitude: 41.2974, longitude: 2.0833, countryCode: "ES", difficulty: "medium" },
  { category: "airports", name: "Munich Airport (MUC)", latitude: 48.3537, longitude: 11.7750, countryCode: "DE", difficulty: "medium" },
  // Regional Hubs
  { category: "airports", name: "Sydney Kingsford Smith (SYD)", latitude: -33.9399, longitude: 151.1753, countryCode: "AU", difficulty: "medium" },
  { category: "airports", name: "Toronto Pearson (YYZ)", latitude: 43.6777, longitude: -79.6248, countryCode: "CA", difficulty: "medium" },
  { category: "airports", name: "São Paulo Guarulhos (GRU)", latitude: -23.4356, longitude: -46.4731, countryCode: "BR", difficulty: "hard" },
  { category: "airports", name: "Doha Hamad (DOH)", latitude: 25.2731, longitude: 51.6081, countryCode: "QA", difficulty: "medium" },
  { category: "airports", name: "Abu Dhabi International (AUH)", latitude: 24.4330, longitude: 54.6511, countryCode: "AE", difficulty: "hard" },
  { category: "airports", name: "Zürich Flughafen (ZRH)", latitude: 47.4582, longitude: 8.5555, countryCode: "CH", difficulty: "medium" },
  { category: "airports", name: "Wien-Schwechat (VIE)", latitude: 48.1103, longitude: 16.5697, countryCode: "AT", difficulty: "medium" },
  { category: "airports", name: "Copenhagen Kastrup (CPH)", latitude: 55.6180, longitude: 12.6508, countryCode: "DK", difficulty: "hard" },
  { category: "airports", name: "Bangkok Suvarnabhumi (BKK)", latitude: 13.6900, longitude: 100.7501, countryCode: "TH", difficulty: "medium" },
  { category: "airports", name: "Kuala Lumpur International (KUL)", latitude: 2.7456, longitude: 101.7072, countryCode: "MY", difficulty: "hard" },
  // Well-known Airports
  { category: "airports", name: "Moskau Scheremetjewo (SVO)", latitude: 55.9726, longitude: 37.4146, countryCode: "RU", difficulty: "hard" },
  { category: "airports", name: "Johannesburg O.R. Tambo (JNB)", latitude: -26.1367, longitude: 28.2411, countryCode: "ZA", difficulty: "hard" },
  { category: "airports", name: "Dubai Al Maktoum (DWC)", latitude: 24.8962, longitude: 55.1614, countryCode: "AE", difficulty: "hard" },
  { category: "airports", name: "Mexico City (MEX)", latitude: 19.4363, longitude: -99.0721, countryCode: "MX", difficulty: "medium" },
  { category: "airports", name: "Miami International (MIA)", latitude: 25.7932, longitude: -80.2906, countryCode: "US", difficulty: "medium" },
  { category: "airports", name: "San Francisco International (SFO)", latitude: 37.6213, longitude: -122.3790, countryCode: "US", difficulty: "medium" },
  { category: "airports", name: "Rom Fiumicino (FCO)", latitude: 41.8003, longitude: 12.2389, countryCode: "IT", difficulty: "medium" },
  { category: "airports", name: "London Gatwick (LGW)", latitude: 51.1537, longitude: -0.1821, countryCode: "GB", difficulty: "medium" },
  { category: "airports", name: "Brüssel Zaventem (BRU)", latitude: 50.9014, longitude: 4.4844, countryCode: "BE", difficulty: "hard" },
  { category: "airports", name: "Dublin Airport (DUB)", latitude: 53.4264, longitude: -6.2499, countryCode: "IE", difficulty: "hard" },
];

async function seed() {
  console.log("Starting seed for world locations...");

  const now = new Date();

  // Combine all locations
  const allLocations = [...highestMountains, ...worldCapitals, ...famousPlaces, ...unescoSites, ...internationalAirports];

  console.log(`Total locations to insert: ${allLocations.length}`);
  console.log(`- Highest Mountains: ${highestMountains.length}`);
  console.log(`- World Capitals: ${worldCapitals.length}`);
  console.log(`- Famous Places: ${famousPlaces.length}`);
  console.log(`- UNESCO World Heritage: ${unescoSites.length}`);
  console.log(`- International Airports: ${internationalAirports.length}`);

  // Insert in batches to avoid issues
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < allLocations.length; i += batchSize) {
    const batch = allLocations.slice(i, i + batchSize);

    const values = batch.map((loc) => ({
      id: nanoid(),
      category: loc.category,
      name: loc.name,
      latitude: loc.latitude,
      longitude: loc.longitude,
      countryCode: loc.countryCode || null,
      additionalInfo: loc.additionalInfo || null,
      difficulty: loc.difficulty || "medium",
      createdAt: now,
    }));

    await db.insert(worldLocations).values(values);
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${allLocations.length} locations...`);
  }

  console.log("\nSeed completed successfully!");
  console.log(`Inserted ${inserted} world locations.`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
