const TelegramBot = require('node-telegram-bot-api');
const token = '6063150195:AAHCUAQ7Ii_GwMQBTqpUtbTD2k15ev8-uZw'
const bot = new TelegramBot(token, {polling: true});
const fs = require('fs')
const save = require('./src/save')

const wins = [1, 22, 43]
const jackpot = 64

class Gamer {
    constructor(
        id = 0,
        username = '',
        money = 0,
        games = 0,
        wins = 0,
        looses = 0,
        rate = 100,
    )
    {
        this.id = id
        this.username = username
        this.money = money
        this.games = games
        this.wins = wins
        this.looses = looses
        this.rate = rate
    }
}

try {

    let data = fs.readFileSync('gamers.json','utf8');

    let store = JSON.parse(data)

    // Обработчик для всех входящих сообщений
    bot.on('message', (msg) => {
        const chatId = msg.chat.id;
        const room = -1001985812353;
        let top = '<b>ТОП ИГРОКОВ:</b>\n';
        const foundGamer = store.find(gamer => gamer.id === msg.from.id);
        const krupie = store.find(gamer => gamer.id === 1); // Объект Крупье
        const casino = store.find(gamer => gamer.id === 2); // Объект казино
        const secret = Math.round(Math.random()*64)

        store.sort(function(a, b) {
            return b.money - a.money;
        });

        /*if (chatId !== -1001985812353){
            bot.sendMessage(room, `@${msg.from.username} мутит что-то в ЛС с ботом. Наебка, получается.`)
        }*/

        for (let i = 0; i < store.length; i++){

            if (store[i].id !== 1 && store[i].id !== 2){
                top += `${i+1}. На счету у ${store[i].username} ${store[i].money} рублей. Побед - ${store[i].wins}\n`
            }

        }

        if (foundGamer) {

            //Команды
            try {
                const text = msg.text.toLowerCase();

                if (text.includes('ставка')){
                    const rate = msg.text.split(' ')[1]

                    if (rate > foundGamer.money){

                        bot.sendMessage(chatId, `
                        У тебя нет таких бабок. У тебя всего ${foundGamer.money} на счету
                        `, { reply_to_message_id: msg.message_id })

                    } else if (rate < 0 || rate < 99) {

                        bot.sendMessage(chatId, `
                        Минимальная ставка 100 рублей, если что...
                        `, { reply_to_message_id: msg.message_id })

                    } else {

                        bot.sendMessage(chatId, `
                        Окей. Теперь каждый прокрут ты ставишь ${rate} рублей.
                        `, { reply_to_message_id: msg.message_id })
                        foundGamer.rate = parseInt(rate)

                    }

                }

                if (text.includes('перевод')) {

                    const txt = text.split(' ')
                    const Person = store.find(gamer => gamer.username.toLowerCase() === txt[1].slice(1));
                    const sum = parseInt(txt[2])

                    console.log('Перевод от ' + msg.from.username + ' к ' + Person.username +' сумма: ' + sum)

                    if (foundGamer.money > sum && sum > 0) {

                        foundGamer.money = foundGamer.money - sum
                        Person.money = Person.money + sum
                        bot.sendMessage(chatId, 'Перевод от ' + msg.from.username + ' к @' + Person.username +' сумма: ' + sum)
                        save(store)

                    } else {

                        bot.sendMessage(chatId, 'Недостаточно средств или неверное значение')

                    }

                }

                if (text === 'стата') {

                    const wins = foundGamer.wins
                    const looses = foundGamer.looses
                    const money = foundGamer.money
                    const winrate = Math.round((wins/looses)*100)

                    bot.sendMessage(chatId, `
                    Твоя стата:\nПобед - ${wins}, всего сыграл - ${wins+looses} раз. Винрейт - ${winrate}%. Денег у тебя - ${money}р. Твоя ставка - ${foundGamer.rate} р.
                    `, { reply_to_message_id: msg.message_id })

                }

                if (text === 'топ') {

                    bot.sendMessage(chatId, top + `\n<b>Всего игр в этом вайпе</b>: ${casino.games}\n<b>Денег в казино</b>: ${casino.money}р.\n<b>Денег на джекпот</b>: ${krupie.money}р.`,{parse_mode: "HTML"})

                }

                if (text === 'вайп' && msg.from.username === 'b2b_daddy'){

                    store = store.map((function(obj) {
                        const newObj = { ...obj };
                        if (newObj.id !== 1 && newObj.id !== 2){
                            newObj.money = 10000;
                            newObj.games = 0;
                            newObj.wins = 0;
                            newObj.looses = 0;
                            newObj.rate = 100;
                        } else {
                            newObj.money = 0;
                            newObj.games = 0;
                            newObj.wins = 0;
                            newObj.looses = 0;
                            newObj.rate = 1;
                        }
                        return newObj;
                    }))

                    save(store)

                    bot.sendMessage(chatId, 'Произошёл ВАЙП.\nВсем начисленно по 10к. Статистика сброшена.')

                }

            } catch (e) {}

            console.log('Найден');

            if (foundGamer.money > 0 && msg.dice.emoji === '🎰'){
                foundGamer.games++
                casino.games++

                if (msg.forward_date){

                    bot.sendMessage(chatId,'Ты пытался меня наебать?', { reply_to_message_id: msg.message_id })

                } else {

                    if (msg.dice.value === secret){

                        setTimeout(() => {

                            bot.sendMessage(chatId, '🔑')
                            bot.sendMessage(chatId, `Оп.  @${msg.from.username} выбил бонус. Получи ${secret}00 рублей`)
                            foundGamer.money = foundGamer.money + (secret*100)

                        }, 2000);

                    }

                    if (wins.includes(msg.dice.value)){

                        console.log('ПОБЕДА')
                        casino.money = casino.money - (foundGamer.rate * 10)
                        foundGamer.money = (foundGamer.money - foundGamer.rate) + foundGamer.rate * 10
                        setTimeout(() => {
                            bot.sendMessage(chatId, '💰')
                            bot.sendMessage(chatId, `
                            ХАРОШ! Ты выиграл ${foundGamer.rate * 10}. Теперь у тебя ${foundGamer.money} рублей.
                            `, { reply_to_message_id: msg.message_id })
                        }, 2000);
                        foundGamer.wins++

                    } else if (msg.dice.value === jackpot){

                        let sum = krupie.money

                        if (sum < 8000) {

                            casino.money = casino.money - (foundGamer.rate * 10)
                            foundGamer.money = (foundGamer.money - foundGamer.rate) + foundGamer.rate * 10
                            setTimeout(() => {
                                bot.sendMessage(chatId, `
                                Джекпот пока что меньше 8к, поэтому получи стандартный выигрыш - ${foundGamer.rate * 10}. Теперь у тебя ${foundGamer.money} рублей.`)
                            }, 2000);

                        } else {

                            foundGamer.money  = foundGamer.money + krupie.money
                            krupie.money = 0
                            setTimeout(() => {
                                console.log('ДЖЕКПОТ')
                                bot.sendMessage(chatId, '🤑')
                                bot.sendMessage(chatId, `
                                ЕБАТЬ ТЫ ВЫБИЛ ДЖЕКПОТ! Лови ${sum}. Теперь у тебя ${foundGamer.money} рублей.
                                `, { reply_to_message_id: msg.message_id })
                            }, 2000);

                        }

                        foundGamer.wins++

                    } else {

                        foundGamer.money = foundGamer.money - foundGamer.rate
                        krupie.money += foundGamer.rate / 2
                        casino.money += foundGamer.rate / 2
                        foundGamer.looses++

                    }

                    if (foundGamer.looses % 10 === 0) {

                        setTimeout(() => {

                            bot.sendMessage(chatId, `
                            Братан, у тебя ${foundGamer.looses} проёбов, а побед - ${foundGamer.wins}. Сейчас у тебя ${foundGamer.money} рублей. Джекпот сейчас составляет - ${krupie.money} рублей.
                            `, { reply_to_message_id: msg.message_id })

                        }, 2000);

                    }

                }

            } else {

                bot.sendMessage(chatId, `
                Брат, у тебя закончились бабки, либо ты нарушил правила. Вали из казино.
                `, { reply_to_message_id: msg.message_id })

            }

        } else {

            console.log("Игрок не найден");
            bot.sendMessage(chatId, ` 
            Привет, @${msg.from.username}! Начинай КРУТИТЬ ЕБАНЫЕ АВТОМАТЫ. Для начала закинул тебе 10к. Каждый прокрут стоит сотку. Выбиваешь 777 - джекпот.
            `, { reply_to_message_id: msg.message_id })

            const newGamer = new Gamer(
                msg.from.id,
                msg.from.username,
                10000,
                0,
                0,
                100
            )

            store.push(newGamer)

        }

        console.log(store)
        console.log(msg.from.username)

        save(store)

    });

} catch (e) {

    console.log(e)

}
