import { ChatData, Message, EmojiData, WordData, ReplyTimeData, HourlyActivity, DailyEmojiData } from '@/types/chat';

enum DateFormat {
  DMY = 'DMY',
  MDY = 'MDY',
  YMD = 'YMD'
}

interface MessageMatch {
  dateStr: string;
  timeStr: string;
  ampm?: string;
  sender: string;
  message: string;
}

const parseWhatsAppChat = (content: string): ChatData => {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  const messages: Message[] = [];
  let currentMessage: Message | null = null;
  const participants = new Set<string>();
  let dateFormat: DateFormat = DateFormat.DMY;
  let dateFormatDetected = false;

  const patterns = [
    /^\[(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}),\s*(\d{1,2}:\d{1,2}(?::\d{1,2})?)\s*([AaPp][Mm])?\]\s*([^:\n\r]+?):\s*(.+)$/,
    /^(\d{1,2}[.\/\-]\d{1,2}[.\/\-]\d{2,4}),\s*(\d{1,2}:\d{1,2}(?::\d{1,2})?)\s*([AaPp][Mm])?\s*[-–—]\s*([^:\n\r]+?):\s*(.+)$/,
    /^\[(\d{1,2}:\d{1,2}(?::\d{1,2})?)\s*([AaPp][Mm])?,\s*(\d{1,2}[.\/\-]\d{1,2}[.\/\-]\d{2,4})\]\s*([^:\n\r]+?):\s*(.+)$/,
    /^(\d{4}[-]\d{1,2}[-]\d{1,2})\s+(\d{1,2}:\d{1,2}(?::\d{1,2})?)\s*[-–—]\s*([^:\n\r]+?):\s*(.+)$/,
    /^(\d{1,2}\.\d{1,2}\.\d{2,4}),\s*(\d{1,2}:\d{1,2}(?::\d{1,2})?)\s*([AaPp][Mm])?\s*[-–—]\s*([^:\n\r]+?):\s*(.+)$/,
    /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{1,2}(?::\d{1,2})?)\s*([AaPp][Mm])\s*[-–—]\s*([^:\n\r]+?):\s*(.+)$/,
    /^\[(\d{1,2}[-]\d{1,2}[-]\d{2,4})\s+(\d{1,2}:\d{1,2}(?::\d{1,2})?)\s*([AaPp][Mm])?\]\s*([^:\n\r]+?):\s*(.+)$/,
    /^(\d{1,2}[.\/\-]\d{1,2}[.\/\-]\d{2,4})\s+(?:at|à|om|um|في|в|в|на|klo|kl\.)\s+(\d{1,2}:\d{1,2}(?::\d{1,2})?)\s*([AaPp][Mm])?\s*[-–—]\s*([^:\n\r]+?):\s*(.+)$/i,
    /^(\d{1,2}[.\/\-]\d{1,2}[.\/\-]\d{2,4})\s+(\d{1,2}:\d{1,2}(?::\d{1,2})?)\s*([AaPp][Mm])?\s*[-–—]\s*([^:\n\r]+?):\s*(.+)$/,
    /^(\d{8})\s+(\d{4})\s*[-–—]\s*([^:\n\r]+?):\s*(.+)$/,
    /^[\u200E\u200F\u202A-\u202E]*\[(\d{1,2}[\u200E\u200F\u202A-\u202E]*[.\/\-][\u200E\u200F\u202A-\u202E]*\d{1,2}[\u200E\u200F\u202A-\u202E]*[.\/\-][\u200E\u200F\u202A-\u202E]*\d{2,4})[\u200E\u200F\u202A-\u202E]*[,\s]+[\u200E\u200F\u202A-\u202E]*(\d{1,2}[\u200E\u200F\u202A-\u202E]*:[\u200E\u200F\u202A-\u202E]*\d{1,2}(?:[\u200E\u200F\u202A-\u202E]*:[\u200E\u200F\u202A-\u202E]*\d{1,2})?)[\u200E\u200F\u202A-\u202E]*\s*([AaPp][Mm])?[\u200E\u200F\u202A-\u202E]*\][\u200E\u200F\u202A-\u202E]*\s*([^:\n\r]+?):\s*(.+)$/,
    /^(\d{1,2}[-]\d{1,2}[-]\d{2,4}),\s*(\d{1,2}:\d{1,2}(?::\d{1,2})?)\s*([AaPp][Mm])?\s*[-–—]\s*([^:\n\r]+?):\s*(.+)$/,
    /^\[(\d{4}[.\/\-]\d{1,2}[.\/\-]\d{1,2}),\s*(\d{2}:\d{2}(?::\d{2})?)\]\s*([^:\n\r]+?):\s*(.+)$/,
    /^\((\d{1,2}[.\/\-]\d{1,2}[.\/\-]\d{2,4}),\s*(\d{1,2}:\d{1,2}(?::\d{1,2})?)\s*([AaPp][Mm])?\)\s*([^:\n\r]+?):\s*(.+)$/,
    /^(\d{1,2}[.\/\-]\d{1,2}[.\/\-]\d{2,4})\s+(\d{1,2}:\d{1,2}(?::\d{1,2})?)\s*([AaPp][Mm])?\s*[-–—]\s*([^:\n\r]+?):\s*(.+)$/
  ];

  for (const line of lines) {
    let match: RegExpMatchArray | null = null;
    let matchedPatternIndex = -1;

    for (let i = 0; i < patterns.length; i++) {
      match = line.match(patterns[i]);
      if (match) {
        matchedPatternIndex = i;
        break;
      }
    }

    if (match) {
      if (currentMessage) {
        messages.push(currentMessage);
      }

      let dateStr = '';
      let timeStr = '';
      let ampm: string | undefined;
      let sender = '';
      let message = '';

      switch (matchedPatternIndex) {
        case 0:
          [, dateStr, timeStr, ampm, sender, message] = match;
          break;
        case 1:
          [, dateStr, timeStr, ampm, sender, message] = match;
          break;
        case 2:
          [, timeStr, ampm, dateStr, sender, message] = match;
          break;
        case 3:
          [, dateStr, timeStr, sender, message] = match;
          ampm = undefined;
          break;
        case 4:
          [, dateStr, timeStr, ampm, sender, message] = match;
          break;
        case 5:
          [, dateStr, timeStr, ampm, sender, message] = match;
          break;
        case 6:
          [, dateStr, timeStr, ampm, sender, message] = match;
          break;
        case 7:
          [, dateStr, timeStr, ampm, sender, message] = match;
          break;
        case 8:
          [, dateStr, timeStr, ampm, sender, message] = match;
          break;
        case 9:
          [, dateStr, timeStr, ampm, sender, message] = match;
          break;
        case 10:
          [, dateStr, timeStr, sender, message] = match;
          ampm = undefined;
          if (dateStr.length === 8) {
            const day = dateStr.substring(0, 2);
            const month = dateStr.substring(2, 4);
            const year = dateStr.substring(4, 8);
            dateStr = `${day}/${month}/${year}`;
          }
          if (timeStr.length === 4) {
            const hours = timeStr.substring(0, 2);
            const minutes = timeStr.substring(2, 4);
            timeStr = `${hours}:${minutes}`;
          }
          break;
        case 11:
          [, dateStr, timeStr, ampm, sender, message] = match;
          dateStr = dateStr.replace(/[\u200E\u200F\u202A-\u202E]/g, '');
          timeStr = timeStr.replace(/[\u200E\u200F\u202A-\u202E]/g, '');
          break;
        case 12:
          [, dateStr, timeStr, ampm, sender, message] = match;
          break;
        case 13:
          [, dateStr, timeStr, sender, message] = match;
          ampm = undefined;
          break;
        case 14:
          [, dateStr, timeStr, ampm, sender, message] = match;
          break;
        default:
          continue;
      }

      if (
        message.startsWith('‎') ||
        message.startsWith('\u200E') ||
        message.startsWith('\u200F') ||
        message.includes('Messages and calls are end-to-end encrypted') ||
        message.includes('Messages to this chat and calls are now secured') ||
        message.includes('You created group') ||
        message.includes('created group') ||
        message.includes(' changed to ') ||
        message.includes(' changed the subject to ') ||
        message.includes(' added ') ||
        message.includes(' removed ') ||
        message.includes(' left') ||
        message.includes(' joined using this group\'s invite link') ||
        message.includes('security code changed') ||
        message.includes('This message was deleted') ||
        message.includes('You deleted this message') ||
        message.includes('<This message was edited>') ||
        message.includes('missed voice call') ||
        message.includes('missed video call') ||
        message.includes('Calling...') ||
        message.includes('Call ended') ||
        message.includes('No answer') ||
        message.includes('Busy') ||
        message.includes('Group call ended') ||
        message.includes('joined the call') ||
        message.includes('left the call') ||
        message.match(/^[\u200E\u200F\u202A-\u202E\s]*$/) ||
        message.includes('Your security code with') ||
        message.includes('changed their phone number') ||
        message.includes('You\'re now an admin') ||
        message.includes('is now an admin') ||
        message.includes('is no longer an admin') ||
        message.includes('Only admins can send messages to this group') ||
        message.includes('changed this group\'s settings') ||
        message.includes('turned on disappearing messages') ||
        message.includes('turned off disappearing messages') ||
        message.includes('set disappearing messages to') ||
        message.match(/^\s*~\s*.+\s*~\s*$/)
      ) {
        continue;
      }

      if (!dateFormatDetected && ![3, 9, 10, 12].includes(matchedPatternIndex)) {
        const dateParts = dateStr.split(/[.\/\-]/).map(part => parseInt(part.replace(/\D/g, ''), 10)).filter(n => !isNaN(n));
        if (dateParts.length >= 3) {
          const [first, second, third] = dateParts;

          if (matchedPatternIndex === 12) {
            dateFormat = DateFormat.YMD;
          } else if (first > 31 || (first > 12 && first <= 31 && second <= 12)) {
            dateFormat = first > 31 ? DateFormat.YMD : DateFormat.DMY;
          } else if (first <= 12 && second > 12 && second <= 31) {
            dateFormat = DateFormat.MDY;
          } else if (third && third > 31) {
            dateFormat = DateFormat.DMY;
          } else {
            dateFormat = DateFormat.DMY;
          }

          dateFormatDetected = true;
        }
      }

      let day = 0, month = 0, year = 0;

      if ([3, 12].includes(matchedPatternIndex)) {
        const parts = dateStr.split(/[-\/]/).map(Number);
        [year, month, day] = parts;
      } else if (matchedPatternIndex === 9) {
        const parts = dateStr.split(/[.\/\-]/).map(Number);
        [day, month, year] = parts;
      } else {
        const dateParts = dateStr.split(/[.\/\-]/).map(part => parseInt(part.replace(/\D/g, ''), 10)).filter(n => !isNaN(n));
        if (dateParts.length >= 3) {
          switch (dateFormat) {
            case DateFormat.DMY:
              [day, month, year] = dateParts;
              break;
            case DateFormat.MDY:
              [month, day, year] = dateParts;
              break;
            case DateFormat.YMD:
              [year, month, day] = dateParts;
              break;
          }
        } else {
          continue;
        }
      }

      if (year < 100) {
        year = year > 50 ? 1900 + year : 2000 + year;
      }

      const timeParts = timeStr.split(':').map(part => parseInt(part.replace(/\D/g, ''), 10)).filter(n => !isNaN(n));
      if (timeParts.length < 2) {
        continue;
      }

      let hour = timeParts[0];
      const minute = timeParts[1];
      const second = timeParts[2] || 0;

      if (hour > 23 || minute > 59 || second > 59) {
        continue;
      }

      if (ampm) {
        const ampmUpper = ampm.toUpperCase();
        if (ampmUpper === 'PM' || ampmUpper === 'P.M.') {
          if (hour < 12) hour += 12;
        } else if (ampmUpper === 'AM' || ampmUpper === 'A.M.') {
          if (hour === 12) hour = 0;
        }
      }

      const timestamp = new Date(year, month - 1, day, hour, minute, second);

      if (isNaN(timestamp.getTime())) {
        continue;
      }

      const cleanSender = sender
        .trim()
        .replace(/[\u200E\u200F\u202A-\u202E]/g, '')
        .replace(/^\+\d+\s*/, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanSender) {
        continue;
      }
      participants.add(cleanSender);

      currentMessage = {
        timestamp,
        sender: cleanSender,
        message: message.trim()
      };
    } else if (currentMessage && line.trim()) {
      if (!line.match(/^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/)) {
        currentMessage.message += `\n${line.trim()}`;
      }
    }
  }

  if (currentMessage) {
    messages.push(currentMessage);
  }

  messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const messagesWithReplyTimes = messages.map((msg, index) => {
    if (index === 0) return { ...msg, replyTime: 0 };
    const prevMsg = messages[index - 1];
    const timeDiff = msg.timestamp.getTime() - prevMsg.timestamp.getTime();
    const replyTimeMinutes = timeDiff / (1000 * 60);
    return {
      ...msg,
      replyTime: prevMsg.sender !== msg.sender ? Math.max(0, replyTimeMinutes) : 0
    };
  });

  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const emojiMap = new Map<string, { count: number; sender: string }>();
  messages.forEach(msg => {
    const emojis = msg.message.match(emojiRegex) || [];
    emojis.forEach(emoji => {
      const key = `${emoji}-${msg.sender}`;
      emojiMap.set(key, {
        count: (emojiMap.get(key)?.count || 0) + 1,
        sender: msg.sender
      });
    });
  });
  const emojiFrequency: EmojiData[] = Array.from(emojiMap.entries()).map(([key, data]) => ({
    emoji: key.split('-')[0],
    count: data.count,
    sender: data.sender
  })).sort((a, b) => b.count - a.count);

  const stopWords = new Set([
    'the', 'and', 'to', 'of', 'i', 'a', 'you', 'it', 'in', 'is', 'that', 'this', 'for', 'on', 'with', 'be', 'are',
    'was', 'so', 'but', 'have', 'not', 'at', 'what', 'me', 'my', 'do', 'we', 'he', 'she', 'they', 'his', 'her', 'him',
    'them', 'their', 'from', 'as', 'if', 'or', 'by', 'an', 'there', 'has', 'had', 'will', 'would', 'can', 'could',
    'should', 'about', 'get', 'just', 'like', 'more', 'your', 'all', 'how', 'when', 'where', 'who', 'why', 'which',
    'oh', 'yeah', 'ok', 'okay', 'yes', 'no', 'lol', 'haha', 'hehe', 'omg', 'wtf', 'tbh', 'btw', 'imo', 'gonna', 'wanna'
  ]);
  const wordMap = new Map<string, { count: number; sender: string }>();
  messages.forEach(msg => {
    const words = msg.message.toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    words.forEach(word => {
      const key = `${word}-${msg.sender}`;
      wordMap.set(key, {
        count: (wordMap.get(key)?.count || 0) + 1,
        sender: msg.sender
      });
    });
  });
  const wordFrequency: WordData[] = Array.from(wordMap.entries()).map(([key, data]) => ({
    word: key.split('-')[0],
    count: data.count,
    sender: data.sender
  })).sort((a, b) => b.count - a.count);

  const hourlyMap = new Map<number, number>();
  messages.forEach(msg => {
    const hour = msg.timestamp.getHours();
    hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
  });
  const hourlyActivity: HourlyActivity[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: hourlyMap.get(hour) || 0
  }));

  const dailyEmojiMap = new Map<string, number>();
  messages.forEach(msg => {
    const dateKey = msg.timestamp.toISOString().split('T')[0];
    const emojis = msg.message.match(emojiRegex) || [];
    if (emojis.length > 0) {
      dailyEmojiMap.set(dateKey, (dailyEmojiMap.get(dateKey) || 0) + emojis.length);
    }
  });
  const dailyEmojiData: DailyEmojiData[] = Array.from(dailyEmojiMap.entries()).map(([date, count]) => ({
    date,
    count
  })).sort((a, b) => a.date.localeCompare(b.date));

  const validReplyTimes = messagesWithReplyTimes.filter(m => m.replyTime && m.replyTime > 0);
  const avgReplyTime = validReplyTimes.length > 0
    ? validReplyTimes.reduce((sum, rt) => sum + rt.replyTime!, 0) / validReplyTimes.length
    : 0;
  const totalEmojis = emojiFrequency.reduce((sum, e) => sum + e.count, 0);
  const participantArray = Array.from(participants);

  let loveScore = 50;
  if (avgReplyTime < 2) loveScore += 25;
  else if (avgReplyTime < 5) loveScore += 15;
  else if (avgReplyTime < 10) loveScore += 10;
  const emojiRatio = messages.length > 0 ? totalEmojis / messages.length : 0;
  if (emojiRatio > 0.5) loveScore += 20;
  else if (emojiRatio > 0.2) loveScore += 15;
  loveScore = Math.max(0, Math.min(100, Math.round(loveScore)));

  const messageCountByUser: Record<string, number> = {};
  const wordCountByUser: Record<string, number> = {};
  let mediaCount = 0;
  participantArray.forEach(p => {
    messageCountByUser[p] = 0;
    wordCountByUser[p] = 0;
  });
  messages.forEach(msg => {
    messageCountByUser[msg.sender]++;
    const words = msg.message.split(/\s+/).filter(w => w.length > 0);
    wordCountByUser[msg.sender] += words.length;
    if (msg.message.includes('<Media omitted>') || msg.message.includes('image omitted') || msg.message.includes('video omitted')) {
      mediaCount++;
    }
  });

  return {
    messages: messagesWithReplyTimes,
    participants: participantArray,
    totalMessages: messages.length,
    messageCountByUser,
    wordCountByUser,
    mediaCount,
    avgReplyTime: Math.round(avgReplyTime * 10) / 10,
    totalEmojis,
    loveScore,
    replyTimes: messagesWithReplyTimes
      .map((msg, index) => ({
        messageIndex: index + 1,
        replyTime: msg.replyTime || 0,
        sender: msg.sender
      }))
      .filter(rt => rt.replyTime > 0),
    emojiFrequency,
    dailyEmojiData,
    wordFrequency,
    hourlyActivity,
    startDate: messages[0]?.timestamp || new Date(),
    endDate: messages[messages.length - 1]?.timestamp || new Date()
  };
};

export const handleChatParsing = async (file: File): Promise<ChatData> => {
  const content = await file.text();
  return parseWhatsAppChat(content);
};
