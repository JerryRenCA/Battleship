"use strict";
class translate_A_N {
    static AtoN(A) {
        return parseInt(A, 36) - 9 - 1;
    }

    static NtoA(N) {
        let chars = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        return chars[N];
    }
    static check_input_valid(str) {
        if (str.length != 2) return { isValid: false };
        let i = translate_A_N.AtoN(str[0]);
        if (i < -1 || i > 9) return { isValid: false };
        let j = parseInt(str[1]);
        if (j < -1 || j > 9) return { isValid: false };
        return { isValid: true, loc: new Point(i, j) };
    }
}
class Point {
    constructor(_x, _y) {
        this.x = _x;
        this.y = _y;
    }
    equalTo(aPoint) {
        return aPoint.x == this.x && aPoint.y == this.y;
    }
    inArray(pArray) {
        let rzlt = false;
        pArray.forEach((item) => { if (this.equalTo(item)) rzlt = true; })
        return rzlt;
    }
    moveleft(i) { return new Point(this.x, this.y + i) }
    movedown(i) { return new Point(this.x + i, this.y) }
}

class Cell {
    constructor(_x, _y) {
        this.point = new Point(_x, _y);
        this.occupied = 0; // this point occupied by ship // 0 is water, 1-5 is the ship id
        this.hitted_by_ = 0; //this point is hitted by PC
        this.shot = 0;  // 0: this point has not been shot yet; 
        this.hit_a_ship = 0; //hit PC's ship at this point; 1: hit, 0: not hit
    }
    get own_point_Char() { return this.hitted_by_ == 1 ? '@' : this.occupied == 0 ? '~' : this.occupied.toString() }
    get op_point_Char() { return this.shot == 0 ? '~' : (this.hit_a_ship == 0 ? 'x' : 'o') }
    get_point_Char(is_player) { return is_player ? this.own_point_Char : this.op_point_Char }
}

class ship {
    static shiptype_names = ["Carrier", "Battleship", "Cruiser", "Submarine", "Destroyer"];
    // 0 is Carrier, 1 is battleship, ... 
    static shiptype_names_si = ["CA", "BA", "CR", "SU", "DE"];
    static shiptype_inilifes = [5, 4, 3, 3, 2];

    get shiptype_name() {
        return ship.shiptype_names[this.shiptype];
    }
    get shiptype_name_si() {
        return ship.shiptype_names_si[this.shiptype];
    }

    constructor(_shiptype) {
        this.shiptype = _shiptype;
        this.lifeinit = ship.shiptype_inilifes[this.shiptype];
        this.lifeleft = this.lifeinit;
        this.ship_loc = new Point(0, 0);
        this.ship_direction = 0; // 0 is horizontal, 1 is vertical;
    }
    get_occupied_points(_loc = this.ship_loc, _dir = this.ship_direction) {
        let o_points = [];
        for (let i = 0; i < this.lifeinit; i++) {
            o_points[i] = (_dir == 0 ? _loc.moveleft(i) : _loc.movedown(i));
        }
        return o_points;
    }
}


class grid {

    constructor(whoes_grid) {
        this.grid_size = 10;
        this.grid_owner = whoes_grid; //1 is player's grid, 0 is computer's grid    
        this.ship_array = [new ship(0), new ship(1), new ship(2), new ship(3), new ship(4)];
        this.initial_grid();
        this.shots_record = [];
        this.shot_number_total = 30;
    }

    get shot_number_left() { return this.shot_number_total - this.shots_record.length }

    initial_grid() {
        this.cells = new Array(this.grid_size);

        for (let i = 0; i < this.grid_size; i++) {
            this.cells[i] = new Array(this.grid_size);
            for (let j = 0; j < this.grid_size; j++)
                this.cells[i][j] = new Cell(i, j);
        }
    }

    place_ships_Auto() {
        let rnd09 = () => { return Math.floor(Math.random() * 10); }
        let rnd01 = () => { return Math.round(Math.random()); }
        let rndloc = () => { return new Point(rnd09(), rnd09()); }

        for (let i = 0; i < this.ship_array.length; i++) {
            let a_loc;
            let a_dir;
            do {
                a_loc = rndloc();
                a_dir = rnd01();
            } while (this.check_ship_loc_valid(i, a_loc, a_dir) != 0)
            
            this.place_ship(i, a_loc, a_dir);
        }
        console.log("Placed ships.")
    }

