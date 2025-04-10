const BOT_TOKEN = '8022651374:AAHlMASBXO5kzMdAJZhvzp_EceK13XkOB5g';
const SOURCE_CHANNEL_ID = -1002458733993; // your channel ID (must start with -100 for private/public)

let seenMessageIds = new Set();
let allMessageIds = [];

async function forwardMessage(chatId, messageId) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/forwardMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      from_chat_id: SOURCE_CHANNEL_ID,
      message_id: messageId,
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Only POST');

  const update = req.body;
  const msg = update.message;

  if (msg) {
    const chatId = msg.chat.id;

    // Save new channel post message ID
    if (msg.chat.id === SOURCE_CHANNEL_ID && msg.message_id) {
      if (!allMessageIds.includes(msg.message_id)) {
        allMessageIds.push(msg.message_id);
      }
      return res.status(200).send('Saved channel message');
    }

    // Handle command
    if (msg.text === '/start') {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: 'Send /random to get 10 posts.' }),
      });
    }

    if (msg.text === '/random') {
      const unseen = allMessageIds.filter(id => !seenMessageIds.has(id));
      const pick = unseen.sort(() => 0.5 - Math.random()).slice(0, 10);

      for (const id of pick) {
        await forwardMessage(chatId, id);
        seenMessageIds.add(id);
      }

      if (pick.length === 0) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: 'No unseen posts left. Add more or reset.' }),
        });
      }
    }
  }

  res.status(200).send('OK');
}
