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

    const store = JSON.parse(data)

    // Обработчик для всех входящих сообщений
    bot.on('message', (msg) => {
        const chatId = msg.chat.id;
        let top = 'ТОП ИГРОКОВ:\n';
        const foundGamer = store.find(gamer => gamer.id === msg.from.id);
        const krupie = store.find(gamer => gamer.id === 1); // Объект Крупье
        const casino = store.find(gamer => gamer.id === 2); // Объект казино

        store.sort(function(a, b) {
            return b.money - a.money;
        });

        for (let i = 0; i < store.length; i++){

            if (store[i].id !== 1 && store[i].id !== 2){
                console.log(store[i].id)
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

                    } else if (rate < 0) {

                        bot.sendMessage(chatId, `
                        Хуй тебе. Меня теперь не наебать.
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
                    const Person = store.find(gamer => gamer.username === txt[1].slice(1));
                    const sum = parseInt(txt[2])

                    console.log('Перевод от ' + msg.from.username + ' к ' + Person.username +' сумма: ' + sum)

                    if (foundGamer.money > sum) {

                        foundGamer.money = foundGamer.money - sum
                        Person.money = Person.money + sum
                        bot.sendMessage(chatId, 'Перевод от ' + msg.from.username + ' к @' + Person.username +' сумма: ' + sum)
                        save(store)

                    } else {

                        bot.sendMessage(chatId, 'Недостаточно средств')

                    }

                }

                if (text === 'стата') {

                    const wins = foundGamer.wins
                    const looses = foundGamer.looses
                    const money = foundGamer.money
                    const winrate = Math.round((wins/looses)*100)

                    bot.sendMessage(chatId, `
                    Твоя стата:\nПобед - ${wins}, всего сыграл - ${wins+looses} раз. Винрейт - ${winrate}%. Денег у тебя - ${money}р.
                    `, { reply_to_message_id: msg.message_id })

                }

                if (text === 'топ') {

                    bot.sendMessage(chatId, top + `\n Денег в казино - ${casino.money}р.\n Денег на джекпот - ${krupie.money}р.`)

                }

            } catch (e) {}

            console.log('Найден');

            if (foundGamer.money > 0){

                if (msg.forward_date){

                    bot.sendMessage(chatId,'Ты пытался меня наебать?', { reply_to_message_id: msg.message_id })

                } else {

                    if (wins.includes(msg.dice.value)){

                            setTimeout(() => {
                                console.log('ПОБЕДА')
                                casino.money = casino.money - (foundGamer.rate * 10)
                                foundGamer.money = (foundGamer.money - foundGamer.rate) + foundGamer.rate * 10
                                bot.sendMessage(chatId, '💰')
                                bot.sendMessage(chatId, `
                                ХАРОШ! Ты выиграл ${foundGamer.rate * 10}. Теперь у тебя ${foundGamer.money} рублей.
                                `, { reply_to_message_id: msg.message_id })
                                foundGamer.wins++
                                foundGamer.games++
                            }, 2000);

                    } else if (msg.dice.value === jackpot){

                        const sum = krupie.money
                        foundGamer.money  = foundGamer.money + krupie.money
                        krupie.money = 0
                        setTimeout(() => {
                            console.log('ДЖЕКПОТ')
                            bot.sendMessage(chatId, '🤑')
                            bot.sendMessage(chatId, `
                            ЕБАТЬ ТЫ ВЫБИЛ ДЖЕКПОТ! Лови ${sum}. Теперь у тебя ${foundGamer.money} рублей.
                            `, { reply_to_message_id: msg.message_id })
                            foundGamer.wins++
                            foundGamer.games++
                        }, 2000);

                    } else {

                        foundGamer.money = foundGamer.money - foundGamer.rate
                        krupie.money += foundGamer.rate / 2
                        casino.money += foundGamer.rate / 2
                        foundGamer.looses++
                        foundGamer.games++

                    }

                    if (foundGamer.looses % 10 === 0) {

                        bot.sendMessage(chatId, `
                        Братан, у тебя ${foundGamer.looses} проёбов, а побед - ${foundGamer.wins}. Сейчас у тебя ${foundGamer.money} рублей. Джекпот сейчас составляет - ${krupie.money} рублей.
                        `, { reply_to_message_id: msg.message_id })

                    }

                }

            } else {

                bot.sendMessage(chatId, `
                Брат, у тебя закончились бабки. Вали из казино.
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
