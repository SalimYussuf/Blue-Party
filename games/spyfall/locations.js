// Spyfall Locations — each location has a name and a list of roles players might be assigned
const LOCATIONS = [
  { name: "Airport", roles: ["Pilot", "Flight Attendant", "Passenger", "Security Guard", "Air Traffic Controller", "Customs Officer", "Mechanic", "Ticket Agent"] },
  { name: "Bank", roles: ["Manager", "Teller", "Customer", "Security Guard", "Accountant", "Loan Officer", "Armored Car Driver", "Robber"] },
  { name: "Beach", roles: ["Lifeguard", "Surfer", "Tourist", "Ice Cream Vendor", "Beach Volleyball Player", "Photographer", "Fisherman", "Sunbather"] },
  { name: "Casino", roles: ["Dealer", "Pit Boss", "Player", "Security Guard", "Bartender", "Entertainer", "Waitress", "Cashier"] },
  { name: "Cathedral", roles: ["Priest", "Nun", "Tourist", "Choir Singer", "Beggar", "Organist", "Parishioner", "Wedding Planner"] },
  { name: "Circus", roles: ["Ringmaster", "Clown", "Acrobat", "Lion Tamer", "Magician", "Juggler", "Strongman", "Audience Member"] },
  { name: "Corporate Party", roles: ["CEO", "Intern", "DJ", "Bartender", "Accountant", "Secretary", "Manager", "Entertainer"] },
  { name: "Crusader Army", roles: ["Knight", "Squire", "Archer", "Monk", "Siege Engineer", "King", "Herald", "Spy"] },
  { name: "Day Spa", roles: ["Masseuse", "Receptionist", "Customer", "Yoga Instructor", "Dermatologist", "Manicurist", "Stylist", "Manager"] },
  { name: "Embassy", roles: ["Ambassador", "Security Guard", "Diplomat", "Translator", "Refugee", "Secretary", "Tourist", "Spy"] },
  { name: "Hospital", roles: ["Doctor", "Nurse", "Patient", "Surgeon", "Pharmacist", "Receptionist", "Intern", "Paramedic"] },
  { name: "Hotel", roles: ["Manager", "Bellboy", "Receptionist", "Guest", "Housekeeper", "Chef", "Doorman", "Concierge"] },
  { name: "Military Base", roles: ["General", "Soldier", "Medic", "Sniper", "Drill Sergeant", "Tank Commander", "Radio Operator", "Spy"] },
  { name: "Movie Studio", roles: ["Director", "Actor", "Camera Operator", "Producer", "Stunt Double", "Makeup Artist", "Sound Engineer", "Extra"] },
  { name: "Ocean Liner", roles: ["Captain", "Sailor", "Passenger", "Cook", "Entertainer", "Rich Passenger", "Mechanic", "Bartender"] },
  { name: "Passenger Train", roles: ["Conductor", "Engineer", "Passenger", "Restaurant Worker", "Stowaway", "Border Guard", "Porter", "Pickpocket"] },
  { name: "Pirate Ship", roles: ["Captain", "First Mate", "Navigator", "Cook", "Cabin Boy", "Gunner", "Lookout", "Prisoner"] },
  { name: "Polar Station", roles: ["Researcher", "Expedition Leader", "Meteorologist", "Biologist", "Radio Operator", "Geologist", "Medic", "Mechanic"] },
  { name: "Police Station", roles: ["Detective", "Officer", "Criminal", "Forensic Scientist", "Lawyer", "Receptionist", "Chief", "Janitor"] },
  { name: "Restaurant", roles: ["Head Chef", "Waiter", "Customer", "Sous Chef", "Food Critic", "Manager", "Hostess", "Dishwasher"] },
  { name: "School", roles: ["Teacher", "Student", "Principal", "Janitor", "Lunch Lady", "Secretary", "Librarian", "Coach"] },
  { name: "Service Station", roles: ["Mechanic", "Manager", "Attendant", "Customer", "Tow Truck Driver", "Car Washer", "Cashier", "Tire Specialist"] },
  { name: "Space Station", roles: ["Commander", "Scientist", "Engineer", "Pilot", "Medic", "Astronaut", "Communications Officer", "Alien"] },
  { name: "Submarine", roles: ["Captain", "Sonar Technician", "Navigator", "Engineer", "Cook", "Sailor", "Radio Operator", "Commander"] },
  { name: "Supermarket", roles: ["Manager", "Cashier", "Butcher", "Baker", "Customer", "Shelf Stocker", "Security Guard", "Janitor"] },
  { name: "Theater", roles: ["Director", "Actor", "Stagehand", "Audience Member", "Playwright", "Lighting Technician", "Usher", "Costume Designer"] },
  { name: "University", roles: ["Professor", "Student", "Dean", "Janitor", "Researcher", "Librarian", "TA", "Athlete"] },
  { name: "Vineyard", roles: ["Owner", "Winemaker", "Sommelier", "Tourist", "Grape Picker", "Chef", "Accountant", "Driver"] },
  { name: "Zoo", roles: ["Zookeeper", "Veterinarian", "Visitor", "Tour Guide", "Gift Shop Worker", "Animal Trainer", "Photographer", "Janitor"] },
  { name: "Amusement Park", roles: ["Ride Operator", "Mascot", "Visitor", "Food Vendor", "Technician", "Manager", "Security Guard", "Photographer"] },
];

function getRandomLocation() {
  return LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
}

function getAllLocationNames() {
  return LOCATIONS.map(l => l.name).sort();
}

module.exports = { LOCATIONS, getRandomLocation, getAllLocationNames };
