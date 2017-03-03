// from http://burakkanber.com/blog/machine-learning-in-js-k-nearest-neighbor-part-1/

function Node(object) {
  for (var key in object) {
    this[key] = object[key];
  }
}

Node.prototype.measureDistances = function (area_range_obj, rooms_range_obj) {
    var rooms_range = rooms_range_obj.max - rooms_range_obj.min;
    var area_range = area_range_obj.max - area_range_obj.min;

    for (var i in this.neighbors) {
        var neighbor = this.neighbors[i];

        var delta_rooms = neighbor.rooms - this.rooms;
        delta_rooms = (delta_rooms) / rooms_range;

        var delta_area = neighbor.area - this.area;
        delta_area = (delta_area) / area_range;

        neighbor.distance = Math.sqrt(delta_rooms * delta_rooms + delta_area * delta_area);
    }
};

Node.prototype.sortByDistance = function () {
    this.neighbors.sort(function (a, b) {
        return a.distance - b.distance;
    });
};

Node.prototype.guessType = function(k) {
    var types = {};

    for (var i in this.neighbors.slice(0, k)) {
        var neighbor = this.neighbors[i];

        if (!types[neighbor.type]) {
            types[neighbor.type] = 0;
        }

        types[neighbor.type] += 1;
    }

    var guess = {type: false, count: 0};
    for (var type in types) {
        if (types[type] > guess.count) {
            guess.type = type;
            guess.count = types[type];
        }
    }

    this.guess = guess;
    return types;
};

function NodeList(k) {
    this.nodes = [];
    this.k = k;
}

NodeList.prototype.add = function (node) {
    this.nodes.push(node);
};

NodeList.prototype.calculateRanges = function () {
    this.areas = {min: 1000000, max: 0};
    this.rooms = {min: 1000000, max: 0};
    for (var i in this.nodes) {
        if (this.nodes[i].rooms < this.rooms.min) {
            this.rooms.min = this.nodes[i].rooms;
        }
        if (this.nodes[i].rooms > this.rooms.max) {
            this.rooms.max = this.nodes[i].rooms;
        }
        if (this.nodes[i].area < this.areas.min) {
            this.areas.min = this.nodes[i].area;
        }
        if (this.nodes[i].area > this.areas.max) {
            this.areas.max = this.nodes[i].area;
        }
    }
};

NodeList.prototype.determineUnknown = function () {
    this.calculateRanges();

    /*
    * Loop through our nodes and look for unknown types
    */
    for (var i in this.nodes) {
        if (!this.nodes[i].type) {
            /*
            * If the node is an unknown type, clone the nodes list and then measure distances
            */
            /* Clone nodes */
            this.nodes[i].neighbors = [];
            for (var j in this.nodes) {
                if (!this.nodes[j].type) {
                    continue;
                }
                this.nodes[i].neighbors.push(new Node(this.nodes[j]));
            }

            /* Measure distances */
            this.nodes[i].measureDistances(this.areas, this.rooms);

            /* Sort by distance */
            this.nodes[i].sortByDistance();

            /* Guess type */
            console.log(this.nodes[i].guessType(this.k));
        }
    }
};

NodeList.prototype.draw = function (canvas_id) {
    var rooms_range = this.rooms.max - this.rooms.min;
    var area_range = this.areas.max - this.areas.min;

    var canvas = document.getElementById(canvas_id);
    var ctx = canvas.getContext('2d');
    var width = 400;
    var height = 400;
    ctx.clearRect(0, 0, width, height);

    for (var i in this.nodes) {
        ctx.save();

        console.log(this.nodes[i].type);
        switch(this.nodes[i].type) {
            case 'apartment':
                ctx.fillStyle = 'red';
                break;
            case 'house':
                ctx.fillStyle = 'green';
                break;
            case 'flat':
                ctx.fillStyle = 'blue';
                break;
            default:
                ctx.fillStyle = '#666666';
        }

        var padding = 40;
        var x_shift_pct = (width - padding) / width;
        var y_shift_pct = (height - padding) / height;

        var x = (this.nodes[i].rooms - this.rooms.min) * (width / rooms_range) * x_shift_pct + (padding / 2);
        var y = (this.nodes[i].area - this.areas.min) * (height / area_range) * y_shift_pct + (padding / 2);
        y = Math.abs(y - height);

        ctx.translate(x, y);
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI*2, true);
        ctx.fill();
        ctx.closePath();

        /*
        * Is this an unknown node? If so, draw the radius of influence
        */
        if (!this.nodes[i].type) {
            switch (this.nodes[i].guess.type) {
                case 'apartment':
                    ctx.strokeStyle = 'red';
                    break;
                case 'house':
                    ctx.strokeStyle = 'green';
                    break;
                case 'flat':
                    ctx.strokeStyle = 'blue';
                    break;
                default:
                    ctx.strokeStyle = '#666666';
            }

            var radius = this.nodes[i].neighbors[this.k - 1].distance * width;
            radius *= x_shift_pct;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI*2, true);
            ctx.stroke();
            ctx.closePath();
        }

        ctx.restore();        
    }

}

function run() {
    var nodes = new NodeList(3);
    for (var i in data) {
        nodes.add(new Node(data[i]));
    }
    var random_rooms = Math.round(Math.random() * 10);
    var random_area = Math.round(Math.random() * 2000);
    nodes.add(new Node({rooms: random_rooms, area: random_area, type: false}));

    nodes.determineUnknown();
    nodes.draw("knn-graph");
};

window.onload = function () {
    setInterval(run, 5000);
    run();
};
