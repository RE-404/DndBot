const TelegramBot = require('node-telegram-bot-api');
const token = '1758325475:AAFjNV6r6zRkfCTC1QmoXKeXc28uqxyWqmI';
const rnd = require('random');
const request = require('request');
const Database = require('better-sqlite3');
const express = require('express');
const exp = express();
const ejs = require('ejs');
const db = new Database('./DB/Schede.db', { verbose: console.log });
const port = process.env.PORT || 3000;
const bot = new TelegramBot(token, {
    polling: true
});
exp.set("view engine", "ejs");
exp.use(express.urlencoded({
    extended: true
}));

//#region roll
bot.onText(/\/roll/, (msg, match) => {
    let text = match.input.split("d")[0];
    let text1 = match.input.split("d")[1];
    let quant = text.split(" ")[1];
    let type = text1;
    let sum = 0;
    if (type == '4') {
        for (i = 0; i < quant; i++) {
            let num = rnd.int(1, 4);
            sum = sum + num;
        }
    } else if (type == '6') {
        for (i = 0; i < quant; i++) {
            let num = rnd.int(1, 6);
            sum = sum + num;
        }
    } else if (type == '8') {
        for (i = 0; i < quant; i++) {
            let num = rnd.int(1, 8);
            sum = sum + num;
        }
    } else if (type == '10') {
        for (i = 0; i < quant; i++) {
            let num = rnd.int(1, 10);
            sum = sum + num;
        }
    } else if (type == '12') {
        for (i = 0; i < quant; i++) {
            let num = rnd.int(1, 12);
            sum = sum + num;
        }
    } else if (type == '20') {
        for (i = 0; i < quant; i++) {
            let num = rnd.int(1, 20);
            sum = sum + num;
        }
    } else if (type == '100') {
        for (i = 0; i < quant; i++) {
            let num = rnd.int(1, 100);
            sum = sum + num;
        }
    } else {
        bot.sendMessage(msg.chat.id, "Sintassi errata -> [quantità dadi]d[tipi supportati: 4,6,8,10,12,20,100]");
        return;
    }

    if (sum == 20 && type == '20') {
        bot.sendMessage(
            msg.chat.id,
            sum + " CRITICO!",
        );
        return;
    } else if (sum == 1 && type == '20') {
        bot.sendMessage(
            msg.chat.id,
            sum + " ¯\\_(ツ)_/¯",
        );
        return;
    }

    bot.sendMessage(
        msg.chat.id,
        sum,
    );
});
//#endregion

bot.onText(/\/caricascheda/, (msg) => {
    console.log(msg.chat.id);
    bot.sendMessage(msg.chat.id, "Scrivi il nome e la razza del personaggio che vuoi caricare")
    const row = db.prepare('SELECT Nome, Razza, Classe FROM scheda INNER JOIN utente ON utente.idUtente=scheda.fkUtente WHERE utente.chatid = ?').all(msg.chat.id);
    if (row) {
        let ans = "";
        row.forEach(x => ans += (x.Nome + " " + x.Razza + "\n"));
        bot.sendMessage(msg.chat.id, ans);
        let handler = (msg) => {
            let spl = msg.text.split(" ");
            const row1 = db.prepare("SELECT * FROM scheda WHERE Nome=? AND Razza=?").all(spl[0].toString(), spl[1].toString());
            let ans = "";
            let stats = [row1[0].Forza, row1[0].Destrezza, row1[0].Costituzione, row1[0].Intelligenza, row1[0].Saggezza, row1[0].Carisma];
            let mods = [];
            for (i = 0; i < 6; i++) {
                mods.push(DeterminaMod(stats[i]));
                console.log(mods[i]);
            }
            console.log(mods);
            console.log(stats);
            row1.forEach(x => ans += (x.Nome + '\n' + x.Razza + '\n' + x.Classe + "\nLivello: " + x.Livello + "\nHP: " + x.HP + "\nClasse Armatura: " + x.Classe_Armatura + "\nVelocità: " + x.Velocità + "\nForza: " + x.Forza + " (" + mods[0] + ")" + "\nDestrezza: " + x.Destrezza + " (" + mods[1] + ")" + "\nCostituzione: " + x.Costituzione + " (" + mods[2] + ")" + "\nIntelligenza: " + x.Intelligenza + " (" + mods[3] + ")" + "\nSaggezza: " + x.Saggezza + " (" + mods[4] + ")" + "\nCarisma: " + x.Carisma + " (" + mods[5] + ")" + "\nOro: " + x.Oro));
            bot.sendMessage(msg.chat.id, ans);
            bot.removeListener("message", handler);
        };
        bot.on("message", handler);
    } else {
        bot.sendMessage(msg.chat.id, "Non hai schede");
        return;
    }

});

