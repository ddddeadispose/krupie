import { createRequire } from 'module'
const require = createRequire(import.meta.url);

const TelegramBot = require('node-telegram-bot-api');
const token = '6063150195:AAG6lY_bigGpSiwSiCiy8oKnR4D3aZ7ZdPg'
const bot = new TelegramBot(token, {polling: true});
const fs = require('fs')


const wins = [1, 22, 43]
const jackpot = 64

class Gamer {
    constructor(
        id = 0,
        money = 0,
        wins = 0,
        looses = 0,
        rate = 100,
    )
    {
        this.id = id
        this.money = money
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

        const foundGamer = store.find(gamer => gamer.id === msg.from.id);

        if (foundGamer) {

            //Выбор ставки
            try {

                if (msg.text.includes('Ставка')){
                    const rate = msg.text.split(' ')[1]

                    foundGamer.rate = parseInt(rate)

                    if (rate > foundGamer.money){

                        bot.sendMessage(chatId, `
                    У тебя нет таких бабок. У тебя всего ${foundGamer.money} на счету
                `, { reply_to_message_id: msg.message_id })

                    } else {

                        bot.sendMessage(chatId, `
                    Окей. Теперь каждый прокрут ты ставишь ${rate} рублей.
                `, { reply_to_message_id: msg.message_id })

                    }

                }

                if (msg.text === 'Стата') {

                    const wins = foundGamer.wins
                    const looses = foundGamer.looses
                    const money = foundGamer.money
                    const winrate = Math.round((wins/looses)*100)

                    bot.sendMessage(chatId, `
                    Твоя стата:\nПобед - ${wins}, всего сыграл - ${wins+looses} раз. Винрейт - ${winrate}%. Денег у тебя - ${money}
                `, { reply_to_message_id: msg.message_id })
                }

            } catch (e) {}

            console.log('Найден');

            if (foundGamer.money > 0){

                if (msg.forward_date){

                    bot.sendMessage(chatId,'Ты пытался меня наебать?', { reply_to_message_id: msg.message_id })

                } else {

                    if (wins.includes(msg.dice.value)){

                        console.log('ПОБЕДА')
                        foundGamer.money = (foundGamer.money - foundGamer.rate) + foundGamer.rate*5
                        bot.sendMessage(chatId, '💰')
                        bot.sendMessage(chatId, `
                    ХАРОШ! Теперь у тебя ${foundGamer.money} рублей.
                `, { reply_to_message_id: msg.message_id })
                        foundGamer.wins++

                    } else if (msg.dice.value === jackpot){

                        console.log('ДЖЕКПОТ')
                        foundGamer.money  = (foundGamer.money - foundGamer.rate) + foundGamer.rate * 10
                        bot.sendMessage(chatId, '🤑')
                        bot.sendMessage(chatId, `
                    ЕБАТЬ ТЫ ВЫБИЛ ДЖЕКПОТ! Теперь у тебя ${foundGamer.money} рублей.
                `, { reply_to_message_id: msg.message_id })
                        foundGamer.wins++

                    } else {

                        foundGamer.money = foundGamer.money - foundGamer.rate
                        foundGamer.looses++

                    }

                    if (foundGamer.looses % 10 === 0) {

                        bot.sendMessage(chatId, `
                Братан, у тебя ${foundGamer.looses} проёбов, а побед - ${foundGamer.wins}. Сейчас у тебя ${foundGamer.money} рублей.
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
                10000,
                0,
                0
            )
            store.push(newGamer)

        }

        console.log(store)
        console.log(msg.from.id)

        fs.writeFile('gamers.json', JSON.stringify(store), 'utf8', (err) => {
            if (err) {
                console.error(err);
            }
        });

    });

} catch (e) {

    console.log(e)

}
