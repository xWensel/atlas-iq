/*
 * Atlas IQ - Modo Extendido: rondas propias de batallas, eventos y apodos (estilo de las rondas "pista" del original).
 * Entrada: [pistaEn, pistaEs, respuestaEn, respuestaEs, lat, lon, datoEn, datoEs]
 */
window.AIQ = window.AIQ || {};
(function (A) {
  A.HISTORY = [
    { id: "battles", kind: "battle", name: { en: "Famous Battles", es: "Batallas famosas" }, seconds: 12, scaleKm: 900, pool: [
      ["Battle of Waterloo (1815)", "Batalla de Waterloo (1815)", "Waterloo, Belgium", "Waterloo, Bélgica", 50.680, 4.412, "Napoleon's final defeat ended his rule of France.", "La derrota final de Napoleón puso fin a su mandato en Francia."],
      ["Battle of Hastings (1066)", "Batalla de Hastings (1066)", "Battle, England", "Battle, Inglaterra", 50.912, 0.487, "William of Normandy's victory led to the Norman conquest of England.", "La victoria de Guillermo de Normandía dio paso a la conquista normanda de Inglaterra."],
      ["Battle of Gettysburg (1863)", "Batalla de Gettysburg (1863)", "Gettysburg, USA", "Gettysburg, EE. UU.", 39.811, -77.225, "It was a turning point of the American Civil War.", "Fue un punto de inflexión de la guerra de Secesión estadounidense."],
      ["Battle of Marathon (490 BC)", "Batalla de Maratón (490 a. C.)", "Marathon, Greece", "Maratón, Grecia", 38.117, 23.965, "The legend of this battle inspired the modern marathon race.", "La leyenda de esta batalla inspiró la carrera del maratón moderno."],
      ["Battle of Trafalgar (1805)", "Batalla de Trafalgar (1805)", "Cape Trafalgar, Spain", "Cabo de Trafalgar, España", 36.181, -6.030, "Admiral Nelson won the battle but was killed in it.", "El almirante Nelson ganó la batalla pero murió en ella."],
      ["Battle of Stalingrad (1942–43)", "Batalla de Stalingrado (1942–43)", "Volgograd, Russia", "Volgogrado, Rusia", 48.708, 44.514, "It was one of the bloodiest battles in history.", "Fue una de las batallas más sangrientas de la historia."],
      ["Battle of Thermopylae (480 BC)", "Batalla de las Termópilas (480 a. C.)", "Thermopylae, Greece", "Termópilas, Grecia", 38.796, 22.536, "Leonidas and his Spartans held a narrow pass against a huge Persian army.", "Leónidas y sus espartanos defendieron un estrecho paso frente a un enorme ejército persa."],
      ["Battle of Agincourt (1415)", "Batalla de Azincourt (1415)", "Azincourt, France", "Azincourt, Francia", 50.463, 2.141, "English longbowmen defeated a much larger French army.", "Los arqueros ingleses derrotaron a un ejército francés mucho mayor."],
      ["Battle of Little Bighorn (1876)", "Batalla de Little Bighorn (1876)", "Montana, USA", "Montana, EE. UU.", 45.567, -107.428, "It is also known as Custer's Last Stand.", "También se conoce como la última resistencia de Custer."],
      ["Battle of Yorktown (1781)", "Batalla de Yorktown (1781)", "Yorktown, USA", "Yorktown, EE. UU.", 37.238, -76.510, "The victory effectively ended major fighting in the American Revolutionary War.", "La victoria puso fin, en la práctica, a los grandes combates de la guerra de Independencia de EE. UU."],
      ["Battle of Ayacucho (1824)", "Batalla de Ayacucho (1824)", "Ayacucho, Peru", "Ayacucho, Perú", -13.070, -74.120, "It sealed the end of Spanish rule in South America.", "Selló el fin del dominio español en Sudamérica."],
      ["Battle of Boyacá (1819)", "Batalla de Boyacá (1819)", "Boyacá, Colombia", "Boyacá, Colombia", 5.452, -73.448, "Bolívar's victory here opened the way to independence for Colombia.", "La victoria de Bolívar abrió el camino a la independencia de Colombia."],
    ]},
    { id: "events", kind: "event", name: { en: "Events That Shaped History", es: "Eventos que cambiaron la historia" }, seconds: 12, scaleKm: 900, pool: [
      ["Fall of the Berlin Wall (1989)", "Caída del Muro de Berlín (1989)", "Berlin, Germany", "Berlín, Alemania", 52.516, 13.378, "The wall had divided the city for 28 years.", "El muro había dividido la ciudad durante 28 años."],
      ["First powered airplane flight (1903)", "Primer vuelo motorizado (1903)", "Kitty Hawk, USA", "Kitty Hawk, EE. UU.", 36.068, -75.702, "The Wright brothers' first flight lasted just 12 seconds.", "El primer vuelo de los hermanos Wright duró solo 12 segundos."],
      ["Chernobyl nuclear disaster (1986)", "Desastre nuclear de Chernóbil (1986)", "Chernobyl, Ukraine", "Chernóbil, Ucrania", 51.389, 30.099, "It is considered the worst nuclear accident in history.", "Se considera el peor accidente nuclear de la historia."],
      ["Storming of the Bastille (1789)", "Toma de la Bastilla (1789)", "Paris, France", "París, Francia", 48.853, 2.369, "It became a symbol of the French Revolution.", "Se convirtió en un símbolo de la Revolución francesa."],
      ["Declaration of Independence signed (1776)", "Firma de la Declaración de Independencia (1776)", "Philadelphia, USA", "Filadelfia, EE. UU.", 39.949, -75.150, "It was adopted in what is now Independence Hall.", "Se aprobó en el actual Independence Hall."],
      ["Eruption of Krakatoa (1883)", "Erupción del Krakatoa (1883)", "Krakatoa, Indonesia", "Krakatoa, Indonesia", -6.102, 105.423, "The explosion was heard thousands of kilometres away.", "La explosión se oyó a miles de kilómetros de distancia."],
      ["Sinking of the Titanic (1912)", "Hundimiento del Titanic (1912)", "North Atlantic Ocean", "Atlántico Norte", 41.730, -49.950, "The ship hit an iceberg on its maiden voyage.", "El barco chocó con un iceberg en su viaje inaugural."],
      ["Assassination of Archduke Franz Ferdinand (1914)", "Asesinato del archiduque Francisco Fernando (1914)", "Sarajevo, Bosnia and Herzegovina", "Sarajevo, Bosnia y Herzegovina", 43.858, 18.429, "It set off the chain of events leading to World War I.", "Desencadenó la serie de hechos que llevó a la Primera Guerra Mundial."],
      ["Discovery of Tutankhamun's tomb (1922)", "Descubrimiento de la tumba de Tutankamón (1922)", "Valley of the Kings, Egypt", "Valle de los Reyes, Egipto", 25.740, 32.601, "Howard Carter found it almost intact.", "Howard Carter la encontró casi intacta."],
      ["Columbus's first landfall (1492)", "Primer desembarco de Colón (1492)", "The Bahamas", "Bahamas", 24.050, -74.530, "Columbus believed he had reached Asia.", "Colón creyó haber llegado a Asia."],
      ["Great Fire of London (1666)", "Gran incendio de Londres (1666)", "London, England", "Londres, Inglaterra", 51.506, -0.086, "It began in a bakery on Pudding Lane.", "Empezó en una panadería de Pudding Lane."],
    ]},
    { id: "nicknames", kind: "clue", name: { en: "City Nicknames", es: "Apodos de ciudades" }, seconds: 10, scaleKm: 1200, pool: [
      ["\"The Big Apple\"", "«La Gran Manzana»", "New York, USA", "Nueva York, EE. UU.", 40.713, -74.006, "The nickname spread in the 1920s through horse-racing columns.", "El apodo se popularizó en los años veinte gracias a las crónicas de carreras de caballos."],
      ["\"The Eternal City\"", "«La Ciudad Eterna»", "Rome, Italy", "Roma, Italia", 41.903, 12.496, "Ancient poets called Rome eternal.", "Los poetas antiguos llamaban eterna a Roma."],
      ["\"The City of Light\"", "«La Ciudad de la Luz»", "Paris, France", "París, Francia", 48.857, 2.352, "It was among the first cities to have street lighting.", "Fue de las primeras ciudades con alumbrado público."],
      ["\"The Windy City\"", "«La Ciudad de los Vientos»", "Chicago, USA", "Chicago, EE. UU.", 41.878, -87.630, "The nickname may refer to its windy politicians as much as its weather.", "El apodo puede referirse tanto a su viento como a la verborrea de sus políticos."],
      ["\"The Pearl of the Orient\"", "«La Perla de Oriente»", "Hong Kong", "Hong Kong", 22.320, 114.170, "Its skyline and harbour inspired the nickname.", "Su perfil urbano y su bahía inspiraron el apodo."],
      ["\"The Emerald City\"", "«La Ciudad Esmeralda»", "Seattle, USA", "Seattle, EE. UU.", 47.606, -122.332, "It is named for the evergreen forests around it.", "Debe su nombre a los bosques de hoja perenne que la rodean."],
      ["\"The Marvelous City\"", "«La Ciudad Maravillosa»", "Rio de Janeiro, Brazil", "Río de Janeiro, Brasil", -22.907, -43.173, "In Portuguese it is 'Cidade Maravilhosa'.", "En portugués es 'Cidade Maravilhosa'."],
      ["\"The Pink City\"", "«La Ciudad Rosa»", "Jaipur, India", "Jaipur, India", 26.912, 75.787, "Its old town was painted pink in 1876 to welcome a royal visitor.", "Su casco antiguo se pintó de rosa en 1876 para recibir a un visitante real."],
      ["\"The Golden City\"", "«La Ciudad Dorada»", "Prague, Czechia", "Praga, Chequia", 50.075, 14.438, "It is also called the City of a Hundred Spires.", "También se la llama la Ciudad de las Cien Torres."],
      ["\"The Blue City\"", "«La Ciudad Azul»", "Chefchaouen, Morocco", "Chefchaouen, Marruecos", 35.169, -5.269, "Its old town is famous for its blue-washed walls.", "Su casco antiguo es famoso por sus muros pintados de azul."],
      ["\"The Mile-High City\"", "«La Ciudad de la Milla de Altura»", "Denver, USA", "Denver, EE. UU.", 39.739, -104.990, "It sits exactly one mile above sea level.", "Está situada a una milla exacta sobre el nivel del mar."],
      ["\"The City of Eternal Spring\"", "«La Ciudad de la Eterna Primavera»", "Medellín, Colombia", "Medellín, Colombia", 6.244, -75.581, "Its mild climate stays spring-like all year.", "Su clima suave se mantiene primaveral todo el año."],
    ]},
  ];
})(window.AIQ);
