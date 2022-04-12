const probabilityOfTurning = 0.1;
const turningSpeed = 1;
const energyFactor = 2;
const screenSize = 512;
const herbivorePopulation = 750;
const carnivorePopulation = 10;
const plantPopulation = 1000;
const plantRespawn = {
    populationFactor: 0.3,
    respawnAmountFactor: 0.05 
}

const evolutionProbability = 0.1;
const squareDetectionDistance = 500;

let plantRespawnOccursAmount = Math.round(plantPopulation * plantRespawn.populationFactor);
let plantRespawnAmount = Math.round(plantPopulation * plantRespawn.respawnAmountFactor);

let { init, Sprite, GameLoop, collides } = kontra
let { canvas } = init();

const getNeuralNet = () => {
    var net = [];
    for (let i = 0; i < 3; i++) {
        var netEntry = {
            offSet: Math.random(),
            weights: []
        }

        for (let j = 0; j < 4; j++) {
            netEntry.weights.push(Math.random());
        }

        net.push(netEntry);
    }

    return net;
}

const evolveNeuralNet = (net) => {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) {
            if(Math.random() <= evolutionProbability){
                net[i].weights[j] = Math.random();
            }
        }
    }

    return net;
}

const calculateActionPoints = (quadValue, netEntry) => {
    var output = netEntry.offSet;
    for (let j = 0; j < 4; j++) {
        output += quadValue[j] * netEntry.weights[j];
    }
    return output;
}

const getNewEntity = (colour, speed, energy, nutritionalValue, breedingEnergy, energyLoss, x = null, y = null, net = null) => {
    if(x === null){
        x = (Math.random() * screenSize)
    }
    if(y === null){
        y = (Math.random() * screenSize)
    }
    if(net === null){
        net = getNeuralNet()
    }
    var sprite = Sprite({
        x: x,        // starting x,y position of the sprite
        y: y,
        color: colour,  // fill color of the sprite rectangle
        width: 5,     // width and height of the sprite rectangle
        height: 5,
        speed: speed,
        rotationInDegrees: Math.random() * 360,
        energy: energy,
        nutritionalValue: nutritionalValue,
        breedingEnergy: breedingEnergy,
        energyLoss: energyLoss,
        neuralNet: net
    });

    if(speed !== 0){
        setSpeedFromAngle(sprite);
    }
    

    return sprite;
}

const getRadiansFromDegrees = (degrees) =>{
    return degrees/180 * Math.PI;
}

const setSpeedFromAngle = (entity) => {
    var radians = getRadiansFromDegrees(entity.rotationInDegrees);
    entity.dx = Math.cos(radians) * entity.speed;
    entity.dy = Math.sin(radians) * entity.speed;
}

const getNewPlant = (x = null, y = null) => {
    return getNewEntity("green", 0, 100000, 50 * energyFactor, 0, 1);
}

const getNewHerbivore = (x = null, y = null, net = null) => {
    return getNewEntity("yellow", 0.4, 600 * energyFactor, 100 * energyFactor, 900 * energyFactor, 0.2, x, y, net);
}

const getNewCarnivore = (x = null, y = null, net = null) => {
    return getNewEntity("red", 0.6, 300 * energyFactor, 0, 600 * energyFactor, 0.75, x, y, net);
}

const setupInitialPopulation = (array, population, createFunc) => {
    for (let i = 0; i < population; i++) {
        array.push(createFunc());
    }
}

const breed = (entity, entityList, createFunct, newColour) => {
    var newEntity = createFunct(entity.x, entity.y, entity.neuralNet);
    newEntity.neuralNet = evolveNeuralNet(newEntity.neuralNet);
    newEntity.color = newColour;
    entityList.push(newEntity);
}

const updateEntity = (entity, listOfEdibles, myPopulationList, createFunct, newColour) => {
    entity.energy -= entity.energyLoss;
    if(entity.energy <= 0){
        removeElement(entity, myPopulationList);
        return;
    }

    if (entity.x > screenSize) {
        entity.x = 0;
    }
    if (entity.x < 0) {
        entity.x = screenSize;
    }
    if (entity.y > screenSize) {
        entity.y = 0;
    }
    if (entity.y < 0) {
        entity.y = screenSize;
    }

    var ediblesInQuadrants = [0,0,0,0];

    listOfEdibles.forEach(edible => {
        if(collides(edible, entity)){
            entity.energy += edible.nutritionalValue;
            if(entity.energy > entity.breedingEnergy){
                entity.energy = entity.energy / 2;
                breed(entity, myPopulationList, createFunct, newColour);
            }
            removeElement(edible, listOfEdibles);
        }
        else {
            var offsetX = edible.x - entity.x;
            var offsetY = edible.y - entity.y;
            var sqrMagnitude = offsetX * offsetX + offsetY * offsetY;
            if(squareDetectionDistance > sqrMagnitude){
                var magnitude = Math.sqrt(sqrMagnitude);
                var normalizeOffsetX = offsetX/magnitude;
                var normalizeOffsetY = offsetY/magnitude;
                var radians = getRadiansFromDegrees(entity.rotationInDegrees);
                var entityBearingNormalizedX = Math.cos(radians);
                var entityBearingNormalizedY = Math.sin(radians);
                var incrementIndex = 0;
                if(normalizeOffsetY * entityBearingNormalizedY < 0){
                    incrementIndex += 2;
                }
                if(normalizeOffsetX * entityBearingNormalizedX < 0){
                    incrementIndex++;
                }
                ediblesInQuadrants[incrementIndex]++;
            }
        }
    })

    var turnLeft = calculateActionPoints(ediblesInQuadrants, entity.neuralNet[0]);
    var turnRight = calculateActionPoints(ediblesInQuadrants, entity.neuralNet[1]);
    var moveForwards = calculateActionPoints(ediblesInQuadrants, entity.neuralNet[1]);

    if(turnLeft > turnRight && turnLeft > moveForwards){
        entity.rotationInDegrees -= turningSpeed;
        entity.dx = 0;
        entity.dy = 0;
    }
    else if(turnRight > turnLeft && turnRight > moveForwards){
        entity.rotationInDegrees += turningSpeed;
        entity.dx = 0;
        entity.dy = 0;
    } else{
        setSpeedFromAngle(entity);
    }

    entity.update();
}

const updatePlants = () => {
    if(plants.length < plantRespawnOccursAmount){
        setupInitialPopulation(plants, plantRespawnAmount, getNewPlant);
    }
}

function removeElement(element, array) {
    const indexOf = array.indexOf(element);
    if (indexOf > -1) {
        array.splice(indexOf, 1);
    }
}

var herbivores = [];
setupInitialPopulation(herbivores, herbivorePopulation, getNewHerbivore);
var carnivores = [];
setupInitialPopulation(carnivores, carnivorePopulation, getNewCarnivore);
var plants = [];
setupInitialPopulation(plants, plantPopulation, getNewPlant);


let loop = GameLoop({  // create the main game loop
    update: function () { // update the game state
        updatePlants();
        herbivores.forEach(herbivore => updateEntity(herbivore, plants, herbivores, getNewHerbivore, "#ffa805"));
        carnivores.forEach(carnivore => updateEntity(carnivore, herbivores, carnivores, getNewCarnivore, "#ff0055"));
    },
    render: function () { // render the game state
        plants.forEach(plant => plant.render());
        herbivores.forEach(herbivore => herbivore.render());
        carnivores.forEach(carnivore => carnivore.render());
    }
});

loop.start();  