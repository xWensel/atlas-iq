/*
 * Geolite - listas de origen de los modos Clasico "Eventos" y "Personajes" (titulos de la Wikipedia en ingles).
 * tools/build-extra.mjs resuelve cada uno en Wikidata: coordenadas, nombres en 6 idiomas, fecha, retrato,
 * y la fama (numero de Wikipedias con articulo) con la que se ordenan los niveles de dificultad.
 * Solo personajes con lugar de nacimiento conocido y eventos con ubicacion propia; nada de fundadores
 * religiosos, masacres ni genocidios.
 */
export const PEOPLE = [
  "Albert Einstein", "Isaac Newton", "Leonardo da Vinci", "Napoleon", "Cleopatra", "Mahatma Gandhi", "Nelson Mandela",
  "Frida Kahlo", "Pablo Picasso", "Miguel de Cervantes", "William Shakespeare", "Wolfgang Amadeus Mozart",
  "Ludwig van Beethoven", "Marie Curie", "Charles Darwin", "Galileo Galilei", "Christopher Columbus", "Ferdinand Magellan",
  "Simón Bolívar", "José de San Martín", "Che Guevara", "Confucius", "Genghis Khan", "Mao Zedong", "Abraham Lincoln",
  "George Washington", "Martin Luther King Jr.", "Elvis Presley", "Marilyn Monroe", "Charlie Chaplin", "Vincent van Gogh",
  "Rembrandt", "Salvador Dalí", "Antoni Gaudí", "Leo Tolstoy", "Fyodor Dostoevsky", "Pyotr Ilyich Tchaikovsky",
  "Alexander Pushkin", "Yuri Gagarin", "Neil Armstrong", "Amelia Earhart", "Nikola Tesla", "Thomas Edison", "Sigmund Freud",
  "Franz Kafka", "Johann Wolfgang von Goethe", "Johann Sebastian Bach", "Frédéric Chopin", "Nicolaus Copernicus",
  "Johannes Kepler", "Alexander the Great", "Julius Caesar", "Hannibal", "Joan of Arc", "Victor Hugo", "Jules Verne",
  "Marco Polo", "Dante Alighieri", "Michelangelo", "Raphael", "Antonio Vivaldi", "Giuseppe Verdi", "Giuseppe Garibaldi",
  "Ernest Hemingway", "Mark Twain", "Walt Disney", "Steve Jobs", "Gabriel García Márquez", "Pablo Neruda",
  "Jorge Luis Borges", "Pelé", "Diego Maradona", "Bob Marley", "Rabindranath Tagore", "Akira Kurosawa", "Hokusai",
  "Ho Chi Minh", "Mustafa Kemal Atatürk", "Saladin", "Ibn Battuta", "Avicenna", "Omar Khayyam", "Rumi", "Haile Selassie",
  "Kwame Nkrumah", "Wangari Maathai", "Diego Rivera", "Benito Juárez", "Emiliano Zapata", "James Cook", "Edmund Hillary",
  "Tenzing Norgay", "Roald Amundsen", "Hans Christian Andersen", "Alfred Nobel", "Jean Sibelius", "Edvard Grieg",
  "Henrik Ibsen", "Carl Linnaeus", "Søren Kierkegaard", "Winston Churchill", "Queen Victoria", "Elizabeth I",
  "Henry VIII", "Catherine the Great", "Peter the Great", "Vladimir Lenin", "Karl Marx", "Friedrich Nietzsche",
  "Immanuel Kant", "Aristotle", "Plato", "Archimedes", "Augustus", "Charlemagne", "Otto von Bismarck",
  "Florence Nightingale", "Anne Frank", "Coco Chanel", "Édith Piaf", "Louis Pasteur", "Claude Monet", "Auguste Rodin",
  "Eva Perón", "Carlos Gardel", "Fidel Castro", "José Martí", "Rubén Darío", "Gabriela Mistral", "Mario Vargas Llosa",
  "Octavio Paz", "Sor Juana Inés de la Cruz", "Túpac Amaru II", "Hernán Cortés", "Francisco Pizarro", "Vasco da Gama",
  "Fernando Pessoa", "Amália Rodrigues", "Eusébio", "Chinua Achebe", "Fela Kuti", "Desmond Tutu", "Gamal Abdel Nasser",
  "Anwar Sadat", "Naguib Mahfouz", "Umm Kulthum", "Kahlil Gibran", "Hafez", "Babur", "Akbar", "Shah Jahan",
  "Srinivasa Ramanujan", "Jawaharlal Nehru", "Mother Teresa", "Sun Yat-sen", "Bruce Lee", "Lu Xun", "Zheng He",
  "Qin Shi Huang", "Tokugawa Ieyasu", "Yukio Mishima", "Sejong the Great", "Yi Sun-sin", "José Rizal", "Don Bradman",
  "Ned Kelly", "Kate Sheppard", "Ernest Rutherford", "Leif Erikson", "Christopher Marlowe", "Jane Austen", "Charles Dickens",
  "Isambard Kingdom Brunel", "Alan Turing", "Ada Lovelace", "Stephen Hawking", "Richard Wagner", "Franz Schubert",
  "Johann Strauss II", "Gustav Klimt", "Wilhelm Conrad Röntgen", "Gregor Mendel", "Antonín Dvořák", "Béla Bartók",
  "Franz Liszt", "Harry Houdini", "Andy Warhol", "Louis Armstrong", "John Lennon", "Freddie Mercury", "Michael Jackson",
  "Ayrton Senna", "Juan Manuel Fangio", "Muhammad Ali", "Jesse Owens", "Babe Ruth", "Rosa Parks", "Harriet Tubman",
  "Frederick Douglass", "Benjamin Franklin", "Thomas Jefferson", "John F. Kennedy", "Theodore Roosevelt", "Sitting Bull",
  "Pocahontas", "Montezuma II", "Atahualpa", "Lautaro", "Bernardo O'Higgins", "José Gervasio Artigas", "Juan Domingo Perón",
  "Hugo Chávez",
];