bot.onText(/\/register/, (msg) => {
    bot.sendMessage(msg.chat.id, "Scrivi il tuo username e la password (spazi in user e password non consentiti, usa i _)");
    let handler = (msg) => {
        let spl = msg.text.split(" ");
        let row = db.prepare("SELECT * FROM utente WHERE username = ? OR chatid = ? LIMIT 1").get(spl[0].toString(), msg.chat.id);
        if (row) {
            bot.sendMessage(msg.chat.id, "Username o chatid già esistente (nel caso della seconda significa che eiste già un utente su questo dispositivo)");
        } else {
            var stmt = db.prepare("INSERT INTO utente (username, password, chatid) VALUES (?,?,?)");
            stmt.run(spl[0].toString(), spl[1].toString(), parseInt(msg.chat.id));
            let stringasito = "https://telegramdnd.herokuapp.com";
            let link = stringasito.link("https://telegramdnd.herokuapp.com");
            console.log(link + " " + stringasito);
            bot.sendMessage(msg.chat.id, "Adesso puoi creare le tue schede personaggio da " + link, { parse_mode: 'HTML' });
        }
        bot.removeListener("message", handler);
    };
    bot.on("message", handler);
});

//#region magic related stuff
bot.onText(/\/listamagie/, (msg) => {
    request('https://www.dnd5eapi.co/api/spells', function(error, response, body) {
        console.error('error:', error);
        console.log('statusCode:', response && response.statusCode);
        let json = JSON.parse(body);
        let lista = json.results;
        var i, j, chunk = 40;
        for (i = 0, j = lista.length; i < j; i += chunk) {
            setTimeout(Lista, 200 * i / 20, lista, i, chunk, msg.chat.id);
        }
    });
});

bot.onText(/\/wikimagie/, (msg, match) => {
    let text = match.input.slice(11, msg.text.length).toLowerCase();
    console.log(text);
    let src = text.split(' ').join('-');
    console.log(src);
    request('https://www.dnd5eapi.co/api/spells/' + src, function(error, response, body) {
        console.error('error:', error);
        console.log('statusCode:', response && response.statusCode);
        let json = JSON.parse(body);
        if (json.material && json.higher_level) {
            let stringa = json.name + "\n\nSchool and level: " + json.school.name + " " + json.level + "\n\nCasting time: " + json.casting_time + "\n\nRange: " + json.range + "\n\nComponents and materials: " + json.components + " " + json.material + "\n\nDuration: " + json.duration + "\n\n" + json.desc + "\n\nDamage at higher slot level: " + json.higher_level;
            bot.sendMessage(msg.chat.id, stringa);
        }
        if (!json.material && json.higher_level) {
            let stringa = json.name + "\n\nSchool and level: " + json.school.name + " " + json.level + "\n\nCasting time: " + json.casting_time + "\n\nRange: " + json.range + "\n\nComponents: " + json.components + "\n\nDuration: " + json.duration + "\n\n" + json.desc + "\n\nDamage at higher slot level: " + json.higher_level;
            bot.sendMessage(msg.chat.id, stringa);
        }
        if (!json.material && !json.higher_level) {
            let stringa = json.name + "\n\nSchool and level: " + json.school.name + " " + json.level + "\n\nCasting time: " + json.casting_time + "\n\nRange: " + json.range + "\n\nComponents: " + json.components + "\n\nDuration: " + json.duration + "\n\n" + json.desc;
            bot.sendMessage(msg.chat.id, stringa);
        }
        if (json.material && !json.higher_level) {
            let stringa = json.name + "\n\nSchool and level: " + json.school.name + " " + json.level + "\n\nCasting time: " + json.casting_time + "\n\nRange: " + json.range + "\n\nComponents: " + json.components + "\n\nDuration: " + json.duration + "\n\n" + json.desc;
            bot.sendMessage(msg.chat.id, stringa);
        }



    });
});
//#endregion

//#region monsters related stuff
bot.onText(/\/listamostri/, (msg) => {
    request('https://www.dnd5eapi.co/api/monsters', function(error, response, body) {
        console.error('error:', error);
        console.log('statusCode:', response && response.statusCode);
        let json = JSON.parse(body);
        let lista = json.results;
        var i, j, chunk = 40;
        for (i = 0, j = lista.length; i < j; i += chunk) {
            setTimeout(Lista, 200 * i / 20, lista, i, chunk, msg.chat.id);
        }
    });
});

bot.onText(/\/wikimostri/, (msg, match) => {
    let text = match.input.slice(12, msg.text.length).toLowerCase();
    console.log(text);
    let src = text.replace(/ /g, "-");
    console.log(src);
    request('https://www.dnd5eapi.co/api/monsters/' + src, function(error, response, body) {
        console.error('error:', error);
        console.log('statusCode:', response && response.statusCode);
        let json = JSON.parse(body);
        let str;
        if (json.subtype) {
            str = json.subtype;
        } else
            str = "";

        let stringa = json.name + "\n" + json.size + " " + json.type + " " + str + "\nArmor Class: " + json.armor_class + "\nHP: " + json.hit_points + "\nStrength: " + json.strength + ", Dexterity: " + json.dexterity + ", Constitution: " + json.intelligence + ", Wisdom: " + json.wisdom + ", Charisma: " + json.charisma + "\nLanguages: " + json.languages + "\nChallenge rating: " + json.challenge_rating + "\nDamage immunities: " + json.damage_immunities + "\nDamage vulnerabilities: " + json.damage_vulnerabilities + "\nDamage Resistances: " + json.damage_resistances;
        bot.sendMessage(msg.chat.id, stringa);
    });
});
//#endregion

