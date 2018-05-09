'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    if (vector instanceof Vector) {
        return new Vector(this.x + vector.x, this.y + vector.y);
    } else {
        throw new Error('Можно прибавлять к вектору только вектор типа Vector');
    }
  }

  times(multiply) {
    return new Vector(this.x * multiply, this.y * multiply);
  }
}

class Actor {
    constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
        if (!(pos instanceof Vector)) {
            throw new Error('Свойство "Pасположение" должно быть типа Vector');
        }

        if (!(size instanceof Vector)) {
            throw new Error('Свойство "Размер" должно быть типа Vector');
        }

        if (!(speed instanceof Vector)) {
            throw new Error('Свойство "Скорость" должно быть типа Vector');
        }
        this._pos = pos;
        this.size = size;
        this._speed = speed;
        this._type = "actor";
    }

    act() {

    }

    get pos() {
        return this._pos;
    }

    set pos(pos) {
        this._pos = pos;
    }

    get speed() {
        return this._speed;
    }

    set speed(speed) {
        this._speed = speed;
    }

    get left() {
        return this.pos.x;
    }

    get top() {
        return this.pos.y;
    }

    get right() {
        return this.pos.x + this.size.x;
    }

    get bottom() {
        return this.pos.y + this.size.y;
    }

    get type() {
        return this._type;
    }

    isIntersect(actor) {
        if (!actor) {
            throw new Error('Аргумент не задан');
        }

        if (!(actor instanceof Actor)) {
            throw new Error('Аргумент должно быть типа Actor');
        }

        if (this === actor) {
            return false;
        }

        if (this.top  === actor.top && this.left === actor.left &&
           (actor.bottom < 0 || actor.right < 0)) {
            return false;
        }

        if (actor.bottom === this.top  || actor.top === this.bottom ||
            actor.right  === this.left || actor.left   === this.right) {
            return false;
        }

        if (
             (actor.bottom >= this.top  && actor.bottom <= this.bottom &&
              actor.left   >= this.left && actor.left   <= this.right) ||

             (actor.top >= this.top && actor.top <= this.bottom &&
              actor.left   >= this.left && actor.left   <= this.right) ||

             (actor.top >= this.top && actor.top <= this.bottom &&
              actor.right  >= this.left && actor.right  <= this.right) ||

             (actor.bottom >= this.top  && actor.bottom <= this.bottom &&
              actor.right  >= this.left && actor.right  <= this.right)
           ) {
            return true;
        }
        return false;
    }
}

class Level {
    constructor(grid = [], actors = []) {
        this._grid = grid;
        this._actors = actors;
        this._status = null;
        this._finishDelay = 1;
        this._player = actors[0];
    }

    get grid() {
        return this._grid;
    }

    set grid(grid) {
        this._grid = grid;
    }

    get actors() {
        return this._actors;
    }

    set player(player) {
        this._player = player;
    }

    get player() {
        return this._player;
    }

    get height() {
        return this._grid.length;
    }

    get width() {
        let width = 0;
        for(let idx = 0; idx < this._grid.length; idx++) {
            width = Math.max(width, this._grid[idx].length);
        }
        return width;
    }

    get status() {
        return this._status;
    }

    set status(status) {
        this._status = status;
    }

    get finishDelay() {
        return this._finishDelay;
    }

    set finishDelay(finishDelay) {
        this._finishDelay = finishDelay;
    }


    isFinished() {
        return this._status !== null && this._finishDelay < 0;
    }

    actorAt(actor) {
        if (!actor) {
            throw new Error('Аргумент не задан');
        }

        if (!(actor instanceof Actor)) {
            throw new Error('Аргумент должно быть типа Actor');
        }

        for(let idx = 0; idx < this._actors.length; idx++) {
            if (this._actors[idx].isIntersect(actor)) {
                return this._actors[idx];
            }
        }
        return undefined;
    }

    obstacleAt(target, size) {
        if (!(target instanceof Vector)) {
            throw new Error('Свойство "Положение" должно быть типа Vector');
        }

        if (!(size instanceof Vector)) {
            throw new Error('Свойство "Размер" должно быть типа Vector');
        }

        const position = new Actor(new Vector(Math.floor(target.x), Math.floor(target.y)),
                                    new Vector(Math.floor(size.x), Math.floor(size.y)));

        if (position.top < 0) {
            return "wall"
        }

        if (position.left < 0) {
            return "wall"
        }

        if (position.bottom > this.height) {
            return "lava"
        }

        if (position.right > this.width) {
            return "wall"
        }

        for (let y = position.top; y < this._grid.length && y <= position.bottom; y++) {
            for (let x = position.left; x < this._grid[y].length && x <= position.right; x++) {
                if (this._grid[y][x]) {
                    return this._grid[y][x];
                }
            }
        }
        return undefined;
    }