export const EVENTS = [
  // batallas
  "Battle of Waterloo", "Battle of Hastings", "Battle of Gettysburg", "Battle of Marathon", "Battle of Trafalgar",
  "Battle of Stalingrad", "Battle of Thermopylae", "Battle of Agincourt", "Battle of the Little Bighorn", "Siege of Yorktown",
  "Battle of Ayacucho", "Battle of Boyacá", "Battle of Lepanto", "Battle of Salamis", "Battle of Gaugamela",
  "Battle of Cannae", "Battle of Tours", "Battle of Austerlitz", "Battle of Leipzig", "Battle of Borodino",
  "Battle of Verdun", "Battle of the Somme", "Gallipoli campaign", "Normandy landings", "Battle of Midway",
  "Attack on Pearl Harbor", "Battle of Kursk", "Siege of Leningrad", "Battle of Dien Bien Phu", "Battle of Isandlwana",
  "Battle of Adwa", "Battle of Plassey", "First Battle of Panipat", "Battle of Red Cliffs", "Battle of Talas",
  "Battle of Manzikert", "Fall of Constantinople", "Fall of Tenochtitlan", "Battle of Puebla", "Battle of the Alamo",
  "Battle of Chacabuco", "Battle of Maipú", "Battle of Pichincha", "Battle of Carabobo", "Battle of Junín",
  "Battle of Grunwald", "Battle of Vienna", "Battle of Poltava", "Battle of Blenheim", "Battle of Bunker Hill",
  "Battle of Antietam", "Battle of Okinawa", "Battle of Iwo Jima", "Second Battle of El Alamein", "Battle of Actium",
  "Battle of Alesia", "Battle of Hattin", "Battle of Covadonga", "Battle of Las Navas de Tolosa", "Battle of Kadesh",
  "Battle of Zama", "Battle of Culloden", "Battle of Balaclava", "Battle of Bosworth Field", "Battle of Stamford Bridge",
  "Battle of the Teutoburg Forest", "Battle of Mohács", "Battle of Tsushima", "Battle of Sekigahara", "Battle of Hakodate",
  "Battle of Bannockburn", "Battle of Kosovo", "Battle of Chaldiran", "Battle of Ain Jalut", "Battle of Legnano",
  "Battle of the Boyne", "Battle of Rocroi", "Battle of Pavia", "Battle of Jena–Auerstedt", "Battle of Solferino",
  "Battle of Sedan", "First Battle of the Marne", "Battle of Passchendaele", "Guadalcanal campaign", "Battle of the Bulge",
  "Battle of Inchon", "Battle of Vertières", "Battle of San Jacinto", "Battle of Tucumán", "Battle of Riachuelo",
  "Battle of Curupayty", "Battle of Arica",
  // sucesos
  "Fall of the Berlin Wall", "Chernobyl disaster", "Storming of the Bastille", "Sinking of the Titanic",
  "1883 eruption of Krakatoa", "Eruption of Mount Vesuvius in 79 AD", "Assassination of John F. Kennedy",
  "Assassination of Archduke Franz Ferdinand", "Great Fire of London", "1906 San Francisco earthquake",
  "2004 Indian Ocean earthquake and tsunami", "Tunguska event", "Fukushima nuclear accident", "Treaty of Versailles",
  "Treaty of Tordesillas", "Boston Tea Party", "Bhopal disaster", "Salt March", "Woodstock", "1755 Lisbon earthquake",
  "1985 Mexico City earthquake", "2010 Haiti earthquake", "1960 Valdivia earthquake", "1980 eruption of Mount St. Helens",
  "Deepwater Horizon oil spill", "Exxon Valdez oil spill", "Hindenburg disaster", "Great Chicago Fire", "Siege of Masada",
  "Congress of Vienna", "Yalta Conference", "Potsdam Conference", "Council of Trent", "Peace of Westphalia",
  "Treaty of Waitangi", "Easter Rising", "Bombing of Guernica", "Bombing of Dresden", "Siege of Sarajevo",
  "Bay of Pigs Invasion", "Minoan eruption", "2010 eruptions of Eyjafjallajökull", "1896 Summer Olympics",
  "1936 Summer Olympics", "1968 Summer Olympics", "1992 Summer Olympics", "Nuremberg trials", "First Council of Nicaea",
  "Congress of Tucumán", "Grito de Dolores", "Proclamation of the Republic (Brazil)",
  "Space Shuttle Challenger disaster", "1908 Messina earthquake", "1923 Great Kantō earthquake",
  "Great Hanshin earthquake", "1970 Ancash earthquake", "Armero tragedy", "1902 eruption of Mount Pelée",
  "1815 eruption of Mount Tambora", "Halifax Explosion", "Three Mile Island accident", "Torrey Canyon oil spill", "Aberfan disaster",
  "Munich air disaster", "Uruguayan Air Force Flight 571", "2010 Copiapó mining accident", "Tham Luang cave rescue",
  "Discovery of the tomb of Tutankhamun", "Treaty of Rome", "Maastricht Treaty", "Camp David Accords", "1911 Revolution",
];

/* coordenadas a mano cuando Wikidata no las tiene (titulo en ingles -> [lat, lon]) */
export const COORD_FIX = {
  "Frida Kahlo": [19.35, -99.1622],        // Coyoacan
  "Henrik Ibsen": [59.2096, 9.609],        // Skien
  "Ayrton Senna": [-23.5505, -46.6333],    // Sao Paulo
  "Salt March": [21.3269, 72.6234],        // Dandi, donde acabo la marcha
};
