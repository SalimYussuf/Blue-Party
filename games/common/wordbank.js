const WORDS = [
  // Animals
  "Dog", "Cat", "Elephant", "Lion", "Tiger", "Giraffe", "Monkey", "Penguin", "Dolphin", "Whale",
  "Shark", "Octopus", "Snake", "Spider", "Butterfly", "Bee", "Ant", "Bird", "Eagle", "Owl",
  "Frog", "Turtle", "Rabbit", "Mouse", "Bear", "Wolf", "Fox", "Deer", "Horse", "Cow",
  "Pig", "Sheep", "Goat", "Chicken", "Duck", "Fish", "Crab", "Lobster", "Snail", "Worm",
  // Objects
  "Chair", "Table", "Bed", "Sofa", "Lamp", "Clock", "Mirror", "Window", "Door", "House",
  "Car", "Bicycle", "Train", "Airplane", "Boat", "Ship", "Bus", "Truck", "Helicopter", "Motorcycle",
  "Computer", "Phone", "Television", "Radio", "Camera", "Watch", "Glasses", "Book", "Pen", "Pencil",
  "Paper", "Scissors", "Knife", "Fork", "Spoon", "Plate", "Cup", "Bottle", "Box", "Bag",
  "Shoe", "Hat", "Shirt", "Pants", "Dress", "Coat", "Glove", "Sock", "Ring", "Necklace",
  // Food
  "Apple", "Banana", "Orange", "Grape", "Strawberry", "Watermelon", "Pineapple", "Mango", "Peach", "Cherry",
  "Tomato", "Potato", "Carrot", "Onion", "Garlic", "Broccoli", "Corn", "Pea", "Bean", "Mushroom",
  "Bread", "Cheese", "Milk", "Egg", "Meat", "Fish", "Chicken", "Beef", "Pork", "Bacon",
  "Pizza", "Burger", "Sandwich", "Hotdog", "Taco", "Sushi", "Pasta", "Noodle", "Soup", "Salad",
  "Cake", "Cookie", "Pie", "Ice Cream", "Chocolate", "Candy", "Donut", "Pancake", "Waffle", "Muffin",
  // Nature
  "Tree", "Flower", "Grass", "Leaf", "Branch", "Root", "Seed", "Plant", "Bush", "Forest",
  "Mountain", "Hill", "Valley", "River", "Lake", "Ocean", "Sea", "Beach", "Sand", "Rock",
  "Sun", "Moon", "Star", "Planet", "Sky", "Cloud", "Rain", "Snow", "Wind", "Storm",
  "Fire", "Water", "Earth", "Air", "Ice", "Island", "Desert", "Jungle", "Cave", "Waterfall",
  // Actions
  "Run", "Walk", "Jump", "Hop", "Skip", "Dance", "Sing", "Swim", "Dive", "Fly",
  "Eat", "Drink", "Sleep", "Dream", "Wake", "Read", "Write", "Draw", "Paint", "Play",
  "Work", "Study", "Learn", "Teach", "Talk", "Listen", "Look", "See", "Watch", "Hear",
  "Touch", "Feel", "Smell", "Taste", "Smile", "Laugh", "Cry", "Think", "Know", "Understand"
];

function getRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function getRandomWords(count) {
  const shuffled = [...WORDS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

module.exports = {
  WORDS,
  getRandomWord,
  getRandomWords
};
