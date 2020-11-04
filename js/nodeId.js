var example_input = {
    "0": {
        "id": "GND_1",
        "type": "REF",
        "value": [],
        "connect": ["line_2"]
    },
    "1": {
        "id": "line_2",
        "type": "W",
        "value": [],
        "connect": ["GND_1-0", "line_1 line_3"]
    },
    "2": {
        "id": "line_3",
        "type": "W",
        "value": [],
        "connect": ["line_1 line_2", "V_1-1"]
    },
    "3": {
        "id": "V_1",
        "type": "V",
        "value": [12],
        "connect": ["line_4", "line_3"]
    },
    "4": {
        "id": "line_4",
        "type": "W",
        "value": [],
        "connect": ["VM_1-0", "V_1-0"]
    },
    "5": {
        "id": "VM_1",
        "type": "VM",
        "value": [],
        "connect": ["line_4", "line_1"]
    },
    "6": {
        "id": "line_1",
        "type": "W",
        "value": [],
        "connect": ["VM_1-1", "line_3 line_2"]
    }
}

var example_output = {
    "V": [{
        "name": "V_1",
        "value": 12,
        "node1": "line_4",
        "node2": "gnd",
    }],
    "VM": [{
        "name": "VM_1",
        "value": [],
        "node1": "",
        "node2": "",
    }]
}

let nodeList = [[]];

function findLastPin(pin) {
    /**
     * findPin method takes a pin and return which node it last shows up.
     * 
     * @param   {String}    pin, indicates the pin we use to search for the node.
     * @return  {int}       This method will return a integer value indicating 
     *                      the index of the last node containing that pin,
     *                      it will return 0 if no such pin is found.
     * 
     */
    for (var nodeIndex = nodeList.length - 1; nodeIndex >= 0; nodeIndex--) {
        if (nodeList[nodeIndex].includes(pin)) {
            return nodeIndex;
        }
    }
    return -1;
}

function findPin(pin) {
    /**
     * findPin method takes a pin and return which node it first shows up.
     * 
     * @param   {String}    pin, indicates the pin we use to search for the node.
     * @return  {int}       This method will return a integer value indicating 
     *                      the index of the first node containing that pin,
     *                      it will return 0 if no such pin is found.
     * 
     */
    for (var nodeIndex = 0; nodeIndex < nodeList.length; nodeIndex++) {
        // console.log("type of nodelist[nodeIndex] is " + typeof (nodeList[nodeIndex]) + " nodeIndex is " + nodeIndex);
        if (nodeList[nodeIndex].includes(pin)) {
            return nodeIndex;
        }
    }
    return -1;
}

function appendNode(pin) {
    /**
     * appendNode method will create a new Node, if a pin is passed, that pin will
     * become the first pin in this new Node.
     * 
     * @param   {String}    pin, indicates the first pin included in the new node.
     * @return  {int}       It returns the index of the node that has just been created.
     * 
     */
    var newNode = [pin];
    nodeList.push(newNode);
    return nodeList.length - 1;
}

function joinNode(pin, node) {
    nodeList[node].push(pin);
}

function migrateNode(oldNode, newNode) {
    nodeListToString();
    console.log("oldNode = " + oldNode + ", newNode = " + newNode);
    var migratedPin = [];
    for (var pin in nodeList[oldNode]) {
        if (!(nodeList[newNode].includes(nodeList[oldNode][pin]))) {
            // If a pin exists in oldNode but not in newNode, migrate
            joinNode(nodeList[oldNode][pin], newNode);
            migratedPin.push(nodeList[oldNode][pin]);
        }
        // If newNode has that pin, nothing need to be done.
    }
    nodeList[oldNode] = [];
    // After the migration, clear the oldNode to avoid confusion.

    for (var pin in migratedPin) {
        // Every time a new node merge with an old node, some more node may need to merge as well
        // For example, node 1 has pin 1, 2; node 2 has pin 3, 4; node 3 has 2, 3.
        // After merging node 3 to node 1, we also need to check if the migrated pin
        // should result other nodes to merge.
        while (findLastPin(migratedPin[pin]) > findPin(migratedPin[pin])) {
            // keep merging all the node in the back until each pin exist only once.
            migrateNode(findLastPin(migratedPin[pin]), findPin(migratedPin[pin]));
        }
    }
}

function nodeListToString() {
    var retVal = "";
    console.log("nodeList's length: " + nodeList.length);
    for (var i = 0; i < nodeList.length; i++) {
        retVal.concat("For node " + i + ": ");
        console.log("nodeList[" + i + "]'s length: " + nodeList[i].length);
        for (var j = 0; j < nodeList[i].length; j++) {
            console.log("nodeList[" + i + "][" + j + "] " + nodeList[i][j]);
            retVal.concat(nodeList[i][j] + " ");
        }
        retVal.concat("\n");
    }
    console.log("retVal: " + retVal);
    return retVal;
}