    check_ship_loc_valid(_ship_id, _loc, _dir) {
        let theship = this.ship_array[_ship_id];
        let o_points = theship.get_occupied_points(_loc, _dir);
        function check_over(_point, _grid_size) {
            return _point.x < _grid_size && _point.y < _grid_size;
        }
        function check_overlay(_point, _cells) {
            return _cells[_point.x][_point.y].occupied == 0;
        }
        for (let i = 0; i < o_points.length; i++) {
            if (!check_over(o_points[i], this.grid_size)) return 1;  // ship placed over the edge
            if (!check_overlay(o_points[i], this.cells)) return 2;  // ship overlay with these ships already placed.
        }
        return 0;
    }
    place_ship(_ship_id, _loc, _dir) {
        this.ship_array[_ship_id].ship_loc = _loc;
        this.ship_array[_ship_id].ship_direction = _dir;
        let theship = this.ship_array[_ship_id];
        let o_points = theship.get_occupied_points(_loc, _dir);
        for (let i = 0; i < o_points.length; i++) {
            this.cells[o_points[i].x][o_points[i].y].occupied = _ship_id + 1;
        }
    }
    // shot_here(_loc,isHit){
    //     this.cells[_loc.x][_loc.y].shot = 1;
    //     this.cells[_loc.x][_loc.y].hit_a_ship=isHit;
    // }
    // get_hit(_loc){
    //     this.cells[_loc.x][_loc.y].hitted_byPC=1;
    // }
    render() { // just for unit test
        let space = '  ';
        let rowstr = new Array(this.grid_size + 1);

        let genChar = (i, j) => {
            if (i == -1) {
                return (j == -1 ? ' ' : j.toString()) + space;
            }
            else {
                return (j == -1 ? translate_A_N.NtoA(i) : this.cells[i][j].oc_Char) + space;
            }
        }
        for (let i = -1; i < this.grid_size; i++) {
            rowstr[i + 1] = '';
            for (let j = -1; j < this.grid_size; j++) {
                rowstr[i + 1] += genChar(i, j);
            }
        }
        rowstr.forEach((item) => { console.log(item); console.log(); });
    }

}

class game {
    constructor() {
        this.PC_grid = new grid(0);
        this.Player_grid = new grid(1);
        this.isPlayerMove = true;
    }
    init() {
        this.PC_grid.initial_grid();
        this.Player_grid.initial_grid();

        this.PC_grid.shots_record = [];

        this.Player_grid.shots_record = [];

    }
    set_ships() {
        this.PC_grid.place_ships_Auto();
        this.Player_grid.place_ships_Auto();
    }

    render(isPlayer = true) {
        let aGrid = isPlayer ? this.Player_grid : this.PC_grid;
        let dGrid = !isPlayer ? this.Player_grid : this.PC_grid;

        let game_info = `****** Have fun in BattileShip ******`;
        let whos_grid = isPlayer ? 'Player:' : 'PC:';
        let shot_info = `You have fired ${aGrid.shots_record.length} shots.`;
        console.log(game_info);
        console.log(whos_grid);
        console.log(shot_info + '\n\n');


        let title = `               Your Ships                                  Your Shots            \n\n`;
        console.log(title);

        let space = '  ';
        let rowstr = new Array(this.PC_grid.grid_size + 1);

        let genChar = (agrid, i, j, isOwn) => {
            if (i == -1) {
                return (j == -1 ? ' ' : j.toString()) + space;
            }
            else {
                return (j == -1 ? translate_A_N.NtoA(i) : agrid.cells[i][j].get_point_Char(isOwn)) + space;
            }
        }
        let buildrow = (agrid) => {
            for (let i = -1; i < agrid.grid_size; i++) {
                for (let j = -1; j < agrid.grid_size; j++) {
                    rowstr[i + 1] += genChar(agrid, i, j, true);
                }
                rowstr[i + 1] += '    |    ';
                for (let j = -1; j < agrid.grid_size; j++) {
                    rowstr[i + 1] += genChar(agrid, i, j, false);
                }
            }
        }
        let ini_arr = (arr) => { for (let i = 0; i < arr.length; i++) { arr[i] = '    '; } }
        ini_arr(rowstr);
        buildrow(aGrid);
        // console.clear();
        rowstr.forEach((item) => { console.log(item); console.log(); });

        let infoStr = new Array(3);
        infoStr[0] = `Info: Marker "@" represents your ship at that location was hitted by enemy;`;
        infoStr[1] = `      Marker "o" represents your shot hitted enemy's ship at that location;`;
        infoStr[2] = `      Marker "x" represents your shot didn't hit enemy's ship at that location.`;
        infoStr.forEach((item) => { console.log(item); });

        if (dGrid.shots_record.length >= 1) {
            let lastOpShot = new Array(1);
            let ix = translate_A_N.NtoA(dGrid.shots_record[dGrid.shots_record.length - 1].x);
            let iy = dGrid.shots_record[dGrid.shots_record.length - 1].y;
            lastOpShot[0] = `Emeny attacked location: ${ix}:${iy}.`;
            lastOpShot.forEach((item) => { console.log(item); console.log(); });
        }
    }

