import TelegramBot from "node-telegram-bot-api";

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL; // https://tg-shop-mvp.onrender.com/
const support = process.env.SUPPORT_USERNAME || "Tiriandr"; // поменяешь на свой @username

if (!token) throw new Error("7893355480:AAEot-r_Ge2bc9a1yd-LmaokGi09Ms35FTc");
if (!webAppUrl) throw new Error("https://tg-shop-mvp.onrender.com/");

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  await bot.sendMessage(
    chatId,
    "🛒 Магазин игр (аккаунты с игрой)\n\nНажми кнопку ниже, чтобы открыть витрину:",
    {
      reply_markup: {
        keyboard: [
          [{ text: "🛒 Открыть магазин", web_app: { url: webAppUrl } }],
          [{ text: "🆘 Поддержка" }]
        ],
        resize_keyboard: true
      }
    }
  );
});

bot.on("message", async (msg) => {
  if (msg.text === "🆘 Поддержка") {
    await bot.sendMessage(msg.chat.id, `Напиши в поддержку: @${support}\nУкажи номер заказа.`);
  }
});

console.log("Bot started");