function nodeId(input) {
    // Empty the nodeList
    nodeList = [[]];
    var output = {};
    // Iterate through each device
    for (var device in input) {
        var component = input[device];
        if (component.type == "REF") { // Reference Point
            // Check if there is a node containing the pin
            var pinName = component.id + "-0";
            // console.log("findPin second time, result: " + findPin(pinName))
            var pinNode = findPin(pinName);
            if (pinNode == -1) {
                pinNode = appendNode(pinName);
            }
            // Add all the connected lines to the pin node
            var connLines = component["connect"][0].split(" ");
            var minNode = pinNode;
            for (var connLine = 0; connLine < connLines.length; connLine++) {
                joinNode(connLines[connLine], pinNode);
                var lowestIndex = findPin(connLine);
                if (lowestIndex != -1) {
                    minNode = Math.min(minNode, lowestIndex);
                }
            }
            // If this pin connects to a previously defined node.
            // Migrate everything here to that node.
            if (minNode < pinNode) {
                migrateNode(pinNode, minNode);
            }

        } else if (component.type == "W") {
            // Wire
            var pinName = component.id;
            var pinNode = findPin(pinName);
            if (pinNode == -1) {
                pinNode = appendNode(pinName);
            }
            var connLines = component["connect"][0].split(" ");
            connLines.push(component["connect"][1].split(" "));
            var minNode = pinNode;
            for (var connLine = 0; connLine < connLines.length; connLine++) {
                joinNode(connLines[connLine], pinNode);
                var lowestIndex = findPin(connLine);
                if (lowestIndex != -1) {
                    minNode = Math.min(minNode, lowestIndex);
                }
            }
            if (minNode < pinNode) {
                migrateNode(pinNode, minNode);
            }

        } else if (
            // This branch is for two node components
            component.type == "V" ||
            // DC Voltage Source
            component.type == "I" ||
            // DC Current Source
            component.type == "R" ||
            // Resistor
            component.type == "L" ||
            // Inductor
            component.type == "C" ||
            // Capacitor
            component.type == "VA" ||
            // AC Voltage Source
            component.type == "IA" ||
            // AC Current Source
            component.type == "D" ||
            // Diode
            component.type == "TR" ||
            // Transistor
            component.type == "VM" ||
            // Voltmeter
            component.type == "AM" ||
            // Ampmeter
            component.type == "OS" ||
            // Oscilloscope
            component.type == "VCV" ||
            // Voltage Controlled Voltage Source
            component.type == "CCV" ||
            // Current Controlled Voltage Source
            component.type == "VCC" ||
            // Voltage Controlled Current Source
            component.type == "CCC"
            // Current Controlled Current Source

        ) {
            var pinName0 = component.id + "-0";
            var pinName1 = component.id + "-1";
            var pinNode0 = findPin(pinName0);
            var pinNode1 = findPin(pinName1);
            if (pinNode0 == -1) {
                pinNode0 = appendNode(pinName0);
            }
            if (pinNode1 == -1) {
                pinNode1 = appendNode(pinName1);
            }
            var connLines0 = component["connect"][0].split(" ");
            var connLines1 = component["connect"][1].split(" ");

            var minNode0 = pinNode0;
            var minNode1 = pinNode1;

            for (var connLine = 0; connLine < connLines0.length; connLine++) {
                joinNode(connLines[connLine], pinNode0);
                var lowestIndex = findPin(connLine);
                if (lowestIndex != -1) {
                    minNode0 = Math.min(minNode0, lowestIndex);
                }
            }
            for (var connLine = 0; connLine < connLines1.length; connLine++) {
                joinNode(connLines[connLine], pinNode1);
                var lowestIndex = findPin(connLine);
                if (lowestIndex != -1) {
                    minNode1 = Math.min(minNode1, lowestIndex);
                }
            }
            if (minNode0 < pinNode0) {
                migrateNode(pinNode0, minNode0);
            }
            if (minNode0 < pinNode0) {
                migrateNode(pinNode0, minNode0);
            }

            // Output as json
            var compJson = {
                "name": component.id,
                "value": component.value[0],
                "node0": component.connect[0],
                "node1": component.connect[1],
            }

            if (output[component.type]) {
                output[component.type].push(compJson)
            } else {
                output[component.type] = [compJson]
            }
        }
    }

    nodeListToString();

    for (var components in output) {
        for (var component = 0; component < output[components].length; component++) {
            console.log("findPin input is: " + output[components][component]["node0"] + " and " + output[components][component]["node1"]);
            var nodeInd0 = findPin(output[components][component]["node0"]);
            var nodeInd1 = findPin(output[components][component]["node1"]);
            console.log(components + "[" + component + "]'s node0 is " + nodeInd0 + ", node1 is " + nodeInd1);
            output[components][component]["node0"] = nodeInd0;
            output[components][component]["node1"] = nodeInd1;
        }
    }
    return output
}

// Interface to the external 
export { nodeId };