    removeActor(actor) {
        if (!(actor instanceof Actor)) {
            throw new Error('Аргумент должно быть типа Actor');
        }
        for (let idx = 0; idx < this._actors.length; idx++) {
            if (actor === this._actors[idx]) {
                this._actors.splice(idx, 1);
            }
        }
    }

    noMoreActors(type) {
        return this._actors.filter(actor => actor.type === type).length === 0;
    }


    playerTouched(objectType, actor) {
        if (this._status) {
            return;
        }

        if (objectType === "lava" || objectType === "fireball") {
            this.status = "lost";
        } else if (objectType === "coin") {
            this.removeActor(actor);
            if (this.noMoreActors(actor.type)) {
                this.status = "won";
            }
        }
    }
}

class LevelParser {
    constructor(dictionary) {
        this.dictionary = dictionary;
    }

    actorFromSymbol(symbol) {
        return symbol ? this.dictionary[symbol]: undefined;
    }

    obstacleFromSymbol(symbol) {
        switch(symbol) {
            case "x":
                return "wall"
            case "!":
                return "lava";
            default:
                return undefined;
        }
    }

    createGrid(plan) {
        return plan.map(string => string.split("").map(symbol => this.obstacleFromSymbol(symbol)));
    }

    createActors(actors) {
        if (!this.dictionary) {
            return [];
        }
        let result = [];

        for (let y = 0; y < actors.length; y++) {
            const actorsInLine = actors[y].split("");
            for (let x = 0; x < actorsInLine.length; x++) {
                const actor = actorsInLine[x];
                if (actor in this.dictionary) {
                    if (typeof this.dictionary[actor] === "function") {
                        if (Object.getPrototypeOf(this.dictionary[actor]).name === "Actor" ||
                            this.dictionary[actor].name === "Actor") {
                            const func = this.dictionary[actor];
                            result.push(new func(new Vector(x, y)));
                        }
                    }
                }
            }
        }
        return result;
    }

    parse(plan) {
        const grid = plan.map(planLine => planLine.split("").map(item => this.obstacleFromSymbol(item)));
        return new Level(grid, this.createActors(plan));
    }
}

class Fireball extends Actor {
    constructor(pos = new Vector(0,0), speed = new Vector(0,0)) {
        super(pos, new Vector(1,1), speed);
        this._type = "fireball"
    }

    get size() {
        return this._size;
    }

    set size(size) {
        this._size = size;
    }

    getNextPosition(time = 1) {
        return new Vector(this.pos.x + this.speed.x * time, this.pos.y + this.speed.y * time);
    }

    handleObstacle() {
        this.speed = new Vector(-this.speed.x, -this.speed.y);
    }

    act(time, level) {
        const nextPosition = this.getNextPosition(time);
        if (level.obstacleAt(nextPosition, this.size) === undefined) {
            this.pos = nextPosition;
        } else {
            this.handleObstacle();
        }
    }
}

class HorizontalFireball extends Fireball {
    constructor(pos = new Vector(0,0)) {
        super(pos, new Vector(2,0));
    }
}

class VerticalFireball extends Fireball {
    constructor(pos = new Vector(0,0)) {
        super(pos, new Vector(0,2));
    }
}

class FireRain extends Fireball {
  constructor(pos = new Vector(0,0)) {
    super(pos, new Vector(0,3));
    this.origPos = new Vector(pos.x, pos.y);
  }

  handleObstacle() {
    this.pos = this.origPos;
  }
}

class Coin extends Actor {
    constructor(pos = new Vector(0,0)) {
      super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
      this._type = "coin";
      this._spring = Math.random() * (Math.PI - 0) + 0;
      this._realPos = pos.plus(new Vector(0.2, 0.1));
    }

    get springSpeed() {
        return 8;
    }

    get springDist() {
        return 0.07;
    }

    get spring() {
        return this._spring
    }

    set spring(spring) {
        this._spring = spring;
    }

    updateSpring(time = 1) {
        this._spring += (this.springSpeed * time);
    }

    getSpringVector() {
        return new Vector(0, Math.sin(this.spring) * this.springDist);
    }

    getNextPosition(time = 1) {
        this.spring += this.springSpeed * time;
        return this._realPos.plus(this.getSpringVector());
    }

    act(time) {
        this.pos = this.getNextPosition(time);
    }
}

class Player extends Actor {
    constructor(pos = new Vector(0,0)) {
      super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5));
      this._type = "player";
    }
}