//#region funzioni
function CreaCA(dex) {
    let ca = parseInt(10 + dex);
    return ca;
}

function DeterminaMod(stat) {
    if (stat == 1) {
        var mod = -5;
    } else if (stat >= 2 & stat <= 3) {
        var mod = -4;
    } else if (stat >= 4 & stat <= 5) {
        var mod = -3;
    } else if (stat >= 6 & stat <= 7) {
        var mod = -2;
    } else if (stat >= 8 & stat <= 9) {
        var mod = -1;
    } else if (stat >= 10 & stat <= 11) {
        var mod = 0;
    } else if (stat >= 12 & stat <= 13) {
        var mod = 1;
    } else if (stat >= 14 & stat <= 15) {
        var mod = 2;
    } else if (stat >= 16 & stat <= 17) {
        var mod = 3;
    } else if (stat >= 18 & stat <= 19) {
        var mod = 4;
    } else if (stat == 20) {
        var mod = 5;
    }
    return mod;
}

function CreaHP(classe, cos) {
    let hp;
    if (classe == "Barbaro") {
        hp = parseInt((12 + cos));
    } else if (classe == "Guerriero" || classe == "Paladino" || classe == "Ranger") {
        hp = parseInt((10 + cos));
    } else if (classe == "Warlock" || classe == "Monaco" || classe == "Artefice" || classe == "Bardo" || classe == "Chierico" || classe == "Druido" || classe == "Ladro") {
        hp = parseInt((8 + cos));
    } else hp = parseInt((6 + cos));
    return hp;
}

function CreaOro(classe) {
    let oro = 0;
    if (classe == "Barbaro" || classe == "Druido") {
        for (i = 0; i < 2; i++) {
            oro += (rnd.int(1, 4)) * 10;
        }
    } else if (classe == "Stregone") {
        for (i = 0; i < 3; i++) {
            oro += (rnd.int(1, 4)) * 10;
        }
    } else if (classe == "Monaco") {
        for (i = 0; i < 5; i++) {
            oro += rnd.int(1, 4);
        }
    } else if (classe == "Ladro" || classe == "Mago" || classe == "Warlock") {
        for (i = 0; i < 4; i++) {
            oro += (rnd.int(1, 4)) * 10;
        }
    } else if (classe == "Bardo" || classe == "Chierico" || classe == "Guerriero" || classe == "Artefice" || classe == "Ranger" || classe == "Paladino") {
        for (i = 0; i < 5; i++) {
            oro += (rnd.int(1, 4)) * 10;
        }
    }
    return oro;
}

function Lista(lista, i, chunk, id) {
    temparray = lista.slice(i, i + chunk);
    bot.sendMessage(id, temparray.map(x => x.name).join('\n'));
}
//#endregion

exp.get("/creascheda", function(req, res) {
    console.log(id);
    res.render("creascheda");
});

exp.get("/", function(req, res) {
    res.render("login");
});
exp.post("/", function(req, res) {
    let login = db.prepare("SELECT * FROM utente WHERE username = ? AND password = ?").get(req.body.user, req.body.password);
    if (login) {
        global.id = login.idUtente;
        res.redirect("/creascheda");
    } else {
        res.send("Password o user non corretti <a href = '/'> Torna al login</a>");
    }
});

exp.post("/insertscheda", function(req, res) {
    if (req.body) {
        let modde, modco;
        modde = DeterminaMod(parseInt(req.body.dex));
        modco = DeterminaMod(parseInt(req.body.con));
        let CA = CreaCA(parseInt(modde));
        let HP = CreaHP(req.body.classe, parseInt(modco));
        let Gold = CreaOro(req.body.classe);
        let scqr = db.prepare("INSERT INTO scheda (Nome, Razza, Classe, Livello, HP, Classe_Armatura, Velocità, Forza, Destrezza, Costituzione, Intelligenza, Saggezza, Carisma, Oro, fkUtente) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        scqr.run(req.body.nome, req.body.razza, req.body.classe, 1, HP, CA, req.body.spd, req.body.str, req.body.dex, req.body.con, req.body.int, req.body.wis, req.body.cha, Gold, id);
        res.send("Scheda creata con successo <a href = '/creascheda'> Torna alla creazione scheda</a>")
    }


    res.redirect("/creascheda");
});

exp.listen(port, () => console.log('In ascolto sulla porta ' + port));