    getRdnShot = () => {
        let rnd09 = () => { return Math.floor(Math.random() * 10); }
        let rnd01 = () => { return Math.round(Math.random()); }
        let rndloc = () => { return new Point(rnd09(), rnd09()); }
        return rndloc();
    }

    check_finish() { // return 1: player win; -1: PC win; 0: not finish yet. 2: no more shots left.
        let check_grid = (the_grid) => {  // all ships are hit, return true, game finish.
            for (let i = 0; i < the_grid.ship_array.length; i++) {
                let theship = the_grid.ship_array[i];
                let occupiedLoc = theship.get_occupied_points();
                let ship_isHit = false;
                occupiedLoc.forEach((item) => {
                    if (the_grid.cells[item.x][item.y].hitted_by_ == 1) ship_isHit = true;
                })
                if (!ship_isHit) return false;
            }
            return true;
        }
        let check_shot_number = (the_grid) => {
            return the_grid.shot_number_left <= 0;
        }
        if (check_grid(this.Player_grid)) return -1;
        if (check_grid(this.PC_grid)) return 1;
        // if (check_shot_number(this.Player_grid)) return 2;
        // if (check_shot_number(this.PC_grid)) return 2;
        return 0;

    }
    PC_shot = () => {
        return this.getRdnShot();
    }
    Player_shot = () => {
        do {
            let locstr = rls.question(`Input the location you want to shot[a0 ~ j9]:`)
            if(locstr=='R'||locstr=='r') return this.getRdnShot();
            let rzlt = translate_A_N.check_input_valid(locstr);
            if (rzlt.isValid) return rzlt.loc;
        } while (true)
    }
    action = (isPlayer) => {
        let agrid = isPlayer ? this.Player_grid : this.PC_grid;
        let dgrid = !isPlayer ? this.Player_grid : this.PC_grid;
        let shot_loc = isPlayer ? this.Player_shot() : this.PC_shot();
        let check_is_hit = () => {
            return dgrid.cells[shot_loc.x][shot_loc.y].occupied != 0;
        }
        agrid.cells[shot_loc.x][shot_loc.y].shot = 1;
        let isHit = check_is_hit();
        agrid.cells[shot_loc.x][shot_loc.y].hit_a_ship = isHit;
        dgrid.cells[shot_loc.x][shot_loc.y].hitted_by_ = isHit;
        agrid.shots_record.push(shot_loc)
    }
    game_over = (gameRzlt) => {
        console.log(`Game over! ${this.Player_grid.shots_record.length} shots fired. ${gameRzlt == 2 ? 'Draw' : (gameRzlt == 1 ? "You win" : "You lose")}!`);
    }
    step() {
        this.render();
        let gameRzlt = 0;
        do {
            this.action(this.isPlayerMove);
            this.render();
            // this.render(false);
            this.isPlayerMove = !this.isPlayerMove;
            gameRzlt = this.check_finish();
        } while (!gameRzlt)
        this.game_over(gameRzlt);
    }
}



// key play program
const rls = require('readline-sync');

