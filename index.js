const TelegramBot = require("node-telegram-bot-api");

// 🔐 Токен бота (из секретов Replit)
const TOKEN = process.env.TOKEN;
const GROUP_ID = -1002306958662; // Укажите ID вашей группы

// 📊 Хранение рейтинга
const users = {};
const userNames = {}; // Храним имена пользователей

// 📌 Создаем бота
const bot = new TelegramBot(TOKEN, { polling: true });

console.log("🤖 Бот запущен!");

// 📌 Reply-клавиатура в общем чате
const chatKeyboard = {
  reply_markup: {
    keyboard: [["Рейтинг"]],
    resize_keyboard: true,
    one_time_keyboard: false
  }
};

// 📌 Стартовое сообщение (НЕ удаляем, чтобы кнопка осталась)
bot.sendMessage(
  GROUP_ID,
  "Чтобы узнать свой рейтинг, нажмите на кнопку ниже. Если бот не отвечает, откройте диалог с ним и нажмите 'Старт'.",
  chatKeyboard
)
  .then(() => console.log("📌 Кнопки установлены!"))
  .catch(console.error);

// 🎯 Обработка сообщений
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;
  const messageId = msg.message_id;

  // Сохраняем имя пользователя
  const name = msg.from.last_name ? `${msg.from.first_name} ${msg.from.last_name}` : msg.from.first_name;
  userNames[userId] = name;

  // 🔍 Фильтр логов
  if (chatId === GROUP_ID && text && !text.startsWith("/")) {
    console.log(🔍 [ГРУППА] ${name}: ${text});
  }

  // ✅ Увеличение рейтинга
  if (chatId === GROUP_ID && text && !text.startsWith("/") && text !== "Рейтинг") {
    users[userId] = (users[userId] || 0) + (msg.reply_to_message ? 2 : 1);
  }

  // 📊 Функция для отправки рейтинга
  async function sendRating(userId, chatId) {
    const topUsers = Object.entries(users)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, score], index) => {
        const displayName = userNames[id] || Пользователь ${id};
        return ${index + 1}. *${displayName}* — ${score} очков;
      })
      .join("\n");

    const personalScore = users[userId] || 0;
    const ratingMessage = 📊 *Топ-10 активных участников:*\n\n${topUsers}\n\n👤 *Ваш рейтинг:* ${personalScore} очков;

    try {
      await bot.sendMessage(userId, ratingMessage, { parse_mode: "Markdown" });
    } catch (err) {
      // ❗ Если бот не может отправить ЛС – добавляем кнопку
      const botUsername = (await bot.getMe()).username;
      const msgWithButton = await bot.sendMessage(
        chatId,
        "Для просмотра рейтинга необходим диалог с ботом. Воспользуйтесь предоставленной кнопкой и нажмите на 'start'. Далее используйте меню.",
        {
          reply_to_message_id: messageId,
          reply_markup: {
            inline_keyboard: [[{ text: "✉️ Написать боту", url: https://t.me/${botUsername}, callback_data: "delete" }]]
          }
        }
      );

      // Запоминаем ID этого сообщения, чтобы удалить его после 30 секунд
      setTimeout(() => bot.deleteMessage(chatId, msgWithButton.message_id), 30000);
    }
  }

  // 📊 Обработка кнопки "Рейтинг" (в группе)
  if (chatId === GROUP_ID && text === "Рейтинг") {
    await sendRating(userId, chatId);
    await bot.deleteMessage(chatId, messageId);
  }

  // 📊 Обработка команды /rating (в личке)
  if (chatId === userId && text === "/rating") {
    await sendRating(userId, chatId);
  }
});

// 🗑 Удаление сообщения после нажатия кнопки "✉️ Написать боту"
bot.on("callback_query", async (query) => {
  if (query.data === "delete") {
    await bot.deleteMessage(query.message.chat.id, query.message.message_id);
  }
});
