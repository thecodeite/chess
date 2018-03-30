const fs = require('fs')
let sleep = () => {}
try {
  const {msleep} = require('sleep')
  sleep = msleep
} catch (e) {
}

class Entity {
  constructor(name, x, y) {
    this.x = x
    this.y = y
    this.name = name
    this.shortName = name.substr(0, 1)
  }
}

class Knight extends Entity {
  constructor(name, x, y) {
    super(name, x, y)

    this.weapon = null
    this.status = 'LIVE'
  }

  isDead () {
    return this.status !== 'LIVE'
  }

  isDrowned () {
    return this.status === 'DROWNED'
  }

  drown (x, y) {
    console.log(`Knight ${this.name} drowned :(`)
    this.status = 'DROWNED'
    if (this.weapon) {
      this.weapon.drop(x, y)
      this.weapon = null
    }
  }

  die () {
    console.log(`Knight ${this.name} was killed :(`)
    this.status = 'DEAD'
    if (this.weapon) {
      this.weapon.drop(this.x, this.y)
      this.weapon = null
    }
  }

  takeWeapon (weapon) {
    if(!this.weapon) {
      this.weapon = weapon
      weapon.take(this)
    }
  }

  attack (opponent) {
    console.log(`Knight ${this.name} is attacking ${opponent.Name}!`)
    const attackStrength =
      1 +
      (this.weapon ? this.weapon.attack : 0) +
      0.5;
    console.log(`Knight ${this.Name} has a attackStrength of ${attackStrength}`)

    const defenceStrength =
      1 +
      (opponent.weapon ? opponent.weapon.defence : 0)
    console.log(`Knight ${opponent.Name} has a defenceStrength of ${defenceStrength}`)

    if (attackStrength > defenceStrength) {
      opponent.die()
    } else {
      this.die()
    }
  }

  toSummary() {
    const pos = this.isDrowned() ? '(None)' : `(${this.x},${this.y})`
    const weapon = this.weapon ? this.weapon.name : 'None'
    const atk = 1 + (this.weapon ? this.weapon.attack : 0)
    const dfn = 1 + (this.weapon ? this.weapon.defence : 0)
    return `[${pos},${this.status},${weapon},${atk},${dfn}]`
  }

  toString() {
    if (this.isDead()) return this.shortName.toLowerCase()
    return this.shortName.toUpperCase()
  }
}

class Weapon extends Entity {
  constructor(name, attack, defence, x, y) {
    super(name, x, y)
    this.attack = attack
    this.defence = defence
    this.owner = null
  }

  take (knight) {
    this.owner = knight
    this.x = null
    this.y = null
  }

  drop (x, y) {
    this.owner = null
    this.x = x
    this.y = y
  }

  toSummary() {
    if (this.owner) {
      return `[(${this.owner.x},${this.owner.y}),True]`
    } else {
      return `[(${this.x},${this.y}),False]`
    }
  }

  toString () {
    return this.name.substr(0, 1)
  }
}

class Board {
  constructor() {
    this.entities = []
  }

  add(entity) {
    this.entities.push(entity)
  }

  applyMove(move) {
    const knight =  this.entities.find(e => (e instanceof Knight) && e.shortName == move.knight)
    if (!knight) throw new Error('Could not find knight: '+ move.knight)
    if (knight.isDead()) return
    const {x:startX, y:startY} = knight

    knight.x += move.x
    knight.y += move.y
    const {x, y} = knight
    if (!Board.onBoard(x, y)) {
      knight.drown(startX, startY)
      return
    }

    let weapon = this.entities.find(e => (e instanceof Weapon) && e.x === x && e.y === y)
    if (weapon) knight.takeWeapon(weapon)

    let opponent = this.entities.find(e => e !== knight && (e instanceof Knight) && e.x === x && e.y === y)
    if (opponent) knight.attack(opponent)
  }

  static onBoard (x, y) {
    return x >= 0 && x < 8 && y >= 0 && y < 8
  }

  findEntity(name) {
    return this.entities.find(x => x.name === name)
  }

  toString () {
    // return this.rows
    //   .map(r => r.map(s => s.toString()).join('|'))
    //   .join('\n')
    const chars = []
    for(let y = -1; y<=8; y++) {
      chars.push('|')
      for(let x = -1; x<=8; x++) {
        let liveKnight = this.entities.find(e => (e instanceof Knight) && e.x === x && e.y === y && !e.isDead())
        let weapon = this.entities.find(e => (e instanceof Weapon) && e.x === x && e.y === y)
        let deadKnight = this.entities.find(e => (e instanceof Knight) && e.x === x && e.y === y && e.isDead())

        if (liveKnight) {
          chars.push(liveKnight.toString())
        } else if (weapon) {
          chars.push(weapon.toString())
        } else if (deadKnight) {
          chars.push(deadKnight.toString())
        } else if (Board.onBoard(x, y)) {
          chars.push('_')
        } else {
          chars.push('-')
        }

        chars.push('|')
      }
      chars.push('\n')
    }

    return chars.join('')
  }
}

class Move {
  constructor (knight, direction) {
    this.knight = knight
    if (direction === 'S') {
      this.x = 0; this.y = 1
    } else if (direction === 'N') {
      this.x = 0; this.y = -1
    } else if (direction === 'E') {
      this.x = 1; this.y = 0
    } else if (direction === 'W') {
      this.x = -1; this.y = 0
    }
  }
}

function printSummary(board) {
  console.log(`{
  red: ${board.findEntity('Red').toSummary()},
  blue: ${board.findEntity('Blue').toSummary()},
  green: ${board.findEntity('Green').toSummary()},
  yellow: ${board.findEntity('Yellow').toSummary()},
  magic_staff: ${board.findEntity('MagicStaff').toSummary()},
  helmet: ${board.findEntity('Helmet').toSummary()},
  dagger: ${board.findEntity('Dagger').toSummary()},
  axe: ${board.findEntity('Axe').toSummary()},
}`)
}

const board = new Board()
// `R (0,0)  (top left)`
// `B (7,0)  (bottom left)`
// `G (7,7)  (bottom right)`
// `Y (0,7)  (top right)`
board.add(new Knight('Red', 0, 0))
board.add(new Knight('Blue', 0, 7))
board.add(new Knight('Green', 7, 7))
board.add(new Knight('Yellow', 7, 0))
// `Axe         (A) (2,2)`
// `Dagger      (D) (2,5)`
// `MagicStaff  (M) (5,2)`
// `Helmet      (H) (5,5)`
board.add(new Weapon('Axe', 2, 0, 2, 2))
board.add(new Weapon('Dagger', 1, 0, 2, 5))
board.add(new Weapon('MagicStaff', 1, 1, 5, 2))
board.add(new Weapon('Helmet', 0, 1, 5, 5))

const moves = [
  'R:S',
  'R:S',
  'R:E',
  'R:E',
  'R:W',
  'R:W',
  'R:W',
  'R:W',

  'Y:W',
  'Y:W',
  'Y:S',
  'Y:S',
  'Y:S',
  'Y:S',
  'G:W',
  'G:W',
  'G:N',
  'G:N',
  'G:N',
  'G:N',
  'G:N',
]
  .map(s => s.split(':'))
  .map(([knight, direction]) => new Move(knight, direction))

console.log(board.toString())

for(let m of moves) {
  sleep(50)
  console.log(m)
  board.applyMove(m)
  console.log(board.toString())
}

printSummary(board)