let run = async () => {
    console.clear();
    // await test();
    // return;

    await show_welcome_screen();
    show_menu();
    sel_Difficult();
    let agame = new game();
    do {
        agame.init();
        agame.set_ships();
        console.clear();
        agame.render();
        // agame.render(false);
        let isY = '';
        do {
            isY = rls.question("Are you statisfied for your ships location? Y to comfirm, G to regenerate: ")
            if (isY == 'Y' || isY == 'y' || isY == 'G' || isY == 'g') break;
        } while (true)
        if (isY == 'Y' || isY == 'y') break;
        if (isY == 'G' || isY == 'g') continue;
    } while (true)

    agame.step();




}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function show_welcome_screen() {
    let str = new Array(8);
    str[0] = ``;
    str[1] = ``;
    str[2] = ``;
    str[3] = `     *************************************************`;
    str[4] = "     *************************************************";
    str[5] = "     ************ Welcome to Battleship **************";
    str[6] = "     *************************************************";
    str[7] = "     *************************************************";
    str[8] = "     *********** Designed by Jerry in NSCC ***********";
    let str_start = "     ****************** Loading...... *****************";
    let show_lettercount = 1;
    let letterNumber = str[0].length

    let show_step = () => {
        console.clear();
        str.forEach((item, index, arr) => {
            // console.log(item.substring(0, show_lettercount));
            console.log(item);

        });
        console.log(str_start.substring(0, show_lettercount));
        show_lettercount = (show_lettercount++ == str_start.length ? 0 : show_lettercount);
    }
    let _ani_speed = 50;
    let wait_time = 5000;
    do {
        setTimeout(show_step, _ani_speed);
        await sleep(_ani_speed);
        wait_time -= _ani_speed;
    } while (wait_time > 0)

}



let show_menu = async () => {
    console.clear();
    let str = new Array(11);
    str[0] = '';
    str[1] = '';
    str[2] = '';
    str[3] = `     *************************************************`;
    str[4] = "     *************************************************";
    str[5] = "     ************ Welcome to Battleship **************";
    str[6] = "     *************************************************";
    str[7] = "     *************************************************";
    str[8] = "     **********************  MENU  *******************";
    str[9] = "";
    str[10] = "     A) Start game...";
    str[11] = "     B) Exit game.";

    str.forEach((item) => { console.log(item) });
    do {
        let sel = rls.question("     Choose your action: (A or B)");
        if (sel == 'A' || sel == 'B') return sel;
    } while (true)
}

let sel_Difficult = async () => {
    console.clear();
    let str = new Array(10);
    str[0] = '';
    str[1] = '';
    str[2] = '';
    str[3] = `     *************************************************`;
    str[4] = "     *************************************************";
    str[5] = "     ************ Welcome to Battleship **************";
    str[6] = "     *************************************************";
    str[7] = "     *************************************************";
    str[8] = "     **********************  MENU  *******************";
    str[9] = "";
    str[10] = "     Difficult Level: 1 - 3 [Easiest to Hardest]";

    str.forEach((item) => { console.log(item) });
    do {
        let sel = rls.question("     Choose different: ( 1 ~ 3): ");
        if (sel =='1' || sel =='2'||sel =='3') return sel;
    } while (true)
}
let unitTest = (content, fun, val) => {
    console.log(`${content} : ${fun()} == ${val} < = > ${fun() == val ? "Success" : "Fail"}`);
}

let test = async () => {
    // Test class point 
    let p1 = new Point(1, 2);
    let p2 = new Point(1, 2);
    let p3 = new Point(1, -2);
    let pArr1 = [p1, new Point(4, 2), new Point(-1, 2), new Point(1, -2)];
    let pArr2 = [new Point(-1, 2), new Point(4, 2), new Point(-1, 2), new Point(1, -2)];


    unitTest(`p1.equalTo(p2)=true`, () => { return p1.equalTo(p2) }, true)
    unitTest(`p1.equalTo(p3)=false`, () => { return p1.equalTo(p3) }, false)
    unitTest(`p1.inArray(pArr1)=true`, () => { return p1.inArray(pArr1) }, true)
    unitTest(`p1.inArray(pArr2)=false`, () => { return p1.inArray(pArr2) }, false)
    // Test translate_A_N
    unitTest(`A to 0`, () => { return translate_A_N.AtoN('A') }, 0)
    unitTest(`0 to A`, () => { return translate_A_N.NtoA(0) }, 'A')
    unitTest(`E to 4`, () => { return translate_A_N.AtoN('E') }, 4)
    unitTest(`4 to E`, () => { return translate_A_N.NtoA(4) }, 'E')


    // Test class ship
    let ship0 = new ship(0);
    let ship1 = new ship(1);
    let ship2 = new ship(2);
    let ship3 = new ship(3);
    let ship4 = new ship(4);
    console.log();
    console.log(`ship0.lifeinit==${ship.shiptype_inilifes[0]} : ${ship0.lifeinit}`);
    console.log(`ship1.shiptype_name==${ship.shiptype_names[1]} : ${ship1.shiptype_name}`);
    console.log(`ship4.shiptype_name_si==${ship.shiptype_names_si[4]} : ${ship4.shiptype_name_si}`);

    let o_Pointsh = ship0.get_occupied_points(p1, 0);
    let o_Pointsv = ship0.get_occupied_points(p1, 1);
    let o_Points_h = [p1, p1.moveleft(1), p1.moveleft(2), p1.moveleft(3), p1.moveleft(4)];
    let o_Points_v = [p1, p1.movedown(1), p1.movedown(2), p1.movedown(3), p1.movedown(4)];
    console.log(`o_Pointsh[2].equalTo(o_Points_h[2])=true:${o_Pointsh[2].equalTo(o_Points_h[2])}`);
    console.log(`o_Pointsh[4].equalTo(o_Points_h[4])=true:${o_Pointsh[4].equalTo(o_Points_h[4])}`);
    console.log(`o_Pointsv[2].equalTo(o_Points_v[2])=true:${o_Pointsv[2].equalTo(o_Points_v[2])}`);
    console.log(`o_Pointsv[4].equalTo(o_Points_v[4])=true:${o_Pointsv[4].equalTo(o_Points_v[4])}`);



    //Test class grid
    let grid_pc = new grid(0);
    let grid_player = new grid(1);
    console.log();
    unitTest(`grid_pc.grid_owner=true`, () => { return grid_pc.grid_owner == 0 }, true)

    unitTest(`grid_pc.cells[9][9].point.x==0`, () => { return grid_pc.cells[9][9].point.x == 9 }, true)
    unitTest(`grid_pc.cells[8][8].occupied==0`, () => { return grid_pc.cells[8][8].occupied == 0 }, true)
    unitTest(`grid_pc.cells[0][0].shot==0`, () => { return grid_pc.cells[0][0].shot == 0 }, true)
    //Test grid render
    if (false) {
        rls.question('Testing render...')
        grid_pc.render();
        rls.question('Testing put ship 1 at [6, 1], 1 ...')
        grid_pc.place_ship(0, new Point(6, 1), 1)
        grid_pc.render();
        rls.question('Testing put ship 1 at [6, 1], 0 ...')
        //    grid_pc.place_ship(0,new Point(6,1),0)//Error
        grid_pc.render();
        rls.question('Testing put ship 2 at [2, 1], 1 ...')
        grid_pc.place_ship(1, new Point(2, 1), 1)
        grid_pc.render();
    }
    // Test grid check_ship_loc_valid
    unitTest('check ship put at [1,1], 1', () => { return grid_pc.check_ship_loc_valid(0, new Point(1, 1), 0) }, 0)
    unitTest('check ship put at [6,1], 0', () => { return grid_pc.check_ship_loc_valid(0, new Point(6, 1), 0) }, 0)
    unitTest('check ship put at [6,1], 1', () => { return grid_pc.check_ship_loc_valid(0, new Point(6, 1), 1) }, 1)
    unitTest('check ship put at [8,8], 1', () => { return grid_pc.check_ship_loc_valid(0, new Point(8, 8), 1) }, 1)
    unitTest('check ship put at [8,8], 0', () => { return grid_pc.check_ship_loc_valid(0, new Point(8, 8), 0) }, 1)
    unitTest('check ship put at [4,5], 1', () => { return grid_pc.check_ship_loc_valid(0, new Point(4, 5), 0) }, 0)

    // grid_pc.place_ships_Auto();
    // grid_pc.render();
    let agame = new game();
    agame.init();
    agame.set_ships();
    agame.render();
    agame.step();

}



// main program:
run();